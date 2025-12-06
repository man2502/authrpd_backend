# Partition Management Integration Example

## Integration in server.js

Add partition management initialization to your `server.js` file:

```javascript
const app = require('./app');
const config = require('./config/env');
const sequelize = require('./config/db');
const redis = require('./config/redis');
const logger = require('./config/logger');
const { ensureMonthlyKeyPair } = require('./modules/security/keys/key.manager');
const { nodeCronsInitializePartitionManagement } = require('./utils/partition.crons');
const path = require('path');

// Store cron task for graceful shutdown
let partitionCronTask = null;

async function startServer() {
  try {
    // ... existing code (DB connection, Redis, etc.) ...

    // Initialize partition management
    // This ensures partitions exist on start and starts the cron job
    const partitionInit = await nodeCronsInitializePartitionManagement();
    partitionCronTask = partitionInit.cronTask;
    logger.info('Partition management initialized', {
      tables: Object.keys(partitionInit.startResults),
    });

    // ... rest of server startup code ...
  } catch (error) {
    logger.logError(error, null, {
      context: 'server_startup',
    });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully', {
    signal: 'SIGTERM',
  });
  try {
    // Stop partition cron job
    if (partitionCronTask) {
      const { nodeCronsStopYearlyPartitionJob } = require('./utils/partition.crons');
      nodeCronsStopYearlyPartitionJob(partitionCronTask);
    }
    
    await sequelize.close();
    redis.disconnect();
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.logError(error, null, { context: 'graceful_shutdown' });
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully', {
    signal: 'SIGINT',
  });
  try {
    // Stop partition cron job
    if (partitionCronTask) {
      const { nodeCronsStopYearlyPartitionJob } = require('./utils/partition.crons');
      nodeCronsStopYearlyPartitionJob(partitionCronTask);
    }
    
    await sequelize.close();
    redis.disconnect();
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.logError(error, null, { context: 'graceful_shutdown' });
    process.exit(1);
  }
});

startServer();
```

## Adding a New Table

To add a new table for yearly partitioning:

1. **Ensure parent table is partitioned:**
   ```sql
   CREATE TABLE your_table_name (
     id BIGSERIAL,
     partition_year INT NOT NULL,
     -- other columns
   ) PARTITION BY RANGE (partition_year);
   ```

2. **Add to config in `partition.crons.js`:**
   ```javascript
   const PARTITION_TABLES_CONFIG = [
     // ... existing tables ...
     {
       tableName: 'your_table_name',
       columnName: 'partition_year',
       yearsAhead: 1,
     },
   ];
   ```

3. **Restart the application** - partitions will be created automatically

## Manual Partition Creation

You can also create partitions manually:

```javascript
const { ensureYearlyPartitions } = require('./utils/partition.helper');

// Create partitions for a single table
await ensureYearlyPartitions('auth_audit_log', 'partition_year', 2);

// Or use the helper directly
const { createYearlyPartition } = require('./utils/partition.helper');
await createYearlyPartition('auth_audit_log', 'partition_year');
```

## Testing

To test partition creation without waiting for January 1st:

```javascript
const { nodeCronsCreateNewYearPartitions } = require('./utils/partition.crons');

// Manually trigger the new year partition creation
await nodeCronsCreateNewYearPartitions();
```

