import requests
import json

# Configurations
env_url = "http://localhost:9091"
elasticsearch_search_url = "http://localhost:9200/order-notification-view/_search"
elasticsearch_update_url = "http://localhost:9200/order-notification-view/_update_by_query"
order_search_endpoint = "/order/v1/search"

auth_token = "2f6c5611-4af3-466d-b205-a76b3e8cbae0"
es_username = <<ES_USERNAME>>
es_password = <<ES_PASSWORD>>

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
        "userName": <<<USERNAME>>>,
        "type": "EMPLOYEE",
        "tenantId": "kl",
        "roles": [{"code": "CASE_EDITOR", "name": "CASE_EDITOR", "tenantId": "kl"}]
    }
}


def fetch_business_of_day(order_number):
    body = {
        "tenantId": "kl",
        "criteria": {"orderNumber": order_number, "status": "PUBLISHED"},
        "RequestInfo": request_info
    }
    try:
        res = requests.post(env_url + order_search_endpoint, headers=headers, json=body)
        res.raise_for_status()
        data = res.json()

        if data.get("list"):
            additional_details = data["list"][0].get("additionalDetails")
            if additional_details:
                business_of_day = additional_details.get("businessOfTheDay")
                if business_of_day:
                    return business_of_day
                else:
                    print(f"ℹ️ businessOfTheDay not found in additionalDetails for orderNumber: {order_number}")
            else:
                print(f"ℹ️ additionalDetails not found for orderNumber: {order_number}")
        else:
            print(f"⚠️ No order found with orderNumber: {order_number} and status PUBLISHED")
    except Exception as e:
        print(f"❌ Error fetching order for orderNumber {order_number}: {e}")
    return None



def update_elasticsearch(order_number, business_of_day):
    update_query = {
        "script": {
            "source": """
                if (ctx._source.Data.orderNotification != null) {
                    ctx._source.Data.orderNotification.businessOfTheDay = params.businessOfTheDay;
                }
            """,
            "lang": "painless",
            "params": {
                "businessOfTheDay": business_of_day
            }
        },
        "query": {
            "bool": {
                "must": [
                    {
                        "term": {
                            "Data.orderNotification.status.keyword": "PUBLISHED"
                        }
                    },
                    {
                        "term": {
                            "Data.orderNotification.id.keyword": order_number
                        }
                    }
                ]
            }
        }
    }

    try:
        res = requests.post(
            elasticsearch_update_url + "?conflicts=proceed",
            auth=(es_username, es_password),
            headers=headers,
            json=update_query
        )
        res.raise_for_status()
        print(f"✅ Updated ES for orderNumber {order_number}")
    except Exception as e:
        print(f"❌ Failed to update ES for orderNumber {order_number}: {e}")


def search_notification_data():
    body = {
        "size": 10000,
"query": {
  "bool": {
    "must": [
      {
        "term": {
          "Data.orderNotification.status.keyword": "PUBLISHED"
        }
      }
    ],
    "must_not": [
      {
        "exists": {
          "field": "Data.orderNotification.businessOfTheDay"
        }
      }
    ]
  }
},
        "_source": ["Data.orderNotification.id"]
    }
    try:
        res = requests.post(elasticsearch_search_url, auth=(es_username, es_password), headers=headers, json=body)
        res.raise_for_status()
        return res.json().get("hits", {}).get("hits", [])
    except Exception as e:
        print(f"❌ Error querying ES billing-data-index: {e}")
        return []


# Main execution
records = search_notification_data()
update_count = 0

for record in records:
    source = record["_source"].get("Data", {})
    order_notification = source.get("orderNotification", {})
    order_number = order_notification.get("id")

    if not order_number:
        print("⚠️ order_number missing in record")
        continue

    business_of_day = fetch_business_of_day(order_number)

    if business_of_day:
        update_elasticsearch(order_number, business_of_day)
        update_count += 1
        print(f"🧾 orderNumber: {order_number}, businessOfDay: {business_of_day}")
    else:
        print(f"ℹ️ No businessOfTheDay found for orderNumber: {order_number}")

print(f"✅ Total updates performed: {update_count}")
