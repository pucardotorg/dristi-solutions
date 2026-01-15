-- Table: public.cases
 
 -- DROP TABLE IF EXISTS public.cases;
 
 CREATE OR REPLACE FUNCTION public.notify_change()
 RETURNS trigger
 LANGUAGE plpgsql
 AS $function$
 BEGIN
     IF (TG_OP = 'DELETE') THEN
         RETURN OLD;
     END IF;
     RETURN NEW;
 END;
 $function$;
 
 CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
 AS $function$
 BEGIN
     NEW.updated_at = now();
     RETURN NEW;
 END;
 $function$;
 
 CREATE TABLE IF NOT EXISTS public.cases
 (
     cino character(16) COLLATE pg_catalog."default" NOT NULL,
     date_of_filing date,
     dt_regis date,
     case_type smallint,
     fil_no integer,
     fil_year smallint,
     reg_no integer,
     reg_year smallint,
     date_first_list date,
     date_next_list date,
     pend_disp character(1) COLLATE pg_catalog."default",
     date_of_decision date,
     disp_reason smallint,
     disp_nature smallint NOT NULL DEFAULT 0,
     desgname text COLLATE pg_catalog."default",
     court_no integer NOT NULL DEFAULT 0,
     est_code text COLLATE pg_catalog."default",
     state_code integer,
     dist_code integer,
     purpose_code integer NOT NULL,
     pet_name text COLLATE pg_catalog."default",
     pet_adv text COLLATE pg_catalog."default",
     pet_adv_cd integer NOT NULL DEFAULT 0,
     res_name text COLLATE pg_catalog."default",
     res_adv text COLLATE pg_catalog."default",
     res_adv_cd integer NOT NULL DEFAULT 0,
     pet_adv_bar_reg text COLLATE pg_catalog."default",
     res_adv_bar_reg text COLLATE pg_catalog."default",
     police_st_code integer,
     police_ncode text COLLATE pg_catalog."default",
     fir_no integer,
     police_station text COLLATE pg_catalog."default",
     fir_year smallint,
     date_last_list date,
     main_matter_cino character(16) COLLATE pg_catalog."default",
     pet_age integer NOT NULL DEFAULT 0,
     res_age integer NOT NULL DEFAULT 0,
     pet_address text COLLATE pg_catalog."default",
     res_address text COLLATE pg_catalog."default",
     jocode text COLLATE pg_catalog."default",
     cicri_type character(1) COLLATE pg_catalog."default" NOT NULL DEFAULT '0'::bpchar,
     id integer NOT NULL,
     judge_code integer,
     desig_code integer,
     updated_at timestamp without time zone NOT NULL DEFAULT now(),
     purpose_previous smallint DEFAULT 0,
     purpose_next smallint DEFAULT 0,
     created_at timestamp without time zone NOT NULL DEFAULT now(),
     CONSTRAINT cases_pkey PRIMARY KEY (id),
     CONSTRAINT cases_case_type_fil_no_fil_year_key UNIQUE (case_type, fil_no, fil_year),
     CONSTRAINT cases_case_type_reg_no_reg_year_key UNIQUE (case_type, reg_no, reg_year),
     CONSTRAINT cases_cino_key UNIQUE (cino),
     CONSTRAINT cases_pend_disp_check CHECK (pend_disp = ANY (ARRAY['P'::bpchar, 'D'::bpchar]))
 )

 TABLESPACE pg_default;

 -- Trigger: trg_notify_cases

 -- DROP TRIGGER IF EXISTS trg_notify_cases ON public.cases;

 CREATE OR REPLACE TRIGGER trg_notify_cases
     AFTER INSERT OR UPDATE
     ON public.cases
     FOR EACH ROW
     EXECUTE FUNCTION public.notify_change();

 -- Trigger: trg_set_updated_at_timestamp_cases

 -- DROP TRIGGER IF EXISTS trg_set_updated_at_timestamp_cases ON public.cases;

 CREATE OR REPLACE TRIGGER trg_set_updated_at_timestamp_cases
     BEFORE UPDATE
     ON public.cases
     FOR EACH ROW
     EXECUTE FUNCTION public.set_updated_at_timestamp();

 -- SEQUENCE: public.cases_id_seq

 -- DROP SEQUENCE IF EXISTS public.cases_id_seq;

 CREATE SEQUENCE IF NOT EXISTS public.cases_id_seq
     INCREMENT 1
     START 1
     MINVALUE 1
     MAXVALUE 2147483647
     CACHE 1;

 ALTER SEQUENCE public.cases_id_seq
     OWNER TO pucar;

 ALTER SEQUENCE public.cases_id_seq
     OWNED BY public.cases.id;

 ALTER TABLE IF EXISTS public.cases
     ALTER COLUMN id SET DEFAULT nextval('cases_id_seq'::regclass);

 ALTER TABLE IF EXISTS public.cases
     OWNER to pucar;