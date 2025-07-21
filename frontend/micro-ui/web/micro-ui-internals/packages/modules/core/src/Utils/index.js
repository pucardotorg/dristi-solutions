import Axios from "axios";
Axios.interceptors.response.use(
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
      apiId: "Rainmaker",
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
    const multipartFormDataRes = await Axios({
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
    ? await Axios({ method, url: _url, data, params, headers, responseType: "arraybuffer" })
    : await Axios({ method, url: _url, data, params, headers });

  if (userDownload) return res;

  const returnData = res?.data || res?.response?.data || {};
  if (useCache && res?.data && Object.keys(returnData).length !== 0) {
    window.Digit.RequestCache[key] = returnData;
  }
  return returnData;
};

// Generate a unique request ID for tracking
const generateRequestId = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

// Get rate limit token if available
const getRateLimitToken = () => {
  return window?.Digit?.Utils?.getRateLimitToken?.();
};

// Configure secure headers for all requests
const getSecureHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': window?.globalConfigs?.getConfig("ENABLE_SINGLEINSTANCE") ? "application/pdf,application/json" : "application/pdf",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'self'",
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  'Pragma': 'no-cache',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'Referrer-Policy': 'same-origin',
  'Feature-Policy': "camera 'none'; microphone 'none'; geolocation 'none'",
  'X-DNS-Prefetch-Control': 'off',
  'X-Request-ID': generateRequestId()
});

export const ServiceRequest = async ({
  serviceName,
  method = "POST",
  url,
  data = {},
  headers: customHeaders = {},
  useCache = false,
  params = {},
  auth,
  reqTimestamp,
  userService,
}) => {
  // Merge secure headers with custom headers
  const headers = {
    ...getSecureHeaders(),
    ...customHeaders
  };

  // Add rate limiting token if available
  const rateLimitToken = getRateLimitToken();
  if (rateLimitToken) {
    headers['X-Rate-Limit-Token'] = rateLimitToken;
  }

  const preHookName = `${serviceName}Pre`;
  const postHookName = `${serviceName}Post`;

  let reqParams = params;
  let reqData = data;
  if (window[preHookName] && typeof window[preHookName] === "function") {
    let preHookRes = await window[preHookName]({ params, data });
    reqParams = preHookRes.params;
    reqData = preHookRes.data;
  }
  const resData = await Request({
    url,
    method,
    data: reqData,
    headers,
    useCache,
    params: reqParams,
    auth,
    reqTimestamp,
    userService,
    withCredentials: true,
    timeout: 30000,
    validateStatus: status => status >= 200 && status < 300
  });

  if (window[postHookName] && typeof window[postHookName] === "function") {
    return await window[postHookName](resData);
  }
  return resData;
};
