-- ============================================================================
-- PostgreSQL Partitioning for auth_audit_log table
-- ============================================================================
-- 
-- This script implements RANGE partitioning by year for the audit log table.
-- 
-- Benefits:
-- - Improved query performance (partition pruning)
-- - Easier data management (drop old partitions)
-- - Better index maintenance (smaller indexes per partition)
-- - Reduced table bloat
--
-- Partition Strategy: RANGE partitioning by created_at (yearly)
-- Partitions: auth_audit_log_2024, auth_audit_log_2025, etc.
-- ============================================================================

-- ============================================================================
-- Step 1: Drop existing table if it exists (for migration)
-- ============================================================================
-- Note: In production, you would migrate data first before dropping
-- This is for initial setup only

-- ============================================================================
-- Step 2: Create parent partitioned table
-- ============================================================================
-- The parent table defines the structure but holds no data
-- All data goes into child partitions

CREATE TABLE IF NOT EXISTS public.auth_audit_log (
    id BIGSERIAL NOT NULL,
    actor_type VARCHAR(255),
    actor_id BIGINT,
    action VARCHAR(255) NOT NULL,
    target_type VARCHAR(255),
    target_id VARCHAR(255),  -- Changed to VARCHAR to match requirement
    meta JSONB,
    ip VARCHAR(255),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Primary key constraint (will be inherited by partitions)
    CONSTRAINT auth_audit_log_pkey PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Add comment to table
COMMENT ON TABLE public.auth_audit_log IS 'Parent table for yearly partitioned audit logs. All data is stored in year-based partitions.';

-- Add comments to columns
COMMENT ON COLUMN public.auth_audit_log.id IS 'Unique identifier for audit log entry';
COMMENT ON COLUMN public.auth_audit_log.actor_type IS 'Type of actor (MEMBER, CLIENT, SYSTEM)';
COMMENT ON COLUMN public.auth_audit_log.actor_id IS 'ID of the actor performing the action';
COMMENT ON COLUMN public.auth_audit_log.action IS 'Action performed (LOGIN, LOGOUT, CREATE, UPDATE, DELETE, etc.)';
COMMENT ON COLUMN public.auth_audit_log.target_type IS 'Type of target entity (if applicable)';
COMMENT ON COLUMN public.auth_audit_log.target_id IS 'ID of target entity (if applicable)';
COMMENT ON COLUMN public.auth_audit_log.meta IS 'Additional metadata in JSON format';
COMMENT ON COLUMN public.auth_audit_log.ip IS 'IP address of the request';
COMMENT ON COLUMN public.auth_audit_log.user_agent IS 'User agent string from the request';
COMMENT ON COLUMN public.auth_audit_log.created_at IS 'Timestamp when the audit log entry was created (used for partitioning)';

-- ============================================================================
-- Step 3: Function to create a partition for a specific year
-- ============================================================================
-- This function creates a partition table for a given year if it doesn't exist
-- It handles the date range calculation and index creation automatically

CREATE OR REPLACE FUNCTION create_audit_partition_for_year(year INT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    partition_name TEXT;
    start_date TIMESTAMPTZ;
    end_date TIMESTAMPTZ;
    partition_exists BOOLEAN;
BEGIN
    -- Construct partition name: auth_audit_log_YYYY
    partition_name := 'auth_audit_log_' || year;
    
    -- Calculate date range for the year
    -- Start: January 1st of the year at 00:00:00 UTC
    start_date := make_timestamptz(year, 1, 1, 0, 0, 0, 'UTC');
    -- End: January 1st of next year at 00:00:00 UTC (exclusive)
    end_date := make_timestamptz(year + 1, 1, 1, 0, 0, 0, 'UTC');
    
    -- Check if partition already exists
    SELECT EXISTS (
        SELECT 1
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
        AND c.relname = partition_name
    ) INTO partition_exists;
    
    -- Create partition only if it doesn't exist
    IF NOT partition_exists THEN
        -- Create the partition table
        -- Note: We include created_at in PRIMARY KEY to match parent table constraint
        EXECUTE format('
            CREATE TABLE %I PARTITION OF public.auth_audit_log
            FOR VALUES FROM (%L) TO (%L)
        ', partition_name, start_date, end_date);
        
        -- Create indexes on the partition for optimal query performance
        -- Index 1: created_at (for time-based queries)
        EXECUTE format('
            CREATE INDEX %I ON %I (created_at)
        ', partition_name || '_created_at_idx', partition_name);
        
        -- Index 2: actor_id + created_at (for actor-based queries with time filtering)
        EXECUTE format('
            CREATE INDEX %I ON %I (actor_id, created_at)
        ', partition_name || '_actor_created_idx', partition_name);
        
        -- Index 3: action + created_at (for action-based queries with time filtering)
        EXECUTE format('
            CREATE INDEX %I ON %I (action, created_at)
        ', partition_name || '_action_created_idx', partition_name);
        
        RAISE NOTICE 'Created partition % for year % (from % to %)', 
            partition_name, year, start_date, end_date;
    ELSE
        RAISE NOTICE 'Partition % already exists, skipping', partition_name;
    END IF;
END;
$$;

COMMENT ON FUNCTION create_audit_partition_for_year(INT) IS 
'Creates a yearly partition for auth_audit_log table if it does not exist. Includes all necessary indexes.';

-- ============================================================================
-- Step 4: Helper function to ensure partitions exist for current and future years
-- ============================================================================
-- This function creates partitions for the current year and N years ahead
-- Useful for maintenance scripts and ensuring partitions exist before data arrives

CREATE OR REPLACE FUNCTION ensure_audit_partitions(years_ahead INT DEFAULT 1)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    current_year INT;
    target_year INT;
    year_counter INT;
BEGIN
    -- Get current year
    current_year := EXTRACT(YEAR FROM CURRENT_DATE)::INT;
    
    -- Create partitions from current year to current_year + years_ahead
    FOR year_counter IN 0..years_ahead LOOP
        target_year := current_year + year_counter;
        PERFORM create_audit_partition_for_year(target_year);
    END LOOP;
    
    RAISE NOTICE 'Ensured partitions exist for years % to %', 
        current_year, current_year + years_ahead;
END;
$$;

COMMENT ON FUNCTION ensure_audit_partitions(INT) IS 
'Creates partitions for current year and N years ahead. Default is 1 year ahead.';

-- ============================================================================
-- Step 5: Create initial partitions (current year and next year)
-- ============================================================================
-- This ensures partitions exist for immediate use
-- Run ensure_audit_partitions(1) to create current + next year

SELECT ensure_audit_partitions(1);

-- ============================================================================
-- Example queries to verify partitions
-- ============================================================================

-- Query 1: List all partitions of auth_audit_log
-- SELECT 
--     schemaname,
--     tablename,
--     pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
-- FROM pg_tables
-- WHERE tablename LIKE 'auth_audit_log_%'
-- ORDER BY tablename;

-- Query 2: Get partition information with date ranges
-- SELECT
--     nmsp_child.nspname AS schema_name,
--     child.relname AS partition_name,
--     pg_get_expr(child.relpartbound, child.oid) AS partition_constraint,
--     pg_size_pretty(pg_total_relation_size(nmsp_child.nspname||'.'||child.relname)) AS size
-- FROM pg_inherits
-- JOIN pg_class parent ON pg_inherits.inhparent = parent.oid
-- JOIN pg_class child ON pg_inherits.inhrelid = child.oid
-- JOIN pg_namespace nmsp_parent ON nmsp_parent.oid = parent.relnamespace
-- JOIN pg_namespace nmsp_child ON nmsp_child.oid = child.relnamespace
-- WHERE parent.relname = 'auth_audit_log'
-- ORDER BY child.relname;

-- Query 3: Check partition constraints (date ranges)
-- SELECT
--     nmsp_parent.nspname AS parent_schema,
--     parent.relname AS parent_table,
--     nmsp_child.nspname AS child_schema,
--     child.relname AS child_table,
--     pg_get_expr(child.relpartbound, child.oid) AS partition_constraint
-- FROM pg_inherits
-- JOIN pg_class parent ON pg_inherits.inhparent = parent.oid
-- JOIN pg_class child ON pg_inherits.inhrelid = child.oid
-- JOIN pg_namespace nmsp_parent ON nmsp_parent.oid = parent.relnamespace
-- JOIN pg_namespace nmsp_child ON nmsp_child.oid = child.relnamespace
-- WHERE parent.relname = 'auth_audit_log'
-- ORDER BY child.relname;

-- Query 4: Get partition sizes and row counts (requires pg_stat_user_tables)
-- SELECT
--     schemaname,
--     tablename,
--     pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
--     pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
--     n_live_tup AS row_count
-- FROM pg_stat_user_tables
-- WHERE tablename LIKE 'auth_audit_log_%'
-- ORDER BY tablename;

