-- Table: public.adv_designation

-- DROP TABLE IF EXISTS public.adv_designation;

CREATE TABLE IF NOT EXISTS public.adv_designation
(
    desg_code integer NOT NULL,
    desg_name character varying(200) COLLATE pg_catalog."default" NOT NULL,
    updated_at timestamp without time zone DEFAULT now(),
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT adv_designation_pkey PRIMARY KEY (id),
    CONSTRAINT adv_designation_desg_code_key UNIQUE (desg_code)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.adv_designation
    OWNER to pucar;

-- Trigger: trg_notify_adv_designation

-- DROP TRIGGER IF EXISTS trg_notify_adv_designation ON public.adv_designation;

CREATE OR REPLACE TRIGGER trg_notify_adv_designation
    AFTER INSERT OR UPDATE
    ON public.adv_designation
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_change();

-- Trigger: trg_set_updated_at_timestamp_adv_designation

-- DROP TRIGGER IF EXISTS trg_set_updated_at_timestamp_adv_designation ON public.adv_designation;

CREATE OR REPLACE TRIGGER trg_set_updated_at_timestamp_adv_designation
    BEFORE UPDATE
    ON public.adv_designation
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_timestamp();

-- SEQUENCE: public.adv_designation_id_seq

-- DROP SEQUENCE IF EXISTS public.adv_designation_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.adv_designation_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE public.adv_designation_id_seq
    OWNER TO pucar;

ALTER SEQUENCE public.adv_designation_id_seq
    OWNED BY public.adv_designation.id;

ALTER TABLE IF EXISTS public.adv_designation
    ALTER COLUMN id SET DEFAULT nextval('adv_designation_id_seq'::regclass);