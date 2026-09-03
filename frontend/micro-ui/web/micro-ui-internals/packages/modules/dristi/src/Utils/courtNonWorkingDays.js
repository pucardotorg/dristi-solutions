// Court non-working days are maintained in the MDMS "schedule-hearing" master as
// dd-MM-yyyy strings. Weekends are not part of that master, so they are derived here.
export const COURT_NON_WORKING_DAYS_MASTER = "schedule-hearing";
export const COURT_NON_WORKING_DAYS_COURT_ID = "COURT000334";

const toMdmsDateString = (date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}-${month}-${date.getFullYear()}`;
};

export const isWeekend = (date) => {
  const day = new Date(date).getDay();
  return day === 0 || day === 6;
};

// nonWorkingDayMdms is the response of useCustomMDMS(stateId, "schedule-hearing", [{ name: courtId }]).
export const isCourtNonWorkingDay = (date, nonWorkingDayMdms) => {
  if (!date) return false;
  const selectedDate = new Date(date);
  if (isWeekend(selectedDate)) return true;
  const dateString = toMdmsDateString(selectedDate);
  return Boolean(
    nonWorkingDayMdms?.[COURT_NON_WORKING_DAYS_MASTER]?.[COURT_NON_WORKING_DAYS_COURT_ID]?.some((item) => item?.date === dateString)
  );
};
