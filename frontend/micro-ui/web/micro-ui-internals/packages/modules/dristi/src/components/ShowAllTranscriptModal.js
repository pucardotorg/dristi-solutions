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

const ShowAllTranscriptModal = ({ setShowAllTranscript, botdOrderList, judgeView = false }) => {
  const { t } = useTranslation();

  return (
    <Modal
      headerBarMain={<Heading heading={judgeView ? t("BOTD_SUMMARIES") : t("ALL_BOTD_TRANSCRIPT")} />}
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
        {!botdOrderList?.length ? (
          <div style={{ marginTop: "20px" }}>
            {t("NO_BOTD_SUMMARY_AVAILABLE")}
          </div>
        ) :
        botdOrderList?.map((botdOrder, index) => (
          <div key={index} style={{ paddingRight: "20px", marginTop: "15px" }}>
            <div className="transcript-header" style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ marginLeft: "4px" }}>{botdOrder?.hearingNumber ? `${botdOrder?.hearingType ? t(botdOrder?.hearingType) : ""} ${t("BOTD")}` : t("BOTD")}</div>
              <div style={{ marginRight: "8px" }}>{`${formatDate(botdOrder?.createdDate)}`}</div>
            </div>
            <div>
              <TextArea
                style={{ width: "100%", height: "12vh", border: "solid 1px #3d3c3c", resize: "none" }}
                value={botdOrder?.businessOfTheDay || ""}
                readOnly
              />
            </div>

            {/* {hearing?.attendees && hearing?.attendees?.length > 0 && (
              <div style={{ border: "solid 1px rgb(61, 60, 60)", marginTop: "-5px", padding: "5px" }}>
                <span>Attendees: </span>
                <span style={{ whiteSpace: "normal", wordBreak: "normal" }}>
                  {hearing?.attendees
                    ?.filter((attendee) => attendee?.wasPresent)
                    ?.map((attendee, index) => attendee?.name)
                    ?.filter(Boolean)
                    ?.join(", ")}
                </span>
              </div>
            )} */}
          </div>
        ))}
      </div>
      <div className="submit-bar-div">
        <SubmitBar
          variation="primary"
          onSubmit={() => setShowAllTranscript(false)}
          className="primary-label-btn"
          label={t("CS_COMMON_BACK")}
        ></SubmitBar>
      </div>
    </Modal>
  );
};

export default ShowAllTranscriptModal;
