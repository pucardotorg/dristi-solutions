-- Tracks whether the "set a password" prompt has been dealt with for a user, either because
-- they set a password or because they chose not to be asked again. The UI reads the derived
-- flag on the login response to decide whether to show the prompt.
ALTER TABLE eg_user ADD COLUMN passwordpromptsuppressed BOOLEAN NOT NULL DEFAULT FALSE;

-- Existing non-citizen users are created with a password supplied by the caller (HRMS and the
-- like), so they already have a real one and must not be prompted. Citizens registered through
-- the OTP flow hold a generated placeholder password and are left unsuppressed so they get the
-- prompt on their next login.
UPDATE eg_user SET passwordpromptsuppressed = TRUE WHERE type <> 'CITIZEN';
