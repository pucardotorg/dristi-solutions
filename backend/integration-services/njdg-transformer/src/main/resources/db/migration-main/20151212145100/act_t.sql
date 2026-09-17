-- Table: public.act_t

-- DROP TABLE IF EXISTS public.act_t;

CREATE TABLE IF NOT EXISTS public.act_t
(
    act_code integer NOT NULL,
    act_name character varying(200) COLLATE pg_catalog."default" NOT NULL,
    nat_code text COLLATE pg_catalog."default",
    type character(1) COLLATE pg_catalog."default" DEFAULT 'C'::bpchar,
    created_at timestamp without time zone DEFAULT now(),
    id integer NOT NULL,
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT act_t_pkey PRIMARY KEY (id),
    CONSTRAINT act_t_act_code_key UNIQUE (act_code)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.act_t
    OWNER to pucar;

-- Trigger: trg_notify_act_t

-- DROP TRIGGER IF EXISTS trg_notify_act_t ON public.act_t;

CREATE OR REPLACE TRIGGER trg_notify_act_t
    AFTER INSERT OR UPDATE
    ON public.act_t
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_change();

-- Trigger: trg_set_updated_at_timestamp_act_t

-- DROP TRIGGER IF EXISTS trg_set_updated_at_timestamp_act_t ON public.act_t;

CREATE OR REPLACE TRIGGER trg_set_updated_at_timestamp_act_t
    BEFORE UPDATE
    ON public.act_t
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_timestamp();


    -- SEQUENCE: public.act_t_id_seq

    -- DROP SEQUENCE IF EXISTS public.act_t_id_seq;

    CREATE SEQUENCE IF NOT EXISTS public.act_t_id_seq
        INCREMENT 1
        START 1
        MINVALUE 1
        MAXVALUE 2147483647
        CACHE 1;

    ALTER SEQUENCE public.act_t_id_seq
        OWNER TO pucar;

    ALTER SEQUENCE public.act_t_id_seq
        OWNED BY public.act_t.id;

    ALTER TABLE IF EXISTS public.act_t
        ALTER COLUMN id SET DEFAULT nextval('act_t_id_seq'::regclass);