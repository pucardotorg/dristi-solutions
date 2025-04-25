ALTER TABLE dristi_application
ADD COLUMN courtId VARCHAR(64);

UPDATE dristi_application
SET courtId = 'KLKM52'
WHERE courtId IS NULL;
