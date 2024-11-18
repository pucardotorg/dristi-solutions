
CREATE TABLE IF NOT EXISTS case_bundle_tracker(
  id character varying(64) PRIMARY KEY,
  startTime bigint,
  endTime  bigint,
  pageCount  bigint,
  errorLog   character varying(64),
  createdBy character varying(64),
  lastModifiedBy character varying(64),
  createdTime bigint,
  lastModifiedTime bigint
);

