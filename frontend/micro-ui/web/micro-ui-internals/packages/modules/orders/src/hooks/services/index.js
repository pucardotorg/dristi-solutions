import { Request } from "@egovernments/digit-ui-libraries";
import { Urls } from "./Urls";

const judgeId = localStorage.getItem("judgeId");
const benchId = window?.globalConfigs?.getConfig("BENCH_ID") || "BENCH_ID";
const courtId = localStorage.getItem("courtId");
const presidedBy = {
  judgeID: [judgeId],
  benchID: benchId,
  courtID: courtId,
};

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
      url: Urls.orders.orderAddItem,
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
    const updatedData = {
      ...data,
      hearing: {
        ...data.hearing,
        presidedBy: presidedBy,
      },
    };
    return Request({
      url: Urls.orders.updateHearings,
      useCache: false,
      userService: false,
      data: updatedData,
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
