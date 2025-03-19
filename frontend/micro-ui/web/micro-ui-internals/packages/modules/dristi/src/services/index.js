import { Request } from "@egovernments/digit-ui-libraries";
import { Urls } from "../hooks";

const judgeId = window?.globalConfigs?.getConfig("JUDGE_ID") || "JUDGE_ID";
const benchId = window?.globalConfigs?.getConfig("BENCH_ID") || "BENCH_ID";
const courtId = window?.globalConfigs?.getConfig("COURT_ID") || "KLKM52";
const presidedBy = {
  judgeID: [judgeId],
  benchID: benchId,
  courtID: courtId,
};

export const DRISTIService = {
  postIndividualService: (data, tenantId) =>
    Request({
      url: Urls.dristi.individual,
      useCache: false,
      userService: false,
      data,
      params: { tenantId },
    }),
  updateAdvocateService: (data, params) =>
    Request({
      url: Urls.dristi.updateAdvocateDetails,
      useCache: false,
      userService: true,
      data,
      params,
    }),
  updateIndividualUser: (data, params) =>
    Request({
      url: Urls.dristi.updateIndividual,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  searchIndividualUser: (data, params) =>
    Request({
      url: Urls.dristi.searchIndividual,
      useCache: false,
      userService: false,
      data,
      params,
    }),

  advocateClerkService: (url, data, tenantId, userService = false, additionInfo) =>
    Request({
      url: url,
      useCache: false,
      userService: userService,
      data,
      params: { tenantId, limit: 10000 },
      additionInfo,
    }),
  searchIndividualAdvocate: (data, params) =>
    Request({
      url: Urls.dristi.searchIndividualAdvocate,
      useCache: false,
      userService: true,
      data,
      params,
    }),
  searchAdvocateClerk: (url, data, params) =>
    Request({
      url: url,
      useCache: false,
      userService: true,
      data,
      params,
    }),
  searchAllAdvocates: (url, data, params) =>
    Request({
      url: Urls.dristi.searchAllAdvocates,
      useCache: false,
      userService: true,
      data,
      params,
    }),
  caseCreateService: (data, tenantId) => {
    return Request({
      url: Urls.dristi.caseCreate,
      useCache: false,
      userService: true,
      data: data,
      params: { tenantId },
    });
  },
  caseUpdateService: (data, tenantId) => {
    return Request({
      url: Urls.dristi.caseUpdate,
      useCache: false,
      userService: true,
      data: data,
      params: { tenantId },
    });
  },
  searchCaseService: (data, params) =>
    Request({
      url: Urls.dristi.caseSearch,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  generateCasePdf: (data, params) =>
    Request({
      url: Urls.dristi.casePfGeneration,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  updateEvidence: (data, params) =>
    Request({
      url: Urls.dristi.evidenceUpdate,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  createEvidence: (data, params) =>
    Request({
      url: Urls.dristi.evidenceCreate,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  searchEvidence: (data) => {
    return Request({
      url: Urls.dristi.evidenceSearch,
      useCache: false,
      userService: false,
      data,
    });
  },
  searchHearings: (data, params) => {
    return Request({
      url: Urls.dristi.searchHearings,
      useCache: false,
      userService: false,
      data,
      params,
    });
  },
  startHearing: ({ hearing }, params) => {
    const updatedData = { hearing: { ...hearing, presidedBy: presidedBy, workflow: { action: "START" } } };
    return Request({
      url: Urls.dristi.updateHearings,
      useCache: false,
      userService: false,
      data: updatedData,
      params,
    });
  },
  createHearings: (data, params) => {
    const updatedData = {
      ...data,
      hearing: {
        ...data.hearing,
        presidedBy: presidedBy,
      },
    };
    return Request({
      url: Urls.dristi.createHearings,
      useCache: false,
      userService: false,
      data: updatedData,
      params,
    });
  },
  searchOrders: (data, params) => {
    return Request({
      url: Urls.dristi.ordersSearch,
      useCache: false,
      userService: false,
      data,
      params,
    });
  },
  searchSubmissions: (data, params) => {
    return Request({
      url: Urls.dristi.submissionsSearch,
      useCache: false,
      userService: false,
      data,
      params,
    });
  },
  updateSubmissions: (data, params) => {
    return Request({
      url: Urls.dristi.submissionsUpdate,
      useCache: false,
      userService: false,
      data,
      params,
    });
  },
  createDemand: (data, params) =>
    Request({
      url: Urls.dristi.demandCreate,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  customApiService: (url, data, params, useCache = false, userService = true) =>
    Request({
      url: url,
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
      useCache,
      userService,
    }),
  addWitness: (data, params) =>
    Request({
      url: Urls.case.addWitness,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  getPendingTaskService: (data, params) =>
    Request({
      url: Urls.dristi.getPendingTaskFields,
      useCache: false,
      userService: true,
      data,
      params,
    }),
  eSignService: (data, params) => {
    return Request({
      url: Urls.dristi.eSign,
      useCache: false,
      userService: false,
      data,
      params,
    });
  },
  getPaymentBreakup: (data, params) =>
    Request({
      url: Urls.dristi.paymentCalculator,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  callFetchBill: (data, params) =>
    Request({
      url: Urls.dristi.fetchBill,
      useCache: false,
      userService: true,
      data,
      params,
    }),
  callETreasury: (data, params) =>
    Request({
      url: Urls.dristi.eTreasury,
      useCache: false,
      userService: true,
      data,
      params,
    }),
  callSearchBill: (data, params) =>
    Request({
      url: Urls.dristi.searchBill,
      useCache: false,
      userService: true,
      data,
      params,
    }),
  fetchBillFileStoreId: (data, params) =>
    Request({
      url: Urls.dristi.billFileStoreId,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  sendDocuemntForOCR: (data, params) =>
    Request({
      url: Urls.dristi.sendOCR,
      useCache: false,
      userService: true,
      data,
      params,
    }),
  getOCRData: (data, params) =>
    Request({
      url: Urls.dristi.receiveOCR,
      useCache: false,
      userService: true,
      data,
      params,
    }),
  getTaskDocuments: (data, params) =>
    Request({
      url: Urls.dristi.taskDocuments,
      useCache: false,
      userService: true,
      data,
      params,
    }),
  judgeAvailabilityDates: (data, params) => {
    return Request({
      url: Urls.dristi.judgeAvailabilityDates,
      useCache: false,
      userService: false,
      data,
      params,
    });
  },
  getSummonsPaymentBreakup: (data, params) =>
    Request({
      url: Urls.dristi.summonsPayment,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  getrepondentPincodeDetails: (data, params) =>
    Request({
      url: Urls.dristi.repondentPincodeSearch,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  createApplication: (data, params) =>
    Request({
      url: Urls.dristi.applicationCreate,
      useCache: false,
      userService: true,
      data,
      params,
    }),
  downloadCaseBundle: (data, params) =>
    Request({
      url: Urls.dristi.downloadCaseBundle,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  setCaseLock: (data, params) =>
    Request({
      url: Urls.dristi.setCaseLock,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  getCaseLockStatus: (data, params) =>
    Request({
      url: Urls.dristi.getCaseLockStatus,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  setCaseUnlock: (data, params) =>
    Request({
      url: Urls.dristi.setCaseUnlock,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  addADiaryEntry: (data, params) =>
    Request({
      url: Urls.dristi.addADiaryEntry,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  aDiaryEntryUpdate: (data, params) =>
    Request({
      url: Urls.dristi.aDiaryEntryUpdate,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  aDiaryEntrySearch: (data, params) =>
    Request({
      url: Urls.dristi.aDiaryEntrySearch,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  getLocationBasedJurisdiction: (data, params) =>
    Request({
      url: Urls.dristi.getLocationBasedJurisdiction,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  createProfileRequest: (data, params) =>
    Request({
      url: Urls.dristi.createProfileRequest,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  processProfileRequest: (data, params) =>
    Request({
      url: Urls.dristi.processProfileRequest,
      useCache: false,
      userService: false,
      data,
      params,
    }),
};
