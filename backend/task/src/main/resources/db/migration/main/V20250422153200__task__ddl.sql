ALTER TABLE dristi_task
ADD COLUMN courtId VARCHAR(64);

UPDATE dristi_task
SET courtId = 'KLKM52'
WHERE courtId IS NULL;
