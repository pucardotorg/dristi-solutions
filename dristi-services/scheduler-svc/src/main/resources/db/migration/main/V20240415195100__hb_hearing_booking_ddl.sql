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
    case_id                    character varying(64),
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

    CONSTRAINT pk_judge_calendar_rules_id PRIMARY KEY (id),
    CONSTRAINT unique_judge_date_constraint UNIQUE(judge_id, date)


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

    CONSTRAINT pk_opt_out_id PRIMARY KEY (individual_id, reschedule_request_id)

);

CREATE TABLE cause_list (
    court_id             varchar(64),
    judge_id             varchar(64),
    tenant_id            varchar(64),
    case_id              varchar(64),
    case_title           varchar(255),
    litigant_names       varchar(500),
    hearing_type         varchar(64),
    tentative_slot       VARCHAR(255),
    case_date            varchar(64),
    PRIMARY KEY (case_id, case_date)
);

ALTER TABLE reschedule_request_opt_out_detail
ADD COLUMN id varchar(64) NOT NULL;

ALTER TABLE reschedule_request_opt_out_detail
ADD CONSTRAINT unique_id UNIQUE (id);

CREATE TABLE cause_list_document (
    file_store_id varchar(64) NOT NULL,
    court_id varchar(64),
    judge_id varchar(64),
    hearing_date varchar(64) NOT NULL,
    PRIMARY KEY(file_store_id)
);

DROP TABLE IF EXISTS cause_list;
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
    hearing_date VARCHAR(255)
);

ALTER TABLE cause_list ADD COLUMN case_id VARCHAR(255);


ALTER TABLE cause_list_document ADD COLUMN created_time BIGINT;
ALTER TABLE cause_list_document ADD COLUMN tenant_id VARCHAR(255);
ALTER TABLE cause_list_document ADD COLUMN created_by VARCHAR(255);

ALTER TABLE hearing_booking ADD COLUMN expiry_time BIGINT;


ALTER TABLE hearing_booking ADD COLUMN case_stage varchar(64);

ALTER TABLE judge_calendar_rules
ADD COLUMN IF NOT EXISTS court_ids JSONB NULL;