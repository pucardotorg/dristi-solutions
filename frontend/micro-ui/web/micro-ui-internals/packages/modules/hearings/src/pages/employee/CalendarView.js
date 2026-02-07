import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom/";
import PreHearingModal from "../../components/PreHearingModal";
import TasksComponent from "../../components/TaskComponentCalander";
import { Button, Loader } from "@egovernments/digit-ui-react-components";
import BulkReschedule from "./BulkReschedule";
import { useLocation } from "react-router-dom";
import { getAuthorizedUuid } from "@egovernments/digit-ui-module-dristi/src/Utils";

const tenantId = window?.Digit.ULBService.getCurrentTenantId();
const MonthlyCalendar = ({ hideRight }) => {
  const history = useHistory();
  const location = useLocation();
  const { t } = useTranslation();
  const calendarRef = useRef(null);
  const getCurrentViewType = () => {
    const calendarApi = calendarRef.current.getApi();
    const currentViewType = calendarApi.view.type;
    return currentViewType;
  };
  const { data: courtData } = Digit.Hooks.useCustomMDMS(Digit.ULBService.getStateId(), "common-masters", [{ name: "Court_Rooms" }], {
    cacheTime: 0,
  });
  const token = window.localStorage.getItem("token");
  const isUserLoggedIn = Boolean(token);
  const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
  const userUuid = userInfo?.uuid;
  const authorizedUuid = getAuthorizedUuid(userUuid);
  const userInfoType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo]);
  const { data: individualData } = window?.Digit.Hooks.dristi.useGetIndividualUser(
    {
      Individual: {
        userUuid: [authorizedUuid],
      },
    },
    { tenantId, limit: 1000, offset: 0 },
    "Home",
    "",
    authorizedUuid && isUserLoggedIn,
    6 * 1000
  );
  const individualId = useMemo(() => individualData?.Individual?.[0]?.individualId, [individualData]);

  const [dateRange, setDateRange] = useState({});
  const [taskType, setTaskType] = useState({});
  const [caseType, setCaseType] = useState({});
  const [stepper, setStepper] = useState(0);
  const initial = "dayGridMonth";
  const courtId = localStorage.getItem("courtId");

  const search = window.location.search;
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [slot, setSlot] = useState(null);
  const [slotId, setSlotId] = useState(null);
  const [initialView, setInitialView] = useState(initial);
  const [count, setCount] = useState(0);
  const roles = useMemo(() => userInfo?.roles, [userInfo]);
  const assignedRoles = useMemo(() => roles?.map((role) => role?.code), [roles]);
  const hasBulkRescheduleAccess = useMemo(
    () =>
      ["BULK_RESCHEDULE_UPDATE_ACCESS", "NOTIFICATION_CREATOR", "NOTIFICATION_APPROVER", "DIARY_EDITOR"].every((role) =>
        assignedRoles?.includes(role)
      ),
    [assignedRoles]
  );

  useEffect(() => {
    const searchParams = new URLSearchParams(search);
    setFromDate(Number(searchParams.get("from-date")) || null);
    setToDate(Number(searchParams.get("to-date")) || null);
    setSlot(searchParams.get("slot") || null);
    setSlotId(searchParams.get("slotId") || null);
    setInitialView(searchParams.get("view") || initial);
    setCount(Number(searchParams.get("count")) || 0);
  }, [search, initial]);

  const reqBody = {
    criteria: {
      tenantId,
      fromDate: dateRange.start ? dateRange.start.getTime() : null,
      toDate: dateRange.end ? dateRange.end.getTime() : null,
      attendeeIndividualId: individualId,
      ...(courtId && { courtId }),
    },
  };

  const { data: hearingResponse } = Digit.Hooks.hearings.useGetHearingsCounts(
    reqBody,
    { applicationNumber: "", cnrNumber: "", tenantId },
    `${dateRange.start?.toISOString()}-${dateRange.end?.toISOString()}`,
    Boolean(dateRange.start && dateRange.end && (userInfoType === "citizen" ? individualId : true)),
    false,
    userInfoType === "citizen" && individualId,
    10 * 1000
  );

  const hearingCountsResponse = useMemo(() => hearingResponse?.HearingList || [], [hearingResponse]);

  const mdmsEvents = Digit.Hooks.useCustomMDMS(Digit.ULBService.getStateId(), "court", [{ name: "slots" }], {
    cacheTime: 0,
    select: (data) => {
      return data?.court?.slots || [];
    },
  });
  const events = useMemo(() => mdmsEvents?.data, [mdmsEvents]); //mdmsEvents?.data;

  const getSlot = useCallback(
    (hearingTime) => {
      return events?.find((slot) => hearingTime >= slot.slotStartTime && hearingTime <= slot.slotEndTime) || events?.[0];
    },
    [events]
  );
  const Calendar_events = useMemo(() => {
    const calendarEvents = {};
    hearingCountsResponse?.forEach((hearing) => {
      const dateStr = hearing.hearingDate;
      hearing.hearingList.forEach((hearingType) => {
        const slotDetails = getSlot(hearingType?.hearingStartTime);
        const eventKey = `${dateStr}-${slotDetails?.slotName}`;
        const hearingTypeKey = `${hearingType?.hearingType}`;

        if (!calendarEvents[eventKey]) {
          calendarEvents[eventKey] = {
            title: `${slotDetails?.slotName} Hearing`,
            start: `${dateStr}T00:00:00`,
            end: `${dateStr}T23:59:59`,

            extendedProps: {
              count: 1,
              date: new Date(dateStr),
              slot: slotDetails?.slotName,
              slotId: slotDetails?.id,
              hearings: [hearingType],
              hearingTypeCounts: {},
              totalCount: 1,
            },
          };
        } else {
          calendarEvents[eventKey].extendedProps.count += 1;
          calendarEvents[eventKey].extendedProps.hearings.push(hearingType);
          calendarEvents[eventKey].extendedProps.totalCount += 1;
        }

        let prophearingTypeCounts = calendarEvents[eventKey].extendedProps.hearingTypeCounts || {};
        prophearingTypeCounts[hearingTypeKey] = (prophearingTypeCounts?.hearingType || 0) + 1;
        calendarEvents[eventKey].extendedProps.hearingTypeCounts = prophearingTypeCounts;
      });
    });

    const eventsArray = Object.values(calendarEvents);
    return eventsArray;
  }, [getSlot, hearingCountsResponse]);

  const handleEventClick = (arg, ...rest) => {
    const fromDate = arg.event.start;
    const count = arg.event.extendedProps.count;
    const toDate = arg.event.end;
    const searchParams = new URLSearchParams(search);
    searchParams.set("from-date", fromDate.getTime());
    searchParams.set("to-date", toDate.getTime());
    searchParams.set("slot", arg.event.extendedProps.slot);
    searchParams.set("slotId", arg.event.extendedProps.slotId);
    searchParams.set("view", getCurrentViewType());
    searchParams.set("count", count);
    setFromDate(fromDate.getTime());
    setToDate(toDate.getTime());
    setSlot(arg.event.extendedProps.slot);
    setSlotId(arg.event.extendedProps.slotId);
    setInitialView(getCurrentViewType());
    const updatedState = location?.state?.fromHome ? { ...location.state, fromHome: true } : location?.state;

    setCount(count);
    if (!hideRight) {
      history.replace({
        search: searchParams.toString(),
        state: updatedState,
      });
    }
  };

  const closeModal = () => {
    if (!hideRight) {
      const searchParams = new URLSearchParams(search);
      searchParams.delete("from-date");
      searchParams.delete("to-date");
      searchParams.delete("slot");
      searchParams.delete("slotId");
      searchParams.delete("view");
      searchParams.delete("count");

      const updatedState = location?.state?.fromHome ? { ...location.state, fromHome: true } : location?.state;

      history.replace({
        search: searchParams.toString(),
        state: updatedState,
      });
    } else {
      setFromDate(null);
      setToDate(null);
      setSlot(null);
      setSlotId(null);
      setInitialView(initial);
      setCount(0);
    }
  };

  const onSubmit = () => {
    history.push(`/${window?.contextPath}/employee/home/home-screen`, { homeActiveTab: "CS_HOME_BULK_RESCHEDULE" });
  };

  const maxHearingCount = 5;

  // if (isLoading) {
  //   return <Loader />;
  // }
  return (
    <React.Fragment>
      {Digit.UserService.getType() === "employee" && !hideRight && hasBulkRescheduleAccess && (
        <div style={{ display: "flex", justifyContent: "end", paddingRight: "24px", marginTop: "5px" }}>
          <Button label={t("BULK_RESCHEDULE")} onButtonClick={onSubmit}></Button>
        </div>
      )}
      <div style={{ display: "flex" }}>
        <div style={{ width: hideRight ? "100%" : "70%" }}>
          <div>
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView={initialView}
              headerToolbar={{
                start: "prev",
                center: "title",
                end: "next,dayGridMonth,timeGridWeek,timeGridDay",
              }}
              height={hideRight ? "75vh" : "85vh"}
              events={Calendar_events}
              eventContent={(arg) => {
                return (
                  <div>
                    <div>{`${arg.event.extendedProps.slot} :`}</div>
                    <div>{`${arg.event.extendedProps.count}-${t("HEARINGS")}`}</div>

                    {Object.keys(arg.event.extendedProps.hearingTypeCounts).length <= maxHearingCount ? (
                      Object.keys(arg.event.extendedProps.hearingTypeCounts).map((hearingType, index) => (
                        <div key={index} style={{ whiteSpace: "normal" }}>
                          {arg.event.extendedProps.hearingTypeCounts[hearingType]} - {t(hearingType)}
                        </div>
                      ))
                    ) : (
                      <div>
                        {Object.keys(arg.event.extendedProps.hearingTypeCounts)
                          .slice(0, maxHearingCount)
                          .map((hearingType, index) => (
                            <div key={index} style={{ whiteSpace: "normal" }}>
                              {arg.event.extendedProps.hearingTypeCounts[hearingType]} - {t(hearingType)}
                            </div>
                          ))}
                        <div style={{ color: "green" }}>{`${t("CALENDER_MORE")}`}</div>
                      </div>
                    )}
                  </div>
                );
              }}
              eventClick={handleEventClick}
              datesSet={(dateInfo) => {
                setDateRange({ start: dateInfo.start, end: dateInfo.end });
              }}
              ref={calendarRef}
            />
            {fromDate && toDate && slot && (
              <PreHearingModal
                courtData={courtData?.["common-masters"]?.Court_Rooms}
                onCancel={closeModal}
                hearingData={{ fromDate, toDate, slot, slotId, count }}
                individualId={individualId}
                userType={userInfoType}
                events={events}
              />
            )}
          </div>
        </div>
        {hideRight ? null : (
          <div className="right-side">
            <TasksComponent
              taskType={taskType}
              setTaskType={setTaskType}
              caseType={caseType}
              setCaseType={setCaseType}
              isLitigant={Boolean(userInfoType === "citizen")}
              userInfoType={userInfoType}
            />
          </div>
        )}
      </div>
      <BulkReschedule stepper={stepper} setStepper={setStepper} selectedSlot={[]} />
    </React.Fragment>
  );
};

export default MonthlyCalendar;
