import requests
import json
import time

# ---------------------------
# CONFIGURATION
# ---------------------------

BASE_URL = "http://localhost:8090"  # Advocate service base URL
SEARCH_ENDPOINT = "/advocate/v1/_search?limit=2000&offset=0"
PROCESS_ENDPOINT = "http://localhost:9080/njdg-transformer/njdg/v1/_processadvocate"

TENANT_ID = "kl"

AUTH_TOKEN = "716fd5bb-7aed-405a-8690-c3899fee2496"

REQUEST_INFO = {
    "apiId": "Rainmaker",
    "authToken": AUTH_TOKEN,
    "userInfo": {
        "id": 270,
        "uuid": "08f08766-9712-4725-a86a-587e30b5dee8",
        "userName": "9999980060",
        "name": "Rohintest Efile",
        "mobileNumber": "9999980060",
        "type": "CITIZEN",
        "roles": [
            {"name": "CASE_CREATOR", "code": "CASE_CREATOR", "tenantId": TENANT_ID},
            {"name": "CASE_EDITOR", "code": "CASE_EDITOR", "tenantId": TENANT_ID},
            {"name": "CASE_VIEWER", "code": "CASE_VIEWER", "tenantId": TENANT_ID},
        ],
        "tenantId": TENANT_ID,
    },
}

# ---------------------------
# LOGGING HELPERS
# ---------------------------


def log_to_file(filename, data):
    with open(filename, "a") as f:
        f.write(json.dumps(data, indent=2))
        f.write("\n")


# ---------------------------
# FETCH ADVOCATES
# ---------------------------


def fetch_advocates():
    url = f"{BASE_URL}{SEARCH_ENDPOINT}"
    payload = {
        "RequestInfo": REQUEST_INFO,
        "tenantId": TENANT_ID,
        "criteria": [{"tenantId": TENANT_ID}],
    }
    headers = {"Content-Type": "application/json"}

    print(f"🔍 Fetching advocates from {url}...")
    response = requests.post(url, headers=headers, data=json.dumps(payload))

    if response.status_code != 200:
        print(f"❌ Failed to fetch advocates: {response.text}")
        return []

    data = response.json()
    advocates = (
        data.get("advocates") or data.get("list") or data.get("AdvocateList") or []
    )

    # Extract only ACTIVE advocates from nested responseList
    active_advocates = []
    for adv in advocates:
        response_list = adv.get("responseList", [])
        for record in response_list:
            if record.get("status") == "ACTIVE":
                active_advocates.append(record)

    print(f"✅ Found {len(active_advocates)} ACTIVE advocates")
    return active_advocates


# ---------------------------
# FILTER ACTIVE ADVOCATES
# ---------------------------


def filter_active_advocates(advocates):
    active = [a for a in advocates if a.get("status") == "ACTIVE"]
    print(f"🟢 {len(active)} active advocates after filtering")
    return active


# ---------------------------
# PROCESS ADVOCATE
# ---------------------------


def process_advocate(advocate):
    payload = {"RequestInfo": REQUEST_INFO, "advocate": advocate}

    headers = {"Content-Type": "application/json"}

    response = requests.post(
        PROCESS_ENDPOINT, headers=headers, data=json.dumps(payload)
    )
    if response.status_code == 200:
        print(f"✅ Processed advocate {advocate.get('applicationNumber')}")
        log_to_file("processed_advocates.json", advocate)
    else:
        print(
            f"❌ Failed to process advocate {advocate.get('applicationNumber')}: {response.text}"
        )
        log_to_file(
            "error_advocates.json", {"advocate": advocate, "error": response.text}
        )


# ---------------------------
# MAIN SCRIPT
# ---------------------------


def main():
    advocates = fetch_advocates()
    if not advocates:
        print("⚠️ No advocates found. Exiting.")
        return

    active_advocates = filter_active_advocates(advocates)

    for advocate in active_advocates:
        process_advocate(advocate)
        time.sleep(0.3)  # avoid spamming the server


if __name__ == "__main__":
    main()
