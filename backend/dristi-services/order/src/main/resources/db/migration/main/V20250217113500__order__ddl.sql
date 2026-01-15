ALTER TABLE dristi_orders
ADD COLUMN orderTitle VARCHAR(1000) NULL;

ALTER TABLE dristi_orders
ADD COLUMN compositeItems JSONB NULL;