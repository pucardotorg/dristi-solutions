CREATE TABLE dristi_task (
                              id varchar(64) NOT NULL PRIMARY KEY,
                              tenantId varchar(1000) NOT NULL,
                              orderId varchar(64) NULL,
                              filingNumber VARCHAR(64),
                              cnrNumber varchar(64) NULL,
                              taskNumber varchar(64) NULL,
                              createdDate varchar(64) NULL,
                              dateCloseBy varchar(64) NULL,
                              dateClosed varchar(64) NULL,
                              taskDescription varchar(64) NULL,
                              taskType varchar(64) NULL,
                              taskDetails jsonb NULL,
                              status varchar(64) NULL,
                              assignedTo varchar(64) NULL,
                              isActive bool NULL,
                              additionalDetails jsonb NULL,
                              createdBy varchar(64) NULL,
                              lastModifiedBy varchar(64) NULL,
                              createdTime int8 NULL,
                              lastModifiedTime int8 NULL
);
CREATE TABLE dristi_task_document (
                              id varchar(64) NOT NULL PRIMARY KEY,
                              fileStore varchar(64) NULL,
                              documentUid varchar(64)  NULL ,
                              documentType varchar(64) NULL,
                              task_id varchar(64)  NULL,
                              additionalDetails JSONB NULL
);

CREATE TABLE dristi_task_amount (
                              id varchar(64) NOT NULL PRIMARY KEY,
                              amount varchar(64) NULL,
                              type varchar(64)  NULL ,
                              paymentRefNumber varchar(64) NULL,
                              task_id varchar(64)  NULL,
                              status varchar(64)  NULL,
                              additionalDetails JSONB NULL
);

CREATE SEQUENCE seq_dristi_task
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE dristi_task
DROP COLUMN assignedTo;
ALTER TABLE dristi_task
ADD COLUMN assignedTo jsonb NULL;


ALTER TABLE dristi_task
DROP COLUMN createdDate;

ALTER TABLE dristi_task
DROP COLUMN dateCloseBy;

ALTER TABLE dristi_task
DROP COLUMN dateClosed;

ALTER TABLE dristi_task
ADD COLUMN createdDate int8 NULL;

ALTER TABLE dristi_task
ADD COLUMN dateCloseBy int8 NULL;

ALTER TABLE dristi_task
ADD COLUMN dateClosed int8 NULL;

CREATE INDEX IF NOT EXISTS idx_dristi_task_order_id ON dristi_task(orderId);
CREATE INDEX IF NOT EXISTS idx_dristi_task_cnr_number ON dristi_task(cnrNumber);
CREATE INDEX IF NOT EXISTS idx_dristi_task_task_number ON dristi_task(taskNumber);
CREATE INDEX IF NOT EXISTS idx_dristi_task_status ON dristi_task(status);

CREATE INDEX IF NOT EXISTS idx_dristi_task_document_task_id ON dristi_task_document(task_id);

CREATE INDEX IF NOT EXISTS idx_dristi_task_amount_task_id ON dristi_task_amount(task_id);

ALTER TABLE dristi_task
ADD COLUMN referenceId varchar (64),
ADD COLUMN state varchar (64);

ALTER TABLE dristi_task
ADD COLUMN duedate varchar(64);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dristi_task_tenant_id ON dristi_task(tenantId);


ALTER TABLE dristi_task
ADD COLUMN caseTitle varchar(1000);

ALTER TABLE dristi_task
ADD COLUMN caseId varchar(1000);

UPDATE dristi_task
SET caseId = dristi_cases.id, caseTitle= dristi_cases.caseTitle
FROM dristi_cases
WHERE dristi_task.filingNumber = dristi_cases.filingNumber;

ALTER TABLE dristi_task
ADD COLUMN courtId VARCHAR(64);

CREATE INDEX idx_dristi_task_courtid ON dristi_task(courtId);

ALTER TABLE dristi_task_document
ADD COLUMN  isActive bool DEFAULT TRUE;


-- noticeType
CREATE INDEX IF NOT EXISTS idx_task_notice_type
    ON dristi_task ((taskdetails -> 'noticeDetails' ->> 'noticeType'));

-- deliveryChannels (object or array)
CREATE INDEX IF NOT EXISTS idx_task_delivery_channel_obj
    ON dristi_task ((taskdetails -> 'deliveryChannels' ->> 'channelName'));
CREATE INDEX IF NOT EXISTS idx_task_delivery_channel_elem
    ON dristi_task USING GIN ((taskdetails -> 'deliveryChannels'));

-- hearingDate epoch (as text cast to bigint)
CREATE INDEX IF NOT EXISTS idx_task_hearing_date_epoch
    ON dristi_task (((taskdetails -> 'caseDetails' ->> 'hearingDate')::bigint))
    WHERE taskdetails -> 'caseDetails' ->> 'hearingDate' IS NOT NULL
    AND taskdetails -> 'caseDetails' ->> 'hearingDate' ~ '^[0-9]+$';

ALTER TABLE dristi_task
ALTER COLUMN taskDescription TYPE VARCHAR;