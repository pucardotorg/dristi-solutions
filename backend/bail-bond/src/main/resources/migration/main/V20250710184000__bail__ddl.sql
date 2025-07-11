CREATE TABLE dristi_bail (
                             id VARCHAR(255) PRIMARY KEY,
                             tenant_id VARCHAR(255) NOT NULL,
                             case_id VARCHAR(255) NOT NULL,
                             bail_amount DOUBLE PRECISION,
                             bail_type VARCHAR(20) CHECK (bail_type IN ('Personal', 'Surety')),
                             start_date BIGINT,
                             end_date BIGINT,
                             is_active BOOLEAN,
                             litigant_id VARCHAR(255),
                             litigant_name VARCHAR(255),
                             litigant_father_name VARCHAR(255),
                             litigant_signed BOOLEAN,
                             shortened_url VARCHAR(500),
                             additional_details JSONB,
                             court_id VARCHAR(255),
                             case_title VARCHAR(500),
                             cnr_number VARCHAR(255),
                             filing_number VARCHAR(255),
                             case_type VARCHAR(10) CHECK (case_type IN ('ST', 'CMP')),
                             bail_id VARCHAR(255),
                             audit_details JSONB,
                             workflow JSONB
);


CREATE TABLE dristi_surety (
                               id VARCHAR(255) PRIMARY KEY,
                               tenant_id VARCHAR(255) NOT NULL,
                               bail_id VARCHAR(255) NOT NULL,
                               name VARCHAR(255) NOT NULL,
                               father_name VARCHAR(255),
                               mobile_number VARCHAR(20) NOT NULL,
                               address JSONB,
                               email VARCHAR(255),
                               has_signed BOOLEAN,
                               is_approved BOOLEAN,
                               is_active BOOLEAN,
                               additional_details JSONB,

                               CONSTRAINT fk_bail FOREIGN KEY (bail_id) REFERENCES dristi_bail(id)
);

CREATE TABLE dristi_bail_document (
                                      id VARCHAR(64) NOT NULL PRIMARY KEY,
                                      file_store VARCHAR(64),
                                      document_uid VARCHAR(64),
                                      document_yype VARCHAR(64),
                                      bail_id VARCHAR(64) NOT NULL,
                                      additional_details JSONB,

                                      CONSTRAINT fk_bail FOREIGN KEY (bail_id) REFERENCES dristi_bail(id)
);

