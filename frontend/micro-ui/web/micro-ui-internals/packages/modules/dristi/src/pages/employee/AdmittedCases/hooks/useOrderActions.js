import { useCallback } from "react";
import { useHistory } from "react-router-dom";
import { DRISTIService } from "../../../../services";
import { Urls } from "../../../../hooks";

const useOrderActions = ({
  tenantId,
  caseDetails,
  updatedCaseDetails,
  cnrNumber,
  filingNumber,
  caseId,
  activeTab,
  currentInProgressHearing,
  ordersService,
  OrderWorkflowAction,
  showToast,
  t,
  todayDate,
  stateSla,
  setApiCalled,
  openHearingModule,
  isCaseAdmitted,
  setCreateAdmissionOrder,
  setShowScheduleHearingModal,
}) => {
  const history = useHistory();

  const handleScheduleNextHearing = useCallback(() => {
    const reqBody = {
      order: {
        createdDate: null,
        tenantId,
        cnrNumber: updatedCaseDetails?.cnrNumber || caseDetails?.cnrNumber,
        filingNumber: caseDetails?.filingNumber,
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
            orderType: {
              code: "SCHEDULE_OF_HEARING_DATE",
              type: "SCHEDULE_OF_HEARING_DATE",
              name: "ORDER_TYPE_SCHEDULE_OF_HEARING_DATE",
            },
          },
        },
      },
    };
    DRISTIService.customApiService(Urls.dristi.ordersCreate, reqBody, { tenantId })
      .then((res) => {
        history.push(
          `/${window?.contextPath}/employee/orders/generate-order?filingNumber=${caseDetails?.filingNumber}&orderNumber=${res.order.orderNumber}`,
          {
            caseId: caseId,
            tab: "Orders",
          }
        );
        DRISTIService.customApiService(Urls.dristi.pendingTask, {
          pendingTask: {
            name: "Schedule Hearing",
            entityType: "case-default",
            referenceId: `MANUAL_${caseDetails?.filingNumber}`,
            status: "SCHEDULE_HEARING",
            assignedTo: [],
            assignedRole: ["PENDING_TASK_ORDER"],
            cnrNumber: updatedCaseDetails?.cnrNumber,
            filingNumber: caseDetails?.filingNumber,
            caseId: caseDetails?.id,
            caseTitle: caseDetails?.caseTitle,
            isCompleted: true,
            stateSla: todayDate + stateSla.SCHEDULE_HEARING,
            additionalDetails: {},
            tenantId,
          },
        });
      })
      .catch((error) => {
        console.error("Error while creating order", error);
        showToast({ isError: true, message: "ORDER_CREATION_FAILED" });
      });
  }, [
    tenantId,
    updatedCaseDetails?.cnrNumber,
    caseDetails?.cnrNumber,
    caseDetails?.filingNumber,
    caseDetails?.id,
    caseDetails?.caseTitle,
    OrderWorkflowAction.SAVE_DRAFT,
    history,
    caseId,
    todayDate,
    stateSla,
    showToast,
  ]);

  const openHearingModuleCallback = useCallback(() => {
    setShowScheduleHearingModal(true);
    if (!isCaseAdmitted) {
      setCreateAdmissionOrder(true);
    }
  }, [isCaseAdmitted, setCreateAdmissionOrder, setShowScheduleHearingModal]);

  const handleSelect = useCallback(
    async (option) => {
      if (option === t("MAKE_SUBMISSION")) {
        history.push(`/${window?.contextPath}/employee/submissions/submissions-create?filingNumber=${filingNumber}&applicationType=DOCUMENT`);
        return;
      }
      if (option === t("SUBMIT_DOCUMENTS")) {
        history.push(`/${window?.contextPath}/employee/submissions/submit-document?filingNumber=${filingNumber}`);
        return;
      }
      if (option === t("SCHEDULE_HEARING")) {
        openHearingModuleCallback();
        return;
      } else if (option === t("REFER_TO_ADR")) {
        const reqBody = {
          order: {
            createdDate: null,
            tenantId,
            cnrNumber,
            filingNumber: filingNumber,
            statuteSection: {
              tenantId,
            },
            orderTitle: "REFERRAL_CASE_TO_ADR",
            orderCategory: "INTERMEDIATE",
            orderType: "REFERRAL_CASE_TO_ADR",
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
                orderType: {
                  type: "REFERRAL_CASE_TO_ADR",
                  code: "REFERRAL_CASE_TO_ADR",
                  name: "ORDER_TYPE_REFERRAL_CASE_TO_ADR",
                },
              },
            },
          },
        };
        ordersService
          .createOrder(reqBody, { tenantId })
          .then((res) => {
            history.push(`/${window.contextPath}/employee/orders/generate-order?filingNumber=${filingNumber}&orderNumber=${res.order.orderNumber}`, {
              caseId: caseId,
              tab: activeTab,
            });
          })
          .catch((err) => {
            showToast({ isError: true, message: "ORDER_CREATION_FAILED" });
          });
        return;
      } else if (option === t("MANDATORY_SUBMISSIONS_RESPONSES")) {
        const reqBody = {
          order: {
            createdDate: null,
            tenantId,
            cnrNumber,
            filingNumber: filingNumber,
            statuteSection: {
              tenantId,
            },
            orderTitle: "MANDATORY_SUBMISSIONS_RESPONSES",
            orderCategory: "INTERMEDIATE",
            orderType: "MANDATORY_SUBMISSIONS_RESPONSES",
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
                orderType: {
                  type: "MANDATORY_SUBMISSIONS_RESPONSES",
                  code: "MANDATORY_SUBMISSIONS_RESPONSES",
                  name: "ORDER_TYPE_MANDATORY_SUBMISSIONS_RESPONSES",
                },
              },
            },
          },
        };
        ordersService
          .createOrder(reqBody, { tenantId })
          .then((res) => {
            history.push(`/${window.contextPath}/employee/orders/generate-order?filingNumber=${filingNumber}&orderNumber=${res.order.orderNumber}`, {
              caseId: caseId,
              tab: activeTab,
            });
          })
          .catch((err) => {
            showToast({ isError: true, message: "ORDER_CREATION_FAILED" });
          });
        return;
      } else if (option === t("GENERATE_PAYMENT_DEMAND")) {
        return;
      }

      try {
        setApiCalled(true);

        let response;

        if (currentInProgressHearing) {
          response = await DRISTIService.getDraftOrder(
            {
              hearingDraftOrder: {
                cnrNumber,
                filingNumber,
                tenantId,
                hearingNumber: currentInProgressHearing?.hearingId,
                hearingType: currentInProgressHearing?.hearingType,
              },
            },
            {}
          );
        } else {
          response = await DRISTIService.createOrder(
            {
              order: {
                tenantId,
                cnrNumber,
                filingNumber,
                statuteSection: { tenantId },
                status: "",
                orderTitle: t("DEFAULT_ORDER_TITLE"),
                orderType: "",
                orderCategory: "INTERMEDIATE",
                isActive: true,
                workflow: {
                  action: "SAVE_DRAFT",
                  documents: [{}],
                },
              },
            },
            { tenantId }
          );
        }

        history.push(
          `/${window.contextPath}/employee/orders/generate-order?filingNumber=${filingNumber}&orderNumber=${response?.order?.orderNumber}`,
          { caseId, tab: "Orders" }
        );
      } catch (error) {
        console.error("Error fetching order", error);
        const errorCode = error?.response?.data?.Errors?.[0]?.code;
        const errorMsg = errorCode === "ORDER_ALREADY_PUBLISHED" ? "ORDER_ALREADY_PUBLISHED" : "CORE_SOMETHING_WENT_WRONG";
        showToast({ isError: true, message: errorMsg }, 3000);
      } finally {
        setApiCalled(false);
      }
    },
    [
      t,
      currentInProgressHearing,
      history,
      filingNumber,
      openHearingModuleCallback,
      tenantId,
      cnrNumber,
      OrderWorkflowAction.SAVE_DRAFT,
      ordersService,
      caseId,
      activeTab,
      showToast,
      setApiCalled,
    ]
  );

  return {
    handleScheduleNextHearing,
    handleSelect,
    openHearingModule: openHearingModuleCallback,
  };
};

export default useOrderActions;
