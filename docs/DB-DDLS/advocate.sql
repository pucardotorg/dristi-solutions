-- =====================================================================
-- Consolidated DDL for advocate (fresh-install reference)
-- Generated from Flyway migrations in db/migration/main
-- This script represents the FINAL schema state after applying all
-- versioned migrations below, in order. It is a reference/documentation
-- script for provisioning a new environment quickly — it does NOT
-- replace the existing Flyway migration history. Deployed environments
-- must continue to use the original versioned migration files.
--
-- Source files reviewed (4):
--   V20240313110535__ADVClerk_ddl.sql
--   V20240403110535__advocate__ddl.sql
--   V20240913121500__advocate__ddl.sql
--   V20250106150900__advocate__ddl.sql
-- =====================================================================

-- ==== Sequences ====
-- (none)

-- ==== Tables ====

CREATE TABLE dristi_advocate_clerk (
    id VARCHAR(64),
    tenantId VARCHAR(128),
    applicationNumber VARCHAR(64),
    status VARCHAR(64),
    individualId VARCHAR(36),
    isActive BOOLEAN DEFAULT true,
    createdBy varchar(64) NULL,
    stateRegnNumber varchar(64) NULL,
    lastModifiedBy varchar(64) NULL,
    createdTime int8 NULL,
    lastModifiedTime int8 NULL,
    additionalDetails JSONB,
    CONSTRAINT pk_advocate_clerk PRIMARY KEY (id)
);

CREATE TABLE dristi_advocate (
    id varchar(64) NOT NULL PRIMARY KEY,
    tenantId varchar(1000) NOT NULL,
    applicationNumber varchar(64) NULL,
    status VARCHAR(64),
    barRegistrationNumber varchar(64) NULL,
    advocateType varchar(64) NULL,
    organisationID varchar(64) NULL,
    individualId varchar(64) NULL,
    isActive bool NULL,
    additionalDetails jsonb NULL,
    createdBy varchar(64) NULL,
    lastModifiedBy varchar(64) NULL,
    createdTime int8 NULL,
    lastModifiedTime int8 NULL
);

CREATE TABLE dristi_document (
    id varchar(64) NOT NULL PRIMARY KEY,
    fileStore varchar(64) NULL,
    documentUid varchar(64) NULL,
    documentType varchar(64) NULL,
    advocateId varchar(64) NULL,
    clerk_id varchar(64) NULL,
    additionalDetails JSONB NULL
);

-- ==== Indexes ====

CREATE INDEX IF NOT EXISTS idx_dristi_advocate_application_number ON dristi_advocate(applicationNumber);
CREATE INDEX IF NOT EXISTS idx_dristi_advocate_bar_registration_number ON dristi_advocate(barRegistrationNumber);
CREATE INDEX IF NOT EXISTS idx_dristi_advocate_individual_id ON dristi_advocate(individualId);
CREATE INDEX IF NOT EXISTS idx_dristi_advocate_tenant_id ON dristi_advocate(tenantId);

CREATE INDEX IF NOT EXISTS idx_dristi_advocate_clerk_application_number ON dristi_advocate_clerk(applicationNumber);
CREATE INDEX IF NOT EXISTS idx_dristi_advocate_clerk_individual_id ON dristi_advocate_clerk(individualId);
CREATE INDEX IF NOT EXISTS idx_dristi_advocate_clerk_state_regn_number ON dristi_advocate_clerk(stateRegnNumber);
CREATE INDEX IF NOT EXISTS idx_dristi_advocate_clerk_tenant_id ON dristi_advocate_clerk(tenantId);

CREATE INDEX IF NOT EXISTS idx_dristi_document_advocate_id ON dristi_document(advocateId);
CREATE INDEX IF NOT EXISTS idx_dristi_document_clerk_id ON dristi_document(clerk_id);

-- NOTE: original migration V20250106150900 used CREATE INDEX CONCURRENTLY.
-- CONCURRENTLY cannot run inside a transaction block; kept as a plain
-- CREATE INDEX here since this script may be run as a single batch.
