UPDATE dristi_case_representatives dcr
SET advocate_filing_status =
        CASE
            WHEN dcr.case_id = (
                SELECT dc.id
                FROM dristi_cases dc
                WHERE dc.id = dcr.case_id
                  AND dc.createdby = (
                    SELECT i.useruuid
                    FROM individual i
                    WHERE i.individualid = (
                        SELECT da.individualid
                        FROM dristi_advocate da
                        WHERE da.id = dcr.advocateid
                    )
                )
            ) THEN 'caseOwner'
            ELSE 'other'
            END;
