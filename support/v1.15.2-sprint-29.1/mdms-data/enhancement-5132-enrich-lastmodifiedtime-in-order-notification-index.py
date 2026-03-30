import requests
import json

# ---------------- CONFIG ----------------
env_url = "http://localhost:9091"

elasticsearch_search_url = "http://localhost:9200/order-notification-view/_search"
elasticsearch_update_url = "http://localhost:9200/order-notification-view/_update_by_query"

order_search_endpoint = "/order/v1/search"

auth_token = "7b32e3ee-1375-4469-ad04-5c33312a88ae"
es_username = "dffq"
es_password = "wdqf"

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

def fetch_order_audit_details(order_id):
    """
    Fetch auditDetails and lastModifiedTime for an order
    """
    body = {
        "tenantId": "kl",
        "criteria": {
            "orderNumber": order_id
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

        orders = res.json().get("list", [])

        if not orders:
            return None, None

        audit_details = orders[0].get("auditDetails", {})
        return audit_details.get("lastModifiedTime")

    except Exception as e:
        print(f"❌ Error fetching order {order_id}: {e}")
        return None, None


def update_order_notification(order_id, last_modified_time):
    update_query = {
        "script": {
            "lang": "painless",
            "source": """
                if (ctx._source.Data.orderNotification != null) {
                    ctx._source.Data.orderNotification.lastModifiedTime = params.lastModifiedTime;
                }
            """,
            "params": {
                "lastModifiedTime": last_modified_time
            }
        },
        "query": {
            "term": {
                "_id": order_id
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

        print(f"✅ ES updated | orderId={order_id}")

    except Exception as e:
        print(f"❌ ES update failed | orderId={order_id} | Error={e}")


def search_all_order_notifications():
    body = {
        "size": 10000,
        "_source": ["Data.orderNotification.id"],
        "query": {
            "match_all": {}
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
        print(f"❌ Error fetching orders from ES: {e}")
        return []


# ---------------- MAIN ----------------

records = search_all_order_notifications()

for record in records:
    order_notification = record.get("_source", {}).get("Data", {}).get("orderNotification", {})
    order_id = order_notification.get("id")

    if not order_id:
        print("⚠️ Skipping record: orderId missing")
        continue

    last_modified_time = fetch_order_audit_details(order_id)

    if not last_modified_time:
        print(f"⚠️ No last_modified_time found for orderId={order_id}")
        continue

    update_order_notification(order_id, last_modified_time)
