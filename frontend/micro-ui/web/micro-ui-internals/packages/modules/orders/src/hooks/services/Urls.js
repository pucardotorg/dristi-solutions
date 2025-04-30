export const Urls = {
  Authenticate: "/user/oauth/token",
  orders: {
    orderCreate: "/order/v1/create",
    orderAddItem: "/order/v2/add-item",
    orderRemoveItem: "/order/v2/remove-item",
    orderUpdate: "/order/v1/update",
    orderSearch: "/order/v1/search",
    orderManagementCreate: "/order-management/v1/_createOrder",
    orderManagementUpdate: "/order-management/v1/_updateOrder",
    taskCreate: "/task/v1/create",
    pendingTask: "/analytics/pending_task/v1/create",
    createHearings: "/hearing/v1/create",
    updateHearings: "/hearing/v1/update",
    getPendingTaskFields: "/inbox/v2/_getFields",
    orderPreviewPdf: "/egov-pdf/order",
    searchTasks: "/task/v1/search",
    orderNotificationSearch: "/inbox/v2/index/_search",
  },
  FileFetchById: "/filestore/v1/files/id",
  Epost: {
    EpostUpdate: "/epost-tracker/epost/v1/_updateEPost",
  },
  Scheduler: {
    reschedule: "/scheduler/hearing/v1/_reschedule",
  },
  Task: {
    uploadDoc: "/task/v1/uploadDocument",
    updateTask: "/task/v1/update",
    search: "/task/v1/search",
  },
  SBIPayment: {
    payment: "/sbi-backend/payment/v1/_processTransaction",
  },
  orderManagement: {
    getOrdersToSign: "/order-management/v1/_getOrdersToSign",
    updateSignedOrders: "/order-management/v1/_updateSignedOrders",
  },
};
