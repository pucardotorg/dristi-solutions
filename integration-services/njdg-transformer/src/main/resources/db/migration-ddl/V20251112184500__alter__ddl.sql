CREATE TABLE IF NOT EXISTS public.court_info (
    id SERIAL PRIMARY KEY,
    court_name VARCHAR(100),
    state VARCHAR(200),
    district VARCHAR(20),
    taluka VARCHAR(20),
    est_code CHAR(6),
    state_code SMALLINT,
    hide_partyname CHAR(1) NOT NULL DEFAULT 'N',
    updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.court_info OWNER TO pucar;

