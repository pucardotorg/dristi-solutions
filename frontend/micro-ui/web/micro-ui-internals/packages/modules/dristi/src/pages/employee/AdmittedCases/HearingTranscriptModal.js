import { TextArea } from "@egovernments/digit-ui-components";
import React, { useEffect } from "react";
import Modal from "../../../components/Modal";
import { SubmitBar } from "@egovernments/digit-ui-react-components";
import { DateUtils } from "../../../Utils";
import { CloseBtn } from "../../../components/ModalComponents";

function HearingTranscriptModal({ t, hearing, setShowHearingTranscriptModal }) {
  const Heading = () => {
    return <h1 className="heading-m">{`${t(hearing?.hearingType)} Hearing- ${DateUtils.getFormattedDate(hearing?.startTime)}`}</h1>;
  };

  
  return (
    <Modal
      headerBarMain={<Heading />}
      headerBarEnd={<CloseBtn onClick={() => setShowHearingTranscriptModal(false)} />}
      actionCancelLabel={null}
      actionCancelOnSubmit={() => {}}
      actionSaveLabel={null}
      hideSubmit={true}
      actionSaveOnSubmit={() => {}}
      popupStyles={{ minHeight: "50vh", width: "70vw" }}
      className={"view-hearing-transcript-modal"}
    >
      <div>
        <h2 className="transcript-header">{t("HEARING_TRANSCRIPT_SUMMARY_HEADING")}</h2>
        <TextArea
          style={{ width: "100%", height: "25vh", border: "solid 1px #3d3c3c", resize: "none", fontSize: "large" }}
          value={hearing?.hearingSummary || ""}
        />
      </div>
      <div className="submit-bar-div">
        <SubmitBar
          variation="primary"
          onSubmit={() => setShowHearingTranscriptModal(false)}
          className="primary-label-btn"
          label={t("CS_COMMON_CANCEL")}
        ></SubmitBar>
      </div>
    </Modal>
  );
}

export default HearingTranscriptModal;
