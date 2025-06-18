// currently there are 1 reason document in prod db

// need to run this query to get the reason document

select * from dristi_evidence_artifact where artifacttype = 'REASON_DOCUMENT';

// need to update the artifact type to REASON_DOCUMENT

update dristi_evidence_artifact SET filingtype = 'DIRECT' where artifacttype = 'REASON_DOCUMENT';



