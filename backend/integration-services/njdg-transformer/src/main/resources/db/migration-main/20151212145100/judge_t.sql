-- Table: public.judge_t

-- DROP TABLE IF EXISTS public.judge_t;

CREATE TABLE IF NOT EXISTS public.judge_t
(
    judge_code integer NOT NULL DEFAULT 0,
    judge_name character varying(200) COLLATE pg_catalog."default" NOT NULL,
    jocode character varying(20) COLLATE pg_catalog."default",
    judge_username character varying(255) COLLATE pg_catalog."default" DEFAULT ''::character varying,
    court_no smallint,
    desg_code smallint NOT NULL DEFAULT 0,
    from_dt date,
    to_dt date,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    id integer NOT NULL,
    CONSTRAINT judge_t_pkey PRIMARY KEY (id),
    CONSTRAINT judge_t_judge_code_key UNIQUE (judge_code)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.judge_t
    OWNER to pucar;

-- Trigger: trg_notify_judge_t

-- DROP TRIGGER IF EXISTS trg_notify_judge_t ON public.judge_t;

CREATE OR REPLACE TRIGGER trg_notify_judge_t
    AFTER INSERT OR UPDATE
    ON public.judge_t
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_change();

-- Trigger: trg_set_updated_at_timestamp_judge_t

-- DROP TRIGGER IF EXISTS trg_set_updated_at_timestamp_judge_t ON public.judge_t;

CREATE OR REPLACE TRIGGER trg_set_updated_at_timestamp_judge_t
    BEFORE UPDATE
    ON public.judge_t
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_timestamp();

-- SEQUENCE: public.judge_t_id_seq

-- DROP SEQUENCE IF EXISTS public.judge_t_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.judge_t_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE public.judge_t_id_seq
    OWNER TO pucar;

ALTER SEQUENCE public.judge_t_id_seq
    OWNED BY public.judge_t.id;

ALTER TABLE IF EXISTS public.judge_t
    ALTER COLUMN id SET DEFAULT nextval('judge_t_id_seq'::regclass);

ALTER TABLE IF EXISTS public.judge_t
    OWNER to pucar;