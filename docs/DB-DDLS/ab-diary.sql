-- =====================================================================
-- Consolidated DDL for ab-diary (fresh-install reference)
-- Generated from Flyway migrations in db/migration/main
-- This script represents the FINAL schema state after applying all
-- versioned migrations below, in order. It is a reference/documentation
-- script for provisioning a new environment quickly — it does NOT
-- replace the existing Flyway migration history. Deployed environments
-- must continue to use the original versioned migration files.
--
-- Source files reviewed (4):
--   V20250115184300__casediary__ddl.sql
--   V20250309203500__casediary__ddl.sql
--   V20250310163500__casediary_caseid__ddl.sql
--   V20250520163500__casediary_courtid__ddl.sql
-- =====================================================================

-- ==== Sequences ====
-- (none)

-- ==== Tables ====

CREATE TABLE dristi_casediary (
    id varchar(36) NOT NULL PRIMARY KEY,
    tenant_id varchar(64) NOT NULL,
    -- varchar(36) of case number
    case_number varchar(36),
    diary_date int8,
    -- master data for diary type - ADiary, BDiary
    diary_type varchar(36) NOT NULL,
    -- varchar(36) of court Id (renamed from judge_id by V20250520163500)
    court_id varchar(36),
    additional_details jsonb,
    created_by varchar(36) NOT NULL,
    last_modified_by varchar(36) NOT NULL,
    created_time int8 NOT NULL,
    last_modified_time int8 NOT NULL
);

CREATE TABLE dristi_casediary_documents (
    id varchar(36) NOT NULL PRIMARY KEY,
    tenant_id varchar(64) NOT NULL,
    filestore_id varchar(64),
    document_uid varchar(36),
    document_name varchar(128),
    document_type varchar(36),
    casediary_id varchar(36) NOT NULL,
    is_active bool NOT NULL,
    additional_details jsonb,
    created_by varchar(36) NOT NULL,
    last_modified_by varchar(36) NOT NULL,
    created_time int8 NOT NULL,
    last_modified_time int8 NOT NULL,
    CONSTRAINT fk_case_documents_casediary
        FOREIGN KEY(casediary_id)
        REFERENCES dristi_casediary(id)
);

CREATE TABLE dristi_diaryentries (
    id varchar(36) NOT NULL PRIMARY KEY,
    tenant_id varchar(64) NOT NULL,
    case_number varchar(36),
    entry_date int8 NOT NULL,
    -- type widened to unbounded varchar by V20250309203500 (was varchar(1024))
    businessOfDay varchar NOT NULL,
    reference_id varchar(64),
    -- master ID for reference type --
    reference_type varchar(64),
    hearingDate int8 NULL,
    additional_details jsonb,
    created_by varchar(36) NOT NULL,
    last_modified_by varchar(36) NOT NULL,
    created_time int8 NOT NULL,
    last_modified_time int8 NOT NULL,
    -- renamed from judge_id by V20250520163500
    court_id varchar(36) NOT NULL,
    -- added by V20250310163500
    case_id varchar(64)
);

-- ==== Indexes ====

-- dristi_casediary
-- (idx_dristi_casediary_type_judge / idx_dristi_casediary_date on judge_id
--  were dropped and recreated on court_id by V20250520163500)
CREATE INDEX idx_dristi_casediary_type_court ON dristi_casediary(tenant_id, diary_type, court_id);
CREATE INDEX idx_dristi_casediary_date ON dristi_casediary(tenant_id, court_id, diary_date);

-- dristi_casediary_documents
CREATE INDEX idx_dristi_casediary_documents_casediary_id ON dristi_casediary_documents(tenant_id, casediary_id);
CREATE UNIQUE INDEX idx_dristi_casediary_documents_filestore_id ON dristi_casediary_documents(tenant_id, filestore_id);

-- dristi_diaryentries
CREATE INDEX idx_dristi_diaryentries_casediary_id ON dristi_diaryentries(tenant_id, case_number);
CREATE INDEX idx_dristi_diaryentries_entry_date ON dristi_diaryentries(tenant_id, entry_date);
