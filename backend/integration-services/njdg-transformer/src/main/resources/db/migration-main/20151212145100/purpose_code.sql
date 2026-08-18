-- Table: public.purpose_code

-- DROP TABLE IF EXISTS public.purpose_code;

CREATE TABLE IF NOT EXISTS public.purpose_code
(
    purpose_code integer NOT NULL,
    purpose_name character varying(100) COLLATE pg_catalog."default" NOT NULL,
    nat_code text COLLATE pg_catalog."default",
    court_purpose_code character varying(255) COLLATE pg_catalog."default" DEFAULT ''::character varying,
    updated_at timestamp without time zone DEFAULT now(),
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT purpose_code_pkey PRIMARY KEY (id),
    CONSTRAINT purpose_code_purpose_code_key UNIQUE (purpose_code)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.purpose_code
    OWNER to pucar;

-- Trigger: trg_notify_purpose_code

-- DROP TRIGGER IF EXISTS trg_notify_purpose_code ON public.purpose_code;

CREATE OR REPLACE TRIGGER trg_notify_purpose_code
    AFTER INSERT OR UPDATE
    ON public.purpose_code
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_change();

-- Trigger: trg_set_updated_at_timestamp_purpose_code

-- DROP TRIGGER IF EXISTS trg_set_updated_at_timestamp_purpose_code ON public.purpose_code;

CREATE OR REPLACE TRIGGER trg_set_updated_at_timestamp_purpose_code
    BEFORE UPDATE
    ON public.purpose_code
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_timestamp();

-- SEQUENCE: public.purpose_code_id_seq

-- DROP SEQUENCE IF EXISTS public.purpose_code_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.purpose_code_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE public.purpose_code_id_seq
    OWNER TO pucar;

ALTER SEQUENCE public.purpose_code_id_seq
    OWNED BY public.purpose_code.id;

ALTER TABLE IF EXISTS public.purpose_code
    ALTER COLUMN id SET DEFAULT nextval('purpose_code_id_seq'::regclass);