-- Table: public.extra_parties

-- DROP TABLE IF EXISTS public.extra_parties;

CREATE TABLE IF NOT EXISTS public.extra_parties
(
    id integer NOT NULL,
    cino character(16) COLLATE pg_catalog."default" NOT NULL,
    party_type character(3) COLLATE pg_catalog."default" NOT NULL,
    party_no integer,
    party_name text COLLATE pg_catalog."default",
    party_address text COLLATE pg_catalog."default",
    party_age integer,
    party_id character varying(255) COLLATE pg_catalog."default" DEFAULT ''::character varying,
    adv_name character varying(255) COLLATE pg_catalog."default",
    adv_cd integer NOT NULL DEFAULT 0,
    sr_no smallint NOT NULL DEFAULT 0,
    updated_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT extra_parties_pkey PRIMARY KEY (id),
    CONSTRAINT extra_parties_cino_sr_no_key UNIQUE (cino, sr_no),
    CONSTRAINT extra_parties_cino_fkey FOREIGN KEY (cino)
        REFERENCES public.cases (cino) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID,
    CONSTRAINT extra_parties_party_type_check CHECK (party_type = ANY (ARRAY['PET'::bpchar, 'RES'::bpchar]))
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.extra_parties
    OWNER to pucar;

-- Trigger: trg_notify_extra_parties

-- DROP TRIGGER IF EXISTS trg_notify_extra_parties ON public.extra_parties;

CREATE OR REPLACE TRIGGER trg_notify_extra_parties
    AFTER INSERT OR UPDATE
    ON public.extra_parties
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_change();

-- Trigger: trg_set_updated_at_timestamp_extra_parties

-- DROP TRIGGER IF EXISTS trg_set_updated_at_timestamp_extra_parties ON public.extra_parties;

CREATE OR REPLACE TRIGGER trg_set_updated_at_timestamp_extra_parties
    BEFORE UPDATE
    ON public.extra_parties
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_timestamp();

-- SEQUENCE: public.extra_parties_id_seq

-- DROP SEQUENCE IF EXISTS public.extra_parties_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.extra_parties_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE public.extra_parties_id_seq
    OWNER TO pucar;

ALTER SEQUENCE public.extra_parties_id_seq
    OWNED BY public.extra_parties.id;

ALTER TABLE IF EXISTS public.extra_parties
    ALTER COLUMN id SET DEFAULT nextval('extra_parties_id_seq'::regclass);

ALTER TABLE IF EXISTS public.extra_parties
    OWNER to pucar;