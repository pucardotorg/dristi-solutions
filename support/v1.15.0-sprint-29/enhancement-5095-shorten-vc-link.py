import requests
import json

# Constants
request_info = {
    "apiId": "Rainmaker",
    "authToken": "877e7f5d-148a-412b-9585-f5030b7f0773",
    "userInfo": {
        "id": 2122,
        "uuid": "9e54367b-057a-4c51-8eba-578ae12478a5",
        "userName": "michaelGeorgeFso",
        "name": "michaelGeorgeFso",
        "mobileNumber": "9394534754",
        "emailId": "michaelGeorgeFso@gmail.com",
        "locale": None,
        "type": "EMPLOYEE",
        "roles": [
            {"name": "FSO_ROLE", "code": "FSO_ROLE", "tenantId": "kl"},
            {"name": "CASE_VIEWER", "code": "CASE_VIEWER", "tenantId": "kl"},
            {"name": "HEARING_VIEWER", "code": "HEARING_VIEWER", "tenantId": "kl"},
            {"name": "HEARING_APPROVER", "code": "HEARING_APPROVER", "tenantId": "kl"},
            {"name": "CASE_REVIEWER", "code": "CASE_REVIEWER", "tenantId": "kl"},
            {"name": "ORDER_VIEWER", "code": "ORDER_VIEWER", "tenantId": "kl"},
            {"name": "ORDER_REASSIGN", "code": "ORDER_REASSIGN", "tenantId": "kl"},
            {"name": "CASE_EDITOR", "code": "CASE_EDITOR", "tenantId": "kl"},
            {"name": "ORDER_APPROVER", "code": "ORDER_APPROVER", "tenantId": "kl"},
            {"name": "Employee", "code": "EMPLOYEE", "tenantId": "kl"},
            {
                "name": "General Court Room Manager",
                "code": "GENERAL_COURT_ROOM_MANAGER",
                "tenantId": "kl",
            },
        ],
        "active": True,
        "tenantId": "kl",
        "permanentCity": None,
    },
    "msgId": "1751450401042|en_IN",
    "plainAccessRequest": {},
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

url_shortener_api = "http://localhost:8090/eus/shortener"
vc_link = "https://business.vconsol.com/join/7850075793?be_auth=MjQxMTg1"

def shorten_url(url):

    payload = {
        "referenceId": "vc-link-shortened",
        "url": url
    }

    try:
        response = requests.post(url_shortener_api, headers=headers, json=payload)
        print(response.text)
    except Exception as e:
        print(f"Error occurred while shortening URL: {e}")


if __name__ == "__main__":
    shorten_url(vc_link)
