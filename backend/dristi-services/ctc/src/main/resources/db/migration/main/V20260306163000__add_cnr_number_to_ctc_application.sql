ALTER TABLE dristi_ctc_applications
ADD COLUMN IF NOT EXISTS cnr_number VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_ctc_applications_cnr_number ON dristi_ctc_applications(cnr_number);
