CREATE INDEX IF NOT EXISTS idx_dristi_bail_case_id ON dristi_bail (caseId);
CREATE INDEX IF NOT EXISTS idx_dristi_bail_bail_type ON dristi_bail (bailType);
CREATE INDEX IF NOT EXISTS idx_dristi_bail_status ON dristi_bail (status);
CREATE INDEX IF NOT EXISTS idx_dristi_bail_start_date ON dristi_bail (startDate);
CREATE INDEX IF NOT EXISTS idx_dristi_bail_end_date ON dristi_bail (endDate);
CREATE INDEX IF NOT EXISTS idx_dristi_bail_accused_id ON dristi_bail (accusedId);
CREATE INDEX IF NOT EXISTS idx_dristi_bail_advocate_id ON dristi_bail (advocateId);
CREATE INDEX IF NOT EXISTS idx_dristi_bail_surety_ids ON dristi_bail USING GIN (suretyIds);
CREATE INDEX IF NOT EXISTS idx_dristi_bail_documents ON dristi_bail USING GIN (documents);
CREATE INDEX IF NOT EXISTS idx_dristi_bail_additional_details ON dristi_bail USING GIN (additionalDetails);
CREATE INDEX IF NOT EXISTS idx_dristi_bail_workflow ON dristi_bail USING GIN (workflow);

CREATE INDEX IF NOT EXISTS idx_dristi_bail_document_bail_id ON dristi_bail_document (bailId);
CREATE INDEX IF NOT EXISTS idx_dristi_bail_document_filestore_id ON dristi_bail_document (fileStore);
