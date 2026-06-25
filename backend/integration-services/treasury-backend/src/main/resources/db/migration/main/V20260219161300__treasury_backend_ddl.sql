ALTER TABLE auth_sek_session_data ADD COLUMN request_blob jsonb NULL;

ALTER TABLE treasury_payment_data ADD COLUMN request_blob jsonb NULL;
ALTER TABLE treasury_payment_data ADD COLUMN response_blob jsonb NULL;
