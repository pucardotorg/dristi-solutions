// currently there are 1 reason document in prod db

// need to run this query to get the reason document

select * from dristi_evidence_artifact where artifacttype = 'REASON_DOCUMENT';

// need to update the artifact type to REASON_DOCUMENT

UPDATE dristi_evidence_artifact
SET isvoid = false,filingtype = 'DIRECT',status='SUBMITTED'
WHERE artifacttype = 'REASON_DOCUMENT';

// need to check what should be source type with bhuvanyu

and need to update the source type to either accussed or complainant based on the data


