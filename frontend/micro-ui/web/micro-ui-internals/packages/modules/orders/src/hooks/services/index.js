import { Request } from "@egovernments/digit-ui-libraries";
import { Urls } from "./Urls";

export const ordersService = {
  createOrder: (data, params) =>
    Request({
      url: Urls.orders.orderManagementCreate,
      useCache: false,
      userService: true,
      data,
      params,
    }),
  addOrderItem: (data, params) =>
    Request({
      url: Urls.orders.orderManagementAddItem,
      useCache: false,
      userService: true,
      data,
      params,
    }),
  removeOrderItem: (data, params) =>
    Request({
      url: Urls.orders.orderRemoveItem,
      useCache: false,
      userService: true,
      data,
      params,
    }),
  updateOrder: (data, params) =>
    Request({
      url: Urls.orders.orderManagementUpdate,
      useCache: false,
      userService: true,
      data,
      params,
    }),
  searchOrder: (data, params) =>
    Request({
      url: Urls.orders.orderSearch,
      useCache: true,
      userService: true,
      data,
      params,
    }),
  searchOrderNotifications: (data, params) =>
    Request({
      url: Urls.orders.orderNotificationSearch,
      useCache: true,
      userService: true,
      data,
      params,
    }),
  customApiService: (url, data, params, useCache = false, userService = true) =>
    Request({
      url: url,
      useCache: useCache,
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
      url: Urls.orders.getPendingTaskFields,
      useCache: false,
      userService: true,
      data,
      params,
    }),
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
      url: Urls.orders.createHearings,
      useCache: false,
      userService: false,
      data: updatedData,
      params,
    });
  },
  updateHearings: (data, params) => {
    return Request({
      url: Urls.orders.updateHearings,
      useCache: false,
      userService: false,
      data: data,
      params,
    });
  },
};

export const EpostService = {
  EpostUpdate: (data, params) =>
    Request({
      url: Urls.Epost.EpostUpdate,
      useCache: true,
      userService: true,
      data,
      params,
    }),
  epostUser: (data, params) =>
    Request({
      url: Urls.Epost.mdmsSearch,
      useCache: true,
      userService: true,
      data,
      params,
    }),
  ePostDownloadReports: (data, params) =>
    Request({
      url: Urls.Epost.EpostReportDownload,
      useCache: true,
      userService: true,
      data,
      params,
    }),
  customApiService: (url, data, params, useCache = false, userService = true) =>
    Request({
      url: url,
      useCache: useCache,
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
};
export const schedulerService = {
  RescheduleHearing: (data, params) =>
    Request({
      url: Urls.Scheduler.reschedule,
      useCache: true,
      userService: true,
      data,
      params,
    }),
};

export const taskService = {
  UploadTaskDocument: (data, params) =>
    Request({
      url: Urls.Task.uploadDoc,
      useCache: true,
      userService: true,
      data,
      params,
    }),

  updateTask: (data, params) =>
    Request({
      url: Urls.Task.updateTask,
      useCache: true,
      userService: true,
      data,
      params,
    }),
  searchTask: (data, params) =>
    Request({
      url: Urls.Task.search,
      useCache: true,
      userService: true,
      data,
      params,
    }),
};

export const SBIPaymentService = {
  SBIPayment: (data, params) =>
    Request({
      url: Urls.SBIPayment.payment,
      useCache: false,
      userService: true,
      data,
      params,
    }),
};

export const orderManagementService = {
  getOrdersToSign: (data, params) =>
    Request({
      url: Urls.orderManagement.getOrdersToSign,
      useCache: false,
      userService: true,
      data,
      params,
    }),
  updateSignedOrders: (data, params) =>
    Request({
      url: Urls.orderManagement.updateSignedOrders,
      useCache: false,
      userService: true,
      data,
      params,
    }),
};

export const digitalizationService = {
  getDigitalizedDocumentsToSign: (data, params) =>
    Request({
      url: Urls.digitalizationService.getDigitalizedDocumentsToSign,
      useCache: false,
      userService: true,
      data,
      params,
    }),
  updateSignedDigitalizedDocuments: (data, params) =>
    Request({
      url: Urls.digitalizationService.updateSignedDigitalizedDocuments,
      useCache: false,
      userService: true,
      data,
      params,
    }),
};

export const processManagementService = {
  getProcessToSign: (data, params) =>
    Request({
      url: Urls.processManagement.getProcessToSign,
      useCache: false,
      userService: true,
      data,
      params,
    }),
  updateSignedProcess: (data, params) =>
    Request({
      url: Urls.processManagement.updateSignedProcess,
      useCache: false,
      userService: true,
      data,
      params,
    }),
  bulkSend: (data, params) =>
    Request({
      url: Urls.processManagement.bulkSend,
      useCache: false,
      userService: true,
      data,
      params,
    }),
};

export const openApiService = {
  searchOpenApiOrders: (data, params) =>
    Request({
      url: Urls.openApi.searchOrders,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  createTaskManagementService: (data, params) => {
    return Request({
      url: Urls.openApi.taskManagementCreate,
      useCache: false,
      userService: false,
      data,
      params,
    });
  },
  updateTaskManagementService: (data, params) => {
    return Request({
      url: Urls.openApi.taskManagementUpdate,
      useCache: false,
      userService: false,
      data: data,
      params,
    });
  },
  searchTaskManagementService: (data, params) =>
    Request({
      url: Urls.openApi.taskManagementSearch,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  getSummonsPaymentBreakup: (data, params) =>
    Request({
      url: Urls.openApi.summonsPayment,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  getTreasuryPaymentBreakup: (data, params) =>
    Request({
      url: Urls.openApi.getTreasuryPaymentBreakup,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  callFetchBill: (data, params) =>
    Request({
      url: Urls.openApi.fetchBill,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  callETreasury: (data, params) =>
    Request({
      url: Urls.openApi.eTreasury,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  callSearchBill: (data, params) =>
    Request({
      url: Urls.openApi.searchBill,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  fetchBillFileStoreId: (data, params) =>
    Request({
      url: Urls.openApi.billFileStoreId,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  setCaseLock: (data, params) =>
    Request({
      url: Urls.openApi.setCaseLock,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  getPaymentLockStatus: (data, params) =>
    Request({
      url: Urls.openApi.getPaymentLockStatus,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  setCaseUnlock: (data, params) =>
    Request({
      url: Urls.openApi.setCaseUnlock,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  addAddress: (data, params) =>
    Request({
      url: Urls.openApi.addAddress,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  offlinePayment: (data, params) =>
    Request({
      url: Urls.openApi.offlinePayment,
      useCache: false,
      userService: false,
      data,
      params,
    }),
};
