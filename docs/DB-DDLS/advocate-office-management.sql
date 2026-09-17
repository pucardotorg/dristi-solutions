-- =====================================================================
-- Consolidated DDL for advocate-office-management (fresh-install reference)
-- Generated from Flyway migrations in db/migration/main
-- This script represents the FINAL schema state after applying all
-- versioned migrations below, in order. It is a reference/documentation
-- script for provisioning a new environment quickly — it does NOT
-- replace the existing Flyway migration history. Deployed environments
-- must continue to use the original versioned migration files.
--
-- Source files reviewed (3):
--   V20260121173000__advocate-office-management__ddl.sql
--   V20260128120000__advocate-office-management__add_user_uuid_columns.sql
--   V20260305120200__advocate-office-management__add_advocate_office_mobile_number.sql
-- =====================================================================

-- ==== Sequences ====
-- (none)

-- ==== Tables ====

CREATE TABLE dristi_advocate_office_member (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    office_advocate_id VARCHAR(64) NOT NULL,
    member_type VARCHAR(64) NOT NULL,
    member_id VARCHAR(64) NOT NULL,
    member_name VARCHAR(256),
    member_mobile_number VARCHAR(256),
    access_type VARCHAR(64) DEFAULT 'ALL_CASES',
    allow_case_create BOOLEAN DEFAULT TRUE,
    add_new_cases_automatically BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(64),
    last_modified_by VARCHAR(64),
    created_time int8,
    last_modified_time int8,
    -- added by V20260128120000
    office_advocate_user_uuid VARCHAR(64),
    member_user_uuid VARCHAR(64),
    tenant_id VARCHAR(64),
    office_advocate_name VARCHAR(256),
    member_email VARCHAR(256),
    -- added by V20260305120200
    advocate_office_mobile_number VARCHAR(256)
);

-- ==== Indexes ====

CREATE INDEX idx_advocate_office_member_office_id ON dristi_advocate_office_member(office_advocate_id);
CREATE INDEX idx_advocate_office_member_member_id ON dristi_advocate_office_member(member_id);
CREATE INDEX idx_advocate_office_member_is_active ON dristi_advocate_office_member(is_active);
CREATE UNIQUE INDEX idx_advocate_office_member_unique ON dristi_advocate_office_member(office_advocate_id, member_id);
CREATE INDEX IF NOT EXISTS idx_advocate_office_member_office_user_uuid ON dristi_advocate_office_member(office_advocate_user_uuid);
CREATE INDEX IF NOT EXISTS idx_advocate_office_member_member_user_uuid ON dristi_advocate_office_member(member_user_uuid);
CREATE INDEX IF NOT EXISTS idx_advocate_office_member_tenant_id ON dristi_advocate_office_member(tenant_id);
