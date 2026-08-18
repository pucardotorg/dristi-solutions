-- Add advocate_filing_status column to dristi_case_representatives table
ALTER TABLE dristi_case_representatives 
ADD COLUMN advocate_filing_status varchar(64) NULL;
