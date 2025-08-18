ALTER TABLE dristi_cases ADD COLUMN  lprNumber varchar(64) NULL;
ALTER TABLE dristi_cases ADD COLUMN isLPR bool DEFAULT false;
ALTER TABLE dristi_cases ADD COLUMN courtCaseNumberBackup varchar(64) NULL;