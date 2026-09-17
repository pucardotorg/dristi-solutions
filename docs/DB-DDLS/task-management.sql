-- =====================================================================
-- Consolidated DDL for task-management (fresh-install reference)
-- Generated from Flyway migrations in db/migration/main
-- This script represents the FINAL schema state after applying all
-- versioned migrations below, in order. It is a reference/documentation
-- script for provisioning a new environment quickly — it does NOT
-- replace the existing Flyway migration history. Deployed environments
-- must continue to use the original versioned migration files.
--
-- Source files reviewed (3):
--   V20251024110535__task-management__ddl.sql
--   V20251104203200__task-management__ddl.sql
--   V20251117220300__task-management__ddl.sql
-- =====================================================================

-- ==== Sequences ====
-- (none)

-- ==== Tables ====

CREATE TABLE dristi_task_management (
    id varchar(64) NOT NULL PRIMARY KEY,
    task_management_number VARCHAR(64),
    filing_number VARCHAR(64),
    court_id VARCHAR(64),
    order_number VARCHAR(64),
    order_item_id VARCHAR(64),
    task_type VARCHAR(64),
    status VARCHAR(64),
    party_details JSONB,
    additional_details JSONB,
    tenant_id VARCHAR(64),
    created_by VARCHAR(64),
    last_modified_by VARCHAR(64),
    created_time int8,
    last_modified_time int8,
    -- added by V20251104203200
    documents JSONB,
    -- added by V20251117220300
    party_type VARCHAR(256)
);

-- ==== Indexes ====
-- (none)
