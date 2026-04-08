CREATE TABLE eg_appr_bills_request(
  billDetails JSONB,
  tenantId character varying(64),
  payerName character varying(256),
  payerAddress character varying(1024),
  payerEmail character varying(254),
  paidBy character varying(1024),
  collectionMap JSONB,
  billId character varying(64),
  isActive boolean,
  isCancelled boolean,
  mobileNumber character varying(64),
  createdBy character varying(64),
  createdTime bigint
 );

 CREATE TABLE eg_appr_bills_response(
  billDetails JSONB,
  tenantId character varying(64),
  payerName character varying(256),
  payerAddress character varying(1024),
  payerEmail character varying(254),
  paidBy character varying(1024),
  collectionMap JSONB,
  billId character varying(64),
  isActive boolean,
  isCancelled boolean,
  mobileNumber character varying(64),
  createdBy character varying(64),
  createdTime bigint
 );

 ALTER TABLE eg_appr_bills_request
RENAME COLUMN collectionMap TO taxAndPayments;

ALTER TABLE eg_appr_bills_response
RENAME COLUMN collectionMap TO taxAndPayments;

CREATE TABLE eg_appr_demand_request(
demandId character varying(128),
tenantId character varying(128),
consumerCode character varying(128),
taxperiodfrom bigint,
taxperiodto bigint,
"status" character varying(128),
demandDetails JSONB,
createdBy character varying(64),
createdTime bigint
);

CREATE TABLE eg_appr_demand_response(
demandId character varying(128),
tenantId character varying(128),
consumerCode character varying(128),
taxperiodfrom bigint,
taxperiodto bigint,
"status" character varying(128),
demandDetails JSONB,
createdBy character varying(64),
createdTime bigint
);