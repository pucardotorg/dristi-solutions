-- =====================================================================
-- Consolidated DDL for lock-svc (fresh-install reference)
-- Generated from Flyway migrations in db/migration/main
-- This script represents the FINAL schema state after applying all
-- versioned migrations below, in order. It is a reference/documentation
-- script for provisioning a new environment quickly — it does NOT
-- replace the existing Flyway migration history. Deployed environments
-- must continue to use the original versioned migration files.
--
-- Source files reviewed (3):
--   V20250117154400__lock__ddl.sql
--   V20250120192500__lock__ddl.sql
--   V20250123121800__lock__ddl.sql
-- =====================================================================

-- ==== Sequences ====
-- (none)

-- ==== Tables ====

CREATE TABLE lock (
    id                VARCHAR(64) PRIMARY KEY,
    tenantId          VARCHAR(64),
    lockDate          BIGINT,
    individualId      VARCHAR(64),
    isLocked          BOOLEAN,
    lockReleaseTime   BIGINT,
    uniqueId          VARCHAR(64),
    createdBy         VARCHAR(64) NULL,
    lastModifiedBy    VARCHAR(64) NULL,
    createdTime       int8 NULL,
    lastModifiedTime  int8 NULL,
    -- added by V20250120192500
    locktype          varchar(64),
    -- added by V20250123121800
    entity            varchar(64),
    userId            varchar(64),
    CONSTRAINT unique_key_tenantid_constraint UNIQUE (tenantId, uniqueId)
);

-- ==== Indexes ====

CREATE INDEX idx_unique_tenant ON lock (uniqueId, tenantId);
