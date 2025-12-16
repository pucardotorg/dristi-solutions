-- Table: public.district_t

-- DROP TABLE IF EXISTS public.district_t;

CREATE TABLE IF NOT EXISTS public.district_t
(
    district_code integer NOT NULL,
    name character varying(200) COLLATE pg_catalog."default" NOT NULL,
    nat_code text COLLATE pg_catalog."default",
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    id integer NOT NULL,
    CONSTRAINT district_t_pkey PRIMARY KEY (id),
    CONSTRAINT district_t_district_code_key UNIQUE (district_code)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.district_t
    OWNER to pucar;

-- Trigger: trg_notify_district_t

-- DROP TRIGGER IF EXISTS trg_notify_district_t ON public.district_t;

CREATE OR REPLACE TRIGGER trg_notify_district_t
    AFTER INSERT OR UPDATE
    ON public.district_t
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_change();

-- Trigger: trg_set_updated_at_timestamp_district_t

-- DROP TRIGGER IF EXISTS trg_set_updated_at_timestamp_district_t ON public.district_t;

CREATE OR REPLACE TRIGGER trg_set_updated_at_timestamp_district_t
    BEFORE UPDATE
    ON public.district_t
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_timestamp();

-- SEQUENCE: public.district_t_id_seq

-- DROP SEQUENCE IF EXISTS public.district_t_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.district_t_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE public.district_t_id_seq
    OWNER TO pucar;

ALTER SEQUENCE public.district_t_id_seq
    OWNED BY public.district_t.id;

ALTER TABLE IF EXISTS public.district_t
    ALTER COLUMN id SET DEFAULT nextval('district_t_id_seq'::regclass);