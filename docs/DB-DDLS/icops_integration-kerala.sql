-- =====================================================================
-- Consolidated DDL for icops_integration-kerala (fresh-install reference)
-- Generated from Flyway migrations in db/migration/main
-- This script represents the FINAL schema state after applying all
-- versioned migrations below, in order. It is a reference/documentation
-- script for provisioning a new environment quickly — it does NOT
-- replace the existing Flyway migration history. Deployed environments
-- must continue to use the original versioned migration files.
--
-- Source files reviewed (3):
--   V20240723134500__icops-tracker_ddl.sql
--   V20240830134500__icops-tracker_ddl.sql
--   V20260219140000__icops-tracker_ddl.sql
-- =====================================================================

-- ==== Sequences ====
-- (none)

-- ==== Tables ====

CREATE TABLE dristi_kerala_icops (
    process_number varchar(64) NOT NULL PRIMARY KEY,
    tenant_id varchar(64) NOT NULL,
    task_number varchar(64) NULL,
    task_type varchar(64) NULL,
    file_store_id varchar(64) NULL,
    task_details jsonb NULL,
    delivery_status varchar(64) NULL,
    acknowledgement_id varchar(64) NULL,
    -- widened from varchar(64) to varchar(1000) by V20240830134500
    remarks varchar(1000) NULL,
    additional_details jsonb NULL,
    booking_date varchar(64) NULL,
    received_date varchar(64) NULL,
    row_version int4 NULL,
    -- added by V20260219140000
    request_blob jsonb NULL,
    response_blob jsonb NULL,
    failure_reason varchar(1000) NULL
);

-- ==== Indexes ====
-- (none)
