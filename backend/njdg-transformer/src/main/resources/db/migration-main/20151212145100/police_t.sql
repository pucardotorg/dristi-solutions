-- Table: public.police_t

-- DROP TABLE IF EXISTS public.police_t;

CREATE TABLE IF NOT EXISTS public.police_t
(
    police_st_code integer NOT NULL,
    st_name character varying(200) COLLATE pg_catalog."default" NOT NULL,
    nat_code text COLLATE pg_catalog."default",
    police_code text COLLATE pg_catalog."default" DEFAULT ''::text,
    dist_code smallint NOT NULL DEFAULT 0,
    state_id smallint NOT NULL DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    id integer NOT NULL,
    CONSTRAINT police_t_pkey PRIMARY KEY (id),
    CONSTRAINT police_t_police_st_code_key UNIQUE (police_st_code)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.police_t
    OWNER to pucar;

-- Trigger: trg_notify_police_t

-- DROP TRIGGER IF EXISTS trg_notify_police_t ON public.police_t;

CREATE OR REPLACE TRIGGER trg_notify_police_t
    AFTER INSERT OR UPDATE
    ON public.police_t
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_change();

-- Trigger: trg_set_updated_at_timestamp_police_t

-- DROP TRIGGER IF EXISTS trg_set_updated_at_timestamp_police_t ON public.police_t;

CREATE OR REPLACE TRIGGER trg_set_updated_at_timestamp_police_t
    BEFORE UPDATE
    ON public.police_t
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_timestamp();

-- SEQUENCE: public.police_st_code_seq

-- DROP SEQUENCE IF EXISTS public.police_st_code_seq;

CREATE SEQUENCE IF NOT EXISTS public.police_st_code_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1;

ALTER SEQUENCE public.police_st_code_seq
    OWNER TO pucar;

ALTER SEQUENCE public.police_st_code_seq
    OWNED BY public.police_t.police_st_code;

ALTER TABLE IF EXISTS public.police_t
    ALTER COLUMN police_st_code SET DEFAULT nextval('police_st_code_seq'::regclass);

-- SEQUENCE: public.police_t_id_seq

-- DROP SEQUENCE IF EXISTS public.police_t_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.police_t_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE public.police_t_id_seq
    OWNER TO pucar;

ALTER SEQUENCE public.police_t_id_seq
    OWNED BY public.police_t.id;

ALTER TABLE IF EXISTS public.police_t
    ALTER COLUMN id SET DEFAULT nextval('police_t_id_seq'::regclass);