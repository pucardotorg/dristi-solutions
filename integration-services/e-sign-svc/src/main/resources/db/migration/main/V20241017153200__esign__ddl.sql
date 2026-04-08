CREATE TABLE dristi_esign_pdf (
                              id varchar(64) NOT NULL PRIMARY KEY,
                              tenantId varchar(1000) NOT NULL,
                              filestoreId varchar(64) NULL,
                              signPlaceHolder VARCHAR(64),
                              signedFilestoreId varchar(64) NULL,
                              pageModule varchar(64) NULL,
                              authType varchar(64) NULL
                              );

ALTER TABLE dristi_esign_pdf
ADD COLUMN createdBy VARCHAR(64) NULL,
ADD COLUMN lastModifiedBy VARCHAR(64) NULL,
ADD COLUMN createdTime INT8 NULL,
ADD COLUMN lastModifiedTime INT8 NULL;


ALTER TABLE dristi_esign_pdf
ADD COLUMN filepath varchar (1000);

ALTER TABLE dristi_esign_pdf
ADD COLUMN request_blob JSONB NULL,
ADD COLUMN response_blob JSONB NULL,
ADD COLUMN status VARCHAR(20);

ALTER TABLE dristi_esign_pdf
RENAME COLUMN filepath TO unsigned_filepath;
