#!/usr/bin/env node

/**
 * Script: ensure-audit-partitions.js
 * 
 * Purpose:
 * This script ensures that yearly partitions exist for the auth_audit_log table.
 * It should be run daily via cron to automatically create partitions before they're needed.
 * 
 * What it does:
 * 1. Detects the current year
 * 2. Checks which partitions exist
 * 3. Creates missing partitions for current year and next 1-2 years
 * 
 * Usage:
 *   node scripts/ensure-audit-partitions.js
 * 
 * Cron example (runs daily at 2 AM):
 *   0 2 * * * cd /path/to/project && node scripts/ensure-audit-partitions.js >> logs/partition-maintenance.log 2>&1
 * 
 * Environment variables:
 *   - DB_HOST: PostgreSQL host (default: localhost)
 *   - DB_PORT: PostgreSQL port (default: 5432)
 *   - DB_NAME: Database name (default: authrpd)
 *   - DB_USER: Database user (default: authrpd_user)
 *   - DB_PASSWORD: Database password (required)
 *   - YEARS_AHEAD: Number of years ahead to create partitions (default: 2)
 */

const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config({
  path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'development'}`),
});

// Fallback to .env if specific env file doesn't exist
if (!process.env.DB_HOST) {
  require('dotenv').config();
}

// Configuration
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'authrpd',
  username: process.env.DB_USER || 'authrpd_user',
  password: process.env.DB_PASSWORD || '',
  yearsAhead: parseInt(process.env.YEARS_AHEAD || '2', 10),
};

// Validate configuration
if (!config.password) {
  console.error('ERROR: DB_PASSWORD environment variable is required');
  process.exit(1);
}

/**
 * Logs a message with timestamp
 */
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  console.log(logMessage);
  return logMessage;
}

/**
 * Main function to ensure partitions exist
 */
async function ensurePartitions() {
  let sequelize;

  try {
    // Create Sequelize connection
    sequelize = new Sequelize(config.database, config.username, config.password, {
      host: config.host,
      port: config.port,
      dialect: 'postgres',
      logging: false, // Disable SQL logging for this script
      pool: {
        max: 1,
        min: 0,
        idle: 10000,
      },
    });

    // Test connection
    await sequelize.authenticate();
    log('Connected to PostgreSQL database');

    // Get current year
    const currentYear = new Date().getFullYear();
    log(`Current year: ${currentYear}`);
    log(`Creating partitions for current year + ${config.yearsAhead} years ahead`);

    // Check if the function exists
    const [functionCheck] = await sequelize.query(`
      SELECT EXISTS (
        SELECT 1
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname = 'ensure_audit_partitions'
      );
    `);

    if (!functionCheck[0].exists) {
      log('ERROR: Function ensure_audit_partitions does not exist. Please run migrations first.', 'ERROR');
      process.exit(1);
    }

    // Get existing partitions
    const [existingPartitions] = await sequelize.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename LIKE 'auth_audit_log_%'
      ORDER BY tablename;
    `);

    const existingYears = existingPartitions.map((p) => {
      const match = p.tablename.match(/auth_audit_log_(\d{4})/);
      return match ? parseInt(match[1], 10) : null;
    }).filter((y) => y !== null);

    log(`Existing partitions: ${existingYears.length > 0 ? existingYears.join(', ') : 'none'}`);

    // Call the SQL function to ensure partitions exist
    await sequelize.query(`SELECT ensure_audit_partitions(${config.yearsAhead});`);

    // Verify partitions were created
    const [newPartitions] = await sequelize.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename LIKE 'auth_audit_log_%'
      ORDER BY tablename;
    `);

    const newYears = newPartitions.map((p) => {
      const match = p.tablename.match(/auth_audit_log_(\d{4})/);
      return match ? parseInt(match[1], 10) : null;
    }).filter((y) => y !== null);

    log(`Partitions after creation: ${newYears.join(', ')}`);

    // Get partition sizes for reporting
    const [partitionSizes] = await sequelize.query(`
      SELECT
        tablename,
        pg_size_pretty(pg_total_relation_size('public.' || tablename)) AS size,
        (SELECT n_live_tup FROM pg_stat_user_tables WHERE relname = tablename) AS row_count
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename LIKE 'auth_audit_log_%'
      ORDER BY tablename;
    `);

    if (partitionSizes.length > 0) {
      log('Partition sizes:');
      partitionSizes.forEach((p) => {
        log(`  ${p.tablename}: ${p.size} (${p.row_count || 0} rows)`);
      });
    }

    log('Partition maintenance completed successfully');
    process.exit(0);
  } catch (error) {
    log(`ERROR: ${error.message}`, 'ERROR');
    if (error.stack) {
      log(`Stack trace: ${error.stack}`, 'ERROR');
    }
    process.exit(1);
  } finally {
    // Close database connection
    if (sequelize) {
      await sequelize.close();
      log('Database connection closed');
    }
  }
}

// Run the script
if (require.main === module) {
  ensurePartitions();
}

module.exports = { ensurePartitions, config };

