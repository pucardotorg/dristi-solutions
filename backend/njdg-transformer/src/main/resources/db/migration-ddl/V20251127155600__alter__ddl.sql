ALTER TABLE advocate_master
ADD COLUMN email VARCHAR(100),
ADD COLUMN phone VARCHAR(20),
ADD COLUMN address VARCHAR(200),
ADD COLUMN dob DATE;

ALTER TABLE case_type ADD COLUMN type smallint;
ALTER TABLE act_t ADD COLUMN type character(1) COLLATE pg_catalog."default" DEFAULT 'C'::bpchar;
ALTER TABLE police_t
ADD COLUMN dist_code smallint,
ADD COLUMN state_id smallint;
