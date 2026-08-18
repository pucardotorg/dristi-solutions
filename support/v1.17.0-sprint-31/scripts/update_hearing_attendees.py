import csv
import logging
import uuid
import requests

# ─────────────────────────────────────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────────────────────────────────────

CASE_SEARCH_API   = f"http://localhost:8030/case/v1/_search"
HEARING_SEARCH_API = f"http://localhost:8040/hearing/v1/search"
HEARING_UPDATE_API = f"http://localhost:8040/hearing/v1/update"

TENANT_ID = "kl"

CASE_BATCH_SIZE = 100

# ─────────────────────────────────────────────────────────────────────────────
# Hearing statuses that should be EXCLUDED from processing.
# Modify this list as needed.
# ─────────────────────────────────────────────────────────────────────────────
EXCLUDED_HEARING_STATUSES = {"COMPLETED", "ABANDONED"}

# ─────────────────────────────────────────────────────────────────────────────
# Auth / Request headers
# ─────────────────────────────────────────────────────────────────────────────

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
    "Accept-Language": "en-US,en;q=0.9",
    "Connection": "keep-alive",
    "Content-Type": "application/json;charset=UTF-8",
    "Origin": "https://dristi-kerala-qa.pucar.org",
    "Referer": "https://dristi-kerala-qa.pucar.org/ui/employee/hearings",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36"
    ),
    "sec-ch-ua": '"Not A(Brand";v="8", "Chromium";v="132", "Google Chrome";v="132"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Linux"',
}

# ─────────────────────────────────────────────────────────────────────────────
# Logging  (errors → file, progress → stdout via print)
# ─────────────────────────────────────────────────────────────────────────────

logging.basicConfig(
    filename="update_hearing_attendees_error.log",
    level=logging.ERROR,
    format="%(asctime)s - %(levelname)s - %(message)s",
)


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def resolve_party_type(party_type_str: str) -> str:
    """
    Map a litigant's partyType to the attendee type label.
      'complainant.*' → 'complainant'
      'respondent.*'  → 'respondent'
    """
    if not party_type_str:
        return party_type_str
    lower = party_type_str.lower()
    if "complainant" in lower:
        return "complainant"
    if "respondent" in lower:
        return "respondent"
    return party_type_str


# ─────────────────────────────────────────────────────────────────────────────
# API functions  (mirroring the pattern in case_search_index_update.py)
# ─────────────────────────────────────────────────────────────────────────────

def total_case_count(criteria):
    """
    Call /case/v1/_search and return criteria[0].pagination.totalCount.
    Returns 0 on any error.
    """
    payload = {
        "criteria": criteria,
        "tenantId": TENANT_ID,
        "RequestInfo": request_info,
    }
    try:
        response = requests.post(CASE_SEARCH_API, json=payload, headers=headers, timeout=60)
        try:
            response.raise_for_status()
            response_as_json = response.json()
            if len(response_as_json.get("criteria", [])) > 0:
                return (
                    response_as_json.get("criteria", [])[0]
                    .get("pagination", {})
                    .get("totalCount", 0)
                )
            else:
                print(f"No data found when fetching total count: {response_as_json}")
                return 0
        except requests.RequestException as e:
            logging.error(
                f"Error during case search in total_case_count: {e}, "
                f"response: {response.json()}"
            )
            return 0
    except Exception as e:
        logging.error(f"Unexpected error in total_case_count: {e}")
        return 0


def fetch_cases_batch(criteria):
    """
    Call /case/v1/_search and return the responseList for the given criteria page.
    Returns [] on any error.
    """
    payload = {
        "criteria": criteria,
        "tenantId": TENANT_ID,
        "RequestInfo": request_info,
    }
    try:
        response = requests.post(CASE_SEARCH_API, json=payload, headers=headers, timeout=60)
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
                f"Error during fetch_cases_batch: {e}, "
                f"response: {response.json()}, criteria: {criteria}"
            )
            return []
    except Exception as e:
        logging.error(f"Unexpected error in fetch_cases_batch: {e}, criteria: {criteria}")
        return []


def fetch_hearings(filing_number: str):
    """
    Call /hearing/v1/search and return the HearingList array.
    Returns [] on any error.
    """
    payload = {
        "criteria": {
            "filingNumber": filing_number,
            "tenantId": TENANT_ID,
        },
        "RequestInfo": request_info,
    }
    try:
        response = requests.post(HEARING_SEARCH_API, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        return response.json().get("HearingList", [])
    except Exception as e:
        logging.error(f"Error fetching hearings for filingNumber={filing_number}: {e}")
        return []


def update_hearing(hearing: dict):
    """
    Call /hearing/v1/update with the modified hearing object.
    Returns the response object, or None on exception.
    """
    payload = {
        "hearing": hearing,
        "RequestInfo": request_info,
    }
    try:
        response = requests.post(HEARING_UPDATE_API, json=payload, headers=headers, timeout=30)
        return response
    except Exception as e:
        logging.error(f"Unexpected error updating hearing {hearing.get('hearingId')}: {e}")
        return None


# ─────────────────────────────────────────────────────────────────────────────
# Attendee enrichment logic
# ─────────────────────────────────────────────────────────────────────────────

def get_attendee_individual_ids(attendees: list) -> set:
    """Return the set of non-null individualIds already present in attendees."""
    return {a.get("individualId") for a in attendees if a.get("individualId")}


def build_litigant_attendee(litigant: dict) -> dict:
    additional_details = litigant.get("additionalDetails") or {}
    return {
        "id": str(uuid.uuid4()),
        "name": additional_details.get("fullName", ""),
        "type": resolve_party_type(litigant.get("partyType", "")),
        "isOnline": None,
        "wasPresent": None,
        "individualId": litigant.get("individualId"),
        "associatedWith": None,
    }


def build_poa_attendee(poa_holder: dict) -> dict:
    return {
        "id": str(uuid.uuid4()),
        "name": poa_holder.get("name", ""),
        "type": "poaHolder",
        "isOnline": None,
        "wasPresent": None,
        "individualId": poa_holder.get("individualId"),
        "associatedWith": None,
    }


def enrich_attendees(hearing: dict, case: dict) -> bool:
    """
    Append missing litigants / POA holders to hearing['attendees'].
    Returns True if at least one new attendee was added.
    """
    attendees = hearing.get("attendees") or []
    existing_ids = get_attendee_individual_ids(attendees)
    added = 0

    for litigant in (case.get("litigants") or []):
        ind_id = litigant.get("individualId")
        if not ind_id or ind_id in existing_ids:
            continue
        attendees.append(build_litigant_attendee(litigant))
        existing_ids.add(ind_id)
        added += 1

    for poa in (case.get("poaHolders") or []):
        ind_id = poa.get("individualId")
        if not ind_id or ind_id in existing_ids:
            continue
        attendees.append(build_poa_attendee(poa))
        existing_ids.add(ind_id)
        added += 1

    hearing["attendees"] = attendees
    return added > 0


# ─────────────────────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    try:
        # ── Step 1: get total case count ──────────────────────────────────
        criteria = [{"pagination": {"limit": CASE_BATCH_SIZE, "offSet": 0}}]
        total_count = total_case_count(criteria)
        print(f"Total cases to process: {total_count}")

        offset = 0

        with open("update_hearing_attendees_logs.csv", "a", newline="") as f:
            writer = csv.writer(f)

            # Write header only when file is empty
            if f.tell() == 0:
                writer.writerow([
                    "filingNumber", "hearingId", "status", "details"
                ])

            # ── Step 2: paginate through all cases ────────────────────────
            while offset < total_count:
                criteria = [{"pagination": {"limit": CASE_BATCH_SIZE, "offSet": offset}}]
                print(f"offset: {offset}  total_count: {total_count}")

                try:
                    batch_cases = fetch_cases_batch(criteria)

                    for case in batch_cases:
                        filing_number = case.get("filingNumber")
                        if not filing_number:
                            logging.error("Case missing filingNumber, skipping.")
                            continue

                        print(f"  Case: {filing_number}")

                        # ── Step 3: fetch hearings for this case ──────────
                        try:
                            hearings = fetch_hearings(filing_number)
                        except Exception as e:
                            logging.error(f"Error fetching hearings for {filing_number}: {e}")
                            writer.writerow([filing_number, "", "failed", str(e)])
                            continue

                        if not hearings:
                            writer.writerow([filing_number, "", "skipped", "no hearings found"])
                            continue

                        # ── Step 4: process each hearing ──────────────────
                        for hearing in hearings:
                            hearing_id = hearing.get("hearingId", "")
                            status = hearing.get("status", "")

                            if status.upper() in EXCLUDED_HEARING_STATUSES:
                                print(f"Skipping hearing {hearing_id} (status={status!r})")
                                writer.writerow([
                                    filing_number, hearing_id, "skipped",
                                    f"excluded status: {status}"
                                ])
                                continue

                            changed = enrich_attendees(hearing, case)
                            if not changed:
                                print(f"No new attendees for hearing {hearing_id}")
                                writer.writerow([
                                    filing_number, hearing_id, "skipped",
                                    "no new attendees to add"
                                ])
                                continue

                            # ── Step 5: update hearing ────────────────────
                            try:
                                response = update_hearing(hearing)

                                if response is None:
                                    writer.writerow([filing_number, hearing_id, "failed", "no response"])
                                    continue

                                response.raise_for_status()
                                print(f"Updated hearing {hearing_id}")
                                writer.writerow([filing_number, hearing_id, "success", ""])

                            except Exception as e:
                                logging.error(
                                    f"Error updating hearing {hearing_id} "
                                    f"for {filing_number}: {e}"
                                )
                                writer.writerow([filing_number, hearing_id, "failed", str(e)])

                except Exception as e:
                    logging.error(f"Error during batch processing at offset={offset}: {e}")

                offset += CASE_BATCH_SIZE

    except Exception as e:
        logging.error(f"Fatal error in main execution: {e}")
