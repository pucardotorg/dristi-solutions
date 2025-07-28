import requests
import json

# Configuration
env_url = "http://localhost:9091"
application_search_endpoint = "/application/v1/search"

auth_token = "7b32e3ee-1375-4469-ad04-5c33312a88ae"  # Make sure this is defined before usage

headers = {
"accept": "application/json",
"content-type": "application/json;charset=UTF-8",
"user-agent": "python-script"
}

request_info = {
"apiId": "Rainmaker",
"authToken": auth_token,
"userInfo": {
"id": 2177,
"userName": "On247SysAdmin",
"type": "EMPLOYEE",
"tenantId": "kl",
"roles": [{"code": "CASE_EDITOR", "name": "CASE_EDITOR", "tenantId": "kl"}]
}
}

# SELECT applicationnumber FROM public.dristi_application where applicationType = 'REQUEST_FOR_BAIL' and status='PENDINGESIGN';
# PENDINGESIGN-ESIGN
# UPDATE public.dristi_application set status = 'PENDINGPAYMENT' where applicationType = 'REQUEST_FOR_BAIL' and status='PENDINGESIGN';

# SELECT applicationnumber FROM public.dristi_application where applicationType = 'REQUEST_FOR_BAIL' and status='PENDINGPAYMENT';
# PENDINGPAYMENT-PAY
# UPDATE public.dristi_application set status = 'PENDINGAPPROVAL' where applicationType = 'REQUEST_FOR_BAIL' and status='PENDINGPAYMENT';

# SELECT applicationnumber FROM public.dristi_application where applicationType = 'REQUEST_FOR_BAIL' and status='PENDINGAPPROVAL';
# PENDINGAPPROVAL-APPROVE
# UPDATE public.dristi_application set status = 'COMPLETED' where applicationType = 'REQUEST_FOR_BAIL' and status='PENDINGAPPROVAL';

# GET pending-tasks-index/_search
# {
#   "query": {
#     "bool": {
#       "must": [
#         { "term": { "Data.entityType.keyword": "voluntary-application-submission-bail" }},
#         { "term": { "Data.isCompleted": false }}
#       ]
#     }
#   }
# }

# POST pending-tasks-index/_update_by_query
# {
#   "script": {
#     "source": "ctx._source.Data.isCompleted = true",
#     "lang": "painless"
#   },
#   "query": {
#     "bool": {
#       "must": [
#         { "term": { "Data.entityType.keyword": "voluntary-application-submission-bail" }},
#         { "term": { "Data.isCompleted": false }}
#       ]
#     }
#   }
# }


def fetch_applications():
body = {
"tenantId": "kl",
"criteria": {
"applicationType": "REQUEST_FOR_BAIL",
"tenantId": "kl",
"status": "PENDINGAPPROVAL"
},
"RequestInfo": request_info
}
try:
res = requests.post(env_url + application_search_endpoint, headers=headers, json=body)
res.raise_for_status()
data = res.json()
return data.get("applicationList", [])
except Exception as e:
print(f"❌ Error fetching application: {e}")
return []

def call_workflow_transition(business_id):
transition_url = "http://localhost:8083/egov-workflow-v2/egov-wf/process/_transition"

payload = {
"RequestInfo": {
"apiId": None,
"ver": None,
"ts": None,
"action": "POST",
"did": None,
"key": None,
"msgId": "5bfa85e7-dfa1-47c8-98b2-747bf552be86",
"userInfo": {
"uuid": "a6a374d5-1a20-4577-9533-8c0f03705b8a",
"locale": "string",
"type": "EMPLOYEE",
"name": "mustak",
"mobileNumber": "1234567890",
"emailId": "xyz@egovernments.org",
"roles": [
{"name": "Employee", "code": "EMPLOYEE", "tenantId": "kl"},
{"name": "TASK_CREATOR", "code": "TASK_CREATOR", "tenantId": "kl"},
{"name": "SYSTEM", "code": "SYSTEM", "tenantId": "kl"},
{"name": "SUBMISSION_APPROVER", "code": "SUBMISSION_APPROVER", "tenantId": "kl"},
{"name": "SYSTEM_ADMIN", "code": "SYSTEM_ADMIN", "tenantId": "kl"},
{"name": "Super User", "code": "SUPERUSER", "tenantId": "kl"}
],
"active": True,
"tenantId": "kl",
"permanentCity": "Kaikoo"
},
"authToken": ""
},
"ProcessInstances": [
{
"tenantId": "kl",
"businessService": "voluntary-application-submission-bail",
"businessId": business_id,
"action": "APPROVE"
}
]
}

try:
response = requests.post(transition_url, headers={"Content-Type": "application/json"}, json=payload)
response.raise_for_status()
print(f"✅ Workflow transitioned for businessId: {business_id}")
except Exception as e:
print(f"❌ Failed to transition workflow for businessId {business_id}: {e}")

# Main Logic
records = fetch_applications()

for record in records:
application_number = record.get("applicationNumber")
print(f"📄 Fetched applicationNumber: {application_number}")
if application_number:
call_workflow_transition(application_number)
else:
print("⚠️ Skipped record with missing applicationNumber")
