-- Rename case_bundle_nodes to selected_case_bundle
ALTER TABLE dristi_ctc_applications RENAME COLUMN case_bundle_nodes TO selected_case_bundle;

-- Add new case_bundles column
ALTER TABLE dristi_ctc_applications ADD COLUMN IF NOT EXISTS case_bundles jsonb;
