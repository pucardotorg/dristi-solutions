CREATE TABLE dristi_epost_tracker (
    process_number varchar(64) NOT NULL PRIMARY KEY,
    tenant_id varchar(64) NOT NULL,
    file_store_id varchar(64) NULL,
    task_number varchar(64) NULL,
    tracking_number varchar(64) NULL,
    pincode varchar(64) NULL,
    address varchar(1000) NULL,
    delivery_status varchar(64) NULL,
    remarks varchar(64) NULL,
    additional_details jsonb NULL,
    row_version int4 NULL,
    booking_date varchar(64) NULL,
    received_date varchar(64) NULL,
    createdBy varchar(64) NULL,
    lastModifiedBy varchar(64) NULL,
    createdTime int8 NULL,
    lastModifiedTime int8 NULL
);
ALTER TABLE dristi_epost_tracker
ADD COLUMN postal_hub varchar(64);

ALTER TABLE dristi_epost_tracker
ADD COLUMN speed_post_id varchar(64),
ADD COLUMN total_amount varchar(64);

ALTER TABLE dristi_epost_tracker
DROP COLUMN IF EXISTS booking_date,
DROP COLUMN IF EXISTS received_date;

ALTER TABLE dristi_epost_tracker 
ADD COLUMN booking_date int8,
ADD COLUMN received_date int8;

ALTER TABLE dristi_epost_tracker
ADD COLUMN status_update_date int8;

ALTER TABLE dristi_epost_tracker ADD COLUMN task_type VARCHAR(255);
ALTER TABLE dristi_epost_tracker ADD COLUMN respondent_name VARCHAR(255);

ALTER TABLE dristi_epost_tracker ALTER COLUMN remarks TYPE VARCHAR(1000);

ALTER TABLE dristi_epost_tracker ADD COLUMN phone VARCHAR(255);
ALTER TABLE dristi_epost_tracker ADD COLUMN address_obj JSON;