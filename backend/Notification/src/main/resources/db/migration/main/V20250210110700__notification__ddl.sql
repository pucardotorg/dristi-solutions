CREATE TABLE dristi_notification (
                                    id varchar(64) NOT NULL PRIMARY KEY,
                                    tenantId varchar(64)  NULL ,
                                    notificationType varchar(64),
                                    caseNumber JSONB NULL,
                                    courtId varchar(64) NULL,
                                    notificationNumber varchar(64) NULL,
                                    createdDate int8 NULL,
                                    issuedBy varchar(64) NULL,
                                    status varchar(64) NOT NULL,
                                    comment varchar(1024)  NULL,
                                    isActive bool NOT NULL,
                                    notificationDetails JSONB NULL,
                                    additionalDetails JSONB NULL,
                                    createdBy varchar(64) NULL,
                                    lastModifiedBy varchar(64) NULL,
                                    createdTime int8 NULL,
                                    lastModifiedTime int8 NULL
);



CREATE TABLE dristi_notification_document (
                              id varchar(64) NOT NULL PRIMARY KEY,
                              fileStore varchar(64) NULL,
                              documentUid varchar(64)  NULL ,
                              documentType varchar(64) NULL,
                              notification_id varchar(64)  NULL,
                              additionalDetails JSONB NULL
);

CREATE UNIQUE INDEX idx_notification_number ON dristi_notification (notificationNumber);
