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
    Request({
      url: Urls.application.applicationSearch,
      useCache: true,
      userService: true,
      data,
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
      data,
      params,
    }),
  createEvidence: (data, params) =>
    Request({
      url: Urls.evidence.evidenceCreate,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  updateEvidence: (data, params) =>
    Request({
      url: Urls.evidence.evidenceUpdate,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  createBailBond: (data, params) =>
    Request({
      url: Urls.bailBond.bailBondCreate,
      useCache: false,
      userService: true,
      data,
      params,
    }),
  updateBailBond: (data, params) =>
    Request({
      url: Urls.bailBond.bailBondUpdate,
      useCache: false,
      userService: true,
      data,
      params,
    }),
  searchBailBond: (data, params) =>
    Request({
      url: Urls.bailBond.bailBondSearch,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  searchOpenApiBailBond: (data, params) =>
    Request({
      url: Urls.openApi.bailSearch,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  searchOpenApiWitnessDeposition: (data, params) =>
    Request({
      url: Urls.openApi.witnessDepositionSearch,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  searchOpenApiDigitizedDocument: (data, params) =>
    Request({
      url: Urls.openApi.digitizedDocumentSearch,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  updateOpenBailBond: (data, params) =>
    Request({
      url: Urls.openApi.updateBailBond,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  updateOpenWitnessDeposition: (data, params) =>
    Request({
      url: Urls.openApi.updateWitnessDeposition,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  updateOpenDigitizedDocument: (data, params) =>
    Request({
      url: Urls.openApi.updateDigitizedDocument,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  getPendingTask: (data, params) =>
    Request({
      url: Urls.getPendingTaskFields,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  createDigitalization: (data, params) =>
    Request({
      url: Urls.digitalization.digitalizationCreate,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  updateDigitalization: (data, params) =>
    Request({
      url: Urls.digitalization.digitalizationUpdate,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  searchDigitalization: (data, params) =>
    Request({
      url: Urls.digitalization.digitalizationSearch,
      useCache: false,
      userService: false,
      data,
      params,
    }),
};
