ALTER TABLE judge_calendar_rules
ADD COLUMN IF NOT EXISTS court_ids JSONB NULL;