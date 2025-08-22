ALTER TABLE dristi_cases ADD COLUMN  lprNumber varchar(64) NULL;
ALTER TABLE dristi_cases ADD COLUMN isLPRCase bool DEFAULT false;
ALTER TABLE dristi_cases ADD COLUMN courtCaseNumberBackup varchar(64) NULL;
ALTER TABLE dristi_cases ADD COLUMN stagebackup varchar(64) NULL;
ALTER TABLE dristi_cases ADD COLUMN substagebackup varchar(64) NULL;