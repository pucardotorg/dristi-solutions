CREATE TABLE dristi_bail (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantId VARCHAR(10) NOT NULL,
    caseId VARCHAR(64) NOT NULL,
    bailAmount DOUBLE PRECISION NULL,
    bailType VARCHAR(64) NULL,
    status VARCHAR(64) NULL,
    startDate int8 NULL,
    endDate int8 NULL,
    isActive BOOLEAN NULL,
    accusedId VARCHAR(64) NULL,
    advocateId VARCHAR(64) NULL,
    suretyIds JSONB NULL,
    documents JSONB NULL,
    additionalDetails JSONB NULL,
    auditDetails JSONB NULL,
    workflow JSONB NULL
);

CREATE TABLE dristi_bail_document (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    fileStore VARCHAR(64),
    documentUid VARCHAR(64),
    documentType VARCHAR(64),
    bailId VARCHAR(64) NOT NULL,
    additionalDetails JSONB
);
