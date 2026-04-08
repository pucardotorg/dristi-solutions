DROP TABLE IF EXISTS  eg_pg_transactions;
DROP TABLE IF EXISTS  eg_pg_transactions_dump;

CREATE TABLE "eg_pg_transactions" (
	"txn_id" VARCHAR(128) NOT NULL,
	"txn_amount" NUMERIC(15,2) NOT NULL,
	"txn_status" VARCHAR(64) NOT NULL,
	"txn_status_msg"  VARCHAR(64) NOT NULL,
	"gateway" VARCHAR(64) NOT NULL,
	"bill_id" VARCHAR(64) NOT NULL,
	"module" VARCHAR(64) NOT NULL,
	"module_id" VARCHAR(64) NOT NULL,
	"product_info" VARCHAR(512) NOT NULL,
	"user_uuid" VARCHAR(128) NOT NULL,
	"user_name" VARCHAR(128) NOT NULL,
	"name" VARCHAR(128) NOT NULL,
    "mobile_number" character varying(50),
    "email_id" character varying(128),
	"user_tenant_id" VARCHAR(128) NOT NULL,
    "tenant_id" VARCHAR(128) not null,
	"gateway_txn_id" VARCHAR(128) NULL DEFAULT NULL,
	"gateway_payment_mode" VARCHAR(128) NULL DEFAULT NULL,
	"gateway_status_code" VARCHAR(128) NULL DEFAULT NULL,
	"gateway_status_msg" VARCHAR(128) NULL DEFAULT NULL,
    "receipt" VARCHAR(128) NULL DEFAULT NULL,
    "created_by" character varying(64),
    "created_time" bigint,
    "last_modified_by" character varying(64),
    "last_modified_time" bigint,
	PRIMARY KEY ("txn_id")
);

CREATE TABLE "eg_pg_transactions_dump" (
	"txn_id" VARCHAR(128) NOT NULL,
	"txn_request" varchar NULL,
	"txn_response" JSONB NULL,
    "created_by" character varying(64),
    "created_time" bigint,
    "last_modified_by" character varying(64),
    "last_modified_time" bigint,
	PRIMARY KEY ("txn_id")
);


DROP TABLE IF EXISTS  eg_pg_qrtz_fired_triggers;
DROP TABLE IF EXISTS  eg_pg_qrtz_PAUSED_TRIGGER_GRPS;
DROP TABLE IF EXISTS  eg_pg_qrtz_SCHEDULER_STATE;
DROP TABLE IF EXISTS  eg_pg_qrtz_LOCKS;
DROP TABLE IF EXISTS  eg_pg_qrtz_simple_triggers;
DROP TABLE IF EXISTS  eg_pg_qrtz_cron_triggers;
DROP TABLE IF EXISTS  eg_pg_qrtz_simprop_triggers;
DROP TABLE IF EXISTS  eg_pg_qrtz_BLOB_TRIGGERS;
DROP TABLE IF EXISTS  eg_pg_qrtz_triggers;
DROP TABLE IF EXISTS  eg_pg_qrtz_job_details;
DROP TABLE IF EXISTS  eg_pg_qrtz_calendars;

CREATE TABLE eg_pg_qrtz_job_details
  (
    SCHED_NAME VARCHAR(120) NOT NULL,
    JOB_NAME  VARCHAR(200) NOT NULL,
    JOB_GROUP VARCHAR(200) NOT NULL,
    DESCRIPTION VARCHAR(250) NULL,
    JOB_CLASS_NAME   VARCHAR(250) NOT NULL,
    IS_DURABLE BOOL NOT NULL,
    IS_NONCONCURRENT BOOL NOT NULL,
    IS_UPDATE_DATA BOOL NOT NULL,
    REQUESTS_RECOVERY BOOL NOT NULL,
    JOB_DATA BYTEA NULL,
    PRIMARY KEY (SCHED_NAME,JOB_NAME,JOB_GROUP)
);

CREATE TABLE eg_pg_qrtz_triggers
  (
    SCHED_NAME VARCHAR(120) NOT NULL,
    TRIGGER_NAME VARCHAR(200) NOT NULL,
    TRIGGER_GROUP VARCHAR(200) NOT NULL,
    JOB_NAME  VARCHAR(200) NOT NULL,
    JOB_GROUP VARCHAR(200) NOT NULL,
    DESCRIPTION VARCHAR(250) NULL,
    NEXT_FIRE_TIME BIGINT NULL,
    PREV_FIRE_TIME BIGINT NULL,
    PRIORITY INTEGER NULL,
    TRIGGER_STATE VARCHAR(16) NOT NULL,
    TRIGGER_TYPE VARCHAR(8) NOT NULL,
    START_TIME BIGINT NOT NULL,
    END_TIME BIGINT NULL,
    CALENDAR_NAME VARCHAR(200) NULL,
    MISFIRE_INSTR SMALLINT NULL,
    JOB_DATA BYTEA NULL,
    PRIMARY KEY (SCHED_NAME,TRIGGER_NAME,TRIGGER_GROUP),
    FOREIGN KEY (SCHED_NAME,JOB_NAME,JOB_GROUP)
	REFERENCES eg_pg_qrtz_JOB_DETAILS(SCHED_NAME,JOB_NAME,JOB_GROUP)
);

CREATE TABLE eg_pg_qrtz_simple_triggers
  (
    SCHED_NAME VARCHAR(120) NOT NULL,
    TRIGGER_NAME VARCHAR(200) NOT NULL,
    TRIGGER_GROUP VARCHAR(200) NOT NULL,
    REPEAT_COUNT BIGINT NOT NULL,
    REPEAT_INTERVAL BIGINT NOT NULL,
    TIMES_TRIGGERED BIGINT NOT NULL,
    PRIMARY KEY (SCHED_NAME,TRIGGER_NAME,TRIGGER_GROUP),
    FOREIGN KEY (SCHED_NAME,TRIGGER_NAME,TRIGGER_GROUP)
	REFERENCES eg_pg_qrtz_TRIGGERS(SCHED_NAME,TRIGGER_NAME,TRIGGER_GROUP)
);

CREATE TABLE eg_pg_qrtz_cron_triggers
  (
    SCHED_NAME VARCHAR(120) NOT NULL,
    TRIGGER_NAME VARCHAR(200) NOT NULL,
    TRIGGER_GROUP VARCHAR(200) NOT NULL,
    CRON_EXPRESSION VARCHAR(120) NOT NULL,
    TIME_ZONE_ID VARCHAR(80),
    PRIMARY KEY (SCHED_NAME,TRIGGER_NAME,TRIGGER_GROUP),
    FOREIGN KEY (SCHED_NAME,TRIGGER_NAME,TRIGGER_GROUP)
	REFERENCES eg_pg_qrtz_TRIGGERS(SCHED_NAME,TRIGGER_NAME,TRIGGER_GROUP)
);

CREATE TABLE eg_pg_qrtz_simprop_triggers
  (
    SCHED_NAME VARCHAR(120) NOT NULL,
    TRIGGER_NAME VARCHAR(200) NOT NULL,
    TRIGGER_GROUP VARCHAR(200) NOT NULL,
    STR_PROP_1 VARCHAR(512) NULL,
    STR_PROP_2 VARCHAR(512) NULL,
    STR_PROP_3 VARCHAR(512) NULL,
    INT_PROP_1 INT NULL,
    INT_PROP_2 INT NULL,
    LONG_PROP_1 BIGINT NULL,
    LONG_PROP_2 BIGINT NULL,
    DEC_PROP_1 NUMERIC(13,4) NULL,
    DEC_PROP_2 NUMERIC(13,4) NULL,
    BOOL_PROP_1 BOOL NULL,
    BOOL_PROP_2 BOOL NULL,
    PRIMARY KEY (SCHED_NAME,TRIGGER_NAME,TRIGGER_GROUP),
    FOREIGN KEY (SCHED_NAME,TRIGGER_NAME,TRIGGER_GROUP)
    REFERENCES eg_pg_qrtz_TRIGGERS(SCHED_NAME,TRIGGER_NAME,TRIGGER_GROUP)
);

CREATE TABLE eg_pg_qrtz_blob_triggers
  (
    SCHED_NAME VARCHAR(120) NOT NULL,
    TRIGGER_NAME VARCHAR(200) NOT NULL,
    TRIGGER_GROUP VARCHAR(200) NOT NULL,
    BLOB_DATA BYTEA NULL,
    PRIMARY KEY (SCHED_NAME,TRIGGER_NAME,TRIGGER_GROUP),
    FOREIGN KEY (SCHED_NAME,TRIGGER_NAME,TRIGGER_GROUP)
        REFERENCES eg_pg_qrtz_TRIGGERS(SCHED_NAME,TRIGGER_NAME,TRIGGER_GROUP)
);

CREATE TABLE eg_pg_qrtz_calendars
  (
    SCHED_NAME VARCHAR(120) NOT NULL,
    CALENDAR_NAME  VARCHAR(200) NOT NULL,
    CALENDAR BYTEA NOT NULL,
    PRIMARY KEY (SCHED_NAME,CALENDAR_NAME)
);


CREATE TABLE eg_pg_qrtz_paused_trigger_grps
  (
    SCHED_NAME VARCHAR(120) NOT NULL,
    TRIGGER_GROUP  VARCHAR(200) NOT NULL,
    PRIMARY KEY (SCHED_NAME,TRIGGER_GROUP)
);

CREATE TABLE eg_pg_qrtz_fired_triggers
  (
    SCHED_NAME VARCHAR(120) NOT NULL,
    ENTRY_ID VARCHAR(95) NOT NULL,
    TRIGGER_NAME VARCHAR(200) NOT NULL,
    TRIGGER_GROUP VARCHAR(200) NOT NULL,
    INSTANCE_NAME VARCHAR(200) NOT NULL,
    FIRED_TIME BIGINT NOT NULL,
    SCHED_TIME BIGINT NOT NULL,
    PRIORITY INTEGER NOT NULL,
    STATE VARCHAR(16) NOT NULL,
    JOB_NAME VARCHAR(200) NULL,
    JOB_GROUP VARCHAR(200) NULL,
    IS_NONCONCURRENT BOOL NULL,
    REQUESTS_RECOVERY BOOL NULL,
    PRIMARY KEY (SCHED_NAME,ENTRY_ID)
);

CREATE TABLE eg_pg_qrtz_scheduler_state
  (
    SCHED_NAME VARCHAR(120) NOT NULL,
    INSTANCE_NAME VARCHAR(200) NOT NULL,
    LAST_CHECKIN_TIME BIGINT NOT NULL,
    CHECKIN_INTERVAL BIGINT NOT NULL,
    PRIMARY KEY (SCHED_NAME,INSTANCE_NAME)
);

CREATE TABLE eg_pg_qrtz_locks
  (
    SCHED_NAME VARCHAR(120) NOT NULL,
    LOCK_NAME  VARCHAR(40) NOT NULL,
    PRIMARY KEY (SCHED_NAME,LOCK_NAME)
);

create index idx_eg_pg_qrtz_j_req_recovery on eg_pg_qrtz_job_details(SCHED_NAME,REQUESTS_RECOVERY);
create index idx_eg_pg_qrtz_j_grp on eg_pg_qrtz_job_details(SCHED_NAME,JOB_GROUP);

create index idx_eg_pg_qrtz_t_j on eg_pg_qrtz_triggers(SCHED_NAME,JOB_NAME,JOB_GROUP);
create index idx_eg_pg_qrtz_t_jg on eg_pg_qrtz_triggers(SCHED_NAME,JOB_GROUP);
create index idx_eg_pg_qrtz_t_c on eg_pg_qrtz_triggers(SCHED_NAME,CALENDAR_NAME);
create index idx_eg_pg_qrtz_t_g on eg_pg_qrtz_triggers(SCHED_NAME,TRIGGER_GROUP);
create index idx_eg_pg_qrtz_t_state on eg_pg_qrtz_triggers(SCHED_NAME,TRIGGER_STATE);
create index idx_eg_pg_qrtz_t_n_state on eg_pg_qrtz_triggers(SCHED_NAME,TRIGGER_NAME,TRIGGER_GROUP,TRIGGER_STATE);
create index idx_eg_pg_qrtz_t_n_g_state on eg_pg_qrtz_triggers(SCHED_NAME,TRIGGER_GROUP,TRIGGER_STATE);
create index idx_eg_pg_qrtz_t_next_fire_time on eg_pg_qrtz_triggers(SCHED_NAME,NEXT_FIRE_TIME);
create index idx_eg_pg_qrtz_t_nft_st on eg_pg_qrtz_triggers(SCHED_NAME,TRIGGER_STATE,NEXT_FIRE_TIME);
create index idx_eg_pg_qrtz_t_nft_misfire on eg_pg_qrtz_triggers(SCHED_NAME,MISFIRE_INSTR,NEXT_FIRE_TIME);
create index idx_eg_pg_qrtz_t_nft_st_misfire on eg_pg_qrtz_triggers(SCHED_NAME,MISFIRE_INSTR,NEXT_FIRE_TIME,TRIGGER_STATE);
create index idx_eg_pg_qrtz_t_nft_st_misfire_grp on eg_pg_qrtz_triggers(SCHED_NAME,MISFIRE_INSTR,NEXT_FIRE_TIME,TRIGGER_GROUP,TRIGGER_STATE);

create index idx_eg_pg_qrtz_ft_trig_inst_name on eg_pg_qrtz_fired_triggers(SCHED_NAME,INSTANCE_NAME);
create index idx_eg_pg_qrtz_ft_inst_job_req_rcvry on eg_pg_qrtz_fired_triggers(SCHED_NAME,INSTANCE_NAME,REQUESTS_RECOVERY);
create index idx_eg_pg_qrtz_ft_j_g on eg_pg_qrtz_fired_triggers(SCHED_NAME,JOB_NAME,JOB_GROUP);
create index idx_eg_pg_qrtz_ft_jg on eg_pg_qrtz_fired_triggers(SCHED_NAME,JOB_GROUP);
create index idx_eg_pg_qrtz_ft_t_g on eg_pg_qrtz_fired_triggers(SCHED_NAME,TRIGGER_NAME,TRIGGER_GROUP);
create index idx_eg_pg_qrtz_ft_tg on eg_pg_qrtz_fired_triggers(SCHED_NAME,TRIGGER_GROUP);


ALTER TABLE eg_pg_transactions ALTER COLUMN "module" DROP NOT NULL;
ALTER TABLE eg_pg_transactions ALTER COLUMN "module_id" DROP NOT NULL;
ALTER TABLE eg_pg_transactions ALTER COLUMN "txn_status_msg" DROP NOT NULL;
ALTER TABLE eg_pg_transactions ADD COLUMN "consumer_code" VARCHAR(128);
UPDATE eg_pg_transactions SET consumer_code = module_id;
ALTER TABLE eg_pg_transactions ADD COLUMN "additional_details" JSONB NULL;


