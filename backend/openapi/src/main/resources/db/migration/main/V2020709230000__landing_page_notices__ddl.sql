CREATE TABLE landing_page_notice (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(100) NOT NULL,
    type VARCHAR(100),
    title VARCHAR(255) NOT NULL,
    language VARCHAR(50),
    valid_till int8,
    file_store_id VARCHAR(255),
    notice_number VARCHAR(100),
    published_date int8 NOT NULL,
    created_by VARCHAR(100),
    created_time int8,
    last_modified_by VARCHAR(100),
    last_modified_time int8
);
