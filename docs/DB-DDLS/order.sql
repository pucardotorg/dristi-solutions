-- =====================================================================
-- Consolidated DDL for order (fresh-install reference)
-- Generated from Flyway migrations in db/migration/main
-- This script represents the FINAL schema state after applying all
-- versioned migrations below, in order. It is a reference/documentation
-- script for provisioning a new environment quickly — it does NOT
-- replace the existing Flyway migration history. Deployed environments
-- must continue to use the original versioned migration files.
--
-- Source files reviewed (17):
--   V20240424110535__order__ddl.sql
--   V20240727110535__order__ddl.sql
--   V20240731110535__order__ddl.sql
--   V20240913113500__order__ddl.sql
--   V20241217113500__order__ddl.sql
--   V20250217113500__order__ddl.sql
--   V20250224113500__order__ddl.sql
--   V20250225113500__order__ddl.sql
--   V20250227113500__order__ddl.sql
--   V20250309113600__order__ddl.sql
--   V20250508113500__order__ddl.sql
--   V20250523175900__order__ddl.sql
--   V20250822175900__order__ddl.sql
--   V20251215124000__order__ddl.sql
--   V20251408113600__order__ddl.sql
--   V20252608113600__order__ddl.sql
--   V20260529120000__order__ddl.sql
-- =====================================================================

-- ==== Sequences ====

CREATE SEQUENCE seq_dristi_order
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- ==== Tables ====

CREATE TABLE dristi_orders (
    id                      varchar(64) NOT NULL PRIMARY KEY,
    tenantId                varchar(1000) NOT NULL,
    hearingNumber           varchar(64) NULL,
    applicationNumber       jsonb NULL,
    orderNumber             varchar(64) NULL,
    linkedOrderNumber       varchar(64) NULL,
    filingNumber            varchar(64) NULL,
    cnrNumber               varchar(64) NULL,
    orderType               varchar(64) NULL,
    orderCategory           varchar(64) NULL,
    createdDate             int8 NULL,                 -- dropped (varchar) and re-added as int8 in V20240727110535
    comments                VARCHAR NULL,               -- VARCHAR(64) -> VARCHAR(1000) (V20241217113500) -> VARCHAR (V20251408113600)
    status                  varchar(64) NULL,
    isActive                bool NULL,
    issuedBy                JSONB NULL,
    additionalDetails       jsonb NULL,
    createdBy               varchar(64) NULL,
    lastModifiedBy          varchar(64) NULL,
    createdTime             int8 NULL,
    lastModifiedTime        int8 NULL,
    orderDetails            jsonb NULL,                 -- added V20240731110535
    orderTitle              VARCHAR(1000) NULL,         -- added V20250217113500
    compositeItems          JSONB NULL,                 -- added V20250217113500
    scheduledHearingNumber  varchar(64) NULL,            -- added V20250309113600
    courtId                 VARCHAR(64) NULL,            -- added V20250508113500
    attendance              jsonb NULL,                  -- added V20250822175900
    itemText                VARCHAR NULL,                -- VARCHAR(1000) (V20250822175900) -> VARCHAR (V20252608113600)
    purposeOfNextHearing    VARCHAR(100) NULL,           -- added V20250822175900
    nextHearingDate         int8 NULL,                   -- added V20250822175900
    hearingType             VARCHAR(64) NULL,            -- added V20251215124000
    partyuniqueids          JSONB NULL                   -- added V20260529120000
);

CREATE TABLE dristi_order_document (
    id                  varchar(64) NOT NULL PRIMARY KEY,
    fileStore           varchar(64) NULL,
    documentUid         varchar(64) NULL,
    documentType        varchar(64) NULL,
    order_id            varchar(64) NULL,
    additionalDetails   JSONB NULL,
    isActive            bool DEFAULT TRUE               -- added V20250523175900
);

CREATE TABLE dristi_order_statute_section (
    id                  varchar(64) NOT NULL PRIMARY KEY,
    tenantId            varchar(64) NOT NULL,
    order_id            varchar(64) NOT NULL,
    statute             varchar(64) NULL,
    sections            jsonb NULL,
    strSections         varchar(64) NULL,
    subsections         jsonb NULL,
    strSubsections      varchar(64) NULL,
    additionalDetails   jsonb NULL,
    createdBy           varchar(64) NULL,
    lastModifiedBy      varchar(64) NULL,
    createdTime         int8 NULL,
    lastModifiedTime    int8 NULL
);

-- ==== Indexes ====

CREATE INDEX IF NOT EXISTS idx_dristi_order_tenant_id ON dristi_orders (tenantId);
CREATE INDEX IF NOT EXISTS idx_dristi_order_application_number ON dristi_orders USING GIN (applicationNumber);
CREATE INDEX IF NOT EXISTS idx_dristi_order_order_number ON dristi_orders (orderNumber);
CREATE INDEX IF NOT EXISTS idx_dristi_order_filing_number ON dristi_orders (filingNumber);
CREATE INDEX IF NOT EXISTS idx_dristi_order_cnr_number ON dristi_orders (cnrNumber);
CREATE INDEX IF NOT EXISTS idx_dristi_order_order_type ON dristi_orders (orderType);
CREATE INDEX IF NOT EXISTS idx_dristi_order_status ON dristi_orders (status);
CREATE INDEX IF NOT EXISTS idx_dristi_order_document_order_id ON dristi_order_document (order_id);
CREATE INDEX IF NOT EXISTS idx_dristi_order_statute_section_order_id ON dristi_order_statute_section (order_id);
CREATE INDEX IF NOT EXISTS idx_dristi_order_composite_items ON dristi_orders USING GIN (compositeItems);
CREATE INDEX idx_dristi_orders_courtid ON dristi_orders(courtId);
