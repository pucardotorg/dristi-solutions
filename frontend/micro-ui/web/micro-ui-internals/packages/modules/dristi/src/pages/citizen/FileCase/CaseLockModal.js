import { CheckBox } from "@egovernments/digit-ui-react-components";

import React, { useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import { CaseWorkflowState } from "../../../Utils/caseWorkflow";
import CustomToast from "@egovernments/digit-ui-module-dristi/src/components/CustomToast";
import Modal from "../../../components/Modal";
import { CloseBtn, Heading } from "../../../components/ModalComponents";

const caseLockingMainDiv = {
  padding: "24px",
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

const caseSubmissionWarningText = {
  fontFamily: "Roboto",
  fontSize: "16px",
  fontWeight: 400,
  lineHeight: "21.6px",
  color: "#3D3C3C",
};
function CaseLockModal({
  t,
  path,
  setShowCaseLockingModal,
  setShowConfirmCaseDetailsModal,
  onSubmit,
  createPendingTask,
  setPrevSelected,
  selected,
  caseDetails,
  state,
}) {
  const [submitConfirmed, setSubmitConfirmed] = useState(false);
  const history = useHistory();
  const [showToast, setShowToast] = useState(null);
  const selectedSeniorAdvocate = JSON.parse(sessionStorage.getItem("selectedAdvocate"));
  const { uuid: selectedAdvocateUuid } = selectedSeniorAdvocate || {};

  const filingNumber = useMemo(() => {
    return caseDetails?.filingNumber;
  }, [caseDetails]);

  const caseId = useMemo(() => {
    return caseDetails?.id;
  }, [caseDetails]);

  const litigants = useMemo(() => {
    return caseDetails?.litigants
      ?.filter((litigant) => litigant.partyType.includes("complainant"))
      ?.map((litigant) => ({
        ...litigant,
        representatives:
          caseDetails?.representatives?.filter((rep) =>
            rep?.representing?.some((complainant) => complainant?.individualId === litigant?.individualId)
          ) || [],
        poaHolder: caseDetails?.poaHolders?.find((poaHolder) =>
          poaHolder?.representingLitigants?.some((complainant) => complainant?.individualId === litigant?.individualId)
        ),
      }));
  }, [caseDetails]);

  const handleSaveOnSubmit = async () => {
    setShowCaseLockingModal(false);

    const isCaseReassigned = state === CaseWorkflowState.CASE_REASSIGNED;
    const actionType = isCaseReassigned ? "EDIT_CASE" : "SUBMIT_CASE";

    const result = await onSubmit(actionType, true);
    if (result?.error) return;

    try {
      const taskName = isCaseReassigned ? t("PENDING_RE_E_SIGN_FOR_CASE") : t("PENDING_E_SIGN_FOR_CASE");
      const taskStatus = isCaseReassigned ? "PENDING_RE_E-SIGN" : "PENDING_E-SIGN";

      const promises = [...(litigants || []), ...(caseDetails?.representatives || []), ...(caseDetails?.poaHolders || [])]?.map((party) => {
        if (!party?.poaHolder) {
          return createPendingTask({
            name: taskName,
            status: taskStatus,
            assignee: party?.additionalDetails?.uuid,
          });
        } else {
          return null;
        }
      });
      await Promise.all(promises);
      history.replace(`${path}/sign-complaint?filingNumber=${filingNumber}&caseId=${caseId}`);
    } catch (error) {
      console.error("Failed to create e-sign tasks:", error);
      const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
      setShowToast({ label: t("FAILED_TO_CREATE_ESIGN_TASKS"), error: true, errorId });
    }
  };

  const handleCancelOnSubmit = async () => {
    setShowCaseLockingModal(false);

    if (selectedAdvocateUuid) {
      const assignees = Array.isArray(caseDetails?.representatives)
        ? caseDetails?.representatives?.map((advocate) => ({
            uuid: advocate?.additionalDetails?.uuid,
          }))
        : [];

      const isCaseReassigned = state === CaseWorkflowState.CASE_REASSIGNED;
      const actionType = isCaseReassigned ? "EDIT_CASE_ADVOCATE" : "SUBMIT_CASE_ADVOCATE";

      const result = await onSubmit(actionType, true);
      if (result?.error) return;

      const taskName = isCaseReassigned ? t("PENDING_RE_UPLOAD_SIGNATURE_FOR_CASE") : t("PENDING_UPLOAD_SIGNATURE_FOR_CASE");
      const taskStatus = isCaseReassigned ? "PENDING_RE_SIGN" : "PENDING_SIGN";

      try {
        await createPendingTask({
          name: taskName,
          status: taskStatus,
          assignees: [...assignees],
        });
        history.replace(`${path}/sign-complaint?filingNumber=${filingNumber}&caseId=${caseId}`);
      } catch (error) {
        console.error("Failed to create signature upload task:", error);
        const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
        setShowToast({ label: t("FAILED_TO_CREATE_SIGNATURE_UPLOAD_TASK"), error: true, errorId });
      }
    }
  };

  return (
    <React.Fragment>
      <Modal
        headerBarEnd={
          <CloseBtn
            onClick={() => {
              setPrevSelected(selected);
              setShowCaseLockingModal(false);
            }}
          />
        }
        actionSaveLabel={selectedAdvocateUuid ? t("CS_ESIGN") : t("CONFIRM_AND_SIGN")}
        actionSaveOnSubmit={handleSaveOnSubmit}
        actionCancelLabel={selectedAdvocateUuid ? t("UPLOAD_SIGNED_COPY") : t("DOWNLOAD_CS_BACK")}
        actionCancelOnSubmit={handleCancelOnSubmit}
        formId="modal-action"
        headerBarMain={
          <Heading style={{ marginLeft: "47px" }} label={selectedAdvocateUuid ? t("SUBMIT_CASE_CONFIRMATION") : t("CONFIRM_CASE_DETAILS")} />
        }
        popmoduleClassName={"case-lock-confirm-modal"}
        style={{ width: "50%", height: "40px" }}
        // textStyle={{ margin: "0px", color: "" }}
        // popupStyles={{ maxWidth: "60%" }}
        popUpStyleMain={{ zIndex: "1000" }}
        isDisabled={!submitConfirmed}
        isBackButtonDisabled={!submitConfirmed && selectedAdvocateUuid}
        actionCancelStyle={{ width: "50%", height: "40px" }}
      >
        <div className="case-locking-main-div" style={caseLockingMainDiv}>
          <div>
            {selectedAdvocateUuid ? (
              <React.Fragment>
                <p className="case-submission-warning" style={{ ...caseSubmissionWarningText, margin: "10px 0px" }}>
                  {t("CONFIRM_HOW_COMPLAINT_WILL_BE_SIGNED")}
                </p>
                <p className="case-submission-warning" style={{ ...caseSubmissionWarningText, margin: "10px 0px" }}>
                  {t("UPLOAD_SIGNED_COPY_MESSAGE")}
                </p>
                <p className="case-submission-warning" style={{ ...caseSubmissionWarningText, margin: "10px 0px" }}>
                  {t("LITIGANT_ESIGN_MESSAGE")}
                </p>
                <p className="case-submission-warning" style={{ ...caseSubmissionWarningText, margin: "10px 0px" }}>
                  {t("MOVE_BACK_TO_DRAFT_FOR_CHANGE_MODE_SIGNING")}
                </p>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <p className="case-submission-warning" style={{ ...caseSubmissionWarningText, margin: "10px 0px" }}>
                  {t("CASE_SUBMISSION_WARNING")}
                </p>
                <p className="case-submission-warning" style={{ ...caseSubmissionWarningText, margin: "10px 0px" }}>
                  {t("CASE_SUBMISSION_PROCESS_SUBMISSION")} <span style={{ fontWeight: "700" }}>{t("CASE_SUBMISSION_PROCESS_SIGNED")}</span>{" "}
                  {t("CASE_SUBMISSION_PROCESS_MOVED")} <span style={{ fontWeight: "700" }}>{t("CASE_SUBMISSION_PROCESS_SCRUTINY")}</span>{" "}
                  {t("CASE_SUBMISSION_PROCESS_COMPLETED")}
                </p>
              </React.Fragment>
            )}
            <CheckBox
              value={submitConfirmed}
              label={t("CASE_SUBMISSION_CONFIRMATION")}
              wrkflwStyle={{}}
              style={{ ...caseSubmissionWarningText, lineHeight: "18.75px", fontStyle: "italic" }}
              onChange={() => setSubmitConfirmed(!submitConfirmed)}
            />
          </div>
        </div>
      </Modal>
      {showToast && (
        <CustomToast
          error={showToast?.error}
          label={showToast?.label}
          errorId={showToast?.errorId}
          onClose={() => setShowToast(null)}
          duration={showToast?.errorId ? 7000 : 5000}
        />
      )}
    </React.Fragment>
  );
}

export default CaseLockModal;
