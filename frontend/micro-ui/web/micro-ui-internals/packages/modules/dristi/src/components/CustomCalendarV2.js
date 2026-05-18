import React, { useState, useMemo } from "react";
import PropTypes from "prop-types";
import { Calendar } from "react-date-range";
import { CalendarLeftArrow, CalendarRightArrow, InfoToolTipIcon } from "../icons/svgIndex";
import { CardHeader } from "@egovernments/digit-ui-react-components";
import Button from "./Button";

function CustomCalendarV2({ config, t, handleSelect, onCalendarConfirm, selectedCustomDate, tenantId, minDate, maxDate }) {
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

  const isHearingCalled = useMemo(() => {
    if (config?.isShowHearing === undefined || config?.isShowHearing === null) {
      return true;
    }
    return config.isShowHearing;
  }, [config?.isShowHearing]);
  const { data: hearingResponse } = Digit.Hooks.hearings.useGetHearingsCounts(
    hearingCriteria,
    { applicationNumber: "", cnrNumber: "", tenantId },
    `${currentMonth.getMonth()}-${currentMonth.getFullYear()}`,
    Boolean(selectedYear && selectedMonth && isHearingCalled),
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
        counts[hearing.hearingDate] = { noOfHearing: hearing.noOfHearing, dayStatus: hearing.dayStatus || "Slot Available" };
      }
    });

    return counts;
  }, [hearingDetails]);

  const selectedDateHearingCount = useMemo(() => {
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(
      2,
      "0"
    )}`;
    const hearingCount = hearingCounts[dateStr]?.noOfHearing || 0;
    return hearingCount;
  }, [hearingCounts, selectedDate]);

  const renderCustomDay = (date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const formattedDate = date.toLocaleDateString("en-GB");
    const formattedForCheck = formattedDate.replaceAll("/", "-");
    const isNonWorkingDay = nonWorkingDay?.["schedule-hearing"]?.["COURT000334"]?.some((item) => item.date === formattedForCheck);
    const isDateFromCurrentMonth = date.getMonth() === currentMonth.getMonth() && date.getFullYear() === currentMonth.getFullYear();
    const isPastDate = date.getDate() < new Date().getDate();
    const hearingCount = hearingCounts[dateStr]?.noOfHearing || 0;
    const dayStatus = hearingCounts[dateStr]?.dayStatus || "Slot Available";
    const isSelectedDate =
      selectedDate?.getDate() === date?.getDate() &&
      selectedDate?.getMonth() === date?.getMonth() &&
      selectedDate?.getFullYear() === date?.getFullYear();
    return (
      <React.Fragment>
        <div className="custom-day">
          <div
            className={`${isDateFromCurrentMonth ? "current-month" : ""}${isNonWorkingDay ? " non-working-day" : " working-day"}${
              isPastDate ? " past-date" : ""
            }${
              dayStatus === "Opted Out"
                ? " opted-out"
                : dayStatus === "Court Non-Working"
                ? " court-non-working"
                : dayStatus === "Slots Full"
                ? " slots-full"
                : dayStatus === "Slot Available"
                ? " slot-available"
                : ""
            }${isSelectedDate ? " selected-date" : ""}`}
          >
            <span className={`${isDateFromCurrentMonth ? "current-month" : ""}${isNonWorkingDay ? " non-working-day-text" : " working-day-text"}`}>
              {date.getDate()}
            </span>
          </div>
          {hearingCount > 0 && !isPastDate && (
            <p className="hearing-count">
              {hearingCount} {t("HEARINGS")}
            </p>
          )}
        </div>
      </React.Fragment>
    );
  };

  const navigatorRenderer = (currentDate, changeShownDate) => {
    return (
      <div className="custom-navigator">
        <span className="custom-navigator-text">{currentDate.toLocaleDateString("default", { month: "long", year: "numeric" })}</span>
        <span className="custom-navigator-buttons">
          <Button
            className="custom-calendar-left-arrow"
            type="button"
            onButtonClick={() => changeShownDate(-1, "monthOffset")}
            icon={<CalendarLeftArrow />}
            label=""
          />
          <Button
            className="custom-calendar-right-arrow"
            type="button"
            onButtonClick={() => changeShownDate(1, "monthOffset")}
            icon={<CalendarRightArrow />}
            label=""
          />
        </span>
      </div>
    );
  };

  return (
    <div className="custom-calendar-v2">
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
      {config?.showBottomBar && (
        <div className="calendar-bottom-div">
          <CardHeader>
            {selectedDateHearingCount} {t(config?.label)}
          </CardHeader>
          <Button variation="primary" onButtonClick={() => onCalendarConfirm()} label={t(config?.buttonText)}></Button>
        </div>
      )}
      <div className="calendar-legend-wrapper">
        <div className="calendar-legend">
          <div className="legend-title">
            <InfoToolTipIcon />
            <span>{t("CS_COMMON_LEGEND")}</span>
          </div>
          <div className="legend-items">
            <div className="legend-item">
              <span className="legend-color-indicator slot-available"></span>
              <span>{t("CS_COMMON_SLOT_AVAILABLE")}</span>
            </div>
            <div className="legend-item">
              <span className="legend-color-indicator court-non-working"></span>
              <span>{t("CS_COMMON_COURT_NON_WORKING")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

CustomCalendarV2.propTypes = {
  config: PropTypes.shape({
    showBottomBar: PropTypes.bool,
    label: PropTypes.string,
    buttonText: PropTypes.string,
    isShowHearing: PropTypes.bool,
  }),
  t: PropTypes.func,
  handleSelect: PropTypes.func,
  onCalendarConfirm: PropTypes.func,
  selectedCustomDate: PropTypes.any,
  tenantId: PropTypes.string,
  minDate: PropTypes.instanceOf(Date),
  maxDate: PropTypes.instanceOf(Date),
};

export default CustomCalendarV2;
