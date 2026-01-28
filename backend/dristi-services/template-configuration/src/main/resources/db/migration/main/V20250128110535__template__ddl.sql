CREATE TABLE dristi_template_configuration (
                              id varchar(64) NOT NULL PRIMARY KEY,
                              tenant_id varchar(64) NOT NULL,
                              court_id varchar(64) NULL,
                              filing_number varchar(64) NULL,
                              process_title varchar(255),
                              is_cover_letter_required boolean DEFAULT false,
                              addressee text,
                              order_text text,
                              cover_letter_text text,
                              created_by varchar(64) NULL,
                              last_modified_by varchar(64) NULL,
                              created_time int8 NULL,
                              last_modified_time int8 NULL,
                              is_active boolean DEFAULT true
);