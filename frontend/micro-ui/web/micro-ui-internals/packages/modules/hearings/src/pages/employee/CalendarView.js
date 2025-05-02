import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom/";
import PreHearingModal from "../../components/PreHearingModal";
import TasksComponent from "../../components/TaskComponentCalander";
import useGetHearings from "../../hooks/hearings/useGetHearings";
import { Button } from "@egovernments/digit-ui-react-components";
import BulkReschedule from "./BulkReschedule";

const tenantId = window?.Digit.ULBService.getCurrentTenantId();
const MonthlyCalendar = () => {
  const history = useHistory();
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
  const userInfoType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo]);
  const { data: individualData } = window?.Digit.Hooks.dristi.useGetIndividualUser(
    {
      Individual: {
        userUuid: [userInfo?.uuid],
      },
    },
    { tenantId, limit: 1000, offset: 0 },
    "Home",
    "",
    userInfo?.uuid && isUserLoggedIn,
    6 * 1000
  );
  const individualId = useMemo(() => individualData?.Individual?.[0]?.individualId, [individualData]);

  const [dateRange, setDateRange] = useState({});
  const [taskType, setTaskType] = useState({});
  const [caseType, setCaseType] = useState({});
  const [stepper, setStepper] = useState(0);
  const initial = userInfoType === "citizen" ? "timeGridDay" : "dayGridMonth";

  const search = window.location.search;
  const { fromDate, toDate, slot, slotId, initialView, count } = useMemo(() => {
    const searchParams = new URLSearchParams(search);
    const fromDate = Number(searchParams.get("from-date")) || null;
    const toDate = Number(searchParams.get("to-date")) || null;
    const slot = searchParams.get("slot") || null;
    const slotId = searchParams.get("slotId") || null;
    const initialView = searchParams.get("view") || initial;
    const count = searchParams.get("count") || 0;
    return { fromDate, toDate, slot, slotId, initialView, count };
  }, [search]);

  const reqBody = {
    criteria: {
      tenantId,
      fromDate: dateRange.start ? dateRange.start.getTime() : null,
      toDate: dateRange.end ? dateRange.end.getTime() : null,
    },
  };

  const { data: hearingResponse, refetch } = useGetHearings(
    reqBody,
    { applicationNumber: "", cnrNumber: "", tenantId },
    `${dateRange.start?.toISOString()}-${dateRange.end?.toISOString()}`,
    Boolean(dateRange.start && dateRange.end && (userInfoType === "citizen" ? individualId : true)),
    false,
    userInfoType === "citizen" && individualId,
    6 * 1000
  );

  const hearingDetails = useMemo(() => hearingResponse?.HearingList || [], [hearingResponse]);

  const mdmsEvents = Digit.Hooks.useCustomMDMS(Digit.ULBService.getStateId(), "court", [{ name: "slots" }], {
    cacheTime: 0,
    select: (data) => {
      return data?.court?.slots || [];
    },
  });
  const events = mdmsEvents?.data;

  function epochToDateTimeObject(epochTime) {
    if (!epochTime || typeof epochTime !== "number") {
      return null;
    }

    const date = new Date(epochTime);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    const dateTimeObject = {
      date: `${year}-${month}-${day}`,
      time: `${hours}:${minutes}:${seconds}`,
    };

    return dateTimeObject;
  }

  const Calendar_events = useMemo(() => {
    const calendarEvents = {};

    hearingDetails.forEach((hearing) => {
      const dateTimeObj = epochToDateTimeObject(hearing.startTime);
      if (dateTimeObj) {
        const dateString = dateTimeObj.date;
        events?.forEach((slot) => {
          // if (dateTimeObj.time >= slot.slotStartTime && dateTimeObj.time < slot.slotEndTime) {
          const eventKey = `${dateString}-${slot.slotName}`;

          if (!calendarEvents[eventKey]) {
            calendarEvents[eventKey] = {
              title: `${slot.slotName} Hearing`,
              // start: `${dateString}T${slot.slotStartTime}`,
              // end: `${dateString}T${slot.slotEndTime}`,
              // please refer to ticket #3129 for all modifications done related to changing slots to one.
              start: `${dateString}T00:00:00`,
              end: `${dateString}T23:59:59`,
              extendedProps: {
                hearings: [hearing],
                count: 1,
                date: new Date(dateString),
                slot: slot.slotName,
                slotId: slot.id,
              },
            };
          } else {
            calendarEvents[eventKey].extendedProps.count += 1;
            calendarEvents[eventKey].extendedProps.hearings.push(hearing);
          }
          // }
        });
      }
    });

    const eventsArray = Object.values(calendarEvents);
    return eventsArray;
  }, [hearingDetails, events]);

  const getEachHearingType = (hearingList) => {
    return [...new Set(hearingList.map((hearing) => hearing.hearingType))];
  };

  const hearingCount = (hearingList) => {
    const hearingTypeList = getEachHearingType(hearingList);
    return hearingTypeList.map((type) => {
      return {
        type: type,
        frequency: hearingList.filter((hearing) => hearing.hearingType === type).length,
      };
    });
  };

  const handleEventClick = (arg, ...rest) => {
    console.log(arg, ...rest);
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
    history.replace({ search: searchParams.toString() });
  };

  const closeModal = () => {
    const searchParams = new URLSearchParams(search);
    searchParams.delete("from-date");
    searchParams.delete("to-date");
    searchParams.delete("slot");
    searchParams.delete("slotId");
    searchParams.delete("view");
    searchParams.delete("count");
    history.replace({ search: searchParams.toString() });
  };

  const onSubmit = () => {
    setStepper((prev) => prev + 1);
  };

  const maxHearingCount = 5;
  return (
    <React.Fragment>
      {Digit.UserService.getType() === "employee" && (
        <div style={{ display: "flex", justifyContent: "end", paddingRight: "24px", marginTop: "5px" }}>
          <Button label={t("BULK_RESCHEDULE")} onButtonClick={onSubmit}></Button>
        </div>
      )}
      <div style={{ display: "flex" }}>
        <div style={{ width: "70%" }}>
          <div>
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView={initialView}
              headerToolbar={{
                start: "prev",
                center: "title",
                end: "next,dayGridMonth,timeGridWeek,timeGridDay",
              }}
              height={"85vh"}
              events={Calendar_events}
              eventContent={(arg) => {
                const hearings = hearingCount(arg.event.extendedProps.hearings) || [];
                return (
                  <div>
                    <div>{`${arg.event.extendedProps.slot} :`}</div>
                    <div>{`${arg.event.extendedProps.count}-${t("HEARINGS")}`}</div>

                    {hearings.length <= maxHearingCount ? (
                      hearings.map((hearingFrequency, index) => (
                        <div key={index} style={{ whiteSpace: "normal" }}>
                          {hearingFrequency.frequency} - {t(hearingFrequency.type)}
                        </div>
                      ))
                    ) : (
                      <div>
                        {hearings.slice(0, maxHearingCount).map((hearingFrequency, index) => (
                          <div key={index} style={{ whiteSpace: "normal" }}>
                            {hearingFrequency.frequency} - {t(hearingFrequency.type)}
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
        <div className="right-side">
          <TasksComponent
            taskType={taskType}
            setTaskType={setTaskType}
            caseType={caseType}
            setCaseType={setCaseType}
            isLitigant={Boolean(userInfoType === "citizen")}
            uuid={userInfo?.uuid}
            userInfoType={userInfoType}
          />
        </div>
      </div>
      <BulkReschedule stepper={stepper} setStepper={setStepper} selectedSlot={[]} />
    </React.Fragment>
  );
};

export default MonthlyCalendar;
