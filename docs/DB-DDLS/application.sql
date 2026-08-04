-- =====================================================================
-- Consolidated DDL for application (fresh-install reference)
-- Generated from Flyway migrations in db/migration/main
-- This script represents the FINAL schema state after applying all
-- versioned migrations below, in order. It is a reference/documentation
-- script for provisioning a new environment quickly — it does NOT
-- replace the existing Flyway migration history. Deployed environments
-- must continue to use the original versioned migration files.
--
-- Source files reviewed (15):
--   V20240514192045__application__ddl.sql
--   V20240718142117__application__ddl.sql
--   V20240727142117__application__ddl.sql
--   V20240729163000__application__ddl.sql
--   V20240825163000__application__ddl.sql
--   V20240913122500__application__ddl.sql
--   V20240916163800__application__ddl.sql
--   V20240927110535__application__ddl.sql
--   V20241114110535__application__ddl.sql
--   V20250106151400__application__ddl.sql
--   V20250113122200__application__ddl.sql
--   V20250204200000__application__add_office_advocate_user_uuid.sql
--   V20250508122200__application__ddl.sql
--   V20250523174800__application__ddl.sql
--   V20260210130715__application.ddl.sql
--
-- Notes on evolution:
--   - dristi_application_statute_section was created in
--     V20240514192045 and fully DROPPED in V20240718142117 (its data
--     folded into dristi_application.statuteSection jsonb). It is
--     therefore omitted from this consolidated script.
--   - dristi_application.createdDate started as varchar(64) NOT NULL
--     and was dropped/re-added as int8 NULL in V20240727142117.
--   - dristi_application.comment started as varchar(64) NULL and was
--     dropped/re-added as jsonb in V20240729163000.
--   - dristi_application.officeAdvocateUserUuid (added in
--     V20250204200000) was renamed to asUser in V20260210130715.
-- =====================================================================

-- ==== Sequences ====

CREATE SEQUENCE seq_dristi_application
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- ==== Tables ====

CREATE TABLE dristi_application (
    id                       varchar(64) NOT NULL PRIMARY KEY,
    tenantId                 varchar(64) NULL,
    caseId                   varchar(64) NOT NULL,
    filingNumber             varchar(64) NULL,
    cnrNumber                varchar(64) NULL,
    referenceId              varchar(64) NULL,
    createdDate              int8 NULL,
    applicationCreatedBy     varchar(64) NULL,
    onBehalfOf               JSONB NULL,
    applicationType          varchar(64) NULL,
    applicationNumber        varchar(64) NULL,
    issuedBy                 JSONB NULL,
    status                   varchar(64) NOT NULL,
    comment                  jsonb NULL,
    isActive                 bool NOT NULL,
    documents                varchar(64) NULL,
    additionalDetails        JSONB NULL,
    createdBy                varchar(64) NULL,
    lastModifiedBy           varchar(64) NULL,
    createdTime              int8 NULL,
    lastModifiedTime         int8 NULL,
    statuteSection           jsonb NULL,
    reason_for_application   varchar(64) NULL,
    application_details      jsonb NULL,
    cmpNumber                varchar(64) NULL,
    applicationCMPNumber     varchar(64) NULL,
    asUser                   VARCHAR(64) NULL,
    courtId                  VARCHAR(64) NULL
);

CREATE TABLE dristi_application_document (
    id               varchar(64) NOT NULL PRIMARY KEY,
    fileStore        varchar(64) NULL,
    documentUid      varchar(64) NULL,
    documentType     varchar(64) NULL,
    application_id   varchar(64) NULL,
    additionalDetails JSONB NULL,
    documentOrder    int8 NULL,
    isActive         bool DEFAULT TRUE
);

-- ==== Indexes ====

CREATE INDEX IF NOT EXISTS idx_dristi_application_filing_number ON dristi_application(filingNumber);
CREATE INDEX IF NOT EXISTS idx_dristi_application_cnr_number ON dristi_application(cnrNumber);
CREATE INDEX IF NOT EXISTS idx_dristi_application_application_type ON dristi_application(applicationType);
CREATE INDEX IF NOT EXISTS idx_drist_application_application_number ON dristi_application(applicationNumber);
CREATE INDEX IF NOT EXISTS idx_dristi_application_status ON dristi_application(status);
CREATE INDEX IF NOT EXISTS idx_dristi_application_owner ON dristi_application(createdBy);
-- REVIEW: original migration V20250106151400 used CREATE INDEX CONCURRENTLY,
-- which cannot run inside a transaction block. Using a plain CREATE INDEX here
-- for fresh-install convenience; run CONCURRENTLY manually if applying online
-- against a live database.
CREATE INDEX IF NOT EXISTS idx_dristi_application_tenant_id ON dristi_application(tenantId);
CREATE INDEX idx_dristi_application_courtid ON dristi_application(courtId);

CREATE INDEX IF NOT EXISTS idx_dristi_application_document_application_id ON dristi_application_document(application_id);
