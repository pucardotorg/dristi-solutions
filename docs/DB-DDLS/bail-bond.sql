-- =====================================================================
-- Consolidated DDL for bail-bond (fresh-install reference)
-- Generated from Flyway migrations in db/migration/main
-- This script represents the FINAL schema state after applying all
-- versioned migrations below, in order. It is a reference/documentation
-- script for provisioning a new environment quickly — it does NOT
-- replace the existing Flyway migration history. Deployed environments
-- must continue to use the original versioned migration files.
--
-- Source files reviewed (4):
--   V20250711193000__bail__ddl.sql
--   V20251105143600__surety__index__ddl.sql
--   V20251120__sureity__email__ddl.sql
--   V20260210180825__asuser__ddl.sql
--
-- NOTE: V20250711193000 opens with DROP TABLE IF EXISTS statements for
-- dristi_bail / dristi_surety / dristi_bail_document as a defensive
-- pre-create guard. On a fresh database these are no-ops, so they are
-- intentionally omitted from this consolidated script.
-- =====================================================================

-- ==== Sequences ====
-- (none)

-- ==== Tables ====

CREATE TABLE dristi_bail (
    id varchar(36) NOT NULL PRIMARY KEY,
    tenant_id varchar(64) NOT NULL,
    case_id varchar(36), -- FK to dristi_case
    bail_type varchar(64),
    bail_amount numeric(15,2),
    bail_status varchar(64),
    court_id varchar(64), -- Establishment ID for the court
    case_title varchar(512), -- Title of the case
    case_number varchar(64), -- Case number
    cnr_number varchar(64), -- CNR number of the case
    filing_number varchar(64), -- Filing number of the case
    case_type varchar(64), -- Type of the case (ST, CMP)
    litigant_id varchar(36), -- Identifier for the litigant
    litigant_name varchar(256), -- Name of the litigant
    litigant_father_name varchar(256), -- Father name of the litigant
    litigant_signed boolean, -- Whether the litigant has signed the bail
    litigant_mobile_number varchar(256), -- Mobile number of the litigant
    shortened_url varchar(512), -- Shortened URL for the bail bond
    bail_id varchar(64), -- Id gen formatted bail id
    additional_details jsonb,
    is_active bool DEFAULT TRUE,
    created_by varchar(36),
    last_modified_by varchar(36),
    created_time int8,
    last_modified_time int8,
    as_user VARCHAR(64) -- added by V20260210180825
);

CREATE TABLE dristi_surety (
    id varchar(36) NOT NULL PRIMARY KEY,
    tenant_id varchar(64) NOT NULL,
    bail_id varchar(36) NOT NULL, -- FK to dristi_bail
    case_id varchar(36), -- FK to dristi_case
    surety_name varchar(256),
    surety_father_name varchar(256),
    surety_signed boolean,
    surety_mobile_number varchar(256),
    surety_email varchar(256), -- widened from varchar(64) by V20251120
    surety_approved boolean,
    surety_address jsonb,
    additional_details jsonb,
    is_active bool DEFAULT TRUE,
    created_by varchar(36),
    last_modified_by varchar(36),
    created_time int8,
    last_modified_time int8,
    index int8 NULL -- added by V20251105143600
);

CREATE TABLE dristi_bail_document (
    id varchar(36) NOT NULL PRIMARY KEY,
    tenant_id varchar(64) NOT NULL,
    bail_id varchar(36) NOT NULL, -- FK to dristi_bail
    filestore_id varchar(64),
    document_uid varchar(64),
    document_name varchar(128),
    document_type varchar(64),
    additional_details jsonb,
    is_active bool DEFAULT TRUE,
    created_by varchar(36),
    last_modified_by varchar(36),
    created_time int8,
    last_modified_time int8
);

CREATE TABLE dristi_surety_document (
    id varchar(36) NOT NULL PRIMARY KEY,
    tenant_id varchar(64) NOT NULL,
    surety_id varchar(36) NOT NULL, -- FK to dristi_surety
    filestore_id varchar(64),
    document_uid varchar(64),
    document_name varchar(128),
    document_type varchar(64),
    additional_details jsonb,
    is_active bool DEFAULT TRUE,
    created_by varchar(36),
    last_modified_by varchar(36),
    created_time int8,
    last_modified_time int8
);

-- ==== Indexes ====

CREATE INDEX idx_dristi_bail_case_id ON dristi_bail(case_id);
CREATE INDEX idx_dristi_bail_tenant_id ON dristi_bail(tenant_id);

CREATE INDEX idx_dristi_surety_bail_id ON dristi_surety(bail_id);
CREATE INDEX idx_dristi_surety_tenant_id ON dristi_surety(tenant_id);

CREATE INDEX idx_dristi_bail_document_bail_id ON dristi_bail_document(bail_id);
CREATE INDEX idx_dristi_bail_document_tenant_id ON dristi_bail_document(tenant_id);

CREATE INDEX idx_dristi_surety_document_surety_id ON dristi_surety_document(surety_id);
CREATE INDEX idx_dristi_surety_document_tenant_id ON dristi_surety_document(tenant_id);
