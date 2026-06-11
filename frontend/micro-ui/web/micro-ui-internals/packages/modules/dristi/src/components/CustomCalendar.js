import React, { useState, useMemo } from "react";
import PropTypes from "prop-types";
import { Calendar } from "react-date-range";
import { CalendarLeftArrow, CalendarRightArrow } from "../icons/svgIndex";
import { Button, CardHeader } from "@egovernments/digit-ui-react-components";

function CustomCalendar({ config, t, handleSelect, onCalendarConfirm, selectedCustomDate, tenantId, minDate, maxDate }) {
  const initialDate = selectedCustomDate ? new Date(selectedCustomDate) : new Date();
  const [currentMonth, setCurrentMonth] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const selectedMonth = useMemo(() => new Date(currentMonth).getMonth(), [currentMonth]);
  const selectedYear = useMemo(() => new Date(currentMonth).getFullYear(), [currentMonth]);
  const courtId = localStorage.getItem("courtId");

  const hearingCriteria = useMemo(
    () => ({
      criteria: {
        tenantId,
        fromDate: new Date(selectedYear, selectedMonth, 1).getTime(),
        toDate: new Date(selectedYear, selectedMonth + 1, 0).getTime(),
        ...(courtId && { courtId }),
      },
      tenantId,
    }),
    [selectedMonth, selectedYear, tenantId, courtId]
  );

  const { data: hearingResponse } = Digit.Hooks.hearings.useGetHearingsCounts(
    hearingCriteria,
    { applicationNumber: "", cnrNumber: "", tenantId },
    `${currentMonth.getMonth()}-${currentMonth.getFullYear()}`,
    Boolean(selectedYear && selectedMonth),
    false,
    "",
    10 * 1000
  );
  const { data: nonWorkingDay } = Digit.Hooks.useCustomMDMS(Digit.ULBService.getStateId(), "schedule-hearing", [{ name: "COURT000334" }], {
    select: (data) => {
      return data || [];
    },
  });

  const hearingDetails = useMemo(() => hearingResponse?.HearingList || null, [hearingResponse]);

  const hearingCounts = useMemo(() => {
    const counts = {};
    if (!hearingDetails) return counts;
    hearingDetails.forEach((hearing) => {
      if (hearing?.hearingDate && hearing?.noOfHearing) {
        counts[hearing.hearingDate] = hearing.noOfHearing;
      }
    });

    return counts;
  }, [hearingDetails]);

  const selectedDateHearingCount = useMemo(() => {
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(
      2,
      "0"
    )}`;
    const hearingCount = hearingCounts[dateStr] || 0;
    return hearingCount;
  }, [hearingCounts, selectedDate]);

  const renderCustomDay = (date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const formattedDate = date.toLocaleDateString("en-GB");
    const formattedForCheck = formattedDate.replaceAll("/", "-");
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
              top: "25px",
              right: 2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              zIndex: 3,
            }}
          >
            {hearingCount} {t("HEARINGS")}
          </div>
        )}
      </div>
    );
  };

  const navigatorRenderer = (currentDate, changeShownDate) => {
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
          minDate={minDate}
          maxDate={maxDate || new Date(2080, 11, 31)}
          onChange={(date) => {
            handleSelect(date);
            setSelectedDate(date);
          }}
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

CustomCalendar.propTypes = {
  config: PropTypes.shape({
    showBottomBar: PropTypes.bool,
    label: PropTypes.string,
    buttonText: PropTypes.string,
  }),
  t: PropTypes.func,
  handleSelect: PropTypes.func,
  onCalendarConfirm: PropTypes.func,
  selectedCustomDate: PropTypes.any,
  tenantId: PropTypes.string,
  minDate: PropTypes.instanceOf(Date),
  maxDate: PropTypes.instanceOf(Date),
};

export default CustomCalendar;
