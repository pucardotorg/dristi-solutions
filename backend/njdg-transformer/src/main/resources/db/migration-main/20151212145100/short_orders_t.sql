-- Table: public.short_orders_t

-- DROP TABLE IF EXISTS public.short_orders_t;

CREATE TABLE IF NOT EXISTS public.short_orders_t
(
    type_id integer NOT NULL,
    name character varying(200) COLLATE pg_catalog."default" NOT NULL,
    updated_at timestamp without time zone DEFAULT now(),
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT short_orders_t_pkey PRIMARY KEY (id),
    CONSTRAINT short_orders_t_type_id_key UNIQUE (type_id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.short_orders_t
    OWNER to pucar;

-- Trigger: trg_notify_short_orders_t

-- DROP TRIGGER IF EXISTS trg_notify_short_orders_t ON public.short_orders_t;

CREATE OR REPLACE TRIGGER trg_notify_short_orders_t
    AFTER INSERT OR UPDATE
    ON public.short_orders_t
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_change();

-- Trigger: trg_set_updated_at_timestamp_short_orders_t

-- DROP TRIGGER IF EXISTS trg_set_updated_at_timestamp_short_orders_t ON public.short_orders_t;

CREATE OR REPLACE TRIGGER trg_set_updated_at_timestamp_short_orders_t
    BEFORE UPDATE
    ON public.short_orders_t
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_timestamp();

-- SEQUENCE: public.short_orders_t_id_seq

-- DROP SEQUENCE IF EXISTS public.short_orders_t_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.short_orders_t_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE public.short_orders_t_id_seq
    OWNER TO pucar;

ALTER SEQUENCE public.short_orders_t_id_seq
    OWNED BY public.short_orders_t.id;

ALTER TABLE IF EXISTS public.short_orders_t
    ALTER COLUMN id SET DEFAULT nextval('short_orders_t_id_seq'::regclass);