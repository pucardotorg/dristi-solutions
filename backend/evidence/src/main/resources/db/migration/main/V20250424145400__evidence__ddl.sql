ALTER TABLE dristi_evidence_artifact
ADD COLUMN courtId VARCHAR(64);

UPDATE dristi_evidence_artifact
SET courtId = 'KLKM52'
WHERE courtId IS NULL;
