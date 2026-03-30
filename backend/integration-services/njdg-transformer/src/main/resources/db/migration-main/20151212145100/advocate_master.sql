-- Table: public.advocate_master

-- DROP TABLE IF EXISTS public.advocate_master;

CREATE TABLE IF NOT EXISTS public.advocate_master
(
    advocate_code integer NOT NULL,
    advocate_name character varying(200) COLLATE pg_catalog."default" NOT NULL,
    bar_reg_no character varying(50) COLLATE pg_catalog."default",
    advocate_id character varying(255) COLLATE pg_catalog."default" DEFAULT ''::character varying,
    email character varying(100) COLLATE pg_catalog."default",
    phone character varying(20) COLLATE pg_catalog."default",
    address character varying(200) COLLATE pg_catalog."default",
    dob date,
    updated_at timestamp without time zone DEFAULT now(),
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT advocate_master_pkey PRIMARY KEY (id),
    CONSTRAINT advocate_master_advocate_code_key UNIQUE (advocate_code)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.advocate_master
    OWNER to pucar;

-- Trigger: trg_notify_advocate_master

-- DROP TRIGGER IF EXISTS trg_notify_advocate_master ON public.advocate_master;

CREATE OR REPLACE TRIGGER trg_notify_advocate_master
    AFTER INSERT OR UPDATE
    ON public.advocate_master
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_change();

-- Trigger: trg_set_updated_at_timestamp_advocate_master

-- DROP TRIGGER IF EXISTS trg_set_updated_at_timestamp_advocate_master ON public.advocate_master;

CREATE OR REPLACE TRIGGER trg_set_updated_at_timestamp_advocate_master
    BEFORE UPDATE
    ON public.advocate_master
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_timestamp();

-- SEQUENCE: public.advocate_code_seq

-- DROP SEQUENCE IF EXISTS public.advocate_code_seq;

CREATE SEQUENCE IF NOT EXISTS public.advocate_code_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1;

ALTER SEQUENCE public.advocate_code_seq
    OWNER TO pucar;

ALTER SEQUENCE public.advocate_code_seq
    OWNED BY public.advocate_master.advocate_code;

ALTER TABLE IF EXISTS public.advocate_master
    ALTER COLUMN advocate_code SET DEFAULT nextval('advocate_code_seq'::regclass);


-- SEQUENCE: public.advocate_master_id_seq

-- DROP SEQUENCE IF EXISTS public.advocate_master_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.advocate_master_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE public.advocate_master_id_seq
    OWNER TO pucar;

ALTER SEQUENCE public.advocate_master_id_seq
    OWNED BY public.advocate_master.id;

ALTER TABLE IF EXISTS public.advocate_master
    ALTER COLUMN id SET DEFAULT nextval('advocate_master_id_seq'::regclass);