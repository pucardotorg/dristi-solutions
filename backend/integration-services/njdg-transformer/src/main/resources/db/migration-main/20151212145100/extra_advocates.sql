-- Table: public.extra_advocates

-- DROP TABLE IF EXISTS public.extra_advocates;

CREATE TABLE IF NOT EXISTS public.extra_advocates
(
    id integer NOT NULL,
    party_no smallint NOT NULL,
    cino character(16) COLLATE pg_catalog."default",
    pet_res_name character varying(500) COLLATE pg_catalog."default",
    type smallint NOT NULL,
    adv_name character varying(500) COLLATE pg_catalog."default",
    adv_code bigint DEFAULT 0,
    sr_no smallint DEFAULT 0,
    updated_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT extra_advocates_pkey PRIMARY KEY (id),
    CONSTRAINT extra_advocates_cino_fkey FOREIGN KEY (cino)
        REFERENCES public.cases (cino) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.extra_advocates
    OWNER to pucar;

-- Trigger: trg_notify_extra_advocates

-- DROP TRIGGER IF EXISTS trg_notify_extra_advocates ON public.extra_advocates;

CREATE OR REPLACE TRIGGER trg_notify_extra_advocates
    AFTER INSERT OR UPDATE
    ON public.extra_advocates
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_change();

-- Trigger: trg_set_updated_at_timestamp_extra_advocates

-- DROP TRIGGER IF EXISTS trg_set_updated_at_timestamp_extra_advocates ON public.extra_advocates;

CREATE OR REPLACE TRIGGER trg_set_updated_at_timestamp_extra_advocates
    BEFORE UPDATE
    ON public.extra_advocates
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_timestamp();

-- SEQUENCE: public.extra_advocates_id_seq

-- DROP SEQUENCE IF EXISTS public.extra_advocates_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.extra_advocates_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE public.extra_advocates_id_seq
    OWNER TO pucar;

ALTER SEQUENCE public.extra_advocates_id_seq
    OWNED BY public.extra_advocates.id;

ALTER TABLE IF EXISTS public.extra_advocates
    ALTER COLUMN id SET DEFAULT nextval('extra_advocates_id_seq'::regclass);