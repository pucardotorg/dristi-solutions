CREATE TABLE eg_user (
    id bigint NOT NULL,
    title character varying(8),
    salutation character varying(5),
    dob timestamp,
    locale character varying(16),
    username character varying(64) NOT NULL,
    password character varying(64) NOT NULL,
    pwdexpirydate timestamp DEFAULT CURRENT_TIMESTAMP,
    mobilenumber character varying(50),
    altcontactnumber character varying(50),
    emailid character varying(128),
    createddate timestamp,
    lastmodifieddate timestamp,
    createdby bigint,
    lastmodifiedby bigint,
    active boolean,
    name character varying(100),
    gender smallint,
    pan character varying(10),
    aadhaarnumber character varying(20),
    type character varying(50),
    version numeric DEFAULT 0,
    guardian character varying(100),
    guardianrelation character varying(32),
    signature character varying(36),
    accountlocked boolean DEFAULT false,
    bloodgroup character varying(32),
    photo character varying(36),
    identificationmark character varying(300),
    tenantid character varying(256) not null
);

CREATE SEQUENCE seq_eg_user
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE eg_user ADD CONSTRAINT eg_user_pkey PRIMARY KEY (id);
ALTER TABLE eg_user ADD CONSTRAINT eg_user_user_name_key UNIQUE (username);

CREATE TABLE eg_address (
    housenobldgapt character varying(32),
    subdistrict character varying(100),
    postoffice character varying(100),
    landmark character varying(256),
    country character varying(50),
    userid bigint not null references eg_user(id),
    type character varying(50),
    streetroadline character varying(256),
    citytownvillage character varying(256),
    arealocalitysector character varying(256),
    district character varying(100),
    state character varying(100),
    pincode character varying(10),
    id serial NOT NULL primary key,
    version bigint DEFAULT 0,
    tenantid character varying(256) not null);

    CREATE TABLE eg_role (
    id serial NOT NULL primary key,
    name character varying(32) NOT NULL,
    code character varying(50) NOT NULL,
    description character varying(128),
    createddate timestamp DEFAULT CURRENT_TIMESTAMP,
    createdby bigint,
    lastmodifiedby bigint,
    lastmodifieddate timestamp,
    version bigint,
    tenantid character varying(256) not null,
    CONSTRAINT eg_roles_role_name_key UNIQUE (name)
);

CREATE TABLE eg_userrole (
    roleid bigint NOT NULL references eg_role(id),
    userid bigint NOT NULL references eg_user(id)
);

alter table eg_address add column  userid_bak bigint;
update eg_address set userid_bak=userid;
alter table eg_address drop column  userid;
alter table eg_address add column  userid bigint;
update  eg_address set userid=userid_bak;
alter table eg_address drop column  userid_bak;


alter table eg_userrole add column  userid_bak bigint;
update eg_userrole set userid_bak=userid;
alter table eg_userrole drop column  userid;
alter table eg_userrole add column  userid bigint;
update  eg_userrole set userid=userid_bak;
alter table eg_userrole drop column  userid_bak;

alter table eg_user add column  id_bak bigint;
update eg_user set id_bak=id;
alter table eg_user drop column  id;
alter table eg_user add column  id bigint;
update  eg_user set id=id_bak;
alter table eg_user drop column  id_bak;
alter table eg_user alter column id  set not null;
alter table eg_user add constraint  eg_user_pkey primary key (id,tenantid);

CREATE SEQUENCE SEQ_EG_ROLE 
 START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE eg_user DROP CONSTRAINT eg_user_user_name_key;

ALTER TABLE eg_user ADD CONSTRAINT eg_user_user_name_tenant UNIQUE (username, tenantid);
ALTER TABLE eg_role DROP CONSTRAINT eg_roles_role_name_key;

ALTER TABLE eg_role ADD CONSTRAINT eg_roles_code_tenant UNIQUE (code, tenantid);
ALTER TABLE eg_user ALTER COLUMN signature TYPE CHARACTER VARYING(1000);
ALTER TABLE eg_user ALTER COLUMN photo TYPE CHARACTER VARYING(1000);
ALTER TABLE eg_user ALTER COLUMN signature TYPE CHARACTER VARYING(36);
ALTER TABLE eg_user ALTER COLUMN photo TYPE CHARACTER VARYING(36);
CREATE TABLE eg_user_address (
     id bigint NOT NULL,
     version numeric DEFAULT 0,
     createddate timestamp NOT NULL,
     lastmodifieddate timestamp,
     createdby bigint NOT NULL,
     lastmodifiedby bigint,
     type VARCHAR (50) NOT NULL,
     address VARCHAR(300),
     city VARCHAR(300),
     pincode VARCHAR(10),
     userid bigint NOT NULL,
     tenantid VARCHAR(256) NOT NULL
  );

ALTER TABLE eg_user_address ADD CONSTRAINT eg_user_address_pkey PRIMARY KEY (id);

ALTER TABLE eg_user_address ADD CONSTRAINT eg_user_address_user_fkey FOREIGN KEY (userid, tenantid)
REFERENCES eg_user ON DELETE CASCADE;

ALTER TABLE eg_user_address ADD CONSTRAINT eg_user_address_type_unique UNIQUE (userid, tenantid, type);

CREATE SEQUENCE seq_eg_user_address START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

DROP TABLE eg_userrole;
ALTER TABLE eg_role ADD roleid bigint NOT NULL DEFAULT 0;
UPDATE eg_role SET roleid = id;
ALTER TABLE eg_role ALTER COLUMN roleid DROP DEFAULT;
ALTER TABLE eg_role DROP COLUMN id;
ALTER TABLE eg_role RENAME COLUMN roleid TO id;
ALTER TABLE eg_role ADD CONSTRAINT eg_role_pk PRIMARY KEY (id, tenantid);

CREATE TABLE eg_userrole (
    roleid bigint NOT NULL,
    roleidtenantid character varying(256) NOT NULL,
    userid bigint NOT NULL,
    tenantid character varying(256) NOT NULL,
    FOREIGN KEY (roleid, roleidtenantid) REFERENCES eg_role (id, tenantid),
    FOREIGN KEY (userid, tenantid) REFERENCES eg_user (id, tenantid)
);

alter table eg_userrole add column lastmodifieddate TIMESTAMP default now();

ALTER TABLE eg_user ALTER COLUMN mobilenumber DROP NOT NULL;

alter table eg_user add column uuid character(36);


ALTER TABLE eg_role ALTER COLUMN  name TYPE VARCHAR(128);

ALTER TABLE eg_user DROP CONSTRAINT eg_user_user_name_tenant;
ALTER TABLE eg_user ADD CONSTRAINT eg_user_user_name_tenant UNIQUE (username, type, tenantid);

ALTER TABLE eg_user_address DROP CONSTRAINT eg_user_address_user_fkey;

ALTER TABLE eg_userrole ADD CONSTRAINT eg_userrole_userid_fkey FOREIGN KEY (userid, tenantid) REFERENCES eg_user (id, tenantid) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE eg_user_address ADD CONSTRAINT eg_user_address_user_fkey FOREIGN KEY (userid, tenantid) REFERENCES eg_user (id, tenantid) ON UPDATE CASCADE ON DELETE CASCADE;

CREATE INDEX IDX_EG_USER_USERNAME ON EG_USER (username);
CREATE INDEX IDX_EG_USER_NAME ON EG_USER (name);
CREATE INDEX IDX_EG_USER_ACTIVE ON EG_USER (active);
CREATE INDEX IDX_EG_USER_MOBILE ON EG_USER (mobilenumber);
CREATE INDEX IDX_EG_USER_TYPE ON EG_USER (type);
CREATE INDEX IDX_EG_USER_UUID ON EG_USER (uuid);
CREATE INDEX IDX_EG_ROLE_CODE ON EG_ROLE (code);

CREATE TABLE eg_userrole_v1 AS
select r.code as role_code, ur.roleidtenantid role_tenantid, ur.userid as user_id, ur.tenantid as user_tenantid, ur
.lastmodifieddate as lastmodifieddate
	from eg_userrole ur join eg_role r ON ur.roleid = r.id AND ur.roleidtenantid = r.tenantid ;
ALTER TABLE eg_userrole_v1 ADD CONSTRAINT fk_user_role_v1 FOREIGN KEY (user_id, user_tenantid) REFERENCES eg_user(id, tenantid);


ALTER TABLE eg_user ADD COLUMN accountlockeddate bigint;
CREATE TABLE IF NOT EXISTS eg_user_login_failed_attempts (
    user_uuid character varying(64) NOT NULL,
    ip character varying(46),
    attempt_date bigint NOT NULL,
	active boolean
);
CREATE INDEX IF NOT EXISTS idx_eg_user_failed_attempts_user_uuid ON eg_user_login_failed_attempts (user_uuid);
CREATE INDEX IF NOT EXISTS idx_eg_user_failed_attempts_user_attemptdate ON eg_user_login_failed_attempts (attempt_date);

ALTER TABLE eg_user 
  ALTER COLUMN name TYPE varchar (250),
  ALTER COLUMN mobilenumber TYPE varchar (150),
  ALTER COLUMN emailid TYPE varchar (300),
  ALTER COLUMN username TYPE varchar (180),
  ALTER COLUMN altcontactnumber TYPE varchar (150),
  ALTER COLUMN pan TYPE varchar (65),
  ALTER COLUMN aadhaarnumber TYPE varchar (85),
  ALTER COLUMN guardian TYPE varchar (250);

ALTER TABLE eg_user_address
  ALTER COLUMN address TYPE varchar (440);

  CREATE INDEX IF NOT EXISTS idx_eg_user_tenantid ON eg_user(tenantid);
CREATE INDEX IF NOT EXISTS idx_eg_user_address_tenantid ON eg_user_address(tenantid);
CREATE INDEX IF NOT EXISTS idx_eg_userrole_v1_rolecode ON eg_userrole_v1(role_code);
CREATE INDEX IF NOT EXISTS idx_eg_userrole_v1_roletenantid ON eg_userrole_v1(role_tenantid);
CREATE INDEX IF NOT EXISTS idx_eg_userrole_v1_userid ON eg_userrole_v1(user_id);
CREATE INDEX IF NOT EXISTS idx_eg_userrole_v1_usertenantid ON eg_userrole_v1(user_tenantid);

ALTER TABLE eg_user ADD alternatemobilenumber character varying (50) DEFAULT NULL;

CREATE TABLE eg_user_audit_table(
    id bigint NOT NULL,
    title character varying(8),
    salutation character varying(5),
    dob timestamp,
    locale character varying(16),
    username character varying(64) NOT NULL,
    password character varying(64) NOT NULL,
    pwdexpirydate timestamp DEFAULT CURRENT_TIMESTAMP,
    mobilenumber character varying(50),
    altcontactnumber character varying(50),
    emailid character varying(128),
    active boolean,
    name character varying(100),
    gender smallint,
    pan character varying(50),
    aadhaarnumber character varying(50),
    type character varying(50),
    version numeric DEFAULT 0,
    guardian character varying(100),
    guardianrelation character varying(32),
    signature character varying(36),
    accountlocked boolean DEFAULT false,
    bloodgroup character varying(32),
    photo character varying(36),
    identificationmark character varying(300),
    tenantid character varying(256) not null,
    uuid character(36),
    auditcreatedby bigint,
    auditcreatedtime bigint
);

ALTER TABLE eg_user_audit_table ALTER COLUMN auditcreatedby TYPE character varying(100);

ALTER TABLE eg_user_audit_table ALTER COLUMN username TYPE character varying(300);
ALTER TABLE eg_user_audit_table ALTER COLUMN password TYPE character varying(300);
ALTER TABLE eg_user_audit_table ALTER COLUMN uuid TYPE character varying(300);
ALTER TABLE eg_user ADD CONSTRAINT eg_user_email_id_key UNIQUE (emailid);