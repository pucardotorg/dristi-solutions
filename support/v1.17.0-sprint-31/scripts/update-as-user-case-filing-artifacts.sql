update dristi_evidence_artifact dea
set asuser = (
    select dc.createdby
    from dristi_cases dc
    where dc.filingnumber = dea.filingnumber
    limit 1
    )
where dea.filingtype = 'CASE_FILING'
  and exists (
    select 1 from eg_user eu
    where eu."uuid" = dea.createdby
    and eu."type" = 'EMPLOYEE'
    );
