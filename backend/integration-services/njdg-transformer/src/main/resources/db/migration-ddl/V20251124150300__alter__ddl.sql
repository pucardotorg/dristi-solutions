ALTER TABLE judge_t
ADD COLUMN court_no smallint,
ADD COLUMN desg_code smallint NOT NULL DEFAULT 0,
ADD COLUMN from_dt date,
ADD COLUMN to_dt date;