-- update 3 tables
update dristi_application da
set asuser = da.createdby
where da.asuser is null

update dristi_evidence_artifact dea
set asuser = dea.createdby
where dea.asuser is null

update dristi_bail db
set as_user = db.created_by
where db.as_user is null
