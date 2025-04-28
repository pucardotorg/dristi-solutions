ALTER TABLE dristi_task
ADD COLUMN caseTitle varchar(64);

ALTER TABLE dristi_task
ADD COLUMN caseId varchar(64);

UPDATE dristi_task
SET caseId = dristi_cases.id, caseTitle= dristi_cases.caseTitle
FROM dristi_cases
WHERE dristi_task.filingNumber = dristi_cases.filingNumber;