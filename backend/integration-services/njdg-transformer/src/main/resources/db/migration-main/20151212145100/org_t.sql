-- Table: public.org_t

-- DROP TABLE IF EXISTS public.org_t;

CREATE TABLE IF NOT EXISTS public.org_t
(
    org_type integer NOT NULL,
    org_name character varying(200) COLLATE pg_catalog."default" NOT NULL,
    nat_code text COLLATE pg_catalog."default",
    updated_at timestamp without time zone DEFAULT now(),
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT org_t_pkey PRIMARY KEY (id),
    CONSTRAINT org_t_org_type_key UNIQUE (org_type)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.org_t
    OWNER to pucar;

-- Trigger: trg_notify_org_t

-- DROP TRIGGER IF EXISTS trg_notify_org_t ON public.org_t;

CREATE OR REPLACE TRIGGER trg_notify_org_t
    AFTER INSERT OR UPDATE
    ON public.org_t
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_change();

-- Trigger: trg_set_updated_at_timestamp_org_t

-- DROP TRIGGER IF EXISTS trg_set_updated_at_timestamp_org_t ON public.org_t;

CREATE OR REPLACE TRIGGER trg_set_updated_at_timestamp_org_t
    BEFORE UPDATE
    ON public.org_t
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_timestamp();

-- SEQUENCE: public.org_t_id_seq

-- DROP SEQUENCE IF EXISTS public.org_t_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.org_t_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE public.org_t_id_seq
    OWNER TO pucar;

ALTER SEQUENCE public.org_t_id_seq
    OWNED BY public.org_t.id;

ALTER TABLE IF EXISTS public.org_t
    ALTER COLUMN id SET DEFAULT nextval('org_t_id_seq'::regclass);