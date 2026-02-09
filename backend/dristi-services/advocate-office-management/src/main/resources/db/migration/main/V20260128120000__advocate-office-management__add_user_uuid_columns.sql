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
