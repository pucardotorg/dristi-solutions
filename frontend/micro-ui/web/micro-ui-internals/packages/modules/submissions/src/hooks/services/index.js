import { Request } from "@egovernments/digit-ui-libraries";
import { Urls } from "./Urls";

export const submissionService = {
  createApplication: (data, params) =>
    Request({
      url: Urls.application.applicationCreate,
      useCache: false,
      userService: true,
      data,
      params,
    }),
  updateApplication: (data, params) =>
    Request({
      url: Urls.application.applicationUpdate,
      useCache: false,
      userService: true,
      data,
      params,
    }),
  searchApplication: (data, params) =>
    // Add courtId to criteria if it exists
    Request({
      url: Urls.application.applicationSearch,
      useCache: true,
      userService: true,
      data:{...data,criteria:{...data?.criteria,courtId:window?.globalConfigs?.getConfig("COURT_ID") || "KLKM52"}},
      params,
    }),
  customApiService: (url, data, params, useCache = false, userService = true) =>
    Request({
      url: url,
      useCache,
      userService,
      data: {
        ...data,
        ...(data?.pendingTask && {
          pendingTask: {
            ...data?.pendingTask,
            screenType: data?.pendingTask?.isDiary ? "Adiary" : "home",
          },
        }),
      },
      params,
    }),
  getPendingTaskService: (data, params) =>
    Request({
      url: Urls.application.getPendingTaskFields,
      useCache: false,
      userService: true,
      data,
      params,
    }),
  searchEvidence: (data, params) =>
    Request({
      url: Urls.evidence.evidenceSearch,
      useCache: false,
      userService: false,
      data: {...data,criteria:{...data?.criteria,courtId:window?.globalConfigs?.getConfig("COURT_ID") || "KLKM52"}},
      params,
    }),
};
