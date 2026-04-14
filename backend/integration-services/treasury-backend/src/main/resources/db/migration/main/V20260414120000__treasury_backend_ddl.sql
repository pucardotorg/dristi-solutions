ALTER TABLE auth_sek_session_data 
ADD COLUMN payment_status VARCHAR(64) DEFAULT 'INITIATED',
ADD COLUMN completion_source VARCHAR(64),
ADD COLUMN verification_timestamp BIGINT;
