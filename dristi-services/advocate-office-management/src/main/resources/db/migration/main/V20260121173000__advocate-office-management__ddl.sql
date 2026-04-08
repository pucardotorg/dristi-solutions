CREATE TABLE dristi_advocate_office_member (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    office_advocate_id VARCHAR(64) NOT NULL,
    member_type VARCHAR(64) NOT NULL,
    member_id VARCHAR(64) NOT NULL,
    member_name VARCHAR(256),
    member_mobile_number VARCHAR(256),
    access_type VARCHAR(64) DEFAULT 'ALL_CASES',
    allow_case_create BOOLEAN DEFAULT TRUE,
    add_new_cases_automatically BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(64),
    last_modified_by VARCHAR(64),
    created_time int8,
    last_modified_time int8
);

CREATE INDEX idx_advocate_office_member_office_id ON dristi_advocate_office_member(office_advocate_id);
CREATE INDEX idx_advocate_office_member_member_id ON dristi_advocate_office_member(member_id);
CREATE INDEX idx_advocate_office_member_is_active ON dristi_advocate_office_member(is_active);
CREATE UNIQUE INDEX idx_advocate_office_member_unique ON dristi_advocate_office_member(office_advocate_id, member_id);

-- Add user UUID columns to store the user UUIDs separately from advocate/clerk IDs
ALTER TABLE dristi_advocate_office_member ADD COLUMN IF NOT EXISTS office_advocate_user_uuid VARCHAR(64);
ALTER TABLE dristi_advocate_office_member ADD COLUMN IF NOT EXISTS member_user_uuid VARCHAR(64);
ALTER TABLE dristi_advocate_office_member ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(64);
ALTER TABLE dristi_advocate_office_member ADD COLUMN IF NOT EXISTS office_advocate_name VARCHAR(256);
ALTER TABLE dristi_advocate_office_member ADD COLUMN IF NOT EXISTS member_email VARCHAR(256);

-- Create indexes for user UUID columns
CREATE INDEX IF NOT EXISTS idx_advocate_office_member_office_user_uuid ON dristi_advocate_office_member(office_advocate_user_uuid);
CREATE INDEX IF NOT EXISTS idx_advocate_office_member_member_user_uuid ON dristi_advocate_office_member(member_user_uuid);
CREATE INDEX IF NOT EXISTS idx_advocate_office_member_tenant_id ON dristi_advocate_office_member(tenant_id);
-- Add advocate office mobile number column to store the advocate office contact number
ALTER TABLE dristi_advocate_office_member ADD COLUMN IF NOT EXISTS advocate_office_mobile_number VARCHAR(256);
