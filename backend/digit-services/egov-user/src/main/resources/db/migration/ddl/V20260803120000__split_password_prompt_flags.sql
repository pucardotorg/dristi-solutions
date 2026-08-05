-- Splits the single passwordpromptsuppressed flag into two independent facts:
--   haspassword             - the user has a real password, not the placeholder given at creation.
--                             The UI reads this on _search to choose the password vs. OTP screen.
--   passwordpromptdismissed - the user chose "don't remind me again" on the set-password prompt.
-- The set-password prompt is shown only while a user has neither a password nor a dismissal.
ALTER TABLE eg_user ADD COLUMN haspassword BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE eg_user ADD COLUMN passwordpromptdismissed BOOLEAN NOT NULL DEFAULT FALSE;

-- A previously suppressed prompt meant the user already had a real password (non-citizens from
-- HRMS, or citizens who set one). The dismissal fact was not in real use yet, so it starts false.
UPDATE eg_user SET haspassword = passwordpromptsuppressed;

ALTER TABLE eg_user DROP COLUMN passwordpromptsuppressed;
