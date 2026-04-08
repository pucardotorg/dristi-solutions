CREATE TABLE uuid_vcid_mapper (
    uuid character varying(64),
    vcid character varying(64),
    createdBy character varying(64),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uuid_vcid_mapper_pkey PRIMARY KEY (uuid)
);

CREATE TABLE entity_id_vcid_mapper (
    entityid character varying(64),
    vcid character varying(64),
    createdBy character varying(128),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT entity_id_vcid_mapper_pkey PRIMARY KEY (entityid)
);