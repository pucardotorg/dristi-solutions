/**
 * Shared UI + pure helpers for ScheduleHearing (home) and ScheduleHearingModal (dristi admission).
 * Behaviour matches the former duplicated inline implementations (extract-only refactor).
 */

import React, { useEffect, useState } from "react";
import { formatDateInMonth } from "../../../Utils";

export const SCHEDULE_HEARING_CUSTOM_DATE_CONFIG = {
  headModal: "CS_SELECT_CUSTOM_DATE",
  label: "CS_HEARINGS_SCHEDULED",
  showBottomBar: true,
  buttonText: "CS_COMMON_CONFIRM",
};

export const ScheduleHearingCloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#clip0_4124_3214)">
      <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="#0A0A0A" />
    </g>
    <defs>
      <clipPath id="clip0_4124_3214">
        <rect width="24" height="24" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

export const ScheduleHearingCloseBtn = (props) => (
  <div style={{ padding: "10px", cursor: "pointer" }} onClick={props.onClick}>
    <ScheduleHearingCloseIcon />
  </div>
);

export function scheduleHearingDateToEpoch(date) {
  return Math.floor(new Date(date).getTime());
}

export function convertScheduleHearingAvailableDates(availableDates) {
  return availableDates.map((dateInfo) => ({
    ...dateInfo,
    date: new Date(dateInfo.date / 1),
  }));
}

export function getNextNFormattedHearingDates(n, availableDatesWithDateObjects) {
  const datesArray = [];
  for (let i = 0; i < n; i++) {
    if (i < availableDatesWithDateObjects?.length) {
      const dateObject = availableDatesWithDateObjects[i].date;
      datesArray.push(formatDateInMonth(dateObject));
    } else {
      break;
    }
  }
  return datesArray;
}

/** Syncs formatted date labels from judge-availability API (next 5 slots). */
export function useSyncNextFiveHearingDates(availableDateResponse) {
  const [nextFiveDates, setNextFiveDates] = useState([]);
  useEffect(() => {
    if (availableDateResponse?.AvailableDates) {
      const availableDatesWithDateObjects = convertScheduleHearingAvailableDates(availableDateResponse.AvailableDates);
      setNextFiveDates(getNextNFormattedHearingDates(5, availableDatesWithDateObjects));
    }
  }, [availableDateResponse]);
  return [nextFiveDates, setNextFiveDates];
}

export function getSuggestedDatesFromRescheduleResponse(dateResponse) {
  if (dateResponse?.Hearings?.[0]?.suggestedDates) {
    return dateResponse.Hearings[0].suggestedDates;
  }
  return [];
}

export function extractSchedulerOptOutLimitUnit(OptOutLimit) {
  const configArray = OptOutLimit?.["SCHEDULER-CONFIG"]?.config;
  if (Array.isArray(configArray)) {
    const configItem = configArray.find((item) => item.identifier === "OPT_OUT_SELECTION_LIMIT");
    return configItem ? configItem.unit : null;
  }
  return null;
}

/**
 * Factory: same chip / single-date toggle logic as both schedule components.
 * Pass current `selectedChip` (OPTOUT: array; else: string | null).
 */
export function createScheduleHearingDateClickHandler({
  status,
  selectedChip,
  setSelectedChip,
  setScheduleHearingParam,
  scheduleHearingParams,
  OptOutLimitValue,
}) {
  return (label) => {
    if (status === "OPTOUT") {
      const newSelectedChip = selectedChip.includes(label) ? null : label;
      setSelectedChip((prevSelectedChip) => {
        if (newSelectedChip === null) {
          return prevSelectedChip.filter((chip) => chip !== label);
        }
        if (prevSelectedChip.length >= OptOutLimitValue) {
          return prevSelectedChip;
        }
        return [...prevSelectedChip, newSelectedChip];
      });
    } else {
      const newSelectedChip = selectedChip === label ? null : label;
      setSelectedChip(newSelectedChip);
      setScheduleHearingParam({
        ...scheduleHearingParams,
        date: newSelectedChip,
      });
    }
  };
}

/** Draft order body for "schedule hearing date" (non–opt-out path). */
export function buildScheduleHearingDraftOrderRequest(data, { tenantId, cnrNumber, filingNumber, OrderWorkflowAction }) {
  const dateArr = data.date.split(" ").map((date, i) => (i === 0 ? date.slice(0, date.length - 2) : date));
  const date = new Date(dateArr.join(" "));
  return {
    order: {
      createdDate: null,
      tenantId,
      cnrNumber,
      filingNumber: filingNumber,
      statuteSection: {
        tenantId,
      },
      orderTitle: "SCHEDULE_OF_HEARING_DATE",
      orderCategory: "INTERMEDIATE",
      orderType: "SCHEDULE_OF_HEARING_DATE",
      status: "",
      isActive: true,
      workflow: {
        action: OrderWorkflowAction.SAVE_DRAFT,
        comments: "Creating order",
        assignes: null,
        rating: null,
        documents: [{}],
      },
      documents: [],
      additionalDetails: {
        formdata: {
          hearingDate: `${dateArr[2]}-${date.getMonth() < 9 ? `0${date.getMonth() + 1}` : date.getMonth() + 1}-${
            dateArr[0] < 9 ? `0${dateArr[0]}` : dateArr[0]
          }`,
          hearingPurpose: data.purpose,
          orderType: {
            code: "SCHEDULE_OF_HEARING_DATE",
            type: "SCHEDULE_OF_HEARING_DATE",
            name: "ORDER_TYPE_SCHEDULE_OF_HEARING_DATE",
          },
        },
      },
    },
  };
}
