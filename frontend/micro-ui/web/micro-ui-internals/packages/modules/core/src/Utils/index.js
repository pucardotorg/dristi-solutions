import axiosInstance from "./axiosInstance";
axiosInstance.interceptors.response.use(
  (res) => res,
  (err) => {
    const isEmployee = window.location.pathname.split("/").includes("employee");
    if (err?.response?.data?.Errors) {
      for (const error of err.response.data.Errors) {
        if (error.message.includes("InvalidAccessTokenException")) {
          localStorage.clear();
          sessionStorage.clear();
          window.location.href =
            (isEmployee ? `/${window?.contextPath}/employee/user/login` : `/${window?.contextPath}/citizen/select-language`) +
            `?from=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        } else if (
          error?.message?.toLowerCase()?.includes("internal server error") ||
          error?.message?.toLowerCase()?.includes("some error occured")
        ) {
          window.location.href =
            (isEmployee ? `/${window?.contextPath}/employee/user/error` : `/${window?.contextPath}/citizen/error`) +
            `?type=maintenance&from=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        } else if (error.message.includes("ZuulRuntimeException")) {
          window.location.href =
            (isEmployee ? `/${window?.contextPath}/employee/user/error` : `/${window?.contextPath}/citizen/error`) +
            `?type=notfound&from=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        }
      }
    }
    throw err;
  }
);

const requestInfo = () => ({
  authToken: window?.Digit.UserService.getUser()?.access_token || null,
});

const authHeaders = () => ({
  "auth-token": window?.Digit.UserService.getUser()?.access_token || null,
});

const userServiceData = (additionInfo) => {
  if (Boolean(additionInfo) && Object.keys(additionInfo).length > 0) {
    return { userInfo: { ...window?.Digit.UserService.getUser()?.info, ...additionInfo } };
  }
  return { userInfo: window?.Digit.UserService.getUser()?.info };
};

window.Digit = window.window.Digit || {};
window.Digit = { ...window.Digit, RequestCache: window.Digit.RequestCache || {} };
export const Request = async ({
  method = "POST",
  url,
  data = {},
  headers = {},
  useCache = false,
  params = {},
  auth,
  urlParams = {},
  userService,
  locale = true,
  authHeader = false,
  setTimeParam = true,
  userDownload = false,
  noRequestInfo = false,
  multipartFormData = false,
  multipartData = {},
  reqTimestamp = false,
  additionInfo = {},
}) => {
  const ts = new Date().getTime();
  if (method.toUpperCase() === "POST") {
    data.RequestInfo = {
      apiId: "Dristi",
    };
    if (auth || !!window?.Digit.UserService.getUser()?.access_token) {
      data.RequestInfo = { ...data.RequestInfo, ...requestInfo() };
    }
    if (userService) {
      data.RequestInfo = { ...data.RequestInfo, ...userServiceData(additionInfo) };
    }
    if (locale) {
      data.RequestInfo = { ...data.RequestInfo, msgId: `${ts}|${window?.Digit.StoreData.getCurrentLanguage()}` };
    }

    if (noRequestInfo) {
      delete data.RequestInfo;
    }
    const privacy = window?.Digit.Utils.getPrivacyObject();
    if (privacy && !url.includes("/edcr/rest/dcr/")) {
      if (!noRequestInfo) {
        data.RequestInfo = { ...data.RequestInfo, plainAccessRequest: { ...privacy } };
      }
    }
  }

  const headers1 = {
    "Content-Type": "application/json",
    Accept: window?.globalConfigs?.getConfig("ENABLE_SINGLEINSTANCE") ? "application/pdf,application/json" : "application/pdf",
  };

  if (authHeader) headers = { ...headers, ...authHeaders() };

  if (userDownload) headers = { ...headers, ...headers1 };

  let key = "";
  if (useCache) {
    key = `${method.toUpperCase()}.${url}.${btoa(escape(JSON.stringify(params, null, 0)))}.${btoa(escape(JSON.stringify(data, null, 0)))}`;
    const value = window.window?.Digit.RequestCache[key];
    if (value) {
      return value;
    }
  } else if (setTimeParam) {
    params._ = Date.now();
  }
  if (reqTimestamp) {
    data.RequestInfo = { ...data.RequestInfo, ts: Number(ts) };
  }

  let _url = url
    .split("/")
    .map((path) => {
      let key = path.split(":")?.[1];
      return urlParams[key] ? urlParams[key] : path;
    })
    .join("/");

  if (multipartFormData) {
    const multipartFormDataRes = await axiosInstance({
      method,
      url: _url,
      data: multipartData.data,
      params,
      headers: { "Content-Type": "multipart/form-data", "auth-token": window?.Digit.UserService.getUser()?.access_token || null },
    });
    return multipartFormDataRes;
  }

  const tenantInfo =
    window?.Digit.SessionStorage.get("userType") === "citizen"
      ? window?.Digit.ULBService.getStateId()
      : window?.Digit.ULBService.getCurrentTenantId() || window?.Digit.ULBService.getStateId();
  if (!params["tenantId"] && window?.globalConfigs?.getConfig("ENABLE_SINGLEINSTANCE")) {
    params["tenantId"] = tenantInfo;
  }

  const res = userDownload
    ? await axiosInstance({ method, url: _url, data, params, headers, responseType: "arraybuffer" })
    : await axiosInstance({ method, url: _url, data, params, headers });

  if (userDownload) return res;

  const returnData = res?.data || res?.response?.data || {};
  if (useCache && res?.data && Object.keys(returnData).length !== 0) {
    window.Digit.RequestCache[key] = returnData;
  }
  return returnData;
};

export const ServiceRequest = async ({
  serviceName,
  method = "POST",
  url,
  data = {},
  headers = {},
  useCache = false,
  params = {},
  auth,
  reqTimestamp,
  userService,
}) => {
  const preHookName = `${serviceName}Pre`;
  const postHookName = `${serviceName}Post`;

  let reqParams = params;
  let reqData = data;
  if (window[preHookName] && typeof window[preHookName] === "function") {
    let preHookRes = await window[preHookName]({ params, data });
    reqParams = preHookRes.params;
    reqData = preHookRes.data;
  }
  const resData = await Request({ method, url, data: reqData, headers, useCache, params: reqParams, auth, userService, reqTimestamp });

  if (window[postHookName] && typeof window[postHookName] === "function") {
    return await window[postHookName](resData);
  }
  return resData;
};

export const userTypeOptions = [
  {
    code: "LITIGANT",
    name: "LITIGANT_TEXT",
    showBarDetails: false,
    isVerified: false,
    role: [
      "CASE_CREATOR",
      "CASE_EDITOR",
      "CASE_VIEWER",
      "EVIDENCE_CREATOR",
      "EVIDENCE_VIEWER",
      "EVIDENCE_EDITOR",
      "APPLICATION_CREATOR",
      "APPLICATION_VIEWER",
      "HEARING_VIEWER",
      "ORDER_VIEWER",
      "SUBMISSION_CREATOR",
      "SUBMISSION_RESPONDER",
      "SUBMISSION_DELETE",
      "TASK_VIEWER",
      "ADVOCATE_VIEWER",
      "PENDING_TASK_CREATOR",
      "BAIL_BOND_CREATOR",
      "BAIL_BOND_VIEWER",
      "BAIL_BOND_EDITOR",
    ],
    subText: "LITIGANT_SUB_TEXT",
  },
  {
    code: "ADVOCATE",
    name: "ADVOCATE_TEXT",
    showBarDetails: true,
    isVerified: true,
    hasBarRegistrationNo: true,
    role: [
      "ADVOCATE_ROLE",
      "CASE_CREATOR",
      "CASE_EDITOR",
      "CASE_VIEWER",
      "EVIDENCE_CREATOR",
      "EVIDENCE_VIEWER",
      "EVIDENCE_EDITOR",
      "APPLICATION_CREATOR",
      "APPLICATION_VIEWER",
      "HEARING_VIEWER",
      "ORDER_VIEWER",
      "SUBMISSION_CREATOR",
      "SUBMISSION_RESPONDER",
      "SUBMISSION_DELETE",
      "TASK_VIEWER",
      "USER_REGISTER",
      "ADVOCATE_VIEWER",
      "ADVOCATE_APPLICATION_VIEWER",
      "PENDING_TASK_CREATOR",
      "BAIL_BOND_CREATOR",
      "BAIL_BOND_VIEWER",
      "BAIL_BOND_EDITOR",
    ],
    apiDetails: {
      serviceName: "/advocate/v1/_create",
      requestKey: "advocate",
      AdditionalFields: ["barRegistrationNumber"],
    },
    subText: "ADVOCATE_SUB_TEXT",
  },
  {
    code: "ADVOCATE_CLERK",
    name: "ADVOCATE_CLERK_TEXT",
    showBarDetails: true,
    hasStateRegistrationNo: true,
    isVerified: true,
    role: [
      "ADVOCATE_CLERK_ROLE",
      "CASE_CREATOR",
      "CASE_EDITOR",
      "CASE_VIEWER",
      "EVIDENCE_CREATOR",
      "EVIDENCE_VIEWER",
      "EVIDENCE_EDITOR",
      "APPLICATION_CREATOR",
      "APPLICATION_VIEWER",
      "HEARING_VIEWER",
      "ORDER_VIEWER",
      "SUBMISSION_CREATOR",
      "SUBMISSION_RESPONDER",
      "SUBMISSION_DELETE",
      "TASK_VIEWER",
      "USER_REGISTER",
      "ADVOCATE_VIEWER",
      "ADVOCATE_APPLICATION_VIEWER",
      "PENDING_TASK_CREATOR",
      "BAIL_BOND_CREATOR",
      "BAIL_BOND_VIEWER",
      "BAIL_BOND_EDITOR",
    ],
    apiDetails: {
      serviceName: "/advocate/clerk/v1/_create",
      requestKey: "clerk",
      AdditionalFields: ["stateRegnNumber"],
    },

    subText: "ADVOCATE_CLERK_SUB_TEXT",
  },
];

export const extractedSeniorAdvocates = (officeMembersData = {}) => {
  const members = officeMembersData?.members || [];
  return members.map((member, index) => {
    return {
      advocateName: member?.officeAdvocateName || "",
      id: member?.officeAdvocateId,
      value: member?.officeAdvocateId,
      uuid: member?.officeAdvocateUserUuid,
    };
  });
};
