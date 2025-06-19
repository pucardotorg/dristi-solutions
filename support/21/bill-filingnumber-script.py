import requests
import json

# Configurations
env_url = "http://localhost:9091"
elasticsearch_search_url = "http://localhost:9200/billing-data-index/_search"
elasticsearch_update_url = "http://localhost:9200/billing-data-index/_update_by_query"

case_search_endpoint = "/case/v1/_search"

auth_token = "1620ada3-fed8-46de-93d6-d6d77ddb8aa6"
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


def fetch_case_by_id(case_id):
    body = {
        "tenantId": "kl",
        "criteria": [{"caseId": case_id}],
        "RequestInfo": request_info
    }
    try:
        res = requests.post(env_url + case_search_endpoint, headers=headers, json=body)
        res.raise_for_status()
        data = res.json()
        case = data["criteria"][0]["responseList"][0]
        return case.get("filingNumber")
    except Exception as e:
        print(f"❌ Error fetching case for caseId {case_id}: {e}")
        return None, None


def update_elasticsearch(case_id, filingNumber):
    update_query = {
        "script": {
            "source": """
                ctx._source.Data.billDetails.filingNumber = params.filingNumber;
            """,
            "lang": "painless",
            "params": {
                "filingNumber": filingNumber
            }
        },
        "query": {
            "term": {
                "Data.billDetails.caseId.keyword": case_id
            }
        }
    }
    try:
        res = requests.post(
            elasticsearch_update_url+ "?conflicts=proceed",
            auth=(es_username, es_password),
            headers=headers,
            json=update_query
        )
        res.raise_for_status()
        print(f"✅ Updated ES for caseId {case_id}")
    except Exception as e:
        print(f"❌ Failed to update ES for caseId {case_id}: {e}")


def search_billing_data():
    body = {
        "size": 10000,
  "query": {
    "bool": {
      "must": [
        {
          "exists": {
            "field": "Data.billDetails.caseId"
          }
        }
      ],
      "must_not": [
        {
          "exists": {
            "field": "Data.billDetails.filingNumber"
          }
        }
      ]
    }
  },
        "_source": [
            "Data.billDetails.caseId"
        ]
    }
    try:
        res = requests.post(elasticsearch_search_url, auth=(es_username, es_password), headers=headers, json=body)
        res.raise_for_status()
        return res.json().get("hits", {}).get("hits", [])
    except Exception as e:
        print(f"❌ Error querying ES billing-data-index: {e}")
        return []


# Main execution
records = search_billing_data()
update_count=0
for record in records:
    source = record["_source"].get("Data", {})
    bill_details = source.get("billDetails", {})
    case_id = bill_details.get("caseId")

    if not case_id:
        print("⚠️ caseId missing in record")
        continue

    filing_number = fetch_case_by_id(case_id)

    update_elasticsearch(case_id, filing_number)
    update_count += 1  # Increment the update counter
    print(f"✅ Updated ES for caseId {case_id}")
    print(f"🔢 Current update count: {update_count}")
    print(f"  🧾 filing_number: {filing_number}")
