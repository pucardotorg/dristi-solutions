-- =====================================================================
-- Consolidated DDL for health-dashboard (fresh-install reference)
-- Generated from Flyway migrations in db/migration/main
-- This script represents the FINAL schema state after applying all
-- versioned migrations below, in order. It is a reference/documentation
-- script for provisioning a new environment quickly — it does NOT
-- replace the existing Flyway migration history. Deployed environments
-- must continue to use the original versioned migration files.
--
-- Source files reviewed (1):
--   V20260708111__create_service_health_status.sql
--
-- Note: the source migration also seeds eg_service_health with 4 rows
-- (ESIGN, SMS, TREASURY, ICOPS) via INSERT statements. This is DML/seed
-- data, not schema, and per the DDL-only scope of this consolidation it
-- is intentionally omitted below.
-- =====================================================================

-- ==== Sequences ====
-- (none created explicitly; the BIGSERIAL id columns below implicitly
--  create and own sequences "eg_service_health_id_seq" and
--  "eg_service_health_status_id_seq")

-- ==== Tables ====

CREATE TABLE IF NOT EXISTS eg_service_health  (
    id           BIGSERIAL PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL,
    service_url  VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS eg_service_health_status (
    id                BIGSERIAL PRIMARY KEY,
    service_id        BIGINT        NOT NULL,
    last_status       VARCHAR(10)   NOT NULL DEFAULT 'UNKNOWN',
    last_updated_time BIGINT,
    response_time_ms  BIGINT,
    message           VARCHAR(2000)
);

-- ==== Indexes ====

CREATE INDEX IF NOT EXISTS idx_eg_service_health_status_service_id
    ON eg_service_health_status (service_id);
