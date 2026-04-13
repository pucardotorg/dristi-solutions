import logging
import os
import requests

# ─────────────────────────────────────────────────────────────────────────────
# Config / Constants
# ─────────────────────────────────────────────────────────────────────────────

BATCH_SIZE = 100
INITIAL_OFFSET = 0
TENANT_ID = "kl"
CASE_PORT = 8030

case_search_api = f"http://localhost:{CASE_PORT}/case/v1/_search"
case_update_api = f"http://localhost:{CASE_PORT}/case/v2/_update"

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
    "Referer": "http://localhost:3000/",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
    ),
    "sec-ch-ua": '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Linux"',
}

# ─────────────────────────────────────────────────────────────────────────────
# Logging setup
# ─────────────────────────────────────────────────────────────────────────────

os.makedirs("logs", exist_ok=True)

logger = logging.getLogger("ifsc_migration")
logger.setLevel(logging.INFO)

file_handler = logging.FileHandler("logs/ifsc_migration.log", encoding="utf-8")
file_handler.setFormatter(logging.Formatter("%(levelname)s: %(message)s"))
logger.addHandler(file_handler)

console_handler = logging.StreamHandler()
console_handler.setFormatter(logging.Formatter("%(levelname)s: %(message)s"))
logger.addHandler(console_handler)

SKIPPED = "SKIPPED"
SUCCESS = "SUCCESS"

# Cases in these statuses are still editable → readOnly = False
BANK_DETAILS_EDITABLE_STATUSES = {
    "CASE_REASSIGNED",
    "PENDING_E-SIGN",
    "PENDING_RE_E-SIGN",
    "RE_PENDING_PAYMENT",
    "UNDER_SCRUTINY",
    "PENDING_SIGN",
    "DRAFT_IN_PROGRESS",
    "PENDING_PAYMENT",
    "PENDING_RE_SIGN",
}
FAILED = "FAILED"
UNKNOWN = "UNKNOWN"
IGNORED = "IGNORED"


def log_status(filing_number, status, details=None):
    message = f"{filing_number} | {status}" + (f" | {details}" if details else "")
    if status.upper() in [FAILED, UNKNOWN]:
        logger.error(message)
    else:
        logger.info(message)


# ─────────────────────────────────────────────────────────────────────────────
# API helpers
# ─────────────────────────────────────────────────────────────────────────────

def fetch_case_count():
    payload = {
        "criteria": [{"pagination": {"limit": 0, "offSet": 0}}],
        "RequestInfo": request_info,
    }
    try:
        response = requests.post(case_search_api, headers=headers, json=payload)
        response.raise_for_status()
        return (
            response.json()
            .get("criteria", [])[0]
            .get("pagination", {})
            .get("totalCount", 0)
        )
    except Exception as e:
        logger.error(f"Error fetching case count: {e}")
        return 0


def fetch_cases_by_offset(offset):
    payload = {
        "criteria": [{"pagination": {"limit": BATCH_SIZE, "offSet": offset}}],
        "RequestInfo": request_info,
    }
    try:
        response = requests.post(case_search_api, headers=headers, json=payload)
        response.raise_for_status()
        return response.json().get("criteria", [])[0].get("responseList", [])
    except Exception as e:
        logger.error(f"Error fetching cases at offset {offset}: {e}")
        return []


def fetch_case_by_filing_number(filing_number):
    payload = {
        "criteria": [{"filingNumber": filing_number}],
        "RequestInfo": request_info,
    }
    try:
        response = requests.post(case_search_api, headers=headers, json=payload)
        response.raise_for_status()
        cases = response.json().get("criteria", [])[0].get("responseList", [])
        return cases[0] if cases else None
    except Exception as e:
        logger.error(f"Error fetching case {filing_number}: {e}")
        return None


def call_case_update_api(case):
    payload = {
        "RequestInfo": request_info,
        "cases": case,
    }
    try:
        return requests.post(case_update_api, headers=headers, json=payload)
    except Exception as e:
        logger.error(f"Error calling update API: {e}")
        return None


# ─────────────────────────────────────────────────────────────────────────────
# Migration logic
# ─────────────────────────────────────────────────────────────────────────────

def needs_migration(data: dict) -> bool:
    """
    Returns True if this cheque data entry is in the OLD structure:
    - has a top-level `ifsc` field, AND
    - does NOT already have `payeeIfscField`
    """
    has_old_ifsc = "ifsc" in data
    has_new_payee = "payeeIfscField" in data
    return has_old_ifsc and not has_new_payee


def migrate_cheque_entry(data: dict, read_only: bool) -> dict:
    """
    Migrates a single cheque `data` dict from the old IFSC structure to the new one.
    Copies `ifsc` into `payeeIfscField.payeeIfsc`.
    BankReadOnly / BranchReadOnly are set to `read_only`.
    The original `ifsc` field is removed.
    """
    ifsc_value = data.get("ifsc")
    data["payeeIfscField"] = {"payeeIfsc": ifsc_value, "BankReadOnly": read_only, "BranchReadOnly": read_only}
    return data


def migrate_case(case: dict) -> bool:
    """
    Inspects the chequeDetails formdata of a case and migrates any old-structure
    IFSC entries in-place.

    BankReadOnly / BranchReadOnly are set to False when the case status is in
    EDITABLE_STATUSES, and True otherwise.

    Returns True if at least one entry was migrated, False otherwise.
    """
    filing_number = case.get("filingNumber")
    status = case.get("status", "")
    read_only = status not in BANK_DETAILS_EDITABLE_STATUSES

    cheque_details = (
        case.get("caseDetails", {})
        .get("chequeDetails", {})
    )

    formdata = cheque_details.get("formdata", [])
    if not formdata:
        log_status(filing_number, SKIPPED, "No chequeDetails formdata found")
        return False

    migrated_count = 0
    for entry in formdata:
        data = entry.get("data", {})
        if not isinstance(data, dict):
            continue
        if needs_migration(data):
            migrate_cheque_entry(data, read_only=read_only)
            migrated_count += 1

    if migrated_count == 0:
        log_status(filing_number, SKIPPED, "All cheque entries already in new IFSC structure")
        return False

    logger.info(f"{filing_number} | status={status!r} read_only={read_only} | Migrated {migrated_count} cheque entry/entries")
    return True


def process_cases(cases: list):
    """
    For each case in the list, checks if IFSC migration is needed and, if so,
    calls the case update API.
    """
    for case in cases:
        filing_number = case.get("filingNumber", "UNKNOWN")

        try:
            was_migrated = migrate_case(case)
            if not was_migrated:
                continue

            response = call_case_update_api(case)

            if response is None:
                log_status(filing_number, UNKNOWN, "No response from case update API")
                continue

            response.raise_for_status()
            log_status(filing_number, SUCCESS, {"statusCode": response.status_code})

        except Exception as e:
            log_status(filing_number, FAILED, f"Unexpected error: {e}")


# ─────────────────────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description=(
            "Migrate chequeDetails IFSC field from old single-field structure "
            "to new payeeIfscField  structure."
        )
    )
    parser.add_argument(
        "--filing-number",
        help="Run migration for a single case (by filing number) instead of all cases.",
        default=None,
    )
    args = parser.parse_args()

    if args.filing_number:
        # ── Single-case mode ──────────────────────────────────────────────────
        filing_number = args.filing_number
        print(f"Fetching case for filing number: {filing_number}")
        case = fetch_case_by_filing_number(filing_number)
        if not case:
            logger.warning(f"No case found for filing number: {filing_number}")
        else:
            process_cases([case])
    else:
        # ── Batch mode ────────────────────────────────────────────────────────
        try:
            case_count = fetch_case_count()
            print(f"Total case count: {case_count}")
            offset = INITIAL_OFFSET

            while offset < case_count:
                print(f"Processing offset: {offset}")
                batch_cases = fetch_cases_by_offset(offset)

                if not batch_cases:
                    logger.warning(f"No cases returned for offset {offset}")
                else:
                    process_cases(batch_cases)

                offset += BATCH_SIZE

        except Exception as e:
            logger.error(f"Fatal error during migration: {e}")
