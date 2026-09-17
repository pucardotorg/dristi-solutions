ALTER TABLE dristi_task
ADD COLUMN caseTitle varchar(1000);

ALTER TABLE dristi_task
ADD COLUMN caseId varchar(1000);

UPDATE dristi_task
SET caseId = dristi_cases.id, caseTitle= dristi_cases.caseTitle
FROM dristi_cases
WHERE dristi_task.filingNumber = dristi_cases.filingNumber;