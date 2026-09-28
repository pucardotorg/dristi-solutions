-- Align eg_user_audit_table.name with eg_user.name (varchar(250)).
-- eg_user.name was extended to 250 in V20190313165702, but the audit table
-- (created in V20211029155746) kept name at varchar(100), causing
-- "value too long for type character varying(100)" on audit inserts for long names.
ALTER TABLE eg_user_audit_table ALTER COLUMN name TYPE character varying(250);
