CREATE TABLE dristi_evidence_artifact (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantId varchar(1000) NOT NULL,
    artifactNumber VARCHAR(64) NULL,
    evidenceNumber VARCHAR(64) NULL,
    externalRefNumber VARCHAR(128) NULL,
    caseId varchar(64) NULL,
    application VARCHAR(255) NULL,
    hearing VARCHAR(255) NULL,
    orders VARCHAR(255) NULL,
    mediaType VARCHAR(255) NULL,
    artifactType VARCHAR(255) NULL,
    sourceID VARCHAR(255) NULL,
    sourceName VARCHAR(255) NULL,
    applicableTo VARCHAR(255) NULL,
    createdDate int8 NULL,
    isActive bool NULL,
    status VARCHAR(64),
    description VARCHAR(64) NULL,
    artifactDetails jsonb NULL,
    additionalDetails jsonb NULL,
    createdBy varchar(64) NULL,
    lastModifiedBy varchar(64) NULL,
    createdTime int8 NULL,
    lastModifiedTime int8 NULL
);
CREATE TABLE dristi_evidence_document (
    id varchar(64) NOT NULL PRIMARY KEY,
    fileStore varchar(64) NULL,
    documentUid varchar(64)  NULL ,
    documentType varchar(64) NULL,
    artifactId varchar(64)  NULL,
    additionalDetails JSONB NULL
);
CREATE TABLE dristi_evidence_comment (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    tenantId varchar(1000) NOT NULL,
    artifactId varchar(64) NOT NULL ,
    individualId varchar(64) NOT NULL,
    comment varchar(64) NULL,
    isActive bool NULL,
    additionalDetails jsonb NULL,
    createdBy varchar(64) NULL,
    lastModifiedBy varchar(64) NULL,
    createdTime int8 NULL,
    lastModifiedTime int8 NULL
);

CREATE SEQUENCE SEQ_DRISTI_ARTIFACT
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE SEQ_DOC_COMPLAINANT
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE SEQ_DOC_ACCUSED
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE SEQ_DOC_COURT
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE SEQ_WITNESS_COMPLAINANT
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE SEQ_WITNESS_ACCUSED
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE SEQ_WITNESS_COURT
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dristi_evidence_artifact
ADD COLUMN sourceType VARCHAR(64) NULL;

ALTER TABLE dristi_evidence_artifact
ADD COLUMN isEvidence bool NULL;
ALTER TABLE dristi_evidence_artifact
ADD COLUMN filingNumber VARCHAR(64) NULL;


DROP TABLE IF EXISTS dristi_evidence_document;
DROP TABLE IF EXISTS dristi_evidence_comment;

ALTER TABLE dristi_evidence_artifact
ADD COLUMN comments JSONB,
ADD COLUMN file JSONB;

ALTER TABLE dristi_evidence_artifact
DROP COLUMN IF EXISTS applicableTo;

ALTER TABLE dristi_evidence_artifact
ADD COLUMN applicableTo JSONB;

ALTER TABLE dristi_evidence_artifact
DROP COLUMN createdDate;

ALTER TABLE dristi_evidence_artifact
ADD COLUMN createdDate int8 NULL;


CREATE INDEX IF NOT EXISTS idx_dristi_evidence_artifact_artifact_number ON dristi_evidence_artifact(artifactNumber);
CREATE INDEX IF NOT EXISTS idx_dristi_evidence_artifact_case_id ON dristi_evidence_artifact(caseId);
CREATE INDEX IF NOT EXISTS idx_dristi_evidence_artifact_application ON dristi_evidence_artifact(application);
CREATE INDEX IF NOT EXISTS idx_dristi_evidence_artifact_hearing ON dristi_evidence_artifact(hearing);
CREATE INDEX IF NOT EXISTS idx_dristi_evidence_artifact_orders ON dristi_evidence_artifact(orders);
CREATE INDEX IF NOT EXISTS idx_dristi_evidence_artifact_artifact_type ON dristi_evidence_artifact(artifactType);
CREATE INDEX IF NOT EXISTS idx_dristi_evidence_status ON dristi_evidence_artifact(status);
CREATE INDEX IF NOT EXISTS idx_dristi_evidence_owner ON dristi_evidence_artifact(createdBy);

ALTER TABLE dristi_evidence_artifact
ADD COLUMN isVoid bool NULL;

ALTER TABLE dristi_evidence_artifact
ADD COLUMN reason VARCHAR(255) NULL;

ALTER TABLE dristi_evidence_artifact
ADD COLUMN filingType VARCHAR(255) NULL;

ALTER TABLE dristi_evidence_artifact
ADD COLUMN officeAdvocateUserUuid VARCHAR(64);

ALTER TABLE dristi_evidence_artifact
ADD COLUMN publishedDate int8 NULL;

ALTER TABLE dristi_evidence_artifact
ADD COLUMN courtId VARCHAR(64);

CREATE INDEX idx_evidence_artifact_courtid ON dristi_evidence_artifact(courtId);

UPDATE dristi_evidence_artifact
SET courtId = 'KLKM52'
WHERE courtId IS NULL;

ALTER TABLE dristi_evidence_artifact ALTER COLUMN description TYPE VARCHAR(2000);
ALTER TABLE dristi_evidence_artifact ADD COLUMN shortenedUrl VARCHAR(255) NULL;
ALTER TABLE dristi_evidence_artifact ADD COLUMN witnessMobileNumbers jsonb NULL;
ALTER TABLE dristi_evidence_artifact ADD COLUMN witnessEmails jsonb NULL;

ALTER TABLE dristi_evidence_artifact
ADD COLUMN seal JSONB,
ADD COLUMN evidenceMarkedStatus VARCHAR(255) NULL,
ADD COLUMN isEvidenceMarkedFlow bool NULL;

ALTER table dristi_evidence_artifact
ADD COLUMN tag VARCHAR(255) NULL;

ALTER TABLE dristi_evidence_artifact
ALTER COLUMN description TYPE VARCHAR;


ALTER TABLE dristi_evidence_artifact
RENAME COLUMN officeAdvocateUserUuid TO asUser;