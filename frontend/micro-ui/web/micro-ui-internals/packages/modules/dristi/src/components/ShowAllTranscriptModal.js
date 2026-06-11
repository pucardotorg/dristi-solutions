import PropTypes from "prop-types";
import { TextArea } from "@egovernments/digit-ui-components";
import React from "react";
import Modal from "./Modal";
import { SubmitBar } from "@egovernments/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { DateUtils } from "../Utils";
import { CloseBtn } from "./ModalComponents";

function TranscriptHeading({ heading }) {
  return <h1 className="heading-m">{heading}</h1>;
}

TranscriptHeading.propTypes = {
  heading: PropTypes.string.isRequired,
};

const ShowAllTranscriptModal = ({ setShowAllTranscript, botdOrderList, judgeView = false }) => {
  const { t } = useTranslation();

  return (
    <Modal
      headerBarMain={<TranscriptHeading heading={judgeView ? t("BOTD_SUMMARIES") : t("ALL_BOTD_TRANSCRIPT")} />}
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
          <div style={{ marginTop: "20px" }}>{t("NO_BOTD_SUMMARY_AVAILABLE")}</div>
        ) : (
          botdOrderList?.map((botdOrder, index) => {
            const rowKey = botdOrder?.id ?? `${botdOrder?.hearingNumber ?? "h"}-${botdOrder?.createdDate ?? index}`;
            return (
              <div key={rowKey} style={{ paddingRight: "20px", marginTop: "15px" }}>
                <div className="transcript-header" style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={{ marginLeft: "4px" }}>
                    {botdOrder?.hearingNumber ? `${botdOrder?.hearingType ? t(botdOrder?.hearingType) : ""} ${t("BOTD")}` : t("BOTD")}
                  </div>
                  <div style={{ marginRight: "8px" }}>{`${DateUtils.getFormattedDate(botdOrder?.createdDate)}`}</div>
                </div>
                <div>
                  <TextArea
                    style={{ width: "100%", height: "12vh", border: "solid 1px #3d3c3c", resize: "none" }}
                    value={botdOrder?.businessOfTheDay || ""}
                    readOnly
                  />
                </div>
              </div>
            );
          })
        )}
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

ShowAllTranscriptModal.propTypes = {
  setShowAllTranscript: PropTypes.func.isRequired,
  botdOrderList: PropTypes.array,
  judgeView: PropTypes.bool,
};

export default ShowAllTranscriptModal;
