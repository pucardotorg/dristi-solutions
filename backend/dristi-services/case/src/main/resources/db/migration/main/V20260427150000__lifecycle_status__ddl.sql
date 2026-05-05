ALTER TABLE dristi_cases ADD COLUMN lifecycleStatus varchar(32) DEFAULT 'ACTIVE';

-- Migrate existing data from isLPRCase boolean to lifecycleStatus enum
UPDATE dristi_cases SET lifecycleStatus = 'LPR' WHERE isLPRCase = true;
UPDATE dristi_cases SET lifecycleStatus = 'ACTIVE' WHERE isLPRCase = false OR isLPRCase IS NULL;

-- For LPR cases, move stageBackup to stage
UPDATE dristi_cases SET stage = stagebackup WHERE isLPRCase = true AND stagebackup IS NOT NULL;

-- Drop the old boolean column
ALTER TABLE dristi_cases DROP COLUMN IF EXISTS isLPRCase;

-- Drop stageBackup, substageBackup, and substage columns
ALTER TABLE dristi_cases DROP COLUMN IF EXISTS stagebackup;
ALTER TABLE dristi_cases DROP COLUMN IF EXISTS substagebackup;
ALTER TABLE dristi_cases DROP COLUMN IF EXISTS substage;
