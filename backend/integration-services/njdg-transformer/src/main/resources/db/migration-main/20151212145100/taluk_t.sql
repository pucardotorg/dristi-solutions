-- Table: public.taluk_t

-- DROP TABLE IF EXISTS public.taluk_t;

CREATE TABLE IF NOT EXISTS public.taluk_t
(
    taluk_code integer NOT NULL,
    name character varying(200) COLLATE pg_catalog."default" NOT NULL,
    nat_code text COLLATE pg_catalog."default",
    dist_code smallint NOT NULL DEFAULT 0,
    state_id smallint NOT NULL DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    id integer NOT NULL,
    CONSTRAINT taluk_t_pkey PRIMARY KEY (id),
    CONSTRAINT taluk_t_taluk_code_key UNIQUE (taluk_code)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.taluk_t
    OWNER to pucar;

-- Trigger: trg_notify_taluk_t

-- DROP TRIGGER IF EXISTS trg_notify_taluk_t ON public.taluk_t;

CREATE OR REPLACE TRIGGER trg_notify_taluk_t
    AFTER INSERT OR UPDATE
    ON public.taluk_t
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_change();

-- Trigger: trg_set_updated_at_timestamp_taluk_t

-- DROP TRIGGER IF EXISTS trg_set_updated_at_timestamp_taluk_t ON public.taluk_t;

CREATE OR REPLACE TRIGGER trg_set_updated_at_timestamp_taluk_t
    BEFORE UPDATE
    ON public.taluk_t
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_timestamp();

-- SEQUENCE: public.taluk_t_id_seq

-- DROP SEQUENCE IF EXISTS public.taluk_t_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.taluk_t_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE public.taluk_t_id_seq
    OWNER TO pucar;

ALTER SEQUENCE public.taluk_t_id_seq
    OWNED BY public.taluk_t.id;

ALTER TABLE IF EXISTS public.taluk_t
    ALTER COLUMN id SET DEFAULT nextval('taluk_t_id_seq'::regclass);