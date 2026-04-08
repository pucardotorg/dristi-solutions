-- Sample entity table for testing UUID v7
CREATE TABLE IF NOT EXISTS eg_sample_entity (
    id UUID PRIMARY KEY,
    test_uuid UUID
);

CREATE INDEX IF NOT EXISTS idx_eg_sample_entity_id ON eg_sample_entity(id);
