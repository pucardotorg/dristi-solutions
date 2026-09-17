-- =====================================================================
-- Consolidated DDL for digitalized-documents (fresh-install reference)
-- Generated from Flyway migrations in db/migration/main
-- This script represents the FINAL schema state after applying all
-- versioned migrations below, in order. It is a reference/documentation
-- script for provisioning a new environment quickly — it does NOT
-- replace the existing Flyway migration history. Deployed environments
-- must continue to use the original versioned migration files.
--
-- Source files reviewed (1):
--   V20251125202000__digitalzeddocuments__ddl.sql
-- =====================================================================

-- ==== Sequences ====
-- (none — primary key is an application-supplied VARCHAR id)

-- ==== Tables ====

CREATE TABLE IF NOT EXISTS digitalized_document (
    id                               VARCHAR(64) PRIMARY KEY,
    type                             VARCHAR(64) NOT NULL,
    document_number                  VARCHAR(64),
    case_id                          VARCHAR(64),
    case_filing_number               VARCHAR(64),
    order_number                     VARCHAR(64),
    order_item_id                    VARCHAR(64),
    shortened_url                    VARCHAR(64),
    court_id                         VARCHAR(64),
    plea_details                     JSONB,
    examination_of_accused_details   JSONB,
    mediation_details                JSONB,
    additional_details               JSONB,
    status                           VARCHAR(64),
    documents                        JSONB,
    tenant_id                        VARCHAR(64) NOT NULL,
    created_by                       VARCHAR(64),
    created_time                     int8,
    last_modified_by                 VARCHAR(64),
    last_modified_time               int8
);

-- ==== Indexes ====

CREATE INDEX IF NOT EXISTS idx_digitalized_document_type ON digitalized_document(type);
CREATE INDEX IF NOT EXISTS idx_digitalized_document_case_id ON digitalized_document(case_id);
CREATE INDEX IF NOT EXISTS idx_digitalized_document_case_filing_number ON digitalized_document(case_filing_number);
CREATE INDEX IF NOT EXISTS idx_digitalized_document_tenant_id ON digitalized_document(tenant_id);
CREATE INDEX IF NOT EXISTS idx_digitalized_document_status ON digitalized_document(status);

-- ==== Foreign Keys (added post-table-creation to resolve ordering) ====
-- (none)
