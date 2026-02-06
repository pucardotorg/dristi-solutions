import requests
import csv

env_url = "https://dristi-kerala-dev.pucar.org"
headers = {
    "accept": "application/json, text/plain, */*",
    "accept-language": "en-GB,en;q=0.9",
    "content-type": "application/json;charset=UTF-8",
    "sec-ch-ua": '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Linux"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
}
RequestInfo = {
    "apiId": "Rainmaker",
    "authToken": "41f7773b-5635-490a-bfea-606419181e35",
    "userInfo": {
        "id": 1929,
        "uuid": "b3838be4-d71d-4a01-91b2-0726c16cf2e8",
        "userName": "gCourt",
        "name": "Court-Staff",
        "mobileNumber": "1002335566",
        "emailId": None,
        "locale": None,
        "type": "EMPLOYEE",
        "roles": [
            {
                "name": "HEARING_VIEWER",
                "code": "HEARING_VIEWER",
                "tenantId": "kl",
            },
            {
                "name": "WORKFLOW_ABANDON",
                "code": "WORKFLOW_ABANDON",
                "tenantId": "kl",
            },
            {
                "name": "Workflow Admin",
                "code": "WORKFLOW_ADMIN",
                "tenantId": "kl",
            },
            {
                "name": "APPLICATION_CREATOR",
                "code": "APPLICATION_CREATOR",
                "tenantId": "kl",
            },
            {
                "name": "Court Room Manager",
                "code": "COURT_ROOM_MANAGER",
                "tenantId": "kl",
            },
            {
                "name": "DEPOSITION_PUBLISHER",
                "code": "DEPOSITION_PUBLISHER",
                "tenantId": "kl",
            },
            {
                "name": "HEARING_APPROVER",
                "code": "HEARING_APPROVER",
                "tenantId": "kl",
            },
            {
                "name": "APPLICATION_RESPONDER",
                "code": "APPLICATION_RESPONDER",
                "tenantId": "kl",
            },
            {
                "name": "SUBMISSION_RESPONDER",
                "code": "SUBMISSION_RESPONDER",
                "tenantId": "kl",
            },
            {"name": "ORDER_VIEWER", "code": "ORDER_VIEWER", "tenantId": "kl"},
            {
                "name": "ORDER_REASSIGN",
                "code": "ORDER_REASSIGN",
                "tenantId": "kl",
            },
            {"name": "CASE_EDITOR", "code": "CASE_EDITOR", "tenantId": "kl"},
            {"name": "TASK_CREATOR", "code": "TASK_CREATOR", "tenantId": "kl"},
            {
                "name": "APPLICATION_APPROVER",
                "code": "APPLICATION_APPROVER",
                "tenantId": "kl",
            },
            {
                "name": "SUBMISSION_CREATOR",
                "code": "SUBMISSION_CREATOR",
                "tenantId": "kl",
            },
            {"name": "Employee", "code": "EMPLOYEE", "tenantId": "kl"},
            {"name": "COURT_ADMIN", "code": "COURT_ADMIN", "tenantId": "kl"},
            {"name": "CASE_VIEWER", "code": "CASE_VIEWER", "tenantId": "kl"},
            {"name": "TASK_EDITOR", "code": "TASK_EDITOR", "tenantId": "kl"},
            {
                "name": "APPLICATION_REJECTOR",
                "code": "APPLICATION_REJECTOR",
                "tenantId": "kl",
            },
            {
                "name": "ORDER_APPROVER",
                "code": "ORDER_APPROVER",
                "tenantId": "kl",
            },
            {
                "name": "EVIDENCE_CREATOR",
                "code": "EVIDENCE_CREATOR",
                "tenantId": "kl",
            },
            {
                "name": "EVIDENCE_EDITOR",
                "code": "EVIDENCE_EDITOR",
                "tenantId": "kl",
            },
            {
                "name": "CASE_APPROVER",
                "code": "CASE_APPROVER",
                "tenantId": "kl",
            },
            {
                "name": "SUBMISSION_APPROVER",
                "code": "SUBMISSION_APPROVER",
                "tenantId": "kl",
            },
            {"name": "TASK_VIEWER", "code": "TASK_VIEWER", "tenantId": "kl"},
        ],
        "active": True,
        "tenantId": "kl",
        "permanentCity": None,
    },
    "msgId": "1741081826692|en_IN",
    "plainAccessRequest": {},
}


hearing_search_endpoint = "http://localhost:8030/hearing/v1/search"

scheduler_endpoint = "http://localhost:8060/transformer/v1/openHearing"


def update_to_scheduler(hearing):
    body = {"RequestInfo": RequestInfo, "hearing": hearing}
    update_scheduler_response = requests.post(
        scheduler_endpoint, headers=headers, json=body
    )
    print(update_scheduler_response)
    return update_scheduler_response


def fetch_all_hearing():
    hearing_search_request = {
        "criteria": {"tenantId": "kl"},
        "RequestInfo": RequestInfo,
    }

    hearing_response = requests.post(
        hearing_search_endpoint, headers=headers, json=hearing_search_request
    ).json()
    hearing_response_list = hearing_response["HearingList"]
    print(len(hearing_response_list))
    with open("update_hearings_uat.csv", "a", newline="") as f:
        writer = csv.writer(f)

        if f.tell() == 0:
            writer.writerow(["Hearing ID", "Filing number", "Status"])

        for hearing in hearing_response_list:
            response = update_to_scheduler(hearing)
            if  response.status_code != 200:
                print(response)
                writer.writerow(
                    [
                        hearing["hearingId"],
                        hearing["filingNumber"],
                        response,
                    ]
                )
                # break
            else:
                writer.writerow(
                    [hearing["hearingId"], hearing["filingNumber"], "Success"]
                )
            # break


fetch_all_hearing()