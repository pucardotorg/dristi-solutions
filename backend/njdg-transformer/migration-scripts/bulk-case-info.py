import requests
import json
import time
import os
from datetime import datetime

# ---------------------------
# CONFIGURATION
# ---------------------------

BASE_URL = ""
NJDG_TRANSFORMER_URL = "http://localhost:9080/njdg-transformer/njdg/v1"
TENANT_ID = "kl"
AUTH_TOKEN = "fb852a8d-6a61-4741-a694-e42444315a6a"

# ---------------------------
# COMMON REQUEST INFO
# ---------------------------

REQUEST_INFO = {
    "apiId": "Rainmaker",
    "authToken": "162a4e28-18df-4cb5-b3b8-2188c1195182",
    "userInfo": {
        "id": 99,
        "uuid": "a4a1298e-c087-4e4e-9c09-d7cdf49c264c",
        "userName": "gCourt",
        "name": "gCourt",
        "mobileNumber": "7567565675",
        "emailId": "gdfgd@dfgdf.com",
        "locale": None,
        "type": "EMPLOYEE",
        "roles": [
            {
                "name": "APPLICATION_RESPONDER",
                "code": "APPLICATION_RESPONDER",
                "tenantId": "kl",
                "courtId": "KLKM52",
            },
            {
                "name": "ORDER_APPROVER",
                "code": "ORDER_APPROVER",
                "tenantId": "kl",
                "courtId": "KLKM52",
            },
            {
                "name": "HEARING_APPROVER",
                "code": "HEARING_APPROVER",
                "tenantId": "kl",
                "courtId": "KLKM52",
            },
            {
                "name": "TASK_VIEWER",
                "code": "TASK_VIEWER",
                "tenantId": "kl",
                "courtId": "KLKM52",
            },
            {
                "name": "DEPOSITION_PUBLISHER",
                "code": "DEPOSITION_PUBLISHER",
                "tenantId": "kl",
                "courtId": "KLKM52",
            },
            {
                "name": "HEARING_VIEWER",
                "code": "HEARING_VIEWER",
                "tenantId": "kl",
                "courtId": "KLKM52",
            },
            {
                "name": "SUBMISSION_RESPONDER",
                "code": "SUBMISSION_RESPONDER",
                "tenantId": "kl",
                "courtId": "KLKM52",
            },
            {
                "name": "WORKFLOW_ABANDON",
                "code": "WORKFLOW_ABANDON",
                "tenantId": "kl",
                "courtId": "KLKM52",
            },
            {
                "name": "ORDER_CREATOR",
                "code": "ORDER_CREATOR",
                "tenantId": "kl",
                "courtId": "KLKM52",
            },
            {
                "name": "EVIDENCE_CREATOR",
                "code": "EVIDENCE_CREATOR",
                "tenantId": "kl",
                "courtId": "KLKM52",
            },
            {
                "name": "EVIDENCE_EDITOR",
                "code": "EVIDENCE_EDITOR",
                "tenantId": "kl",
                "courtId": "KLKM52",
            },
            {
                "name": "APPLICATION_CREATOR",
                "code": "APPLICATION_CREATOR",
                "tenantId": "kl",
                "courtId": "KLKM52",
            },
            {
                "name": "HEARING_CREATOR",
                "code": "HEARING_CREATOR",
                "tenantId": "kl",
                "courtId": "KLKM52",
            },
            {
                "name": "SUBMISSION_APPROVER",
                "code": "SUBMISSION_APPROVER",
                "tenantId": "kl",
                "courtId": "KLKM52",
            },
            {
                "name": "Workflow Admin",
                "code": "WORKFLOW_ADMIN",
                "tenantId": "kl",
                "courtId": "KLKM52",
            },
            {
                "name": "TASK_CREATOR",
                "code": "TASK_CREATOR",
                "tenantId": "kl",
                "courtId": "KLKM52",
            },
            {
                "name": "APPLICATION_APPROVER",
                "code": "APPLICATION_APPROVER",
                "tenantId": "kl",
                "courtId": "KLKM52",
            },
            {
                "name": "Court Room Manager",
                "code": "COURT_ROOM_MANAGER",
                "tenantId": "kl",
                "courtId": "KLKM52",
            },
            {
                "name": "HEARING_SCHEDULER",
                "code": "HEARING_SCHEDULER",
                "tenantId": "kl",
                "courtId": "KLKM52",
            },
            {
                "name": "APPLICATION_REJECTOR",
                "code": "APPLICATION_REJECTOR",
                "tenantId": "kl",
                "courtId": "KLKM52",
            },
            {
                "name": "CASE_EDITOR",
                "code": "CASE_EDITOR",
                "tenantId": "kl",
                "courtId": "KLKM52",
            },
            {
                "name": "ORDER_REASSIGN",
                "code": "ORDER_REASSIGN",
                "tenantId": "kl",
                "courtId": "KLKM52",
            },
            {
                "name": "HEARING_EDITOR",
                "code": "HEARING_EDITOR",
                "tenantId": "kl",
                "courtId": "KLKM52",
            },
            {
                "name": "ORDER_VIEWER",
                "code": "ORDER_VIEWER",
                "tenantId": "kl",
                "courtId": "KLKM52",
            },
            {
                "name": "SUBMISSION_CREATOR",
                "code": "SUBMISSION_CREATOR",
                "tenantId": "kl",
                "courtId": "KLKM52",
            },
            {
                "name": "Employee",
                "code": "EMPLOYEE",
                "tenantId": "kl",
                "courtId": "KLKM52",
            },
        ],
        "active": True,
        "tenantId": "kl",
        "permanentCity": None,
    },
    "msgId": "1759469519099|en_IN",
    "plainAccessRequest": {},
}
headers = {"accept": "application/json", "content-type": "application/json"}

# ---------------------------
# DIRECTORY SETUP
# ---------------------------

os.makedirs("processed_cases", exist_ok=True)
os.makedirs("errors", exist_ok=True)
ERROR_FILE = "errors/error_log.json"

# ---------------------------
# ERROR LOGGING
# ---------------------------


def log_error(entry):
    """Append errors to a single file."""
    existing = []
    if os.path.exists(ERROR_FILE):
        with open(ERROR_FILE, "r") as f:
            try:
                existing = json.load(f)
            except json.JSONDecodeError:
                existing = []

    entry["timestamp"] = datetime.now().isoformat()
    existing.append(entry)

    with open(ERROR_FILE, "w") as f:
        json.dump(existing, f, indent=4)


# ---------------------------
# BUILD SEARCH PAYLOAD
# ---------------------------


def build_search_payload():
    return {
        "criteria": [
            {
                "pagination": {"limit": 50, "offset": 0},
                "status": ["CASE_DISMISSED", "CASE_ADMITTED", "PENDING_RESPONSE"]
            }
        ],
        "flow": "flow_jac",
        "tenantId": TENANT_ID,
        "RequestInfo": REQUEST_INFO,
    }


# ---------------------------
# FETCH CASES
# ---------------------------


def fetch_cases():
    url = "http://localhost:8089/case/v1/_search"

    print(f"Fetching cases from: {url}")
    response = requests.post(
        url, headers=headers, data=json.dumps(build_search_payload())
    )

    if response.status_code != 200:
        log_error(
            {
                "stage": "fetch_cases",
                "error": f"{response.status_code}: {response.text}",
            }
        )
        return []

    try:
        data = response.json()
    except json.JSONDecodeError as e:
        log_error({"stage": "fetch_cases", "error": f"Invalid JSON: {str(e)}"})
        return []

    # ✅ Extract cases from criteria[0]["responseList"]
    criteria_list = data.get("criteria", [])
    if not criteria_list or "responseList" not in criteria_list[0]:
        print("⚠️ No responseList found in response.")
        return []

    response_list = criteria_list[0].get("responseList", [])
    # Filter out any empty dicts
    cases = [case for case in response_list if case]
    print(f"✅ Retrieved {len(cases)} cases.")
    return cases


# ---------------------------
# PROCESS CASE
# ---------------------------


def process_case(case):
    case_id = case.get("caseId") or case.get("id")
    cnr_number = case.get("cnrNumber") or case.get("cnr_number") or f"case_{case_id}"

    print(f"\n➡️ Processing case: {case_id} | CNR: {cnr_number}")

    results = {"caseId": case_id, "cnrNumber": cnr_number, "status": "processing"}

    # 1️⃣ Process Case
    case_payload = {"RequestInfo": REQUEST_INFO, "cases": case}
    try:
        res_case = requests.post(
            f"{NJDG_TRANSFORMER_URL}/_processcase",
            headers=headers,
            data=json.dumps(case_payload),
        )
        res_case.raise_for_status()
        results["caseResponse"] = res_case.json()
        print(f"✅ Case processed: {case_id}")
    except Exception as e:
        error_msg = str(e)
        log_error({"stage": "process_case", "caseId": case_id, "error": error_msg})
        results["caseError"] = error_msg

        # 🚫 Stop further processing if case failed
        results["status"] = "failed"
    
    # Save processed case result
    file_path = f"processed_cases/{cnr_number}.json"
    with open(file_path, "w") as f:
        json.dump(results, f, indent=4)

    print(f"💾 Saved case results to {file_path}")
    return results


# ---------------------------
# MAIN
# ---------------------------


def main():
    cases = fetch_cases()
    for case in cases:
        process_case(case)
        time.sleep(0.5)

    print(
        "\n✅ All cases processed. Check 'processed_cases/' and 'errors/error_log.json'"
    )


if __name__ == "__main__":
    main()
