-- Table: public.desg_type

-- DROP TABLE IF EXISTS public.desg_type;

CREATE TABLE IF NOT EXISTS public.desg_type
(
    desg_code integer NOT NULL,
    desg_name character varying(100) COLLATE pg_catalog."default" NOT NULL,
    nat_code text COLLATE pg_catalog."default",
    court_desg_code character varying(255) COLLATE pg_catalog."default" DEFAULT ''::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    id integer NOT NULL
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.desg_type
    OWNER to pucar;

-- Trigger: trg_notify_desg_type

-- DROP TRIGGER IF EXISTS trg_notify_desg_type ON public.desg_type;

CREATE OR REPLACE TRIGGER trg_notify_desg_type
    AFTER INSERT OR UPDATE
    ON public.desg_type
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_change();

-- Trigger: trg_set_updated_at_timestamp_desg_type

-- DROP TRIGGER IF EXISTS trg_set_updated_at_timestamp_desg_type ON public.desg_type;

CREATE OR REPLACE TRIGGER trg_set_updated_at_timestamp_desg_type
    BEFORE UPDATE
    ON public.desg_type
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_timestamp();

-- SEQUENCE: public.desg_type_id_seq

-- DROP SEQUENCE IF EXISTS public.desg_type_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.desg_type_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE public.desg_type_id_seq
    OWNER TO pucar;

ALTER SEQUENCE public.desg_type_id_seq
    OWNED BY public.desg_type.id;

ALTER TABLE IF EXISTS public.desg_type
    ALTER COLUMN id SET DEFAULT nextval('desg_type_id_seq'::regclass);