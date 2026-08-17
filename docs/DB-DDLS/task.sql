-- =====================================================================
-- Consolidated DDL for task (fresh-install reference)
-- Generated from Flyway migrations in db/migration/main
-- This script represents the FINAL schema state after applying all
-- versioned migrations below, in order. It is a reference/documentation
-- script for provisioning a new environment quickly — it does NOT
-- replace the existing Flyway migration history. Deployed environments
-- must continue to use the original versioned migration files.
--
-- Source files reviewed (12):
--   V20240424110535__task__ddl.sql
--   V20240704110535__task__ddl.sql
--   V20240727110535__task__ddl.sql
--   V20240913120100__task__ddl.sql
--   V20241112155600__task__ddl.sql
--   V20241118152200__task__ddl.sql
--   V20250106153200__task__ddl.sql
--   V20250508153200__task__ddl.sql
--   V20250508153201__task__ddl.sql
--   V20250523120400__task__ddl.sql
--   V20250918130230__task__ddl.sql
--   V20251127130558__task__ddl.sql
-- =====================================================================

-- ==== Sequences ====

CREATE SEQUENCE seq_dristi_task
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- ==== Tables ====

-- dristi_task
-- createdDate/dateCloseBy/dateClosed originally varchar(64), dropped and
-- re-added as int8 in V20240727110535.
-- assignedTo originally varchar(64), dropped and re-added as jsonb in V20240704110535.
-- taskDescription originally varchar(64), widened to unbounded VARCHAR in V20251127130558.
CREATE TABLE dristi_task (
    id                  varchar(64) NOT NULL PRIMARY KEY,
    tenantId            varchar(1000) NOT NULL,
    orderId             varchar(64) NULL,
    filingNumber        VARCHAR(64),
    cnrNumber           varchar(64) NULL,
    taskNumber          varchar(64) NULL,
    createdDate         int8 NULL,
    dateCloseBy         int8 NULL,
    dateClosed          int8 NULL,
    taskDescription     VARCHAR NULL,
    taskType            varchar(64) NULL,
    taskDetails         jsonb NULL,
    status              varchar(64) NULL,
    assignedTo          jsonb NULL,
    isActive            bool NULL,
    additionalDetails   jsonb NULL,
    createdBy           varchar(64) NULL,
    lastModifiedBy      varchar(64) NULL,
    createdTime         int8 NULL,
    lastModifiedTime    int8 NULL,
    referenceId         varchar(64),
    state               varchar(64),
    duedate             varchar(64),
    caseTitle           varchar(1000),
    caseId              varchar(1000),
    courtId             VARCHAR(64)
);

-- dristi_task_document
CREATE TABLE dristi_task_document (
    id                  varchar(64) NOT NULL PRIMARY KEY,
    fileStore           varchar(64) NULL,
    documentUid         varchar(64) NULL,
    documentType        varchar(64) NULL,
    task_id             varchar(64) NULL,
    additionalDetails   JSONB NULL,
    isActive            bool DEFAULT TRUE
);

-- dristi_task_amount
CREATE TABLE dristi_task_amount (
    id                  varchar(64) NOT NULL PRIMARY KEY,
    amount              varchar(64) NULL,
    type                varchar(64) NULL,
    paymentRefNumber    varchar(64) NULL,
    task_id             varchar(64) NULL,
    status              varchar(64) NULL,
    additionalDetails   JSONB NULL
);

-- ==== Indexes ====

CREATE INDEX IF NOT EXISTS idx_dristi_task_order_id ON dristi_task(orderId);
CREATE INDEX IF NOT EXISTS idx_dristi_task_cnr_number ON dristi_task(cnrNumber);
CREATE INDEX IF NOT EXISTS idx_dristi_task_task_number ON dristi_task(taskNumber);
CREATE INDEX IF NOT EXISTS idx_dristi_task_status ON dristi_task(status);
CREATE INDEX IF NOT EXISTS idx_dristi_task_tenant_id ON dristi_task(tenantId);
CREATE INDEX idx_dristi_task_courtid ON dristi_task(courtId);

-- JSONB expression indexes on taskDetails (V20250918130230)
CREATE INDEX IF NOT EXISTS idx_task_notice_type
    ON dristi_task ((taskdetails -> 'noticeDetails' ->> 'noticeType'));

CREATE INDEX IF NOT EXISTS idx_task_delivery_channel_obj
    ON dristi_task ((taskdetails -> 'deliveryChannels' ->> 'channelName'));
CREATE INDEX IF NOT EXISTS idx_task_delivery_channel_elem
    ON dristi_task USING GIN ((taskdetails -> 'deliveryChannels'));

CREATE INDEX IF NOT EXISTS idx_task_hearing_date_epoch
    ON dristi_task (((taskdetails -> 'caseDetails' ->> 'hearingDate')::bigint))
    WHERE taskdetails -> 'caseDetails' ->> 'hearingDate' IS NOT NULL
    AND taskdetails -> 'caseDetails' ->> 'hearingDate' ~ '^[0-9]+$';

CREATE INDEX IF NOT EXISTS idx_dristi_task_document_task_id ON dristi_task_document(task_id);

CREATE INDEX IF NOT EXISTS idx_dristi_task_amount_task_id ON dristi_task_amount(task_id);
