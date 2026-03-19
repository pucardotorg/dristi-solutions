-- Table: public.ia_case_type

-- DROP TABLE IF EXISTS public.ia_case_type;

CREATE TABLE IF NOT EXISTS public.ia_case_type
(
    ia_type_code integer NOT NULL,
    ia_type_name character varying(50) COLLATE pg_catalog."default" NOT NULL,
    updated_at timestamp without time zone DEFAULT now(),
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT ia_case_type_pkey PRIMARY KEY (id),
    CONSTRAINT ia_case_type_ia_type_code_key UNIQUE (ia_type_code)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.ia_case_type
    OWNER to pucar;

-- Trigger: trg_notify_ia_case_type

-- DROP TRIGGER IF EXISTS trg_notify_ia_case_type ON public.ia_case_type;

CREATE OR REPLACE TRIGGER trg_notify_ia_case_type
    AFTER INSERT OR UPDATE
    ON public.ia_case_type
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_change();

-- Trigger: trg_set_updated_at_timestamp_ia_case_type

-- DROP TRIGGER IF EXISTS trg_set_updated_at_timestamp_ia_case_type ON public.ia_case_type;

CREATE OR REPLACE TRIGGER trg_set_updated_at_timestamp_ia_case_type
    BEFORE UPDATE
    ON public.ia_case_type
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_timestamp();

-- SEQUENCE: public.ia_case_type_id_seq

-- DROP SEQUENCE IF EXISTS public.ia_case_type_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.ia_case_type_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE public.ia_case_type_id_seq
    OWNER TO pucar;

ALTER SEQUENCE public.ia_case_type_id_seq
    OWNED BY public.ia_case_type.id;

ALTER TABLE IF EXISTS public.ia_case_type
    ALTER COLUMN id SET DEFAULT nextval('ia_case_type_id_seq'::regclass);

ALTER TABLE IF EXISTS public.ia_case_type
    OWNER to pucar;