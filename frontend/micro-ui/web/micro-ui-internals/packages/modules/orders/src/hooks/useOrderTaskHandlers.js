import { ordersService } from "./services";
import { Urls } from "@egovernments/digit-ui-module-dristi/src/hooks";
import { OrderWorkflowAction } from "../utils/orderWorkflow";
import { getRaiseBailBondReferenceId } from "../utils/orderUtils";
import { stateSlaMap, dayInMillisecond } from "../configs/generateOrdersConstants";

/**
 * Custom hook for order-related task creation handlers.
 * Extracts task creation logic from GenerateOrdersV2 to reduce complexity.
 *
 * @param {Object} params - Hook parameters
 * @param {string} params.filingNumber - Case filing number
 * @param {string} params.tenantId - Tenant ID
 * @param {string} params.courtId - Court ID
 * @param {Object} params.caseDetails - Case details object
 * @param {Object} params.applicationData - Application data
 * @param {number} params.bailPendingTaskExpiryDays - Bail task expiry days
 * @param {number} params.todayDate - Current timestamp
 * @param {string} params.cnrNumber - CNR number
 * @param {Function} params.t - Translation function
 * @param {Object} params.orderType - Current order type
 * @param {Function} params.onError - Optional error callback function
 * @returns {Object} Task handler functions
 */
const useOrderTaskHandlers = ({
  filingNumber,
  tenantId,
  courtId,
  caseDetails,
  applicationData,
  bailPendingTaskExpiryDays,
  todayDate,
  cnrNumber,
  t,
  orderType,
  setShowToast,
}) => {
  /**
   * Creates a pending task for judge to confirm bail bond submission.
   * Checks if task already exists before creating.
   */
  const createPendingTaskForJudge = async () => {
    try {
      const referenceId = `MANUAL_BAIL_BOND_${filingNumber}`;
      const res = await ordersService.getPendingTaskService(
        {
          SearchCriteria: {
            tenantId,
            moduleName: "Pending Tasks Service",
            moduleSearchCriteria: {
              isCompleted: false,
              referenceId,
              filingNumber: filingNumber,
              courtId: courtId,
              entityType: "bail bond",
            },
            limit: 1000,
            offset: 0,
          },
        },
        { tenantId }
      );
      const exists = Array.isArray(res?.data) ? res.data : [];
      if (exists?.length > 0) {
        return;
      }

      await window?.Digit?.DRISTIService?.customApiService(Urls.dristi.pendingTask, {
        pendingTask: {
          name: t("CS_COMMON_BAIL_BOND"),
          entityType: "bail bond",
          referenceId,
          status: "PENDING_SIGN",
          assignedTo: [],
          assignedRole: ["PENDING_TASK_CONFIRM_BOND_SUBMISSION"],
          actionCategory: "Bail Bond",
          cnrNumber: caseDetails?.cnrNumber,
          filingNumber,
          caseId: caseDetails?.id,
          caseTitle: caseDetails?.caseTitle,
          isCompleted: false,
          expiryDate: bailPendingTaskExpiryDays * 24 * 60 * 60 * 1000 + todayDate,
          stateSla: todayDate,
          additionalDetails: {},
          tenantId,
        },
      });
    } catch (e) {
      console.error("Error creating bail bond task:", e);
      const errorId = e?.response?.headers?.["x-correlation-id"] || e?.response?.headers?.["X-Correlation-Id"];
      setShowToast({ label: t("ERROR_CREATING_BAIL_BOND_TASK"), error: true, errorId });
    }
  };

  /**
   * Creates a pending task for employee/citizen to raise bail bond.
   * Handles complex logic for determining assignees, bail type, and task details.
   *
   * @param {Object} orderObj - Order object containing bail details
   * @param {boolean} isRejected - Whether the bail was rejected
   */
  const createPendingTaskForEmployee = async (orderObj, isRejected = false) => {
    try {
      const getUserUUID = async (individualId) => {
        try {
          const res = await window?.Digit?.DRISTIService?.searchIndividualUser(
            { Individual: { individualId } },
            { tenantId, limit: 1000, offset: 0 }
          );
          return res?.Individual?.[0]?.userUuid || "";
        } catch (e) {
          console.error("Error fetching user UUID for individualId:", individualId, e);
          const errorId = e?.response?.headers?.["x-correlation-id"] || e?.response?.headers?.["X-Correlation-Id"];
          setShowToast({ label: t("ERROR_FETCHING_USER_UUID"), error: true, errorId });
          return "";
        }
      };

      const bailFormData = (() => {
        if (orderObj?.orderCategory === "INTERMEDIATE" && (orderObj?.orderType === "ACCEPT_BAIL" || orderType?.code === "ACCEPT_BAIL")) {
          return orderObj?.additionalDetails?.formdata || {};
        }
        const acceptBailItem = orderObj?.compositeItems?.find?.((it) => it?.orderType === "ACCEPT_BAIL");
        return acceptBailItem?.orderSchema?.additionalDetails?.formdata || {};
      })();

      const bailType = bailFormData?.bailType?.code || null;
      const bailAmount = bailFormData?.chequeAmount || null;
      const noOfSureties = bailFormData?.noOfSureties || null;

      const refApplicationId = bailFormData?.refApplicationId;

      const newApplicationDetails = applicationData?.applicationList?.find((application) => application?.applicationNumber === refApplicationId);

      const accusedIndividualId = newApplicationDetails?.onBehalfOf?.[0] || null;

      let targetLitigant = null;

      if (accusedIndividualId) {
        targetLitigant = (caseDetails?.litigants || []).find((lit) => lit?.additionalDetails?.uuid === accusedIndividualId);
      }

      if (!targetLitigant) {
        targetLitigant = (caseDetails?.litigants || []).find((lit) => lit?.partyType?.includes?.("respondent"));
      }

      const targetIndividualId = targetLitigant?.individualId;
      const targetUserUuid = targetIndividualId ? await getUserUUID(targetIndividualId) : "";

      const accusedKey = targetIndividualId || targetLitigant?.additionalDetails?.uuid || "";
      const referenceId = getRaiseBailBondReferenceId({ accusedKey, filingNumber });

      let pendingTaskPayload = {};
      if (!isRejected) {
        const poaUuids = (() => {
          const poaList = caseDetails?.poaHolders || [];
          if (!targetIndividualId) {
            return poaList.map((poa) => poa?.additionalDetails?.uuid).filter(Boolean);
          }
          return poaList
            ?.filter((poa) => poa?.representingLitigants?.some?.((rep) => rep?.individualId === targetIndividualId))
            ?.map((poa) => poa?.additionalDetails?.uuid)
            ?.filter(Boolean);
        })();
        const asUser = newApplicationDetails?.asUser; // this main advocate's uuid in case clerk/jr adv create on senior's behalf otherwise creator's uuid

        const advocateUuids = (() => {
          const reps = caseDetails?.representatives || [];
          if (!targetIndividualId) {
            return reps.map((rep) => rep?.additionalDetails?.uuid).filter(Boolean);
          }
          return reps
            ?.filter((rep) => rep?.representing?.some?.((r) => r?.individualId === targetIndividualId))
            ?.map((rep) => rep?.additionalDetails?.uuid)
            ?.filter(Boolean);
        })();

        let assignedTo = [];
        if (refApplicationId) {
          assignedTo = Array.from(new Set([targetUserUuid, ...(poaUuids || []), asUser].filter(Boolean))).map((uuid) => ({ uuid }));
        } else {
          assignedTo = Array.from(new Set([targetUserUuid, ...(poaUuids || []), ...advocateUuids].filter(Boolean))).map((uuid) => ({ uuid }));
        }

        const bailTypeCode = typeof bailType === "string" ? bailType.toUpperCase() : (bailType?.code || bailType?.type || "").toUpperCase();
        const bailTypeObj = bailTypeCode ? { code: bailTypeCode, type: bailTypeCode } : null;
        const additionalDetails = {
          accusedIndividualId: targetIndividualId || null,
          accusedKey: accusedKey || null,
          litigantUuid: targetLitigant?.additionalDetails?.uuid || accusedKey || null,
          individualId: targetIndividualId || null,
          addSurety: bailTypeCode === "SURETY" ? "YES" : bailTypeCode ? "NO" : undefined,
          refApplicationId:
            orderObj?.additionalDetails?.formdata?.refApplicationId ||
            orderObj?.additionalDetails?.refApplicationId ||
            bailFormData?.refApplicationId ||
            "",
          bailType: bailTypeObj || bailTypeCode || bailType || null,
          ...(bailTypeCode && { bailTypeCode }),
          ...(targetIndividualId ? { litigants: [targetIndividualId] } : {}),
          ...(bailAmount != null &&
            (() => {
              const amt = Number(bailAmount);
              return {
                bailAmount: amt,
                chequeAmount: Number.isFinite(amt) ? amt : undefined,
                amount: Number.isFinite(amt) ? amt : undefined,
              };
            })()),
          ...(noOfSureties != null && { noOfSureties: Number(noOfSureties) }),
        };

        if (referenceId !== `MANUAL_RAISE_BAIL_BOND_${filingNumber}_ACC_UNKNOWN`) {
          const res = await ordersService.getPendingTaskService({
            SearchCriteria: {
              tenantId,
              moduleName: "Pending Tasks Service",
              moduleSearchCriteria: {
                isCompleted: false,
                referenceId: `MANUAL_RAISE_BAIL_BOND_${filingNumber}_ACC_UNKNOWN`,
                filingNumber: filingNumber,
                courtId: courtId,
                entityType: "bail bond",
              },
              limit: 10000,
              offset: 0,
            },
          });

          const list = Array.isArray(res?.data) ? res.data : [];

          if (list?.length > 0) {
            const pendingTaskPayload = {
              pendingTask: {
                name: t("CS_COMMON_RAISE_BAIL_BOND"),
                entityType: "bail bond",
                referenceId: `MANUAL_RAISE_BAIL_BOND_${filingNumber}_ACC_UNKNOWN`,
                status: "PENDING_RAISE_BAIL_BOND",
                isCompleted: true,
                tenantId,
                filingNumber,
                caseId: caseDetails?.id,
                caseTitle: caseDetails?.caseTitle,
              },
            };
            await window?.Digit?.DRISTIService?.customApiService(Urls.dristi.pendingTask, pendingTaskPayload);
          }
        }

        pendingTaskPayload = {
          pendingTask: {
            name: t("CS_COMMON_RAISE_BAIL_BOND"),
            entityType: "bail bond",
            referenceId,
            status: "PENDING_RAISE_BAIL_BOND",
            assignedTo: assignedTo,
            assignedRole: [],
            actionCategory: "Bail Bond",
            cnrNumber: caseDetails?.cnrNumber,
            filingNumber,
            caseId: caseDetails?.id,
            caseTitle: caseDetails?.caseTitle,
            isCompleted: bailTypeCode === "SURETY" ? false : true,
            expiryDate: bailPendingTaskExpiryDays * 24 * 60 * 60 * 1000 + todayDate,
            stateSla: todayDate,
            additionalDetails,
            tenantId,
          },
        };
      } else {
        pendingTaskPayload = {
          pendingTask: {
            name: t("CS_COMMON_RAISE_BAIL_BOND"),
            entityType: "bail bond",
            referenceId,
            status: "PENDING_RAISE_BAIL_BOND",
            actionCategory: "Bail Bond",
            cnrNumber: caseDetails?.cnrNumber,
            filingNumber,
            caseId: caseDetails?.id,
            caseTitle: caseDetails?.caseTitle,
            isCompleted: true,
            tenantId,
          },
        };
      }
      try {
        await window?.Digit?.DRISTIService?.customApiService(Urls.dristi.pendingTask, pendingTaskPayload);
      } catch (apiErr) {
        console.error("[BailBond Citizen Task] API error while creating pending task:", apiErr);
        throw apiErr;
      }
    } catch (err) {
      console.error("Error creating raise bail bond task:", err);
      const errorId = err?.response?.headers?.["x-correlation-id"] || err?.response?.headers?.["X-Correlation-Id"];
      setShowToast({ label: t("ERROR_CREATING_RAISE_BAIL_BOND_TASK"), error: true, errorId });
    }
  };

  /**
   * Generic pending task creation utility.
   * Used for creating various types of order-related tasks.
   *
   * @param {Object} params - Task creation parameters
   * @param {Object} params.order - Order object
   * @param {boolean} params.createTask - Whether to create the task
   * @param {string} params.taskStatus - Task status
   * @param {string} params.taskName - Task name
   * @param {string} params.orderEntityType - Entity type for the order
   */
  const createPendingTask = async ({ order, createTask = false, taskStatus = "CREATE_SUBMISSION", taskName = "", orderEntityType = null }) => {
    let create = createTask;
    let name = taskName;
    let assignees = [];
    let referenceId = order?.orderNumber;
    let assignedRole = [];
    let additionalDetails = {};
    let entityType = orderEntityType;
    let status = taskStatus;

    create &&
      (await ordersService.customApiService(Urls.dristi.pendingTask, {
        pendingTask: {
          name,
          entityType,
          referenceId: `MANUAL_${referenceId}`,
          status,
          assignedTo: assignees,
          assignedRole,
          cnrNumber: cnrNumber,
          filingNumber: filingNumber,
          caseId: caseDetails?.id,
          caseTitle: caseDetails?.caseTitle,
          isCompleted: false,
          stateSla: stateSlaMap?.[order?.orderType] * dayInMillisecond + todayDate,
          additionalDetails: additionalDetails,
          tenantId,
        },
      }));
    return;
  };

  /**
   * Creates a draft summons order and associated pending task.
   *
   * @param {number} hearingDate - Hearing date timestamp
   * @param {string} hearingNumber - Hearing number
   * @returns {Promise<string>} Order number of created summons
   */
  const handleIssueSummons = async (hearingDate, hearingNumber) => {
    try {
      const orderbody = {
        createdDate: null,
        tenantId,
        cnrNumber,
        filingNumber,
        statuteSection: {
          tenantId,
        },
        orderTitle: "SUMMONS",
        orderCategory: "INTERMEDIATE",
        orderType: "SUMMONS",
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
        ...(hearingNumber && { hearingNumber }),
        additionalDetails: {
          formdata: {
            orderType: {
              code: "SUMMONS",
              type: "SUMMONS",
              name: "ORDER_TYPE_SUMMONS",
            },
            hearingDate,
          },
        },
      };

      const res = await ordersService.createOrder({ order: orderbody }, { tenantId });
      await createPendingTask({
        order: res?.order,
        createTask: true,
        taskStatus: "DRAFT_IN_PROGRESS",
        taskName: t("DRAFT_IN_PROGRESS_ISSUE_SUMMONS"),
        orderEntityType: "order-default",
      });
      return res?.order?.orderNumber;
    } catch (error) {
      console.error("Error issuing summons:", error);
      const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
      setShowToast({ label: t("ERROR_ISSUING_SUMMONS"), error: true, errorId });
    }
  };

  /**
   * Creates a draft notice order and associated pending task.
   *
   * @param {number} hearingDate - Hearing date timestamp
   * @param {string} hearingNumber - Hearing number
   * @returns {Promise<string>} Order number of created notice
   */
  const handleIssueNotice = async (hearingDate, hearingNumber) => {
    try {
      const orderbody = {
        createdDate: null,
        tenantId,
        cnrNumber,
        filingNumber,
        statuteSection: {
          tenantId,
        },
        orderTitle: "NOTICE",
        orderCategory: "INTERMEDIATE",
        orderType: "NOTICE",
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
        ...(hearingNumber && { hearingNumber }),
        additionalDetails: {
          formdata: {
            orderType: {
              code: "NOTICE",
              type: "NOTICE",
              name: "ORDER_TYPE_NOTICE",
            },
            hearingDate,
          },
        },
      };

      const res = await ordersService.createOrder({ order: orderbody }, { tenantId });
      await createPendingTask({
        order: res?.order,
        createTask: true,
        taskStatus: "DRAFT_IN_PROGRESS",
        taskName: t("DRAFT_IN_PROGRESS_ISSUE_NOTICE"),
        orderEntityType: "order-default",
      });
      return res?.order?.orderNumber;
    } catch (error) {
      console.error("Error issuing notice:", error);
      const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
      setShowToast({ label: t("ERROR_ISSUING_NOTICE"), error: true, errorId });
    }
  };

  return {
    createPendingTaskForJudge,
    createPendingTaskForEmployee,
    createPendingTask,
    handleIssueSummons,
    handleIssueNotice,
  };
};

export default useOrderTaskHandlers;
