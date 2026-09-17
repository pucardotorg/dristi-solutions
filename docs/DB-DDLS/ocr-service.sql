-- =====================================================================
-- Consolidated DDL for ocr-service (fresh-install reference)
-- Generated from Flyway migrations in db/migration/main
-- This script represents the FINAL schema state after applying all
-- versioned migrations below, in order. It is a reference/documentation
-- script for provisioning a new environment quickly — it does NOT
-- replace the existing Flyway migration history. Deployed environments
-- must continue to use the original versioned migration files.
--
-- Source files reviewed (2):
--   V20240807145530__ocr_ddl.sql
--   V20241011201700__ocr_code_ddl.sql
-- =====================================================================

-- ==== Sequences ====
-- (none)

-- ==== Tables ====

CREATE TABLE dristi_ocr (
    id               varchar(64) NOT NULL PRIMARY KEY,
    tenantId         varchar(64) NOT NULL,
    filingNumber     varchar(64),
    fileStoreId      varchar(64),
    documentType     varchar(64),
    message          varchar(1000),
    extractedData    JSONB NULL,
    code             varchar(64)
);

-- ==== Indexes ====
-- (none beyond the implicit primary key index above)
