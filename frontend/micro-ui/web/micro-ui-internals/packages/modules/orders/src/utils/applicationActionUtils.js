import { OrderWorkflowAction } from "./constants";
import { getOrderTypes, setApplicationStatus, checkAcceptRejectOrderValidation, getOrderActionName } from "./orderUtils";

/**
 * Handles application actions like accept/reject and creates/updates orders accordingly
 * @param {Object} params Configuration object containing all required parameters
 * @returns {Promise<void>}
 */
export const handleApplicationAction = async ({
  type,
  documentSubmission,
  currentOrder,
  caseDetails,
  ordersService,
  DRISTIService,
  Urls,
  tenantId,
  cnrNumber,
  filingNumber,
  stateSlaMap,
  dayInMillisecond,
  todayDate,
  refetchOrdersData,
  history,
  t,
  toast,
  window,
}) => {
  try {
    const orderType = getOrderTypes(documentSubmission?.[0]?.applicationList?.applicationType, type);
    const refApplicationId = documentSubmission?.[0]?.applicationList?.applicationNumber;
    const applicationCMPNumber = documentSubmission?.[0]?.applicationList?.applicationCMPNumber;
    const caseNumber =
      (caseDetails?.isLPRCase ? caseDetails?.lprNumber : caseDetails?.courtCaseNumber) ||
      caseDetails?.courtCaseNumber ||
      caseDetails?.cmpNumber ||
      caseDetails?.filingNumber;

    // Create form data object
    const formdata = {
      orderType: {
        code: orderType,
        type: orderType,
        name: `ORDER_TYPE_${orderType}`,
      },
      refApplicationId,
      applicationStatus: documentSubmission?.[0]?.applicationList?.applicationType
        ? setApplicationStatus(type, documentSubmission[0].applicationList.applicationType)
        : null,
      ...(documentSubmission?.[0]?.applicationList?.applicationType === "DELAY_CONDONATION" && {
        isDcaAcceptedOrRejected: {
          code: type === "reject" ? "REJECTED" : type === "accept" ? "ACCEPTED" : null,
          name: type === "reject" ? "REJECTED" : type === "accept" ? "ACCEPTED" : null,
        },
      }),
    };

    // Get additional details
    const linkedOrderNumber = documentSubmission?.[0]?.applicationList?.additionalDetails?.formdata?.refOrderId;
    const applicationNumber = [refApplicationId];
    const hearingNumber =
      ["INITIATING_RESCHEDULING_OF_HEARING_DATE", "CHECKOUT_ACCEPTANCE"].includes(orderType) &&
      documentSubmission?.[0]?.applicationList?.additionalDetails?.hearingId;
    const parties = documentSubmission?.[0]?.applicationList?.additionalDetails?.onBehalOfName && {
      parties: [{ partyName: documentSubmission?.[0]?.applicationList?.additionalDetails?.onBehalOfName }],
    };

    const additionalDetails = {
      formdata,
      applicationStatus: documentSubmission?.[0]?.applicationList?.applicationType
        ? setApplicationStatus(type, documentSubmission[0].applicationList.applicationType)
        : null,
      ...(linkedOrderNumber && { linkedOrderNumber }),
      ...(applicationNumber && { applicationNumber }),
      ...(hearingNumber && { hearingNumber }),
    };

    // Check if same order or new order
    const isSameOrder =
      currentOrder?.orderCategory === "COMPOSITE"
        ? currentOrder?.compositeItems?.some(
            (item) => item?.isEnabled && item?.orderSchema?.additionalDetails?.formdata?.refApplicationId === refApplicationId
          )
        : currentOrder?.additionalDetails?.formdata?.refApplicationId === refApplicationId;
    const isNewOrder = isSameOrder || checkAcceptRejectOrderValidation(orderType, currentOrder);

    if (currentOrder && currentOrder?.orderTitle && !isNewOrder) {
      try {
        let response;
        if (currentOrder?.orderCategory === "INTERMEDIATE" && currentOrder?.orderType) {
          response = await handleIntermediateOrderWithType({
            currentOrder,
            orderType,
            additionalDetails,
            parties,
            documentSubmission,
            refApplicationId,
            applicationCMPNumber,
            caseNumber,
            type,
            linkedOrderNumber,
            applicationNumber,
            ordersService,
            tenantId,
            t,
          });
        } else if (currentOrder?.orderCategory === "INTERMEDIATE" && !currentOrder?.orderType) {
          response = await handleIntermediateOrderWithoutType({
            currentOrder,
            orderType,
            applicationNumber,
            additionalDetails,
            parties,
            documentSubmission,
            refApplicationId,
            applicationCMPNumber,
            caseNumber,
            type,
            linkedOrderNumber,
            ordersService,
            tenantId,
            t,
            toast,
          });
        } else {
          response = await handleCompositeOrder({
            currentOrder,
            orderType,
            additionalDetails,
            parties,
            documentSubmission,
            refApplicationId,
            applicationCMPNumber,
            caseNumber,
            linkedOrderNumber,
            applicationNumber,
            ordersService,
            tenantId,
          });
        }

        await createPendingTask({
          DRISTIService,
          Urls,
          currentOrder,
          orderType,
          response,
          cnrNumber,
          filingNumber,
          caseDetails,
          stateSlaMap,
          dayInMillisecond,
          todayDate,
          tenantId,
        });

        sessionStorage.setItem("currentOrderType", orderType);
        await refetchOrdersData();
        history.replace(
          `/${window.contextPath}/employee/orders/generate-order?filingNumber=${filingNumber}&orderNumber=${response?.order?.orderNumber}`
        );
      } catch (error) {
        toast.error(t("SOMETHING_WENT_WRONG"));
      }
    } else {
      await handleNewOrder({
        tenantId,
        cnrNumber,
        filingNumber,
        applicationNumber,
        orderType,
        additionalDetails,
        parties,
        documentSubmission,
        refApplicationId,
        applicationCMPNumber,
        caseNumber,
        type,
        linkedOrderNumber,
        ordersService,
        DRISTIService,
        Urls,
        caseDetails,
        stateSlaMap,
        dayInMillisecond,
        todayDate,
        refetchOrdersData,
        history,
        window,
        t,
      });
    }
  } catch (error) {
    toast.error(t("SOMETHING_WENT_WRONG"));
  }
};

const handleIntermediateOrderWithType = async ({
  currentOrder,
  orderType,
  additionalDetails,
  parties,
  documentSubmission,
  refApplicationId,
  applicationCMPNumber,
  caseNumber,
  type,
  linkedOrderNumber,
  applicationNumber,
  ordersService,
  tenantId,
  t,
}) => {
  const compositeItems = [
    {
      orderType: currentOrder?.orderType,
      orderSchema: {
        applicationNumber: currentOrder?.applicationNumber,
        orderDetails: currentOrder?.orderDetails,
        additionalDetails: {
          ...currentOrder?.additionalDetails,
          hearingNumber: currentOrder?.hearingNumber,
          linkedOrderNumber: currentOrder?.linkedOrderNumber,
          applicationNumber: currentOrder?.applicationNumber,
          applicationCMPNumber: applicationCMPNumber,
          ...(orderType === "EXTENSION_OF_DOCUMENT_SUBMISSION_DATE" ? { action: type === "reject" ? "REJECT" : "APPROVE" } : {}),
        },
      },
    },
    {
      orderType: orderType,
      orderSchema: {
        additionalDetails: additionalDetails,
        orderDetails: {
          ...(parties || {}),
          applicationTitle: t(documentSubmission?.[0]?.applicationList?.applicationType),
          applicationNumber: refApplicationId,
          applicationCMPNumber: applicationCMPNumber,
          caseNumber: caseNumber,
          ...(orderType === "EXTENSION_OF_DOCUMENT_SUBMISSION_DATE" ? { action: type === "reject" ? "REJECT" : "APPROVE" } : {}),
        },
        ...(linkedOrderNumber && { linkedOrderNumber }),
        ...(applicationNumber && { applicationNumber }),
      },
    },
  ];

  const payload = {
    order: {
      ...currentOrder,
      additionalDetails: null,
      orderDetails: null,
      orderType: null,
      orderCategory: "COMPOSITE",
      orderTitle: `${t(currentOrder?.orderType)} and Other Items`,
      compositeItems,
      ...(linkedOrderNumber && { linkedOrderNumber }),
      workflow: {
        action: OrderWorkflowAction.SAVE_DRAFT,
        comments: "Creating order",
        assignes: null,
        rating: null,
        documents: [{}],
      },
    },
  };

  if (currentOrder?.orderNumber) {
    return await ordersService.addOrderItem(payload, { tenantId });
  }
  return await ordersService.createOrder(payload, { tenantId });
};

const handleIntermediateOrderWithoutType = async ({
  currentOrder,
  orderType,
  applicationNumber,
  additionalDetails,
  parties,
  documentSubmission,
  refApplicationId,
  applicationCMPNumber,
  caseNumber,
  type,
  linkedOrderNumber,
  ordersService,
  tenantId,
  t,
}) => {
  const reqbody = {
    order: {
      ...currentOrder,
      orderType: orderType,
      applicationNumber: applicationNumber,
      additionalDetails,
      orderTitle: orderType,
      workflow: {
        action: OrderWorkflowAction.SAVE_DRAFT,
        comments: "Updating order",
        assignes: null,
        rating: null,
        documents: [{}],
      },
      orderDetails: {
        ...(parties || {}),
        applicationTitle: t(documentSubmission?.[0]?.applicationList?.applicationType),
        applicationNumber: refApplicationId,
        applicationCMPNumber: applicationCMPNumber,
        caseNumber: caseNumber,
        ...(orderType === "EXTENSION_OF_DOCUMENT_SUBMISSION_DATE" ? { action: type === "reject" ? "REJECT" : "APPROVE" } : {}),
      },
      ...(linkedOrderNumber && { linkedOrderNumber }),
    },
  };

  return await ordersService.updateOrder(reqbody, { tenantId });
};

const handleCompositeOrder = async ({
  currentOrder,
  orderType,
  additionalDetails,
  parties,
  documentSubmission,
  refApplicationId,
  applicationCMPNumber,
  caseNumber,
  linkedOrderNumber,
  applicationNumber,
  ordersService,
  tenantId,
}) => {
  const compositeItems = [
    ...currentOrder?.compositeItems?.filter((item) => item?.isEnabled && item?.orderType),
    {
      orderType: orderType,
      orderSchema: {
        additionalDetails: additionalDetails,
        orderDetails: {
          ...(parties || {}),
          applicationTitle: t(documentSubmission?.[0]?.applicationList?.applicationType),
          applicationNumber: refApplicationId,
          applicationCMPNumber: applicationCMPNumber,
          caseNumber: caseNumber,
        },
        ...(linkedOrderNumber && { linkedOrderNumber }),
        ...(applicationNumber && { applicationNumber }),
      },
    },
  ];

  const payload = {
    order: {
      ...currentOrder,
      additionalDetails: null,
      orderDetails: null,
      orderType: null,
      compositeItems,
      workflow: {
        action: OrderWorkflowAction.SAVE_DRAFT,
        comments: "Creating order",
        assignes: null,
        rating: null,
        documents: [{}],
      },
      applicationNumber: [...(currentOrder?.applicationNumber || []), refApplicationId],
      ...(linkedOrderNumber && { linkedOrderNumber }),
    },
  };

  if (currentOrder?.orderNumber) {
    return await ordersService.addOrderItem(payload, { tenantId });
  }
  return await ordersService.createOrder(payload, { tenantId });
};

const createPendingTask = async ({
  DRISTIService,
  Urls,
  currentOrder,
  orderType,
  response,
  cnrNumber,
  filingNumber,
  caseDetails,
  stateSlaMap,
  dayInMillisecond,
  todayDate,
  tenantId,
}) => {
  await DRISTIService.customApiService(Urls.dristi.pendingTask, {
    pendingTask: {
      name: `${currentOrder?.orderCategory === "INTERMEDIATE" && !currentOrder?.orderType ? currentOrder?.orderType : currentOrder?.orderTitle}`,
      entityType: "order-default",
      referenceId: `MANUAL_${response?.order?.orderNumber}`,
      status: "DRAFT_IN_PROGRESS",
      assignedTo: [],
      assignedRole: ["PENDING_TASK_ORDER"],
      cnrNumber,
      filingNumber,
      caseId: caseDetails?.id,
      caseTitle: caseDetails?.caseTitle,
      isCompleted: false,
      stateSla: stateSlaMap.DRAFT_IN_PROGRESS * dayInMillisecond + todayDate,
      additionalDetails: { orderType },
      tenantId,
    },
  });
};

const handleNewOrder = async ({
  tenantId,
  cnrNumber,
  filingNumber,
  applicationNumber,
  orderType,
  additionalDetails,
  parties,
  documentSubmission,
  refApplicationId,
  applicationCMPNumber,
  caseNumber,
  type,
  linkedOrderNumber,
  ordersService,
  DRISTIService,
  Urls,
  caseDetails,
  stateSlaMap,
  dayInMillisecond,
  todayDate,
  refetchOrdersData,
  history,
  window,
  t,
}) => {
  const reqbody = {
    order: {
      createdDate: null,
      tenantId,
      cnrNumber,
      filingNumber,
      applicationNumber: applicationNumber,
      statuteSection: {
        tenantId,
      },
      orderTitle: orderType,
      orderCategory: "INTERMEDIATE",
      orderType,
      status: "",
      isActive: true,
      workflow: {
        action: OrderWorkflowAction.SAVE_DRAFT,
        comments: "Creating order",
        assignes: null,
        rating: null,
        documents: [{}],
      },
      documents: [],
      additionalDetails: additionalDetails,
      orderDetails: {
        ...(parties || {}),
        applicationTitle: t(documentSubmission?.[0]?.applicationList?.applicationType),
        applicationNumber: refApplicationId,
        applicationCMPNumber: applicationCMPNumber,
        caseNumber: caseNumber,
        ...(orderType === "EXTENSION_OF_DOCUMENT_SUBMISSION_DATE" ? { action: type === "reject" ? "REJECT" : "APPROVE" } : {}),
      },
      ...(linkedOrderNumber && { linkedOrderNumber }),
    },
  };

  try {
    const res = await ordersService.createOrder(reqbody, { tenantId });
    const name = getOrderActionName(documentSubmission?.[0]?.applicationList?.applicationType ? type : type);
    
    await DRISTIService.customApiService(Urls.dristi.pendingTask, {
      pendingTask: {
        actionCategory:
          name === "ORDER_EXTENSION_SUBMISSION_DEADLINE"
            ? "View Application"
            : name === "ORDER_FOR_INITIATING_RESCHEDULING_OF_HEARING_DATE"
            ? "Schedule Hearing"
            : null,
        name: t(name),
        entityType: "order-default",
        referenceId: `MANUAL_${res?.order?.orderNumber}`,
        status: "DRAFT_IN_PROGRESS",
        assignedTo: [],
        assignedRole: ["PENDING_TASK_ORDER"],
        cnrNumber,
        filingNumber,
        ccaseId: caseDetails?.id,
        caseTitle: caseDetails?.caseTitle,
        isCompleted: false,
        stateSla: stateSlaMap.DRAFT_IN_PROGRESS * dayInMillisecond + todayDate,
        additionalDetails: { orderType },
        tenantId,
      },
    });

    sessionStorage.setItem("currentOrderType", orderType);
    await refetchOrdersData();
    history.push(`/${window.contextPath}/employee/orders/generate-order?filingNumber=${filingNumber}&orderNumber=${res?.order?.orderNumber}`);
  } catch (error) {
    // Error is handled by the parent function
  }
};
