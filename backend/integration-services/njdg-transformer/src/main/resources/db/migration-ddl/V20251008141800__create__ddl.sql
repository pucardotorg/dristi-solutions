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