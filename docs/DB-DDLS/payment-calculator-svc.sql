-- =====================================================================
-- Consolidated DDL for payment-calculator-svc (fresh-install reference)
-- Generated from Flyway migrations in db/migration/main
-- This script represents the FINAL schema state after applying all
-- versioned migrations below, in order. It is a reference/documentation
-- script for provisioning a new environment quickly — it does NOT
-- replace the existing Flyway migration history. Deployed environments
-- must continue to use the original versioned migration files.
--
-- Source files reviewed (2):
--   V20240611165500__ph_postal_hub_ddl.sql
--   V20240916153000__ph_postal_hub_edit_ddl.sql
--
-- NOTE: despite the service name, the only DDL present in this
-- migration folder defines the POSTAL_HUB table (file names carry the
-- "ph_postal_hub" prefix). This is reproduced as-is from the source
-- migrations; no other tables exist in this folder's history.
-- =====================================================================

-- ==== Sequences ====
-- (none)

-- ==== Tables ====

CREATE TABLE POSTAL_HUB (
    hub_id                  character varying(64),
    pincode                 character varying(64),
    name                    character varying(64),
    classification          character varying(64),
    created_by              character varying(64),
    created_time            bigint,
    last_modified_by        character varying(64),
    last_modified_time      bigint,
    row_version              bigint,
    tenant_id               character varying(64),

    CONSTRAINT uk_postal_hub_id PRIMARY KEY (hub_id),
    CONSTRAINT uk_postal_hub_pin UNIQUE (pincode)
);

-- ==== Indexes ====
-- (none beyond the implicit indexes backing the constraints above)
