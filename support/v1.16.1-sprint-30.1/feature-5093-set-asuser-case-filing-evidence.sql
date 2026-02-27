UPDATE dristi_evidence_artifact dea
SET asuser =
    (
        SELECT createdby FROM dristi_cases dc
        WHERE dc.filingnumber = dea.filingnumber

    )
WHERE dea.filingtype = 'CASE_FILING';
