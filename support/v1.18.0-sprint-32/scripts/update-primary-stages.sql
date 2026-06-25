-- =====================================================
-- Migration Script: Update Primary Stages for All Existing Cases
-- =====================================================

BEGIN;

-- =============================================================================
-- Step 1: Set stage based on case workflow status
-- Handles: Filing, Defect Correction, Scrutiny, Registration, Cognizance, Post-Disposal
-- =============================================================================
UPDATE dristi_cases
SET stage = CASE
    -- Defect Correction: cases sent back for correction
    WHEN status IN ('CASE_REASSIGNED','PENDING_RE_E-SIGN','RE_PENDING_PAYMENT','PENDING_RE_SIGN') THEN 'Defect Correction'

    -- Scrutiny: cases currently with scrutiny officer
    WHEN status IN ('UNDER_SCRUTINY') THEN 'Scrutiny'

    -- Registration: forwarded to judge by scrutiny officer but not yet registered
    WHEN status IN ('PENDING_REGISTRATION') THEN 'Registration'

    -- Cognizance: registered cases (default; may be overridden by hearing-based stages below)
    WHEN status IN ('PENDING_RESPONSE','PENDING_ADMISSION','CASE_ADMITTED') THEN 'Cognizance'

    WHEN status IN  ('DRAFT_IN_PROGRESS', 'PENDING_SIGN', 'PENDING_E-SIGN', 'PENDING_PAYMENT') THEN 'Filing'

    WHEN status IN  ('CASE_DISMISSED') THEN 'Post-Disposal'
END;

-- =============================================================================
-- Step 2: Appearance stage
-- Applies to cases currently in 'Cognizance'. Any ONE of:
--   a) Summons order published AND no accused-side litigant has joined
--   b) Cognizance order (TAKE_COGNIZANCE) has been published
--   c) Hearing scheduled with purpose APPEARANCE AND no accused-side litigant joined
-- =============================================================================
UPDATE dristi_cases dc
SET stage = 'Appearance'
WHERE dc.stage = 'Cognizance'
  AND (
    -- (a) Summons workflow initiated AND no accused joined
    (
      EXISTS (
        SELECT 1 FROM dristi_orders o
        WHERE o.filingNumber = dc.filingNumber
          AND o.status ILIKE 'published'
          AND (
            o.orderType = 'SUMMONS'
            OR (o.orderCategory = 'COMPOSITE' AND EXISTS (SELECT 1 FROM jsonb_array_elements(o.compositeItems) elem WHERE elem->>'orderType' = 'SUMMONS'))
          )
      )
      AND NOT EXISTS (
        SELECT 1 FROM dristi_case_litigants l
        WHERE l.case_id = dc.id
          AND l.partyType ILIKE '%respondent%'
          AND l.isActive = true
      )
    )
    OR
    -- (b) Cognizance is taken
    EXISTS (
      SELECT 1 FROM dristi_orders o
      WHERE o.filingNumber = dc.filingNumber
        AND o.status ILIKE 'published'
        AND (
          o.orderType = 'TAKE_COGNIZANCE'
          OR (o.orderCategory = 'COMPOSITE' AND EXISTS (SELECT 1 FROM jsonb_array_elements(o.compositeItems) elem WHERE elem->>'orderType' = 'TAKE_COGNIZANCE'))
        )
    )
    OR
    -- (c) Hearing scheduled with purpose Appearance AND no accused joined
    (
      EXISTS (
        SELECT 1 FROM dristi_hearing dh
        WHERE dh.filingNumber @> to_jsonb(dc.filingNumber::text)
          AND dh.hearingType ILIKE '%APPEARANCE%'
          AND dh.status = 'SCHEDULED'
      )
      AND NOT EXISTS (
        SELECT 1 FROM dristi_case_litigants l
        WHERE l.case_id = dc.id
          AND l.partyType ILIKE '%respondent%'
          AND l.isActive = true
      )
    )
  );

-- =============================================================================
-- Step 2b: Bail & Recording of Plea
-- Case is in Appearance AND an accused-side litigant has joined the case.
-- =============================================================================
UPDATE dristi_cases dc
SET stage = 'Bail & Recording of Plea'
WHERE dc.stage = 'Appearance'
  AND EXISTS (
    SELECT 1 FROM dristi_case_litigants l
    WHERE l.case_id = dc.id
      AND l.partyType ILIKE '%respondent%'
      AND l.isActive = true
  );

-- =============================================================================
-- Step 3: Hearing-based stages for registered/admitted cases
-- Uses the latest hearing (by startTime DESC) to determine the stage.
-- Updates cases in 'Cognizance' or 'Appearance' to later stages.
-- Stages: Complainant Evidence, Examination of Accused,
--          Defense Evidence, Arguments, Judgement
-- =============================================================================
WITH latest_hearing AS (
    SELECT DISTINCT ON (dc.filingNumber)
        dc.filingNumber,
        dh.hearingType
    FROM dristi_cases dc
    JOIN dristi_hearing dh ON dh.filingNumber @> to_jsonb(dc.filingNumber::text)
    WHERE dc.stage IN ('Cognizance', 'Appearance', 'Bail & Recording of Plea')
      AND dh.status IN ('SCHEDULED', 'COMPLETED')
      AND (
        dh.hearingType ILIKE '%EVIDENCE_COMPLAINANT%'
        OR dh.hearingType ILIKE '%EXAMINATION_UNDER_S351_BNSS%'
        OR dh.hearingType ILIKE '%EVIDENCE_ACCUSED%'
        OR dh.hearingType ILIKE '%ARGUMENTS%'
        OR dh.hearingType ILIKE '%JUDGEMENT%'
      )
    ORDER BY dc.filingNumber, dh.startTime DESC NULLS LAST
)
UPDATE dristi_cases dc
SET stage = CASE
    WHEN lh.hearingType ILIKE '%EVIDENCE_COMPLAINANT'                             THEN 'Complainant Evidence'
    WHEN lh.hearingType ILIKE '%EXAMINATION_UNDER_S351_BNSS'                      THEN 'Examination of Accused'
    WHEN lh.hearingType ILIKE '%EVIDENCE_ACCUSED%'                                THEN 'Defense Evidence'
    WHEN lh.hearingType ILIKE '%ARGUMENTS%'                                       THEN 'Arguments'
    WHEN lh.hearingType ILIKE '%JUDGEMENT%' OR lh.hearingType ILIKE '%JUDGEMENT%' THEN 'Judgement'
    ELSE dc.stage  -- keep 'Cognizance', 'Appearance', 'Bail & Recording of Plea' if hearing type doesn't match any stage
END
FROM latest_hearing lh
WHERE dc.filingNumber = lh.filingNumber;

-- =============================================================================
-- Step 4: Post-Judgement
-- Cases where a judgement order has been published.
-- Overrides hearing-based stages.
-- =============================================================================
UPDATE dristi_cases dc
SET stage = 'Post-Judgement'
WHERE EXISTS (
    SELECT 1 FROM dristi_orders o
    WHERE o.filingNumber = dc.filingNumber
      AND o.status ILIKE 'published'
      AND (
        o.orderType ILIKE '%JUDGEMENT%'
        OR (o.orderCategory = 'COMPOSITE' AND EXISTS (SELECT 1 FROM jsonb_array_elements(o.compositeItems) elem WHERE elem->>'orderType' ILIKE '%JUDGEMENT%'))
      )
);

-- =============================================================================
-- Step 5: Post-Disposal
-- Cases where a disposal or withdrawal order has been published.
-- Overrides Post-Judgement.
-- =============================================================================
UPDATE dristi_cases
SET stage = 'Post-Disposal'
WHERE outcome IN (
    'DISMISSED', 'ALLOWED', 'PARTIALLYALLOWED',
    'CONVICTED', 'PARTIALLYCONVICTED',
    'PARTIALLYACQUITTED', 'ACQUITTED',
    'ABATED', 'WITHDRAWN', 'SETTLED', 'TRANSFERRED'
);

-- =============================================================================
-- Step 6: Long Pending Register (highest priority override)
-- Cases flagged as LPR.
-- Once case moved to LPR, No actions will be performed so we are setting stagebackup to latest stage
-- =============================================================================
UPDATE dristi_cases
SET stagebackup = stage,
    stage = 'Long Pending Register'
WHERE isLPRCase = true;

COMMIT;
