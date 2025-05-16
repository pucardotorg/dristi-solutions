import React, { Fragment, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  BreakLine,
  CardSectionHeader,
  CheckPoint,
  ConnectingCheckPoints,
  DisplayPhotos,
  Loader,
  TelePhone,
  UnMaskComponent,
} from "@egovernments/digit-ui-react-components";

function OpenImage(imageSource, index, thumbnailsToShow) {
  window.open(thumbnailsToShow?.fullImage?.[0], "_blank");
}

const Reason = ({ headComment, otherComment, additionalComment }) => {
  const { t } = useTranslation();
  const getMarkup = () => {
    if (additionalComment) {
      return (
        <div className="checkpoint-comments-wrap" style={{ marginBottom: "1rem" }}>
          <p>{t("COMMON_CERTIFY_ONE")}</p>
          <br />
          <p>
            <b> {t("ES_COMMON_NOTE")}</b>
            {t("COMMON_CERTIFY_TWO")}
          </p>
        </div>
      );
    } else {
      return (
        <div className="checkpoint-comments-wrap">
          <h4>{headComment}</h4>
          <p>{otherComment}</p>
        </div>
      );
    }
  };
  return getMarkup();
};

const TLCaption = ({ data, OpenImage, privacy = {} }) => {
  const { t } = useTranslation();
  return (
    <div style={{minHeight:"75px"}}>
      {data.date && <p>{data.date}</p>}
      {/* <p>{data.name}</p> */}
      {["judge", "fso"].includes(data?.name?.toLowerCase()) && data?.wfComment?.length > 0 ? (
        <div>
          {data.wfComment.map((e, idx) => (
            <div key={idx} style={{ backgroundColor: "unset" }}>
              <p style={{ marginBottom: "2px", color: "black", fontWeight: "500" }}>{`${data.name} ${t("WF_COMMON_COMMENTS")} :`}</p>
              <p style={{ margin: 0 }}>{e}</p>
            </div>
          ))}
        </div>
      ) : null}
      {/* {data.mobileNumber && (
        <span style={{ display: "inline-flex", width: "fit-content", marginLeft: "10px" }}>
          <p>&nbsp;&nbsp;&nbsp;&nbsp;</p>
          <UnMaskComponent privacy={privacy}></UnMaskComponent>
        </span>
      )} */}
      {/* {data.source && <p>{t("ES_APPLICATION_DETAILS_APPLICATION_CHANNEL_" + data.source.toUpperCase())}</p>}
      {data.comment && <Reason otherComment={data?.otherComment} headComment={data?.comment}></Reason>}
      {data.additionalComment && (
        <Reason otherComment={data?.otherComment} headComment={data?.additionalComment} additionalComment={data?.additionalComment}></Reason>
      )}

      {data?.thumbnailsToShow?.thumbs?.length > 0 ? (
        <div className="TLComments">
          <h3>{t("CS_COMMON_ATTACHMENTS")}</h3>
          <DisplayPhotos
            srcs={data?.thumbnailsToShow.thumbs}
            onClick={(src, index) => {
              OpenImage(src, index, data?.thumbnailsToShow);
            }}
          />
        </div>
      ) : null} */}
    </div>
  );
};

const WorkflowTimeline = ({
  businessService,
  tenantId,
  applicationNo,
  timelineStatusPrefix = "WF_SERVICE_",
  statusAttribute = "status",
  ...props
}) => {
  const [additionalComment, setAdditionalComment] = useState(false);
  const { t } = useTranslation();

  const getTimelineCaptions = (checkpoint, index) => {
    let captionDetails = {
      name: "",
      date: "",
      wfComment: "",
      additionalComment: "",
      thumbnailsToShow: "",
    };

    if (index === -1) {
      captionDetails.name = checkpoint?.assignes?.[0]?.name;
      captionDetails.date = "";
      captionDetails.mobileNumber = "";
      captionDetails.wfComment = "";
      captionDetails.additionalComment = "";
      captionDetails.thumbnailsToShow = "";
    } else {
      captionDetails.name = checkpoint?.assigner?.name;
      captionDetails.date = `${Digit.DateUtils?.ConvertTimestampToDate(checkpoint.auditDetails.lastModifiedEpoch)}`;
      captionDetails.mobileNumber = checkpoint?.assigner?.mobileNumber;
      captionDetails.wfComment = checkpoint?.comment ? [checkpoint?.comment] : [];
      captionDetails.additionalComment = additionalComment && checkpoint?.performedAction === "APPROVE";
      captionDetails.thumbnailsToShow = checkpoint?.thumbnailsToShow;
    }

    const caption = {
      date: captionDetails?.date,
      name: captionDetails?.name,
      mobileNumber: captionDetails?.mobileNumber,
      wfComment: captionDetails?.wfComment,
      additionalComment: captionDetails?.additionalComment,
      thumbnailsToShow: checkpoint?.thumbnailsToShow,
    };

    return <TLCaption data={caption} OpenImage={OpenImage} />;
  };

  let workflowDetails = Digit.Hooks.useWorkflowDetailsV2({
    tenantId: tenantId,
    id: applicationNo,
    moduleCode: businessService,
    config: {
      enabled: true,
      cacheTime: 0,
    },
  });

  // Filter and sort the timeline data
  const filteredTimeline = workflowDetails?.data?.timeline?.filter((checkpoint) =>
    ["UNDER_SCRUTINY", "CASE_REASSIGNED", "PENDING_REGISTRATION"].includes(checkpoint?.state)
  );

  useEffect(() => {
    if (
      workflowDetails?.data?.applicationBusinessService === "muster-roll-approval" &&
      workflowDetails?.data?.actionState?.applicationStatus === "APPROVED"
    ) {
      setAdditionalComment(true);
    }
  }, [workflowDetails]);

  return (
    <Fragment>
      {workflowDetails?.isLoading && <Loader />}
      {filteredTimeline?.length > 0 && (
        <React.Fragment>
          {workflowDetails?.breakLineRequired === undefined ? <BreakLine /> : workflowDetails?.breakLineRequired ? <BreakLine /> : null}
          {!workflowDetails?.isLoading && (
            <Fragment>
              <CardSectionHeader style={{ marginBottom: "16px", marginTop: "32px", fontWeight: "bold" }}>
                {t("WORKS_WORKFLOW_TIMELINE")}
              </CardSectionHeader>
              {filteredTimeline && (
                <ConnectingCheckPoints>
                  {filteredTimeline.map((checkpoint, index) => {
                    const isFirst = index === 0;
                    const isCompleted = isFirst && !checkpoint?.isTerminateState;

                    return (
                      <CheckPoint
                        key={index}
                        keyValue={index}
                        isCompleted={isCompleted}
                        label={t(Digit.Utils.locale.getTransformedLocale(`${timelineStatusPrefix}STATUS_${checkpoint?.state}`))}
                        customChild={getTimelineCaptions(checkpoint, index)}
                        style={{ width: "calc(100% - 40px)" }}
                      />
                    );
                  })}
                </ConnectingCheckPoints>
              )}
            </Fragment>
          )}
        </React.Fragment>
      )}
    </Fragment>
  );
};

export default WorkflowTimeline;
