-- =====================================================================
-- Consolidated DDL for openapi (fresh-install reference)
-- Generated from Flyway migrations in db/migration/main
-- This script represents the FINAL schema state after applying all
-- versioned migrations below, in order. It is a reference/documentation
-- script for provisioning a new environment quickly — it does NOT
-- replace the existing Flyway migration history. Deployed environments
-- must continue to use the original versioned migration files.
--
-- Source files reviewed (1):
--   V2020709230000__landing_page_notices__ddl.sql
-- =====================================================================

-- ==== Sequences ====
-- (none created explicitly; landing_page_notice.id below uses BIGSERIAL,
--  which implicitly creates and owns sequence "landing_page_notice_id_seq")

-- ==== Tables ====

CREATE TABLE landing_page_notice (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(100) NOT NULL,
    type VARCHAR(100),
    title VARCHAR(255) NOT NULL,
    language VARCHAR(50),
    valid_till int8,
    file_store_id VARCHAR(255),
    notice_number VARCHAR(100),
    published_date int8 NOT NULL,
    created_by VARCHAR(100),
    created_time int8,
    last_modified_by VARCHAR(100),
    last_modified_time int8
);

-- ==== Indexes ====
-- (none created explicitly beyond the primary key's implicit index)
