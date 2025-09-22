-- Add courtid column to eg_userrole_v1 table for court-based role filtering
ALTER TABLE eg_userrole_v1 ADD COLUMN courtid character varying(256) DEFAULT NULL;
