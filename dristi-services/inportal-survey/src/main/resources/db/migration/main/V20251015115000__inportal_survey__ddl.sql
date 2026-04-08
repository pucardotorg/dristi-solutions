CREATE TABLE inportal_survey_tracker (
    user_uuid varchar(64) NOT NULL primary key,
    user_type VARCHAR(64),
    tenant_id VARCHAR(64),
    remind_me_later BOOLEAN,
    expiry_date int8,
    attempts int8,
    created_by varchar(64) NOT NULL,
    last_modified_by varchar(64) NOT NULL,
    created_time int8 NOT NULL,
    last_modified_time int8 NOT NULL
);

CREATE TABLE inportal_survey_feedback (
    uuid varchar(64) NOT NULL primary key,
    rating varchar(64),
    category varchar(64),
    tenant_id VARCHAR(64),
    feedback varchar,
    created_by varchar(64) NOT NULL,
    last_modified_by varchar(64) NOT NULL,
    created_time int8 NOT NULL,
    last_modified_time int8 NOT NULL
);

ALTER TABLE inportal_survey_tracker rename column expiry_date to last_triggered_date;