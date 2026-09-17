import csv
import logging
import requests
from elasticsearch import Elasticsearch

# ─────────────────────────────────────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────────────────────────────────────

CASE_SEARCH_API = "http://localhost:8030/case/v1/_search"

TENANT_ID = "kl"

CASE_BATCH_SIZE = 100

# Hearing statuses to SKIP (upper-cased for comparison)
EXCLUDED_HEARING_STATUSES = {"COMPLETED", "ABANDONED"}

# ─────────────────────────────────────────────────────────────────────────────
# Elasticsearch configuration
# ─────────────────────────────────────────────────────────────────────────────

ES_HOST  = "http://localhost:9200"
ES_INDEX = "open-hearing-index"

es = Elasticsearch(
    ES_HOST,
    basic_auth=("elastic", "8fwbD6HbJh6HU0oddsHm8TEI")
)

# ─────────────────────────────────────────────────────────────────────────────
# Auth / Request headers  (shared with case search API)
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
    "accept": "application/json, text/plain, */*",
    "accept-language": "en-US,en;q=0.9",
    "content-type": "application/json;charset=UTF-8",
    "origin": "https://dristi-kerala-qa.pucar.org",
    "referer": "https://dristi-kerala-qa.pucar.org/ui/employee/hearings",
    "sec-ch-ua": '"Not A(Brand";v="8", "Chromium";v="132", "Google Chrome";v="132"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Linux"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "user-agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36"
    ),
}

# ─────────────────────────────────────────────────────────────────────────────
# Logging  (errors → file, progress → stdout via print)
# ─────────────────────────────────────────────────────────────────────────────

logging.basicConfig(
    filename="update_searchable_fields_open_hearing_index_error.log",
    level=logging.ERROR,
    format="%(asctime)s - %(levelname)s - %(message)s",
)

# ─────────────────────────────────────────────────────────────────────────────
# Case search API helpers  (same pattern as update_hearing_attendees.py)
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

# ─────────────────────────────────────────────────────────────────────────────
# Elasticsearch helpers
# ─────────────────────────────────────────────────────────────────────────────

def fetch_hearing_docs_by_filing_number(filing_number: str) -> list:
    """
    Query open-hearing-index for all documents matching the given filingNumber.
    Returns a list of ES hit objects.  Returns [] on error.
    """
    query = {
        "query": {
            "term": {
                "Data.hearingDetails.filingNumber.keyword": filing_number
            }
        },
        "size": 1000,
    }
    try:
        response = es.search(index=ES_INDEX, body=query)
        hits = response.get("hits", {}).get("hits", [])
        return hits
    except Exception as e:
        logging.error(
            f"Error querying ES for filingNumber={filing_number}: {e}"
        )
        return []


def update_searchable_fields_in_es(doc_id: str, searchable_fields: list) -> bool:
    """
    Patch the searchableFields array for the given ES document id.
    Returns True on success, False on error.
    """
    try:
        update_body = {
            "doc": {
                "Data": {
                    "hearingDetails": {
                        "searchableFields": searchable_fields
                    }
                }
            }
        }
        es.update(index=ES_INDEX, id=doc_id, body=update_body)
        return True
    except Exception as e:
        logging.error(f"Error updating ES document {doc_id}: {e}")
        return False

# ─────────────────────────────────────────────────────────────────────────────
# Enrichment logic
# ─────────────────────────────────────────────────────────────────────────────

def collect_case_individual_ids(case: dict) -> list:
    """
    Collect all individualIds from:
      - case.litigants[*].individualId
      - case.poaHolders[*].individualId
    Returns a deduplicated list, preserving insertion order.
    """
    seen = set()
    ids = []

    for litigant in (case.get("litigants") or []):
        ind_id = litigant.get("individualId")
        if ind_id and ind_id not in seen:
            ids.append(ind_id)
            seen.add(ind_id)

    for poa in (case.get("poaHolders") or []):
        ind_id = poa.get("individualId")
        if ind_id and ind_id not in seen:
            ids.append(ind_id)
            seen.add(ind_id)

    return ids


def enrich_searchable_fields(current_fields: list, case_individual_ids: list) -> tuple:
    """
    Add any case individualIds not already present in current_fields.

    Returns (updated_fields, changed) where:
      updated_fields – the new list
      changed        – True if at least one id was added
    """
    existing = set(current_fields)
    new_fields = list(current_fields)  # copy
    added = 0

    for ind_id in case_individual_ids:
        if ind_id not in existing:
            new_fields.append(ind_id)
            existing.add(ind_id)
            added += 1

    return new_fields, added > 0

# ─────────────────────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    try:
        # ── Step 1: get total case count ──────────────────────────────────────
        criteria = [{"pagination": {"limit": CASE_BATCH_SIZE, "offSet": 0}}]
        total_count = total_case_count(criteria)
        print(f"Total cases to process: {total_count}")

        offset = 0

        with open(
            "update_searchable_fields_open_hearing_index_logs.csv", "a", newline=""
        ) as f:
            writer = csv.writer(f)

            # Write header only when file is empty / newly created
            if f.tell() == 0:
                writer.writerow([
                    "filingNumber", "hearingNumber", "docId", "status", "details"
                ])

            # ── Step 2: paginate through all cases ────────────────────────────
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

                        # ── Step 3: collect individual ids from this case ──────
                        case_individual_ids = collect_case_individual_ids(case)

                        # ── Step 4: fetch matching ES docs ────────────────────
                        try:
                            hits = fetch_hearing_docs_by_filing_number(filing_number)
                        except Exception as e:
                            logging.error(
                                f"Error fetching ES docs for {filing_number}: {e}"
                            )
                            writer.writerow([
                                filing_number, "", "", "failed", str(e)
                            ])
                            continue

                        if not hits:
                            writer.writerow([
                                filing_number, "", "", "skipped", "no ES docs found"
                            ])
                            continue

                        # ── Step 5: process each ES document (= one hearing) ───
                        for hit in hits:
                            doc_id          = hit.get("_id", "")
                            source          = hit.get("_source", {})
                            hearing_details = (
                                source.get("Data", {}).get("hearingDetails", {})
                            )

                            hearing_number = hearing_details.get("hearingNumber", "")
                            status         = hearing_details.get("status", "")

                            # Skip excluded statuses
                            if status.upper() in EXCLUDED_HEARING_STATUSES:
                                print(
                                    f"    Skipping hearing {hearing_number} "
                                    f"(status={status!r})"
                                )
                                writer.writerow([
                                    filing_number, hearing_number, doc_id,
                                    "skipped", f"excluded status: {status}"
                                ])
                                continue

                            current_fields = hearing_details.get("searchableFields") or []

                            updated_fields, changed = enrich_searchable_fields(
                                current_fields, case_individual_ids
                            )

                            if not changed:
                                print(
                                    f"    No new individualIds for hearing "
                                    f"{hearing_number}"
                                )
                                writer.writerow([
                                    filing_number, hearing_number, doc_id,
                                    "skipped", "no new individualIds to add"
                                ])
                                continue

                            # ── Step 6: update ES ─────────────────────────────
                            try:
                                success = update_searchable_fields_in_es(
                                    doc_id, updated_fields
                                )
                                if success:
                                    print(
                                        f"    Updated hearing {hearing_number} "
                                        f"(docId={doc_id})"
                                    )
                                    writer.writerow([
                                        filing_number, hearing_number, doc_id,
                                        "success", ""
                                    ])
                                else:
                                    writer.writerow([
                                        filing_number, hearing_number, doc_id,
                                        "failed", "ES update returned False"
                                    ])
                            except Exception as e:
                                logging.error(
                                    f"Error updating ES doc {doc_id} for hearing "
                                    f"{hearing_number} / {filing_number}: {e}"
                                )
                                writer.writerow([
                                    filing_number, hearing_number, doc_id,
                                    "failed", str(e)
                                ])

                except Exception as e:
                    logging.error(
                        f"Error during batch processing at offset={offset}: {e}"
                    )

                offset += CASE_BATCH_SIZE

    except Exception as e:
        logging.error(f"Fatal error in main execution: {e}")
