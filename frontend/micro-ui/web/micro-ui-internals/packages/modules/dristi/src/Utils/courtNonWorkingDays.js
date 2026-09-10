// Court non-working days - weekends and holidays alike - are all maintained in the MDMS
// "schedule-hearing" master as dd-MM-yyyy strings, so that master is the only thing consulted here.
export const COURT_NON_WORKING_DAYS_MASTER = "schedule-hearing";
export const COURT_NON_WORKING_DAYS_COURT_ID = "COURT000334";

const toMdmsDateString = (date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}-${month}-${date.getFullYear()}`;
};

// nonWorkingDayMdms is the response of useCustomMDMS(stateId, "schedule-hearing", [{ name: courtId }]).
export const isCourtNonWorkingDay = (date, nonWorkingDayMdms) => {
  if (!date) return false;
  const dateString = toMdmsDateString(new Date(date));
  return Boolean(
    nonWorkingDayMdms?.[COURT_NON_WORKING_DAYS_MASTER]?.[COURT_NON_WORKING_DAYS_COURT_ID]?.some((item) => item?.date === dateString)
  );
};

// Walks forward from the given date to the first working day, returning the date itself when it
// already is one. The cap only guards against a pathological MDMS master that marks a whole year
// non-working; without it a bad master would spin forever.
export const getNextWorkingDay = (date, nonWorkingDayMdms, maxDaysToScan = 365) => {
  if (!date) return date;
  const nextWorkingDay = new Date(date);
  let daysScanned = 0;
  while (isCourtNonWorkingDay(nextWorkingDay, nonWorkingDayMdms) && daysScanned < maxDaysToScan) {
    nextWorkingDay.setDate(nextWorkingDay.getDate() + 1);
    daysScanned += 1;
  }
  return nextWorkingDay;
};
