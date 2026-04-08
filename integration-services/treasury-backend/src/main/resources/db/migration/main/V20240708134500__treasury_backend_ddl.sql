CREATE TABLE auth_sek_session_data (
    auth_token VARCHAR(64) PRIMARY KEY,
    decrypted_sek VARCHAR(64),
    bill_id VARCHAR(64),
    business_service VARCHAR(64),
    service_number VARCHAR(64),
    total_due NUMERIC(8,2),
    mobile_number VARCHAR(64),
    paid_by VARCHAR(64),
    session_time bigint
);

ALTER TABLE auth_sek_session_data ADD COLUMN department_id VARCHAR(64) NULL;

CREATE TABLE treasury_payment_data (
    department_id VARCHAR(30) PRIMARY KEY,
    grn VARCHAR(30),
    challan_timestamp TIMESTAMP,
    bank_ref_no VARCHAR(30),
    bank_timestamp TIMESTAMP,
    bank_code VARCHAR(30),
    status VARCHAR(10),
    cin VARCHAR(30),
    amount DECIMAL(10, 2),
    party_name VARCHAR(100),
    remark_status VARCHAR(100),
    remarks VARCHAR(255),
    file_store_id VARCHAR(64)
);

ALTER TABLE public.treasury_payment_data ALTER COLUMN challan_timestamp TYPE varchar(30) USING challan_timestamp::varchar(30);
ALTER TABLE public.treasury_payment_data ALTER COLUMN bank_timestamp TYPE varchar(30) USING bank_timestamp::varchar(30);

ALTER TABLE auth_sek_session_data ALTER COLUMN total_due TYPE NUMERIC(12,2);
ALTER TABLE treasury_payment_data ALTER COLUMN amount TYPE DECIMAL(12,2);

CREATE TABLE treasury_head_breakup_data(
    consumer_code VARCHAR(64) PRIMARY KEY,
    head_mapping JSONB,
    tenant_id VARCHAR(64),
    calculation JSONB,
    createdtime BIGINT
);

ALTER TABLE treasury_head_breakup_data
    ADD COLUMN reSubmissionBreakDown JSONB;
ALTER TABLE treasury_head_breakup_data
    ADD COLUMN lastModifiedTime BIGINT;
ALTER TABLE treasury_head_breakup_data
    ADD COLUMN lastSubmissionConsumerCode VARCHAR(64) NULL;

    ALTER TABLE treasury_head_breakup_data
    RENAME COLUMN reSubmissionBreakDown TO finalCalcPostResubmission;



ALTER TABLE auth_sek_session_data ADD COLUMN request_blob jsonb NULL;

ALTER TABLE treasury_payment_data ADD COLUMN request_blob jsonb NULL;
ALTER TABLE treasury_payment_data ADD COLUMN response_blob jsonb NULL;
