-- =====================================================================
-- Consolidated DDL for hearing (fresh-install reference)
-- Generated from Flyway migrations in db/migration/main
-- This script represents the FINAL schema state after applying all
-- versioned migrations below, in order. It is a reference/documentation
-- script for provisioning a new environment quickly — it does NOT
-- replace the existing Flyway migration history. Deployed environments
-- must continue to use the original versioned migration files.
--
-- Source files reviewed (8):
--   V20240514110535__hearing__ddl.sql
--   V20240913111500__hearing__ddl.sql
--   V20240927110535__hearing__ddl.sql
--   V20250106151900__hearing__ddl.sql
--   V20250505175500__hearing__ddl.sql
--   V20250527104200__hearing_summary_ddl.sql
--   V20250606142700__hearing__ddl.sql
--   V20260211142700__hearing__ddl.sql
-- =====================================================================

-- ==== Sequences ====
-- (none)

-- ==== Tables ====

-- dristi_hearing: baseline created by V20240514110535, then
--   - caseReferenceNumber, courtCaseNumber, cmpNumber added (V20240927110535)
--   - hearingSummary added as varchar(1000) (V20250527104200)
--   - hearingDurationInMillis added (V20250606142700)
--   - hearingSummary widened to unbounded VARCHAR (V20260211142700)
CREATE TABLE dristi_hearing (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantId VARCHAR(10) NOT NULL,
    hearingId varchar(64) NULL,
    filingNumber JSONB NULL,
    cnrNumbers JSONB NULL,
    applicationNumbers JSONB NULL,
    hearingType VARCHAR(64) NOT NULL,
    status VARCHAR(64) NOT NULL,
    startTime int8 NULL,
    endTime int8 NULL,
    presidedBy JSONB NULL,
    attendees JSONB NULL,
    transcript JSONB NULL,
    vcLink VARCHAR(255) NULL,
    isActive BOOLEAN NULL,
    additionalDetails JSONB NULL,
    notes VARCHAR(255) NULL,
    createdBy varchar(64) NULL,
    lastModifiedBy varchar(64) NULL,
    createdTime int8 NULL,
    lastModifiedTime int8 NULL,
    caseReferenceNumber varchar(64) NULL,
    courtCaseNumber varchar(64) NULL,
    cmpNumber varchar(64) NULL,
    hearingSummary VARCHAR NULL,
    hearingDurationInMillis bigint NULL,
    CONSTRAINT chk_startTime_endTime CHECK (startTime IS NULL OR endTime IS NULL OR startTime <= endTime)
);

-- dristi_hearing_document: baseline created by V20240514110535, then
--   - isActive added with DEFAULT TRUE (V20250505175500)
CREATE TABLE dristi_hearing_document (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    fileStore VARCHAR(64),
    documentUid VARCHAR(64),
    documentType VARCHAR(64),
    hearingId VARCHAR(64) NOT NULL,
    additionalDetails JSONB,
    isActive bool DEFAULT TRUE
);

-- ==== Indexes ====

CREATE INDEX IF NOT EXISTS idx_dristi_hearing_hearing_id ON dristi_hearing (hearingId);
CREATE INDEX IF NOT EXISTS idx_dristi_hearing_filing_number ON dristi_hearing USING GIN (filingNumber);
CREATE INDEX IF NOT EXISTS idx_dristi_hearing_cnr_number ON dristi_hearing USING GIN (cnrNumbers);
CREATE INDEX IF NOT EXISTS idx_dristi_hearing_application_number ON dristi_hearing USING GIN (applicationNumbers);
CREATE INDEX IF NOT EXISTS idx_dristi_hearing_hearing_type ON dristi_hearing (hearingType);
CREATE INDEX IF NOT EXISTS idx_dristi_hearing_individual_id ON dristi_hearing USING gin (attendees jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_drist_hearing_start_time ON dristi_hearing (startTime);

-- REVIEW: source migration V20250106151900 used
--   CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dristi_hearing_tenant_id ON dristi_hearing (tenantId);
-- CONCURRENTLY cannot run inside a transaction block, so it is not safe to
-- include verbatim in a single-transaction fresh-install script. The
-- non-concurrent equivalent is used below; it is functionally identical
-- for a brand-new/empty table.
CREATE INDEX IF NOT EXISTS idx_dristi_hearing_tenant_id ON dristi_hearing (tenantId);

CREATE INDEX IF NOT EXISTS idx_dristi_hearing_document_hearing_id ON dristi_hearing_document (hearingId);
CREATE INDEX IF NOT EXISTS idx_dristi_hearing_document_filestore_id ON dristi_hearing_document (fileStore);
