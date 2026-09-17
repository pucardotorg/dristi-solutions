import React from "react";
import { Modal, CheckBox } from "@egovernments/digit-ui-react-components";
import { Heading, CloseBtn } from "../utils/componentUtils";

const EndHearingModal = ({
  showEndHearingModal,
  setShowEndHearingModal,
  t,
  passOver,
  setPassOver,
  apiCalled,
  setApiCalled,
  hearingService,
  Digit,
  currentInProgressHearing,
  nextHearing,
  history,
  setShowToast,
}) => {
  if (!showEndHearingModal.openEndHearingModal) return null;

  const handleEndHearing = async (shouldNavigateHome = false) => {
    setApiCalled(true);
    try {
      await hearingService.updateHearings(
        {
          tenantId: Digit.ULBService.getCurrentTenantId(),
          hearing: { ...currentInProgressHearing, workflow: { action: passOver ? "PASS_OVER" : "CLOSE" } },
          hearingType: "",
          status: "",
        },
        { applicationNumber: "", cnrNumber: "" }
      );

      if (shouldNavigateHome) {
        setTimeout(() => {
          setShowEndHearingModal({
            isNextHearingDrafted: false,
            openEndHearingModal: false,
          });
          setApiCalled(false);
          history.push(`/${window?.contextPath}/employee/home/home-screen`);
        }, 100);
      } else {
        setShowEndHearingModal({ isNextHearingDrafted: false, openEndHearingModal: false });
        nextHearing(true);
        setApiCalled(false);
      }
    } catch (error) {
      console.error("Error while updating hearings", error);
      const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
      setShowToast({ label: t("FAILED_TO_UPDATE_HEARINGS"), error: true, errorId });
      setApiCalled(false);
    }
  };

  return (
    <Modal
      headerBarMain={<Heading label={t("CS_CASE_CONFIRM_END_HEARING")} />}
      headerBarEnd={
        <CloseBtn
          onClick={() => {
            setShowEndHearingModal({ isNextHearingDrafted: false, openEndHearingModal: false });
          }}
        />
      }
      actionSaveLabel={t(passOver ? "CS_CASE_PASS_OVER_START_NEXT_HEARING" : "CS_CASE_END_START_NEXT_HEARING")}
      isBackButtonDisabled={apiCalled}
      isCustomButtonDisabled={apiCalled}
      isDisabled={apiCalled}
      actionSaveOnSubmit={() => handleEndHearing(false)}
      actionCustomLabelSubmit={() => handleEndHearing(true)}
      actionCancelOnSubmit={() => {
        setShowEndHearingModal({ isNextHearingDrafted: false, openEndHearingModal: false });
      }}
      actionCancelLabel={t("CS_COMMON_CANCEL")}
      actionCustomLabel={t(passOver ? "CS_CASE_PASS_OVER_VIEW_CAUSE_LIST" : "CS_CASE_END_VIEW_CAUSE_LIST")}
      customActionClassName={"end-and-view-causelist-button"}
      submitClassName={"end-and-view-causelist-submit-button"}
      className={"confirm-end-hearing-modal"}
    >
      <div style={{ margin: "16px 0px" }}>
        <CheckBox
          onChange={(e) => {
            setPassOver(e.target.checked);
          }}
          label={`${t("CS_CASE_PASS_OVER")}: ${t("CS_CASE_PASS_OVER_HEARING_TEXT")}`}
          checked={passOver}
          disable={false}
        />
      </div>
    </Modal>
  );
};

export default EndHearingModal;
