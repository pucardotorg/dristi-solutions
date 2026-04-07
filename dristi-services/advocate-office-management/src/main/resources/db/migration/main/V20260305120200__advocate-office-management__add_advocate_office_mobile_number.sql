-- Add advocate office mobile number column to store the advocate office contact number
ALTER TABLE dristi_advocate_office_member ADD COLUMN IF NOT EXISTS advocate_office_mobile_number VARCHAR(256);
