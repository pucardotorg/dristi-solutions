CREATE TABLE dristi_advocate_clerk (
    id VARCHAR(64),
    tenantId VARCHAR(128),
    applicationNumber VARCHAR(64),
    status VARCHAR(64),
    individualId VARCHAR(36),
    isActive BOOLEAN DEFAULT true,
    createdBy varchar(64) NULL,
    stateRegnNumber varchar(64) NULL,
    lastModifiedBy varchar(64) NULL,
    createdTime int8 NULL,
    lastModifiedTime int8 NULL,
    additionalDetails JSONB,
    CONSTRAINT pk_advocate_clerk PRIMARY KEY (id)
);


CREATE TABLE dristi_advocate (
                             id varchar(64) NOT NULL PRIMARY KEY,
                             tenantId varchar(1000) NOT NULL,
                             applicationNumber varchar(64) NULL,
                             status VARCHAR(64),
                             barRegistrationNumber varchar(64) NULL,
                             advocateType varchar(64) NULL,
                             organisationID varchar(64) NULL,
                             individualId varchar(64) NULL,
                             isActive bool NULL,
                             additionalDetails jsonb NULL,
                             createdBy varchar(64) NULL,
                             lastModifiedBy varchar(64) NULL,
                             createdTime int8 NULL,
                             lastModifiedTime int8 NULL
);
CREATE TABLE dristi_document (
                             id varchar(64) NOT NULL PRIMARY KEY,
                             fileStore varchar(64) NULL,
                             documentUid varchar(64)  NULL ,
                             documentType varchar(64) NULL,
                             advocateId varchar(64)  NULL,
                             clerk_id varchar(64)  NULL,
                             additionalDetails JSONB NULL
);


CREATE INDEX IF NOT EXISTS idx_dristi_advocate_application_number ON dristi_advocate(applicationNumber);
CREATE INDEX IF NOT EXISTS idx_dristi_advocate_bar_registration_number ON dristi_advocate(barRegistrationNumber);
CREATE INDEX IF NOT EXISTS idx_dristi_advocate_individual_id ON dristi_advocate(individualId);

CREATE INDEX IF NOT EXISTS idx_dristi_advocate_clerk_application_number ON dristi_advocate_clerk(applicationNumber);
CREATE INDEX IF NOT EXISTS idx_dristi_advocate_clerk_individual_id ON dristi_advocate_clerk(individualId);
CREATE INDEX IF NOT EXISTS idx_dristi_advocate_clerk_state_regn_number ON dristi_advocate_clerk(stateRegnNumber);

CREATE INDEX IF NOT EXISTS idx_dristi_document_advocate_id ON dristi_document(advocateId);
CREATE INDEX IF NOT EXISTS idx_dristi_document_clerk_id ON dristi_document(clerk_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dristi_advocate_tenant_id ON dristi_advocate(tenantId);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dristi_advocate_clerk_tenant_id ON dristi_advocate_clerk(tenantId);

