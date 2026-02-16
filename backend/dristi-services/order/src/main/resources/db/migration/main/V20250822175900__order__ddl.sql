ALTER TABLE dristi_orders
ADD COLUMN attendance jsonb NULL;

ALTER TABLE dristi_orders
ADD COLUMN itemText VARCHAR(1000);

ALTER TABLE dristi_orders
ADD COLUMN purposeOfNextHearing VARCHAR(100);

ALTER TABLE dristi_orders
ADD COLUMN nextHearingDate int8 NULL;

