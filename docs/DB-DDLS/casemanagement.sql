-- =====================================================================
-- Consolidated DDL for casemanagement (fresh-install reference)
-- Generated from Flyway migrations in db/migration/main
-- This script represents the FINAL schema state after applying all
-- versioned migrations below, in order. It is a reference/documentation
-- script for provisioning a new environment quickly — it does NOT
-- replace the existing Flyway migration history. Deployed environments
-- must continue to use the original versioned migration files.
--
-- Source files reviewed (3):
--   V202400714144420__reference_filestore__ddl.sql
--   V202411087890789__casebundle__ddl.sql
--   V202411137890779__caseBulkbundle__ddl.sql
-- =====================================================================

-- ==== Sequences ====
-- (none)

-- ==== Tables ====

CREATE TABLE referenceid_filestore_mapper (
    referenceId VARCHAR(64) NOT NULL PRIMARY KEY,
    jsonResponse JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS case_bundle_tracker(
    id character varying(64) NOT NULL PRIMARY KEY,
    startTime bigint NOT NULL,
    endTime bigint NOT NULL,
    pageCount bigint NOT NULL,
    errorLog character varying(64),
    createdBy character varying(64) NOT NULL,
    lastModifiedBy character varying(64) NOT NULL,
    createdTime bigint NOT NULL,
    lastModifiedTime bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS case_bundle_bulk_tracker(
    id character varying(64) NOT NULL PRIMARY KEY,
    startTime bigint NOT NULL,
    endTime bigint NOT NULL,
    caseCount bigint NOT NULL
);

-- ==== Indexes ====
-- (none)
