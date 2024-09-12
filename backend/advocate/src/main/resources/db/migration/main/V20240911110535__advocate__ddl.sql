-- Holds the sequence numbers for advocate and clerk application number
CREATE TABLE dristi_advocate_numbering(
    id varchar(36) NOT NULL PRIMARY KEY,
    advocate_id varchar(36) NOT NULL,
    tenant_id varchar(64) NOT NULL,
    seq_num_lable varchar(64) NOT NULL,
    advocate_seq_num integer DEFAULT 1,
    created_by varchar(64) NOT NULL,
    last_modified_by varchar(64) NULL,
    created_time int8 NOT NULL,
    last_modified_time int8 NULL
    );