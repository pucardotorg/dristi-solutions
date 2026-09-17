CREATE SEQUENCE IF NOT EXISTS public.extra_advocates_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;


CREATE TABLE IF NOT EXISTS public.extra_advocates
(
    id integer NOT NULL DEFAULT nextval('extra_advocates_id_seq'::regclass),
    party_no smallint NOT NULL,
    cino character(16) ,
    pet_res_name character varying(500) ,
    type smallint NOT NULL,
    adv_name character varying(500) ,
    adv_code bigint  DEFAULT 0,
    sr_no smallint DEFAULT 0,
    CONSTRAINT extra_advocates_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;
ALTER SEQUENCE public.extra_advocates_id_seq
    OWNED BY public.extra_advocates.id;

ALTER TABLE IF EXISTS public.extra_parties ADD COLUMN sr_no smallint DEFAULT 0;
ALTER TABLE IF EXISTS public.case_hearings ADD COLUMN business text;
ALTER TABLE IF EXISTS public.case_hearings ADD COLUMN court_no integer;