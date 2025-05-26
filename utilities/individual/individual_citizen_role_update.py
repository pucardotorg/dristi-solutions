import requests

import json

from collections import defaultdict

import pandas as pd

# Hardcoded configuration values (these can be updated as needed)


configuration = {
    "user_host": "http://localhost:8020",  # Replace with actual host URL
    "user_search_endpoint": "/user/v1/_search",
    "user_create_endpoint": "/user/users/_createnovalidate",
    "tenant_id": "kl",
    "oath_host": "https://dristi-kerala-uat.pucar.org",
    "oath_endpoint": "/user/oauth/token?_=1734677419101",
    "username": "SCRIPT_USER",
    "password": "Hello@123",
    "user_type": "SYSTEM",
    "scope": "read",
    "grant_type": "password",
    "authorization": "Basic ZWdvdi11c2VyLWNsaWVudDo=",
}

# Constants

SCRIPT_ROLE_CODE = "SCRIPT_ROLE"

SCRIPT_USER_USERNAME = "SCRIPT_USER"

SCRIPT_USER_MOBILENO = "1234567890"

SCRIPT_USER_TYPE = "SYSTEM"

TENANT_ID = "kl"

# Global variables to store user info

internal_microservice_role_uuid = None

internal_microservice_id = None

internal_microservice_roles = None


# this is the latest role we need to update
advocate_role = [
    {"name": "CITIZEN", "code": "CITIZEN", "tenantId": "kl"},
    {"name": "ADVOCATE_ROLE", "code": "ADVOCATE_ROLE", "tenantId": "kl"},
    {"name": "CASE_CREATOR", "code": "CASE_CREATOR", "tenantId": "kl"},
    {"name": "CASE_EDITOR", "code": "CASE_EDITOR", "tenantId": "kl"},
    {"name": "CASE_VIEWER", "code": "CASE_VIEWER", "tenantId": "kl"},
    {"name": "EVIDENCE_CREATOR", "code": "EVIDENCE_CREATOR", "tenantId": "kl"},
    {"name": "EVIDENCE_VIEWER", "code": "EVIDENCE_VIEWER", "tenantId": "kl"},
    {"name": "EVIDENCE_EDITOR", "code": "EVIDENCE_EDITOR", "tenantId": "kl"},
    {"name": "APPLICATION_CREATOR", "code": "APPLICATION_CREATOR", "tenantId": "kl"},
    {"name": "APPLICATION_VIEWER", "code": "APPLICATION_VIEWER", "tenantId": "kl"},
    {"name": "HEARING_VIEWER", "code": "HEARING_VIEWER", "tenantId": "kl"},
    {"name": "ORDER_VIEWER", "code": "ORDER_VIEWER", "tenantId": "kl"},
    {"name": "SUBMISSION_CREATOR", "code": "SUBMISSION_CREATOR", "tenantId": "kl"},
    {"name": "SUBMISSION_RESPONDER", "code": "SUBMISSION_RESPONDER", "tenantId": "kl"},
    {"name": "SUBMISSION_DELETE", "code": "SUBMISSION_DELETE", "tenantId": "kl"},
    {"name": "TASK_VIEWER", "code": "TASK_VIEWER", "tenantId": "kl"},
    {"name": "HEARING_ACCEPTOR", "code": "HEARING_ACCEPTOR", "tenantId": "kl"},
    {"name": "USER_REGISTER", "code": "USER_REGISTER", "tenantId": "kl"},
    {"name": "ADVOCATE_VIEWER", "code": "ADVOCATE_VIEWER", "tenantId": "kl"},
    {
        "name": "ADVOCATE_APPLICATION_VIEWER",
        "code": "ADVOCATE_APPLICATION_VIEWER",
        "tenantId": "kl",
    },
    {"name": "PENDING_TASK_CREATOR", "code": "PENDING_TASK_CREATOR", "tenantId": "kl"},
]


# this is the latest role we need to update
litigant_role = [
    {"name": "CITIZEN", "code": "CITIZEN", "tenantId": "kl"},
    {"name": "CASE_CREATOR", "code": "CASE_CREATOR", "tenantId": "kl"},
    {"name": "CASE_EDITOR", "code": "CASE_EDITOR", "tenantId": "kl"},
    {"name": "CASE_VIEWER", "code": "CASE_VIEWER", "tenantId": "kl"},
    {"name": "EVIDENCE_CREATOR", "code": "EVIDENCE_CREATOR", "tenantId": "kl"},
    {"name": "EVIDENCE_VIEWER", "code": "EVIDENCE_VIEWER", "tenantId": "kl"},
    {"name": "EVIDENCE_EDITOR", "code": "EVIDENCE_EDITOR", "tenantId": "kl"},
    {"name": "APPLICATION_CREATOR", "code": "APPLICATION_CREATOR", "tenantId": "kl"},
    {"name": "APPLICATION_VIEWER", "code": "APPLICATION_VIEWER", "tenantId": "kl"},
    {"name": "HEARING_VIEWER", "code": "HEARING_VIEWER", "tenantId": "kl"},
    {"name": "ORDER_VIEWER", "code": "ORDER_VIEWER", "tenantId": "kl"},
    {"name": "SUBMISSION_CREATOR", "code": "SUBMISSION_CREATOR", "tenantId": "kl"},
    {"name": "SUBMISSION_RESPONDER", "code": "SUBMISSION_RESPONDER", "tenantId": "kl"},
    {"name": "SUBMISSION_DELETE", "code": "SUBMISSION_DELETE", "tenantId": "kl"},
    {"name": "TASK_VIEWER", "code": "TASK_VIEWER", "tenantId": "kl"},
    {"name": "HEARING_ACCEPTOR", "code": "HEARING_ACCEPTOR", "tenantId": "kl"},
    {"name": "ADVOCATE_VIEWER", "code": "ADVOCATE_VIEWER", "tenantId": "kl"},
    {"name": "PENDING_TASK_CREATOR", "code": "PENDING_TASK_CREATOR", "tenantId": "kl"},
]


litigant_code_role = [
    role["code"] for role in litigant_role if role["code"] != "CITIZEN"
]

advocate_code_role = [
    role["code"] for role in advocate_role if role["code"] != "CITIZEN"
]

grouped_by_user_type = defaultdict(list)


def fetch_result(uri, request_payload):
    """Fetches result from the given URL with the provided payload."""

    try:
        print(uri, request_payload)
        response = requests.post(uri, json=request_payload)

        response.raise_for_status()

        return response.json()

    except requests.RequestException as e:

        print(f"Error fetching result from {uri}: {e}")

        return {}


def initialize_system_user():
    """Initializes the internal microservice user."""

    # user auth wala part

    global internal_microservice_role_uuid, internal_microservice_id, internal_microservice_roles

    request_info = {}

    uri = f"{configuration['user_host']}{configuration['user_search_endpoint']}"

    user_search_request = {
        "RequestInfo": request_info,
        "tenantId": configuration["tenant_id"],
        "roleCodes": [SCRIPT_ROLE_CODE],
    }

    try:

        # response_map = fetch_result(uri, user_search_request)
        response_map = o_auth_for_dristi()
        if response_map:
            return response_map
        if not response_map:

            create_internal_microservice_user(request_info)
            response_map = o_auth_for_dristi()
            return response_map

        # else:
        #     internal_microservice_id = users[0].get("id", "")

        #     internal_microservice_role_uuid = users[0].get("uuid", "")

        #     internal_microservice_roles = users[0].get("roles", [])

    except Exception as e:

        print("Error initializing system user:", e)


def create_internal_microservice_user(request_info):
    """Creates the internal microservice user."""

    global internal_microservice_role_uuid, internal_microservice_id, internal_microservice_roles

    role = [
        {
            "name": "Script Role",
            "code": SCRIPT_ROLE_CODE,
            "tenantId": configuration["tenant_id"],
        },
        {
            "name": "CITIZEN",
            "code": "CITIZEN",
            "tenantId": configuration["tenant_id"],
        },
        {
            "name": "EMPLOYEE",
            "code": "EMPLOYEE",
            "tenantId": configuration["tenant_id"],
        },
    ]

    user = {
        "userName": SCRIPT_USER_USERNAME,
        "name": "SCRIPT USER",
        "mobileNumber": SCRIPT_USER_MOBILENO,
        "type": SCRIPT_USER_TYPE,
        "tenantId": configuration["tenant_id"],
        "roles": role,
        "password": configuration["password"],
        # "id": 0,#
        "gender": "Male",
        "active": True,
    }

    user_create_request = {"RequestInfo": request_info, "user": user}

    uri = f"{configuration['user_host']}{configuration['user_create_endpoint']}"

    try:

        response_map = fetch_result(uri, user_create_request)
        # print("---", response_map)#

        users = response_map.get("user", [])

        if users:

            internal_microservice_role_uuid = users[0].get("uuid", "")

            internal_microservice_roles = users[0].get("roles", [])

            internal_microservice_id = users[0].get("id", "")

    except Exception as e:

        print("Error creating internal microservice user:", e)


def o_auth_for_dristi():
    """Handles OAuth for Dristi."""

    print("operation = oAuthForDristi, result = IN_PROGRESS")

    uri = f"{configuration['oath_host']}{configuration['oath_endpoint']}"

    payload = {
        "username": configuration["username"],
        "password": configuration["password"],
        "tenantId": configuration["tenant_id"],
        "userType": configuration["user_type"],
        "scope": configuration["scope"],
        "grant_type": configuration["grant_type"],
    }

    headers = {
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": configuration["authorization"],
    }

    try:
        print(uri, payload, headers)
        response = requests.post(uri, data=payload, headers=headers)

        response.raise_for_status()

        access_token = response.json().get("access_token", "")

        print("operation = oAuthForDristi, result = SUCCESS")

        return access_token

    except Exception as e:

        print("Error during OAuth for Dristi:", e)

        return None


def get_all_the_individual_citizen(auth_token):
    uri = "https://dristi-kerala-uat.pucar.org/individual/v1/_search?limit=10000&offset=0&tenantId=kl&includeDeleted=true"  # individual search end point
    request_info = {
        "authToken": auth_token,
    }
    individual = {"roleCodes": ["CITIZEN"]}
    request = {"RequestInfo": request_info, "Individual": individual}
    individual_list = fetch_result(uri, request)
    # print(individual_list.get("Individual"))
    json_array = individual_list.get("Individual")
    categorize(json_array)
    success = 0
    fail = 0
    update_uri = "https://dristi-kerala-uat.pucar.org/individual/v1/_update"  # individual update end point

    rows = []

    for user_type, json_objects in grouped_by_user_type.items():
        for obj in json_objects:
            request_for_update = {"RequestInfo": request_info, "Individual": obj}
            try:
                result = fetch_result(update_uri, request_for_update)
                success += 1
                rows.append({"Individual ID": obj.get("individualId"), "Status": "Success"})
            except Exception as e:
                print("Error during update:", e)
                print(obj.get("individualId"))
                fail += 1
                rows.append({"Individual ID": obj.get("individualId"), "Status": f"Error: {str(e)}"})
    
    df = pd.DataFrame(rows)
    excel_file = "individual_updates.xlsx"
    df.to_excel(excel_file, index=False)
    print("success :", success, "failed :", fail)


def categorize(json_array):
    for item in json_array:
        user_type_string = ""
        json_object = item

        additional_fields = json_object.get("additionalFields", {})
        fields = additional_fields.get("fields", [])

        user_details = json_object.get("userDetails", {})
        roles_arr = []

        for field in fields:
            if field.get("key") == "userType":
                user_type_string = field.get("value", "")
                if user_type_string.upper() == "LITIGANT":
                    roles_arr = litigant_role
                elif user_type_string.upper() == "ADVOCATE":
                    roles_arr = advocate_role
                break

        for field in fields:
            if field.get("key") == "userTypeDetail":
                user_type_detail = field.get("value", {})
                if isinstance(user_type_detail, dict):
                    code_role = (
                        litigant_code_role
                        if user_type_string.upper() == "LITIGANT"
                        else advocate_code_role
                    )
                    user_type_detail["role"] = code_role
                    field["value"] = user_type_detail
                break

        additional_fields["fields"] = fields
        user_details["roles"] = roles_arr

        json_object["userDetails"] = user_details
        json_object["additionalFields"] = additional_fields
        grouped_by_user_type[user_type_string].append(json_object)


auth_token = initialize_system_user()
get_all_the_individual_citizen(auth_token)
