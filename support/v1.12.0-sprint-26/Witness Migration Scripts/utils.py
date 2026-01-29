import logging
import requests
import os


from config import BATCH_SIZE, TENANT_ID, headers, request_info, case_search_api, add_witness_to_case_api

# Separate folder for logs
os.makedirs("logs", exist_ok=True)

# Basic logger setup
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# File handler
file_handler = logging.FileHandler("logs/witness_migration.log", encoding="utf-8")
file_handler.setFormatter(logging.Formatter("%(levelname)s: %(message)s"))
logger.addHandler(file_handler)

SKIPPED = "SKIPPED"
CLEANED = "CLEANED"
IGNORED = "IGNORED"
FAILED = "FAILED"
UNKNOWN = "UNKNOWN"
SUCCESS = "SUCCESS"

# Smart log function based on status
def log_status(filing_number, status, details=None):
    message = f"{filing_number} | {status}" + (f" | {details}" if details else "")
    
    if status.upper() in [FAILED, UNKNOWN]:
        logger.error(message)
    elif status.upper() in [CLEANED]:
        logger.warning(message)
    else:
        logger.info(message)

# API Functions
def fetch_case_count():
    payload = {
        "criteria": [{"pagination": {"limit": 0, "offSet": 0}}],
        "RequestInfo": request_info,
    }
    try:
        response = requests.post(case_search_api, headers=headers, json=payload)
        response.raise_for_status()
        return response.json().get("criteria", [])[0].get("pagination", {}).get("totalCount", 0)
    except Exception as e:
        logger.error(f"Error while fetching case count: {e}")
        return 0

def fetch_case_by_filing_number(filing_number):
    cases = fetch_cases([{"filingNumber": filing_number}])
    return cases[0] if cases else None

def fetch_cases_by_offset(offset):
    return fetch_cases([{"pagination": {"limit": BATCH_SIZE, "offSet": offset}}])

def fetch_cases(criteria):
    payload = {
        "criteria": criteria,
        "RequestInfo": request_info,
    }
    try:
        response = requests.post(case_search_api, headers=headers, json=payload)
        response.raise_for_status()
        return response.json().get("criteria", [])[0].get("responseList", [])
    except Exception as e:
        logger.error(f"Error while fetching cases for criteria {criteria}: {e}")
        return []

def get_formdata(case):
    filing_number = case.get('filingNumber')
    formdata = case.get("additionalDetails", {}).get("witnessDetails", {}).get("formdata", [])
    if formdata:
        return formdata
    else:
        log_status(filing_number, SKIPPED, details=f"No witnesses in case {filing_number}")
        return []

def get_cleaned_addresses(address_list, filing_number, unique_id):
    cleaned_addresses = []
    for address in address_list:
        address_details = address.get("addressDetails")

        if address_details in ("", {}, None):
            address_details = None

        elif not isinstance(address_details, dict):
            log_status(filing_number, CLEANED, details=f"Address Details ({address_details}) set as city for witness {unique_id}")
            address_details = {"city": address_details}

        address["addressDetails"] = address_details
        
        coordinates = address_details.get("coordinates") if address_details else None

        if coordinates in ("", {}, None):
            coordinates = None
            if address_details is not None:
                address["addressDetails"]["coordinates"] = None

        elif not isinstance(coordinates, dict):
            log_status(filing_number, CLEANED, details=f"Coordinates ({coordinates}) set as latitude for witness {unique_id}")
            coordinates = {"latitude": coordinates}
            address["addressDetails"]["coordinates"] = coordinates
        
        cleaned_addresses.append(address)
    
    return cleaned_addresses

def call_add_witness_api(filing_number, witness_details):
    payload = {
        "RequestInfo": request_info,
        "tenantId": TENANT_ID,
        "caseFilingNumber": filing_number,
        "witnessDetails": witness_details,
    }
    try:
        return requests.post(add_witness_to_case_api, headers=headers, json=payload)
    except Exception as e:
        logger.error(f"Error while adding witness to case {filing_number}: {e}")
        return None

def get_witness_object(element, case):
    filing_number = case.get("filingNumber")
    if "uniqueId" not in element:
        log_status(filing_number, IGNORED, details=f"No uniqueId for witness in case {filing_number}")
        return None

    witness = element.get("data", {})

    raw_address_list = witness.get("addressDetails", [])
    cleaned_address_list = get_cleaned_addresses(raw_address_list, filing_number, unique_id=element.get("uniqueId"))
    witness["addressDetails"] = cleaned_address_list

    witness["uniqueId"] = element["uniqueId"]

    uiData = {
        "displayindex": element.get("displayindex", 0),
        "isenabled": element.get("isenabled", False),
        "isCompleted": case.get("additionalDetails", {}).get("witnessDetails", {}).get("isCompleted", False)
    }

    if "displayindex" in element:
        witness["uiData"] = uiData
    
    return witness

def get_cleaned_witnesses(case):
    filing_number = case.get("filingNumber")
    cleaned_witnesses = []

    try:
        formdata = get_formdata(case)
        if not formdata:
            return []
        
        for element in formdata:
            witness = get_witness_object(element, case)
            if witness:
                cleaned_witnesses.append(witness)
        
        return cleaned_witnesses


    except Exception as e:
        log_status(filing_number, FAILED, details=f"Error while processing witnesses in case {filing_number}: {e}")
        return []

def migrate_witness_details(cases):
     for case in cases:
        filing_number = case.get("filingNumber")
        witness_details = get_cleaned_witnesses(case)

        if not witness_details:
            log_status(filing_number, SKIPPED, details="No valid witness entries")
            continue
        
        response = call_add_witness_api(filing_number, witness_details)

        if response is None:
            log_status(filing_number, UNKNOWN, details="No response from add witness API")
            continue

        response.raise_for_status()
        log_status(filing_number, SUCCESS, details={"statusCode": response.status_code})
