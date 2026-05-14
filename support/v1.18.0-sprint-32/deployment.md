need to restart egov-accesscontrol service
'need to restart egov-encrption service and case service

## Fix #5688 - Judge Designation MDMS Update
- Run MDMS data update: `support/v1.18.0-sprint-32/mdms-data/fix-5688-designation-update.json5`
- Updates `common-masters.Designation` entry with code `JUDICIAL_MAGISTRATE` — changes `name` to "Judicial Magistrate of First Class"
- Restart dristi-pdf service after deploying