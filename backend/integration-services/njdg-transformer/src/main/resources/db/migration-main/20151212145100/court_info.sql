-- Table: public.court_info

-- DROP TABLE IF EXISTS public.court_info;

CREATE TABLE IF NOT EXISTS public.court_info
(
    id integer NOT NULL,
    court_name character varying(200) COLLATE pg_catalog."default" NOT NULL,
    state character varying(200) COLLATE pg_catalog."default" NOT NULL,
    district character varying(20) COLLATE pg_catalog."default" NOT NULL,
    taluka character varying(20) COLLATE pg_catalog."default",
    est_code character(6) COLLATE pg_catalog."default" NOT NULL,
    state_code smallint NOT NULL,
    hide_partyname character(1) COLLATE pg_catalog."default" NOT NULL DEFAULT 'N'::bpchar,
    updated_at timestamp without time zone DEFAULT now(),
    db_name character varying(50) COLLATE pg_catalog."default" NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT court_info_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.court_info
    OWNER to pucar;

-- Trigger: trg_notify_court_info

-- DROP TRIGGER IF EXISTS trg_notify_court_info ON public.court_info;

CREATE OR REPLACE TRIGGER trg_notify_court_info
    AFTER INSERT OR UPDATE
    ON public.court_info
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_change();

-- Trigger: trg_set_updated_at_timestamp_court_info

-- DROP TRIGGER IF EXISTS trg_set_updated_at_timestamp_court_info ON public.court_info;

CREATE OR REPLACE TRIGGER trg_set_updated_at_timestamp_court_info
    BEFORE UPDATE
    ON public.court_info
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_timestamp();

-- SEQUENCE: public.court_info_id_seq

-- DROP SEQUENCE IF EXISTS public.court_info_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.court_info_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE public.court_info_id_seq
    OWNER TO pucar;

ALTER SEQUENCE public.court_info_id_seq
    OWNED BY public.court_info.id;

ALTER TABLE IF EXISTS public.court_info
    ALTER COLUMN id SET DEFAULT nextval('court_info_id_seq'::regclass);