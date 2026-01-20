-- Table: public.doc_type

-- DROP TABLE IF EXISTS public.doc_type;

CREATE TABLE IF NOT EXISTS public.doc_type
(
    doc_code integer NOT NULL,
    doc_name character varying(100) COLLATE pg_catalog."default" NOT NULL,
    nat_code text COLLATE pg_catalog."default",
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    id integer NOT NULL,
    CONSTRAINT doc_type_pkey PRIMARY KEY (id),
    CONSTRAINT doc_type_doc_code_key UNIQUE (doc_code)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.doc_type
    OWNER to pucar;

-- Trigger: trg_notify_doc_type

-- DROP TRIGGER IF EXISTS trg_notify_doc_type ON public.doc_type;

CREATE OR REPLACE TRIGGER trg_notify_doc_type
    AFTER INSERT OR UPDATE
    ON public.doc_type
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_change();

-- Trigger: trg_set_updated_at_timestamp_doc_type

-- DROP TRIGGER IF EXISTS trg_set_updated_at_timestamp_doc_type ON public.doc_type;

CREATE OR REPLACE TRIGGER trg_set_updated_at_timestamp_doc_type
    BEFORE UPDATE
    ON public.doc_type
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_timestamp();

-- SEQUENCE: public.doc_type_id_seq

-- DROP SEQUENCE IF EXISTS public.doc_type_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.doc_type_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE public.doc_type_id_seq
    OWNER TO pucar;

ALTER SEQUENCE public.doc_type_id_seq
    OWNED BY public.doc_type.id;

ALTER TABLE IF EXISTS public.doc_type
    ALTER COLUMN id SET DEFAULT nextval('doc_type_id_seq'::regclass);

ALTER TABLE IF EXISTS public.doc_type
    OWNER to pucar;