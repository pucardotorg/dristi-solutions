import requests
import csv
import json
import logging

# need to update the request info to run the script
request_info = {
  "apiId": "Rainmaker",
  "authToken": "5e0e44a4-e0d2-41d7-bf44-78b8240085a8",
  "userInfo": {
    "id": 366,
    "uuid": "07165754-3724-401f-9f4c-964bf3ea08fb",
    "userName": "9628624667",
    "name": "TestOne  ",
    "mobileNumber": "9628624667",
    "emailId": "saurbh@gmail.com",
    "locale": None,
    "type": "EMPLOYEE",
    "roles": [
                 {
                "name": "SYSTEM_ADMIN",
                "code": "SYSTEM_ADMIN",
                "tenantId": "kl",
            },
            {"name": "Employee", "code": "EMPLOYEE", "tenantId": "kl"},
            {"name": "PAYMENT_COLLECTOR", "code": "PAYMENT_COLLECTOR", "tenantId": "kl"}
    ],
    "active": True,
    "tenantId": "kl",
    "permanentCity": None
  },
  "msgId": "1751275409470|en_IN",
  "plainAccessRequest": {}
}

headers = {
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
    "Connection": "keep-alive",
    "Content-Type": "application/json;charset=UTF-8",
    "Origin": "http://localhost:3000",
    "Referer": "http://localhost:3000/digit-ui/employee/dristi/registration-requests/details/CLERK-2024-04-29-000123?individualId=IND-2024-04-29-000144&isAction=True",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "sec-ch-ua": '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Linux"',
}

hearing_search_endpoint = "http://localhost:8080/hearing/v1/search?_=1751004167346"
scheduler_endpoint = "http://localhost:8080/hearing/v1/close-payment-pending-tasks?tenantId=kl"

TENANT_ID = "kl"

logging.basicConfig(
    filename="update_hearing_error.log",
    level=logging.ERROR,
    format="%(asctime)s - %(levelname)s - %(message)s",
)


def update_to_scheduler(hearing):
    body = {"RequestInfo": request_info, "hearing": hearing}
    update_scheduler_response = requests.post(
        scheduler_endpoint, headers=headers, json=body
    )
    return update_scheduler_response


def fetch_hearing_fnc(url, headers, request_info, criteria, tenantId):
    payload = {
        "criteria": criteria,
        "RequestInfo": request_info,
    }
    try:

        response = requests.post(url, json=payload, headers=headers)
        try:
            response.raise_for_status()
            response_as_json = response.json()
            print(response_as_json)
            return response_as_json.get("HearingList", [])
        except requests.RequestException as e:
            logging.error(
                f"Error during hearing search: {e} , response : {response.json()}"
            )
            return []
    except Exception as e:
        logging.error(f"An unexpected error occurred: {e}")
        return []


if __name__ == "__main__":
    try:
        hearings = fetch_hearing_fnc(
            url=hearing_search_endpoint,
            headers=headers,
            request_info=request_info,
            criteria={"tenantId": "kl", "courtId": "KLKM52","filingNumber" : "KL-001268-2025"},
            tenantId=TENANT_ID,
        )
        print(len(hearings))
        filtered_hearings = [
            hearing
            for hearing in hearings
            if hearing.get("status") in ("ABANDONED", "COMPLETED")
        ]
        print(len(filtered_hearings))
        with open("update_hearings_logs.csv", "a", newline="") as f:
            writer = csv.writer(f)

            if f.tell() == 0:
                writer.writerow(["hearingId", "Status"])

            for hearing in filtered_hearings:
                response = update_to_scheduler(hearing)
                if response and response.status_code != 200:
                    print(response)
                    writer.writerow(
                        [
                            hearing["hearingId"],
                            response,
                        ]
                    )
                else:
                    writer.writerow([hearing["hearingId"], "Success"])
    except Exception as e:
        logging.error(f"Error during hearing search: {e}")