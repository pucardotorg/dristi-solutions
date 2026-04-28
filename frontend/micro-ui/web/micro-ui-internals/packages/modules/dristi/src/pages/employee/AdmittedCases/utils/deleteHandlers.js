import { SubmissionWorkflowAction } from "../../../../Utils/submissionWorkflow";
import { OrderWorkflowAction } from "../../../../Utils/orderWorkflow";

// Helper function to handle application deletion
export const handleDeleteApplication = async ({
  deleteApplication,
  tenantId,
  submissionService,
  setDeleteApplication,
  setLoader,
  setShowToast,
  t,
}) => {
  try {
    setLoader(true);
    const reqBody = {
      application: {
        ...deleteApplication,
        workflow: { ...deleteApplication?.workflow, documents: [{}], action: SubmissionWorkflowAction.DELETE },
        tenantId,
      },
      tenantId,
    };
    await submissionService.updateApplication(reqBody, { tenantId });
    setDeleteApplication(null);
    window.location.reload();
  } catch (error) {
    console.error(error);
    const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
    setShowToast({
      label: t("FAILED_TO_SUBMIT_DELETE_APPLICATION_REQUEST"),
      error: true,
      errorId,
    });
  } finally {
    setLoader(false);
  }
};

// Helper function to handle order deletion
export const handleDeleteOrder = async ({
  deleteOrder,
  tenantId,
  ordersService,
  Urls,
  cnrNumber,
  filingNumber,
  caseDetails,
  history,
  path,
  caseId,
  config,
  setDeleteOrder,
  setLoader,
  setShowToast,
  setUpdateCounter,
  t,
}) => {
  try {
    setLoader(true);
    await ordersService?.updateOrder(
      {
        order: {
          ...deleteOrder,
          workflow: { ...deleteOrder?.workflow, action: OrderWorkflowAction.DELETE, documents: [{}] },
        },
      },
      { tenantId }
    );
    await ordersService.customApiService(Urls.dristi.pendingTask, {
      pendingTask: {
        name: "Completed",
        entityType: "order-default",
        referenceId: `MANUAL_${deleteOrder?.orderNumber}`,
        status: "DRAFT_IN_PROGRESS",
        assignedTo: [],
        assignedRole: [],
        cnrNumber,
        filingNumber,
        caseId: caseDetails?.id,
        caseTitle: caseDetails?.caseTitle,
        isCompleted: true,
        stateSla: null,
        additionalDetails: {},
        tenantId,
      },
    });
    history.replace(`${path}?caseId=${caseId}&filingNumber=${filingNumber}&tab=${config?.label}`);
    setDeleteOrder(null);
    setUpdateCounter((prev) => prev + 1);
  } catch (error) {
    console.error(error);
    const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
    setShowToast({
      label: t("FAILED_TO_DELETE_ORDER"),
      error: true,
      errorId,
    });
  } finally {
    setLoader(false);
  }
};
