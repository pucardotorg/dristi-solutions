-- =====================================================================
-- Consolidated DDL for summons-svc (fresh-install reference)
-- Generated from Flyway migrations in db/migration/main
-- This script represents the FINAL schema state after applying all
-- versioned migrations below, in order. It is a reference/documentation
-- script for provisioning a new environment quickly — it does NOT
-- replace the existing Flyway migration history. Deployed environments
-- must continue to use the original versioned migration files.
--
-- Source files reviewed (2):
--   V20240529100725__summons_ddl.sql
--   V20240812100725__summons_ddl.sql
-- =====================================================================

-- ==== Sequences ====
-- (none)

-- ==== Tables ====

CREATE TABLE summons_delivery (
    summons_delivery_id VARCHAR(255) NOT NULL PRIMARY KEY,
    task_number VARCHAR(255) NOT NULL,
    -- NOT NULL dropped by V20240812100725
    case_id VARCHAR(255),
    tenant_id VARCHAR(255) NOT NULL,
    -- NOT NULL dropped by V20240812100725
    doc_type VARCHAR(50),
    -- NOT NULL dropped by V20240812100725
    doc_sub_type VARCHAR(50),
    -- NOT NULL dropped by V20240812100725
    party_type VARCHAR(50),
    -- NOT NULL dropped by V20240812100725
    channel_name VARCHAR(255),
    payment_fees VARCHAR(255) NULL,
    payment_transaction_id VARCHAR(255) NULL,
    payment_status VARCHAR(255) NULL,
    is_accepted_by_channel BOOLEAN NULL,
    channel_acknowledgement_id VARCHAR(255),
    delivery_request_date VARCHAR(50) NULL,
    delivery_status VARCHAR(255) NULL,
    additional_fields jsonb NULL,
    created_by varchar(64) NULL,
    last_modified_by varchar(64) NULL,
    created_time int8 NULL,
    last_modified_time int8 NULL,
    row_version int4 NULL
);

-- ==== Indexes ====
-- (none)
