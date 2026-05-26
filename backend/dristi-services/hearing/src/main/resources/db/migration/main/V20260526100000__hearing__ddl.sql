CREATE INDEX IF NOT EXISTS idx_dristi_hearing_filingnumber_0
    ON dristi_hearing ((filingNumber->>0));
