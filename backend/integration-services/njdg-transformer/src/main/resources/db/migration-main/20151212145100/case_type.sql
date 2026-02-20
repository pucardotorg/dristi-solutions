-- Table: public.case_type

-- DROP TABLE IF EXISTS public.case_type;

CREATE TABLE IF NOT EXISTS public.case_type
(
    case_type_code integer NOT NULL,
    type_name character varying(100) COLLATE pg_catalog."default" NOT NULL,
    nat_code text COLLATE pg_catalog."default",
    case_type_court character varying(255) COLLATE pg_catalog."default" DEFAULT ''::character varying,
    type smallint NOT NULL DEFAULT 1,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    id integer NOT NULL,
    CONSTRAINT case_type_pkey PRIMARY KEY (id),
    CONSTRAINT case_type_case_type_code_key UNIQUE (case_type_code)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.case_type
    OWNER to pucar;

-- Trigger: trg_notify_case_type

-- DROP TRIGGER IF EXISTS trg_notify_case_type ON public.case_type;

CREATE OR REPLACE TRIGGER trg_notify_case_type
    AFTER INSERT OR UPDATE
    ON public.case_type
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_change();

-- Trigger: trg_set_updated_at_timestamp_case_type

-- DROP TRIGGER IF EXISTS trg_set_updated_at_timestamp_case_type ON public.case_type;

CREATE OR REPLACE TRIGGER trg_set_updated_at_timestamp_case_type
    BEFORE UPDATE
    ON public.case_type
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_timestamp();

-- SEQUENCE: public.case_type_id_seq

-- DROP SEQUENCE IF EXISTS public.case_type_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.case_type_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE public.case_type_id_seq
    OWNER TO pucar;

ALTER SEQUENCE public.case_type_id_seq
    OWNED BY public.case_type.id;

ALTER TABLE IF EXISTS public.case_type
    ALTER COLUMN id SET DEFAULT nextval('case_type_id_seq'::regclass);