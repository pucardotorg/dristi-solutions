ALTER TABLE treasury_head_breakup_data
    ADD COLUMN reSubmissionBreakDown JSONB;
ALTER TABLE treasury_head_breakup_data
    ADD COLUMN lastModifiedTime BIGINT;
ALTER TABLE treasury_head_breakup_data
    ADD COLUMN lastSubmissionConsumerCode VARCHAR(64) NULL;