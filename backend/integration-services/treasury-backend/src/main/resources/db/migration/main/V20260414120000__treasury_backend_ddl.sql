ALTER TABLE auth_sek_session_data 
ADD COLUMN payment_status VARCHAR(64),
ADD COLUMN completion_source VARCHAR(64),
ADD COLUMN verification_timestamp BIGINT,
ADD COLUMN processed_status VARCHAR(64);