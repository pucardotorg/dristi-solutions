-- Table: public.ia_filings

-- DROP TABLE IF EXISTS public.ia_filings;

CREATE TABLE IF NOT EXISTS public.ia_filings
(
    id integer NOT NULL,
    cino character(16) COLLATE pg_catalog."default",
    sr_no integer,
    ia_type text COLLATE pg_catalog."default",
    ia_no text COLLATE pg_catalog."default",
    ia_year integer,
    status character(1) COLLATE pg_catalog."default",
    date_of_filing date,
    updated_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT ia_filings_pkey PRIMARY KEY (id),
    CONSTRAINT ia_filings_status_check CHECK (status = ANY (ARRAY['P'::bpchar, 'D'::bpchar]))
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.ia_filings
    OWNER to pucar;

-- Trigger: trg_notify_ia_filings

-- DROP TRIGGER IF EXISTS trg_notify_ia_filings ON public.ia_filings;

CREATE OR REPLACE TRIGGER trg_notify_ia_filings
    AFTER INSERT OR UPDATE
    ON public.ia_filings
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_change();

-- Trigger: trg_set_updated_at_timestamp_ia_filings

-- DROP TRIGGER IF EXISTS trg_set_updated_at_timestamp_ia_filings ON public.ia_filings;

CREATE OR REPLACE TRIGGER trg_set_updated_at_timestamp_ia_filings
    BEFORE UPDATE
    ON public.ia_filings
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_timestamp();

-- SEQUENCE: public.ia_filings_id_seq

-- DROP SEQUENCE IF EXISTS public.ia_filings_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.ia_filings_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE public.ia_filings_id_seq
    OWNER TO pucar;

ALTER SEQUENCE public.ia_filings_id_seq
    OWNED BY public.ia_filings.id;

ALTER TABLE IF EXISTS public.ia_filings
    ALTER COLUMN id SET DEFAULT nextval('ia_filings_id_seq'::regclass);