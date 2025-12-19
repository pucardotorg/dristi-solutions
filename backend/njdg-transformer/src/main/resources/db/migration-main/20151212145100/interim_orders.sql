-- Table: public.interim_orders

-- DROP TABLE IF EXISTS public.interim_orders;

CREATE TABLE IF NOT EXISTS public.interim_orders
(
    id integer NOT NULL,
    cino character(16) COLLATE pg_catalog."default" NOT NULL,
    sr_no integer,
    order_no integer NOT NULL DEFAULT 0,
    order_date date,
    order_details bytea,
    order_type character varying(255) COLLATE pg_catalog."default" DEFAULT ''::character varying,
    order_number character varying(255) COLLATE pg_catalog."default" DEFAULT ''::character varying,
    updated_at timestamp without time zone DEFAULT now(),
    doc_type smallint NOT NULL DEFAULT 0,
    jocode character varying(20) COLLATE pg_catalog."default",
    disp_reason smallint NOT NULL DEFAULT 0,
    court_no smallint NOT NULL DEFAULT 0,
    judge_code smallint,
    desig_code smallint,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT interim_orders_pkey PRIMARY KEY (id),
    CONSTRAINT interim_orders_cino_order_no_key UNIQUE (cino, order_no),
    CONSTRAINT interim_orders_cino_fkey FOREIGN KEY (cino)
        REFERENCES public.cases (cino) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.interim_orders
    OWNER to pucar;

-- Trigger: trg_notify_interim_orders

-- DROP TRIGGER IF EXISTS trg_notify_interim_orders ON public.interim_orders;

CREATE OR REPLACE TRIGGER trg_notify_interim_orders
    AFTER INSERT OR UPDATE
    ON public.interim_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_change();

-- Trigger: trg_set_updated_at_timestamp_interim_orders

-- DROP TRIGGER IF EXISTS trg_set_updated_at_timestamp_interim_orders ON public.interim_orders;

CREATE OR REPLACE TRIGGER trg_set_updated_at_timestamp_interim_orders
    BEFORE UPDATE
    ON public.interim_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_timestamp();

-- SEQUENCE: public.interim_orders_id_seq

-- DROP SEQUENCE IF EXISTS public.interim_orders_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.interim_orders_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE public.interim_orders_id_seq
    OWNER TO pucar;

ALTER SEQUENCE public.interim_orders_id_seq
    OWNED BY public.interim_orders.id;

ALTER TABLE IF EXISTS public.interim_orders
    ALTER COLUMN id SET DEFAULT nextval('interim_orders_id_seq'::regclass);

ALTER TABLE IF EXISTS public.interim_orders
    OWNER to pucar;