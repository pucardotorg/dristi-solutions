import requests
import csv
import json
import logging
 
request_info = {
    "apiId": "Rainmaker",
    "authToken": "e1772d99-79a6-4bd7-9303-be8bf4819d63",
    "userInfo": {
        "id": 97,
        "uuid": "3bfd36bb-9717-4541-a035-51476f5a4d7a",
        "userName": "gJudge",
        "name": "Judge",
        "mobileNumber": "1002335566",
        "emailId": None,
        "locale": None,
        "type": "CITIZEN",
        "roles": [
            {"name": "DIARY_APPROVER", "code": "DIARY_APPROVER", "tenantId": "kl"},
            {"name": "HEARING_VIEWER", "code": "HEARING_VIEWER", "tenantId": "kl"},
            {"name": "WORKFLOW_ABANDON", "code": "WORKFLOW_ABANDON", "tenantId": "kl"},
            {"name": "ORDER_ESIGN", "code": "ORDER_ESIGN", "tenantId": "kl"},
            {"name": "Workflow Admin", "code": "WORKFLOW_ADMIN", "tenantId": "kl"},
            {
                "name": "APPLICATION_CREATOR",
                "code": "APPLICATION_CREATOR",
                "tenantId": "kl",
            },
            {
                "name": "DEPOSITION_PUBLISHER",
                "code": "DEPOSITION_PUBLISHER",
                "tenantId": "kl",
            },
            {"name": "HEARING_APPROVER", "code": "HEARING_APPROVER", "tenantId": "kl"},
            {"name": "ORDER_VIEWER", "code": "ORDER_VIEWER", "tenantId": "kl"},
            {
                "name": "SUBMISSION_RESPONDER",
                "code": "SUBMISSION_RESPONDER",
                "tenantId": "kl",
            },
            {"name": "ORDER_REASSIGN", "code": "ORDER_REASSIGN", "tenantId": "kl"},
            {"name": "CASE_EDITOR", "code": "CASE_EDITOR", "tenantId": "kl"},
            {
                "name": "APPLICATION_APPROVER",
                "code": "APPLICATION_APPROVER",
                "tenantId": "kl",
            },
            {"name": "TASK_CREATOR", "code": "TASK_CREATOR", "tenantId": "kl"},
            {"name": "DIARY_VIEWER", "code": "DIARY_VIEWER", "tenantId": "kl"},
            {"name": "Employee", "code": "EMPLOYEE", "tenantId": "kl"},
            {"name": "ORDER_DELETE", "code": "ORDER_DELETE", "tenantId": "kl"},
            {
                "name": "NOTIFICATION_APPROVER",
                "code": "NOTIFICATION_APPROVER",
                "tenantId": "kl",
            },
            {"name": "CASE_VIEWER", "code": "CASE_VIEWER", "tenantId": "kl"},
            {"name": "HEARING_EDITOR", "code": "HEARING_EDITOR", "tenantId": "kl"},
            {
                "name": "APPLICATION_REJECTOR",
                "code": "APPLICATION_REJECTOR",
                "tenantId": "kl",
            },
            {"name": "TASK_EDITOR", "code": "TASK_EDITOR", "tenantId": "kl"},
            {"name": "DIARY_EDITOR", "code": "DIARY_EDITOR", "tenantId": "kl"},
            {"name": "ORDER_APPROVER", "code": "ORDER_APPROVER", "tenantId": "kl"},
            {
                "name": "NOTIFICATION_CREATOR",
                "code": "NOTIFICATION_CREATOR",
                "tenantId": "kl",
            },
            {"name": "HEARING_CREATOR", "code": "HEARING_CREATOR", "tenantId": "kl"},
            {"name": "ORDER_CREATOR", "code": "ORDER_CREATOR", "tenantId": "kl"},
            {"name": "EVIDENCE_CREATOR", "code": "EVIDENCE_CREATOR", "tenantId": "kl"},
            {
                "name": "CALCULATION_VIEWER",
                "code": "CALCULATION_VIEWER",
                "tenantId": "kl",
            },
            {"name": "JUDGE_ROLE", "code": "JUDGE_ROLE", "tenantId": "kl"},
            {"name": "EVIDENCE_EDITOR", "code": "EVIDENCE_EDITOR", "tenantId": "kl"},
            {"name": "CASE_APPROVER", "code": "CASE_APPROVER", "tenantId": "kl"},
            {
                "name": "SUBMISSION_APPROVER",
                "code": "SUBMISSION_APPROVER",
                "tenantId": "kl",
            },
            {"name": "TASK_VIEWER", "code": "TASK_VIEWER", "tenantId": "kl"},
            {
                "name": "HEARING_SCHEDULER",
                "code": "HEARING_SCHEDULER",
                "tenantId": "kl",
            },
        ],
        "active": True,
        "tenantId": "kl",
        "permanentCity": None,
    },
    "msgId": "1744786946015|en_IN",
    "plainAccessRequest": {},
}
 
headers = {
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
    "Connection": "keep-alive",
    "Content-Type": "application/json;charset=UTF-8",
    "Origin": "http://localhost:3000",
    "Referer": "http://localhost:3000/digit-ui/employee/dristi/registration-requests/details/CLERK-2024-04-29-000123?individualId=IND-2024-04-29-000144&isAction=true",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "sec-ch-ua": '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Linux"',
}
 
search_cases_api = "http://localhost:8030/case/v1/_search"
 
TENANT_ID = "kl"
 
logging.basicConfig(
    filename="update_case_error.log",
    level=logging.ERROR,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
 
scheduler_endpoint = "http://localhost:8060/transformer/v1/script/case-request"
 
 
def update_to_scheduler(case):
    body = {"RequestInfo": request_info, "cases": case}
    update_scheduler_response = requests.post(
        scheduler_endpoint, headers=headers, json=body
    )
    return update_scheduler_response
 
 
def fetch_cases_fnc(url, headers, request_info, criteria, tenantId):
    payload = {
        "criteria": criteria,
        # "flow": "flow_jac",
        "tenantId": tenantId,
        "RequestInfo": request_info,
    }
    try:
 
        response = requests.post(url, json=payload, headers=headers)
        try:
            response.raise_for_status()
            response_as_json = response.json()
            return (
                response_as_json.get("criteria", [])[0].get("responseList", [])
                if len(response_as_json.get("criteria", [])) > 0
                else []
            )
        except requests.RequestException as e:
            logging.error(
                f"Error during case search: {e} , response : {response.json()}"
            )
            return []
    except Exception as e:
        logging.error(f"An unexpected error occurred: {e}")
        return []
 
 
if __name__ == "__main__":
    try:
        cases = fetch_cases_fnc(
            url=search_cases_api,
            headers=headers,
            request_info=request_info,
            criteria=[ {
            # "filingNumber": "KL-000806-2025",
            "courtId": "KLKM52"
        }],
            tenantId=TENANT_ID,
        )
        print(len(cases))
 
        with open("update_cases_logs.csv", "a", newline="") as f:
            writer = csv.writer(f)
 
            if f.tell() == 0:
                writer.writerow(["filingNumber", "Status"])
 
            for case in cases:
                response = update_to_scheduler(case)
                if response and response.status_code != 200:
                    # print(response)
                    writer.writerow(
                        [
                            case["filingNumber"],
                            response,
                        ]
                    )
                else:
                    writer.writerow([case["filingNumber"], "Success"])
    except Exception as e:
        logging.error(f"Error during case search: {e}")