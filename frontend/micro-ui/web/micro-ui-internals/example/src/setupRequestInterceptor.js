import { Request } from "@egovernments/digit-ui-libraries";
import Axios from "axios";

/**
 * Sets up request interceptors to add courtId header to all API requests
 * This enables multi-tenancy based on court selection from the topbar dropdown
 */
export const setupRequestInterceptor = () => {
  const originalRequest = Request.request;

  const RequestWithInterceptor = (options) => {
    const courtId = sessionStorage.getItem("courtId") || "KLKM52";
    
    return originalRequest({
      ...options,
      headers: {
        ...(options.headers || {}),
        courtId,
      },
    });
  };

  Request.request = RequestWithInterceptor;

  Axios.interceptors.request.use(
    (config) => {
      if (!config.headers.courtId) {
        config.headers.courtId = sessionStorage.getItem("courtId") || "KLKM52";
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
  
};
