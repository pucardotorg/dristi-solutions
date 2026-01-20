-- Table: public.adj_t

-- DROP TABLE IF EXISTS public.adj_t;

CREATE TABLE IF NOT EXISTS public.adj_t
(
    adj_code integer NOT NULL,
    name character varying(200) COLLATE pg_catalog."default" NOT NULL,
    nat_code text COLLATE pg_catalog."default",
    updated_at timestamp without time zone DEFAULT now(),
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT adj_t_pkey PRIMARY KEY (id),
    CONSTRAINT adj_t_adj_code_key UNIQUE (adj_code)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.adj_t
    OWNER to pucar;

-- Trigger: trg_notify_adj_t

-- DROP TRIGGER IF EXISTS trg_notify_adj_t ON public.adj_t;

CREATE OR REPLACE TRIGGER trg_notify_adj_t
    AFTER INSERT OR UPDATE
    ON public.adj_t
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_change();

-- Trigger: trg_set_updated_at_timestamp_adj_t

-- DROP TRIGGER IF EXISTS trg_set_updated_at_timestamp_adj_t ON public.adj_t;

CREATE OR REPLACE TRIGGER trg_set_updated_at_timestamp_adj_t
    BEFORE UPDATE
    ON public.adj_t
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_timestamp();

-- SEQUENCE: public.adj_t_id_seq

-- DROP SEQUENCE IF EXISTS public.adj_t_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.adj_t_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE public.adj_t_id_seq
    OWNER TO pucar;

ALTER SEQUENCE public.adj_t_id_seq
    OWNED BY public.adj_t.id;

ALTER TABLE IF EXISTS public.adj_t
    ALTER COLUMN id SET DEFAULT nextval('adj_t_id_seq'::regclass);