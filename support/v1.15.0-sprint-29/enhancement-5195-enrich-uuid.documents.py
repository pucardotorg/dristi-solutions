import logging
import os
import requests
from elasticsearch import Elasticsearch

# Separate folder for logs
os.makedirs("logs", exist_ok=True)

# Basic logger setup
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# File handler
file_handler = logging.FileHandler("logs/enrich_uuids.log", encoding="utf-8")
file_handler.setFormatter(logging.Formatter("%(levelname)s: %(message)s"))
logger.addHandler(file_handler)

# Status constants
SUCCESS = "SUCCESS"
FAILED = "FAILED"
SKIPPED = "SKIPPED"
WARNING = "WARNING"


def log_status(document_number, status, details=None):
    """Smart log function based on status"""
    message = f"{document_number} | {status}" + (f" | {details}" if details else "")

    if status.upper() == FAILED:
        logger.error(message)
    elif status.upper() == WARNING:
        logger.warning(message)
    else:
        logger.info(message)


# Elasticsearch configuration
ES_HOST = "http://localhost:9200"
ES_INDEX = "digitalized-document-index"
# todo set credentials
ES_USERNAME = ""
ES_PASSWORD = ""
es = Elasticsearch(
    ES_HOST,
    basic_auth=(ES_USERNAME, ES_PASSWORD)
)

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
    "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36"
}

# API endpoints
CASE_SEARCH_API = "http://localhost:8030/case/v1/_search"

# Constants
TENANT_ID = "kl"
COURT_ID = "KLKM52"
ACCUSED_PARTY_TYPE = "respondent.primary"
COMPLAINANT_PARTY_TYPE = "complainant.primary"


def search_documents_from_es(document_type):
    """
    Search COMPLETED documents directly from Elasticsearch
    """
    must_clauses = [
        {"term": {"Data.digitalizedDocumentDetails.type.keyword": document_type}},
        {"term": {"Data.digitalizedDocumentDetails.courtId.keyword": COURT_ID}},
        {"term": {"Data.digitalizedDocumentDetails.status.keyword": "COMPLETED"}}
    ]

    query = {
        "query": {
            "bool": {
                "must": must_clauses
            }
        },
        "size": 1000
    }

    try:
        response = es.search(index=ES_INDEX, body=query)
        hits = response.get("hits", {}).get("hits", [])
        logger.info(f"Found {len(hits)} COMPLETED {document_type} documents")
        return hits
    except Exception as e:
        logger.error(f"Error searching ES for {document_type}: {e}")
        return []


def update_document_in_es(doc_id, assigned_to):
    """
    Update assignedTo field directly in Elasticsearch
    """
    try:
        update_body = {
            "doc": {
                "Data": {
                    "digitalizedDocumentDetails": {
                        "assignedTo": assigned_to
                    }
                }
            }
        }
        es.update(index=ES_INDEX, id=doc_id, body=update_body)
        return True
    except Exception as e:
        logger.error(f"Error updating document {doc_id} in ES: {e}")
        return False


def fetch_case_details(filing_number, tenant_id):
    """
    Fetch case details from case search API
    """
    payload = {
        "criteria": [{
            "filingNumber": filing_number,
            "defaultFields": False
        }],
        "tenantId": tenant_id,
        "RequestInfo": request_info
    }

    try:
        response = requests.post(CASE_SEARCH_API, headers=headers, json=payload)
        response.raise_for_status()
        result = response.json()
        criteria = result.get("criteria", [])
        if criteria and len(criteria) > 0:
            response_list = criteria[0].get("responseList", [])
            if response_list and len(response_list) > 0:
                return response_list[0]
        logger.warning(f"No case found for filing number: {filing_number}")
        return None
    except Exception as e:
        logger.error(f"Error fetching case details for {filing_number}: {e}")
        return None


def get_litigant_uuids_for_party(litigants, party_type):
    """
    Get litigant UUIDs for a specific party type from case litigants
    """
    if not litigants:
        return []

    litigant_uuids = []
    for litigant in litigants:
        litigant_party_type = litigant.get("partyType", "")
        if party_type in litigant_party_type:
            additional_details = litigant.get("additionalDetails", {})
            uuid = additional_details.get("uuid", "")
            if uuid:
                litigant_uuids.append(uuid)
            else:
                logger.warning("UUID not found for litigant")

    return litigant_uuids


def get_advocate_uuids_from_litigant_uuids(court_case, litigant_uuids):
    """
    Get advocate UUIDs representing the given litigants
    """
    representatives = court_case.get("representatives", [])
    if not representatives:
        return []

    advocate_uuids = []
    for advocate_mapping in representatives:
        advocate_additional_details = advocate_mapping.get("additionalDetails", {})
        advocate_uuid = advocate_additional_details.get("uuid", "")

        representing_list = advocate_mapping.get("representing", [])
        for representing in representing_list:
            representing_additional_details = representing.get("additionalDetails", {})
            representing_uuid = representing_additional_details.get("uuid", "")

            if representing_uuid in litigant_uuids:
                if advocate_uuid and advocate_uuid not in advocate_uuids:
                    advocate_uuids.append(advocate_uuid)

    return advocate_uuids


def get_litigant_individual_ids_from_uuids(court_case, litigant_uuids):
    """
    Get individual IDs from litigant UUIDs
    """
    if not litigant_uuids:
        return []

    litigants = court_case.get("litigants", [])
    if not litigants:
        return []

    individual_ids = []
    for litigant in litigants:
        litigant_additional_details = litigant.get("additionalDetails", {})
        litigant_uuid = litigant_additional_details.get("uuid", "")

        if litigant_uuid in litigant_uuids:
            individual_id = litigant.get("individualId", "")
            if individual_id:
                individual_ids.append(individual_id)

    return individual_ids


def get_poa_uuids_from_litigant_uuids(court_case, litigant_uuids):
    """
    Get POA holder UUIDs representing the given litigants
    """
    poa_holders = court_case.get("poaHolders", [])
    if not poa_holders:
        return []

    litigant_individual_ids = get_litigant_individual_ids_from_uuids(court_case, litigant_uuids)
    poa_uuids = []

    for poa_holder in poa_holders:
        poa_additional_details = poa_holder.get("additionalDetails", {})
        poa_uuid = poa_additional_details.get("uuid", "")

        if not poa_uuid:
            logger.warning("UUID not found for POA holder")
            continue

        representing_litigants = poa_holder.get("representingLitigants", [])
        for litigant in representing_litigants:
            individual_id = litigant.get("individualId", "")
            if individual_id in litigant_individual_ids:
                if poa_uuid not in poa_uuids:
                    poa_uuids.append(poa_uuid)

    return poa_uuids


def enrich_assigned_to(document, court_case):
    """
    Enrich assignedTo field for COMPLETED documents (PLEA/EXAMINATION_OF_ACCUSED)
    For COMPLETED status: All accused + complainants + their advocates + POA holders get access
    """
    assigned_to = []
    litigants = court_case.get("litigants", [])
    document_number = document.get("documentNumber")

    # All accused parties should have access
    accused_uuids = get_litigant_uuids_for_party(litigants, ACCUSED_PARTY_TYPE)
    accused_advocate_uuids = get_advocate_uuids_from_litigant_uuids(court_case, accused_uuids)
    accused_poa_uuids = get_poa_uuids_from_litigant_uuids(court_case, accused_uuids)

    # All complainant parties should have access
    complainant_uuids = get_litigant_uuids_for_party(litigants, COMPLAINANT_PARTY_TYPE)
    complainant_advocate_uuids = get_advocate_uuids_from_litigant_uuids(court_case, complainant_uuids)
    complainant_poa_uuids = get_poa_uuids_from_litigant_uuids(court_case, complainant_uuids)

    # Add all parties
    assigned_to.extend(accused_uuids)
    assigned_to.extend(accused_advocate_uuids)
    assigned_to.extend(accused_poa_uuids)
    assigned_to.extend(complainant_uuids)
    assigned_to.extend(complainant_advocate_uuids)
    assigned_to.extend(complainant_poa_uuids)

    # Remove duplicates while preserving order
    assigned_to = list(dict.fromkeys(assigned_to))
    logger.info(f"Enriched assignedTo with {len(assigned_to)} UUIDs for {document_number}")
    return assigned_to


def process_documents(document_type):
    """
    Process documents of a specific type: fetch from ES, enrich, and update in ES
    """

    # Fetch documents from ES
    hits = search_documents_from_es(document_type)

    if not hits:
        logger.info(f"No {document_type} documents found to process")
        return

    logger.info(f"Total {document_type} documents to process: {len(hits)}")
    for hit in hits:
        doc_number = hit.get("_source", {}).get("Data", {}).get("digitalizedDocumentDetails", {}).get("documentNumber")

    success_count = 0
    error_count = 0

    # Cache for case details
    case_cache = {}

    for hit in hits:
        doc_id = hit.get("_id")
        source = hit.get("_source", {})
        data = source.get("Data", {})
        document = data.get("digitalizedDocumentDetails")

        if not document:
            logger.warning("No digitalized document details found")
            continue

        document_number = document.get("documentNumber")
        filing_number = document.get("caseFilingNumber")
        tenant_id = document.get("tenantId")
        current_assigned_to = document.get("assignedTo", [])

        # Fetch case details (with caching)
        if filing_number not in case_cache:
            case_cache[filing_number] = fetch_case_details(filing_number, tenant_id)

        court_case = case_cache.get(filing_number)
        if not court_case:
            log_status(document_number, SKIPPED, "Case not found")
            error_count += 1
            continue

        # Enrich assignedTo
        assigned_to = enrich_assigned_to(document, court_case)

        # Update document in ES
        if update_document_in_es(doc_id, assigned_to):
            log_status(document_number, SUCCESS, f"Updated with {len(assigned_to)} UUIDs")
            success_count += 1
        else:
            log_status(document_number, FAILED, "ES update failed")
            error_count += 1

    logger.info(f"Summary for {document_type}: Total={len(hits)}, Success={success_count}, Errors={error_count}")


if __name__ == "__main__":
    logger.info("=" * 60)
    logger.info("Digitalized Document AssignedTo Enrichment Script Started")
    logger.info("=" * 60)

    # Process PLEA documents
    process_documents("PLEA")

    # Process EXAMINATION_OF_ACCUSED documents
    process_documents("EXAMINATION_OF_ACCUSED")

    logger.info("=" * 60)
    logger.info("Script execution completed")
    logger.info("=" * 60)
