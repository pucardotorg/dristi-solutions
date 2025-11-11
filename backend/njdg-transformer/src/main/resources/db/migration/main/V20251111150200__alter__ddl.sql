CREATE TABLE IF NOT EXISTS public.extra_advocates
(
    id integer NOT NULL DEFAULT nextval('extra_advocates_id_seq'::regclass),
    party_no smallint NOT NULL,
    cino character(16) ,
    pet_res_name character varying(500) ,
    type smallint NOT NULL,
    adv_name character varying(500) ,
    adv_code bigint  DEFAULT 0,
    sr_no smallint DEFAULT 0,
    CONSTRAINT extra_advocates_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.extra_advocates
    OWNER to postgres;

ALTER TABLE IF EXISTS public.extra_parties ADD COLUMN sr_no smallint DEFAULT 0;