-- =====================================================================
-- Consolidated DDL for inportal-survey (fresh-install reference)
-- Generated from Flyway migrations in db/migration/main
-- This script represents the FINAL schema state after applying all
-- versioned migrations below, in order. It is a reference/documentation
-- script for provisioning a new environment quickly — it does NOT
-- replace the existing Flyway migration history. Deployed environments
-- must continue to use the original versioned migration files.
--
-- Source files reviewed (2):
--   V20251015115000__inportal_survey__ddl.sql
--   V20251023211000__inportal_survey_ddl.sql
-- =====================================================================

-- ==== Sequences ====
-- (none)

-- ==== Tables ====

-- inportal_survey_tracker
-- Column expiry_date (original name) was renamed to last_triggered_date
-- in V20251023211000.
CREATE TABLE inportal_survey_tracker (
    user_uuid            varchar(64) NOT NULL PRIMARY KEY,
    user_type            VARCHAR(64),
    tenant_id            VARCHAR(64),
    remind_me_later      BOOLEAN,
    last_triggered_date  int8,
    attempts             int8,
    created_by           varchar(64) NOT NULL,
    last_modified_by     varchar(64) NOT NULL,
    created_time         int8 NOT NULL,
    last_modified_time   int8 NOT NULL
);

CREATE TABLE inportal_survey_feedback (
    uuid                  varchar(64) NOT NULL PRIMARY KEY,
    rating                varchar(64),
    category              varchar(64),
    tenant_id             VARCHAR(64),
    feedback              varchar,
    created_by            varchar(64) NOT NULL,
    last_modified_by      varchar(64) NOT NULL,
    created_time          int8 NOT NULL,
    last_modified_time    int8 NOT NULL
);

-- ==== Indexes ====
-- (none beyond the implicit primary key indexes above)
