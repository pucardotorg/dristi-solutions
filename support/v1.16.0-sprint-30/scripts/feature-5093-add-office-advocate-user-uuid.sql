-- update 2 tables

UPDATE dristi_application da
SET officeadvocateuseruuid = da.createdby
WHERE EXISTS (
    SELECT 1
    FROM dristi_advocate dad
             JOIN individual i
                  ON i.individualid = dad.individualid
    WHERE i.useruuid = da.createdby
);

UPDATE dristi_evidence_artifact dea
SET officeadvocateuseruuid = dea.createdby
WHERE EXISTS (
    SELECT 1
    FROM dristi_advocate dad
             JOIN individual i
                  ON i.individualid = dad.individualid
    WHERE i.useruuid = dea.createdby
);
