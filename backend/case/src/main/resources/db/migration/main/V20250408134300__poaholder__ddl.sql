CREATE TABLE dristi_case_poaholders (
    id VARCHAR(128) PRIMARY KEY,
    tenant_id VARCHAR(128) NOT NULL,
    case_id VARCHAR(128) NOT NULL,
    individual_id VARCHAR(128),
    poa_type VARCHAR(128) NOT NULL,
    name VARCHAR(256),
    is_active BOOLEAN ,
    additional_details JSONB,
    hasSigned BOOLEAN NULL,
    litigant_individual_ids JSONB,
    created_by VARCHAR(128),
    last_modified_by VARCHAR(128),
    created_time BIGINT,
    last_modified_time BIGINT
);



CREATE TABLE dristi_case_representing_litigants (
    id VARCHAR(128) PRIMARY KEY,
    tenant_id VARCHAR(128),
    case_id VARCHAR(128),
    party_category VARCHAR(128),
    organisation_id VARCHAR(128),
    individual_id VARCHAR(128),
    party_type VARCHAR(128),
    is_active BOOLEAN DEFAULT TRUE,
    is_response_required BOOLEAN DEFAULT FALSE,
    is_party_in_person BOOLEAN DEFAULT FALSE,
    has_signed BOOLEAN DEFAULT FALSE,
    additional_details JSONB,
    created_by VARCHAR(128),
    last_modified_by VARCHAR(128),
    created_time BIGINT,
    last_modified_time BIGINT
);




-- Create composite indexes for better query performance
CREATE INDEX idx_poaholders_tenant_case ON dristi_case_poaholders(tenant_id, case_id);
CREATE INDEX idx_poaholders_individual_tenant ON dristi_case_poaholders(individual_id, tenant_id) WHERE individual_id IS NOT NULL;
