CREATE INDEX IF NOT EXISTS idx_dristi_cases_courtid ON dristi_cases(courtId);

UPDATE dristi_cases
SET courtId = 'KLKM52'
WHERE courtId IS NULL;