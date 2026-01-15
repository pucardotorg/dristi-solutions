ALTER TABLE dristi_evidence_artifact
ADD COLUMN seal JSONB,
ADD COLUMN evidenceMarkedStatus VARCHAR(255) NULL,
ADD COLUMN isEvidenceMarkedFlow bool NULL
