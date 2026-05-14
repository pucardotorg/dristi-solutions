import requests
import json

# Configuration
#application config
env_url = "http://localhost:8080"
elasticsearch_search_url = "http://localhost:9200/pending-tasks-index/_search"
elasticsearch_update_url = "http://localhost:9200/pending-tasks-index/_update_by_query"
application_search_endpoint = "/application/v1/search"

auth_token = "7b32e3ee-1375-4469-ad04-5c33312a88ae"
es_username = "elastic"
es_password = "8fwbD6HbJh6HU0oddsHm8TEI"

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
        "userName": "script",
        "type": "EMPLOYEE",
        "tenantId": "kl",
        "roles": [{"code": "CASE_EDITOR", "name": "CASE_EDITOR", "tenantId": "kl"}]
    }
}

import requests

def fetch_applications(referenceId):
    body = {
        "tenantId": "kl",
        "criteria": {
            "applicationNumber": referenceId,
            "tenantId": "kl",
        },
        "RequestInfo": request_info
    }

    try:
        res = requests.post(env_url + application_search_endpoint, headers=headers, json=body)
        res.raise_for_status()  # Raise an exception for HTTP error responses (e.g., 404, 500)
        data = res.json()
        return data.get("applicationList", [])  # Return applicationList or an empty list if not found
    except Exception as e:
        print(f"❌ Error fetching application: {e}")
        return []


def update_elasticsearch(referenceId, actionCategory, referenceEntityType):
    update_query = {
        "script": {
            "source": """
                ctx._source.Data.referenceEntityType = params.referenceEntityType;
                ctx._source.Data.actionCategory = params.actionCategory;
            """,
            "lang": "painless",
            "params": {
                "actionCategory": actionCategory,
                "referenceEntityType" : referenceEntityType
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
                    }
                ]
            }
        },
        "_source": ["Data.filingNumber", "Data.referenceId", "Data.name"]
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
        "Order for Initiating Rescheduling of Hearing Date",
        "Create Order for rescheduling the hearing"
    ]:
        actionCategory = "Reschedule Applications"
    elif name in [
        "Order for Extension for Submission Deadline",
        "Order for Advocate Replacement Approval/Rejection",
        "Accept Document Submission",
        "Review Document Submission",
        "Review of Bail Application",
        "Review Bail Documents",
        "Review Advocate Replace Request",
        "Review Litigant Details Change"
    ]:
        actionCategory = "Others"
    elif name in [
        "Review Delay in Submission",
        "Review Delay Condonation application"
    ]:
        actionCategory = "Delay Condonation"

    # Main Logic
    print(f"Processing record with referenceId and name: {referenceId}, {name}")
    applications = fetch_applications(referenceId)


    if applications and applications != []:
        update_elasticsearch(referenceId, actionCategory, applications[0].get("applicationType"))

    else:
        print(f"⚠️ Skipped record with referenceId: {referenceId}")
        print(f"  ↪ name: {name}")
