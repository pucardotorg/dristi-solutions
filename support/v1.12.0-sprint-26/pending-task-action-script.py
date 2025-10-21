import requests
import json

# Configuration
env_url = "http://localhost:9091"
elasticsearch_search_url = "http://localhost:9200/pending-tasks-index/_search"
elasticsearch_update_url = "http://localhost:9200/pending-tasks-index/_update_by_query"
case_search_endpoint = "/case/v1/_search"

auth_token = "7b32e3ee-1375-4469-ad04-5c33312a88ae"
es_username = <<ES_USERNAME>>
es_password = <<PASSWORD>>

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
        "userName": <<USERNAME>>,
        "type": "EMPLOYEE",
        "tenantId": "kl",
        "roles": [{"code": "CASE_EDITOR", "name": "CASE_EDITOR", "tenantId": "kl"}]
    }
}

def fetch_case_by_filing_number(filing_number):
    body = {
        "tenantId": "kl",
        "criteria": [{"filingNumber": filing_number}],
        "RequestInfo": request_info
    }
    try:
        res = requests.post(env_url + case_search_endpoint, headers=headers, json=body)
        res.raise_for_status()
        data = res.json()
        case = data["criteria"][0]["responseList"][0]
        return case["filingNumber"], case.get("courtCaseNumber"), case.get("cmpNumber"), case.get("substage"), case.get("representatives"), case.get("caseTitle", "")
    except Exception as e:
        print(f"Error fetching case for filingNumber {filing_number}: {e}")
        return None, None, None, None, None, None

def update_elasticsearch(referenceId, actionCategory, assignedRole):
    update_query = {
        "script": {
            "source": """
                ctx._source.Data.actionCategory = params.actionCategory;
                ctx._source.Data.assignedRole = params.assignedRole;
            """,
            "lang": "painless",
            "params": {
                "actionCategory": actionCategory,
                "assignedRole": assignedRole
            }
        },
        "query": {
            "term": {
                "Data.referenceId.keyword": referenceId
            }
        }
    }

    try:
        res = requests.post(
            elasticsearch_update_url,
            auth=(es_username, es_password),
            headers={"Content-Type": "application/json"},
            json=update_query
        )
        res.raise_for_status()
        print(f"✅ Updated ES for {referenceId}\n"
              f"  ↪ actionCategory: {actionCategory}\n")
    except Exception as e:
        print(f"❌ Failed to update ES for {referenceId}\n"
              f"  ↪ actionCategory: {actionCategory}\n"
              f"  ↪ Error: {e}")

def search_pending_tasks():
    body = {
             "size": 10000,
             "query": {
               "bool": {
                 "must": [
                   { "term": { "Data.isCompleted": False } },
                   {
                     "bool": {
                       "must_not": [
                         { "term": { "Data.filingNumber.keyword": "null" } }
                       ]
                     }
                   },
                   { "term": { "Data.name.keyword": "Scrutiny of Case" } }
                 ]
               }
             }
           }
    try:
        res = requests.post(elasticsearch_search_url, auth=(es_username, es_password), headers=headers, json=body)
        res.raise_for_status()
        return res.json().get("hits", {}).get("hits", [])
    except Exception as e:
        print(f"Error searching pending tasks: {e}")
        return []

def extract_advocate_details(representatives):
    party_advocate_map = {}
    if not representatives:
        return party_advocate_map

    for representative in representatives:
        additional_details = representative.get("additionalDetails") or {}
        advocate_name = additional_details.get("advocateName", "")
        representing_list = representative.get("representing", [])
        if representing_list:
            for representing in representing_list:
                party_type = (representing.get("partyType") or "").lower()
                role_key = "complainant" if "complainant" in party_type else "accused"
                if advocate_name:  # Only add if name is not empty
                    party_advocate_map.setdefault(role_key, []).append(advocate_name)
                break
    return party_advocate_map

def extract_advocate_names(representatives):
    if not representatives:
        return []
    return [
        (rep.get("additionalDetails") or {}).get("advocateName", "")
        for rep in representatives
        if (rep.get("additionalDetails") or {}).get("advocateName", "")
    ]


# Main Logic
records = search_pending_tasks()

for record in records:
    data = record["_source"].get("Data", {})
    filing_number = data.get("filingNumber")
    referenceId = data.get("referenceId")
    name = data.get("name")

    actionCategory = ""
    if name in [
        "Scrutiny of Case"
    ]:
        actionCategory = "Scrutinise cases"

        update_elasticsearch(referenceId,actionCategory, ["CASE_REVIEWER","VIEW_SCRUTINY_CASES"])

    else:
        print(f"⚠️ Skipped record with no filing number: {record}")
