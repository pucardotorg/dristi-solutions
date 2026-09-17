-- =====================================================================
-- Consolidated DDL for treasury-backend (fresh-install reference)
-- Generated from Flyway migrations in db/migration/main
-- This script represents the FINAL schema state after applying all
-- versioned migrations below, in order. It is a reference/documentation
-- script for provisioning a new environment quickly — it does NOT
-- replace the existing Flyway migration history. Deployed environments
-- must continue to use the original versioned migration files.
--
-- Source files reviewed (10):
--   V20240708134500__treasury_backend_ddl.sql
--   V20240716134500__treasury_backend_ddl.sql
--   V20240717134500__treasury_backend_ddl.sql
--   V20240822134500__treasury_backend_ddl.sql
--   V20250402154000__treasury_backend_ddl.sql
--   V20250619154800__treasury_backend_ddl.sql
--   V20250625134000__treasury_backend_ddl.sql
--   V20260219161300__treasury_backend_ddl.sql
--   V20260414120000__treasury_backend_ddl.sql
--   V20260630120000__treasury_backend_ddl.sql
-- =====================================================================

-- ==== Sequences ====
-- (none)

-- ==== Tables ====

-- auth_sek_session_data
-- total_due originally NUMERIC(8,2), widened to NUMERIC(12,2) in V20240822134500.
CREATE TABLE auth_sek_session_data (
    auth_token              VARCHAR(64) PRIMARY KEY,
    decrypted_sek           VARCHAR(64),
    bill_id                 VARCHAR(64),
    business_service        VARCHAR(64),
    service_number          VARCHAR(64),
    total_due               NUMERIC(12,2),
    mobile_number           VARCHAR(64),
    paid_by                 VARCHAR(64),
    session_time            bigint,
    department_id           VARCHAR(64) NULL,
    request_blob            jsonb NULL,
    payment_status          VARCHAR(64),
    completion_source       VARCHAR(64),
    verification_timestamp  BIGINT,
    processed_status        VARCHAR(64),
    retry_count             INTEGER DEFAULT 0
);

-- treasury_payment_data
-- challan_timestamp / bank_timestamp originally TIMESTAMP, changed to
-- varchar(30) in V20240717134500 (USING ...::varchar(30)).
-- amount originally DECIMAL(10,2), widened to DECIMAL(12,2) in V20240822134500.
CREATE TABLE treasury_payment_data (
    department_id     VARCHAR(30) PRIMARY KEY,
    grn                VARCHAR(30),
    challan_timestamp  varchar(30),
    bank_ref_no        VARCHAR(30),
    bank_timestamp     varchar(30),
    bank_code          VARCHAR(30),
    status             VARCHAR(10),
    cin                VARCHAR(30),
    amount             DECIMAL(12, 2),
    party_name         VARCHAR(100),
    remark_status      VARCHAR(100),
    remarks            VARCHAR(255),
    file_store_id      VARCHAR(64),
    request_blob       jsonb NULL,
    response_blob      jsonb NULL
);

-- treasury_head_breakup_data
-- Column reSubmissionBreakDown (added V20250619154800) was renamed to
-- finalCalcPostResubmission in V20250625134000.
CREATE TABLE treasury_head_breakup_data (
    consumer_code                  VARCHAR(64) PRIMARY KEY,
    head_mapping                   JSONB,
    tenant_id                      VARCHAR(64),
    calculation                    JSONB,
    createdtime                    BIGINT,
    finalCalcPostResubmission      JSONB,
    lastModifiedTime               BIGINT,
    lastSubmissionConsumerCode     VARCHAR(64) NULL
);

-- ==== Indexes ====
-- (none defined in migration history)
