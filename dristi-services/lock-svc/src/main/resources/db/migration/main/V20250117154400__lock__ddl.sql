CREATE TABLE lock (
    id                VARCHAR(64) PRIMARY KEY,
    tenantId          VARCHAR(64),
    lockDate          BIGINT,
    individualId      VARCHAR(64),
    isLocked          BOOLEAN,
    lockReleaseTime   BIGINT,
    uniqueId          VARCHAR(64),
    createdBy         VARCHAR(64) NULL,
    lastModifiedBy    VARCHAR(64) NULL,
    createdTime       int8 NULL,
    lastModifiedTime  int8 NULL
);

CREATE INDEX idx_unique_tenant ON lock (uniqueId, tenantId);

ALTER TABLE lock
ADD COLUMN locktype varchar(64);

ALTER TABLE lock
ADD COLUMN entity varchar(64),
ADD COLUMN userId varchar(64),
ADD CONSTRAINT unique_key_tenantid_constraint UNIQUE (tenantId, uniqueId);
