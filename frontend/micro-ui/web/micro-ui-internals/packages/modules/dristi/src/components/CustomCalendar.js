import React, { useState, useEffect, useMemo } from "react";
import { Calendar } from "react-date-range";
import { CalendarLeftArrow, CalendarRightArrow } from "../icons/svgIndex";
import { Button, CardHeader } from "@egovernments/digit-ui-react-components";

function CustomCalendar({ config, t, handleSelect, onCalendarConfirm, selectedCustomDate, tenantId, minDate, maxDate }) {
  const [currentMonth, setCurrentMonth] = useState(new Date()); // State to track the current month
  const [selectedDate, setSelectedDate] = useState(new Date()); // State to track the current month
  const { data: hearingResponse, refetch: refetch } = Digit.Hooks.hearings.useGetHearings(
    { criteria: { tenantId }, tenantId },
    { applicationNumber: "", cnrNumber: "", tenantId },
    "dristi",
    true
  );
  const { data: nonWorkingDay } = Digit.Hooks.useCustomMDMS(Digit.ULBService.getStateId(), "schedule-hearing", [{ name: "COURT000334" }], {
    select: (data) => {
      return data || [];
    },
  });

  const hearingDetails = useMemo(() => hearingResponse?.HearingList || null, [hearingResponse]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        await refetch(); // Call your refetch function from useGetHearings hook
      } catch (error) {
        console.error("Error refetching data:", error);
      }
    };

    fetchData();
  }, [currentMonth, refetch]);

  const hearingCounts = useMemo(() => {
    const counts = {};
    if (!hearingDetails) return counts;
    const filteredHearings = hearingDetails.filter((hearing) => {
      const hearingDate = new Date(hearing.startTime);
      return hearingDate.getMonth() === currentMonth.getMonth() && hearingDate.getFullYear() === currentMonth.getFullYear();
    });

    filteredHearings.forEach((hearing) => {
      const date = new Date(hearing.startTime).toLocaleDateString("en-CA");
      counts[date] = counts[date] ? counts[date] + 1 : 1;
    });

    return counts;
  }, [currentMonth, hearingDetails]);

  const monthlyCount = useMemo(() => {
    return Object.values(hearingCounts).reduce((sum, value) => sum + value, 0);
  }, [hearingCounts]);

  const selectedDateHearingCount = useMemo(() => {
    const dateStr = selectedDate.toLocaleDateString("en-CA");
    const hearingCount = hearingCounts[dateStr] || 0;
    return hearingCount;
  }, [hearingCounts, selectedDate]);

  const renderCustomDay = (date) => {
    const dateStr = date.toLocaleDateString("en-CA");
    const formattedDate = date.toLocaleDateString("en-GB");
    const formattedForCheck = formattedDate.replace(/\//g, "-");
    const isNonWorkingDay = nonWorkingDay?.["schedule-hearing"]?.["COURT000334"]?.some((item) => item.date === formattedForCheck);
    const hearingCount = hearingCounts[dateStr] || 0;
    return (
      <div
        style={{
          backgroundColor: isNonWorkingDay ? "#ffcccc" : "transparent",
          borderRadius: "50%",
          height: "40px",
          width: "40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <span>{date.getDate()}</span>
        {hearingCount > 0 && (
          <div
            style={{
              fontSize: "8px",
              color: "#931847",
              position: "absolute",
              top: 18,
              right: 2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {hearingCount} {t("HEARINGS")}
          </div>
        )}
      </div>
    );
  };

  const navigatorRenderer = (currentDate, changeShownDate, props) => {
    return (
      <div className="custom-navigator">
        <span>{currentDate.toLocaleDateString("default", { month: "long", year: "numeric" })}</span>
        <span>
          <button type="button" onClick={() => changeShownDate(-1, "monthOffset")}>
            <CalendarLeftArrow />{" "}
          </button>
          <button type="button" onClick={() => changeShownDate(1, "monthOffset")}>
            <CalendarRightArrow />
          </button>
        </span>
      </div>
    );
  };

  return (
    <div>
      <div>
        <Calendar
          date={selectedCustomDate}
          minDate={minDate && minDate}
          maxDate={maxDate ? maxDate : new Date(2080, 11, 31)}
          onChange={(date) => {
            handleSelect(date);
            setSelectedDate(date);
          }}
          // minDate={minDate}
          dayContentRenderer={renderCustomDay}
          navigatorRenderer={navigatorRenderer}
          onShownDateChange={(date) => {
            setCurrentMonth(date);
          }}
        />
      </div>
      {config?.showBottomBar && (
        <div className="calendar-bottom-div">
          <CardHeader>
            {selectedDateHearingCount} {t(config?.label)}
          </CardHeader>
          <Button variation="primary" onButtonClick={() => onCalendarConfirm()} label={t(config?.buttonText)}></Button>
        </div>
      )}
    </div>
  );
}

export default CustomCalendar;
