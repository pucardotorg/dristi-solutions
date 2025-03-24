-- Table to store advocate-clerk associations and access permissions
CREATE TABLE dristi_advocate_clerk_association (
    id uuid NOT NULL,
    tenant_id varchar(64) NOT NULL,
    advocate_id uuid NOT NULL,
    clerk_id uuid NOT NULL,
    access_type varchar(16) NOT NULL, -- -- Master data IDs 'ALL' or 'SPECIFIC'
    is_active boolean DEFAULT true,
    additional_details jsonb,
    -- Audit details
    created_by varchar(36) NOT NULL,
    last_modified_by varchar(36) NOT NULL,
    created_time int8 NOT NULL,
    last_modified_time int8 NOT NULL,

    CONSTRAINT pk_dristi_advocate_clerk_association PRIMARY KEY (id),
    CONSTRAINT fk_dristi_advocate_clerk_association_advocate
        FOREIGN KEY (advocate_id)
        REFERENCES dristi_advocate(id),
    CONSTRAINT fk_dristi_advocate_clerk_association_clerk
        FOREIGN KEY (clerk_id)
        REFERENCES dristi_advocate_clerk(id),
);

-- Indexes for efficient querying
CREATE INDEX idx_dristi_advocate_clerk_association_tenant
    ON dristi_advocate_clerk_association(tenant_id);

CREATE INDEX idx_dristi_advocate_clerk_association_advocate
    ON dristi_advocate_clerk_association(tenant_id, advocate_id)
    WHERE is_active = true;
