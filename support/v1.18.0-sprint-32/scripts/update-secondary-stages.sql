
BEGIN;

WITH active_flags AS (
    SELECT dc.id,

        -- Delay Condonation: case registered + delay condonation required + not yet accepted/rejected
        CASE WHEN
            dc.stage NOT IN ('Filing', 'Defect Correction', 'Scrutiny', 'Registration')
            AND dc.caseDetails->'delayApplications'->'formdata'->0->'data'->'delayCondonationType'->>'code' = 'NO'
            AND NOT EXISTS (
                SELECT 1 FROM dristi_application a
                WHERE a.filingNumber = dc.filingNumber
                  AND a.applicationType = 'DELAY_CONDONATION'
                  AND a.status IN ('COMPLETED', 'REJECTED')
                  AND a.isActive = true
            )
        THEN true ELSE false END AS has_delay_condonation,

        -- Notice: published NOTICE order AND not all tasks completed
        CASE WHEN EXISTS (
            SELECT 1 FROM dristi_orders o
            WHERE o.filingNumber = dc.filingNumber AND o.status ILIKE 'published'
              AND (o.orderType = 'NOTICE' OR (o.orderCategory = 'COMPOSITE' AND EXISTS (SELECT 1 FROM jsonb_array_elements(o.compositeItems) elem WHERE elem->>'orderType' = 'NOTICE')))
        ) AND (
            NOT EXISTS (
                SELECT 1 FROM dristi_task t WHERE t.filingNumber = dc.filingNumber AND t.taskType = 'NOTICE'
            )
            OR EXISTS (
                SELECT 1 FROM dristi_task t WHERE t.filingNumber = dc.filingNumber AND t.taskType = 'NOTICE'
                  AND t.status NOT IN ('EXECUTED','EXPIRED','DELIVERED','ABATED','UNDELIVERED','NOT_EXECUTED')
            )
        )
        THEN true ELSE false END AS has_notice,

        -- Summons: published SUMMONS order AND not all tasks completed
        CASE WHEN EXISTS (
            SELECT 1 FROM dristi_orders o
            WHERE o.filingNumber = dc.filingNumber AND o.status ILIKE 'published'
              AND (o.orderType = 'SUMMONS' OR (o.orderCategory = 'COMPOSITE' AND EXISTS (SELECT 1 FROM jsonb_array_elements(o.compositeItems) elem WHERE elem->>'orderType' = 'SUMMONS')))
        ) AND (
            NOT EXISTS (
                SELECT 1 FROM dristi_task t WHERE t.filingNumber = dc.filingNumber AND t.taskType = 'SUMMONS'
            )
            OR EXISTS (
                SELECT 1 FROM dristi_task t WHERE t.filingNumber = dc.filingNumber AND t.taskType = 'SUMMONS'
                  AND t.status NOT IN ('EXECUTED','EXPIRED','DELIVERED','ABATED','UNDELIVERED','NOT_EXECUTED')
            )
        )
        THEN true ELSE false END AS has_summons,

        -- Warrant: published WARRANT order AND not all tasks completed
        CASE WHEN EXISTS (
            SELECT 1 FROM dristi_orders o
            WHERE o.filingNumber = dc.filingNumber AND o.status ILIKE 'published'
              AND (o.orderType = 'WARRANT' OR (o.orderCategory = 'COMPOSITE' AND EXISTS (SELECT 1 FROM jsonb_array_elements(o.compositeItems) elem WHERE elem->>'orderType' = 'WARRANT')))
        ) AND (
            NOT EXISTS (
                SELECT 1 FROM dristi_task t WHERE t.filingNumber = dc.filingNumber AND t.taskType = 'WARRANT'
            )
            OR EXISTS (
                SELECT 1 FROM dristi_task t WHERE t.filingNumber = dc.filingNumber AND t.taskType = 'WARRANT'
                  AND t.status NOT IN ('EXECUTED','EXPIRED','DELIVERED','ABATED','UNDELIVERED','NOT_EXECUTED')
            )
        )
        THEN true ELSE false END AS has_warrant,

        -- Proclamation & Attachment: published PROCLAMATION/ATTACHMENT order AND not all tasks completed
        CASE WHEN EXISTS (
            SELECT 1 FROM dristi_orders o
            WHERE o.filingNumber = dc.filingNumber AND o.status ILIKE 'published'
              AND (o.orderType = 'PROCLAMATION' OR o.orderType = 'ATTACHMENT'
                   OR (o.orderCategory = 'COMPOSITE' AND EXISTS (SELECT 1 FROM jsonb_array_elements(o.compositeItems) elem WHERE elem->>'orderType' IN ('PROCLAMATION', 'ATTACHMENT'))))
        ) AND (
            NOT EXISTS (
                SELECT 1 FROM dristi_task t WHERE t.filingNumber = dc.filingNumber AND t.taskType IN ('PROCLAMATION','ATTACHMENT')
            )
            OR EXISTS (
                SELECT 1 FROM dristi_task t WHERE t.filingNumber = dc.filingNumber AND t.taskType IN ('PROCLAMATION','ATTACHMENT')
                  AND t.status NOT IN ('EXECUTED','EXPIRED','DELIVERED','ABATED','UNDELIVERED','NOT_EXECUTED')
            )
        )
        THEN true ELSE false END AS has_proclamation

    FROM dristi_cases dc
),
secondary_stage_json AS (
    SELECT af.id,
        (
            SELECT COALESCE(jsonb_agg(stage_name), '[]'::jsonb)
            FROM (VALUES
                (CASE WHEN af.has_delay_condonation THEN 'Delay Condonation' END),
                (CASE WHEN af.has_notice THEN 'Notice' END),
                (CASE WHEN af.has_summons THEN 'Summons' END),
                (CASE WHEN af.has_warrant THEN 'Warrant' END),
                (CASE WHEN af.has_proclamation THEN 'Proclamation & Attachment' END)
            ) AS t(stage_name)
            WHERE stage_name IS NOT NULL
        ) AS stages
    FROM active_flags af
)
UPDATE dristi_cases dc
SET secondarystage = ssj.stages
FROM secondary_stage_json ssj
WHERE dc.id = ssj.id;

COMMIT;
