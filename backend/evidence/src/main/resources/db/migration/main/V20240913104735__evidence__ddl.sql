CREATE INDEX IF NOT EXISTS idx_dristi_evidence_artifact_id ON dristi_evidence_artifact (id);
CREATE INDEX IF NOT EXISTS idx_dristi_evidence_artifact_artifact_number ON dristi_evidence_artifact(artifactNumber);
CREATE INDEX IF NOT EXISTS idx_dristi_evidence_artifact_case_id ON dristi_evidence_artifact(caseId);
CREATE INDEX IF NOT EXISTS idx_dristi_evidence_artifact_application ON dristi_evidence_artifact(application);
CREATE INDEX IF NOT EXISTS idx_dristi_evidence_artifact_hearing ON dristi_evidence_artifact(hearing);
CREATE INDEX IF NOT EXISTS idx_dristi_evidence_artifact_orders ON dristi_evidence_artifact(orders);
CREATE INDEX IF NOT EXISTS idx_dristi_evidence_artifact_artifact_type ON dristi_evidence_artifact(artifactType);
CREATE INDEX IF NOT EXISTS idx_dristi_evidence_owner ON dristi_evidence_artifact(createdBy);
CREATE INDEX IF NOT EXISTS idx_driti_evidence_status ON dristi_evidence_artifact(status);

CREATE INDEX IF NOT EXISTS idx_dristi_evidence_document_artifact_id ON dristi_evidence_document (artifactId);
CREATE INDEX IF NOT EXISTS idx_dristi_evidence_document_file_store ON dristi_evidence_document(fileStore);
CREATE INDEX IF NOT EXISTS idx_dristi_evidence_document_document_uid ON dristi_evidence_document(documentUid);
CREATE INDEX IF NOT EXISTS idx_dristi_evidence_document_document_type ON dristi_evidence_document(documentType);

CREATE INDEX IF NOT EXISTS idx_dristi_evidence_comment_artifact_id ON dristi_evidence_comment (artifactId);
CREATE INDEX IF NOT EXISTS idx_dristi_evidence_comment_individual_id ON dristi_evidence_comment(individualId);