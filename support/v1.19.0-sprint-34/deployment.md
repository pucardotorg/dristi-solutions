--need to remove this for user-otp svc 
name: EGOV_SMS_TEMPLATE_ID
value: "1107173141022956265"

--remove proclamation and attachment->proclamation from mdms
-- run this
delete FROM public.eg_mdms_data where schemacode='case.CasePrimaryStage' and id in ('462c0d25-6fa7-4a1f-a4ba-d5659cc79cf7',  
'9baee851-f211-42b3-b4ca-ce134b5dbfe6')
--add ABATE_CASE in primary case stage for post disposal
--need to restart analytics, egov-accesscontrol, egov-persister, egov-indexer, pdf-service