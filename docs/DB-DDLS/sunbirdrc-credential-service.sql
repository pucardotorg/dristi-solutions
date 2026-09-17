-- =====================================================================
-- Consolidated DDL for sunbirdrc-credential-service (fresh-install reference)
-- Generated from Flyway migrations in db/migration/main
-- This script represents the FINAL schema state after applying all
-- versioned migrations below, in order. It is a reference/documentation
-- script for provisioning a new environment quickly — it does NOT
-- replace the existing Flyway migration history. Deployed environments
-- must continue to use the original versioned migration files.
--
-- Source files reviewed (2):
--   V20240320104912__uuid_vcid_mapper_ddl.sql
--   V20240602104913__entity_id_vcid_mapper_ddl.sql
-- =====================================================================

-- ==== Sequences ====
-- (none)

-- ==== Tables ====

CREATE TABLE uuid_vcid_mapper (
    uuid character varying(64),
    vcid character varying(64),
    createdBy character varying(64),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uuid_vcid_mapper_pkey PRIMARY KEY (uuid)
);

CREATE TABLE entity_id_vcid_mapper (
    entityid character varying(64),
    vcid character varying(64),
    createdBy character varying(128),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT entity_id_vcid_mapper_pkey PRIMARY KEY (entityid)
);

-- ==== Indexes ====
-- (none beyond primary keys declared inline above)
