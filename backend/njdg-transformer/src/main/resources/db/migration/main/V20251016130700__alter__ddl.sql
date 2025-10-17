ALTER TABLE case_type ADD COLUMN case_type_court VARCHAR(255) DEFAULT '';
ALTER TABLE advocate_master ADD COLUMN advocate_id VARCHAR(255) DEFAULT '';
ALTER TABLE judge_t ADD COLUMN judge_username VARCHAR(255) DEFAULT '';
ALTER TABLE disp_type ADD COLUMN nat_code TEXT DEFAULT '';
ALTER TABLE desg_type ADD COLUMN court_desg_code VARCHAR(255) DEFAULT '';