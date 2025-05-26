import requests
import csv

env = "dristi-kerala-dev.pucar.org"
headers = {
    "accept": "application/json, text/plain, */*",
    "accept-language": "en-US,en;q=0.8",
    "content-type": "application/json;charset=UTF-8",
    "priority": "u=1, i",
    "sec-ch-ua": '"Brave";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    "sec-ch-ua-mobile": "?1",
    "sec-ch-ua-platform": '"Android"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "sec-gpc": "1",
    "user-agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
}

auth_token = "6221ffd5-305c-4679-a7f6-d2b066ad2308"

limit = 1


def update_case(case, writer):
    print("or", case)
    url = "https://" + env + "/case/v1/_update?tenantId=kl"
    case["workflow"] = {"action": "ADMIT"}
    data = {
        "cases": case,
        "tenantId": "kl",
        "RequestInfo": {
            "apiId": "Rainmaker",
            "authToken": auth_token,
            "msgId": "1735826138164|en_IN",
            "plainAccessRequest": {},
        },
    }

    try:
        response = requests.post(url, headers=headers, json=data).json()

        if "Error" in response:
            writer.writerow(
                [case["id"], case["filingNumber"], response["Error"]["message"]]
            )
        else:
            writer.writerow([case["id"], case["filingNumber"], "Success"])
        print("updated", response)

    except requests.exceptions.RequestException as e:
        print(f"Request error for case {case['id']}: {e}")
        writer.writerow([case["id"], case["filingNumber"], f"Request Error: {e}"])

    except Exception as e:
        print(f"Error processing case {case['id']}: {e}")
        writer.writerow([case["id"], case["filingNumber"], f"Error: {e}"])


def get_cases():
    url = "https://" + env + "/case/v1/_search"

    data = {
        "tenantId": "kl",
        "criteria": [
            {
                "caseSearchText": "",
                "caseType": "NIA S138",
                "substage": "",
                "tenantId": "kl",
                "status": ["ADMISSION_HEARING_SCHEDULED"],
                "pagination": {"limit": limit, "offSet": 0},
            }
        ],
        "limit": limit,
        "offSet": 0,
        "caseType": "NIA S138",
        "flow": "flow_jac",
        "RequestInfo": {
            "apiId": "Rainmaker",
            "authToken": auth_token,
            "msgId": "1735825067919|en_IN",
            "plainAccessRequest": {},
        },
    }

    with open("workflow_update_logs.csv", "a", newline="") as f:
        writer = csv.writer(f)

        if f.tell() == 0:
            writer.writerow(["Case ID", "Filing number", "Status"])

        try:
            response = requests.post(url, headers=headers, json=data).json()
            if (
                "criteria" in response
                and isinstance(response["criteria"], list)
                and "pagination" in response["criteria"][0]
            ):
                case_count = response["criteria"][0]["pagination"]["totalCount"]
                print(case_count)
                max_offset = int(case_count) // 10
                print("max", max_offset, case_count)
                max_offset += 1 if case_count % 100 != 0 else 0
                print("max", max_offset, case_count)
                for offset in range(max_offset):
                    data = {
                        "tenantId": "kl",
                        "criteria": [
                            {
                                "caseSearchText": "",
                                "caseType": "NIA S138",
                                "substage": "",
                                "tenantId": "kl",
                                "status": ["ADMISSION_HEARING_SCHEDULED"],
                                "pagination": {
                                    "limit": limit,
                                    "offSet": offset * limit,
                                },
                            }
                        ],
                        "limit": limit,
                        "offSet": offset * limit,
                        "caseType": "NIA S138",
                        "flow": "flow_jac",
                        "RequestInfo": {
                            "apiId": "Rainmaker",
                            "authToken": auth_token,
                            "msgId": "1735825067919|en_IN",
                            "plainAccessRequest": {},
                        },
                    }
                    response = requests.post(url, headers=headers, json=data).json()
                    if (
                        "criteria" in response
                        and isinstance(response["criteria"], list)
                        and "responseList" in response["criteria"][0]
                    ):
                        print(
                            "size of case list : ",
                            len(response["criteria"][0]["responseList"]),
                        )
                        for case in response["criteria"][0]["responseList"]:
                            update_case(case, writer)
                    else:
                        raise ValueError("Unexpected response structure")
                    break  # need to remove

        except requests.exceptions.RequestException as e:
            print(f"Request error during case search: {e}")
        except ValueError as e:
            print(f"Value error: {e}")
        except Exception as e:
            print(f"An unexpected error occurred: {e}")


if __name__ == "__main__":
    get_cases()
