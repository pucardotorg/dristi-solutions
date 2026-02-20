ALTER TABLE dristi_casediary
RENAME COLUMN judge_id TO court_id;

ALTER TABLE dristi_diaryentries
RENAME COLUMN judge_id TO court_id;

UPDATE dristi_casediary
SET court_id = 'KLKM52';

UPDATE dristi_diaryentries
SET court_id = 'KLKM52';

UPDATE eg_wf_processinstance_v2 SET businessid = REPLACE(businessid, 'JUDGE_ID', 'KLKM52') WHERE businessid LIKE 'JUDGE_ID%' AND businessservice='case-a-diary';


DROP INDEX IF EXISTS idx_dristi_casediary_type_judge;
DROP INDEX IF EXISTS idx_dristi_casediary_date;


CREATE INDEX idx_dristi_casediary_type_court ON dristi_casediary(tenant_id, diary_type, court_id);
CREATE INDEX idx_dristi_casediary_date ON dristi_casediary(tenant_id, court_id, diary_date);
