/**
 * Partition Helper - Yearly Partition Management for PostgreSQL
 * 
 * This module provides utilities for creating and managing yearly partitions
 * for PostgreSQL tables that use RANGE partitioning on an integer year column.
 * 
 * Use Case:
 * - Audit logs (auth_audit_log, rbac_audit_log, etc.)
 * - Any table that needs yearly partitioning for performance and data management
 * 
 * How it works:
 * - Creates partitions like: table_name_2024, table_name_2025, etc.
 * - Each partition covers one year: FROM (year) TO (year + 1)
 * - Partitions are created automatically on app start and via cron job
 * 
 * To add a new table:
 * 1. Ensure the parent table is created with PARTITION BY RANGE (column_name)
 * 2. Add the table config to the config array in partition.crons.js
 * 3. The scheduler will automatically manage partitions for it
 * 
 * Example parent table:
 *   CREATE TABLE auth_audit_log (
 *     id BIGSERIAL,
 *     partition_year INT NOT NULL,
 *     ...
 *   ) PARTITION BY RANGE (partition_year);
 */

const sequelize = require('../config/db');

/**
 * Creates a yearly partition for the current year
 * 
 * @param {string} tableName - Name of the parent partitioned table (snake_case)
 * @param {string} columnName - Name of the partition key column (usually 'partition_year' or 'created_at')
 * @returns {Promise<boolean>} - true if partition was created or already exists, false on error
 * 
 * Example:
 *   await createYearlyPartition('auth_audit_log', 'partition_year');
 *   // Creates: auth_audit_log_2025 (if current year is 2025)
 */
async function createYearlyPartition(tableName, columnName) {
  const currentYear = new Date().getFullYear();
  const partitionName = `${tableName}_${currentYear}`;
  const start = currentYear;
  const end = currentYear + 1;

  // Safety: Validate table name to prevent SQL injection
  // In production, tableName should be a trusted constant from config
  if (!/^[a-z][a-z0-9_]*$/.test(tableName)) {
    console.error(`❌ Invalid table name: ${tableName}. Must be snake_case.`);
    return false;
  }

  // Check if partition already exists to avoid errors
  const checkSql = `
    SELECT EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
      AND c.relname = $1
    ) as exists;
  `;

  try {
    const [results] = await sequelize.query(checkSql, {
      bind: [partitionName],
      type: sequelize.QueryTypes.SELECT,
    });

    if (results.exists) {
      console.log(`ℹ️  Partition already exists: ${partitionName}`);
      return true;
    }

    // Create the partition
    // Note: Table names are validated above, but we still quote them for safety
    const queryInterface = sequelize.getQueryInterface();
    const sql = `
      CREATE TABLE IF NOT EXISTS ${queryInterface.quoteIdentifier(partitionName)}
      PARTITION OF ${queryInterface.quoteIdentifier(tableName)}
      FOR VALUES FROM (${start}) TO (${end});
    `;

    await sequelize.query(sql);
    console.log(`✅ Partition created: ${partitionName} (${start} to ${end})`);
    return true;
  } catch (err) {
    // Handle "already exists" errors gracefully
    if (err.message && err.message.includes('already exists')) {
      console.log(`ℹ️  Partition already exists: ${partitionName}`);
      return true;
    }
    console.error(`❌ Failed to create partition ${partitionName}:`, err.message);
    return false;
  }
}

/**
 * Creates a yearly partition for the next year (current year + 1)
 * 
 * Useful for ensuring partitions exist before data arrives for the new year.
 * 
 * @param {string} tableName - Name of the parent partitioned table
 * @param {string} columnName - Name of the partition key column
 * @returns {Promise<boolean>} - true if partition was created or already exists, false on error
 * 
 * Example:
 *   await createNextYearlyPartition('auth_audit_log', 'partition_year');
 *   // Creates: auth_audit_log_2026 (if current year is 2025)
 */
async function createNextYearlyPartition(tableName, columnName) {
  const nextYear = new Date().getFullYear() + 1;
  const partitionName = `${tableName}_${nextYear}`;
  const start = nextYear;
  const end = nextYear + 1;

  // Safety: Validate table name
  if (!/^[a-z][a-z0-9_]*$/.test(tableName)) {
    console.error(`❌ Invalid table name: ${tableName}. Must be snake_case.`);
    return false;
  }

  // Check if partition already exists
  const checkSql = `
    SELECT EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
      AND c.relname = $1
    ) as exists;
  `;

  try {
    const [results] = await sequelize.query(checkSql, {
      bind: [partitionName],
      type: sequelize.QueryTypes.SELECT,
    });

    if (results.exists) {
      console.log(`ℹ️  Partition already exists: ${partitionName}`);
      return true;
    }

      const queryInterface = sequelize.getQueryInterface();
      const sql = `
        CREATE TABLE IF NOT EXISTS ${queryInterface.quoteIdentifier(partitionName)}
        PARTITION OF ${queryInterface.quoteIdentifier(tableName)}
        FOR VALUES FROM (${start}) TO (${end});
      `;

    await sequelize.query(sql);
    console.log(`✅ Partition created: ${partitionName} (${start} to ${end})`);
    return true;
  } catch (err) {
    if (err.message && err.message.includes('already exists')) {
      console.log(`ℹ️  Partition already exists: ${partitionName}`);
      return true;
    }
    console.error(`❌ Failed to create partition ${partitionName}:`, err.message);
    return false;
  }
}

/**
 * Ensures partitions exist for current year and N years ahead
 * 
 * This is the main function to call on application start and via cron jobs.
 * It creates partitions for the current year and the specified number of years ahead.
 * 
 * @param {string} tableName - Name of the parent partitioned table
 * @param {string} columnName - Name of the partition key column
 * @param {number} yearsAhead - Number of years ahead to create partitions (default: 1)
 * @returns {Promise<boolean>} - true if all partitions were created successfully
 * 
 * Example:
 *   await ensureYearlyPartitions('auth_audit_log', 'partition_year', 2);
 *   // Creates partitions for 2025, 2026, 2027 (if current year is 2025)
 */
async function ensureYearlyPartitions(tableName, columnName, yearsAhead = 1) {
  const currentYear = new Date().getFullYear();
  let allSuccess = true;

  console.log(`📅 Ensuring partitions for ${tableName} (current year + ${yearsAhead} years ahead)...`);

  // Create partition for current year
  const currentSuccess = await createYearlyPartition(tableName, columnName);
  if (!currentSuccess) {
    allSuccess = false;
  }

  // Create partitions for future years
  for (let i = 1; i <= yearsAhead; i++) {
    const targetYear = currentYear + i;
    const partitionName = `${tableName}_${targetYear}`;
    const start = targetYear;
    const end = targetYear + 1;

    // Safety: Validate table name
    if (!/^[a-z][a-z0-9_]*$/.test(tableName)) {
      console.error(`❌ Invalid table name: ${tableName}. Must be snake_case.`);
      allSuccess = false;
      continue;
    }

    // Check if partition already exists
    const checkSql = `
      SELECT EXISTS (
        SELECT 1
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
        AND c.relname = $1
      ) as exists;
    `;

    try {
      const [results] = await sequelize.query(checkSql, {
        bind: [partitionName],
        type: sequelize.QueryTypes.SELECT,
      });

      if (results.exists) {
        console.log(`ℹ️  Partition already exists: ${partitionName}`);
        continue;
      }

      const queryInterface = sequelize.getQueryInterface();
      const sql = `
        CREATE TABLE IF NOT EXISTS ${queryInterface.quoteIdentifier(partitionName)}
        PARTITION OF ${queryInterface.quoteIdentifier(tableName)}
        FOR VALUES FROM (${start}) TO (${end});
      `;

      await sequelize.query(sql);
      console.log(`✅ Partition created: ${partitionName} (${start} to ${end})`);
    } catch (err) {
      if (err.message && err.message.includes('already exists')) {
        console.log(`ℹ️  Partition already exists: ${partitionName}`);
      } else {
        console.error(`❌ Failed to create partition ${partitionName}:`, err.message);
        allSuccess = false;
      }
    }
  }

  if (allSuccess) {
    console.log(`✅ All partitions ensured for ${tableName}`);
  } else {
    console.warn(`⚠️  Some partitions failed to create for ${tableName}`);
  }

  return allSuccess;
}

/**
 * Ensures partitions for multiple tables at once
 * 
 * Useful for batch operations on application start or maintenance tasks.
 * 
 * @param {Array<Object>} configArray - Array of table configurations
 * @param {string} configArray[].tableName - Name of the parent partitioned table
 * @param {string} configArray[].columnName - Name of the partition key column
 * @param {number} [configArray[].yearsAhead] - Years ahead to create (default: 1)
 * @returns {Promise<Object>} - Object with results for each table
 * 
 * Example:
 *   const config = [
 *     { tableName: 'auth_audit_log', columnName: 'partition_year' },
 *     { tableName: 'rbac_audit_log', columnName: 'partition_year', yearsAhead: 2 }
 *   ];
 *   await ensureYearlyPartitionsForTables(config);
 */
async function ensureYearlyPartitionsForTables(configArray) {
  const results = {};

  console.log(`📦 Ensuring partitions for ${configArray.length} table(s)...`);

  for (const config of configArray) {
    const { tableName, columnName, yearsAhead = 1 } = config;

    if (!tableName || !columnName) {
      console.error(`❌ Invalid config: tableName and columnName are required`, config);
      results[tableName || 'unknown'] = { success: false, error: 'Invalid config' };
      continue;
    }

    try {
      const success = await ensureYearlyPartitions(tableName, columnName, yearsAhead);
      results[tableName] = { success };
    } catch (error) {
      console.error(`❌ Error ensuring partitions for ${tableName}:`, error.message);
      results[tableName] = { success: false, error: error.message };
    }
  }

  const successCount = Object.values(results).filter((r) => r.success).length;
  console.log(`✅ Partition check complete: ${successCount}/${configArray.length} table(s) successful`);

  return results;
}

module.exports = {
  createYearlyPartition,
  createNextYearlyPartition,
  ensureYearlyPartitions,
  ensureYearlyPartitionsForTables,
};

