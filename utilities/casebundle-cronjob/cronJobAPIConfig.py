import os
import json
import requests
from dotenv import load_dotenv
import logging


load_dotenv()


logging.basicConfig(format='%(asctime)s - %(message)s', level=logging.INFO)


casebundle_host = os.getenv("CASEBUNDLE_HOST")
casebundle_endpoint = os.getenv("CASEBUNDLE_ENDPOINT")
tenant_id = os.getenv("TENANT_ID")


url = f"{casebundle_host}{casebundle_endpoint}"

def getRequestInfo(userInfo):
    """Constructs and returns the requestInfo structure, including userInfo if available."""
    requestInfo = {
        "apiId": "Rainmaker",
        "ver": "1.0",
        "ts": "",
        "action": "POST",
        "did": "1",
        "key": "",
        "msgId": "20241105001|en_IN",
        "userInfo": userInfo
    }
    return requestInfo

def getUser():
    """Fetches user information from the user service."""
    try:
        user_host = os.getenv('USER_SERVICE_HOST')
        user_search = os.getenv('USER_SEARCH')
        user_url = f"{user_host}{user_search}?tenantId={tenant_id}"
        
        tenantId = tenant_id
        userName = os.getenv('USER_NAME')
        user_payload = {
            "requestInfo": {
                "apiId": "ap.public",
                "ver": "1",
                "ts": 45646456,
                "action": "POST",
                "did": None,
                "key": None,
                "msgId": "8c11c5ca-03bd-11e7-93ae-92361f002671",
                "userInfo": {"id": 32},
                "authToken": "5eb3655f-31b1-4cd5-b8c2-4f9c033510d4"
            },
            "tenantId": tenantId,
            "userName": userName,
            "pageSize": "1"
        }
        
    
        headers = {'Content-Type': 'application/json'}
        response = requests.post(user_url, headers=headers, json=user_payload)
        
        if response.status_code == 200:
            users = response.json().get('user', [])
            if users:
                user = users[0]
                return {
                    "id": user['id'],
                    "tenantId": user['tenantId'],
                    "uuid": user['uuid'],
                    "roles": user['roles']
                }
            else:
                logging.warning("User not found.")
                return None
        else:
            logging.error("Failed to fetch user info. Status Code: %s", response.status_code)
            return None

    except Exception as ex:
        logging.error("Exception while fetching user info.", exc_info=True)
        return None

def build_case_bundle():
    """Calls the case bundle API endpoint with user info if available."""
    try:
        userInfo = getUser()
        
        
        if userInfo:
            payload = {
                "RequestInfo": getRequestInfo(userInfo),
                "tenantId": tenant_id
            }
        else:
            logging.error("User info could not be retrieved. Aborting request.")
            return None
        
   
        headers = {"Content-Type": "application/json"}
        

        response = requests.post(url, headers=headers, json=payload)
        
       
        logging.info("Response Status Code: %s", response.status_code)
        logging.info("Response JSON: %s", response.json())
        
      
        if response.status_code == 200:
            return response.json()  
        else:
            logging.error("Failed to build case bundle. Status Code: %s", response.status_code)
            return None
    except Exception as e:
        logging.error("Exception occurred while calling case bundle API.", exc_info=True)
        return None

if __name__ == "__main__":
    logging.info("Starting case bundle request")
    result = build_case_bundle()
    if result:
        logging.info("Case bundle created successfully")
    else:
        logging.error("Case bundle creation failed")
