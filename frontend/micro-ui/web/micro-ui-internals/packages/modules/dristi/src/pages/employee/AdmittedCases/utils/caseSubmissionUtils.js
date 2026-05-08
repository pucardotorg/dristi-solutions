import { DateUtils } from "../../../../Utils";
import { OrderWorkflowAction } from "../../../../Utils/orderWorkflow";

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
      (caseDetails?.isLPRCase ? caseDetails?.lprNumber : caseDetails?.courtCaseNumber) ||
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
      const reqbody = {
        order: {
          createdDate: null,
          tenantId,
          cnrNumber,
          filingNumber,
          statuteSection: {
            tenantId,
          },
          orderTitle: t(orderType),
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
          additionalDetails: {
            formdata,
          },
          ...(documentSubmission?.[0]?.applicationList?.additionalDetails?.onBehalOfName && {
            orderDetails: {
              parties: [{ partyName: documentSubmission?.[0]?.applicationList?.additionalDetails?.onBehalOfName }],
              caseNumber: caseNumber,
            },
          }),
        },
      };
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
  const reqBody = {
    order: {
      createdDate: null,
      tenantId,
      cnrNumber,
      filingNumber: filingNumber,
      statuteSection: {
        tenantId,
      },
      orderTitle: "SCHEDULE_OF_HEARING_DATE",
      orderCategory: "INTERMEDIATE",
      orderType: "SCHEDULE_OF_HEARING_DATE",
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
      additionalDetails: {
        formdata: {
          hearingDate: DateUtils.getFormattedDate(date).split("-").reverse().join("-"),
          hearingPurpose: data.purpose,
          orderType: {
            code: "SCHEDULE_OF_HEARING_DATE",
            type: "SCHEDULE_OF_HEARING_DATE",
            name: "ORDER_TYPE_SCHEDULE_OF_HEARING_DATE",
          },
        },
      },
    },
  };

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
