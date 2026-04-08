
CREATE SEQUENCE seq_egbs_demand;

CREATE SEQUENCE seq_egbs_demanddetail;

CREATE TABLE egbs_demand
(

id character varying(64) NOT NULL,

consumerCode character varying(250) NOT NULL,

consumerType character varying(250) NOT NULL,

businessservice character varying(250) NOT NULL,

owner character varying(250) NOT NULL,

taxPeriodFrom bigint NOT NULL,

taxPeriodTo bigint NOT NULL,

minimumAmountPayable numeric(12,0),

createdby character varying(16) NOT NULL,

createdtime bigint NOT NULL,

lastModifiedby character varying(16),

lastModifiedtime bigint,

tenantid character varying(250) NOT NULL,

CONSTRAINT pk_egbs_demand PRIMARY KEY (id,tenantid)
);


CREATE TABLE egbs_demanddetail
(

 id character varying(64) NOT NULL,

 demandid character varying(64) NOT NULL,

 taxHeadCode character varying(250) NOT NULL,

 taxamount numeric(12,2) NOT NULL,

 collectionamount numeric(12,2) NOT NULL,

 createdby character varying(64) NOT NULL,

 createdtime bigint NOT NULL,

 lastModifiedby character varying(64),

 lastModifiedtime bigint,

 tenantid character varying(250) NOT NULL, 

CONSTRAINT pk_egbs_demanddetail PRIMARY KEY (id,tenantid),

CONSTRAINT fk_egbs_demanddetail FOREIGN KEY (demandid,tenantid) REFERENCES egbs_demand(id,tenantid)
);


-- TaxPeriod --

CREATE TABLE egbs_taxperiod
(
  id character varying(64) NOT NULL,
  service character varying(100) NOT NULL,
  code character varying(25) NOT NULL,
  fromdate bigint NOT NULL,
  todate bigint NOT NULL,
  financialyear character varying(50),
  createddate bigint NOT NULL,
  lastmodifieddate bigint NOT NULL,
  createdby character varying(64) NOT NULL,
  lastmodifiedby character varying(64) NOT NULL,
  tenantid character varying(250) NOT NULL,
  CONSTRAINT pk_taxperiod PRIMARY KEY (id, tenantid),
  CONSTRAINT unq_service_code UNIQUE (service, code, tenantid)
);

CREATE SEQUENCE seq_egbs_taxperiod;


-- BusinessServiceDetail --

CREATE TABLE egbs_business_service_details
(
  id character varying(64) NOT NULL,
  businessservice character varying(250) NOT NULL,
  collectionmodesnotallowed character varying(250),
  callbackforapportioning boolean DEFAULT false,
  partpaymentallowed boolean DEFAULT false,
  callbackapportionurl character varying(250),
  createddate bigint NOT NULL,
  lastmodifieddate bigint NOT NULL,
  createdby character varying(64) NOT NULL,
  lastmodifiedby character varying(64) NOT NULL,
  tenantid character varying(250) NOT NULL,
  CONSTRAINT pk_biz_srvc_det PRIMARY KEY (id, tenantid),
  CONSTRAINT unq_businessservice UNIQUE (businessservice, tenantid)
);

CREATE SEQUENCE seq_egbs_business_srvc_details;



CREATE SEQUENCE seq_egbs_taxHeadMaster;
CREATE SEQUENCE seq_egbs_taxHeadMastercode;

CREATE TABLE public.egbs_taxheadmaster
(
  id character varying(64) NOT NULL,
  tenantid character varying(128) NOT NULL,
  category character varying(250) NOT NULL,
  service character varying(64) NOT NULL,
  name character varying(64) NOT NULL,
  code character varying(64),
  isdebit boolean,
  isactualdemand boolean,
  orderno integer,
  validfrom bigint,
  validtill bigint,
  createdby character varying(64),
  createdtime bigint,
  lastmodifiedby character varying(64),
  lastmodifiedtime bigint,
  CONSTRAINT pk_egbs_taxheadmaster PRIMARY KEY (id, tenantid)
);




CREATE SEQUENCE seq_egbs_glcodemaster;

CREATE TABLE public.egbs_glcodemaster
(
  id character varying(64) NOT NULL,
  tenantid character varying(128) NOT NULL,
  taxhead character varying(250) NOT NULL,
  service character varying(64) NOT NULL,
  fromdate bigint NOT NULL,
  todate bigint NOT NULL,
  createdby character varying(64),
  createdtime bigint,
  lastmodifiedby character varying(64),
  lastmodifiedtime bigint,
  glcode character varying(64),
  CONSTRAINT pk_egbs_glcodemaster PRIMARY KEY (id, tenantid)
);

CREATE SEQUENCE seq_egbs_bill;
CREATE TABLE egbs_bill
(
 id character varying(64) NOT NULL,

 tenantid character varying(250) NOT NULL,

 payeename character varying(256) NOT NULL,

 payeeaddress character varying(1024),

 payeeemail character varying(256),

 isactive boolean,

 iscancelled boolean,

 createdby character varying(64) NOT NULL,

 createddate bigint NOT NULL,

 lastmodifiedby character varying(64),

 lastmodifieddate bigint,

 CONSTRAINT pk_eg_bs_bill PRIMARY KEY (id, tenantid)
);


CREATE SEQUENCE seq_egbs_billdetail;
CREATE SEQUENCE seq_egbs_billnumber;
CREATE TABLE egbs_billdetail
(

 id character varying(64) NOT NULL,

 tenantid character varying(250) NOT NULL,

 billid character varying(64) NOT NULL,

 businessservice character varying(250) NOT NULL,

 billno character varying(32) NOT NULL,

 billdate bigint NOT NULL,

 consumercode character varying(250) NOT NULL,

 consumertype character varying(250),

 billdescription character varying(1024),

 displaymessage character varying(1024),

 minimumamount numeric(12,2),

 totalamount numeric(12,2),

 callbackforapportioning boolean,

 partpaymentallowed boolean,

 collectionmodesnotallowed character varying(512),

 createdby character varying(64) NOT NULL,

 createddate bigint NOT NULL,

 lastmodifiedby character varying(64),

 lastmodifieddate bigint,

 CONSTRAINT pk_eg_bs_billdetail PRIMARY KEY (id, tenantid),

 CONSTRAINT fk_eg_bs_bill FOREIGN KEY (billid, tenantid)

     REFERENCES egbs_bill (id, tenantid) MATCH SIMPLE

     ON UPDATE NO ACTION ON DELETE NO ACTION
);


CREATE SEQUENCE seq_egbs_billaccountdetail;
CREATE TABLE egbs_billaccountdetail
(

 id character varying(64) NOT NULL,

 tenantid character varying(250) NOT NULL,

 billdetail character varying(64) NOT NULL,

 glcode character varying(250) NOT NULL,

 orderno integer,

 accountdescription character varying(512) NOT NULL,

 creditamount numeric(12,2),

 debitamount numeric(12,2),

 isactualdemand boolean,

 purpose character varying(250),

 createdby character varying(64) NOT NULL,

 createddate bigint NOT NULL,

 lastmodifiedby character varying(64),

 lastmodifieddate bigint,

 CONSTRAINT pk_eg_bs_billaccountdetails PRIMARY KEY (id, tenantid),

 CONSTRAINT fk_eg_bs_billdetail FOREIGN KEY (billdetail, tenantid)

     REFERENCES egbs_billdetail (id, tenantid) MATCH SIMPLE

     ON UPDATE NO ACTION ON DELETE NO ACTION
);


ALTER TABLE egbs_demand DROP COLUMN minimumamountpayable,ADD COLUMN minimumamountpayable numeric(12,2);

ALTER TABLE egbs_billaccountdetail ADD COLUMN cramounttobepaid numeric(12,2);

ALTER TABLE egbs_demand add CONSTRAINT uk_egbs_demand_consumercode_businessservice UNIQUE (consumercode,businessservice);

ALTER TABLE egbs_taxperiod ADD COLUMN periodcycle character varying(64);

DROP TABLE public.egbs_taxheadmaster;

CREATE TABLE egbs_taxheadmaster
(
  id character varying(64) NOT NULL,
  tenantid character varying(128) NOT NULL,
  category character varying(250) NOT NULL,
  service character varying(64) NOT NULL,
  name character varying(64) NOT NULL,
  code character varying(64),
  isdebit boolean,
  isactualdemand boolean,
  orderno integer,
  validfrom bigint,
  validtill bigint,
  createdby character varying(64),
  createdtime bigint,
  lastmodifiedby character varying(64),
  lastmodifiedtime bigint,
  CONSTRAINT pk_egbs_taxheadmaster PRIMARY KEY (id, tenantid)
);


DROP TABLE public.egbs_glcodemaster;

CREATE TABLE egbs_glcodemaster
(
  id character varying(64) NOT NULL,
  tenantid character varying(128) NOT NULL,
  taxhead character varying(250) NOT NULL,
  service character varying(64) NOT NULL,
  fromdate bigint NOT NULL,
  todate bigint NOT NULL,
  createdby character varying(64),
  createdtime bigint,
  lastmodifiedby character varying(64),
  lastmodifiedtime bigint,
  glcode character varying(64),
  CONSTRAINT pk_egbs_glcodemaster PRIMARY KEY (id, tenantid)
);

ALTER TABLE egbs_demand DROP CONSTRAINT uk_egbs_demand_consumercode_businessservice,
 ADD CONSTRAINT uk_egbs_demand_consumercode_businessservice UNIQUE (consumercode,businessservice);


ALTER TABLE egbs_demand DROP CONSTRAINT uk_egbs_demand_consumercode_businessservice,
 ADD CONSTRAINT uk_egbs_demand_consumercode_businessservice UNIQUE (consumercode, tenantid, taxperiodfrom, taxperiodto, businessservice);

 ALTER TABLE egbs_bill ADD COLUMN mobilenumber character varying(20);

ALTER TABLE egbs_billdetail ADD COLUMN receiptdate bigint, ADD COLUMN receiptnumber character varying(256);

create sequence seq_egbs_collectedreceipts;

CREATE TABLE egbs_collectedreceipts
(
  id character varying(64) NOT NULL,
  businessservice character varying(256) NOT NULL,
  consumercode character varying(250) NOT NULL,
  receiptnumber character varying(1024),
  receiptamount numeric(12,2) NOT NULL,
  receiptdate bigint,
  status character varying(1024),
  tenantid character varying(250) NOT NULL,
  createdby character varying(64) NOT NULL,
  createddate bigint NOT NULL,
  lastmodifiedby character varying(64),
  lastmodifieddate bigint,
  CONSTRAINT pk_egbs_collectedreceipts PRIMARY KEY (id, tenantid)
);

ALTER TABLE egbs_demand ADD COLUMN status character varying(64);

ALTER TABLE egbs_demand ALTER COLUMN owner DROP NOT NULL;

ALTER TABLE egbs_bill ALTER COLUMN payeename DROP NOT NULL;

CREATE TABLE egbs_demand_v1
(
    id character varying(64) NOT NULL,
    consumercode character varying(250) NOT NULL,
    consumertype character varying(250) NOT NULL,
    businessservice character varying(250) NOT NULL,
    payer character varying(250),
    taxperiodfrom bigint NOT NULL,
    taxperiodto bigint NOT NULL,
    createdby character varying(256) NOT NULL,
    createdtime bigint NOT NULL,
    lastmodifiedby character varying(256),
    lastmodifiedtime bigint,
    tenantid character varying(250) NOT NULL,
    minimumamountpayable numeric(12,2),
    status character varying(64),
    additionaldetails json,
    CONSTRAINT pk_egbs_demand_v1 PRIMARY KEY (id, tenantid),
    CONSTRAINT uk_egbs_demand_v1_consumercode_businessservice UNIQUE (consumercode, tenantid, taxperiodfrom, taxperiodto, businessservice)
);

CREATE INDEX IF NOT EXISTS idx_egbs_demand_v1_id ON egbs_demand_v1(id);
CREATE INDEX IF NOT EXISTS idx_egbs_demand_v1_consumercode ON egbs_demand_v1(consumercode);
CREATE INDEX IF NOT EXISTS idx_egbs_demand_v1_consumertype ON egbs_demand_v1(consumertype);
CREATE INDEX IF NOT EXISTS idx_egbs_demand_v1_businessservice ON egbs_demand_v1(businessservice);
CREATE INDEX IF NOT EXISTS idx_egbs_demand_v1_payer ON egbs_demand_v1(payer);
CREATE INDEX IF NOT EXISTS idx_egbs_demand_v1_taxperiodfrom ON egbs_demand_v1(taxperiodfrom);
CREATE INDEX IF NOT EXISTS idx_egbs_demand_v1_taxperiodto ON egbs_demand_v1(taxperiodto);
CREATE INDEX IF NOT EXISTS idx_egbs_demand_v1_tenantid ON egbs_demand_v1(tenantid);

CREATE TABLE egbs_demanddetail_v1
(
    id character varying(64) NOT NULL,
    demandid character varying(64) NOT NULL,
    taxheadcode character varying(250) NOT NULL,
    taxamount numeric(12,2)NOT NULL,
    collectionamount numeric(12,2)NOT NULL,
    createdby character varying(256) NOT NULL,
    createdtime bigint NOT NULL,
    lastmodifiedby character varying(256),
    lastmodifiedtime bigint,
    tenantid character varying(250) NOT NULL,
    additionaldetails json,
    CONSTRAINT pk_egbs_demanddetail_v1 PRIMARY KEY (id, tenantid),
    CONSTRAINT fk_egbs_demanddetail_v1 FOREIGN KEY (tenantid, demandid) REFERENCES egbs_demand_v1 (tenantid, id)
);

CREATE INDEX IF NOT EXISTS idx_egbs_demanddetail_v1_tenantid ON egbs_demanddetail_v1(tenantid);
CREATE INDEX IF NOT EXISTS idx_egbs_demanddetail_v1_demandid ON egbs_demanddetail_v1(demandid);

CREATE TABLE egbs_demand_v1_audit
(
    id character varying(64) NOT NULL,
    demandid character varying(64) NOT NULL,
    consumercode character varying(250) NOT NULL,
    consumertype character varying(250) NOT NULL,
    businessservice character varying(250) NOT NULL,
    payer character varying(250),
    taxperiodfrom bigint NOT NULL,
    taxperiodto bigint NOT NULL,
    createdby character varying(256) NOT NULL,
    createdtime bigint NOT NULL,
    tenantid character varying(250) NOT NULL,
    minimumamountpayable numeric(12,2),
    status character varying(64),
    additionaldetails json,
    CONSTRAINT pk_egbs_demand_v1_audit PRIMARY KEY (id, tenantid)
);

CREATE TABLE egbs_demanddetail_v1_audit
(
    id character varying(64) NOT NULL,
    demandid character varying(64) NOT NULL,
    demanddetailid character varying(64) NOT NULL,
    taxheadcode character varying(250) NOT NULL,
    taxamount numeric(12,2)NOT NULL,
    collectionamount numeric(12,2)NOT NULL,
    createdby character varying(256) NOT NULL,
    createdtime bigint NOT NULL,
    tenantid character varying(250) NOT NULL,
    additionaldetails json,
    CONSTRAINT pk_egbs_demanddetail_v1_audit PRIMARY KEY (id, tenantid)
);


CREATE TABLE egbs_bill_v1
(
    id character varying(64) NOT NULL,
    tenantid character varying(250) NOT NULL,
    payername character varying(256),
    payeraddress character varying(1024),
    payeremail character varying(256),
    isactive boolean,
    iscancelled boolean,
    createdby character varying(256) NOT NULL,
    createddate bigint NOT NULL,
    lastmodifiedby character varying(256),
    lastmodifieddate bigint,
    mobilenumber character varying(20),
    CONSTRAINT pk_egbs_bill_v1 PRIMARY KEY (id, tenantid)
);

CREATE INDEX IF NOT EXISTS idx_egbs_bill_v1_id ON egbs_bill_v1(id);
CREATE INDEX IF NOT EXISTS idx_egbs_bill_v1_isactive ON egbs_bill_v1(isactive);
CREATE INDEX IF NOT EXISTS idx_egbs_bill_v1_tenantid ON egbs_bill_v1(tenantid);

CREATE TABLE egbs_billdetail_v1
(
    id character varying(64) NOT NULL,
    tenantid character varying(250) NOT NULL,
    billid character varying(64) NOT NULL,
    businessservice character varying(250) NOT NULL,
    billno character varying(32),
    billdate bigint NOT NULL,
    consumercode character varying(250) NOT NULL,
    consumertype character varying(250),
    billdescription character varying(1024),
    displaymessage character varying(1024),
    minimumamount numeric(12,2),
    totalamount numeric(12,2),
    callbackforapportioning boolean,
    partpaymentallowed boolean,
    collectionmodesnotallowed character varying(512),
    createdby character varying(256) NOT NULL,
    createddate bigint NOT NULL,
    lastmodifiedby character varying(256),
    lastmodifieddate bigint,
    receiptdate bigint,
    receiptnumber character varying(256),
    fromperiod bigint,
    toperiod bigint,
    demandid character varying(64),
    isadvanceallowed boolean,
    expirydate bigint,
    CONSTRAINT pk_egbs_billdetail_v1 PRIMARY KEY (id, tenantid),
    CONSTRAINT fk_egbs_bill_v1 FOREIGN KEY (tenantid, billid) REFERENCES egbs_bill_v1 (tenantid, id) 
);

CREATE INDEX IF NOT EXISTS idx_egbs_billdetail_v1_businessservice ON egbs_billdetail_v1(businessservice);
CREATE INDEX IF NOT EXISTS idx_egbs_billdetail_v1_consumercode ON egbs_billdetail_v1(consumercode);
CREATE INDEX IF NOT EXISTS idx_egbs_billdetail_v1_tenantid ON egbs_billdetail_v1(tenantid);

CREATE TABLE egbs_billaccountdetail_v1
(
    id character varying(64) NOT NULL,
    tenantid character varying(250) NOT NULL,
    billdetail character varying(64) NOT NULL,
    glcode character varying(250),
    orderno integer,
    accountdescription character varying(512),
    creditamount numeric(12,2),
    debitamount numeric(12,2),
    isactualdemand boolean,
    purpose character varying(250),
    createdby character varying(256) NOT NULL,
    createddate bigint NOT NULL,
    lastmodifiedby character varying(256),
    lastmodifieddate bigint,
    cramounttobepaid numeric(12,2),
    taxheadcode character varying(256),
    amount numeric(10,2),
    adjustedamount numeric(10,2),
    demanddetailid character varying(64),
    CONSTRAINT pk_egbs_billaccountdetails_v1 PRIMARY KEY (id, tenantid),
    CONSTRAINT fk_egbs_billdetail_v1 FOREIGN KEY (billdetail, tenantid) REFERENCES egbs_billdetail_v1 (id, tenantid) 
);

ALTER TABLE EGBS_DEMAND_v1 ADD COLUMN billexpirytime bigint;
ALTER TABLE EGBS_DEMAND_v1_AUDIT ADD COLUMN billexpirytime bigint;

ALTER TABLE egbs_demand_v1 DROP CONSTRAINT uk_egbs_demand_v1_consumercode_businessservice;

CREATE UNIQUE INDEX uk_egbs_demand_v1_consumercode_businessservice ON egbs_demand_v1 (consumercode, tenantid, taxperiodfrom, taxperiodto, businessservice, status) where status='ACTIVE';

CREATE INDEX IF NOT EXISTS  idx_egbs_bill_v1_id ON public.egbs_bill_v1 USING btree (id);
CREATE INDEX IF NOT EXISTS  idx_egbs_bill_v1_isactive ON public.egbs_bill_v1 USING btree (isactive);
CREATE INDEX IF NOT EXISTS  idx_egbs_bill_v1_tenantid ON public.egbs_bill_v1 USING btree (tenantid);
CREATE UNIQUE INDEX IF NOT EXISTS  pk_egbs_bill_v1 ON public.egbs_bill_v1 USING btree (id, tenantid);
CREATE UNIQUE INDEX IF NOT EXISTS  pk_egbs_billaccountdetails_v1 ON public.egbs_billaccountdetail_v1 USING btree (id, tenantid);
CREATE INDEX IF NOT EXISTS  idx_egbs_billdetail_v1_businessservice ON public.egbs_billdetail_v1 USING btree (businessservice);
CREATE INDEX IF NOT EXISTS  idx_egbs_billdetail_v1_consumercode ON public.egbs_billdetail_v1 USING btree (consumercode);
CREATE INDEX IF NOT EXISTS  idx_egbs_billdetail_v1_tenantid ON public.egbs_billdetail_v1 USING btree (tenantid);
CREATE UNIQUE INDEX IF NOT EXISTS  pk_egbs_billdetail_v1 ON public.egbs_billdetail_v1 USING btree (id, tenantid);
CREATE UNIQUE INDEX IF NOT EXISTS  pk_biz_srvc_det ON public.egbs_business_service_details USING btree (id, tenantid);
CREATE UNIQUE INDEX IF NOT EXISTS  unq_businessservice ON public.egbs_business_service_details USING btree (businessservice, tenantid);
CREATE UNIQUE INDEX IF NOT EXISTS  pk_egbs_collectedreceipts ON public.egbs_collectedreceipts USING btree (id, tenantid);
CREATE INDEX IF NOT EXISTS  idx_egbs_demand_v1_businessservice ON public.egbs_demand_v1 USING btree (businessservice);
CREATE INDEX IF NOT EXISTS  idx_egbs_demand_v1_consumercode ON public.egbs_demand_v1 USING btree (consumercode);
CREATE INDEX IF NOT EXISTS  idx_egbs_demand_v1_consumertype ON public.egbs_demand_v1 USING btree (consumertype);
CREATE INDEX IF NOT EXISTS  idx_egbs_demand_v1_id ON public.egbs_demand_v1 USING btree (id);
CREATE INDEX IF NOT EXISTS  idx_egbs_demand_v1_payer ON public.egbs_demand_v1 USING btree (payer);
CREATE INDEX IF NOT EXISTS  idx_egbs_demand_v1_taxperiodfrom ON public.egbs_demand_v1 USING btree (taxperiodfrom);
CREATE INDEX IF NOT EXISTS  idx_egbs_demand_v1_taxperiodto ON public.egbs_demand_v1 USING btree (taxperiodto);
CREATE INDEX IF NOT EXISTS  idx_egbs_demand_v1_tenantid ON public.egbs_demand_v1 USING btree (tenantid);
CREATE UNIQUE INDEX IF NOT EXISTS  pk_egbs_demand_v1 ON public.egbs_demand_v1 USING btree (id, tenantid);
CREATE UNIQUE INDEX IF NOT EXISTS  uk_egbs_demand_v1_consumercode_businessservice ON public.egbs_demand_v1 USING btree (consumercode, tenantid, taxperiodfrom, taxperiodto, businessservice);
CREATE UNIQUE INDEX IF NOT EXISTS  pk_egbs_demand_v1_audit ON public.egbs_demand_v1_audit USING btree (id, tenantid);
CREATE INDEX IF NOT EXISTS  idx_egbs_demanddetail_v1_demandid ON public.egbs_demanddetail_v1 USING btree (demandid);
CREATE INDEX IF NOT EXISTS  idx_egbs_demanddetail_v1_tenantid ON public.egbs_demanddetail_v1 USING btree (tenantid);
CREATE UNIQUE INDEX IF NOT EXISTS  pk_egbs_demanddetail_v1 ON public.egbs_demanddetail_v1 USING btree (id, tenantid);
CREATE UNIQUE INDEX IF NOT EXISTS  pk_egbs_demanddetail_v1_audit ON public.egbs_demanddetail_v1_audit USING btree (id, tenantid);


ALTER TABLE egbs_bill_v1 ADD COLUMN status character varying(64), ADD COLUMN additionaldetails jsonb;

ALTER TABLE egbs_billdetail_v1 ADD COLUMN additionaldetails jsonb;

ALTER TABLE egbs_billaccountdetail_v1 ADD COLUMN additionaldetails jsonb;

ALTER TABLE egbs_billdetail_v1 ALTER COLUMN billno TYPE character varying(1024);

ALTER TABLE egbs_bill_v1 ADD COLUMN filestoreid character varying(256);

CREATE index if not exists idx_egbs_billdetail_v1_billid ON egbs_billdetail_v1 USING btree (billid);
CREATE index if not exists idx_egbs_billaccountdetail_v1_billdetail ON egbs_billaccountdetail_v1 USING btree (billdetail);

CREATE TABLE egbs_payment_backupdate_audit 
(
    paymentid character varying(256) NOT NULL,
    
	isbackupdatesuccess Boolean NOT NULL,
	
	isreceiptcancellation Boolean NOT NULL,
	
	errorMessage character varying
);

CREATE UNIQUE INDEX uk_egbs_payment_backupdate_audit ON egbs_payment_backupdate_audit (paymentid, isreceiptcancellation) WHERE isbackupdatesuccess='TRUE';
 
 ALTER TABLE EGBS_DEMAND_v1 ADD COLUMN ispaymentcompleted BOOLEAN DEFAULT false;
ALTER TABLE EGBS_DEMAND_v1_AUDIT ADD COLUMN ispaymentcompleted BOOLEAN;

CREATE TABLE EGBS_AMENDMENT
(
   id CHARACTER VARYING (256) NOT NULL,
   tenantid CHARACTER VARYING (256) NOT NULL,
   amendmentId CHARACTER VARYING (256) NOT NULL,
   businessservice CHARACTER VARYING (256) NOT NULL,
   consumercode CHARACTER VARYING (256) NOT NULL,
   amendmentReason CHARACTER VARYING (256) NOT NULL,
   reasonDocumentNumber CHARACTER VARYING (256),
   status CHARACTER VARYING (256) NOT NULL,
   effectiveTill BIGINT,
   effectiveFrom BIGINT,
   amendedDemandId CHARACTER VARYING (256),
   createdby CHARACTER VARYING (256) NOT NULL,
   createdtime BIGINT NOT NULL,
   lastmodifiedby CHARACTER VARYING (256) NOT NULL,
   lastmodifiedtime BIGINT NOT NULL,
   additionaldetails JSONB,
   
   CONSTRAINT pk_egbs_amendment PRIMARY KEY (amendmentId, tenantid),
   CONSTRAINT uk_egbs_amendment UNIQUE (id)
);

CREATE TABLE EGBS_AMENDMENT_TAXDETAIL
(
   id CHARACTER VARYING (128) NOT NULL,
   amendmentid CHARACTER VARYING (128) NOT NULL,
   taxheadcode CHARACTER VARYING (250) NOT NULL,
   taxamount NUMERIC (12,2) NOT NULL,
   
   CONSTRAINT pk_egbs_amendment_taxdetail PRIMARY KEY (id, amendmentid)
);

CREATE TABLE egbs_document
(
   id CHARACTER VARYING (128) NOT NULL,
   amendmentid CHARACTER VARYING (256) NOT NULL,
   documentType CHARACTER VARYING (256) NOT NULL,
   fileStoreid CHARACTER VARYING (256) NOT NULL,
   documentuid CHARACTER VARYING (256),
   status CHARACTER VARYING (256) NOT NULL,
   
   CONSTRAINT pk_egbs_document_id PRIMARY KEY (id)
);

ALTER TABLE EGBS_DEMAND_v1 ADD COLUMN fixedBillExpiryDate BIGINT;
ALTER TABLE EGBS_DEMAND_v1_AUDIT ADD COLUMN fixedBillExpiryDate BIGINT;


ALTER TABLE egbs_bill_v1 add column payerid character varying (128);

ALTER TABLE egbs_bill_v1 add column consumercode character varying(256);

UPDATE egbs_bill_v1 b SET consumerCode = bd.consumercode FROM egbs_billdetail_v1 bd WHERE bd.billid = b.id;

ALTER TABLE egbs_bill_v1 ALTER COLUMN consumercode SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS index_egbs_UNIQUE_ACTIVE_BILL ON egbs_bill_v1 (consumercode, tenantid, status) where status='ACTIVE';