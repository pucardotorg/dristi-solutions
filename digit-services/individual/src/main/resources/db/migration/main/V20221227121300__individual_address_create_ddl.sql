CREATE TABLE IF NOT EXISTS ADDRESS
(
    id                character varying(64),
    tenantId          character varying(1000),
    doorNo            character varying(64),
    latitude          double precision,
    longitude         double precision,
    locationAccuracy  int,
    type              character varying(64),
    addressLine1      character varying(256),
    addressLine2      character varying(256),
    landmark          character varying(256),
    city              character varying(256),
    pincode           character varying(64),
    buildingName      character varying(256),
    street            character varying(256),
    localityCode      character varying(256),
    CONSTRAINT uk_address_id PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS INDIVIDUAL
(
    id                character varying(64),
    userId            character varying(64),
    clientReferenceId character varying(64),
    tenantId          character varying(1000),
    givenName         character varying(200),
    familyName        character varying(200),
    otherNames        character varying(200),
    dateOfBirth       date,
    gender            character varying(10),
    bloodGroup        character varying(10),
    mobileNumber      character varying(20),
    altContactNumber  character varying(20),
    email             character varying(200),
    fatherName        character varying(100),
    husbandName       character varying(100),
    photo             text,
    additionalDetails jsonb,
    createdBy         character varying(64),
    lastModifiedBy    character varying(64),
    createdTime       bigint,
    lastModifiedTime  bigint,
    rowVersion        bigint,
    isDeleted         boolean,
    CONSTRAINT uk_individual_id PRIMARY KEY (id),
    CONSTRAINT uk_individual_client_reference_id UNIQUE (clientReferenceId)
);

CREATE TABLE IF NOT EXISTS INDIVIDUAL_ADDRESS
(
    individualId     character varying(64),
    addressId        character varying(64),
    type             character varying(64),
    createdBy        character varying(64),
    lastModifiedBy   character varying(64),
    createdTime      bigint,
    lastModifiedTime bigint,
    rowVersion       bigint,
    isDeleted        boolean
);

CREATE TABLE IF NOT EXISTS INDIVIDUAL_IDENTIFIER
(
    id               character varying(64),
    individualId     character varying(64),
    identifierType   character varying(64),
    identifierId     character varying(64),
    createdBy        character varying(64),
    lastModifiedBy   character varying(64),
    createdTime      bigint,
    lastModifiedTime bigint,
    rowVersion       bigint,
    isDeleted        boolean,
    CONSTRAINT uk_individual_identifier_id PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS HOUSEHOLD_INDIVIDUAL
(
    individualId                character varying(64),
    individualClientReferenceId character varying(64),
    householdId                 character varying(64),
    householdClientReferenceId  character varying(64),
    isHeadOfHousehold           boolean,
    createdBy                   character varying(64),
    lastModifiedBy              character varying(64),
    createdTime                 bigint,
    lastModifiedTime            bigint,
    rowVersion                  bigint,
    isDeleted                   boolean
);

ALTER TABLE INDIVIDUAL_ADDRESS
ADD CONSTRAINT uk_individual_address_mapping UNIQUE(individualId, addressId);

ALTER TABLE INDIVIDUAL_IDENTIFIER DROP COLUMN IF EXISTS id;
ALTER TABLE INDIVIDUAL_IDENTIFIER DROP CONSTRAINT IF EXISTS uk_individual_identifier_mapping;
ALTER TABLE INDIVIDUAL_IDENTIFIER
    ADD CONSTRAINT uk_individual_identifier_mapping UNIQUE(individualId, identifierType);

    ALTER TABLE INDIVIDUAL_ADDRESS DROP rowVersion;
ALTER TABLE INDIVIDUAL_IDENTIFIER DROP rowVersion;

TRUNCATE TABLE  INDIVIDUAL_IDENTIFIER;
ALTER TABLE INDIVIDUAL_IDENTIFIER ADD COLUMN id character varying(64) PRIMARY KEY;

ALTER TABLE INDIVIDUAL_IDENTIFIER DROP CONSTRAINT IF EXISTS uk_individual_identifier_mapping;
ALTER TABLE INDIVIDUAL_ADDRESS DROP CONSTRAINT IF EXISTS uk_individual_address_mapping;
ALTER TABLE INDIVIDUAL_IDENTIFIER
    ADD CONSTRAINT uk_individual_identifier_mapping UNIQUE(individualId, identifierType, isdeleted);
ALTER TABLE INDIVIDUAL_ADDRESS ADD CONSTRAINT uk_individual_address_mapping UNIQUE(individualId, addressId, type, isdeleted);

CREATE TABLE IF NOT EXISTS INDIVIDUAL_SKILL
(
    id               character varying(64),
    individualId     character varying(64),
    type             character varying(64),
    level            character varying(64),
    experience       character varying(64),
    createdBy        character varying(64),
    lastModifiedBy   character varying(64),
    createdTime      bigint,
    lastModifiedTime bigint,
    isDeleted        boolean,
    CONSTRAINT uk_individual_skill_id PRIMARY KEY (id)
);

ALTER TABLE INDIVIDUAL_IDENTIFIER ADD COLUMN clientReferenceId character varying(64) UNIQUE;
ALTER TABLE ADDRESS ADD COLUMN IF NOT EXISTS clientReferenceId character varying(64) UNIQUE;
ALTER TABLE INDIVIDUAL_SKILL ADD COLUMN clientReferenceId character varying(64) UNIQUE;

ALTER TABLE INDIVIDUAL ADD COLUMN individualId character varying(64) UNIQUE;
ALTER TABLE INDIVIDUAL ADD COLUMN relationship character varying(100);

ALTER TABLE ADDRESS ADD COLUMN wardCode character varying(256);

ALTER TABLE INDIVIDUAL ALTER COLUMN mobileNumber TYPE character varying(256);
ALTER TABLE INDIVIDUAL_IDENTIFIER ALTER COLUMN identifierId TYPE character varying(256);

CREATE INDEX IF NOT EXISTS idx_individual_clientReferenceId ON INDIVIDUAL (clientReferenceId);
CREATE INDEX IF NOT EXISTS idx_individual_givenName ON INDIVIDUAL (givenName);
CREATE INDEX IF NOT EXISTS idx_individual_familyName ON INDIVIDUAL (familyName);
CREATE INDEX IF NOT EXISTS idx_individual_otherNames ON INDIVIDUAL (otherNames);
CREATE INDEX IF NOT EXISTS idx_individual_dateOfBirth ON INDIVIDUAL (dateOfBirth);
CREATE INDEX IF NOT EXISTS idx_individual_gender ON INDIVIDUAL (gender);

CREATE INDEX IF NOT EXISTS idx_localityCode ON ADDRESS (localityCode);

CREATE INDEX IF NOT EXISTS idx_individual_identifier_individualId ON INDIVIDUAL_IDENTIFIER (individualId);
CREATE INDEX IF NOT EXISTS idx_individual_identifier_identifierType ON INDIVIDUAL_IDENTIFIER (identifierType);
CREATE INDEX IF NOT EXISTS idx_individual_identifier_identifierId ON INDIVIDUAL_IDENTIFIER (identifierId);
CREATE INDEX IF NOT EXISTS idx_individual_identifier_isDeleted ON INDIVIDUAL_IDENTIFIER (isDeleted);
CREATE INDEX IF NOT EXISTS idx_individual_identifier_createdBy ON INDIVIDUAL_IDENTIFIER (createdBy);
CREATE INDEX IF NOT EXISTS idx_individual_identifier_lastModifiedBy ON INDIVIDUAL_IDENTIFIER (lastModifiedBy);
CREATE INDEX IF NOT EXISTS idx_individual_identifier_createdTime ON INDIVIDUAL_IDENTIFIER (createdTime);
CREATE INDEX IF NOT EXISTS idx_individual_identifier_lastModifiedTime ON INDIVIDUAL_IDENTIFIER (lastModifiedTime);
-- Because of encryption/decryption change
TRUNCATE TABLE individual, individual_identifier, individual_skill, individual_address;
ALTER TABLE INDIVIDUAL ADD COLUMN isSystemUser boolean;

ALTER TABLE INDIVIDUAL ADD COLUMN username character varying(64);
ALTER TABLE INDIVIDUAL ADD COLUMN password character varying(200);
ALTER TABLE INDIVIDUAL ADD COLUMN type character varying(64);
ALTER TABLE INDIVIDUAL ADD COLUMN roles jsonb;
ALTER TABLE INDIVIDUAL ALTER COLUMN gender TYPE character varying(20);
ALTER TABLE INDIVIDUAL ADD COLUMN userUuid character varying(64);
ALTER TABLE INDIVIDUAL ADD COLUMN isSystemUserActive boolean;
ALTER TABLE INDIVIDUAL ADD COLUMN clientCreatedTime bigint;
ALTER TABLE INDIVIDUAL ADD COLUMN clientLastModifiedTime bigint;

ALTER TABLE INDIVIDUAL ADD COLUMN IF NOT EXISTS clientCreatedBy character varying(64);
ALTER TABLE INDIVIDUAL ADD COLUMN IF NOT EXISTS clientLastModifiedBy character varying(64);
