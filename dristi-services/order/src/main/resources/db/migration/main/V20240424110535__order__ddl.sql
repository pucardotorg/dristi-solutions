CREATE TABLE dristi_orders (
                              id varchar(64) NOT NULL PRIMARY KEY,
                              tenantId varchar(1000) NOT NULL,
                              hearingNumber varchar(64) NULL,
                              applicationNumber jsonb NULL,
                              orderNumber varchar(64) NULL,
                              linkedOrderNumber varchar(64) NULL,
                              filingNumber varchar(64) NULL,
                              cnrNumber varchar(64) NULL,
                              orderType varchar(64) NULL,
                              orderCategory varchar(64) NULL,
                              createdDate varchar(64) NULL,
                              comments varchar(64) NULL,
                              status varchar(64) NULL,
                              isActive bool NULL,
                              issuedBy JSONB NULL,
                              additionalDetails jsonb NULL,
                              createdBy varchar(64) NULL,
                              lastModifiedBy varchar(64) NULL,
                              createdTime int8 NULL,
                              lastModifiedTime int8 NULL
);
CREATE TABLE dristi_order_document (
                              id varchar(64) NOT NULL PRIMARY KEY,
                              fileStore varchar(64) NULL,
                              documentUid varchar(64)  NULL ,
                              documentType varchar(64) NULL,
                              order_id varchar(64)  NULL,
                              additionalDetails JSONB NULL
);

CREATE TABLE dristi_order_statute_section (
                              id varchar(64) NOT NULL PRIMARY KEY,
                              tenantId varchar(64) NOT NULL,
                              order_id varchar(64) NOT NULL,
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

CREATE SEQUENCE seq_dristi_order
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE dristi_orders
DROP COLUMN createdDate;

ALTER TABLE dristi_orders
ADD COLUMN createdDate int8 NULL;

ALTER TABLE dristi_orders
ADD COLUMN orderDetails jsonb NULL;

CREATE INDEX IF NOT EXISTS idx_dristi_order_tenant_id ON dristi_orders (tenantId);
CREATE INDEX IF NOT EXISTS idx_dristi_order_application_number ON dristi_orders USING GIN (applicationNumber);
CREATE INDEX IF NOT EXISTS idx_dristi_order_order_number ON dristi_orders (orderNumber);
CREATE INDEX IF NOT EXISTS idx_dristi_order_filing_number ON dristi_orders (filingNumber);
CREATE INDEX IF NOT EXISTS idx_dristi_order_cnr_number ON dristi_orders (cnrNumber);
CREATE INDEX IF NOT EXISTS idx_dristi_order_order_type ON dristi_orders (orderType);
CREATE INDEX IF NOT EXISTS idx_dristi_order_status ON dristi_orders (status);

CREATE INDEX IF NOT EXISTS idx_dristi_order_document_order_id ON dristi_order_document (order_id);

CREATE INDEX IF NOT EXISTS idx_dristi_order_statute_section_order_id ON dristi_order_statute_section (order_id);

ALTER TABLE dristi_orders
ALTER COLUMN comments TYPE VARCHAR(1000);

ALTER TABLE dristi_orders
ADD COLUMN orderTitle VARCHAR(1000) NULL;

ALTER TABLE dristi_orders
ADD COLUMN compositeItems JSONB NULL;
ALTER TABLE dristi_orders ADD COLUMN IF NOT EXISTS orderTitle VARCHAR(1000) NULL;
UPDATE dristi_orders SET orderTitle = orderType;

UPDATE dristi_orders SET orderCategory = 'INTERMEDIATE' where orderCategory is null;

CREATE INDEX IF NOT EXISTS idx_dristi_order_composite_items ON dristi_orders USING GIN (compositeItems);

ALTER TABLE dristi_orders
ADD COLUMN scheduledHearingNumber varchar(64) NULL;

ALTER TABLE dristi_orders
ADD COLUMN courtId VARCHAR(64);

CREATE INDEX idx_dristi_orders_courtid ON dristi_orders(courtId);

ALTER TABLE dristi_order_document
ADD COLUMN  isActive bool DEFAULT TRUE;

ALTER TABLE dristi_orders
ADD COLUMN attendance jsonb NULL;

ALTER TABLE dristi_orders
ADD COLUMN itemText VARCHAR(1000);

ALTER TABLE dristi_orders
ADD COLUMN purposeOfNextHearing VARCHAR(100);

ALTER TABLE dristi_orders
ADD COLUMN nextHearingDate int8 NULL;


ALTER TABLE dristi_orders
ADD COLUMN hearingType VARCHAR(64);

ALTER TABLE dristi_orders
ALTER COLUMN comments TYPE VARCHAR;


ALTER TABLE dristi_orders
ALTER COLUMN itemText TYPE VARCHAR;