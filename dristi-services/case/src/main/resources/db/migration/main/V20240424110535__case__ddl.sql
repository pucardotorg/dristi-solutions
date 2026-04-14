CREATE TABLE dristi_cases (
                              id varchar(64) NOT NULL PRIMARY KEY,
                              tenantId varchar(1000) NOT NULL,
                              resolutionMechanism varchar(64) NULL,
                              caseTitle VARCHAR(64),
                              caseDescription varchar(64) NULL,
                              filingNumber varchar(64) NULL,
                              caseNumber varchar(64) NULL,
                              cnrNumber varchar(64) NULL,
                              courtCaseNumber varchar(64) NULL,
                              accessCode varchar(64) NULL,
                              courtId varchar(64) NULL,
                              benchId varchar(64) NULL,
                              filingDate varchar(64) NULL,
                              registrationDate varchar(64) NULL,
                              caseCategory varchar(64) NULL,
                              natureOfPleading varchar(64) NULL,
                              status varchar(64) NULL,
                              remarks varchar(64) NULL,
                              isActive bool NULL,
                              caseDetails JSONB NULL,
                              additionalDetails jsonb NULL,
                              createdBy varchar(64) NULL,
                              lastModifiedBy varchar(64) NULL,
                              createdTime int8 NULL,
                              lastModifiedTime int8 NULL
);
CREATE TABLE dristi_case_document (
                                      id varchar(64) NOT NULL PRIMARY KEY,
                                      fileStore varchar(64) NULL,
                                      documentUid varchar(64)  NULL ,
                                      documentType varchar(64) NULL,
                                      case_id varchar(64)  NULL,
                                      linked_case_id varchar(64)  NULL,
                                      litigant_id varchar(64)  NULL,
                                      representative_id varchar(64)  NULL,
                                      representing_id varchar(64)  NULL,
                                      additionalDetails JSONB NULL
);

CREATE TABLE dristi_linked_case (
                                    id varchar(64) NOT NULL PRIMARY KEY,
                                    relationshipType varchar(64) NULL,
                                    caseNumbers varchar(64)  NULL ,
                                    isActive bool NULL,
                                    case_id varchar(64)  NULL,
                                    additionalDetails JSONB NULL,
                                    createdBy varchar(64) NULL,
                                    lastModifiedBy varchar(64) NULL,
                                    createdTime int8 NULL,
                                    lastModifiedTime int8 NULL
);

CREATE TABLE dristi_case_statutes_and_sections (
                                                   id varchar(64) NOT NULL PRIMARY KEY,
                                                   tenantId varchar(64) NULL,
                                                   statutes varchar(64)  NULL ,
                                                   sections varchar(64) NULL,
                                                   subsections varchar(64)  NULL,
                                                   case_id varchar(64)  NULL,
                                                   additionalDetails JSONB NULL,
                                                   createdBy varchar(64) NULL,
                                                   lastModifiedBy varchar(64) NULL,
                                                   createdTime int8 NULL,
                                                   lastModifiedTime int8 NULL
);


CREATE TABLE dristi_case_litigants (
                                       id varchar(64) NOT NULL PRIMARY KEY,
                                       tenantId varchar(64) NULL,
                                       partyCategory varchar(64)  NULL ,
                                       individualId varchar(64)  NULL ,
                                       organisationID varchar(64)  NULL ,
                                       partyType varchar(64)  NULL ,
                                       isActive bool NULL,
                                       case_id varchar(64)  NULL,
                                       additionalDetails JSONB NULL,
                                       createdBy varchar(64) NULL,
                                       lastModifiedBy varchar(64) NULL,
                                       createdTime int8 NULL,
                                       lastModifiedTime int8 NULL
);

CREATE TABLE dristi_case_representatives (
                                             id varchar(64) NOT NULL PRIMARY KEY,
                                             tenantId varchar(64) NULL,
                                             advocateId varchar(64)  NULL ,
                                             isActive bool NULL,
                                             case_id varchar(64)  NULL,
                                             additionalDetails JSONB NULL,
                                             createdBy varchar(64) NULL,
                                             lastModifiedBy varchar(64) NULL,
                                             createdTime int8 NULL,
                                             lastModifiedTime int8 NULL
);

CREATE TABLE dristi_case_representing (
                                          id varchar(64) NOT NULL PRIMARY KEY,
                                          tenantId varchar(64) NULL,
                                          partyCategory varchar(64)  NULL ,
                                          individualId varchar(64)  NULL ,
                                          organisationId varchar(64)  NULL ,
                                          caseId varchar(64)  NULL ,
                                          partyType varchar(64)  NULL ,
                                          isActive bool NULL,
                                          representative_id varchar(64)  NULL,
                                          additionalDetails JSONB NULL,
                                          createdBy varchar(64) NULL,
                                          lastModifiedBy varchar(64) NULL,
                                          createdTime int8 NULL,
                                          lastModifiedTime int8 NULL
);

CREATE TABLE dristi_witness (
                                    id varchar(64) NOT NULL PRIMARY KEY,
                                    caseID varchar(64)  NULL ,
                                    filingNumber varchar(64) NULL,
                                    cnrNumber varchar(64)  NULL ,
                                    witnessIdentifier varchar(64)  NULL,
                                    individualId varchar(64)  NULL,
                                    remarks varchar(64)  NULL,
                                    isActive bool NULL,
                                    additionalDetails JSONB NULL,
                                    createdBy varchar(64) NULL,
                                    lastModifiedBy varchar(64) NULL,
                                    createdTime int8 NULL,
                                    lastModifiedTime int8 NULL
);

ALTER TABLE dristi_case_representing
RENAME COLUMN caseId TO case_id;

ALTER TABLE dristi_cases
ADD COLUMN judgeId varchar(64) NULL,
ADD COLUMN stage varchar(64) NULL,
ADD COLUMN substage varchar(64) NULL;

ALTER TABLE dristi_cases
ADD COLUMN judgementDate varchar(64) NULL;

ALTER TABLE dristi_cases
DROP COLUMN filingDate;
ALTER TABLE dristi_cases
DROP COLUMN registrationDate;
ALTER TABLE dristi_cases
DROP COLUMN judgementDate;

ALTER TABLE dristi_cases
ADD COLUMN filingDate int8 NULL;
ALTER TABLE dristi_cases
ADD COLUMN registrationDate int8 NULL;
ALTER TABLE dristi_cases
ADD COLUMN judgementDate int8 NULL;

ALTER TABLE dristi_cases
ADD COLUMN outcome varchar(64);

CREATE INDEX IF NOT EXISTS idx_dristi_cases_dristi_cases_tenant_id ON dristi_cases(id, tenantId);
CREATE INDEX IF NOT EXISTS idx_dristi_cases_cnr_number ON dristi_cases(cnrNumber);
CREATE INDEX IF NOT EXISTS idx_dristi_cases_filing_number ON dristi_cases(filingNumber);
CREATE INDEX IF NOT EXISTS idx_dristi_cases_court_case_number ON dristi_cases(courtCaseNumber);
CREATE INDEX IF NOT EXISTS idx_dristi_cases_filing_date ON dristi_cases(filingDate);
CREATE INDEX IF NOT EXISTS idx_dristi_cases_registration_date ON dristi_cases(registrationDate);
CREATE INDEX IF NOT EXISTS idx_dristi_cases_judge_id ON dristi_cases(judgeId);
CREATE INDEX IF NOT EXISTS idx_dristi_cases_substage ON dristi_cases(substage);

CREATE INDEX IF NOT EXISTS idx_dristi_case_documents_case_id ON dristi_case_document(case_id);
CREATE INDEX IF NOT EXISTS idx_dristi_case_documents_filestore_id ON dristi_case_document(fileStore);
CREATE INDEX IF NOT EXISTS idx_dristi_case_document_type ON dristi_case_document(documentType);

CREATE INDEX IF NOT EXISTS idx_dristi_linked_case_case_id ON dristi_linked_case(case_id);

CREATE INDEX IF NOT EXISTS idx_dristi_case_statutes_and_sections_case_id ON dristi_case_statutes_and_sections(case_id);
CREATE INDEX IF NOT EXISTS idx_dristi_case_statutes_and_sections_statutes ON dristi_case_statutes_and_sections(statutes);

CREATE INDEX IF NOT EXISTS idx_dristi_case_litigants_case_id ON dristi_case_litigants(case_id);
CREATE INDEX IF NOT EXISTS idx_dristi_case_litigants_individual_id ON dristi_case_litigants(individualId);


CREATE INDEX IF NOT EXISTS idx_dristi_case_representatives_case_id ON dristi_case_representatives(case_id);
CREATE INDEX IF NOT EXISTS idx_dristi_case_representatives_advocate_id ON dristi_case_representatives (advocateId);

CREATE INDEX IF NOT EXISTS idx_dristi_case_representing_representative_id ON dristi_case_representing(representative_id);

CREATE TABLE dristi_case_hearing_type_priority (
                              id varchar(64) NOT NULL PRIMARY KEY,
                              caseType varchar(1000) NOT NULL,
                              description varchar(64) NULL,
                              priority int8 NULL,
                              isActive bool NULL
);

INSERT INTO dristi_case_hearing_type_priority (id, caseType, description, priority, isActive) VALUES
('1', 'CMP', 'Criminal Miscellaneous Petition', 15, true),
('2', 'ST', 'Summary Trial', 10, true),
('3', 'CC', 'Calendar Case', 5, true);


ALTER TABLE dristi_cases
ADD COLUMN caseType varchar(64) NULL;

ALTER TABLE dristi_cases
ADD COLUMN cmpNumber varchar(64) NULL;

ALTER TABLE dristi_cases
ADD COLUMN advocateCount int8 NULL;

ALTER TABLE dristi_case_document
ADD COLUMN  isActive bool DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_dristi_cases_tenant_id ON dristi_cases(tenantId);


ALTER TABLE dristi_case_litigants
ADD COLUMN hasSigned BOOLEAN NULL;

ALTER TABLE dristi_case_representatives
ADD COLUMN hasSigned BOOLEAN NULL;


ALTER TABLE dristi_cases
ALTER COLUMN id
SET DATA TYPE VARCHAR(1000);

ALTER TABLE dristi_cases
ALTER COLUMN caseTitle
SET DATA TYPE VARCHAR(1000);

ALTER TABLE dristi_case_litigants
ADD COLUMN  isResponseRequired bool DEFAULT FALSE;

ALTER TABLE dristi_cases
ADD COLUMN  pendingAdvocateRequests jsonb NULL;

CREATE INDEX IF NOT EXISTS idx_dristi_cases_pending_advocate_requests ON dristi_cases USING GIN (pendingAdvocateRequests);

ALTER TABLE dristi_case_document ADD COLUMN poaholder_id VARCHAR(128);


CREATE TABLE dristi_case_poaholders (
    id VARCHAR(128) PRIMARY KEY,
    tenant_id VARCHAR(128) NOT NULL,
    case_id VARCHAR(128) NOT NULL,
    individual_id VARCHAR(128),
    poa_type VARCHAR(128) NOT NULL,
    name VARCHAR(256),
    is_active BOOLEAN ,
    additional_details JSONB,
    hasSigned BOOLEAN NULL,
    representing_litigants JSONB,
    created_by VARCHAR(128),
    last_modified_by VARCHAR(128),
    created_time BIGINT,
    last_modified_time BIGINT
);

-- Create composite indexes for better query performance
CREATE INDEX idx_poaholders_tenant_case ON dristi_case_poaholders(tenant_id, case_id);
CREATE INDEX idx_poaholders_individual_tenant ON dristi_case_poaholders(individual_id, tenant_id) WHERE individual_id IS NOT NULL;


CREATE INDEX IF NOT EXISTS idx_dristi_cases_courtid ON dristi_cases(courtId);


ALTER TABLE dristi_cases ADD COLUMN  lprNumber varchar(64) NULL;
ALTER TABLE dristi_cases ADD COLUMN isLPRCase bool DEFAULT false;
ALTER TABLE dristi_cases ADD COLUMN courtCaseNumberBackup varchar(64) NULL;
ALTER TABLE dristi_cases ADD COLUMN stagebackup varchar(64) NULL;
ALTER TABLE dristi_cases ADD COLUMN substagebackup varchar(64) NULL;

ALTER TABLE dristi_cases
ADD COLUMN witnessDetails jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE dristi_cases ADD COLUMN natureOfDisposal varchar(64);

CREATE TABLE dristi_case_conversion (
    tenantId varchar(64),
    caseId varchar(64),
    filingNumber varchar(64),
    cnrNumber varchar(64),
    dateOfConversion BIGINT,
    convertedFrom varchar(64),
    convertedTo varchar(64),
    preCaseNumber varchar(64),
    postCaseNumber varchar(64)
);

CREATE TABLE dristi_advocate_office_case_member (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    office_advocate_id VARCHAR(64) NOT NULL,
    office_advocate_name VARCHAR(256) NOT NULL,
    case_id VARCHAR(64) NOT NULL,
    member_id VARCHAR(64) NOT NULL,
    member_type VARCHAR(64) NOT NULL,
    member_name VARCHAR(256) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(64),
    last_modified_by VARCHAR(64),
    created_time int8,
    last_modified_time int8
);

CREATE INDEX idx_advocate_office_case_member_office_id ON dristi_advocate_office_case_member(office_advocate_id);
CREATE INDEX idx_advocate_office_case_member_case_id ON dristi_advocate_office_case_member(case_id);
CREATE INDEX idx_advocate_office_case_member_member_id ON dristi_advocate_office_case_member(member_id);
CREATE INDEX idx_advocate_office_case_member_is_active ON dristi_advocate_office_case_member(is_active);
CREATE UNIQUE INDEX idx_advocate_office_case_member_unique ON dristi_advocate_office_case_member(office_advocate_id, case_id, member_id);
ALTER TABLE dristi_advocate_office_case_member
ADD COLUMN office_advocate_user_uuid VARCHAR(64) NULL;

ALTER TABLE dristi_advocate_office_case_member
ADD COLUMN member_user_uuid VARCHAR(64) NULL;
-- Add advocate_filing_status column to dristi_case_representatives table
ALTER TABLE dristi_case_representatives 
ADD COLUMN advocate_filing_status varchar(64) NULL;
