import React from "react";
import { CheckBox } from "@egovernments/digit-ui-react-components";
import Modal from "../../../../components/Modal";
import { CloseSvg } from "@egovernments/digit-ui-react-components";
import { hearingService } from "@egovernments/digit-ui-module-hearings/src/hooks/services";

const Heading = (props) => {
  return <h1 className="heading-m">{props.label}</h1>;
};

const CloseBtn = (props) => {
  return (
    <div
      onClick={props?.onClick}
      style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        paddingRight: "20px",
        cursor: "pointer",
        ...(props?.backgroundColor && { backgroundColor: props.backgroundColor }),
      }}
    >
      <CloseSvg />
    </div>
  );
};

const EndHearingModal = ({ t, showEndHearingModal, setShowEndHearingModal, passOver, setPassOver, apiCalled, setApiCalled, currentInProgressHearing, nextHearing, history }) => {
  if (!showEndHearingModal.openEndHearingModal) return null;

  const handleEndAndNext = async () => {
    setApiCalled(true);
    hearingService
      .updateHearings(
        {
          tenantId: Digit.ULBService.getCurrentTenantId(),
          hearing: { ...currentInProgressHearing, workflow: { action: passOver ? "PASS_OVER" : "CLOSE" } },
          hearingType: "",
          status: "",
        },
        { applicationNumber: "", cnrNumber: "" }
      )
      .then(() => {
        setShowEndHearingModal({ isNextHearingDrafted: false, openEndHearingModal: false });
        nextHearing(true);
        setApiCalled(false);
      })
      .catch((error) => {
        console.error("Error while updating hearings", error);
        setApiCalled(false);
      })
      .finally(() => {
        setApiCalled(false);
      });
  };

  const handleEndAndViewCauseList = async () => {
    setApiCalled(true);
    hearingService
      .updateHearings(
        {
          tenantId: Digit.ULBService.getCurrentTenantId(),
          hearing: { ...currentInProgressHearing, workflow: { action: passOver ? "PASS_OVER" : "CLOSE" } },
          hearingType: "",
          status: "",
        },
        { applicationNumber: "", cnrNumber: "" }
      )
      .then(() => {
        setTimeout(() => {
          setShowEndHearingModal({
            isNextHearingDrafted: false,
            openEndHearingModal: false,
          });
          setApiCalled(false);
          history.push(`/${window?.contextPath}/employee/home/home-screen`);
        }, 100);
      })
      .catch((error) => {
        console.error("Error while updating hearings", error);
        setApiCalled(false);
      })
      .finally(() => {
        setApiCalled(false);
      });
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
      actionSaveOnSubmit={handleEndAndNext}
      actionCustomLabelSubmit={handleEndAndViewCauseList}
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
