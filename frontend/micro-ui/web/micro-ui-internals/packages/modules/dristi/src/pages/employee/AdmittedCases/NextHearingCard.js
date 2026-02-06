import { Button, Card, Loader } from "@egovernments/digit-ui-react-components";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { DRISTIService } from "../../../services";
import { HearingWorkflowState } from "@egovernments/digit-ui-module-orders/src/utils/hearingWorkflow";

function timeInMillisFromDateAndTime(date, hhmmssms) {
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const [h, m, s, ms] = hhmmssms.split(":").map(Number);
  const millis = ((h || 0) * 60 * 60 + (m || 0) * 60 + (s || 0)) * 1000 + (ms || 0);
  return startOfDate.getTime() + millis;
}

const NextHearingCard = ({ caseData, width, minWidth, cardStyle }) => {
  const filingNumber = caseData.filingNumber;
  const cnr = caseData.cnrNumber;
  const caseCourtId = useMemo(() => caseData?.case?.courtId, [caseData]);
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const history = useHistory();
  const { t } = useTranslation();
  const userInfo = Digit?.UserService?.getUser()?.info;
  const roles = useMemo(() => userInfo?.roles, [userInfo]);
  const isEmployee = useMemo(() => userInfo?.type === "EMPLOYEE", [userInfo]);

  const { data: slotTime } = Digit.Hooks.useCustomMDMS(Digit.ULBService.getStateId(), "court", [{ name: "slots" }]);

  const { data: hearingRes, isLoading: isHearingsLoading } = Digit.Hooks.hearings.useGetHearings(
    {
      criteria: {
        fromDate: timeInMillisFromDateAndTime(new Date(), "00:00:00:00"),
        filingNumber: filingNumber,
        tenantId: tenantId,
        ...(caseCourtId && { courtId: caseCourtId }),
      },
    },
    {},
    cnr + filingNumber,
    Boolean(filingNumber && caseCourtId)
  );

  const scheduledHearing = hearingRes?.HearingList?.filter(
    (hearing) =>
      ![HearingWorkflowState.COMPLETED, HearingWorkflowState?.OPTOUT, HearingWorkflowState?.ABATED, HearingWorkflowState?.ABANDONED].includes(
        hearing?.status
      )
  ).sort((hearing1, hearing2) => hearing1.startTime - hearing2.startTime)[0];

  const hiddenOutcomes = [
    "DISMISSED",
    "WITHDRAWN",
    "PARTIALLYALLOWED",
    "PARTIALLYCONVICTED",
    "TRANSFERRED",
    "ALLOWED",
    "CONVICTED",
    "ABATED",
    "SETTLED",
  ];

  const shouldShowButton = !hiddenOutcomes.includes(caseData?.case?.outcome) && !isEmployee;

  const formattedTime = () => {
    const date1 = new Date(scheduledHearing?.startTime);
    const date2 = new Date(scheduledHearing?.endTime);
    const formattedDate = `
    ${date1.toLocaleTimeString("en-in", {
      hour: "2-digit",
      minute: "2-digit",
    })}
     - 
     ${date2.toLocaleTimeString("en-in", {
       hour: "2-digit",
       minute: "2-digit",
     })}`;
    return formattedDate;
  };

  const formattedDate = `${new Date(scheduledHearing?.startTime).toLocaleDateString("en-in", {
    month: "long",
    day: "numeric",
  })}`;

  const day = new Date(scheduledHearing?.startTime).toLocaleDateString("en-in", { weekday: "short" });

  const handleButtonClick = () => {
    const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
    const userType = userInfo?.type === "CITIZEN" ? "citizen" : "employee";
    const searchParams = new URLSearchParams();
    searchParams.set("hearingId", scheduledHearing?.hearingId);
    searchParams.set("filingNumber", scheduledHearing?.filingNumber);
    if (userType === "citizen") {
      //checkkk
      history.push(`/${window.contextPath}/${userType}/hearings/inside-hearing?${searchParams.toString()}`);
    } else if (scheduledHearing?.status === "SCHEDULED") {
      DRISTIService.startHearing({ hearing: scheduledHearing }).then(() => {
        window.location.href = `/${window.contextPath}/${userType}/hearings/inside-hearing?${searchParams.toString()}`;
      });
    } else {
      window.location.href = `/${window.contextPath}/${userType}/hearings/inside-hearing?${searchParams.toString()}`;
    }
  };

  function formatTimeTo12Hour(timeString) {
    if (!timeString) return "";

    // Extract hours and minutes, ignore seconds if present
    const [hours, minutes] = timeString.split(":").slice(0, 2).map(Number);

    if (isNaN(hours) || isNaN(minutes)) return "";

    const suffix = hours >= 12 ? "pm" : "am";
    const displayHours = hours % 12 || 12;

    const formattedHours = String(displayHours).padStart(2, "0");
    const formattedMinutes = String(minutes).padStart(2, "0");

    return `${formattedHours}:${formattedMinutes} ${suffix}`;
  }

  if (isHearingsLoading) {
    return <Loader />;
  }

  if (!scheduledHearing) {
    return null;
  }

  return (
    <Card
      style={{
        ...(cardStyle
          ? cardStyle
          : {
              width: width,
              minWidth: minWidth,
              marginTop: "10px",
            }),
      }}
    >
      <div
        style={{
          fontWeight: 700,
          fontSize: "16px",
          lineHeight: "18.75px",
          color: "#231F20",
        }}
      >
        {t("NEXT_HEARING")}
      </div>
      <hr style={{ border: "1px solid #FFF6E880" }} />
      <div style={{ display: "flex", justifyContent: "start", gap: "10vw", alignItems: "center", padding: "10px" }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div className="hearingCard">
            <div className="hearingDate">
              <div className="dateText">{formattedDate.split(" ")[1]}</div>
              <div className="dateNumber">{formattedDate.split(" ")[0]}</div>
              <div className="dayText">{day}</div>
            </div>
          </div>
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: "24px",
                lineHeight: "28.13px",
                color: "#231F20",
                marginTop: "5px",
              }}
            >
              {/* {formattedTime()} */}
              {formatTimeTo12Hour(slotTime?.court?.slots[0]?.slotStartTime)}
            </div>
            <div
              style={{
                fontWeight: 400,
                fontSize: "14px",
                lineHeight: "16.41px",
                color: "#3D3C3C",
                marginTop: "5px",
              }}
            >
              {`${t(scheduledHearing?.hearingType)} Hearing`}
            </div>
          </div>
        </div>
        {shouldShowButton && (
          <Button
            variation={"outlined"}
            onButtonClick={handleButtonClick}
            isDisabled={scheduledHearing?.status !== "IN_PROGRESS"}
            label={
              scheduledHearing?.status === "SCHEDULED"
                ? t("AWAIT_START_HEARING")
                : scheduledHearing?.status === "IN_PROGRESS"
                ? t("JOIN_HEARING")
                : t("PASSED_OVER")
            }
            style={{
              ...(scheduledHearing?.status !== "IN_PROGRESS" ? { cursor: "default" } : { cursor: "pointer" }),
            }}
          />
        )}
      </div>
    </Card>
  );
};

export default NextHearingCard;
