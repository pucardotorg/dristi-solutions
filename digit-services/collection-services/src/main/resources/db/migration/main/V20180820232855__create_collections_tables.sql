DROP TABLE IF EXISTS "egcl_receiptheader" CASCADE;
DROP INDEX IF EXISTS idx_rcpthd_consumercode;
DROP INDEX IF EXISTS idx_rcpthd_createdby;
DROP INDEX IF EXISTS idx_rcpthd_createddate;
DROP INDEX IF EXISTS idx_rcpthd_mreceiptnumber;
DROP INDEX IF EXISTS idx_rcpthd_refno;
DROP INDEX IF EXISTS idx_rcpthd_business;
DROP INDEX IF EXISTS idx_rcpthd_status;
DROP TABLE IF EXISTS "egcl_receiptdetails";
DROP TABLE IF EXISTS "egcl_receiptinstrument";
DROP TABLE IF EXISTS "egcl_instrumentheader";
DROP INDEX IF EXISTS idx_ins_transactionnumber;


CREATE TABLE "egcl_receiptheader" (
	"id" VARCHAR(36) NOT NULL,
	"payeename" VARCHAR(256) NULL DEFAULT NULL,
	"payeeaddress" VARCHAR(1024) NULL DEFAULT NULL,
	"payeeemail" VARCHAR(254) NULL DEFAULT NULL,
	"paidby" VARCHAR(1024) NULL DEFAULT NULL,
	"referencenumber" VARCHAR(50) NULL DEFAULT NULL,
	"receipttype" VARCHAR(32) NOT NULL,
	"receiptnumber" VARCHAR(50) NULL DEFAULT NULL,
	"referencedesc" VARCHAR(250) NULL DEFAULT NULL,
	"manualreceiptnumber" VARCHAR(50) NULL DEFAULT NULL,
	"businessdetails" VARCHAR(32) NOT NULL,
	"collectiontype" VARCHAR(50) NOT NULL,
	"displaymsg" VARCHAR(256) NULL DEFAULT NULL,
	"reference_ch_id" BIGINT NULL DEFAULT NULL,
	"stateid" BIGINT NULL DEFAULT NULL,
	"location" BIGINT NULL DEFAULT NULL,
	"isreconciled" BOOLEAN NULL DEFAULT NULL,
	"status" VARCHAR(50) NOT NULL,
	"reasonforcancellation" VARCHAR(250) NULL DEFAULT NULL,
	"minimumamount" NUMERIC(12,2) NULL DEFAULT NULL,
	"totalamount" NUMERIC(12,2) NULL DEFAULT NULL,
	"collmodesnotallwd" VARCHAR(256) NULL DEFAULT NULL,
	"consumercode" VARCHAR(256) NULL DEFAULT NULL,
	"channel" VARCHAR(20) NULL DEFAULT NULL,
	"consumertype" VARCHAR(100) NULL DEFAULT NULL,
	"fund" VARCHAR NULL DEFAULT NULL,
	"fundsource" VARCHAR NULL DEFAULT NULL,
	"function" VARCHAR NULL DEFAULT NULL,
	"boundary" VARCHAR NULL DEFAULT NULL,
	"department" VARCHAR NULL DEFAULT NULL,
	"voucherheader" VARCHAR NULL DEFAULT NULL,
	"depositedbranch" VARCHAR NULL DEFAULT NULL,
	"version" BIGINT NOT NULL DEFAULT E'1',
	"createdby" BIGINT NOT NULL,
	"lastmodifiedby" BIGINT NOT NULL,
	"tenantid" VARCHAR NOT NULL,
	"cancellationremarks" VARCHAR(256) NULL DEFAULT NULL,
	"receiptdate" BIGINT NOT NULL,
	"createddate" BIGINT NOT NULL,
	"lastmodifieddate" BIGINT NOT NULL,
	"referencedate" BIGINT NOT NULL DEFAULT E'100',
	"transactionid" VARCHAR(32) NULL DEFAULT NULL,
	CONSTRAINT pk_egcl_receiptheader PRIMARY KEY (id)
);


CREATE INDEX idx_rcpthd_consumercode ON egcl_receiptheader(consumercode);
CREATE INDEX idx_rcpthd_transactionid ON egcl_receiptheader(transactionid);
CREATE INDEX idx_rcpthd_mreceiptnumber ON egcl_receiptheader(manualreceiptnumber);
CREATE INDEX idx_rcpthd_refno ON egcl_receiptheader(referencenumber);
CREATE INDEX idx_rcpthd_business ON egcl_receiptheader(businessdetails);
CREATE INDEX idx_rcpthd_status ON egcl_receiptheader(status);


CREATE TABLE "egcl_receiptdetails" (
	"id" VARCHAR(36) NOT NULL,
	"chartofaccount" VARCHAR NOT NULL,
	"dramount" NUMERIC(12,2) NULL DEFAULT NULL,
	"cramount" NUMERIC(12,2) NULL DEFAULT NULL,
	"ordernumber" BIGINT NULL DEFAULT NULL,
	"receiptheader" VARCHAR(36) NOT NULL,
	"actualcramounttobepaid" NUMERIC(12,2) NULL DEFAULT NULL,
	"description" VARCHAR(500) NULL DEFAULT NULL,
	"financialyear" VARCHAR NULL DEFAULT NULL,
	"isactualdemand" BOOLEAN NULL DEFAULT NULL,
	"purpose" VARCHAR(50) NOT NULL,
	"tenantid" VARCHAR NOT NULL,
	CONSTRAINT pk_egcl_receiptdetails PRIMARY KEY (id),
    CONSTRAINT fk_rcptdtls_rcpthead FOREIGN KEY (receiptheader)
        REFERENCES egcl_receiptheader (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


CREATE TABLE "egcl_instrumentheader" (
  id VARCHAR(36) NOT NULL,
  transactionNumber varchar(50) NOT NULL,
  transactionDate BIGINT NOT NULL,
  amount numeric (12,2) NOT NULL,
  instrumentType varchar(50) NOT NULL,
  instrumentStatus varchar(50) NOT NULL,
  bankId varchar(50),
  branchName varchar(50),
  bankAccountId varchar(50),
  ifscCode varchar(20),
  financialStatus varchar(50),
  transactionType varchar(6),
  payee varchar(50),
  drawer varchar(100),
  surrenderReason varchar(50),
  serialNo varchar(50),
  createdby varchar(50),
  createddate BIGINT NOT NULL,
  lastmodifiedby varchar(50),
  lastmodifieddate BIGINT NOT NULL,
  tenantId varchar(250),
  CONSTRAINT pk_egcl_instrumenthead PRIMARY KEY (id)
);

CREATE INDEX idx_ins_transactionnumber ON egcl_instrumentheader(transactionNumber);


CREATE TABLE EGCL_RECEIPTINSTRUMENT (
  RECEIPTHEADER VARCHAR(36) NOT NULL,
  INSTRUMENTHEADER VARCHAR(36) NOT NULL,
  CONSTRAINT FK_RCPTINST_RCPTHEAD FOREIGN KEY (RECEIPTHEADER)
        REFERENCES EGCL_RECEIPTHEADER (ID)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
  CONSTRAINT FK_RCPTINST_INSTHEAD FOREIGN KEY (INSTRUMENTHEADER)
        REFERENCES EGCL_INSTRUMENTHEADER (ID)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

ALTER TABLE "egcl_receiptheader"
ADD COLUMN "collectedamount" NUMERIC(12,2) DEFAULT NULL,
ADD COLUMN "manualreceiptdate"  BIGINT;

ALTER TABLE egcl_receiptheader ADD COLUMN additionalDetails JSONB;
ALTER TABLE egcl_receiptdetails ADD COLUMN additionalDetails JSONB;
ALTER TABLE egcl_instrumentheader ADD COLUMN additionalDetails JSONB;

ALTER TABLE egcl_receiptheader ADD COLUMN payeemobile varchar(50);

ALTER TABLE egcl_receiptheader ALTER COLUMN transactionid TYPE varchar(50);

ALTER TABLE egcl_instrumentheader ADD COLUMN instrumentDate BIGINT;
ALTER TABLE egcl_instrumentheader ADD COLUMN instrumentNumber varchar(50);

DROP TABLE IF EXISTS egcl_bankaccountservicemapping;

DROP SEQUENCE IF EXISTS seq_egcl_bankaccountservicemapping;

CREATE TABLE egcl_bankaccountservicemapping
(
  id bigint NOT NULL,
  businessdetails character varying(12) NOT NULL,
  bankaccount character varying(12) NOT NULL,
  bank character varying(12) ,
  bankbranch character varying(12),
  active boolean,
  version bigint NOT NULL DEFAULT 1,
  createdby bigint NOT NULL,
  lastmodifiedby bigint NOT NULL,
  createddate bigint,
  lastmodifieddate bigint,
  tenantid character varying(252) NOT NULL,
  CONSTRAINT pk_egcl_bankaccountservicemapping PRIMARY KEY (id)
  );

CREATE SEQUENCE seq_egcl_bankaccountservicemapping;

CREATE TABLE egcl_remittance
(
  id character varying(250) NOT NULL,
  referencenumber character varying(50) NOT NULL,
  referencedate bigint NOT NULL,
  voucherheader character varying(250),
  fund character varying(250),
  function character varying(250),
  remarks character varying(250),
  reasonfordelay character varying(250),
  status character varying(250) NOT NULL,
  createdby bigint NOT NULL,
  createddate bigint,
  lastmodifiedby bigint NOT NULL,
  lastmodifieddate bigint,
  bankaccount character varying(250),
  tenantid character varying(252) NOT NULL,
  CONSTRAINT pk_egcl_remittance PRIMARY KEY (id)
 );
 
 CREATE TABLE egcl_remittancedetails
(
  id character varying(250) NOT NULL,
  remittance character varying(250) NOT NULL,
  chartofaccount character varying(250) NOT NULL,
  creditamount double precision,
  debitamount double precision,
  tenantid character varying(252) NOT NULL,
  CONSTRAINT pk_egcl_remittancedetails PRIMARY KEY (id)
 );
 
  CREATE TABLE egcl_remittanceinstrument
(
  id character varying(250) NOT NULL,
  remittance character varying(250) NOT NULL,
  instrument character varying(250) NOT NULL,
  reconciled boolean DEFAULT false,
  tenantid character varying(252) NOT NULL,
  CONSTRAINT pk_egcl_remittanceinstrument PRIMARY KEY (id)
 );
 
 CREATE TABLE egcl_remittancereceipt
(
  id character varying(250) NOT NULL,
  remittance character varying(250) NOT NULL,
  receipt character varying(250) NOT NULL,
  tenantid character varying(252) NOT NULL,
  CONSTRAINT pk_egcl_remittancereceipt PRIMARY KEY (id)
 );

 ALTER TABLE egcl_bankaccountservicemapping ALTER COLUMN bankaccount TYPE varchar(20);

ALTER TABLE egcl_bankaccountservicemapping ALTER COLUMN bankbranch TYPE varchar(80);

ALTER TABLE egcl_bankaccountservicemapping ALTER COLUMN bank TYPE varchar(256);

ALTER TABLE egcl_bankaccountservicemapping ALTER COLUMN businessdetails TYPE varchar(256);

CREATE TABLE egcl_receiptheader_v1
(
    id character varying(36)  NOT NULL,
    payername character varying(256) ,
    payeraddress character varying(1024) ,
    payeremail character varying(254) ,
    paidby character varying(1024) ,
    referencenumber character varying(50) ,
    receipttype character varying(32)  NOT NULL,
    receiptnumber character varying(50) ,
    referencedesc character varying(250) ,
    manualreceiptnumber character varying(50) ,
    businessdetails character varying(32)  NOT NULL,
    collectiontype character varying(50)  NOT NULL,
    displaymsg character varying(256) ,
    reference_ch_id bigint,
    stateid bigint,
    location bigint,
    isreconciled boolean,
    status character varying(50)  NOT NULL,
    reasonforcancellation character varying(250) ,
    minimumamount numeric(12,2),
    totalamount numeric(12,2),
    collmodesnotallwd character varying(256) ,
    consumercode character varying(256) ,
    channel character varying(20) ,
    consumertype character varying(100) ,
    fund character varying ,
    fundsource character varying ,
    function character varying ,
    boundary character varying ,
    department character varying ,
    voucherheader character varying ,
    depositedbranch character varying ,
    version bigint NOT NULL DEFAULT 1,
    createdby character varying(256)  NOT NULL,
    lastmodifiedby character varying(256)  NOT NULL,
    tenantid character varying  NOT NULL,
    cancellationremarks character varying(256) ,
    receiptdate bigint NOT NULL,
    createddate bigint NOT NULL,
    lastmodifieddate bigint NOT NULL,
    referencedate bigint NOT NULL ,
    transactionid character varying(50) ,
    collectedamount numeric(12,2),
    manualreceiptdate bigint,
    additionaldetails jsonb,
    payermobile character varying(50) ,
    demandid character varying(256) ,
    demandfromdate bigint,
    demandtodate bigint,
    CONSTRAINT pk_egcl_receiptheader_v1 PRIMARY KEY (id)
);


CREATE TABLE egcl_receiptdetails_v1
(
    id character varying(36)  NOT NULL,
    chartofaccount character varying ,
    dramount numeric(12,2) ,
    cramount numeric(12,2) ,
    ordernumber bigint,
    receiptheader character varying(36)  NOT NULL,
    actualcramounttobepaid numeric(12,2) ,
    description character varying(500) ,
    financialyear character varying ,
    isactualdemand boolean,
    purpose character varying(50) ,
    tenantid character varying  NOT NULL,
    additionaldetails jsonb,
    amount numeric(12,2) ,
    adjustedamount numeric(12,2) ,
    demanddetailid character varying(256) ,
    taxheadcode character varying(256) ,
    CONSTRAINT pk_egcl_receiptdetails_v1 PRIMARY KEY (id),
    CONSTRAINT fk_rcptdtls_rcpthead_v1 FOREIGN KEY (receiptheader)
        REFERENCES egcl_receiptheader_v1 (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE egcl_receiptheader_v1_history
(
    id character varying(36) ,
    payername character varying(256) ,
    payeraddress character varying(1024) ,
    payeremail character varying(254) ,
    paidby character varying(1024) ,
    referencenumber character varying(50) ,
    receipttype character varying(32) ,
    receiptnumber character varying(50) ,
    referencedesc character varying(250) ,
    manualreceiptnumber character varying(50) ,
    businessdetails character varying(32) ,
    collectiontype character varying(50) ,
    displaymsg character varying(256) ,
    reference_ch_id bigint,
    stateid bigint,
    location bigint,
    isreconciled boolean,
    status character varying(50) ,
    reasonforcancellation character varying(250) ,
    minimumamount numeric(12,2),
    totalamount numeric(12,2),
    collmodesnotallwd character varying(256) ,
    consumercode character varying(256) ,
    channel character varying(20) ,
    consumertype character varying(100) ,
    fund character varying ,
    fundsource character varying ,
    function character varying ,
    boundary character varying ,
    department character varying ,
    voucherheader character varying ,
    depositedbranch character varying ,
    version bigint,
    createdby character varying(256) ,
    lastmodifiedby character varying(256) ,
    tenantid character varying(256) ,
    cancellationremarks character varying(256) ,
    receiptdate bigint,
    createddate bigint,
    lastmodifieddate bigint,
    referencedate bigint,
    transactionid character varying(50) ,
    collectedamount numeric(12,2),
    manualreceiptdate bigint,
    additionaldetails jsonb,
    payermobile character varying(50) ,
    uuid character varying(256)  NOT NULL,
    demandid character varying(256) ,
    demandfromdate bigint,
    demandtodate bigint
);

CREATE TABLE egcl_receiptdetails_v1_history
(
    id character varying(36) ,
    chartofaccount character varying ,
    dramount numeric(12,2),
    cramount numeric(12,2),
    ordernumber bigint,
    receiptheader character varying(36) ,
    actualcramounttobepaid numeric(12,2),
    description character varying(500) ,
    financialyear character varying ,
    isactualdemand boolean,
    purpose character varying(50) ,
    tenantid character varying (256),
    additionaldetails jsonb,
    amount numeric(12,2),
    adjustedamount numeric(12,2),
    uuid character varying(256)  NOT NULL,
    demanddetailid character varying(256) ,
    taxheadcode character varying(256) 
);

CREATE TABLE egcl_instrumentheader_v1
(
    id character varying(36)  NOT NULL,
    transactionnumber character varying(50)  NOT NULL,
    transactiondate bigint NOT NULL,
    amount numeric(12,2) NOT NULL,
    instrumenttype character varying(50)  NOT NULL,
    instrumentstatus character varying(50)  NOT NULL,
    bankid character varying(50) ,
    branchname character varying(50) ,
    bankaccountid character varying(50) ,
    ifsccode character varying(20) ,
    financialstatus character varying(50) ,
    transactiontype character varying(6) ,
    payee character varying(50) ,
    drawer character varying(100) ,
    surrenderreason character varying(50) ,
    serialno character varying(50) ,
    createdby character varying(50) ,
    createddate bigint NOT NULL,
    lastmodifiedby character varying(50) ,
    lastmodifieddate bigint NOT NULL,
    tenantid character varying(250) ,
    additionaldetails jsonb,
    instrumentdate bigint,
    instrumentnumber character varying(50) ,
    CONSTRAINT pk_egcl_instrumenthead_v1 PRIMARY KEY (id)
);

CREATE TABLE egcl_instrumentheader_v1_history
(
    id character varying(36) ,
    transactionnumber character varying(50) ,
    transactiondate bigint,
    amount numeric(12,2),
    instrumenttype character varying(50) ,
    instrumentstatus character varying(50) ,
    bankid character varying(50) ,
    branchname character varying(50) ,
    bankaccountid character varying(50) ,
    ifsccode character varying(20) ,
    financialstatus character varying(50) ,
    transactiontype character varying(6) ,
    payee character varying(50) ,
    drawer character varying(100) ,
    surrenderreason character varying(50) ,
    serialno character varying(50) ,
    createdby character varying(50) ,
    createddate bigint,
    lastmodifiedby character varying(50) ,
    lastmodifieddate bigint,
    tenantid character varying(250) ,
    additionaldetails jsonb,
    instrumentdate bigint,
    instrumentnumber character varying(50) ,
    uuid character varying(256)  NOT NULL
);

CREATE TABLE egcl_receiptinstrument_v1
(
    receiptheader character varying(36)  NOT NULL,
    instrumentheader character varying(36)  NOT NULL,
    CONSTRAINT fk_rcptinst_insthead FOREIGN KEY (instrumentheader)
        REFERENCES egcl_instrumentheader_v1 (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_rcptinst_rcpthead FOREIGN KEY (receiptheader)
        REFERENCES egcl_receiptheader_v1 (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

ALTER TABLE egcl_receiptheader_v1 ADD COLUMN payerid varchar(256);

ALTER TABLE egcl_receiptheader_v1_history ADD COLUMN payerid varchar(256);
ALTER TABLE egcl_instrumentheader_v1 alter column payee TYPE character varying(256);
ALTER TABLE egcl_receiptheader_v1 ALTER COLUMN receipttype TYPE character varying(256), ALTER COLUMN businessdetails TYPE character varying(256);

ALTER TABLE egcl_receiptheader_v1_history ALTER COLUMN receipttype TYPE character varying(256), ALTER COLUMN businessdetails TYPE character varying(256);

ALTER TABLE egcl_receiptheader_v1 alter column businessdetails TYPE character varying(500);
ALTER TABLE egcl_receiptheader_v1 alter column receipttype TYPE character varying(500);	

ALTER TABLE egcl_receiptheader_v1_history alter column businessdetails TYPE character varying(500);
ALTER TABLE egcl_receiptheader_v1_history alter column receipttype TYPE character varying(500);	

CREATE UNIQUE INDEX IF NOT EXISTS  pk_egcl_bankaccountservicemapping ON public.egcl_bankaccountservicemapping USING btree (id);
CREATE INDEX IF NOT EXISTS  idx_ins_transactionnumber_v1 ON public.egcl_instrumentheader_v1 USING btree (transactionnumber);
CREATE UNIQUE INDEX IF NOT EXISTS  pk_egcl_instrumenthead_v1 ON public.egcl_instrumentheader_v1 USING btree (id);
CREATE INDEX IF NOT EXISTS  idx_receiptdetails_v1_receiptheader ON public.egcl_receiptdetails_v1 USING btree (receiptheader);
CREATE UNIQUE INDEX IF NOT EXISTS  pk_egcl_receiptdetails_v1 ON public.egcl_receiptdetails_v1 USING btree (id);
CREATE INDEX IF NOT EXISTS  idx_rcpthd_v1_business ON public.egcl_receiptheader_v1 USING btree (businessdetails);
CREATE INDEX IF NOT EXISTS  idx_rcpthd_v1_consumercode ON public.egcl_receiptheader_v1 USING btree (consumercode);
CREATE INDEX IF NOT EXISTS  idx_rcpthd_v1_mreceiptnumber ON public.egcl_receiptheader_v1 USING btree (manualreceiptnumber);
CREATE INDEX IF NOT EXISTS  idx_rcpthd_v1_refno ON public.egcl_receiptheader_v1 USING btree (referencenumber);
CREATE INDEX IF NOT EXISTS  idx_rcpthd_v1_status ON public.egcl_receiptheader_v1 USING btree (status);
CREATE INDEX IF NOT EXISTS  idx_rcpthd_v1_transactionid ON public.egcl_receiptheader_v1 USING btree (transactionid);
CREATE UNIQUE INDEX IF NOT EXISTS  pk_egcl_receiptheader_v1 ON public.egcl_receiptheader_v1 USING btree (id);
CREATE INDEX IF NOT EXISTS  idx_receiptinstrument_v1_instrumentheader ON public.egcl_receiptinstrument_v1 USING btree (instrumentheader);
CREATE INDEX IF NOT EXISTS  idx_receiptinstrument_v1_receiptheader ON public.egcl_receiptinstrument_v1 USING btree (receiptheader);
CREATE UNIQUE INDEX IF NOT EXISTS  pk_egcl_remittance ON public.egcl_remittance USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS  pk_egcl_remittancedetails ON public.egcl_remittancedetails USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS  pk_egcl_remittanceinstrument ON public.egcl_remittanceinstrument USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS  pk_egcl_remittancereceipt ON public.egcl_remittancereceipt USING btree (id);


CREATE TABLE egcl_payment (
  	id VARCHAR(256) NOT NULL,
  	tenantId VARCHAR(256) NOT NULL,
  	totalDue numeric(12,2) NOT NULL,
  	totalAmountPaid numeric(12,2) NOT NULL,
  	transactionNumber VARCHAR(256) NOT NULL,
  	transactionDate BIGINT NOT NULL,
  	paymentMode VARCHAR(64) NOT NULL,
  	instrumentDate BIGINT,
  	instrumentNumber VARCHAR(256),
    instrumentStatus VARCHAR(256) NOT NULL,
  	ifscCode VARCHAR(64),
  	additionalDetails JSONB,
  	paidBy VARCHAR(256) ,
  	mobileNumber VARCHAR(64) NOT NULL,
  	payerName VARCHAR(256) ,
  	payerAddress VARCHAR(1024),
  	payerEmail VARCHAR(256),
  	payerId VARCHAR(256) ,
  	paymentStatus VARCHAR(256) NOT NULL,
  	createdBy VARCHAR(256) NOT NULL,
  	createdtime BIGINT NOT NULL,
  	lastModifiedBy VARCHAR(256) NOT NULL,
  	lastModifiedTime BIGINT NOT NULL,

	CONSTRAINT pk_egcl_payment PRIMARY KEY (id)

);

CREATE INDEX IF NOT EXISTS idx_egcl_payment_transactionNumber ON egcl_payment(transactionNumber);
CREATE INDEX IF NOT EXISTS idx_egcl_payment_payerId ON egcl_payment(payerId);
CREATE INDEX IF NOT EXISTS idx_egcl_payment_mobileNumber ON egcl_payment(mobileNumber);



CREATE TABLE egcl_paymentDetail (
    id VARCHAR(256) NOT NULL,
  	tenantId VARCHAR(256) NOT NULL,
  	paymentid VARCHAR(256) NOT NULL,
  	due numeric(12,2) NOT NULL,
  	amountPaid numeric(12,2) NOT NULL,
  	receiptNumber VARCHAR(256) NOT NULL,
  	receiptDate BIGINT NOT NULL,
    receiptType VARCHAR(256) NOT NULL,
  	businessService VARCHAR(256) NOT NULL,
  	billId VARCHAR(256) NOT NULL,
	additionalDetails JSONB,
	createdBy VARCHAR(256) NOT NULL,
  	createdTime BIGINT NOT NULL,
  	lastModifiedBy VARCHAR(256) NOT NULL,
  	lastModifiedTime BIGINT NOT NULL,

  	CONSTRAINT pk_egcl_paymentDetail PRIMARY KEY (id),
    CONSTRAINT uk_egcl_paymentDetail UNIQUE (billId),
    CONSTRAINT fk_egcl_paymentDetail FOREIGN KEY (paymentid) REFERENCES egcl_payment(id)

  	ON UPDATE CASCADE
	ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_egcl_paymentDetail_receiptNumber ON egcl_paymentDetail(receiptNumber);
CREATE INDEX IF NOT EXISTS idx_egcl_paymentDetail_billId ON egcl_paymentDetail(billId);



CREATE TABLE egcl_bill(
        	id VARCHAR(256) NOT NULL,
        	status VARCHAR(256) NOT NULL,
        	isCancelled boolean,
        	additionalDetails JSONB,
        	tenantId VARCHAR(256) NOT NULL,
        	collectionModesNotAllowed VARCHAR(256),
        	partPaymentAllowed boolean,
        	isAdvanceAllowed boolean,
        	minimumAmountToBePaid numeric(12,2),
        	businessService VARCHAR(256) NOT NULL,
        	totalAmount numeric(12,2) NOT NULL,
        	consumerCode VARCHAR(256) NOT NULL,
        	billNumber VARCHAR(256) NOT NULL,
	    	billDate BIGINT NOT NULL,
	    	reasonForCancellation VARCHAR(2048),
        	createdBy VARCHAR(256) NOT NULL,
		    createdTime BIGINT NOT NULL,
		    lastModifiedBy VARCHAR(256) NOT NULL,
		    lastModifiedTime BIGINT NOT NULL,

	   	    CONSTRAINT pk_egcl_bill PRIMARY KEY (id),
            CONSTRAINT fk_egcl_bill FOREIGN KEY (id) REFERENCES egcl_paymentdetail(billid)
);

CREATE INDEX IF NOT EXISTS idx_egcl_bill_consumerCode ON egcl_bill(consumerCode);


CREATE TABLE egcl_billdetial(
        	id VARCHAR(256) NOT NULL,
		    tenantId VARCHAR(256) NOT NULL,
		    demandId VARCHAR(256) NOT NULL,
        	billId VARCHAR(256) NOT NULL,
        	amount numeric(12,2) NOT NULL,
        	amountPaid numeric(12,2) NOT NULL,
        	fromPeriod BIGINT NOT NULL,
        	toPeriod BIGINT NOT NULL,
        	additionalDetails JSONB,
        	channel VARCHAR(256),
        	voucherHeader VARCHAR(256),
        	boundary VARCHAR(256),
        	manualReceiptNumber VARCHAR(256),
        	manualReceiptDate BIGINT,
            collectionType VARCHAR(256),
        	billDescription VARCHAR(256),
        	expiryDate VARCHAR(256) NOT NULL,
        	displayMessage VARCHAR(2048),
        	callBackForApportioning VARCHAR(256),
        	cancellationRemarks VARCHAR(2048),


		CONSTRAINT pk_egcl_billdetail PRIMARY KEY (id),
        CONSTRAINT fk_egcl_billdetail FOREIGN KEY (billId) REFERENCES egcl_bill(id)
);



CREATE TABLE egcl_billAccountDetail (
    id VARCHAR(256) NOT NULL,
  	tenantId VARCHAR(256) NOT NULL,
  	billDetailid VARCHAR(256) NOT NULL,
	demandDetailId VARCHAR(256) NOT NULL,
  	"order" Integer NOT NULL,
  	amount numeric(12,2) NOT NULL,
  	isActualDemand Boolean,
  	taxHeadCode VARCHAR(256) NOT NULL,
	additionalDetails JSONB,

  	CONSTRAINT pk_egcl_payment_taxhead PRIMARY KEY (id),
    CONSTRAINT fk_egcl_payment_taxhead FOREIGN KEY (billDetailid) REFERENCES egcl_billdetial(id)

  	ON UPDATE CASCADE
	ON DELETE CASCADE
);


CREATE TABLE egcl_payment_audit (
  		id VARCHAR(256) NOT NULL,
      	tenantId VARCHAR(256) NOT NULL,
      	totalDue numeric(12,2) NOT NULL,
      	totalAmountPaid numeric(12,2) NOT NULL,
      	transactionNumber VARCHAR(256) NOT NULL,
      	transactionDate BIGINT NOT NULL,
      	paymentMode VARCHAR(64) NOT NULL,
      	instrumentDate BIGINT,
      	instrumentNumber VARCHAR(256),
        instrumentStatus VARCHAR(256) NOT NULL,
      	ifscCode VARCHAR(64),
      	additionalDetails JSONB,
      	paidBy VARCHAR(256) ,
      	mobileNumber VARCHAR(64) NOT NULL,
      	payerName VARCHAR(256) ,
      	payerAddress VARCHAR(1024),
      	payerEmail VARCHAR(256),
      	payerId VARCHAR(256) ,
      	paymentStatus VARCHAR(256) NOT NULL,
      	createdBy VARCHAR(256) NOT NULL,
      	createdTime BIGINT NOT NULL,
      	lastModifiedBy VARCHAR(256) NOT NULL,
      	lastModifiedTime BIGINT NOT NULL

);


CREATE TABLE egcl_paymentDetail_audit (
    id VARCHAR(256) NOT NULL,
      	tenantId VARCHAR(256) NOT NULL,
      	paymentid VARCHAR(256) NOT NULL,
      	due numeric(12,2) NOT NULL,
      	amountPaid numeric(12,2) NOT NULL,
      	receiptNumber VARCHAR(256) NOT NULL,
      	businessService VARCHAR(256) NOT NULL,
      	billId VARCHAR(256) NOT NULL,
    	additionalDetails JSONB,
    	createdBy VARCHAR(256) NOT NULL,
      	createdTime BIGINT NOT NULL,
      	lastModifiedBy VARCHAR(256) NOT NULL,
      	lastModifiedTime BIGINT NOT NULL
);


CREATE TABLE egcl_bill_audit(
        	id VARCHAR(256) NOT NULL,
            status VARCHAR(256) NOT NULL,
            isCancelled boolean,
            additionalDetails JSONB,
            tenantId VARCHAR(256) NOT NULL,
            collectionModesNotAllowed VARCHAR(256),
            partPaymentAllowed boolean,
            isAdvanceAllowed boolean,
            minimumAmountToBePaid numeric(12,2),
            businessService VARCHAR(256) NOT NULL,
            totalAmount numeric(12,2) NOT NULL,
            consumerCode VARCHAR(256) NOT NULL,
            billNumber VARCHAR(256) NOT NULL,
            billDate BIGINT NOT NULL,
            reasonForCancellation VARCHAR(2048),
            createdBy VARCHAR(256) NOT NULL,
            createdTime BIGINT NOT NULL,
            lastModifiedBy VARCHAR(256) NOT NULL,
            lastModifiedTime BIGINT NOT NULL
);


CREATE TABLE egcl_billdetial_audit(
        	id VARCHAR(256) NOT NULL,
            tenantId VARCHAR(256) NOT NULL,
            demandId VARCHAR(256) NOT NULL,
            billId VARCHAR(256) NOT NULL,
            amount numeric(12,2) NOT NULL,
            amountPaid numeric(12,2) NOT NULL,
            fromPeriod BIGINT NOT NULL,
            toPeriod BIGINT NOT NULL,
            additionalDetails JSONB,
            receiptDate BIGINT NOT NULL,
            receiptType VARCHAR(256) NOT NULL,
            channel VARCHAR(256),
            voucherHeader VARCHAR(256),
            boundary VARCHAR(256),
            manualReceiptNumber VARCHAR(256),
            manualReceiptDate BIGINT,
            collectionType VARCHAR(256),
            billDescription VARCHAR(256),
            expiryDate VARCHAR(256) NOT NULL,
            displayMessage VARCHAR(2048),
            callBackForApportioning VARCHAR(256),
            cancellationRemarks VARCHAR(2048)
);


ALTER TABLE egcl_paymentDetail ADD COLUMN manualreceiptnumber varchar(256);
ALTER TABLE egcl_paymentDetail_audit ADD COLUMN manualreceiptnumber varchar(256);

ALTER TABLE egcl_billdetial DROP COLUMN manualReceiptNumber;
ALTER TABLE egcl_billdetial_audit DROP COLUMN manualReceiptNumber;

ALTER TABLE egcl_paymentDetail ADD COLUMN manualreceiptdate BIGINT;
ALTER TABLE egcl_paymentDetail_audit ADD COLUMN manualreceiptdate BIGINT;

ALTER TABLE egcl_billdetial DROP COLUMN manualReceiptDate;
ALTER TABLE egcl_billdetial_audit DROP COLUMN manualReceiptDate;

ALTER TABLE egcl_billAccountDetail ADD COLUMN adjustedamount numeric(12,2);
ALTER TABLE egcl_paymentDetail_audit ADD COLUMN receiptdate BIGINT;
ALTER TABLE egcl_paymentDetail_audit ADD COLUMN receipttype character varying(256);

ALTER TABLE egcl_payment ALTER COLUMN mobileNumber DROP NOT NULL;
ALTER TABLE egcl_payment_audit ALTER COLUMN mobileNumber DROP NOT NULL;

ALTER TABLE egcl_payment ADD COLUMN filestoreid VARCHAR(1024);

ALTER TABLE egcl_payment_audit ADD COLUMN filestoreid VARCHAR(1024);

CREATE index if not exists idx_egcl_billaccountdetail_billdetailid ON egcl_billaccountdetail USING btree (billdetailid);
CREATE index if not exists idx_egcl_billdetial_billdetail_billid ON egcl_billdetial USING btree (billid);
CREATE index if not exists idx_egcl_paymentdetail_paymentid ON egcl_paymentdetail USING btree (paymentid);

CREATE INDEX IF NOT EXISTS idx_egcl_payment_paymentstatus ON public.egcl_payment USING btree (paymentstatus);
CREATE INDEX IF NOT EXISTS idx_egcl_payment_tenant_id_paymentstatus ON public.egcl_payment USING btree (tenantid, id, paymentstatus);