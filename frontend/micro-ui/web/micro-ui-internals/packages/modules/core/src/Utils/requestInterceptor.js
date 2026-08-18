import axiosInstance from "./axiosInstance";

export const setupRequestInterceptor = () => {
  axiosInstance.interceptors.request.use(
    (config) => {
      const isFileStoreApi = config.url && config.url.includes("/filestore/v1/files/url");

      if (isFileStoreApi) {
        const fileStoreIds = config.params && config.params.fileStoreIds;

        if (!fileStoreIds) {
          //This is getting called from DIGIT front end repo, and always give {} in response anyways,
          // so we  are better off not calling this api unnecessarily to improve app performance.
          // Instead of rejecting, modify the request to a dummy URL that will return {}
          // and add a custom adapter to return an empty object
          config.adapter = function (config) {
            return Promise.resolve({
              data: {},
              status: 200,
              statusText: "OK",
              headers: {},
              config: config,
            });
          };
        }
      }

      // Override apiId in RequestInfo to 'Dristi'
      if (config.data && config.data.RequestInfo) {
        config.data.RequestInfo.apiId = "Dristi";
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
