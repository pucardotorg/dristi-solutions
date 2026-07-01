ALTER TABLE dristi_evidence_artifact
ADD COLUMN courtId VARCHAR(64);

CREATE INDEX idx_evidence_artifact_courtid ON dristi_evidence_artifact(courtId);

UPDATE dristi_evidence_artifact
SET courtId = 'KLKM52'
WHERE courtId IS NULL;