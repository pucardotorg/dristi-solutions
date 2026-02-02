-- Add isActive column to eg_wf_assignee_v2 table
ALTER TABLE eg_wf_assignee_v2 ADD COLUMN IF NOT EXISTS isActive BOOLEAN DEFAULT TRUE;