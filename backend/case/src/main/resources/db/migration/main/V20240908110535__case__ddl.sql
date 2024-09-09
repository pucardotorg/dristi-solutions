CREATE TABLE dristi_cnr_master (
    id varchar(36) NOT NULL PRIMARY KEY,
    tenant_id varchar(64) NOT NULL,
    court_id varchar(64),
    cnr_seq_num integer DEFAULT 1,
    created_by varchar(64) NOT NULL,
    last_modified_by varchar(64), -- NOT NULL,
    created_time int8 NOT NULL,
    last_modified_time int8 NULL
  --  CONSTRAINT fk_cnr_master_case
    --    FOREIGN KEY(court_id)
      --  REFERENCES dristi_cases(courtId)
);
CREATE INDEX idx_dristi_cnr_master_court_id ON dristi_cnr_master(tenant_id, court_id);

-- Holds the sequence numbers for different types of numbers used in a Case
CREATE TABLE dristi_case_numbering(
    id varchar(36) NOT NULL PRIMARY KEY,
    case_id varchar(36) NOT NULL,
    tenant_id varchar(64) NOT NULL,
    cnr_number varchar(32) NOT NULL,
    seq_num_lable varchar(64) NOT NULL,
    case_seq_num integer DEFAULT 1,
    created_by varchar(64) NOT NULL,
    last_modified_by varchar(64) NOT NULL,
    created_time int8 NULL,
    last_modified_time int8 NULL
   -- CONSTRAINT fk_case_numbering_case
     --   FOREIGN KEY(case_id)
       -- REFERENCES dristi_cases(id)
        --REFERENCES dristi_cases(cnrNumber)
        );