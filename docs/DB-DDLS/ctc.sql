-- =====================================================================
-- Consolidated DDL for ctc (fresh-install reference)
-- Generated from Flyway migrations in db/migration/main
-- This script represents the FINAL schema state after applying all
-- versioned migrations below, in order. It is a reference/documentation
-- script for provisioning a new environment quickly — it does NOT
-- replace the existing Flyway migration history. Deployed environments
-- must continue to use the original versioned migration files.
--
-- Source files reviewed (7):
--   V20260227111500__ctc_applications__ddl.sql
--   V20260306121200__ctc_application__ddl.sql
--   V20260306163000__add_cnr_number_to_ctc_application.sql
--   V20260306180000__rename_casebundle_add_casebundles.sql
--   V20260309163800__add_documents_to_ctc_application.sql
--   V20260311180000__add_date_of_application_approval_to_ctc_application.sql
--   V20260312203600__add_payment_receipt_to_ctc_application.sql
-- =====================================================================

-- ==== Sequences ====
-- (none)

-- ==== Tables ====

-- dristi_ctc_applications: baseline created by V20260227111500, then
--   - workflow column dropped (V20260306121200)
--   - cnr_number added (V20260306163000)
--   - case_bundle_nodes renamed to selected_case_bundle, case_bundles added (V20260306180000)
--   - documents added (V20260309163800)
--   - date_of_application_approval added (V20260311180000)
--   - payment_receipt added (V20260312203600)
CREATE TABLE IF NOT EXISTS dristi_ctc_applications (
    id VARCHAR(64) PRIMARY KEY,
    ctc_application_number VARCHAR(100) UNIQUE,
    tenant_id VARCHAR(64) NOT NULL,
    case_number VARCHAR(100) NOT NULL,
    case_title VARCHAR(100) NOT NULL,
    filing_number VARCHAR(100) NOT NULL,
    court_id VARCHAR(64) NOT NULL,
    applicant_name VARCHAR(255) NOT NULL,
    mobile_number VARCHAR(5000) NOT NULL,
    is_party_to_case BOOLEAN NOT NULL,
    party_designation VARCHAR(100),
    affidavit_document jsonb,
    selected_case_bundle jsonb,
    total_pages INTEGER,
    status VARCHAR(50),
    judge_comments TEXT,
    created_by VARCHAR(64),
    last_modified_by VARCHAR(64),
    created_time BIGINT,
    last_modified_time BIGINT,
    cnr_number VARCHAR(100),
    case_bundles jsonb,
    documents jsonb,
    date_of_application_approval BIGINT,
    payment_receipt JSONB
);

-- ==== Indexes ====

CREATE INDEX IF NOT EXISTS idx_ctc_applications_tenant_id ON dristi_ctc_applications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ctc_applications_court_id ON dristi_ctc_applications(court_id);
CREATE INDEX IF NOT EXISTS idx_ctc_applications_case_number ON dristi_ctc_applications(case_number);
CREATE INDEX IF NOT EXISTS idx_ctc_applications_filing_number ON dristi_ctc_applications(filing_number);
CREATE INDEX IF NOT EXISTS idx_ctc_applications_status ON dristi_ctc_applications(status);
CREATE INDEX IF NOT EXISTS idx_ctc_applications_created_time ON dristi_ctc_applications(created_time);
CREATE INDEX IF NOT EXISTS idx_ctc_applications_cnr_number ON dristi_ctc_applications(cnr_number);
