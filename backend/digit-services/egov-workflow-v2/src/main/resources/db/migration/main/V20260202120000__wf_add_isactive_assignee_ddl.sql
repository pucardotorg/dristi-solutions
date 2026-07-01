-- Add isActive column to eg_wf_assignee_v2 table
ALTER TABLE eg_wf_assignee_v2 ADD COLUMN IF NOT EXISTS isActive BOOLEAN DEFAULT TRUE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_eg_wf_assignee_v2 ON eg_wf_assignee_v2(processinstanceid, assignee);