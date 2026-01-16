-- Table: public.objection_t

-- DROP TABLE IF EXISTS public.objection_t;

CREATE TABLE IF NOT EXISTS public.objection_t
(
    obj_type_code integer NOT NULL,
    obj_type_name character varying(200) COLLATE pg_catalog."default" NOT NULL,
    updated_at timestamp without time zone DEFAULT now(),
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT objection_t_pkey PRIMARY KEY (id),
    CONSTRAINT objection_t_obj_type_code_key UNIQUE (obj_type_code)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.objection_t
    OWNER to pucar;

-- Trigger: trg_notify_objection_t

-- DROP TRIGGER IF EXISTS trg_notify_objection_t ON public.objection_t;

CREATE OR REPLACE TRIGGER trg_notify_objection_t
    AFTER INSERT OR UPDATE
    ON public.objection_t
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_change();

-- Trigger: trg_set_updated_at_timestamp_objection_t

-- DROP TRIGGER IF EXISTS trg_set_updated_at_timestamp_objection_t ON public.objection_t;

CREATE OR REPLACE TRIGGER trg_set_updated_at_timestamp_objection_t
    BEFORE UPDATE
    ON public.objection_t
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_timestamp();

-- SEQUENCE: public.objection_t_id_seq

-- DROP SEQUENCE IF EXISTS public.objection_t_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.objection_t_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE public.objection_t_id_seq
    OWNER TO pucar;

ALTER SEQUENCE public.objection_t_id_seq
    OWNED BY public.objection_t.id;

ALTER TABLE IF EXISTS public.objection_t
    ALTER COLUMN id SET DEFAULT nextval('objection_t_id_seq'::regclass);