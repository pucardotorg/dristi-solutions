CREATE SEQUENCE seq_service;
CREATE TABLE service
(
  id bigint NOT NULL,
  code character varying(50) NOT NULL,
  name character varying(100) NOT NULL,
  enabled boolean,
  contextroot character varying(20),
  displayname character varying(100),
  ordernumber bigint,
  parentmodule character varying(100),
  tenantid character varying(50) NOT NULL,
  CONSTRAINT eg_service_pkey PRIMARY KEY (id),
  CONSTRAINT eg_service_ukey UNIQUE (name)
);

CREATE SEQUENCE seq_eg_action;

CREATE TABLE eg_action
(
  id bigint NOT NULL,
  name character varying(100) NOT NULL,
  url character varying(100),
  servicecode character varying(50),
  queryparams character varying(100),
  parentmodule character varying(50),
  ordernumber bigint,
  displayname character varying(100),
  enabled boolean,
  createdby bigint DEFAULT 1,
  createddate timestamp DEFAULT now(),
  lastmodifiedby bigint DEFAULT 1,
  lastmodifieddate timestamp DEFAULT now(),
  tenantid character varying(50) NOT NULL,
  CONSTRAINT eg_action_pkey PRIMARY KEY (id),
  CONSTRAINT eg_action_name_key UNIQUE (name),
  CONSTRAINT eg_action_url_queryparams_key UNIQUE (url, queryparams)
);

CREATE TABLE eg_roleaction
(
  rolecode character varying(32) NOT NULL,
  actionid bigint NOT NULL,
  tenantid character varying(50) NOT NULL,
  CONSTRAINT eg_roleaction_ukey UNIQUE (rolecode, actionid)
);

ALTER TABLE service DROP CONSTRAINT eg_service_pkey;
ALTER TABLE service ADD CONSTRAINT eg_service_pkey PRIMARY KEY (id, tenantid);
ALTER TABLE service DROP CONSTRAINT eg_service_ukey;
ALTER TABLE service ADD CONSTRAINT eg_service_ukey_tenantid UNIQUE (name, tenantid);
  
ALTER TABLE eg_action DROP CONSTRAINT eg_action_pkey;
ALTER TABLE eg_action ADD CONSTRAINT eg_action_pkey PRIMARY KEY (id, tenantid);
ALTER TABLE eg_action DROP CONSTRAINT eg_action_name_key;
ALTER TABLE eg_action ADD CONSTRAINT eg_action_name_key_tenantid UNIQUE (name,tenantid);
ALTER TABLE eg_action DROP CONSTRAINT eg_action_url_queryparams_key;
ALTER TABLE eg_action ADD CONSTRAINT eg_action_url_queryparams_key_tenantid UNIQUE (url, queryparams,tenantid);

ALTER TABLE eg_roleaction DROP CONSTRAINT eg_roleaction_ukey;
ALTER TABLE eg_roleaction ADD CONSTRAINT eg_roleaction_ukey_tenantid PRIMARY KEY (rolecode, actionid, tenantid);
ALTER TABLE service ALTER COLUMN contextroot TYPE CHARACTER VARYING(50);
CREATE SEQUENCE SEQ_EG_MS_ROLE
 START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE eg_ms_role (
    id serial NOT NULL primary key,
    name character varying(32) NOT NULL,
    code character varying(50) NOT NULL,
    description character varying(128),
    createddate timestamp DEFAULT CURRENT_TIMESTAMP,
    createdby bigint,
    lastmodifiedby bigint,
    lastmodifieddate timestamp,
    version bigint,
    CONSTRAINT eg_roles_role_name_key UNIQUE (name)
);

ALTER TABLE eg_action DROP CONSTRAINT eg_action_pkey;
ALTER TABLE eg_action ADD CONSTRAINT eg_action_pkey PRIMARY KEY (id);
ALTER TABLE eg_action DROP CONSTRAINT eg_action_name_key_tenantid;
ALTER TABLE eg_action ADD CONSTRAINT eg_action_name_key UNIQUE (name);
ALTER TABLE eg_action DROP CONSTRAINT eg_action_url_queryparams_key_tenantid;
ALTER TABLE eg_action ADD CONSTRAINT eg_action_url_queryparams_key UNIQUE (url, queryparams);

ALTER TABLE eg_action DROP COLUMN tenantid;
ALTER TABLE eg_ms_role ALTER COLUMN id SET DATA TYPE bigint;
ALTER TABLE eg_ms_role DROP COLUMN id;