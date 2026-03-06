ALTER TABLE dristi_task
ADD COLUMN courtId VARCHAR(64);

CREATE INDEX idx_dristi_task_courtid ON dristi_task(courtId);

UPDATE dristi_task
SET courtId = 'KLKM52'
WHERE courtId IS NULL;