-- Table: public.lc_case_type_t

-- DROP TABLE IF EXISTS public.lc_case_type_t;

CREATE TABLE IF NOT EXISTS public.lc_case_type_t
(
    lc_case_type_code integer NOT NULL,
    type_name character varying(200) COLLATE pg_catalog."default" NOT NULL,
    nat_code text COLLATE pg_catalog."default",
    updated_at timestamp without time zone DEFAULT now(),
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT lc_case_type_t_pkey PRIMARY KEY (id),
    CONSTRAINT lc_case_type_t_lc_case_type_code_key UNIQUE (lc_case_type_code)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.lc_case_type_t
    OWNER to pucar;

-- Trigger: trg_notify_lc_case_type_t

-- DROP TRIGGER IF EXISTS trg_notify_lc_case_type_t ON public.lc_case_type_t;

CREATE OR REPLACE TRIGGER trg_notify_lc_case_type_t
    AFTER INSERT OR UPDATE
    ON public.lc_case_type_t
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_change();

-- Trigger: trg_set_updated_at_timestamp_lc_case_type_t

-- DROP TRIGGER IF EXISTS trg_set_updated_at_timestamp_lc_case_type_t ON public.lc_case_type_t;

CREATE OR REPLACE TRIGGER trg_set_updated_at_timestamp_lc_case_type_t
    BEFORE UPDATE
    ON public.lc_case_type_t
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_timestamp();

-- SEQUENCE: public.lc_case_type_t_id_seq

-- DROP SEQUENCE IF EXISTS public.lc_case_type_t_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.lc_case_type_t_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE public.lc_case_type_t_id_seq
    OWNER TO pucar;

ALTER SEQUENCE public.lc_case_type_t_id_seq
    OWNED BY public.lc_case_type_t.id;

ALTER TABLE IF EXISTS public.lc_case_type_t
    ALTER COLUMN id SET DEFAULT nextval('lc_case_type_t_id_seq'::regclass);