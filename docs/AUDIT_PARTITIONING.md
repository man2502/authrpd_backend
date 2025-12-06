# Audit Log Partitioning - Best Practices

## Overview

The `auth_audit_log` table is partitioned by year using PostgreSQL RANGE partitioning. This document explains the implementation, benefits, and best practices.

## Architecture

### Partition Strategy: RANGE Partitioning by Year

- **Parent Table**: `auth_audit_log` (defines structure, holds no data)
- **Child Partitions**: `auth_audit_log_2024`, `auth_audit_log_2025`, etc.
- **Partition Key**: `created_at` (TIMESTAMPTZ)
- **Range**: Each partition covers one calendar year (Jan 1 00:00:00 UTC to Jan 1 00:00:00 UTC next year)

### Table Structure

```sql
auth_audit_log (
    id BIGSERIAL,
    actor_type VARCHAR(255),
    actor_id BIGINT,
    action VARCHAR(255) NOT NULL,
    target_type VARCHAR(255),
    target_id VARCHAR(255),
    meta JSONB,
    ip VARCHAR(255),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, created_at)  -- Note: created_at in PK for partitioning
)
```

## Benefits of Yearly Partitioning

### 1. **Query Performance**
- **Partition Pruning**: PostgreSQL automatically excludes irrelevant partitions from queries
- **Smaller Indexes**: Each partition has its own indexes, making them smaller and faster
- **Parallel Query Execution**: Queries can scan multiple partitions in parallel

**Example:**
```sql
-- This query only scans auth_audit_log_2024 partition
SELECT * FROM auth_audit_log 
WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01';
```

### 2. **Data Management**
- **Easy Archival**: Drop old partitions instead of deleting millions of rows
- **Faster Maintenance**: VACUUM, ANALYZE, and REINDEX operations are faster on smaller tables
- **Reduced Lock Contention**: Operations on one partition don't block others

### 3. **Storage Efficiency**
- **Reduced Bloat**: Smaller tables mean less table bloat
- **Better Compression**: Can compress old partitions if needed
- **Easier Backup**: Can backup/restore individual partitions

### 4. **Compliance & Retention**
- **Easy Deletion**: Drop entire partitions for data retention policies
- **Audit Trail**: Clear separation of data by year
- **Regulatory Compliance**: Easier to manage data retention requirements

## Trade-offs

### Advantages ✅

1. **Performance**: Significantly faster queries on time-based ranges
2. **Maintenance**: Easier to manage large audit tables
3. **Scalability**: Can handle billions of rows efficiently
4. **Flexibility**: Easy to archive or delete old data

### Considerations ⚠️

1. **Partition Key Required**: All queries should include `created_at` for optimal performance
2. **Cross-Partition Queries**: Queries spanning multiple years may be slower (but still manageable)
3. **Partition Management**: Need to create partitions in advance
4. **Primary Key**: Must include partition key (`created_at`) in PRIMARY KEY

## Implementation

### SQL Functions

#### `create_audit_partition_for_year(year INT)`
Creates a partition for a specific year if it doesn't exist.

```sql
SELECT create_audit_partition_for_year(2025);
```

#### `ensure_audit_partitions(years_ahead INT)`
Creates partitions for current year and N years ahead.

```sql
-- Create partitions for current year + 2 years ahead
SELECT ensure_audit_partitions(2);
```

### Migration

Run the migration to set up partitioning:

```bash
npm run migrate
```

This will:
1. Create the parent partitioned table
2. Create SQL functions for partition management
3. Create partitions for current year and next year

### Maintenance Script

Run daily via cron to ensure partitions exist:

```bash
# Manual run
npm run ensure-partitions

# Cron example (daily at 2 AM)
0 2 * * * cd /path/to/project && npm run ensure-partitions >> logs/partition-maintenance.log 2>&1
```

## Query Examples

### List All Partitions

```sql
SELECT
    tablename,
    pg_size_pretty(pg_total_relation_size('public.' || tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'auth_audit_log_%'
ORDER BY tablename;
```

### Get Partition Constraints (Date Ranges)

```sql
SELECT
    child.relname AS partition_name,
    pg_get_expr(child.relpartbound, child.oid) AS partition_constraint
FROM pg_inherits
JOIN pg_class parent ON pg_inherits.inhparent = parent.oid
JOIN pg_class child ON pg_inherits.inhrelid = child.oid
JOIN pg_namespace nmsp_parent ON nmsp_parent.oid = parent.relnamespace
JOIN pg_namespace nmsp_child ON nmsp_child.oid = child.relnamespace
WHERE parent.relname = 'auth_audit_log'
ORDER BY child.relname;
```

### Get Partition Sizes and Row Counts

```sql
SELECT
    tablename,
    pg_size_pretty(pg_total_relation_size('public.' || tablename)) AS total_size,
    pg_size_pretty(pg_relation_size('public.' || tablename)) AS table_size,
    n_live_tup AS row_count
FROM pg_stat_user_tables
WHERE tablename LIKE 'auth_audit_log_%'
ORDER BY tablename;
```

### Query with Partition Pruning (Optimal)

```sql
-- ✅ GOOD: Includes partition key, only scans relevant partition
SELECT * FROM auth_audit_log
WHERE created_at >= '2024-01-01' 
  AND created_at < '2025-01-01'
  AND action = 'LOGIN';
```

### Query Without Partition Pruning (Still Works)

```sql
-- ⚠️ ACCEPTABLE: Scans all partitions, but still works
SELECT * FROM auth_audit_log
WHERE action = 'LOGIN'
ORDER BY created_at DESC
LIMIT 100;
```

## Best Practices

### 1. Always Include Partition Key in Queries

For optimal performance, include `created_at` in WHERE clauses:

```sql
-- ✅ GOOD
WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01'

-- ⚠️ ACCEPTABLE (but scans all partitions)
WHERE action = 'LOGIN'
```

### 2. Create Partitions in Advance

Run the maintenance script daily to ensure partitions exist before data arrives:

```bash
npm run ensure-partitions
```

### 3. Monitor Partition Sizes

Regularly check partition sizes to plan for storage:

```sql
SELECT
    tablename,
    pg_size_pretty(pg_total_relation_size('public.' || tablename)) AS size,
    n_live_tup AS rows
FROM pg_stat_user_tables
WHERE tablename LIKE 'auth_audit_log_%'
ORDER BY tablename;
```

### 4. Archive Old Partitions

For data retention, you can:

**Option A: Drop Old Partitions**
```sql
-- Drop partition for year 2020 (after backup!)
DROP TABLE auth_audit_log_2020;
```

**Option B: Detach and Archive**
```sql
-- Detach partition (keeps data, removes from parent)
ALTER TABLE auth_audit_log DETACH PARTITION auth_audit_log_2020;

-- Later, you can reattach if needed
ALTER TABLE auth_audit_log ATTACH PARTITION auth_audit_log_2020
FOR VALUES FROM ('2020-01-01') TO ('2021-01-01');
```

### 5. Index Maintenance

Each partition has its own indexes:
- `(created_at)` - for time-based queries
- `(actor_id, created_at)` - for actor-based queries
- `(action, created_at)` - for action-based queries

Indexes are automatically maintained per partition, making REINDEX operations faster.

## Migration from Non-Partitioned Table

If you have an existing `auth_audit_log` table:

1. **Backup existing data**
2. **Create partitioned table structure**
3. **Migrate data to appropriate partitions**
4. **Drop old table**
5. **Rename partitioned table** (if needed)

Example migration script:

```sql
-- Step 1: Create partitioned table
-- (Run the migration SQL)

-- Step 2: Migrate data
INSERT INTO auth_audit_log
SELECT * FROM auth_audit_log_old
WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01';
-- Repeat for each year

-- Step 3: Verify data
SELECT COUNT(*) FROM auth_audit_log;
SELECT COUNT(*) FROM auth_audit_log_old;

-- Step 4: Drop old table (after verification)
DROP TABLE auth_audit_log_old;
```

## Performance Considerations

### Query Performance

- **With partition pruning**: Queries are 10-100x faster on large datasets
- **Without partition pruning**: Still works, but scans all partitions
- **Cross-partition queries**: Acceptable performance for most use cases

### Maintenance Performance

- **VACUUM**: Much faster on smaller partitions
- **ANALYZE**: Faster statistics collection
- **REINDEX**: Can reindex one partition at a time
- **Backup**: Can backup individual partitions

### Storage

- **Table bloat**: Reduced significantly
- **Index bloat**: Smaller indexes per partition
- **Compression**: Can compress old partitions if needed

## Monitoring

### Key Metrics to Monitor

1. **Partition sizes**: Ensure adequate storage
2. **Query performance**: Monitor slow queries
3. **Partition creation**: Ensure partitions are created in advance
4. **Index usage**: Monitor index hit rates

### Alerts

Set up alerts for:
- Missing partitions (should exist 1-2 years ahead)
- Large partition sizes (> 50GB per partition)
- Slow queries (queries taking > 1 second)

## Conclusion

Yearly partitioning is an excellent choice for audit logs because:

1. ✅ **Append-only workload** - Perfect for partitioning
2. ✅ **Time-based queries** - Natural fit for RANGE partitioning
3. ✅ **Large data volumes** - Handles billions of rows efficiently
4. ✅ **Compliance requirements** - Easy data retention management
5. ✅ **Performance** - Significant query performance improvements

The trade-off of including `created_at` in the PRIMARY KEY is minimal compared to the benefits gained.

