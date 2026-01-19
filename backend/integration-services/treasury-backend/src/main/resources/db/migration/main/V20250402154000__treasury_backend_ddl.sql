CREATE TABLE treasury_head_breakup_data(
    consumer_code VARCHAR(64) PRIMARY KEY,
    head_mapping JSONB,
    tenant_id VARCHAR(64),
    calculation JSONB,
    createdtime BIGINT
);