import { Request } from "@egovernments/digit-ui-libraries";
import { Urls } from "../hooks";

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
  deleteIndividualUser: (data, params) =>
    Request({
      url: Urls.dristi.deleteIndividual,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  searchEmployeeUser: (data, params) =>
    Request({
      url: Urls.dristi.searchEmployee,
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
      data: { ...data, criteria: [...data?.criteria] },
      params,
    }),
  caseListSearchService: (data, params) =>
    Request({
      url: Urls.dristi.caseListSearch,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  caseDetailSearchService: (data, params) =>
    Request({
      url: Urls.dristi.caseDetailSearch,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  summaryCaseSearchService: (data, params) =>
    Request({
      url: Urls.dristi.summaryCaseSearch,
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
  updateDigitizedDocument: (data, params) =>
    Request({
      url: Urls.dristi.updateDigitizedDocument,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  createDigitizedDocument: (data, params) =>
    Request({
      url: Urls.dristi.createDigitizedDocument,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  searchDigitizedDocument: (data) => {
    return Request({
      url: Urls.dristi.searchDigitizedDocument,
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
    const updatedData = { hearing: { ...hearing, workflow: { action: "START" } } };
    return Request({
      url: Urls.dristi.updateHearings,
      useCache: false,
      userService: false,
      data: updatedData,
      params,
    });
  },
  createHearings: (data, params) => {
    const presidedBy = {
      judgeID: [localStorage.getItem("judgeId")],
      benchID: window?.globalConfigs?.getConfig("BENCH_ID") || "BENCH_ID",
      courtID: localStorage.getItem("courtId"),
    };
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
  getDraftOrder: (data, params) => {
    return Request({
      url: Urls.dristi.getDraftOrder,
      useCache: false,
      userService: false,
      data,
      params,
    });
  },
  createOrder: (data, params) => {
    return Request({
      url: Urls.dristi.ordersCreate,
      useCache: false,
      userService: false,
      data,
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
  searchBotdOrders: (data, params) => {
    return Request({
      url: Urls.dristi.botdOrdersSearch,
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
  addAddress: (data, params) =>
    Request({
      url: Urls.case.addAddress,
      useCache: false,
      userService: true,
      data,
      params,
    }),
  addNewWitness: (data, params) =>
    Request({
      url: Urls.case.addNewWitness,
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
  eSignOpenService: (url, data, params) => {
    return Request({
      url: url,
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
  getTreasuryPaymentBreakup: (data, params) =>
    Request({
      url: Urls.dristi.getTreasuryPaymentBreakup,
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
  etreasuryCreateDemand: (data, params) =>
    Request({
      url: Urls.dristi.etreasuryCreateDemand,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  getMarkAsEvidencePdf: (data, params) =>
    Request({
      url: Urls.dristi.getMarkAsEvidencePdf,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  searchTask: (data, params) =>
    Request({
      url: Urls.dristi.taskSearch,
      useCache: true,
      userService: true,
      data,
      params,
    }),
  getInportalEligibility: (params) =>
    Request({
      url: Urls.dristi.eligibility,
      useCache: false,
      userService: true,
      params,
      method: "POST",
    }),
  postInportalFeedback: (data, params) =>
    Request({
      url: Urls.dristi.feedback,
      useCache: false,
      userService: true,
      params,
      data,
    }),
  postInportalRemindMeLater: (params) =>
    Request({
      url: Urls.dristi.remindMeLater,
      useCache: false,
      userService: true,
      params,
      method: "POST",
    }),
  createTaskManagementService: (data, params) => {
    return Request({
      url: Urls.taskManagement.taskManagementCreate,
      useCache: false,
      userService: true,
      data,
      params,
    });
  },
  updateTaskManagementService: (data, params) => {
    return Request({
      url: Urls.taskManagement.taskManagementUpdate,
      useCache: false,
      userService: true,
      data: data,
      params,
    });
  },
  searchTaskManagementService: (data, params) =>
    Request({
      url: Urls.taskManagement.taskManagementSearch,
      useCache: false,
      userService: true,
      data,
      params,
    }),
  createOfflinePaymentService: (data, params) => {
    return Request({
      url: Urls.taskManagement.createOfflinePayment,
      useCache: false,
      userService: true,
      data,
      params,
    });
  },
  searchBailBonds: (data, params) =>
    Request({
      url: Urls.dristi.searchBailBonds,
      useCache: false,
      userService: true,
      data,
      params,
    }),
  // Advocate Office Management
  addOfficeMember: (data, params) =>
    Request({
      url: Urls.dristi.addOfficeMember,
      useCache: false,
      userService: true,
      data,
      params,
    }),
  searchOfficeMember: (data, params) =>
    Request({
      url: Urls.dristi.searchOfficeMember,
      useCache: false,
      userService: true,
      data,
      params,
    }),
  leaveOffice: (data, params) =>
    Request({
      url: Urls.dristi.leaveOffice,
      useCache: false,
      userService: true,
      data,
      params,
    }),
};
