-- Table: public.ia_objections

-- DROP TABLE IF EXISTS public.ia_objections;

CREATE TABLE IF NOT EXISTS public.ia_objections
(
    ia_id integer,
    objection text COLLATE pg_catalog."default",
    scrutiny_date date,
    obj_receipt_date date,
    updated_at timestamp without time zone DEFAULT now(),
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT ia_objections_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.ia_objections
    OWNER to pucar;

-- Trigger: trg_notify_ia_objections

-- DROP TRIGGER IF EXISTS trg_notify_ia_objections ON public.ia_objections;

CREATE OR REPLACE TRIGGER trg_notify_ia_objections
    AFTER INSERT OR UPDATE
    ON public.ia_objections
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_change();

-- Trigger: trg_set_updated_at_timestamp_ia_objections

-- DROP TRIGGER IF EXISTS trg_set_updated_at_timestamp_ia_objections ON public.ia_objections;

CREATE OR REPLACE TRIGGER trg_set_updated_at_timestamp_ia_objections
    BEFORE UPDATE
    ON public.ia_objections
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_timestamp();

-- SEQUENCE: public.ia_objections_id_seq

-- DROP SEQUENCE IF EXISTS public.ia_objections_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.ia_objections_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE public.ia_objections_id_seq
    OWNER TO pucar;

ALTER SEQUENCE public.ia_objections_id_seq
    OWNED BY public.ia_objections.id;

ALTER TABLE IF EXISTS public.ia_objections
    ALTER COLUMN id SET DEFAULT nextval('ia_objections_id_seq'::regclass);

ALTER TABLE IF EXISTS public.ia_objections
    OWNER to pucar;