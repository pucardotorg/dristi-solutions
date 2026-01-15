CREATE TABLE dristi_task_management (
    id varchar(64) NOT NULL PRIMARY KEY,
    task_management_number VARCHAR(64),
    filing_number VARCHAR(64),
    court_id VARCHAR(64),
    order_number VARCHAR(64),
    order_item_id VARCHAR(64),
    task_type VARCHAR(64),
    status VARCHAR(64),
    party_details JSONB,
    additional_details JSONB,
    tenant_id VARCHAR(64),
    created_by VARCHAR(64),
    last_modified_by VARCHAR(64),
    created_time int8,
    last_modified_time int8
);