-- Table: public.case_conversion

-- DROP TABLE IF EXISTS public.case_conversion;

CREATE TABLE IF NOT EXISTS public.case_conversion
(
    id integer NOT NULL,
    cino character(16) COLLATE pg_catalog."default" NOT NULL,
    oldregcase_type smallint,
    oldreg_no integer,
    oldreg_year smallint,
    newregcase_type smallint,
    newreg_no integer,
    newreg_year smallint,
    sr_no integer NOT NULL,
    oldfilcase_type smallint,
    oldfil_no integer,
    oldfil_year smallint,
    newfilcase_type smallint,
    newfil_no integer,
    newfil_year smallint,
    jocode character varying(50) COLLATE pg_catalog."default",
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    converted_at timestamp without time zone DEFAULT now(),
    CONSTRAINT case_conversion_pkey PRIMARY KEY (id),
    CONSTRAINT case_conversion_cino_sr_no_key UNIQUE (cino, sr_no),
    CONSTRAINT case_conversion_cino_fkey FOREIGN KEY (cino)
        REFERENCES public.cases (cino) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.case_conversion
    OWNER to pucar;

-- Trigger: trg_notify_case_conversion

-- DROP TRIGGER IF EXISTS trg_notify_case_conversion ON public.case_conversion;

CREATE OR REPLACE TRIGGER trg_notify_case_conversion
    AFTER INSERT OR UPDATE
    ON public.case_conversion
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_change();

-- Trigger: trg_set_updated_at_timestamp_case_conversion

-- DROP TRIGGER IF EXISTS trg_set_updated_at_timestamp_case_conversion ON public.case_conversion;

CREATE OR REPLACE TRIGGER trg_set_updated_at_timestamp_case_conversion
    BEFORE UPDATE
    ON public.case_conversion
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_timestamp();

-- SEQUENCE: public.case_conversion_id_seq

-- DROP SEQUENCE IF EXISTS public.case_conversion_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.case_conversion_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE public.case_conversion_id_seq
    OWNER TO pucar;

ALTER SEQUENCE public.case_conversion_id_seq
    OWNED BY public.case_conversion.id;

ALTER TABLE IF EXISTS public.case_conversion
    ALTER COLUMN id SET DEFAULT nextval('case_conversion_id_seq'::regclass);