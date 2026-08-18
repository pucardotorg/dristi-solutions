-- =====================================================================
-- Consolidated DDL for e-sign-svc (fresh-install reference)
-- Generated from Flyway migrations in db/migration/main
-- This script represents the FINAL schema state after applying all
-- versioned migrations below, in order. It is a reference/documentation
-- script for provisioning a new environment quickly — it does NOT
-- replace the existing Flyway migration history. Deployed environments
-- must continue to use the original versioned migration files.
--
-- Source files reviewed (4):
--   V20241017153200__esign__ddl.sql
--   V20241018135800__esign_audit__ddl.sql
--   V20241126152800__esign__ddl.sql
--   V20260219184600__esign__ddl.sql
-- =====================================================================

-- ==== Sequences ====
-- (none)

-- ==== Tables ====

CREATE TABLE dristi_esign_pdf (
    id varchar(64) NOT NULL PRIMARY KEY,
    tenantId varchar(1000) NOT NULL,
    filestoreId varchar(64) NULL,
    signPlaceHolder VARCHAR(64),
    signedFilestoreId varchar(64) NULL,
    pageModule varchar(64) NULL,
    authType varchar(64) NULL,
    createdBy VARCHAR(64) NULL,
    lastModifiedBy VARCHAR(64) NULL,
    createdTime INT8 NULL,
    lastModifiedTime INT8 NULL,
    -- added as `filepath` by V20241126152800, renamed to unsigned_filepath by V20260219184600
    unsigned_filepath varchar(1000),
    request_blob JSONB NULL,
    response_blob JSONB NULL,
    status VARCHAR(20)
);

-- ==== Indexes ====
-- (none)
