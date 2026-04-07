ALTER TABLE dristi_orders
ADD COLUMN courtId VARCHAR(64);

CREATE INDEX idx_dristi_orders_courtid ON dristi_orders(courtId);

UPDATE dristi_orders
SET courtId = 'KLKM52'
WHERE courtId IS NULL;