
CREATE TABLE dristi_kerala_icops (
    process_number varchar(64) NOT NULL PRIMARY KEY,
    tenant_id varchar(64) NOT NULL,
    task_number varchar(64) NULL,
    task_type varchar(64) NULL,
    file_store_id varchar(64) NULL,
    task_details jsonb NULL,
    delivery_status varchar(64) NULL,
    acknowledgement_id varchar(64) NULL,
    remarks varchar(64) NULL,
    additional_details jsonb NULL,
    booking_date varchar(64) NULL,
    received_date varchar(64) NULL,
    row_version int4 NULL
);
 

 ALTER TABLE dristi_kerala_icops
ALTER COLUMN remarks TYPE VARCHAR(1000);
 

 -- Add new columns for storing raw request/response data and failure reason
ALTER TABLE dristi_kerala_icops 
ADD COLUMN request_blob jsonb NULL,
ADD COLUMN response_blob jsonb NULL,
ADD COLUMN failure_reason varchar(1000) NULL;
