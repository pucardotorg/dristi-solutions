import ButtonSelector from "@egovernments/digit-ui-module-dristi/src/components/ButtonSelector";
import { Urls } from "@egovernments/digit-ui-module-dristi/src/hooks";
import { DRISTIService } from "@egovernments/digit-ui-module-dristi/src/services";
import { OrderWorkflowAction } from "@egovernments/digit-ui-module-dristi/src/Utils/orderWorkflow";
import { ordersService, taskService } from "@egovernments/digit-ui-module-orders/src/hooks/services";
import { CloseSvg, CheckBox } from "@egovernments/digit-ui-react-components";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { getFullName } from "../../../cases/src/utils/joinCaseUtils";
import { formatDate } from "@egovernments/digit-ui-module-dristi/src/Utils";
import { useToast } from "@egovernments/digit-ui-module-dristi/src/components/Toast/useToast";

const CloseBtn = (props) => {
  return (
    <div onClick={props?.onClick} style={{ height: "100%", display: "flex", alignItems: "center", paddingRight: "20px", cursor: "pointer" }}>
      <CloseSvg />
    </div>
  );
};
const Heading = (props) => {
  return (
    <div className="evidence-title">
      <h1 className="heading-m">{props.label}</h1>
    </div>
  );
};

const AdvocateReplacementComponent = ({ filingNumber, taskNumber, setPendingTaskActionModals, refetch }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const toast = useToast();

  const tenantId = useMemo(() => Digit.ULBService.getCurrentTenantId(), []);
  const isCitizen = useMemo(() => Boolean(Digit?.UserService?.getUser()?.info?.type === "CITIZEN"), []);

  const Modal = useMemo(() => window?.Digit?.ComponentRegistryService?.getComponent("Modal"), []);
  const DocViewerWrapper = useMemo(() => window?.Digit?.ComponentRegistryService?.getComponent("DocViewerWrapper"), []);
  const [submitConfirmed, setSubmitConfirmed] = useState(false);
  const [isApiCalled, setIsApiCalled] = useState(false);

  const [{ modalType, isOpen }, setConfirmModal] = useState({ modalType: null, isOpen: false });
  const courtId = localStorage.getItem("courtId");

  const { data: caseData } = Digit.Hooks.dristi.useSearchCaseService(
    {
      criteria: [
        {
          filingNumber: filingNumber,
          ...(courtId && !isCitizen && { courtId }),
        },
      ],
      tenantId,
    },
    {},
    `case-details-${filingNumber}`,
    filingNumber,
    Boolean(filingNumber)
  );

  const caseDetails = useMemo(
    () => ({
      ...caseData?.criteria?.[0]?.responseList?.[0],
    }),
    [caseData]
  );

  const { data: tasksData } = Digit.Hooks.hearings.useGetTaskList(
    {
      criteria: {
        tenantId: tenantId,
        taskNumber: taskNumber,
        ...(caseDetails?.courtId && { courtId: caseDetails?.courtId }),
      },
    },
    {},
    taskNumber,
    Boolean(taskNumber && caseDetails?.courtId)
  );

  const task = useMemo(() => tasksData?.list?.[0], [tasksData]);

  const updateReplaceAdvocateTask = useCallback(
    async (action) => {
      setIsApiCalled(true);
      try {
        const reqBody = {
          task: {
            ...task,
            workflow: {
              action: action,
            },
          },
        };
        await taskService.updateTask(reqBody, { tenantId });
        setPendingTaskActionModals((pendingTaskActionModals) => {
          const data = pendingTaskActionModals?.data;
          delete data.filingNumber;
          delete data.taskNumber;
          return {
            ...pendingTaskActionModals,
            joinCaseConfirmModal: false,
            data: data,
          };
        });
        toast.success(t(action === "APPROVE" ? "ADVOCATE_REPLACEMENT_SUCCESS" : "ADVOCATE_REPLACEMENT_REJECTED"));
        refetch();
      } catch (error) {
        console.error("Error updating task data:", error);
        setPendingTaskActionModals((pendingTaskActionModals) => {
          const data = pendingTaskActionModals?.data;
          delete data.filingNumber;
          delete data.taskNumber;
          return {
            ...pendingTaskActionModals,
            joinCaseConfirmModal: false,
            data: data,
          };
        });
        toast.error(t("ADVOCATE_REPLACEMENT_ERROR"));
        refetch();
      } finally {
        setIsApiCalled(false);
      }
    },
    [task, tenantId, setPendingTaskActionModals, toast, t, refetch]
  );

  const replaceAdvocateOrderCreate = async (type) => {
    const taskDetails = task?.taskDetails;
    const { firstName, middleName, lastName } = taskDetails?.advocateDetails?.individualDetails || {};
    const formdata = {
      orderType: {
        code: "ADVOCATE_REPLACEMENT_APPROVAL",
        type: "ADVOCATE_REPLACEMENT_APPROVAL",
        name: `ORDER_TYPE_ADVOCATE_REPLACEMENT_APPROVAL`,
      },
      replaceAdvocateStatus: {
        code: type === "reject" ? "REJECT" : type === "approve" ? "GRANT" : null,
        name: type === "reject" ? "REJECT" : type === "approve" ? "GRANT" : null,
      },
    };
    const additionalDetails = {
      formdata,
      taskNumber: taskNumber,
    };
    const reqbody = {
      order: {
        createdDate: null,
        tenantId,
        cnrNumber: caseDetails?.cnrNumber,
        filingNumber: filingNumber,
        statuteSection: {
          tenantId,
        },
        orderTitle: t("ADVOCATE_REPLACEMENT_APPROVAL"),
        orderCategory: "INTERMEDIATE",
        orderType: "ADVOCATE_REPLACEMENT_APPROVAL",
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
          advocateName: getFullName(" ", firstName, middleName, lastName),
          applicationStatus: type === "reject" ? "REJECT" : type === "approve" ? "GRANT" : null,
          action: type === "reject" ? "rejected" : type === "approve" ? "accepted" : null,
        },
      },
    };
    setIsApiCalled(true);
    try {
      const res = await ordersService.createOrder(reqbody, { tenantId });
      DRISTIService.customApiService(Urls.dristi.pendingTask, {
        pendingTask: {
          actionCategory: "View Application",
          name: t("ADVOCATE_REPLACEMENT_APPROVAL"),
          entityType: "order-default",
          referenceId: `MANUAL_${res?.order?.orderNumber}`,
          status: "DRAFT_IN_PROGRESS",
          assignedTo: [],
          assignedRole: ["PENDING_TASK_ORDER"],
          cnrNumber: caseDetails?.cnrNumber,
          filingNumber: filingNumber,
          caseId: caseDetails?.id,
          caseTitle: caseDetails?.caseTitle,
          isCompleted: false,
          stateSla: 2 * 24 * 3600 * 1000 + new Date().getTime(),
          additionalDetails: { orderType: "ADVOCATE_REPLACEMENT_APPROVAL" },
          tenantId,
        },
      });
      history.push(`/${window.contextPath}/employee/orders/generate-order?filingNumber=${filingNumber}&orderNumber=${res?.order?.orderNumber}`);
    } catch (error) {
      console.error("error", error);
    } finally {
      setIsApiCalled(false);
    }
  };

  const advocateReplacementData = useMemo(() => {
    if (!task || !task?.taskDetails) return null;
    const taskDetails = task?.taskDetails;
    const { firstName, middleName, lastName } = taskDetails?.advocateDetails?.individualDetails;
    return {
      basicDetails: [
        { label: "ADVOCATE_NAME", value: getFullName(" ", firstName, middleName, lastName) },
        { label: "BAR_REGISTRATION_NO", value: taskDetails?.advocateDetails?.barRegistrationNumber },
        { label: "MOBILE_NUMBER", value: taskDetails?.advocateDetails?.mobileNumber },
        { label: "REQUEST_DATE", value: formatDate(new Date(taskDetails?.advocateDetails?.requestedDate)) },
      ],
      vakalatnama: {
        label: "VAKALATNAMA",
        value: taskDetails?.replacementDetails
          ?.filter((item) => item?.document?.fileStore)
          ?.map((item) => ({ name: `Vakalatnama (${item?.litigantDetails?.name})`, fileStoreId: item?.document?.fileStore })),
      },
      reasonForReplacement: [
        { label: "REASON_FOR_REPLACEMENT", value: taskDetails?.reason },
        ...(taskDetails?.reasonDocument?.fileStore
          ? [{ label: "SUPPORTING_DOCUMENT", type: "file", value: taskDetails?.reasonDocument?.fileStore }]
          : []),
      ],
      litigants: isCitizen
        ? [
            { type: "head", data: ["LITIGANTS_FOR_WHOM_REPLACEMENT_IS_REQUESTED"] },
            ...taskDetails?.replacementDetails?.map((item) => ({ type: "body", data: [item?.litigantDetails?.name] })),
          ]
        : [
            { type: "head", data: ["ADVOCATES_TO_BE_REPLACED", "LITIGANTS_FOR_WHOM_REPLACEMENT_IS_REQUESTED", "BAR_REGISTRATION_NO"] },
            ...taskDetails?.replacementDetails?.map((item) => ({
              type: "body",
              data: [item?.advocateDetails?.name, item?.litigantDetails?.name, item?.advocateDetails?.barRegistrationNumber],
            })),
          ],
    };
  }, [task, isCitizen]);

  return (
    <div className="advocate-replacement-request-container">
      <div className="advocate-replacement-request">
        <div className="advocate-replacement-request-body">
          {advocateReplacementData?.basicDetails?.map((item) => (
            <div className="info-row" key={item.label}>
              <p className="label">{t(item.label)}</p>
              <p className="value">{item.value}</p>
            </div>
          ))}
        </div>
        {advocateReplacementData?.vakalatnama?.value?.length > 0 && (
          <div className="advocate-replacement-request-body">
            <div className="info-row" style={{ justifyContent: "space-between" }}>
              <p className="label">{t(advocateReplacementData?.vakalatnama?.label)}</p>
              <div
                className="reason-document-wrapper"
                style={{ width: "fit-content", maxWidth: "60%", overflowX: "auto", gap: "20px", justifyContent: "flex-start" }}
              >
                {advocateReplacementData?.vakalatnama?.value?.map((vakalatnama) => (
                  <DocViewerWrapper fileStoreId={vakalatnama.fileStoreId} tenantId={tenantId} displayFilename={vakalatnama.name} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="advocate-replacement-request-body">
          {advocateReplacementData?.reasonForReplacement?.map((item) => (
            <div className="info-row" key={item.label}>
              <p className="label">{t(item.label)}</p>
              {item?.type === "file" ? (
                <div className="reason-document-wrapper">
                  <DocViewerWrapper fileStoreId={item.value} tenantId={tenantId} displayFilename={t("REASON_FOR_REPLACEMENT")} />
                </div>
              ) : (
                <p className="value">{item.value}</p>
              )}
            </div>
          ))}
        </div>
        <div className="advocate-replacement-request-body">
          {advocateReplacementData?.litigants?.map((item) => (
            <div className="info-row" key={item.data[0]}>
              {item?.data?.map((data) => (
                <p className={`data item-${item?.data?.length} ${item.type === "head" ? "head" : ""}`}>{t(data)}</p>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="advocate-replacement-request-footer">
        <ButtonSelector
          label={t("REJECT")}
          onSubmit={async () => {
            if (isCitizen) {
              setConfirmModal({ isOpen: true, modalType: "reject" });
            } else {
              await replaceAdvocateOrderCreate("reject");
            }
          }}
          className="advocate-replacement-request-cancel-button"
          isDisabled={isApiCalled}
        />
        <ButtonSelector
          label={t("CS_APPROVE")}
          onSubmit={async () => {
            if (isCitizen) {
              setConfirmModal({ isOpen: true, modalType: "approve" });
              setSubmitConfirmed(false);
            } else {
              await replaceAdvocateOrderCreate("approve");
            }
          }}
          className="advocate-replacement-request-submit-button"
          isDisabled={isApiCalled}
        />
      </div>
      {isOpen && (
        <Modal
          headerBarEnd={<CloseBtn onClick={() => setConfirmModal({ isOpen: false, modalType: null })} />}
          formId="modal-action"
          headerBarMainStyle={{ display: "flex" }}
          headerBarMain={<Heading label={modalType === "reject" ? t("ADVOCATE_REPLACEMENT_REJECT") : t("ADVOCATE_REPLACEMENT_APPROVE")} />}
          actionSaveLabel={modalType === "reject" ? t("REJECT") : t("CS_APPROVE")}
          actionSaveOnSubmit={async () => {
            await updateReplaceAdvocateTask(modalType === "reject" ? "REJECT" : "APPROVE");
            setConfirmModal({ isOpen: false, modalType: null });
          }}
          actionCancelLabel={t("BACK")}
          actionCancelOnSubmit={() => {
            setSubmitConfirmed(false);
            setConfirmModal({ isOpen: false, modalType: null });
          }}
          isDisabled={(modalType === "approve" && !submitConfirmed) || isApiCalled}
          className="advocate-replacement-request-modal"
          submitClassName={modalType === "approve" ? "approve-button" : "reject-button"}
        >
          <div className={`confirm-modal-content ${modalType === "approve" ? "approve" : "reject"}`}>
            <p className="confirm-modal-content-text">
              {modalType === "reject" ? t("ADVOCATE_REPLACEMENT_REJECT_MESSAGE") : t("ADVOCATE_REPLACEMENT_APPROVE_MESSAGE")}
            </p>
            {modalType === "approve" && (
              <CheckBox
                value={submitConfirmed}
                label={t("ADVOCATE_REPLACEMENT_CONFIRMATION")}
                wrkflwStyle={{}}
                onChange={() => setSubmitConfirmed((submitConfirmed) => !submitConfirmed)}
              />
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdvocateReplacementComponent;
