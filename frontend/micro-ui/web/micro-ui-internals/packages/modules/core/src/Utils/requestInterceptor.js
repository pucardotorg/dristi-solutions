import Axios from "axios";

export const setupRequestInterceptor = () => {
  Axios.interceptors.request.use(
    (config) => {
      // Override apiId in RequestInfo to 'Dristi'
      if (config.data && config.data.RequestInfo) {
        config.data.RequestInfo.apiId = 'Dristi';
      }
      return config;
    },
    (error) => {
      console.error("Request Interceptor Error:", error);
      return Promise.reject(error);
    }
  );
};

export default setupRequestInterceptor;
