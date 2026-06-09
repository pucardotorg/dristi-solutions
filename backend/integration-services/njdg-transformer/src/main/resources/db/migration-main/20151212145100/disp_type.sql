-- Table: public.disp_type

-- DROP TABLE IF EXISTS public.disp_type;

CREATE TABLE IF NOT EXISTS public.disp_type
(
    type_code integer NOT NULL,
    type_name character varying(100) COLLATE pg_catalog."default" NOT NULL,
    nat_code text COLLATE pg_catalog."default" DEFAULT ''::text,
    court_disp_code character varying(255) COLLATE pg_catalog."default" DEFAULT ''::character varying,
    disp_nature character varying(255) COLLATE pg_catalog."default" DEFAULT ''::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    id integer NOT NULL,
    CONSTRAINT disp_type_pkey PRIMARY KEY (id),
    CONSTRAINT disp_type_type_code_key UNIQUE (type_code)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.disp_type
    OWNER to pucar;

-- Trigger: trg_notify_disp_type

-- DROP TRIGGER IF EXISTS trg_notify_disp_type ON public.disp_type;

CREATE OR REPLACE TRIGGER trg_notify_disp_type
    AFTER INSERT OR UPDATE
    ON public.disp_type
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_change();

-- Trigger: trg_set_updated_at_timestamp_disp_type

-- DROP TRIGGER IF EXISTS trg_set_updated_at_timestamp_disp_type ON public.disp_type;

CREATE OR REPLACE TRIGGER trg_set_updated_at_timestamp_disp_type
    BEFORE UPDATE
    ON public.disp_type
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_timestamp();

-- SEQUENCE: public.disp_type_id_seq

-- DROP SEQUENCE IF EXISTS public.disp_type_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.disp_type_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE public.disp_type_id_seq
    OWNER TO pucar;

ALTER SEQUENCE public.disp_type_id_seq
    OWNED BY public.disp_type.id;

ALTER TABLE IF EXISTS public.disp_type
    ALTER COLUMN id SET DEFAULT nextval('disp_type_id_seq'::regclass);