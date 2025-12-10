/**
 * Partition Cron Scheduler - Automatic Yearly Partition Management
 * 
 * This module sets up cron jobs to automatically create yearly partitions
 * for configured tables. Partitions are created:
 * 1. Immediately on application start (current year + next year)
 * 2. Annually on January 1st at 00:00:00 (server local time)
 * 
 * Cron Expression: "0 0 1 1 *"
 * - 0: minute (0th minute)
 * - 0: hour (0th hour = midnight)
 * - 1: day of month (1st day)
 * - 1: month (January)
 * - *: day of week (any day)
 * 
 * This runs every January 1st at midnight in the server's local timezone.
 * 
 * To add a new table:
 * 1. Ensure the parent table exists with PARTITION BY RANGE (column_name)
 * 2. Add entry to PARTITION_TABLES_CONFIG array below
 * 3. Restart the application
 * 
 * Configuration format:
 * {
 *   tableName: 'table_name',      // Parent table name (snake_case)
 *   columnName: 'partition_year',  // Partition key column name
 *   yearsAhead: 1                  // Optional: years ahead to create (default: 1)
 * }
 */

const cron = require('node-cron');
const {
  ensureYearlyPartitions,
  ensureYearlyPartitionsForTables,
} = require('./partition.helper');

/**
 * Configuration for all tables that need yearly partitioning
 * 
 * Add your tables here. Each entry will be automatically managed by the scheduler.
 */
const PARTITION_TABLES_CONFIG = [
  {
    tableName: 'auth_audit_log',
    columnName: 'partition_year',
    yearsAhead: 1, // Create current year + 1 year ahead
  },
  // {
  //   tableName: 'rbac_audit_log',
  //   columnName: 'partition_year',
  //   yearsAhead: 1,
  // },
  // {
  //   tableName: 'catalog_audit_log',
  //   columnName: 'partition_year',
  //   yearsAhead: 1,
  // },
  // Add more tables as needed:
  // {
  //   tableName: 'your_table_name',
  //   columnName: 'partition_year',
  //   yearsAhead: 1,
  // },
];

/**
 * Ensures partitions for all configured tables immediately
 * 
 * This is called on application start to ensure partitions exist
 * before any data is written. Creates partitions for current year + yearsAhead.
 * 
 * @returns {Promise<Object>} - Results for each table
 */
async function nodeCronsEnsurePartitionsOnStart() {
  console.log('🚀 Ensuring yearly partitions on application start...');
  
  try {
    const results = await ensureYearlyPartitionsForTables(PARTITION_TABLES_CONFIG);
    return results;
  } catch (error) {
    console.error('❌ Error ensuring partitions on start:', error);
    throw error;
  }
}

/**
 * Creates partitions for the new year (runs on January 1st)
 * 
 * This function is called by the cron job annually. It:
 * 1. Creates partition for the current year (new year)
 * 2. Optionally creates partition for next year (if yearsAhead > 0)
 * 
 * @returns {Promise<Object>} - Results for each table
 */
async function nodeCronsCreateNewYearPartitions() {
  const currentYear = new Date().getFullYear();
  console.log(`📅 Creating partitions for new year: ${currentYear}...`);

  const results = {};

  for (const config of PARTITION_TABLES_CONFIG) {
    const { tableName, columnName, yearsAhead = 1 } = config;

    try {
      // Ensure partitions for current year and years ahead
      const success = await ensureYearlyPartitions(tableName, columnName, yearsAhead);
      results[tableName] = { success, year: currentYear };
    } catch (error) {
      console.error(`❌ Error creating partitions for ${tableName}:`, error.message);
      results[tableName] = { success: false, error: error.message, year: currentYear };
    }
  }

  const successCount = Object.values(results).filter((r) => r.success).length;
  console.log(`✅ New year partition creation complete: ${successCount}/${PARTITION_TABLES_CONFIG.length} table(s) successful`);

  return results;
}

/**
 * Starts the yearly partition cron job
 * 
 * Schedules a job to run every January 1st at 00:00:00 (server local time)
 * to create partitions for the new year.
 * 
 * Cron expression: "0 0 1 1 *"
 * - Runs at 00:00:00 on January 1st every year
 * 
 * @returns {cron.ScheduledTask} - The scheduled cron task
 */
function nodeCronsStartYearlyPartitionJob() {
  // Cron expression: "0 0 1 1 *"
  // - 0: minute (0th minute)
  // - 0: hour (0th hour = midnight)
  // - 1: day of month (1st day)
  // - 1: month (January)
  // - *: day of week (any day)
  // This runs every January 1st at midnight in server's local timezone
  const cronExpression = '0 0 1 1 *';

  console.log('⏰ Starting yearly partition cron job...');
  console.log(`   Schedule: Every January 1st at 00:00:00 (cron: ${cronExpression})`);

  const task = cron.schedule(cronExpression, async () => {
    console.log('⏰ Cron job triggered: Creating partitions for new year...');
    try {
      await nodeCronsCreateNewYearPartitions();
    } catch (error) {
      console.error('❌ Error in yearly partition cron job:', error);
    }
  }, {
    scheduled: true,
    timezone: 'UTC', // Change to your server's timezone if needed
  });

  console.log('✅ Yearly partition cron job started');
  return task;
}

/**
 * Stops the yearly partition cron job
 * 
 * Useful for graceful shutdown or testing.
 * 
 * @param {cron.ScheduledTask} task - The cron task to stop
 */
function nodeCronsStopYearlyPartitionJob(task) {
  if (task) {
    task.stop();
    console.log('⏹️  Yearly partition cron job stopped');
  }
}

/**
 * Initializes partition management on application start
 * 
 * This function should be called when the application starts. It:
 * 1. Immediately ensures partitions exist for all configured tables
 * 2. Starts the cron job for automatic yearly partition creation
 * 
 * Usage in server.js:
 *   const { nodeCronsInitializePartitionManagement } = require('./utils/partition.crons');
 *   await nodeCronsInitializePartitionManagement();
 * 
 * @returns {Promise<Object>} - Object containing start results and cron task
 */
async function nodeCronsInitializePartitionManagement() {
  console.log('🔧 Initializing partition management...');

  // Step 1: Ensure partitions exist immediately on start
  const startResults = await nodeCronsEnsurePartitionsOnStart();

  // Step 2: Start the cron job for automatic yearly creation
  const cronTask = nodeCronsStartYearlyPartitionJob();

  console.log('✅ Partition management initialized');

  return {
    startResults,
    cronTask,
  };
}

module.exports = {
  PARTITION_TABLES_CONFIG,
  nodeCronsEnsurePartitionsOnStart,
  nodeCronsCreateNewYearPartitions,
  nodeCronsStartYearlyPartitionJob,
  nodeCronsStopYearlyPartitionJob,
  nodeCronsInitializePartitionManagement,
};

