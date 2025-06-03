import { CloseSvg, TextArea } from "@egovernments/digit-ui-components";
import React, { useEffect } from "react";
import Modal from "./Modal";
import { SubmitBar } from "@egovernments/digit-ui-react-components";
import { useTranslation } from "react-i18next";

const formatDate = (epochTime) => {
  const date = new Date(epochTime);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const Heading = (props) => {
  return <h1 className="heading-m">{props.heading}</h1>;
};

const CloseBtn = (props) => {
  return (
    <div onClick={props?.onClick} style={{ height: "100%", display: "flex", alignItems: "center", paddingRight: "20px", cursor: "pointer" }}>
      <CloseSvg />
    </div>
  );
};

const ShowAllTranscriptModal = ({ setShowAllTranscript, hearingList, judgeView = false }) => {
  const { t } = useTranslation();

  return (
    <Modal
      headerBarMain={<Heading heading={judgeView ? t("HEARING_SUMMARIES") : t("ALL_HEARING_TRANSCRIPT")} />}
      headerBarEnd={<CloseBtn onClick={() => setShowAllTranscript(false)} />}
      actionCancelLabel={null}
      actionCancelOnSubmit={() => {}}
      actionSaveLabel={null}
      hideSubmit={true}
      actionSaveOnSubmit={() => {}}
      popupStyles={{ minHeight: "50vh", width: "70vw", borderRadius: "4px" }}
      className={"view-hearing-transcript-modal"}
    >
      <div style={{ height: "50vh", overflowY: "auto" }}>
        {hearingList?.map((hearing, index) => (
          <div key={index} style={{ paddingRight: "20px", marginTop: "15px" }}>
            <div className="transcript-header" style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ marginLeft: "4px" }}>{`${hearing?.hearingType.charAt(0).toUpperCase()}${hearing?.hearingType
                .slice(1)
                .toLowerCase()} Hearing`}</div>
              <div style={{ marginRight: "8px" }}>{`${formatDate(hearing?.startTime)}`}</div>
            </div>
            <div>
              <TextArea
                style={{ width: "100%", height: "12vh", border: "solid 1px #3d3c3c", resize: "none" }}
                value={hearing?.hearingSummary || ""}
                readOnly
              />
            </div>

            <div style={{border: "solid 1px rgb(61, 60, 60)", marginTop: "-5px", padding: "5px" }}>
              <span>Attendees: </span>
              <span style={{ whiteSpace: "normal", wordBreak: "normal" }}>
                {hearing.attendees
                  ?.map((attendee, index) => attendee?.name)
                  .filter(Boolean)
                  .join(", ")}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="submit-bar-div">
        <SubmitBar
          variation="primary"
          onSubmit={() => setShowAllTranscript(false)}
          className="primary-label-btn"
          label={t("CS_COMMON_CANCEL")}
        ></SubmitBar>
      </div>
    </Modal>
  );
};

export default ShowAllTranscriptModal;
