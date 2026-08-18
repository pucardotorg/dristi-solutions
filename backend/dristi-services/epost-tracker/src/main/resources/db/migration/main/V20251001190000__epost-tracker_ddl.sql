ALTER TABLE dristi_epost_tracker
DROP COLUMN IF EXISTS booking_date,
DROP COLUMN IF EXISTS received_date;

ALTER TABLE dristi_epost_tracker 
ADD COLUMN booking_date int8,
ADD COLUMN received_date int8;