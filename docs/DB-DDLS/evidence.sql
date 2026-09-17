-- =====================================================================
-- Consolidated DDL for evidence (fresh-install reference)
-- Generated from Flyway migrations in db/migration/main
-- This script represents the FINAL schema state after applying all
-- versioned migrations below, in order. It is a reference/documentation
-- script for provisioning a new environment quickly — it does NOT
-- replace the existing Flyway migration history. Deployed environments
-- must continue to use the original versioned migration files.
--
-- Source files reviewed (16):
--   V20240403110535__evidence__ddl.sql
--   V20240620113000__evidence__ddl.sql
--   V20240624113000__evidence__ddl.sql
--   V20240712110535__evidence__ddl.sql
--   V20240726123000__evidence__ddl.sql
--   V20240727110535__evidence__ddl.sql
--   V20240913104735__evidence__ddl.sql
--   V20241110144000__evidence__ddl.sql
--   V20250204200000__evidence__add_office_advocate_user_uuid.sql
--   V20250325145400__evidence__ddl.sql
--   V20250508145400__evidence__ddl.sql
--   V20250722174500__evidence_description__ddl.sql
--   V20250801103000__evidence__ddl.sql
--   V20250804125400__evidence__ddl.sql
--   V20250902075500__evidence__ddl.sql
--   V20260211210724__evidence__ddl.sql
--
-- NOTE: dristi_evidence_document and dristi_evidence_comment were created
-- in V20240403110535 but both were subsequently DROPPED in
-- V20240726123000 (DROP TABLE IF EXISTS ...). They are intentionally
-- omitted from this consolidated script.
-- =====================================================================

-- ==== Sequences ====

CREATE SEQUENCE SEQ_DRISTI_ARTIFACT
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE SEQ_DOC_COMPLAINANT
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE SEQ_DOC_ACCUSED
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE SEQ_DOC_COURT
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE SEQ_WITNESS_COMPLAINANT
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE SEQ_WITNESS_ACCUSED
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE SEQ_WITNESS_COURT
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- ==== Tables ====

CREATE TABLE dristi_evidence_artifact (
    id                      VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantId                varchar(1000) NOT NULL,
    artifactNumber          VARCHAR(64) NULL,
    evidenceNumber          VARCHAR(64) NULL,
    externalRefNumber       VARCHAR(128) NULL,
    caseId                  varchar(64) NULL,
    application             VARCHAR(255) NULL,
    hearing                 VARCHAR(255) NULL,
    orders                  VARCHAR(255) NULL,
    mediaType               VARCHAR(255) NULL,
    artifactType            VARCHAR(255) NULL,
    sourceID                VARCHAR(255) NULL,
    sourceName              VARCHAR(255) NULL,
    createdDate             int8 NULL,                  -- dropped and re-added as int8 in V20240727110535
    isActive                bool NULL,
    status                  VARCHAR(64),
    description             VARCHAR NULL,                -- VARCHAR(64) -> VARCHAR(2000) (V20250722174500) -> VARCHAR (V20250902075500)
    artifactDetails         jsonb NULL,
    additionalDetails       jsonb NULL,
    createdBy               varchar(64) NULL,
    lastModifiedBy          varchar(64) NULL,
    createdTime             int8 NULL,
    lastModifiedTime        int8 NULL,
    sourceType              VARCHAR(64) NULL,            -- added V20240620113000
    isEvidence              bool NULL,                   -- added V20240624113000
    filingNumber            VARCHAR(64) NULL,             -- added V20240712110535
    comments                JSONB NULL,                   -- added V20240726123000
    file                    JSONB NULL,                   -- added V20240726123000
    applicableTo            JSONB NULL,                   -- originally VARCHAR(255) in V20240403110535; dropped and re-added as JSONB in V20240726123000
    isVoid                  bool NULL,                    -- added V20241110144000
    reason                  VARCHAR(255) NULL,            -- added V20241110144000
    filingType              VARCHAR(255) NULL,            -- added V20241110144000
    asUser                  VARCHAR(64) NULL,             -- added as officeAdvocateUserUuid in V20250204200000; renamed to asUser in V20260211210724
    publishedDate           int8 NULL,                    -- added V20250325145400
    courtId                 VARCHAR(64) NULL,             -- added V20250508145400
    shortenedUrl            VARCHAR(255) NULL,            -- added V20250722174500
    witnessMobileNumbers    jsonb NULL,                   -- added V20250722174500
    witnessEmails           jsonb NULL,                   -- added V20250722174500
    seal                    JSONB NULL,                   -- added V20250801103000
    evidenceMarkedStatus    VARCHAR(255) NULL,            -- added V20250801103000
    isEvidenceMarkedFlow    bool NULL,                    -- added V20250801103000
    tag                     VARCHAR(255) NULL             -- added V20250804125400
);

-- ==== Indexes ====

CREATE INDEX IF NOT EXISTS idx_dristi_evidence_artifact_artifact_number ON dristi_evidence_artifact(artifactNumber);
CREATE INDEX IF NOT EXISTS idx_dristi_evidence_artifact_case_id ON dristi_evidence_artifact(caseId);
CREATE INDEX IF NOT EXISTS idx_dristi_evidence_artifact_application ON dristi_evidence_artifact(application);
CREATE INDEX IF NOT EXISTS idx_dristi_evidence_artifact_hearing ON dristi_evidence_artifact(hearing);
CREATE INDEX IF NOT EXISTS idx_dristi_evidence_artifact_orders ON dristi_evidence_artifact(orders);
CREATE INDEX IF NOT EXISTS idx_dristi_evidence_artifact_artifact_type ON dristi_evidence_artifact(artifactType);
CREATE INDEX IF NOT EXISTS idx_dristi_evidence_status ON dristi_evidence_artifact(status);
CREATE INDEX IF NOT EXISTS idx_dristi_evidence_owner ON dristi_evidence_artifact(createdBy);
CREATE INDEX idx_evidence_artifact_courtid ON dristi_evidence_artifact(courtId);
