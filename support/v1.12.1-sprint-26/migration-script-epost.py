import csv
import requests

postal_hub = {}

# Read the CSV
with open("postal-hub-mapping.csv", newline="") as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        hub_name = row["Oncourts System"].strip()
        pincode = row["Pincode"].strip()

        if hub_name in postal_hub:
            postal_hub[hub_name].add(pincode)
        else:
            postal_hub[hub_name] = {pincode}

url = "https://{{env}}/egov-mdms-service/v2/_create"
headers = {
    "Accept": "application/json, text/plain, */*",
    "Content-Type": "application/json;charset=UTF-8",
    "Referer": "https://dristi-kerala-dev.pucar.org/workbench-ui/employee/workbench/mdms-add-v2?moduleName=Epost&masterName=PostalHubs",
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64)",
}

auth_token = "YOUR_VALID_AUTH_TOKEN"
tenant_id = "kl"

id = 1

for hub, pins in postal_hub.items():
    pins_list = sorted(list(pins))  # sorted for nice printing

    print("\n--------------------------------------------")
    print(f"📦 Hub Name: {hub}")
    print(f"📮 Total Pincodes: {len(pins_list)}")
    print(f"🗺️  Pincode List: {', '.join(pins_list)}")
    print("--------------------------------------------")

    body = {
        "Mdms": {
            "tenantId": tenant_id,
            "schemaCode": "Epost.PostalHubs",
            "uniqueIdentifier": None,
            "data": {
                "pinCodes": pins_list,
                "id": str(id),
                "postHubName": hub,
            },
            "isActive": True,
        },
        "RequestInfo": {
            "apiId": "Rainmaker",
            "authToken": auth_token,
            "msgId": "1741271002980|en_IN",
            "plainAccessRequest": {},
        },
    }

    try:
        response = requests.post(url, headers=headers, json=body)
        if response.status_code == 202:
            print(f"✅ Successfully created hub: {hub}")
        else:
            print(f"❌ Failed for {hub}: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"⚠️ Error for {hub}: {e}")

    id += 1