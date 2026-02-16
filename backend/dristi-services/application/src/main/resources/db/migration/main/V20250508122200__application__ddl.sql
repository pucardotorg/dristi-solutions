ALTER TABLE dristi_application
ADD COLUMN courtId VARCHAR(64);

CREATE INDEX idx_dristi_application_courtid ON dristi_application(courtId);

UPDATE dristi_application
SET courtId = 'KLKM52'
WHERE courtId IS NULL;