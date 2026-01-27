CREATE TABLE dristi_advocate_office_case_member (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    office_advocate_id VARCHAR(64) NOT NULL,
    case_id VARCHAR(64) NOT NULL,
    member_id VARCHAR(64) NOT NULL,
    member_type VARCHAR(64) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(64),
    last_modified_by VARCHAR(64),
    created_time int8,
    last_modified_time int8
);

CREATE INDEX idx_advocate_office_case_member_office_id ON dristi_advocate_office_case_member(office_advocate_id);
CREATE INDEX idx_advocate_office_case_member_case_id ON dristi_advocate_office_case_member(case_id);
CREATE INDEX idx_advocate_office_case_member_member_id ON dristi_advocate_office_case_member(member_id);
CREATE INDEX idx_advocate_office_case_member_is_active ON dristi_advocate_office_case_member(is_active);
CREATE UNIQUE INDEX idx_advocate_office_case_member_unique ON dristi_advocate_office_case_member(office_advocate_id, case_id, member_id);
