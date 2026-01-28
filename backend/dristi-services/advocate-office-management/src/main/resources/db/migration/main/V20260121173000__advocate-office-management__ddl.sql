CREATE TABLE dristi_advocate_office_member (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    office_advocate_id VARCHAR(64) NOT NULL,
    member_type VARCHAR(64) NOT NULL,
    member_id VARCHAR(64) NOT NULL,
    member_name VARCHAR(256),
    member_mobile_number VARCHAR(256),
    access_type VARCHAR(64) DEFAULT 'ALL_CASES',
    allow_case_create BOOLEAN DEFAULT TRUE,
    add_new_cases_automatically BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(64),
    last_modified_by VARCHAR(64),
    created_time int8,
    last_modified_time int8
);

CREATE INDEX idx_advocate_office_member_office_id ON dristi_advocate_office_member(office_advocate_id);
CREATE INDEX idx_advocate_office_member_member_id ON dristi_advocate_office_member(member_id);
CREATE INDEX idx_advocate_office_member_is_active ON dristi_advocate_office_member(is_active);
CREATE UNIQUE INDEX idx_advocate_office_member_unique ON dristi_advocate_office_member(office_advocate_id, member_id);
