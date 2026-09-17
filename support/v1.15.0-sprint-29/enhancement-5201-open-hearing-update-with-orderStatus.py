import requests
import json

# ---------------- CONFIG ----------------
env_url = "http://localhost:9091"
elasticsearch_search_url = "http://localhost:9200/open-hearing-index/_search"
elasticsearch_update_url = "http://localhost:9200/open-hearing-index/_update_by_query"
order_search_endpoint = "/order/v1/search"

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
        "userName": "<USERNAME>",
        "type": "EMPLOYEE",
        "tenantId": "kl",
        "roles": [
            {"code": "CASE_EDITOR", "name": "CASE_EDITOR", "tenantId": "kl"}
        ]
    }
}

# ---------------- FUNCTIONS ----------------

def fetch_order_status_by_hearing_number(hearing_number):
    """
    Returns order status if found, else None
    """
    body = {
        "tenantId": "kl",
        "criteria": {
            "hearingNumber": hearing_number
        },
        "RequestInfo": request_info
    }

    try:
        res = requests.post(
            env_url + order_search_endpoint,
            headers=headers,
            json=body
        )
        res.raise_for_status()

        response = res.json()
        orders = response.get("list", [])

        if not orders:
            return None

        return orders[0].get("status")

    except Exception as e:
        print(f"❌ Error fetching order for hearing {hearing_number}: {e}")
        return None


def update_elasticsearch_order_status(hearing_number, order_status):
    update_query = {
        "script": {
            "source": "ctx._source.Data.hearingDetails.orderStatus = params.orderStatus;",
            "lang": "painless",
            "params": {
                "orderStatus": order_status
            }
        },
        "query": {
            "term": {
                "Data.hearingDetails.hearingNumber.keyword": hearing_number
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

        print(f"✅ ES updated | hearingNumber={hearing_number} | orderStatus={order_status}")

    except Exception as e:
        print(f"❌ ES update failed | hearingNumber={hearing_number} | Error={e}")


def search_all_hearings():
    body = {
        "size": 10000,
        "_source": ["Data.hearingDetails.hearingNumber"],
        "query": {
            "bool": {
                "must": [
                    {
                        "term": {
                            "Data.hearingDetails.status.keyword": "SCHEDULED"
                        }
                    }
                ]
            }
        }
    }

    try:
        res = requests.post(
            elasticsearch_search_url,
            auth=(es_username, es_password),
            headers=headers,
            json=body
        )
        res.raise_for_status()

        return res.json().get("hits", {}).get("hits", [])

    except Exception as e:
        print(f"❌ Error fetching hearings from ES: {e}")
        return []


# ---------------- MAIN ----------------

records = search_all_hearings()

for record in records:
    data = record.get("_source", {}).get("Data", {})
    hearing_details = data.get("hearingDetails", {})
    hearing_number = hearing_details.get("hearingNumber")

    if not hearing_number:
        print("⚠️ Skipping record: hearingNumber missing")
        continue

    order_status = fetch_order_status_by_hearing_number(hearing_number)

    # -------- STATUS MAPPING --------
    if order_status == "DRAFT_IN_PROGRESS":
        es_status = "DRAFT"
    elif order_status == "PENDING_BULK_E-SIGN":
        es_status = "PENDING_SIGN"
    elif order_status is None:
        es_status = "NOT_CREATED"
    else:
        es_status = "SIGNED"

    update_elasticsearch_order_status(hearing_number, es_status)
