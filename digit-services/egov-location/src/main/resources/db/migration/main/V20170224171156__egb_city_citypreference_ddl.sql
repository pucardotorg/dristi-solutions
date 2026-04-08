------------------START------------------
CREATE TABLE eg_citypreferences (
    id numeric NOT NULL,
    municipality_logo bigint,
    createdby numeric,
    lastmodifiedby numeric,
    version numeric,
    tenantid character varying(256) not null,
    municipality_name character varying(50),
    municipality_contact_no character varying(20),
    municipality_address character varying(200),
    municipality_contact_email character varying(50),
    municipality_gis_location character varying(100),
    municipality_callcenter_no character varying(20),
    municipality_facebooklink character varying(100),
    municipality_twitterlink character varying(100)
);
CREATE SEQUENCE seq_eg_citypreferences
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE eg_citypreferences ADD CONSTRAINT eg_citypreferences_pkey PRIMARY KEY (id);
ALTER TABLE eg_citypreferences ADD CONSTRAINT eg_citypreferences_id_tenant_uk unique (id,tenantid);
-------------------END-------------------

------------------START------------------
CREATE TABLE eg_city (
    domainurl character varying(128) NOT NULL,
    name character varying(256) NOT NULL,
    local_name character varying(256),
    id bigint NOT NULL,
    active boolean,
    version bigint,
    createdby numeric,
    lastmodifiedby numeric,
    code character varying(4),
    district_code character varying(10),
    district_name character varying(50),
    longitude double precision,
    latitude double precision,
    preferences numeric,
    region_name character varying(50),
    grade character varying(50),
    tenantid character varying(256) not null
);
CREATE SEQUENCE seq_eg_city
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE eg_city ADD CONSTRAINT eg_city_pkey PRIMARY KEY (id);
ALTER TABLE eg_city ADD CONSTRAINT fk_preference FOREIGN KEY (preferences) REFERENCES eg_citypreferences(id);
alter table eg_city add constraint eg_city_name_tenant_uk unique (name,tenantid);

CREATE TABLE eg_hierarchy_type
(
  id bigint NOT NULL,
  name character varying(128) NOT NULL,
  code character varying(50) NOT NULL,
  createddate timestamp ,
  lastmodifieddate timestamp ,
  createdby bigint,
  lastmodifiedby bigint,
  version bigint,
  tenantid character varying(256) not null,
  localname character varying(256),
  CONSTRAINT eg_heirarchy_type_pkey PRIMARY KEY (id),
  CONSTRAINT eg_heirarchy_type_type_code_key UNIQUE (code),
  CONSTRAINT eg_heirarchy_type_type_name_key UNIQUE (name),
  constraint eg_hierarchytype_code_tenant_uk unique (code, tenantid)
);
CREATE SEQUENCE seq_eg_hierarchy_type
    START WITH 5
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE eg_boundary_type
(
  id bigint NOT NULL,
  hierarchy bigint NOT NULL,
  parent bigint,
  name character varying(64) NOT NULL,
  hierarchytype bigint NOT NULL,
  createddate timestamp ,
  lastmodifieddate timestamp ,
  createdby bigint,
  lastmodifiedby bigint,
  version bigint,
  localname character varying(64),
  code character varying (22),
  tenantid character varying(256) not null,
  CONSTRAINT eg_boundary_type_pkey PRIMARY KEY (id),
  CONSTRAINT bndry_type_heirarchy_fk FOREIGN KEY (hierarchytype)
      REFERENCES eg_hierarchy_type (id),
  CONSTRAINT bndry_type_parent FOREIGN KEY (parent)
      REFERENCES eg_boundary_type (id),
  constraint eg_boundarytype_id_tenant_uk unique (id,tenantid)
    
);

CREATE SEQUENCE seq_eg_boundary_type
    START WITH 11
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


CREATE TABLE eg_boundary
(
  id bigint NOT NULL,
  boundarynum bigint,
  parent bigint,
  name character varying(512) NOT NULL,
  boundarytype bigint NOT NULL,
  localname character varying(256),
  bndry_name_old character varying(256),
  bndry_name_old_local character varying(256),
  fromdate timestamp ,
  todate timestamp ,
  bndryid bigint,
  longitude double precision,
  latitude double precision,
  materializedpath character varying(32),
  ishistory boolean,
  createddate timestamp ,
  lastmodifieddate timestamp ,
  createdby bigint,
  lastmodifiedby bigint,
  version bigint,
  tenantid character varying(256) not null,
  code character varying(22),
  CONSTRAINT eg_boundary_pkey PRIMARY KEY (id),
  CONSTRAINT bndry_type_fk FOREIGN KEY (boundarytype)
      REFERENCES eg_boundary_type (id),
  CONSTRAINT parent_bndry_fk FOREIGN KEY (parent)
      REFERENCES eg_boundary (id),
  constraint eg_boundary_name_tenant_uk unique (id,tenantid)

);

CREATE SEQUENCE seq_eg_boundary
    START WITH 300
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

------------------START------------------
CREATE TABLE eg_crosshierarchy (
    id bigint NOT NULL,
    parent bigint NOT NULL,
    child bigint NOT NULL,
    parenttype bigint,
    childtype bigint,
    version bigint default 0,
    tenantid character varying(256) not null,
    code  character varying(100),
    createddate timestamp,
    lastmodifieddate timestamp,
    createdby bigint,
    lastmodifiedby bigint
);

CREATE SEQUENCE seq_eg_crosshierarchy
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE eg_crosshierarchy ADD CONSTRAINT eg_crosshierarchy_pkey PRIMARY KEY (id);
alter table eg_crosshierarchy add constraint fk_crossheirarchy_parenttype foreign key (parenttype) references eg_boundary_type (id);
alter table eg_crosshierarchy add constraint fk_crossheirarchy_childtype foreign key (childtype) references eg_boundary_type (id);
alter table eg_crosshierarchy add constraint fk_crossheirarchy_parent foreign key (parent) references eg_boundary (id);
alter table eg_crosshierarchy add constraint fk_crossheirarchy_child foreign key (child) references eg_boundary (id);
alter table eg_crosshierarchy add constraint eg_crosshierarchy_id_tenant_uk unique (id,tenantid);


 alter table eg_crosshierarchy drop constraint eg_crosshierarchy_pkey;
 alter table eg_crosshierarchy drop constraint fk_crossheirarchy_parenttype;
 alter table eg_crosshierarchy drop constraint fk_crossheirarchy_childtype;
 alter table eg_crosshierarchy drop constraint fk_crossheirarchy_parent;
 alter table eg_crosshierarchy drop constraint fk_crossheirarchy_child;
 alter table eg_crosshierarchy drop constraint eg_crosshierarchy_id_tenant_uk;

 alter table eg_crosshierarchy add constraint   eg_crosshierarchy_pkey primary key(id,tenantid);



alter table eg_boundary  drop constraint  parent_bndry_fk;

alter table eg_boundary  drop constraint  bndry_type_fk;
alter table eg_boundary  drop constraint  eg_boundary_name_tenant_uk;

alter table eg_boundary  drop constraint eg_boundary_pkey;

alter table eg_boundary add constraint   eg_boundary_pkey primary key(id,tenantid);


alter table eg_boundary_type drop constraint bndry_type_heirarchy_fk;
alter table eg_boundary_type drop constraint bndry_type_parent;
 alter table eg_boundary_type drop constraint eg_boundarytype_id_tenant_uk;
 alter table eg_boundary_type drop constraint eg_boundary_type_pkey;



 alter table eg_boundary_type add constraint  eg_boundary_type_pkey primary key(id,tenantid);

alter table eg_hierarchy_type   drop constraint eg_heirarchy_type_type_code_key;
alter table eg_hierarchy_type   drop constraint eg_hierarchytype_code_tenant_uk;
alter table eg_hierarchy_type   drop constraint eg_heirarchy_type_type_name_key;
alter table eg_hierarchy_type   add constraint eg_hierarchy_type_name_unique unique(name,tenantid);
alter table eg_hierarchy_type   drop constraint eg_heirarchy_type_pkey;
 
alter table eg_hierarchy_type add constraint  eg_hierarchy_type_pkey primary key (id,tenantid);

 ALTER TABLE eg_boundary ALTER COLUMN boundarynum SET NOT NULL;

ALTER TABLE eg_boundary ADD CONSTRAINT bndrynumtype_ukey UNIQUE (boundarynum,boundarytype,tenantId);

 

update eg_boundary set code = id; 

update eg_boundary_type set code = id;

ALTER TABLE eg_boundary
   ALTER COLUMN code SET NOT NULL;

ALTER TABLE eg_boundary DROP CONSTRAINT eg_boundary_pkey;
ALTER TABLE eg_boundary Add CONSTRAINT eg_boundary_pkey PRIMARY KEY (code, tenantid);

ALTER TABLE eg_boundary DROP CONSTRAINT bndrynumtype_ukey ;
ALTER TABLE eg_boundary Add CONSTRAINT bndrynumtype_ukey UNIQUE (code, boundarytype,tenantid);

ALTER TABLE eg_boundary_type
   ALTER COLUMN code SET NOT NULL;

ALTER TABLE eg_boundary_type DROP CONSTRAINT eg_boundary_type_pkey;
ALTER TABLE eg_boundary_type Add CONSTRAINT eg_boundary_type_pkey PRIMARY KEY (code, tenantid);


ALTER TABLE eg_hierarchy_type DROP CONSTRAINT eg_hierarchy_type_pkey;
ALTER TABLE eg_hierarchy_type Add CONSTRAINT eg_hierarchy_type_pkey PRIMARY KEY (code, tenantid);