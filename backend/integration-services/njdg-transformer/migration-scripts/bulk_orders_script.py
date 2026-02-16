import requests
import json
import time
import os
from datetime import datetime

# ---------------------------
# CONFIGURATION
# ---------------------------

# Port mappings based on curls file
CASE_SERVICE_URL = "http://localhost:8089/case/v1"
ORDER_SERVICE_URL = "http://localhost:8091/order/v1"
NOTIFICATION_SERVICE_URL = "http://localhost:8090/notification/v1"
NJDG_TRANSFORMER_URL = "http://localhost:9080/njdg-transformer/njdg/v1"

TENANT_ID = "kl"
# FILING_NUMBER = "KL-000065-2024" # Commented out as we are fetching by status
STATUSES_TO_FETCH = ["CASE_DISMISSED", "CASE_ADMITTED", "PENDING_RESPONSE"]
MAX_CASES_TO_FETCH = 50

# ---------------------------
# COMMON REQUEST INFO
# ---------------------------

REQUEST_INFO = {
    "apiId": "Rainmaker",
    "authToken": "fe90f1e0-a479-476f-b12c-adc721787844", # Updated from curls file
    "msgId": "1759469519099|en_IN",
    "userInfo": {
        "id": 357,
        "uuid": "a6a374d5-1a20-4577-9533-8c0f03705b8a",
        "userName": "michaelGeorgeJudge",
        "name": "Michael George",
        "mobileNumber": "8789867544",
        "emailId": "michaelGeorgeJudge@gmail.com",
        "type": "EMPLOYEE",
        "roles": [
            {
                "name": "CASE_VIEWER",
                "code": "CASE_VIEWER",
                "tenantId": "kl"
            },
            {
                "name": "ORDER_VIEWER",
                "code": "ORDER_VIEWER",
                "tenantId": "kl"
            },
            {
                "name": "NOTIFICATION_APPROVER",
                "code": "NOTIFICATION_APPROVER",
                "tenantId": "kl"
            }
        ],
        "tenantId": "kl"
    }
}

HEADERS = {
    "accept": "application/json",
    "content-type": "application/json"
}

# ---------------------------
# LOGGING & OUTPUT
# ---------------------------

os.makedirs("processed_orders_notifications", exist_ok=True)
# OUTPUT_FILE will be generated dynamically per case


def log_message(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")

# ---------------------------
# FETCH FUNCTIONS
# ---------------------------

def fetch_cases_by_status(statuses, limit=50):
    url = f"{CASE_SERVICE_URL}/_search"
    payload = {
        "criteria": [
            {
                "status": statuses
            }
        ],
        "pagination": {
            "limit": limit,
            "offSet": 0
        },
        "flow": "flow_jac",
        "tenantId": TENANT_ID,
        "RequestInfo": REQUEST_INFO
    }

    log_message(f"Fetching cases with statuses: {statuses}")
    try:
        response = requests.post(url, headers=HEADERS, json=payload)
        response.raise_for_status()
        data = response.json()
        
        criteria_list = data.get("criteria", [])
        if criteria_list and "responseList" in criteria_list[0]:
            response_list = criteria_list[0].get("responseList", [])
            log_message(f"Found {len(response_list)} cases.")
            return response_list
        
        log_message("No cases found.")
        return []
    except Exception as e:
        log_message(f"Error fetching cases: {e}")
        return []

def fetch_case(filing_number):
    url = f"{CASE_SERVICE_URL}/_search"
    payload = {
        "criteria": [
            {
                "filingNumber": filing_number,
                "status": ["CASE_DISMISSED", "CASE_ADMITTED", "PENDING_RESPONSE"]
            }
        ],
        "flow": "flow_jac",
        "tenantId": TENANT_ID,
        "RequestInfo": REQUEST_INFO
    }

    log_message(f"Fetching case for filing number: {filing_number}")
    try:
        response = requests.post(url, headers=HEADERS, json=payload)
        response.raise_for_status()
        data = response.json()
        
        criteria_list = data.get("criteria", [])
        if criteria_list and "responseList" in criteria_list[0]:
            response_list = criteria_list[0].get("responseList", [])
            if response_list:
                return response_list[0]
        
        log_message("No case found.")
        return None
    except Exception as e:
        log_message(f"Error fetching case: {e}")
        return None

def fetch_orders(cnr_number, court_id, filing_number=None):
    url = f"{ORDER_SERVICE_URL}/search"
    payload = {
        "criteria": {
            "cnrNumber": cnr_number, # Or use filingNumber if preferred, but script usually uses cnr or filing
            "tenantId": TENANT_ID,
            "courtId": court_id
        },
        "RequestInfo": REQUEST_INFO
    }
    
    # If cnrNumber is not available, we can try with filingNumber
    if not cnr_number:
         payload["criteria"].pop("cnrNumber", None)
         if filing_number:
             payload["criteria"]["filingNumber"] = filing_number
         else:
             log_message("Warning: Neither CNR nor Filing Number provided for fetching orders.")
             return []

    log_message(f"Fetching orders for CNR: {cnr_number} / CourtID: {court_id}")
    try:
        response = requests.post(url, headers=HEADERS, json=payload)
        response.raise_for_status()
        data = response.json()
        orders = data.get("list", [])
        # Filter for PUBLISHED status
        orders = [o for o in orders if o.get("status") == "PUBLISHED"]
        log_message(f"Found {len(orders)} PUBLISHED orders.")
        return orders
    except Exception as e:
        log_message(f"Error fetching orders: {e}")
        return []

def fetch_notifications(court_id):
    url = f"{NOTIFICATION_SERVICE_URL}/_search"
    payload = {
        "criteria": {
            # "notificationType": "Notification for Bulk Reschedule", # Fetch all types?
            "tenantId": TENANT_ID,
            "courtId": court_id
        },
        "pagination": {
            "limit": 100
        },
        "RequestInfo": REQUEST_INFO
    }

    log_message(f"Fetching notifications for CourtID: {court_id}")
    try:
        response = requests.post(url, headers=HEADERS, json=payload)
        response.raise_for_status()
        data = response.json()
        notifications = data.get("list", [])
        # Filter for PUBLISHED status
        notifications = [n for n in notifications if n.get("status") == "PUBLISHED"]
        log_message(f"Found {len(notifications)} PUBLISHED notifications (before filtering).")
        return notifications
    except Exception as e:
        log_message(f"Error fetching notifications: {e}")
        return []

# ---------------------------
# PROCESSING FUNCTIONS
# ---------------------------

def process_business_order(order):
    url = f"{NJDG_TRANSFORMER_URL}/_processbusinessorders"
    payload = {
        "RequestInfo": REQUEST_INFO,
        "order": order
    }
    
    try:
        response = requests.post(url, headers=HEADERS, json=payload)
        response.raise_for_status()
        log_message(f"Successfully processed order: {order.get('orderNumber')}")
        return response.json()
    except Exception as e:
        log_message(f"Error processing order {order.get('orderNumber')}: {e}")
        return {"error": str(e), "orderNumber": order.get('orderNumber')}

def process_notification(notification):
    url = f"{NJDG_TRANSFORMER_URL}/_processordernotification"
    payload = {
        "RequestInfo": REQUEST_INFO,
        "notification": notification
    }
    
    try:
        response = requests.post(url, headers=HEADERS, json=payload)
        response.raise_for_status()
        log_message(f"Successfully processed notification: {notification.get('notificationNumber')}")
        return response.json()
    except Exception as e:
        log_message(f"Error processing notification {notification.get('notificationNumber')}: {e}")
        return {"error": str(e), "notificationNumber": notification.get('notificationNumber')}

# ---------------------------
# MAIN SCRIPT
# ---------------------------

def process_single_case(case):
    filing_number = case.get("filingNumber")
    if not filing_number:
        log_message("Skipping case without filing number.")
        return

    output_file = f"processed_orders_notifications/{filing_number}_results.json"
    
    cnr_number = case.get("cnrNumber")
    court_case_number = case.get("courtCaseNumber")
    cmp_number = case.get("cmpNumber") # Assuming this field exists, otherwise rely on courtCaseNumber
    court_id = case.get("courtId")
    
    if not court_id:
        log_message(f"Skipping case {filing_number}: Court ID not found.")
        return

    log_message(f"Processing Case {filing_number} - CNR: {cnr_number}, CourtCaseNo: {court_case_number}, CourtID: {court_id}")

    # 2. Fetch all orders
    orders = fetch_orders(cnr_number, court_id, filing_number)
    
    # 3. Fetch all notifications
    raw_notifications = fetch_notifications(court_id)
    
    # Filter notifications
    filtered_notifications = []
    case_identifiers = set()
    if court_case_number:
        case_identifiers.add(court_case_number)
    if cmp_number:
        case_identifiers.add(cmp_number)
    if filing_number:
         case_identifiers.add(filing_number)

    log_message(f"Filtering notifications with identifiers: {case_identifiers}")
    log_message(f"Raw notifications count: {len(raw_notifications)}")
    for notif in raw_notifications:
        notif_case_numbers = notif.get("caseNumber", [])
        if not isinstance(notif_case_numbers, list):
            notif_case_numbers = [notif_case_numbers]

        # Check intersection and filter caseNumber list
        matching_identifiers = [ident for ident in notif_case_numbers if ident in case_identifiers]

        if matching_identifiers:
            # Update the notification object to only contain matching case numbers
            notif["caseNumber"] = matching_identifiers
            filtered_notifications.append(notif)
            
    log_message(f"Filtered down to {len(filtered_notifications)} relevant notifications.")

    # 4. Combine and Sort
    combined_list = []
    for o in orders:
        combined_list.append({"type": "order", "data": o, "date": o.get("createdDate", 0)})
    for n in filtered_notifications:
        combined_list.append({"type": "notification", "data": n, "date": n.get("createdDate", 0)})
    
    # Sort by createDate ascending
    combined_list.sort(key=lambda x: x["date"])
    
    log_message(f"Total items to process for {filing_number}: {len(combined_list)}")

    # 5. Process
    results = []
    
    for item in combined_list:
        item_type = item["type"]
        data = item["data"]
        
        result = None
        if item_type == "order":
            log_message(f"Processing Order: {data.get('orderNumber')}")
            result = process_business_order(data)
        elif item_type == "notification":
            log_message(f"Processing Notification: {data.get('notificationNumber')}")
            result = process_notification(data)
            
        results.append({
            "type": item_type,
            "id": data.get("id"),
            "number": data.get("orderNumber") if item_type == "order" else data.get("notificationNumber"),
            "status": "processed" if "error" not in result else "failed",
            "response": result
        })
        
        # Small delay to be safe
        time.sleep(0.5)

    # 6. Save response
    with open(output_file, "w") as f:
        json.dump(results, f, indent=4)
    
    log_message(f"Done for {filing_number}. Results saved to {output_file}")


def main():
    # 1. Fetch cases
    cases = fetch_cases_by_status(STATUSES_TO_FETCH, MAX_CASES_TO_FETCH)
    
    if not cases:
        log_message("No cases found to process.")
        return

    log_message(f"Starting processing for {len(cases)} cases...")

    for case in cases:
        try:
            process_single_case(case)
        except Exception as e:
            log_message(f"Error processing case {case.get('filingNumber', 'Unknown')}: {e}")
        
        log_message("--------------------------------------------------")

if __name__ == "__main__":
    main()

