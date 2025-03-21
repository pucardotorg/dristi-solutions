import ButtonSelector from "@egovernments/digit-ui-module-dristi/src/components/ButtonSelector";
import { Urls } from "@egovernments/digit-ui-module-dristi/src/hooks";
import { DRISTIService } from "@egovernments/digit-ui-module-dristi/src/services";
import { OrderWorkflowAction } from "@egovernments/digit-ui-module-dristi/src/Utils/orderWorkflow";
import { ordersService } from "@egovernments/digit-ui-module-orders/src/hooks/services";
import { CloseSvg, CheckBox } from "@egovernments/digit-ui-react-components";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";

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

const AdvocateReplacementComponent = ({ filingNumber = "KL-001069-2025", taskId }) => {
  const { t } = useTranslation();
  const history = useHistory();

  const tenantId = useMemo(() => Digit.ULBService.getCurrentTenantId(), []);
  const Modal = useMemo(() => window?.Digit?.ComponentRegistryService?.getComponent("Modal"), []);
  const [submitConfirmed, setSubmitConfirmed] = useState(false);

  const [{ modalType, isOpen }, setConfirmModal] = useState({ modalType: null, isOpen: false });

  const { data: caseData, isLoading: isCaseDetailsLoading, refetch: refetchCaseData } = Digit.Hooks.dristi.useSearchCaseService(
    {
      criteria: [
        {
          filingNumber: filingNumber,
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

  //   const { data: AdvocateReplacementData } = Digit.Hooks.dristi.useGetAdvocateReplacement(tenantId);

  const replaceAdvocateOrderCreate = async (type) => {
    debugger;
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
      taskId: taskId,
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
      },
    };
    debugger;
    try {
      const res = await ordersService.createOrder(reqbody, { tenantId });
      DRISTIService.customApiService(Urls.dristi.pendingTask, {
        pendingTask: {
          name: t("ADVOCATE_REPLACEMENT_APPROVAL"),
          entityType: "order-default",
          referenceId: `MANUAL_${res?.order?.orderNumber}`,
          status: "DRAFT_IN_PROGRESS",
          assignedTo: [],
          assignedRole: ["JUDGE_ROLE"],
          cnrNumber: caseDetails?.cnrNumber,
          filingNumber: filingNumber,
          isCompleted: false,
          stateSla: 2 * 24 * 3600 * 1000 + new Date().getTime(),
          additionalDetails: { orderType: "ADVOCATE_REPLACEMENT_APPROVAL" },
          tenantId,
        },
      });
      history.push(`/${window.contextPath}/employee/orders/generate-orders?filingNumber=${filingNumber}&orderNumber=${res?.order?.orderNumber}`);
    } catch (error) {}
  };

  const advocateReplacementData = useMemo(() => {
    return {
      basicDetails: [
        { label: "ADVOCATE_NAME", value: "Saul Goodman" },
        { label: "BAR_REGISTRATION_NO", value: "356278SGH789" },
        { label: "MOBILE_NUMBER", value: "+91 94784 75875" },
        { label: "REQUEST_DATE", value: "21-02-2024" },
      ],
      reasonForReplacement: [
        { label: "REASON_FOR_REPLACEMENT", value: "Reason for Replacement" },
        { label: "SUPPORTING_DOCUMENT", value: "Document Preview URL" },
      ],
      litigants: [
        { type: "head", data: ["Advocates to be replaced", "LITIGANTS_FOR_WHOM_REPLACEMENT_IS_REQUESTED", "BAR Registration Number"] },
        { type: "body", data: ["Saul", "Anshumanth", "356278SGH789"] },
        { type: "body", data: ["Saul", "Mehul (Complainant 2)", "356278SGH789"] },
        { type: "body", data: ["Goodman", "Anshumanth", "356278SGH789"] },
        { type: "body", data: ["Saul", "Anshumanth", "356278SGH789"] },
      ],
    };
  }, []);
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
        <div className="advocate-replacement-request-body">
          {advocateReplacementData?.reasonForReplacement?.map((item) => (
            <div className="info-row" key={item.label}>
              <p className="label">{t(item.label)}</p>
              <p className="value">{item.value}</p>
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
            setConfirmModal({ isOpen: true, modalType: "reject" });
            await replaceAdvocateOrderCreate("reject");
          }}
          className="advocate-replacement-request-cancel-button"
        />
        <ButtonSelector
          label={t("APPROVE")}
          onSubmit={async () => {
            setConfirmModal({ isOpen: true, modalType: "approve" });
            await replaceAdvocateOrderCreate("approve");
          }}
          className="advocate-replacement-request-submit-button"
        />
      </div>
      {isOpen && (
        <Modal
          headerBarEnd={<CloseBtn onClick={() => setConfirmModal({ isOpen: false, modalType: null })} />}
          formId="modal-action"
          headerBarMainStyle={{ display: "flex" }}
          headerBarMain={<Heading label={modalType === "reject" ? t("REJECT") : t("APPROVE")} />}
          actionSaveLabel={modalType === "reject" ? t("REJECT") : t("APPROVE")}
          actionSaveOnSubmit={() => {}}
          actionCancelLabel={t("BACK")}
          actionCancelOnSubmit={() => {
            setSubmitConfirmed(false);
            setConfirmModal({ isOpen: false, modalType: null });
          }}
          isDisabled={modalType === "approve" && !submitConfirmed}
          className="advocate-replacement-request-modal"
          submitClassName={modalType === "approve" ? "approve-button" : "reject-button"}
        >
          <div className={`confirm-modal-content ${modalType === "approve" ? "approve" : "reject"}`}>
            <p className="confirm-modal-content-text">{modalType === "reject" ? t("REJECT_MESSAGE") : t("APPROVE_MESSAGE")}</p>
            {modalType === "approve" && (
              <CheckBox
                value={submitConfirmed}
                label={t("CASE_SUBMISSION_CONFIRMATION")}
                wrkflwStyle={{}}
                onChange={() => setSubmitConfirmed(!submitConfirmed)}
              />
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdvocateReplacementComponent;
