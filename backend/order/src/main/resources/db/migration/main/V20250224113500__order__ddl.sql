ALTER TABLE dristi_orders ADD COLUMN IF NOT EXISTS orderTitle VARCHAR(1000) NULL;
UPDATE dristi_orders SET orderTitle = orderType;