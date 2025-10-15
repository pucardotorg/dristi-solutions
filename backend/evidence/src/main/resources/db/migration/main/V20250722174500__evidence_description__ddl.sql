ALTER TABLE dristi_evidence_artifact ALTER COLUMN description TYPE VARCHAR(2000);
ALTER TABLE dristi_evidence_artifact ADD COLUMN shortenedUrl VARCHAR(255) NULL;
ALTER TABLE dristi_evidence_artifact ADD COLUMN witnessMobileNumbers jsonb NULL;
ALTER TABLE dristi_evidence_artifact ADD COLUMN witnessEmails jsonb NULL;