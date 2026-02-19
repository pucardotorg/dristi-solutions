ALTER TABLE dristi_esign_pdf
ADD COLUMN request_blob JSONB NULL,
ADD COLUMN response_blob JSONB NULL,
ADD COLUMN status VARCHAR(20);

ALTER TABLE dristi_esign_pdf
RENAME COLUMN filepath TO unsigned_filepath;
