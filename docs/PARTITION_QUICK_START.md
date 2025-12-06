# Yearly Partition Management - Quick Start

## Files Created

1. **`src/utils/partition.helper.js`** - Core partition creation functions
2. **`src/utils/partition.crons.js`** - Cron scheduler for automatic partition management
3. **`docs/PARTITION_INTEGRATION_EXAMPLE.md`** - Integration example

## Installation

```bash
npm install node-cron
```

## Quick Integration

Add to `src/server.js`:

```javascript
const { nodeCronsInitializePartitionManagement } = require('./utils/partition.crons');

async function startServer() {
  // ... existing code ...
  
  // Initialize partition management
  await nodeCronsInitializePartitionManagement();
  
  // ... rest of code ...
}
```

## Configuration

Edit `src/utils/partition.crons.js` and add your tables to `PARTITION_TABLES_CONFIG`:

```javascript
const PARTITION_TABLES_CONFIG = [
  {
    tableName: 'auth_audit_log',
    columnName: 'partition_year',
    yearsAhead: 1,
  },
  // Add more tables here
];
```

## How It Works

1. **On App Start**: Creates partitions for current year + next year for all configured tables
2. **Cron Job**: Runs every January 1st at 00:00:00 to create partitions for the new year
3. **Automatic**: No manual DBA work required

## Table Requirements

Your parent table must be partitioned by an integer year column:

```sql
CREATE TABLE auth_audit_log (
  id BIGSERIAL,
  partition_year INT NOT NULL,  -- Must be integer year (2024, 2025, etc.)
  -- other columns
) PARTITION BY RANGE (partition_year);
```

When inserting data, ensure `partition_year` is set:

```javascript
await AuthAuditLog.create({
  partition_year: new Date().getFullYear(),
  // other fields
});
```

## That's It!

Partitions will be created automatically. No manual intervention needed.

