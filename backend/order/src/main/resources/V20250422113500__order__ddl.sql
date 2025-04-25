ALTER TABLE dristi_orders
ADD COLUMN courtId VARCHAR(64);

UPDATE dristi_orders
SET courtId = 'KLKM52'
WHERE courtId IS NULL;
