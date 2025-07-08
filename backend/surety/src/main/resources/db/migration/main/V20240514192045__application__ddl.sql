CREATE TABLE dristi_surety (
                                    id varchar(64) NOT NULL PRIMARY KEY,
                                    tenantId varchar(64)  NULL ,
                                    mobileNumber varchar(64) NOT NULL,
                                    name varchar(64) NULL,
                                    email varchar(64)  NULL ,
                                    fatherName varchar(64)  NULL ,
                                    bailId varchar(64)  NULL ,
                                    caseId varchar(64) NOT NULL ,
                                    isActive bool NOT NULL,
                                    hasSigned bool NOT NULL,
                                    address JSONB NULL,
                                    additionalDetails JSONB NULL,
                                    createdBy varchar(64) NULL,
                                    lastModifiedBy varchar(64) NULL,
                                    createdTime int8 NULL,
                                    lastModifiedTime int8 NULL
);
CREATE TABLE dristi_surety_document (
                              id varchar(64) NOT NULL PRIMARY KEY,
                              fileStore varchar(64) NULL,
                              documentUid varchar(64)  NULL ,
                              documentType varchar(64) NULL,
                              isActive bool NULL,
                              surety_id varchar(64)  NULL,
                              additionalDetails JSONB NULL
);

