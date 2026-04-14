CREATE TABLE dristi_hearing (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantId VARCHAR(10) NOT NULL,
    hearingId varchar(64) NULL,
    filingNumber JSONB NULL,
    cnrNumbers JSONB NULL,
    applicationNumbers JSONB NULL,
    hearingType VARCHAR(64) NOT NULL,
    status VARCHAR(64) NOT NULL,
    startTime int8 NULL,
    endTime int8 NULL,
    presidedBy JSONB NULL,
    attendees JSONB NULL,
    transcript JSONB NULL,
    vcLink VARCHAR(255) NULL,
    isActive BOOLEAN NULL,
    additionalDetails JSONB NULL,
    notes VARCHAR(255) NULL,
    createdBy varchar(64) NULL,
    lastModifiedBy varchar(64) NULL,
    createdTime int8 NULL,
    lastModifiedTime int8 NULL
    CONSTRAINT chk_startTime_endTime CHECK (startTime IS NULL OR endTime IS NULL OR startTime <= endTime)
);

CREATE TABLE dristi_hearing_document (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    fileStore VARCHAR(64),
    documentUid VARCHAR(64),
    documentType VARCHAR(64),
    hearingId VARCHAR(64) NOT NULL,
    additionalDetails JSONB
);


CREATE INDEX IF NOT EXISTS idx_dristi_hearing_hearing_id ON dristi_hearing (hearingId);
CREATE INDEX IF NOT EXISTS idx_dristi_hearing_filing_number ON dristi_hearing USING GIN (filingNumber);
CREATE INDEX IF NOT EXISTS idx_dristi_hearing_cnr_number ON dristi_hearing USING GIN (cnrNumbers);
CREATE INDEX IF NOT EXISTS idx_dristi_hearing_application_number ON dristi_hearing USING GIN (applicationNumbers);
CREATE INDEX IF NOT EXISTS idx_dristi_hearing_hearing_type ON dristi_hearing (hearingType);
CREATE INDEX IF NOT EXISTS idx_dristi_hearing_individual_id ON dristi_hearing USING gin (attendees jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_drist_hearing_start_time ON dristi_hearing (startTime);

CREATE INDEX IF NOT EXISTS idx_dristi_hearing_document_hearing_id ON dristi_hearing_document (hearingId);
CREATE INDEX IF NOT EXISTS idx_dristi_hearing_document_filestore_id ON dristi_hearing_document (fileStore);


ALTER TABLE dristi_hearing
ADD COLUMN caseReferenceNumber varchar(64) NULL;

ALTER TABLE dristi_hearing
ADD COLUMN courtCaseNumber varchar(64) NULL;

ALTER TABLE dristi_hearing
ADD COLUMN cmpNumber varchar(64) NULL;

CREATE INDEX IF NOT EXISTS idx_dristi_hearing_tenant_id ON dristi_hearing (tenantId);

ALTER TABLE dristi_hearing_document
ADD COLUMN  isActive bool DEFAULT TRUE;

ALTER TABLE dristi_hearing ADD COLUMN hearingSummary varchar(1000) NULL;

ALTER TABLE dristi_hearing
    ADD COLUMN IF NOT EXISTS hearingDurationInMillis bigint NULL;

    ALTER TABLE dristi_hearing
ALTER COLUMN hearingSummary TYPE VARCHAR;