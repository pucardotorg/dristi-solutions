-> Add master data for all order types in purpose of listing table
-> Add extra column order_id in case_hearings table
-> Remove hearing topics
-> change all cases with ALLOWED disposal reason to ACQUITTED in interim db

-> INSERT INTO purpose_code (purpose_code, purpose_name, court_purpose_code, id) values (53,'ABATE_CASE','ABATE_CASE', 57)
-> INSERT INTO purpose_code (purpose_code, purpose_name, court_purpose_code, id) values (54, 'SCHEDULING_NEXT_HEARING', 'SCHEDULING_NEXT_HEARING', 58)