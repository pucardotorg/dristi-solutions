-- =====================================================================
-- Consolidated DDL for epost-tracker (fresh-install reference)
-- Generated from Flyway migrations in db/migration/main
-- This script represents the FINAL schema state after applying all
-- versioned migrations below, in order. It is a reference/documentation
-- script for provisioning a new environment quickly — it does NOT
-- replace the existing Flyway migration history. Deployed environments
-- must continue to use the original versioned migration files.
--
-- Source files reviewed (8):
--   V20240723134500__epost_tracker_ddl.sql
--   V20250305171500__epost_tracker_postalhub_ddl.sql
--   V20250927235500__epost_tracker_ddl.sql
--   V20251001190000__epost-tracker_ddl.sql
--   V20251008120599__epost_status_update_ddl.sql
--   V20251010111000__epost_tasktype_ddl.sql
--   V20251023165000__epost_remarks_ddl.sql
--   V20251410124500__epost_phone_addressobj_ddl.sql
-- =====================================================================

-- ==== Sequences ====
-- (none)

-- ==== Tables ====

-- dristi_epost_tracker: baseline created by V20240723134500, then
--   - postal_hub added (V20250305171500)
--   - speed_post_id, total_amount added (V20250927235500)
--   - booking_date, received_date dropped (were varchar(64)) and
--     re-added as int8 (V20251001190000)
--   - status_update_date added (V20251008120599)
--   - task_type, respondent_name added (V20251010111000)
--   - remarks widened from varchar(64) to varchar(1000) (V20251023165000)
--   - phone, address_obj added (V20251410124500)
CREATE TABLE dristi_epost_tracker (
    process_number varchar(64) NOT NULL PRIMARY KEY,
    tenant_id varchar(64) NOT NULL,
    file_store_id varchar(64) NULL,
    task_number varchar(64) NULL,
    tracking_number varchar(64) NULL,
    pincode varchar(64) NULL,
    address varchar(1000) NULL,
    delivery_status varchar(64) NULL,
    remarks varchar(1000) NULL,
    additional_details jsonb NULL,
    row_version int4 NULL,
    createdBy varchar(64) NULL,
    lastModifiedBy varchar(64) NULL,
    createdTime int8 NULL,
    lastModifiedTime int8 NULL,
    postal_hub varchar(64),
    speed_post_id varchar(64),
    total_amount varchar(64),
    booking_date int8,
    received_date int8,
    status_update_date int8,
    task_type VARCHAR(255),
    respondent_name VARCHAR(255),
    phone VARCHAR(255),
    address_obj JSON
);

-- ==== Indexes ====
-- (none beyond primary key declared inline above)
