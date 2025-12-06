'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Migration: Partition auth_audit_log table by year
 * 
 * This migration converts the existing auth_audit_log table to a partitioned table
 * using RANGE partitioning by createdAt (yearly partitions).
 * Note: In SQL queries, we use createdAt (snake_case) as that's the actual column name in DB.
 * 
 * Strategy:
 * 1. If table exists, we need to migrate data (for production)
 * 2. Create parent partitioned table
 * 3. Create SQL functions for partition management
 * 4. Create initial partitions (current year + next year)
 * 
 * Note: This migration assumes the table might already exist.
 * For production, you would need to:
 * - Backup existing data
 * - Create partitioned table
 * - Migrate data to appropriate partitions
 * - Drop old table
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const sqlFile = path.join(__dirname, 'sql', 'audit-partitioning.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Ensure we're using the correct database and schema
    // Get current database name to verify we're connected to the right one
    const [dbInfo] = await queryInterface.sequelize.query(`SELECT current_database() as db_name;`);
    console.log(`Connected to database: ${dbInfo[0].db_name}`);
    
    // Check if table exists in the correct schema
    const [results] = await queryInterface.sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'auth_audit_log'
      );
    `);

    const tableExists = results[0].exists;
    let isPartitioned = false;
    let needsDataMigration = false;

    if (tableExists) {
      // Table exists - check if it's already partitioned FIRST
      const [partitionCheck] = await queryInterface.sequelize.query(`
        SELECT EXISTS (
          SELECT 1
          FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'public'
          AND c.relname = 'auth_audit_log'
          AND c.relkind = 'p'  -- 'p' = partitioned table
        );
      `);

      isPartitioned = partitionCheck[0].exists;

      if (isPartitioned) {
        // Table is already partitioned - skip migration, just ensure functions and partitions exist
        console.log('Table is already partitioned, skipping data migration. Ensuring functions and partitions exist...');
      } else {
        // Table exists but is not partitioned - migrate data
        console.log('Migrating existing auth_audit_log table to partitioned structure...');
        
        // Step 1: Check if table has data (explicitly in public schema)
        const [rowCount] = await queryInterface.sequelize.query(`
          SELECT COUNT(*) as count FROM public.auth_audit_log;
        `);
        const hasData = parseInt(rowCount[0].count, 10) > 0;
        
        if (hasData) {
          console.log(`Found ${rowCount[0].count} rows to migrate.`);
        }
        
        // Step 2: Get the actual constraint name (it might be different)
        // Then drop it before renaming to avoid conflicts
        try {
          const [constraints] = await queryInterface.sequelize.query(`
            SELECT constraint_name
            FROM information_schema.table_constraints
            WHERE table_schema = 'public'
            AND table_name = 'auth_audit_log'
            AND constraint_type = 'PRIMARY KEY';
          `);
          
          if (constraints.length > 0) {
            const constraintName = constraints[0].constraint_name;
            await queryInterface.sequelize.query(`
              ALTER TABLE public.auth_audit_log DROP CONSTRAINT ${constraintName};
            `);
            console.log(`Dropped primary key constraint: ${constraintName}`);
          }
        } catch (err) {
          // Ignore if constraint doesn't exist
          console.log('Note: Could not drop constraint (may not exist):', err.message);
        }
        
        // Step 3: Rename existing table to temporary name (explicitly in public schema)
        await queryInterface.sequelize.query(`
          ALTER TABLE public.auth_audit_log RENAME TO auth_audit_log_old;
        `);
        console.log('Renamed existing table to auth_audit_log_old');
        needsDataMigration = true;
      }
    }

    // If we renamed the table, create the partitioned table first
    // (before executing SQL file which uses CREATE TABLE IF NOT EXISTS)
    if (needsDataMigration) {
      console.log('Creating new partitioned table structure...');
      
      // Create the partitioned parent table in the public schema
      // Explicitly specify schema to ensure it's created in the correct database
      // Note: Using "createdAt" with quotes to preserve camelCase in PostgreSQL
      await queryInterface.sequelize.query(`
        CREATE TABLE public.auth_audit_log (
          id BIGSERIAL NOT NULL,
          actor_type VARCHAR(255),
          actor_id BIGINT,
          action VARCHAR(255) NOT NULL,
          target_type VARCHAR(255),
          target_id VARCHAR(255),
          meta JSONB,
          ip VARCHAR(255),
          user_agent TEXT,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT auth_audit_log_pkey PRIMARY KEY (id, "createdAt")
        ) PARTITION BY RANGE ("createdAt");
      `);
      
      // Add comments
      await queryInterface.sequelize.query(`
        COMMENT ON TABLE auth_audit_log IS 'Parent table for yearly partitioned audit logs. All data is stored in year-based partitions.';
        COMMENT ON COLUMN auth_audit_log.id IS 'Unique identifier for audit log entry';
        COMMENT ON COLUMN auth_audit_log.actor_type IS 'Type of actor (MEMBER, CLIENT, SYSTEM)';
        COMMENT ON COLUMN auth_audit_log.actor_id IS 'ID of the actor performing the action';
        COMMENT ON COLUMN auth_audit_log.action IS 'Action performed (LOGIN, LOGOUT, CREATE, UPDATE, DELETE, etc.)';
        COMMENT ON COLUMN auth_audit_log.target_type IS 'Type of target entity (if applicable)';
        COMMENT ON COLUMN auth_audit_log.target_id IS 'ID of target entity (if applicable)';
        COMMENT ON COLUMN auth_audit_log.meta IS 'Additional metadata in JSON format';
        COMMENT ON COLUMN auth_audit_log.ip IS 'IP address of the request';
        COMMENT ON COLUMN auth_audit_log.user_agent IS 'User agent string from the request';
        COMMENT ON COLUMN auth_audit_log."createdAt" IS 'Timestamp when the audit log entry was created (used for partitioning)';
      `);
      
      console.log('Partitioned table structure created');
    }

    // Execute SQL file
    // Use a simpler approach: extract and execute SQL blocks separately
    // This avoids issues with dollar-quoted strings in functions
    
    // 1. Extract and execute CREATE TABLE IF NOT EXISTS (only if table doesn't exist or isn't partitioned)
    if (!tableExists || !isPartitioned) {
      const createTableRegex = /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS[^;]+;/gi;
      let createTableMatch;
      while ((createTableMatch = createTableRegex.exec(sql)) !== null) {
        try {
          await queryInterface.sequelize.query(createTableMatch[0]);
          console.log('Created table (if not exists)');
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log('Table already exists, skipping CREATE TABLE');
          } else {
            throw error;
          }
        }
      }
    }
    
    // 2. Extract and execute CREATE FUNCTION statements (they contain $$)
    const functionRegex = /CREATE\s+(OR\s+REPLACE\s+)?FUNCTION\s+[^$]*\$\$[\s\S]*?\$\$/gi;
    let functionMatch;
    while ((functionMatch = functionRegex.exec(sql)) !== null) {
      const functionSql = functionMatch[0] + ';';
      try {
        await queryInterface.sequelize.query(functionSql);
        console.log('Created/updated function:', functionSql.substring(0, 50).replace(/\n/g, ' '));
      } catch (error) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log('Function already exists, skipping');
        } else {
          throw error;
        }
      }
    }
    
    // 3. Extract COMMENT statements (skip if table already exists and is partitioned)
    if (!isPartitioned) {
      const commentRegex = /COMMENT\s+ON\s+[^;]+;/gi;
      let commentMatch;
      while ((commentMatch = commentRegex.exec(sql)) !== null) {
        try {
          await queryInterface.sequelize.query(commentMatch[0]);
        } catch (error) {
          // Ignore comment errors
          console.log('Note: Comment statement skipped:', error.message);
        }
      }
    }
    
    // 4. Execute SELECT statements (like ensure_audit_partitions) - but skip commented ones
    const selectRegex = /SELECT\s+[^;]+;/gi;
    let selectMatch;
    const lines = sql.split('\n');
    while ((selectMatch = selectRegex.exec(sql)) !== null) {
      const selectSql = selectMatch[0];
      // Check if this SELECT is in a commented line
      const matchIndex = selectMatch.index;
      const lineNumber = sql.substring(0, matchIndex).split('\n').length - 1;
      const line = lines[lineNumber];
      
      // Skip if the line starts with -- (commented)
      if (!line.trim().startsWith('--')) {
        try {
          await queryInterface.sequelize.query(selectSql);
        } catch (error) {
          console.log('Note: SELECT statement result:', error.message);
        }
      }
    }

    // Ensure partitions exist for current year and next year
    await queryInterface.sequelize.query('SELECT ensure_audit_partitions(1);');
    
    // If we migrated from an old table, migrate the data
    const [oldTableExists] = await queryInterface.sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'auth_audit_log_old'
      );
    `);
    
    if (oldTableExists[0].exists) {
      console.log('Migrating data from auth_audit_log_old to partitioned table...');
      
      // Check what columns exist in old table
      const [oldColumns] = await queryInterface.sequelize.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'auth_audit_log_old'
        ORDER BY ordinal_position;
      `);
      
      const columnNames = oldColumns.map(col => col.column_name);
      const hasIp = columnNames.includes('ip');
      const hasUserAgent = columnNames.includes('user_agent');
      
      // Build column list for INSERT
      // Note: Old table uses created_at (snake_case), new table uses "createdAt" (camelCase with quotes)
      let selectColumns = 'actor_type, actor_id, action, target_type, target_id, meta, created_at';
      let insertColumns = 'actor_type, actor_id, action, target_type, target_id, meta, "createdAt"';
      
      if (hasIp) {
        selectColumns += ', ip';
        insertColumns += ', ip';
      } else {
        insertColumns += ', NULL as ip';
      }
      
      if (hasUserAgent) {
        selectColumns += ', user_agent';
        insertColumns += ', user_agent';
      } else {
        insertColumns += ', NULL as user_agent';
      }
      
      // Migrate data year by year to ensure it goes to correct partitions
      // Get min and max years from data
      // Note: Old table uses created_at (snake_case)
      const [yearRange] = await queryInterface.sequelize.query(`
        SELECT 
          EXTRACT(YEAR FROM MIN(created_at))::INT as min_year,
          EXTRACT(YEAR FROM MAX(created_at))::INT as max_year
        FROM public.auth_audit_log_old;
      `);
      
      if (yearRange[0].min_year && yearRange[0].max_year) {
        const minYear = parseInt(yearRange[0].min_year, 10);
        const maxYear = parseInt(yearRange[0].max_year, 10);
        const currentYear = new Date().getFullYear();
        
        // Ensure partitions exist for all years in data
        for (let year = minYear; year <= Math.max(maxYear, currentYear + 1); year++) {
          await queryInterface.sequelize.query(
            `SELECT create_audit_partition_for_year(${year});`
          );
        }
        
        // Migrate data year by year
        for (let year = minYear; year <= maxYear; year++) {
          const startDate = `${year}-01-01 00:00:00+00`;
          const endDate = `${year + 1}-01-01 00:00:00+00`;
          
          const [migrated] = await queryInterface.sequelize.query(`
            INSERT INTO public.auth_audit_log (${insertColumns})
            SELECT ${selectColumns}
            FROM public.auth_audit_log_old
            WHERE created_at >= '${startDate}'::timestamptz
            AND created_at < '${endDate}'::timestamptz;
          `);
          
          console.log(`Migrated data for year ${year}`);
        }
        
        // Verify migration
        const [oldCount] = await queryInterface.sequelize.query(`
          SELECT COUNT(*) as count FROM public.auth_audit_log_old;
        `);
        const [newCount] = await queryInterface.sequelize.query(`
          SELECT COUNT(*) as count FROM public.auth_audit_log;
        `);
        
        console.log(`Migration complete: ${oldCount[0].count} rows in old table, ${newCount[0].count} rows in new table`);
        
        if (parseInt(oldCount[0].count, 10) === parseInt(newCount[0].count, 10)) {
          // Drop old table
          await queryInterface.sequelize.query('DROP TABLE public.auth_audit_log_old;');
          console.log('Dropped old table auth_audit_log_old');
        } else {
          console.warn('WARNING: Row counts do not match! Old table preserved for safety.');
          console.warn('Please verify data manually before dropping auth_audit_log_old');
        }
      } else {
        // No data to migrate, just drop old table
        await queryInterface.sequelize.query('DROP TABLE public.auth_audit_log_old;');
        console.log('No data to migrate, dropped old table');
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Drop all partitions first
    const [partitions] = await queryInterface.sequelize.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename LIKE 'auth_audit_log_%'
      ORDER BY tablename;
    `);

    for (const partition of partitions) {
      await queryInterface.sequelize.query(
        `DROP TABLE IF EXISTS ${partition.tablename} CASCADE;`
      );
    }

    // Drop functions
    await queryInterface.sequelize.query(
      'DROP FUNCTION IF EXISTS ensure_audit_partitions(INT) CASCADE;'
    );
    await queryInterface.sequelize.query(
      'DROP FUNCTION IF EXISTS create_audit_partition_for_year(INT) CASCADE;'
    );

    // Drop parent table
    await queryInterface.dropTable('auth_audit_log');
  },
};


