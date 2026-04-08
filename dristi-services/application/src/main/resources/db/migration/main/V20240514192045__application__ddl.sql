CREATE TABLE dristi_application (
                                    id varchar(64) NOT NULL PRIMARY KEY,
                                    tenantId varchar(64)  NULL ,
                                    caseId varchar(64) NOT NULL,
                                    filingNumber varchar(64) NULL,
                                    cnrNumber varchar(64)  NULL ,
                                    referenceId varchar(64)  NULL ,
                                    createdDate varchar(64) NOT NULL,
                                    applicationCreatedBy varchar(64) NULL,
                                    onBehalfOf JSONB  NULL,
                                    applicationType varchar(64)  NULL,
                                    applicationNumber varchar(64)  NULL,
                                    issuedBy JSONB NULL,
                                    status varchar(64) NOT NULL,
                                    comment varchar(64)  NULL,
                                    isActive bool NOT NULL,
                                    documents varchar(64)  NULL,
                                    additionalDetails JSONB NULL,
                                    createdBy varchar(64) NULL,
                                    lastModifiedBy varchar(64) NULL,
                                    createdTime int8 NULL,
                                    lastModifiedTime int8 NULL
);
CREATE TABLE dristi_application_document (
                              id varchar(64) NOT NULL PRIMARY KEY,
                              fileStore varchar(64) NULL,
                              documentUid varchar(64)  NULL ,
                              documentType varchar(64) NULL,
                              application_id varchar(64)  NULL,
                              additionalDetails JSONB NULL
);

CREATE TABLE dristi_application_statute_section (
                              id varchar(64) NOT NULL PRIMARY KEY,
                              tenantId varchar(64) NOT NULL,
                              application_id varchar(64) NOT NULL,
                              statute varchar(64)  NULL ,
                              sections jsonb NULL,
                              strSections varchar(64) NULL,
                              subsections jsonb  NULL,
                              strSubsections varchar(64)  NULL,
                              additionalDetails jsonb NULL,
                              createdBy varchar(64) NULL,
                              lastModifiedBy varchar(64) NULL,
                              createdTime int8 NULL,
                              lastModifiedTime int8 NULL
);

CREATE SEQUENCE seq_dristi_application
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE dristi_application
ADD COLUMN statuteSection jsonb;

DROP TABLE IF EXISTS dristi_application_statute_section;

ALTER TABLE dristi_application
DROP COLUMN createdDate;

ALTER TABLE dristi_application
ADD COLUMN createdDate int8 NULL;


ALTER TABLE dristi_application DROP COLUMN comment;
ALTER TABLE dristi_application ADD COLUMN comment jsonb;

ALTER TABLE dristi_application ADD COLUMN reason_for_application varchar(64);
ALTER TABLE dristi_application ADD COLUMN application_details jsonb;

CREATE INDEX IF NOT EXISTS idx_dristi_application_filing_number ON dristi_application(filingNumber);
CREATE INDEX IF NOT EXISTS idx_dristi_application_cnr_number ON dristi_application(cnrNumber);
CREATE INDEX IF NOT EXISTS idx_dristi_application_application_type ON dristi_application(applicationType);
CREATE INDEX IF NOT EXISTS idx_drist_application_application_number ON dristi_application(applicationNumber);
CREATE INDEX IF NOT EXISTS idx_dristi_application_status ON dristi_application(status);

CREATE INDEX IF NOT EXISTS idx_dristi_application_document_application_id ON dristi_application_document(application_id);

CREATE INDEX IF NOT EXISTS idx_dristi_application_owner ON dristi_application(createdBy);
ALTER TABLE dristi_application
ADD COLUMN cmpNumber varchar(64) NULL;

ALTER TABLE dristi_application
ADD COLUMN applicationCMPNumber varchar(64) NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dristi_application_tenant_id ON dristi_application(tenantId);
ALTER TABLE dristi_application_document
ADD COLUMN documentOrder int8

ALTER TABLE dristi_application
ADD COLUMN officeAdvocateUserUuid VARCHAR(64);

ALTER TABLE dristi_application
ADD COLUMN courtId VARCHAR(64);

CREATE INDEX idx_dristi_application_courtid ON dristi_application(courtId);

UPDATE dristi_application
SET courtId = 'KLKM52'
WHERE courtId IS NULL;
ALTER TABLE dristi_application_document
ADD COLUMN  isActive bool DEFAULT TRUE;

ALTER TABLE dristi_application
RENAME COLUMN officeAdvocateUserUuid TO asUser;