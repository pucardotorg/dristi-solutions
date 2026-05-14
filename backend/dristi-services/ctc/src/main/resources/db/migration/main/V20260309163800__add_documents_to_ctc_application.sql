ALTER TABLE dristi_ctc_applications
ADD COLUMN IF NOT EXISTS documents jsonb;
