--
-- PostgreSQL database dump
--

-- Dumped from database version 15.14 (Ubuntu 15.14-1.pgdg24.04+1)
-- Dumped by pg_dump version 15.13 (Debian 15.13-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';
SET default_table_access_method = heap;

CREATE TABLE public.act_t (
    act_code integer NOT NULL,
    act_name character varying(200) NOT NULL,
    nat_code text
);

ALTER TABLE public.act_t OWNER TO pucar;

CREATE TABLE public.acts (
    id integer NOT NULL,
    cino character(16),
    act_code integer,
    act_name text,
    act_section text
);

ALTER TABLE public.acts OWNER TO pucar;

CREATE SEQUENCE public.acts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE public.acts_id_seq OWNER TO pucar;
ALTER SEQUENCE public.acts_id_seq OWNED BY public.acts.id;

CREATE TABLE public.adj_t (
    adj_code integer NOT NULL,
    name character varying(200) NOT NULL,
    nat_code text
);

ALTER TABLE public.adj_t OWNER TO pucar;

CREATE TABLE public.adv_designation (
    desg_code integer NOT NULL,
    desg_name character varying(200) NOT NULL
);

ALTER TABLE public.adv_designation OWNER TO pucar;

CREATE TABLE public.advocate_master (
    advocate_code integer NOT NULL,
    advocate_name character varying(200) NOT NULL,
    bar_reg_no character varying(50)
);

ALTER TABLE public.advocate_master OWNER TO pucar;

CREATE TABLE public.case_hearings (
    id integer NOT NULL,
    cino character(16),
    sr_no integer,
    desg_name text,
    hearing_date date,
    next_date date,
    purpose_of_listing text,
    judge_code text,
    jocode text,
    desg_code text
);

ALTER TABLE public.case_hearings OWNER TO pucar;

CREATE SEQUENCE public.case_hearings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE public.case_hearings_id_seq OWNER TO pucar;
ALTER SEQUENCE public.case_hearings_id_seq OWNED BY public.case_hearings.id;

CREATE TABLE public.case_type (
    case_type_code integer NOT NULL,
    type_name character varying(100) NOT NULL,
    nat_code text
);

ALTER TABLE public.case_type OWNER TO pucar;

CREATE TABLE public.cases (
    cino character(16) NOT NULL,
    date_of_filing date,
    dt_regis date,
    case_type smallint,
    fil_no integer,
    fil_year smallint,
    reg_no integer,
    reg_year smallint,
    date_first_list date,
    date_next_list date,
    pend_disp character(1),
    date_of_decision date,
    disp_reason text,
    disp_nature character(1),
    desgname text,
    court_no integer,
    est_code text,
    state_code integer,
    dist_code integer,
    purpose_code integer,
    pet_name text,
    pet_adv text,
    pet_adv_cd integer,
    res_name text,
    res_adv text,
    res_adv_cd integer,
    pet_adv_bar_reg text,
    res_adv_bar_reg text,
    police_st_code integer,
    police_ncode text,
    fir_no integer,
    police_station text,
    fir_year smallint,
    date_last_list date,
    main_matter_cino character(16),
    pet_age integer,
    res_age integer,
    pet_address text,
    res_address text,
    jocode text,
    cicri_type character(1),
    CONSTRAINT cases_pend_disp_check CHECK ((pend_disp = ANY (ARRAY['P'::bpchar, 'D'::bpchar])))
);

ALTER TABLE public.cases OWNER TO pucar;

CREATE TABLE public.desg_type (
    desg_code integer NOT NULL,
    desg_name character varying(100) NOT NULL,
    nat_code text
);

ALTER TABLE public.desg_type OWNER TO pucar;

CREATE TABLE public.disp_type (
    type_code integer NOT NULL,
    type_name character varying(100) NOT NULL
);

ALTER TABLE public.disp_type OWNER TO pucar;

CREATE TABLE public.district_t (
    district_code integer NOT NULL,
    name character varying(200) NOT NULL,
    nat_code text
);

ALTER TABLE public.district_t OWNER TO pucar;

CREATE TABLE public.doc_type (
    doc_code integer NOT NULL,
    doc_name character varying(100) NOT NULL,
    nat_code text
);

ALTER TABLE public.doc_type OWNER TO pucar;

CREATE TABLE public.extra_parties (
    id integer NOT NULL,
    cino character(16),
    party_type character(3),
    party_no integer,
    party_name text,
    party_address text,
    party_age integer,
    CONSTRAINT extra_parties_party_type_check CHECK ((party_type = ANY (ARRAY['PET'::bpchar, 'RES'::bpchar])))
);

ALTER TABLE public.extra_parties OWNER TO pucar;

CREATE SEQUENCE public.extra_parties_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE public.extra_parties_id_seq OWNER TO pucar;
ALTER SEQUENCE public.extra_parties_id_seq OWNED BY public.extra_parties.id;

CREATE TABLE public.ia_case_type (
    ia_type_code integer NOT NULL,
    ia_type_name character varying(50) NOT NULL
);

ALTER TABLE public.ia_case_type OWNER TO pucar;

CREATE TABLE public.ia_filings (
    id integer NOT NULL,
    cino character(16),
    sr_no integer,
    ia_type text,
    ia_no text,
    ia_year integer,
    status character(1),
    date_of_filing date,
    CONSTRAINT ia_filings_status_check CHECK ((status = ANY (ARRAY['P'::bpchar, 'D'::bpchar])))
);

ALTER TABLE public.ia_filings OWNER TO pucar;

CREATE SEQUENCE public.ia_filings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE public.ia_filings_id_seq OWNER TO pucar;
ALTER SEQUENCE public.ia_filings_id_seq OWNED BY public.ia_filings.id;

CREATE TABLE public.ia_objections (
    id integer NOT NULL,
    ia_id integer,
    objection text,
    scrutiny_date date,
    obj_receipt_date date
);

ALTER TABLE public.ia_objections OWNER TO pucar;

CREATE SEQUENCE public.ia_objections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE public.ia_objections_id_seq OWNER TO pucar;
ALTER SEQUENCE public.ia_objections_id_seq OWNED BY public.ia_objections.id;

CREATE TABLE public.interim_orders (
    id integer NOT NULL,
    cino character(16),
    sr_no integer,
    order_no integer,
    order_date date,
    order_details bytea
);

ALTER TABLE public.interim_orders OWNER TO pucar;

CREATE SEQUENCE public.interim_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE public.interim_orders_id_seq OWNER TO pucar;
ALTER SEQUENCE public.interim_orders_id_seq OWNED BY public.interim_orders.id;

CREATE TABLE public.judge_t (
    judge_code integer NOT NULL,
    judge_name character varying(200) NOT NULL,
    jocode character varying(20)
);

ALTER TABLE public.judge_t OWNER TO pucar;

CREATE TABLE public.lc_case_type_t (
    lc_case_type_code integer NOT NULL,
    type_name character varying(200) NOT NULL,
    nat_code text
);

ALTER TABLE public.lc_case_type_t OWNER TO pucar;

CREATE TABLE public.objection_t (
    obj_type_code integer NOT NULL,
    obj_type_name character varying(200) NOT NULL
);

ALTER TABLE public.objection_t OWNER TO pucar;

CREATE TABLE public.org_t (
    org_type integer NOT NULL,
    org_name character varying(200) NOT NULL,
    nat_code text
);

ALTER TABLE public.org_t OWNER TO pucar;

CREATE TABLE public.organization_master (
    org_id integer NOT NULL,
    org_name character varying(200) NOT NULL
);

ALTER TABLE public.organization_master OWNER TO pucar;

CREATE TABLE public.police_t (
    police_st_code integer NOT NULL,
    st_name character varying(200) NOT NULL,
    nat_code text
);

ALTER TABLE public.police_t OWNER TO pucar;

CREATE TABLE public.purpose_code (
    purpose_code integer NOT NULL,
    purpose_name character varying(100) NOT NULL,
    nat_code text
);

ALTER TABLE public.purpose_code OWNER TO pucar;

CREATE TABLE public.short_orders_t (
    type_id integer NOT NULL,
    name character varying(200) NOT NULL
);

ALTER TABLE public.short_orders_t OWNER TO pucar;

CREATE TABLE public.taluk_t (
    taluk_code integer NOT NULL,
    name character varying(200) NOT NULL,
    nat_code text
);

ALTER TABLE public.taluk_t OWNER TO pucar;

ALTER TABLE case_type ADD COLUMN case_type_court VARCHAR(255) DEFAULT '';
ALTER TABLE advocate_master ADD COLUMN advocate_id VARCHAR(255) DEFAULT '';
ALTER TABLE judge_t ADD COLUMN judge_username VARCHAR(255) DEFAULT '';
ALTER TABLE disp_type ADD COLUMN nat_code TEXT DEFAULT '';
ALTER TABLE disp_type ADD COLUMN court_disp_code VARCHAR(255) DEFAULT '';
ALTER TABLE desg_type ADD COLUMN court_desg_code VARCHAR(255) DEFAULT '';
ALTER TABLE police_t ADD COLUMN police_code TEXT DEFAULT '';
ALTER TABLE purpose_code ADD COLUMN court_purpose_code VARCHAR(255) DEFAULT '';
ALTER TABLE case_hearings ADD COLUMN hearing_id VARCHAR(255) DEFAULT '';
ALTER TABLE extra_parties ADD COLUMN party_id VARCHAR(255) DEFAULT '';

ALTER TABLE disp_type ADD COLUMN disp_nature VARCHAR(255) DEFAULT '';



ALTER TABLE interim_orders ADD COLUMN order_type VARCHAR(255) DEFAULT '';
ALTER TABLE interim_orders ADD COLUMN order_number VARCHAR(255) DEFAULT '';
ALTER TABLE cases ADD COLUMN judge_code INTEGER;
ALTER TABLE cases ADD COLUMN desig_code INTEGER;

ALTER TABLE extra_parties ADD COLUMN adv_name VARCHAR(255);
ALTER TABLE extra_parties ADD COLUMN adv_cd INTEGER;


CREATE SEQUENCE IF NOT EXISTS public.extra_advocates_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;


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
ALTER SEQUENCE public.extra_advocates_id_seq
    OWNED BY public.extra_advocates.id;

ALTER TABLE IF EXISTS public.extra_parties ADD COLUMN sr_no smallint DEFAULT 0;
ALTER TABLE IF EXISTS public.case_hearings ADD COLUMN business text;
ALTER TABLE IF EXISTS public.case_hearings ADD COLUMN court_no integer;

CREATE TABLE IF NOT EXISTS public.court_info (
    id SERIAL PRIMARY KEY,
    court_name VARCHAR(100),
    state VARCHAR(200),
    district VARCHAR(20),
    taluka VARCHAR(20),
    est_code CHAR(6),
    state_code SMALLINT,
    hide_partyname CHAR(1) NOT NULL DEFAULT 'N',
    updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.court_info OWNER TO pucar;

ALTER TABLE interim_orders
ADD COLUMN doc_type INTEGER,
ADD COLUMN jocode VARCHAR(100),
ADD COLUMN disp_nature INTEGER,
ADD COLUMN court_no INTEGER,
ADD COLUMN judge_code INTEGER,
ADD COLUMN desg_code INTEGER;


ALTER TABLE cases
ADD COLUMN
purpose_previous integer,
ADD COLUMN
purpose_next integer;

ALTER TABLE judge_t
ADD COLUMN court_no smallint,
ADD COLUMN desg_code smallint NOT NULL DEFAULT 0,
ADD COLUMN from_dt date,
ADD COLUMN to_dt date;

ALTER TABLE advocate_master
ADD COLUMN email VARCHAR(100),
ADD COLUMN phone VARCHAR(20),
ADD COLUMN address VARCHAR(200),
ADD COLUMN dob DATE;

ALTER TABLE case_type ADD COLUMN type smallint;
ALTER TABLE act_t ADD COLUMN type character(1) COLLATE pg_catalog."default" DEFAULT 'C'::bpchar;
ALTER TABLE police_t
ADD COLUMN dist_code smallint,
ADD COLUMN state_id smallint;

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


ALTER TABLE case_hearings ADD COLUMN order_id varchar(64);