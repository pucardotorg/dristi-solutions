-- Table: public.case_hearings

-- DROP TABLE IF EXISTS public.case_hearings;

CREATE TABLE IF NOT EXISTS public.case_hearings
(
    id integer NOT NULL,
    cino character(16) COLLATE pg_catalog."default" NOT NULL,
    sr_no integer,
    desg_name text COLLATE pg_catalog."default",
    hearing_date date,
    next_date date,
    purpose_of_listing text COLLATE pg_catalog."default" NOT NULL DEFAULT '0'::text,
    judge_code text COLLATE pg_catalog."default",
    jocode text COLLATE pg_catalog."default",
    desg_code text COLLATE pg_catalog."default",
    hearing_id character varying(255) COLLATE pg_catalog."default" DEFAULT ''::character varying,
    business text COLLATE pg_catalog."default",
    court_no integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT case_hearings_pkey PRIMARY KEY (id),
    CONSTRAINT case_hearings_cino_sr_no_key UNIQUE (cino, sr_no),
    CONSTRAINT case_hearings_cino_fkey FOREIGN KEY (cino)
        REFERENCES public.cases (cino) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.case_hearings
    OWNER to pucar;

-- Trigger: trg_notify_case_hearings

-- DROP TRIGGER IF EXISTS trg_notify_case_hearings ON public.case_hearings;

CREATE OR REPLACE TRIGGER trg_notify_case_hearings
    AFTER INSERT OR UPDATE
    ON public.case_hearings
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_change();

-- Trigger: trg_set_updated_at_timestamp_case_hearings

-- DROP TRIGGER IF EXISTS trg_set_updated_at_timestamp_case_hearings ON public.case_hearings;

CREATE OR REPLACE TRIGGER trg_set_updated_at_timestamp_case_hearings
    BEFORE UPDATE
    ON public.case_hearings
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_timestamp();

-- SEQUENCE: public.case_hearings_id_seq

-- DROP SEQUENCE IF EXISTS public.case_hearings_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.case_hearings_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE public.case_hearings_id_seq
    OWNER TO pucar;

ALTER SEQUENCE public.case_hearings_id_seq
    OWNED BY public.case_hearings.id;

ALTER TABLE IF EXISTS public.case_hearings
    ALTER COLUMN id SET DEFAULT nextval('case_hearings_id_seq'::regclass);