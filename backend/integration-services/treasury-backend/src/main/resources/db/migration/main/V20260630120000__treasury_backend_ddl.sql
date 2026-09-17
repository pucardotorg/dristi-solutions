-- Tracks how many times V3 reconciliation has seen treasury status=P (bank-reported "Pending")
-- for a PENDING auth_sek row. Used to fail the row after a bounded number of retries.
-- status=G (bank has not sent any update yet) does NOT consume a retry, so this stays 0 for G rows.
ALTER TABLE auth_sek_session_data
ADD COLUMN retry_count INTEGER DEFAULT 0;
