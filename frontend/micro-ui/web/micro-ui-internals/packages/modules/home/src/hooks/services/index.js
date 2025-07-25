import { Request } from "@egovernments/digit-ui-libraries";
export const Urls = {
  getPendingTaskFields: "/inbox/v2/_getFields",
  caseSearch: "/case/v1/_search",
  caseSearchList: "/case/v2/search/list",
  applicationSearch: "/application/v1/search",
  orderCreate: "/order/v1/create",
  pendingTask: "/analytics/pending_task/v1/create",
  orderSearch: "/order/v1/search",
  getSearchReschedule: "/scheduler/hearing/v1/reschedule/_search",
  submitOptOutDates: "/scheduler/hearing/v1/_opt-out",
  generateADiaryPDF: "/ab-diary/case/diary/v1/generate",
  updateADiaryPDF: "/ab-diary/case/diary/v1/update",
  searchADiary: "/ab-diary/case/diary/v1/search",
  inboxSearch: "/inbox/v2/index/_search",
  pendingTaskSearch: "/inbox/v2/_getFields/actionCategory",
  updateSignedBailBonds: "/bail-bond/v1/_updateSignedBails",
  getBailBondsToSign: "/bail-bond/v1/_getBailsToSign",
  bailBondUpdate: "/bail-bond/v1/_update",
  bailBondSearch: "/bail-bond/v1/_search",
};
export const HomeService = {
  InboxSearch: (data, params) =>
    Request({
      url: Urls.inboxSearch,
      useCache: true,
      userService: true,
      data,
      params,
    }),
  pendingTaskSearch: (data, params) =>
    Request({
      url: Urls.pendingTaskSearch,
      useCache: true,
      userService: true,
      data,
      params,
    }),
  getPendingTaskService: (data, params) =>
    Request({
      url: Urls.getPendingTaskFields,
      useCache: false,
      userService: true,
      data,
      params,
    }),
  customApiService: (url, data, params, useCache = false, userService = true) =>
    Request({
      url: url,
      useCache: useCache,
      userService: true,
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
  searchReschedule: (data, params) => {
    return Request({
      url: Urls.getSearchReschedule,
      useCache: false,
      userService: false,
      data,
      params,
    });
  },
  generateADiaryPDF: (data, params) => {
    return Request({
      url: Urls.generateADiaryPDF,
      useCache: false,
      userService: false,
      data,
      params,
    });
  },
  updateADiaryPDF: (data, params) => {
    return Request({
      url: Urls.updateADiaryPDF,
      useCache: false,
      userService: false,
      data,
      params,
    });
  },
  getADiarySearch: (data, params) => {
    return Request({
      url: Urls.searchADiary,
      useCache: false,
      userService: false,
      data,
      params,
    });
  },
  getBailBondsToSign: (data, params) =>
    Request({
      url: Urls.getBailBondsToSign,
      useCache: false,
      userService: true,
      data,
      params,
    }),
  updateSignedBailBonds: (data, params) =>
    Request({
      url: Urls.updateSignedBailBonds,
      useCache: false,
      userService: true,
      data,
      params,
    }),
  updateBailBond: (data, params) =>
    Request({
      url: Urls.bailBondUpdate,
      useCache: false,
      userService: true,
      data,
      params,
    }),
  searchBailBond: (data, params) =>
    Request({
      url: Urls.bailBondSearch,
      useCache: false,
      userService: false,
      data,
      params,
    }),
};
