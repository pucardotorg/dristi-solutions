CREATE TABLE IF NOT EXISTS dristi_ctc_applications (
    id VARCHAR(64) PRIMARY KEY,
    ctc_application_number VARCHAR(100) UNIQUE,
    tenant_id VARCHAR(64) NOT NULL,
    case_number VARCHAR(100) NOT NULL,
    case_title VARCHAR(100) NOT NULL,
    filing_number VARCHAR(100) NOT NULL,
    court_id VARCHAR(64) NOT NULL,
    applicant_name VARCHAR(255) NOT NULL,
    mobile_number VARCHAR(5000) NOT NULL,
    is_party_to_case BOOLEAN NOT NULL,
    party_designation VARCHAR(100),
    affidavit_document jsonb,
    selected_documents jsonb,
    total_pages INTEGER,
    status VARCHAR(50),
    judge_comments TEXT,
    issued_documents jsonb,
    created_by VARCHAR(64),
    last_modified_by VARCHAR(64),
    created_time BIGINT,
    last_modified_time BIGINT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ctc_applications_tenant_id ON dristi_ctc_applications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ctc_applications_court_id ON dristi_ctc_applications(court_id);
CREATE INDEX IF NOT EXISTS idx_ctc_applications_case_number ON dristi_ctc_applications(case_number);
CREATE INDEX IF NOT EXISTS idx_ctc_applications_filing_number ON dristi_ctc_applications(filing_number);
CREATE INDEX IF NOT EXISTS idx_ctc_applications_status ON dristi_ctc_applications(status);
CREATE INDEX IF NOT EXISTS idx_ctc_applications_created_time ON dristi_ctc_applications(created_time);
