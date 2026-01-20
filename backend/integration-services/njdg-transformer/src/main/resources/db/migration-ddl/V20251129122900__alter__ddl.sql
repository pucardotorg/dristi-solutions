CREATE SEQUENCE public.advocate_code_seq
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1;

ALTER TABLE public.advocate_master
ALTER COLUMN advocate_code
SET DEFAULT nextval('public.advocate_code_seq');
ALTER SEQUENCE public.advocate_code_seq OWNER TO pucar;


CREATE SEQUENCE IF NOT EXISTS public.case_conversion_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;
CREATE TABLE IF NOT EXISTS public.case_conversion
(
    id integer NOT NULL DEFAULT nextval('case_conversion_id_seq'::regclass),
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
    CONSTRAINT case_conversion_cino_sr_no_key UNIQUE (cino, sr_no),
    CONSTRAINT case_conversion_cino_fkey FOREIGN KEY (cino)
        REFERENCES public.cases (cino) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
);
ALTER SEQUENCE public.case_conversion_id_seq
    OWNED BY public.case_conversion.id;
ALTER SEQUENCE public.case_conversion_id_seq OWNER TO pucar;
ALTER TABLE public.case_conversion OWNER TO pucar;


CREATE SEQUENCE IF NOT EXISTS public.police_st_code_seq
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1;
ALTER SEQUENCE public.police_st_code_seq
OWNER TO pucar;
ALTER TABLE public.police_t
ALTER COLUMN police_st_code
SET DEFAULT nextval('public.police_st_code_seq');

