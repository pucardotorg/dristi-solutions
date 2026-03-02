-- Table: public.acts

-- DROP TABLE IF EXISTS public.acts;

CREATE TABLE IF NOT EXISTS public.acts
(
    id integer NOT NULL,
    cino character(16) COLLATE pg_catalog."default",
    act_code integer,
    act_name text COLLATE pg_catalog."default",
    act_section text COLLATE pg_catalog."default",
    sr_no integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT acts_pkey PRIMARY KEY (id),
    CONSTRAINT acts_cino_fkey FOREIGN KEY (cino)
        REFERENCES public.cases (cino) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.acts
    OWNER to pucar;

-- Trigger: trg_notify_acts

-- DROP TRIGGER IF EXISTS trg_notify_acts ON public.acts;

CREATE OR REPLACE TRIGGER trg_notify_acts
    AFTER INSERT OR UPDATE
    ON public.acts
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_change();

-- Trigger: trg_set_updated_at_timestamp_acts

-- DROP TRIGGER IF EXISTS trg_set_updated_at_timestamp_acts ON public.acts;

CREATE OR REPLACE TRIGGER trg_set_updated_at_timestamp_acts
    BEFORE UPDATE
    ON public.acts
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_timestamp();

-- SEQUENCE: public.acts_id_seq

-- DROP SEQUENCE IF EXISTS public.acts_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.acts_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE public.acts_id_seq
    OWNER TO pucar;

ALTER SEQUENCE public.acts_id_seq
    OWNED BY public.acts.id;

ALTER TABLE IF EXISTS public.acts
    ALTER COLUMN id SET DEFAULT nextval('acts_id_seq'::regclass);