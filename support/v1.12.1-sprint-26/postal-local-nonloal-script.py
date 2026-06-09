import csv
import requests
from datetime import datetime

# Configurations
url = "http://localhost:8080/payment-calculator/hub/v1/_create"
headers = {
    "Content-Type": "application/json"
}

# Static RequestInfo block
request_info = {
    "apiId": "asset-services",
    "ver": None,
    "ts": None,
    "action": None,
    "did": None,
    "key": None,
    "msgId": "batch-upload",
    "authToken": "apiId",
    "userInfo": {
        "uuid": "as",
        "roles": [
            {
                "code": "",
                "tenantId": "pg"
            }
        ],
        "type": ""
    }
}

# Logging setup
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
log_file_path = f"batch_upload_log_{timestamp}.txt"

def log(message):
    print(message)
    with open(log_file_path, "a", encoding="utf-8") as f:
        f.write(message + "\n")

def chunks(lst, n):
    """Yield successive n-sized chunks from list."""
    for i in range(0, len(lst), n):
        yield lst[i:i + n]

postal_hubs = []

# Read all postal hubs from CSV
with open("postal-hub-mapping.csv", newline="") as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        pincode = row["Pincode"].strip()
        hub_name = row["Oncourts System"].strip()
        classification = row.get("classificatioon", "").strip() or "Unclassified"

        postal_hub_obj = {
            "pincode": pincode,
            "name": hub_name,
            "tenantId": "kl",
            "rowVersion": 1,
            "classification": classification
        }
        postal_hubs.append(postal_hub_obj)

batch_size = 100
total = len(postal_hubs)

log(f"Starting batch upload: {total} postal hubs, batch size = {batch_size}")

batch_number = 1
for batch in chunks(postal_hubs, batch_size):
    payload = {
        "RequestInfo": request_info,
        "PostalHubs": batch
    }
    try:
        response = requests.post(url, headers=headers, json=payload)
        if response.status_code in (200, 201, 202):
            log(f"✅ Batch {batch_number} uploaded successfully with {len(batch)} items")
        else:
            log(f"❌ Batch {batch_number} failed: Status {response.status_code} | Response: {response.text}")
    except Exception as e:
        log(f"⚠️ Error on batch {batch_number}: {e}")
    batch_number += 1

log("Batch upload complete.")
