const { search_hrms, search_mdms } = require("../api");
const { handleApiCall } = require("./handleApiCall");
const { renderError } = require("./renderError");

async function getCourtAndJudgeDetails(
  res,
  tenantId,
  employeeType,
  courtId,
  requestInfo
) {
  const resHrms = await handleApiCall(
    res,
    () => search_hrms(tenantId, employeeType, courtId, requestInfo),
    "Failed to query HRMS service"
  );

  const employee = resHrms.data.Employees.find(({ assignments }) =>
    assignments.some(
      ({ courtroom, fromDate, toDate }) =>
        courtroom === courtId &&
        fromDate <= Date.now() &&
        (toDate === null || toDate > Date.now())
    )
  );

  if (!employee) {
    renderError(res, "Employee not found", 404);
  }

  const assignment = employee.assignments.find(
    (assignment) => assignment.courtroom === courtId
  );

  const resMdms = await handleApiCall(
    res,
    () =>
      search_mdms(courtId, "common-masters.Court_Rooms", tenantId, requestInfo),
    "Failed to query MDMS service for court room"
  );
  const mdmsCourtRoom = resMdms?.data?.mdms[0]?.data;
  if (!mdmsCourtRoom) {
    renderError(res, "Court room MDMS master not found", 404);
  }

  const responseMdms = await handleApiCall(
    res,
    () =>
      search_mdms(
        assignment.designation,
        "common-masters.Designation",
        tenantId,
        requestInfo
      ),
    "Failed to query MDMS service for Designation"
  );
  const mdmsDesignation = responseMdms?.data?.mdms[0]?.data;
  if (!mdmsCourtRoom) {
    renderError(res, "Designation MDMS master not found", 404);
  }

  return {
    mdmsCourtRoom: {
      name: "Before The " + mdmsCourtRoom.name,
      place:
        assignment.district.charAt(0).toUpperCase() +
        assignment.district.slice(1).toLowerCase(),
      state: "Kerala",
      orderHeading: "Before The " + mdmsCourtRoom.name,
    },
    judgeDetails: {
      name: employee.user.name,
      judgeSignature: "Signature",
      courtSeal: "Court Seal",
      designation: mdmsDesignation.name,
      judgeDesignation: mdmsCourtRoom.name,
    },
  };
}

module.exports = {
  getCourtAndJudgeDetails,
};
