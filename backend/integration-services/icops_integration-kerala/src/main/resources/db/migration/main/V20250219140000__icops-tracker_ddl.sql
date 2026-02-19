-- Add new columns for storing raw request/response data and failure reason
ALTER TABLE dristi_kerala_icops 
ADD COLUMN request_blob jsonb NULL,
ADD COLUMN response_blob jsonb NULL,
ADD COLUMN failure_reason varchar(1000) NULL,
