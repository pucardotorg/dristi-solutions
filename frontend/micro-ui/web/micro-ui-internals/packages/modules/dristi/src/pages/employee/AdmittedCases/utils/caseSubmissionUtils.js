import { DateUtils, isLPRCase } from "../../../../Utils";
import { OrderWorkflowAction } from "../../../../Utils/orderWorkflow";

/**
 * Shared scaffold for the "create draft order" payload that both helpers in
 * this file (and the wider AdmittedCases flow) hand to ordersService.createOrder.
 * It centralises the SAVE_DRAFT workflow + the empty `documents` array, leaving
 * callers free to pass `orderTitle`, `orderType`, the `formdata`, and any extra
 * top-level keys.
 */
const buildDraftOrderReqBody = ({ tenantId, cnrNumber, filingNumber, orderTitle, orderType, formdata, extraOrderFields = {} }) => ({
  order: {
    createdDate: null,
    tenantId,
    cnrNumber,
    filingNumber,
    statuteSection: { tenantId },
    orderTitle,
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
    additionalDetails: { formdata },
    ...extraOrderFields,
  },
});

// Helper function to handle admit/dismiss case order creation
export const handleAdmitDismissCaseOrder = async ({
  generateOrder,
  type,
  caseDetails,
  tenantId,
  cnrNumber,
  filingNumber,
  t,
  documentSubmission,
  ordersService,
  DRISTIService,
  Urls,
  history,
}) => {
  try {
    const caseNumber =
      (isLPRCase(caseDetails) ? caseDetails?.lprNumber : caseDetails?.courtCaseNumber) ||
      caseDetails?.courtCaseNumber ||
      caseDetails?.cmpNumber ||
      caseDetails?.filingNumber;
    const orderType = type === "reject" ? "DISMISS_CASE" : type === "accept" ? "TAKE_COGNIZANCE" : null;
    const formdata = {
      orderType: {
        code: orderType,
        type: orderType,
        name: `ORDER_TYPE_${orderType}`,
      },
    };
    if (generateOrder) {
      const reqbody = buildDraftOrderReqBody({
        tenantId,
        cnrNumber,
        filingNumber,
        orderTitle: t(orderType),
        orderType,
        formdata,
        extraOrderFields: documentSubmission?.[0]?.applicationList?.additionalDetails?.onBehalOfName
          ? {
              orderDetails: {
                parties: [{ partyName: documentSubmission?.[0]?.applicationList?.additionalDetails?.onBehalOfName }],
                caseNumber,
              },
            }
          : {},
      });
      try {
        const res = await ordersService.createOrder(reqbody, { tenantId });
        const name = orderType;
        DRISTIService.customApiService(Urls.dristi.pendingTask, {
          pendingTask: {
            name: t(name),
            entityType: "order-default",
            referenceId: `MANUAL_${res?.order?.orderNumber}`,
            status: "DRAFT_IN_PROGRESS",
            assignedTo: [],
            assignedRole: ["PENDING_TASK_ORDER"],
            cnrNumber,
            filingNumber,
            caseId: caseDetails?.id,
            caseTitle: caseDetails?.caseTitle,
            isCompleted: false,
            additionalDetails: { orderType },
            tenantId,
          },
        });
        history.push(`/${window.contextPath}/employee/orders/generate-order?filingNumber=${filingNumber}&orderNumber=${res?.order?.orderNumber}`);
      } catch (error) {
        // Error handling for order creation
      }
    }
  } catch (error) {
    // Error handling for outer try block
  }
};

// Helper function to handle case admitted submission with order creation
export const handleCaseAdmittedSubmit = async ({
  data,
  tenantId,
  cnrNumber,
  filingNumber,
  ordersService,
  DRISTIService,
  Urls,
  t,
  updatedCaseDetails,
  caseDetails,
  todayDate,
  stateSla,
  refetchCaseData,
  history,
  setShowToast,
}) => {
  const dateArr = data.date.split(" ").map((date, i) => (i === 0 ? date.slice(0, date.length - 2) : date));
  const date = new Date(dateArr.join(" "));
  const reqBody = buildDraftOrderReqBody({
    tenantId,
    cnrNumber,
    filingNumber,
    orderTitle: "SCHEDULE_OF_HEARING_DATE",
    orderType: "SCHEDULE_OF_HEARING_DATE",
    formdata: {
      hearingDate: DateUtils.getFormattedDate(date).split("-").reverse().join("-"),
      hearingPurpose: data.purpose,
      orderType: {
        code: "SCHEDULE_OF_HEARING_DATE",
        type: "SCHEDULE_OF_HEARING_DATE",
        name: "ORDER_TYPE_SCHEDULE_OF_HEARING_DATE",
      },
    },
  });

  try {
    const res = await ordersService.createOrder(reqBody, { tenantId });

    await DRISTIService.customApiService(Urls.dristi.pendingTask, {
      pendingTask: {
        name: `Draft in Progress for ${t(data.purpose?.code)} Hearing Order`,
        entityType: "order-default",
        referenceId: `MANUAL_${res.order.orderNumber}`,
        status: "DRAFT_IN_PROGRESS",
        assignedTo: [],
        assignedRole: ["PENDING_TASK_ORDER"],
        cnrNumber: updatedCaseDetails?.cnrNumber,
        filingNumber: caseDetails?.filingNumber,
        caseId: caseDetails?.id,
        caseTitle: caseDetails?.caseTitle,
        isCompleted: false,
        stateSla: todayDate + stateSla.SCHEDULE_HEARING,
        additionalDetails: {},
        tenantId,
      },
    });

    await DRISTIService.customApiService(Urls.dristi.pendingTask, {
      pendingTask: {
        name: "Pending Response",
        entityType: "case-default",
        referenceId: `MANUAL_${caseDetails?.filingNumber}`,
        status: "PENDING_RESPONSE",
        assignedRole: ["CASE_RESPONDER"],
        cnrNumber: caseDetails?.cnrNumber,
        filingNumber: caseDetails?.filingNumber,
        caseId: caseDetails?.id,
        caseTitle: caseDetails?.caseTitle,
        isCompleted: true,
        tenantId,
      },
    });

    refetchCaseData();
    history.push(`/${window.contextPath}/employee/orders/generate-order?filingNumber=${filingNumber}&orderNumber=${res.order.orderNumber}`);
  } catch (err) {
    const errorId = err?.response?.headers?.["x-correlation-id"] || err?.response?.headers?.["X-Correlation-Id"];
    setShowToast({
      label: t("ORDER_CREATION_FAILED"),
      error: true,
      errorId,
    });
  }
};
