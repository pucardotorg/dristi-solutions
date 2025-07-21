-- Table: dristi_bail
CREATE TABLE dristi_bail (
    id varchar(36) NOT NULL PRIMARY KEY,
    tenant_id varchar(64) NOT NULL,
    case_id varchar(36), -- FK to dristi_case
    bail_type varchar(64),
    bail_amount numeric(15,2),
    bail_status varchar(64),
    court_id varchar(64), -- Establishment ID for the court
    case_title varchar(512), -- Title of the case
    case_number varchar(64), -- Case number
    cnr_number varchar(64), -- CNR number of the case
    filing_number varchar(64), -- Filing number of the case
    case_type varchar(16), -- Type of the case (ST, CMP)
    litigant_id varchar(36), -- Identifier for the litigant
    litigant_name varchar(256), -- Name of the litigant
    litigant_father_name varchar(256), -- Father name of the litigant
    litigant_signed boolean, -- Whether the litigant has signed the bail
    litigant_mobile_number varchar(256), -- Mobile number of the litigant
    shortened_url varchar(512), -- Shortened URL for the bail bond
    bail_id varchar(64), -- Id gen formatted bail id
    additional_details jsonb,
    is_active bool DEFAULT TRUE,
    created_by varchar(36),
    last_modified_by varchar(36),
    created_time int8,
    last_modified_time int8,
    CONSTRAINT fk_bail_case FOREIGN KEY(case_id) REFERENCES dristi_case(id)
);
CREATE INDEX idx_dristi_bail_case_id ON dristi_bail(case_id);
CREATE INDEX idx_dristi_bail_tenant_id ON dristi_bail(tenant_id);

-- Table: dristi_surety
CREATE TABLE dristi_surety (
    id varchar(36) NOT NULL PRIMARY KEY,
    tenant_id varchar(64) NOT NULL,
    bail_id varchar(36) NOT NULL, -- FK to dristi_bail
    case_id varchar(36), -- FK to dristi_case
    surety_name varchar(256),
    surety_father_name varchar(256),
    surety_signed boolean,
    surety_mobile_number varchar(256),
    surety_email varchar(256),
    surety_approved boolean,
    surety_address jsonb,
    additional_details jsonb,
    is_active bool DEFAULT TRUE,
    created_by varchar(36),
    last_modified_by varchar(36),
    created_time int8,
    last_modified_time int8,
    CONSTRAINT fk_surety_bail FOREIGN KEY(bail_id) REFERENCES dristi_bail(id)
);
CREATE INDEX idx_dristi_surety_bail_id ON dristi_surety(bail_id);
CREATE INDEX idx_dristi_surety_tenant_id ON dristi_surety(tenant_id);

-- Table: dristi_bail_document
CREATE TABLE dristi_bail_document (
    id varchar(36) NOT NULL PRIMARY KEY,
    tenant_id varchar(64) NOT NULL,
    bail_id varchar(36) NOT NULL, -- FK to dristi_bail
    filestore_id varchar(64),
    document_uid varchar(64),
    document_name varchar(128),
    document_type varchar(64),
    additional_details jsonb,
    is_active bool DEFAULT TRUE,
    created_by varchar(36),
    last_modified_by varchar(36),
    created_time int8,
    last_modified_time int8,
    CONSTRAINT fk_bail_document_bail FOREIGN KEY(bail_id) REFERENCES dristi_bail(id)
);
CREATE INDEX idx_dristi_bail_document_bail_id ON dristi_bail_document(bail_id);
CREATE INDEX idx_dristi_bail_document_tenant_id ON dristi_bail_document(tenant_id);

-- Table: dristi_surety_document
CREATE TABLE dristi_surety_document (
    id varchar(36) NOT NULL PRIMARY KEY,
    tenant_id varchar(64) NOT NULL,
    surety_id varchar(36) NOT NULL, -- FK to dristi_surety
    filestore_id varchar(64),
    document_uid varchar(64),
    document_name varchar(128),
    document_type varchar(64),
    additional_details jsonb,
    is_active bool DEFAULT TRUE,
    created_by varchar(36),
    last_modified_by varchar(36),
    created_time int8,
    last_modified_time int8,
    CONSTRAINT fk_surety_document_surety FOREIGN KEY(surety_id) REFERENCES dristi_surety(id)
);
CREATE INDEX idx_dristi_surety_document_surety_id ON dristi_surety_document(surety_id);
CREATE INDEX idx_dristi_surety_document_tenant_id ON dristi_surety_document(tenant_id);
