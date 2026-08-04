-- =====================================================================
-- Consolidated DDL for scheduler-svc (fresh-install reference)
-- Generated from Flyway migrations in db/migration/main
-- This script represents the FINAL schema state after applying all
-- versioned migrations below, in order. It is a reference/documentation
-- script for provisioning a new environment quickly — it does NOT
-- replace the existing Flyway migration history. Deployed environments
-- must continue to use the original versioned migration files.
--
-- Source files reviewed (13):
--   V20240415195100__hb_hearing_booking_ddl.sql
--   V20240415195200__hbr_hearing_booking_reschedule_request_ddl.sql
--   V20240416132900__jc_judge_calendar_ddl.sql
--   V20240505144400__oo_opt_out_ddl.sql
--   V20240508132900__causelist_ddl.sql
--   V20240912115200__oo_opt_out_id_ddl.sql
--   V20240923143000__causelist_ddl.sql
--   V20240923200900__causelist_ddl.sql
--   V20240926163300__causelist_ddl.sql
--   V20240930143000__causelist_ddl.sql
--   V20250226152900__hearing_booking_expiry__ddl.sql
--   V20250523125100__hearing_booking_alter_ddl.sql
--   V20250605145300__judge_calendar__ddl.sql
--
-- Notes on evolution:
--   - The original cause_list table created in V20240508132900
--     (court_id, judge_id, tenant_id, case_id, case_title,
--     litigant_names, hearing_type, tentative_slot, case_date,
--     PK(case_id, case_date)) was fully DROPPED and re-created with a
--     different shape in V20240923200900. Only the final shape
--     (further altered by V20240926163300) is reflected below.
--   - cause_list.id / landing_page_notice.id / eg_service_health*.id
--     are not applicable here; cause_list uses SERIAL which implicitly
--     creates and owns sequence cause_list_id_seq (not created
--     explicitly via CREATE SEQUENCE in the source migrations).
-- =====================================================================

-- ==== Sequences ====
-- (none created explicitly; cause_list.id below uses SERIAL, which
--  implicitly creates and owns sequence "cause_list_id_seq")

-- ==== Tables ====

CREATE TABLE hearing_booking
(
    court_id                character varying(64),
    judge_id                character varying(64),
    case_id                 character varying(64),
    hearing_booking_id      character varying(64),
    hearing_type            character varying(64),
    hearing_date            bigint,
    title                   character varying(512),
    description             text,
    status                  character varying(64),
    start_time              bigint,
    end_time                bigint,
    created_by              character varying(64),
    created_time            bigint,
    last_modified_by        character varying(64),
    last_modified_time      bigint,
    row_version             bigint,
    tenant_id               character varying(64),
    reschedule_request_id   character varying(64),
    expiry_time             BIGINT,
    case_stage              varchar(64),

    CONSTRAINT pk_hearing_booking_id PRIMARY KEY (hearing_booking_id)
);

CREATE TABLE hearing_booking_reschedule_request (
    hearing_booking_id          character varying(64),
    reschedule_request_id       character varying(64),
    requester_id                character varying(64),
    status                      character varying(64),
    reason                      text,
    created_by                  character varying(64),
    created_time                bigint,
    last_modified_by            character varying(64),
    last_modified_time          bigint,
    row_version                 bigint,
    tenant_id                   character varying(64),
    case_id                     character varying(64),
    judge_id                    character varying(64),
    representatives             jsonb,
    litigants                   jsonb,
    suggested_days              jsonb,
    available_days              jsonb,

    CONSTRAINT pk_hearing_booking_reschedule_request_id PRIMARY KEY (reschedule_request_id)
);

CREATE TABLE judge_calendar_rules (
    judge_id                varchar(64),
    id                      varchar(64),
    rule_type               varchar(64),
    date                    bigint,
    notes                   text,
    created_by              character varying(64),
    created_time            bigint,
    last_modified_by        character varying(64),
    last_modified_time      bigint,
    row_version             bigint,
    tenant_id               character varying(64),
    court_ids               JSONB NULL,

    CONSTRAINT pk_judge_calendar_rules_id PRIMARY KEY (id),
    CONSTRAINT unique_judge_date_constraint UNIQUE (judge_id, date)
);

CREATE TABLE reschedule_request_opt_out_detail
(
    individual_id                       character varying(64),
    judge_id                            character varying(64),
    case_id                             character varying(64),
    reschedule_request_id               character varying(64),
    opt_out_dates                       jsonb,
    created_by                          character varying(64),
    created_time                        bigint,
    last_modified_by                    character varying(64),
    last_modified_time                  bigint,
    row_version                         bigint,
    tenant_id                           character varying(64),
    id                                  varchar(64) NOT NULL,

    CONSTRAINT pk_opt_out_id PRIMARY KEY (individual_id, reschedule_request_id),
    CONSTRAINT unique_id UNIQUE (id)
);

-- cause_list: final shape after the V20240923200900 drop/recreate and the
-- V20240926163300 ALTER (see notes above).
CREATE TABLE cause_list (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(255),
    hearing_id VARCHAR(255),
    filing_number VARCHAR(255),
    application_number JSONB,
    hearing_type VARCHAR(255),
    start_time BIGINT,
    end_time BIGINT,
    case_type VARCHAR(255),
    case_title VARCHAR(255),
    case_registration_date BIGINT,
    case_number VARCHAR(255),
    cmp_number VARCHAR(255),
    court_id VARCHAR(255),
    judge_id VARCHAR(255),
    advocate_names JSONB,
    slot VARCHAR(255),
    hearing_date VARCHAR(255),
    case_id VARCHAR(255)
);

CREATE TABLE cause_list_document (
    file_store_id varchar(64) NOT NULL,
    court_id varchar(64),
    judge_id varchar(64),
    hearing_date varchar(64) NOT NULL,
    created_time BIGINT,
    tenant_id VARCHAR(255),
    created_by VARCHAR(255),
    PRIMARY KEY (file_store_id)
);

-- ==== Indexes ====
-- (no explicit CREATE INDEX statements in the source migrations for this
--  service; primary key / unique constraints above create their own
--  implicit indexes)
