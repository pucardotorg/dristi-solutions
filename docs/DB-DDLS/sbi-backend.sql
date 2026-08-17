-- =====================================================================
-- Consolidated DDL for sbi-backend (fresh-install reference)
-- Generated from Flyway migrations in db/migration/main
-- This script represents the FINAL schema state after applying all
-- versioned migrations below, in order. It is a reference/documentation
-- script for provisioning a new environment quickly — it does NOT
-- replace the existing Flyway migration history. Deployed environments
-- must continue to use the original versioned migration files.
--
-- Source files reviewed (6):
--   V20240903134500__sbi_backend_ddl.sql
--   V20240904134500__sbi_backend_ddl.sql
--   V20240904135300__sbi_backend_ddl.sql
--   V20240904152900__sbi_backend_ddl.sql
--   V20240923152900__sbi_backend_ddl.sql
--   V20240928092800__sbi_backend_ddl.sql
-- =====================================================================

-- ==== Sequences ====
-- (none)

-- ==== Tables ====

-- transaction_details: baseline created by V20240903134500, then
--   - success_url, fail_url dropped; tenant_id added (V20240904134500)
--   - bill_id added as VARCHAR(30) (V20240904135300)
--   - total_due, business_service, service_number, payer_name, paid_by,
--     mobile_number added (V20240904152900)
--   - amount_details added (V20240923152900)
--   - bill_id widened to VARCHAR(64) (V20240928092800)
CREATE TABLE transaction_details (
    merchant_id VARCHAR(30),
    operating_mode VARCHAR(30),
    merchant_country VARCHAR(30),
    merchant_currency VARCHAR(30),
    posting_amount NUMERIC(12,2),
    other_details VARCHAR(255),
    aggregator_id VARCHAR(30),
    merchant_order_number VARCHAR(30) PRIMARY KEY,
    merchant_customer_id VARCHAR(30),
    pay_mode VARCHAR(30),
    access_medium VARCHAR(30),
    transaction_source VARCHAR(30),
    created_by varchar(64) NULL,
    last_modified_by varchar(64) NULL,
    created_time int8 NULL,
    last_modified_time int8 NULL,
    transaction_status varchar(64) NULL,
    sbi_epay_ref_id varchar(64) NULL,
    reason varchar(1000) NULL,
    bank_code varchar(64) NULL,
    bank_reference_number varchar(64) NULL,
    transaction_date varchar(64) NULL,
    cin varchar(64) NULL,
    total_fee_gst NUMERIC(12,2),
    row_number int4 NULL,
    ref1 varchar(64) NULL,
    ref2 varchar(64) NULL,
    ref3 varchar(64) NULL,
    ref4 varchar(64) NULL,
    ref5 varchar(64) NULL,
    ref6 varchar(64) NULL,
    ref7 varchar(64) NULL,
    ref8 varchar(64) NULL,
    ref9 varchar(64) NULL,
    tenant_id VARCHAR(30),
    bill_id VARCHAR(64),
    total_due NUMERIC(12,2),
    business_service VARCHAR(64),
    service_number VARCHAR(64),
    payer_name VARCHAR(64),
    paid_by VARCHAR(64),
    mobile_number VARCHAR(30),
    amount_details jsonb NULL
);

-- ==== Indexes ====
-- (none beyond primary key declared inline above)
