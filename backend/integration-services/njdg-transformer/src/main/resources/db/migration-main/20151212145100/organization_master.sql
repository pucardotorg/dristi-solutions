-- Table: public.organization_master

-- DROP TABLE IF EXISTS public.organization_master;

CREATE TABLE IF NOT EXISTS public.organization_master
(
    org_id integer NOT NULL,
    org_name character varying(200) COLLATE pg_catalog."default" NOT NULL,
    updated_at timestamp without time zone DEFAULT now(),
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT organization_master_pkey PRIMARY KEY (id),
    CONSTRAINT organization_master_org_id_key UNIQUE (org_id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.organization_master
    OWNER to pucar;

-- Trigger: trg_notify_organization_master

-- DROP TRIGGER IF EXISTS trg_notify_organization_master ON public.organization_master;

CREATE OR REPLACE TRIGGER trg_notify_organization_master
    AFTER INSERT OR UPDATE
    ON public.organization_master
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_change();

-- Trigger: trg_set_updated_at_timestamp_organization_master

-- DROP TRIGGER IF EXISTS trg_set_updated_at_timestamp_organization_master ON public.organization_master;

CREATE OR REPLACE TRIGGER trg_set_updated_at_timestamp_organization_master
    BEFORE UPDATE
    ON public.organization_master
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_timestamp();

-- SEQUENCE: public.organization_master_id_seq

-- DROP SEQUENCE IF EXISTS public.organization_master_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.organization_master_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE public.organization_master_id_seq
    OWNER TO pucar;

ALTER SEQUENCE public.organization_master_id_seq
    OWNED BY public.organization_master.id;

ALTER TABLE IF EXISTS public.organization_master
    ALTER COLUMN id SET DEFAULT nextval('organization_master_id_seq'::regclass);