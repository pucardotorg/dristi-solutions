-- =====================================================================
-- Consolidated DDL for template-configuration (fresh-install reference)
-- Generated from Flyway migrations in db/migration/main
-- This script represents the FINAL schema state after applying all
-- versioned migrations below, in order. It is a reference/documentation
-- script for provisioning a new environment quickly — it does NOT
-- replace the existing Flyway migration history. Deployed environments
-- must continue to use the original versioned migration files.
--
-- Source files reviewed (3):
--   V20250128110535__template__ddl.sql
--   V20250129110535__template__ddl.sql
--   V20250326120000__add_sub_title_column.sql
-- =====================================================================

-- ==== Sequences ====
-- (none)

-- ==== Tables ====

CREATE TABLE dristi_template_configuration (
    id varchar(64) NOT NULL PRIMARY KEY,
    tenant_id varchar(64) NOT NULL,
    court_id varchar(64) NULL,
    process_title varchar(255),
    addressee_name varchar(255),
    is_cover_letter_required boolean DEFAULT false,
    addressee text,
    order_text text,
    process_text text,
    cover_letter_text text,
    created_by varchar(64) NULL,
    last_modified_by varchar(64) NULL,
    created_time int8 NULL,
    last_modified_time int8 NULL,
    is_active boolean DEFAULT true,
    -- added by V20250326120000
    sub_title varchar(255)
);

-- ==== Indexes ====

CREATE INDEX IF NOT EXISTS idx_dristi_template_configuration_process_title ON dristi_template_configuration(process_title);
