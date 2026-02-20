ALTER TABLE dristi_cases
ADD COLUMN witnessDetails jsonb NOT NULL DEFAULT '[]'::jsonb;
