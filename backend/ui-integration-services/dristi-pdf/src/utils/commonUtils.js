const { search_hrms, search_mdms } = require("../api");
const { handleApiCall } = require("./handleApiCall");
const { renderError } = require("./renderError");

async function getCourtAndJudgeDetails(
  res,
  tenantId,
  employeeType,
  courtId,
  requestInfo,
) {
  const resHrms = await handleApiCall(
    res,
    () => search_hrms(tenantId, employeeType, courtId, requestInfo),
    "Failed to query HRMS service",
  );

  const resMdms = await handleApiCall(
    res,
    () =>
      search_mdms(courtId, "common-masters.Court_Rooms", tenantId, requestInfo),
    "Failed to query MDMS service for court room",
  );
  const mdmsCourtRoom = resMdms?.data?.mdms[0]?.data;
  if (!mdmsCourtRoom) {
    renderError(res, "Court room MDMS master not found", 404);
  }

  const employee = resHrms.data.Employees.find(({ assignments }) =>
    assignments.some(
      ({ courtEstablishment, courtroom, fromDate, toDate }) =>
        mdmsCourtRoom.establishment === courtEstablishment &&
        courtroom === courtId &&
        fromDate <= Date.now() &&
        (toDate === null || toDate > Date.now()),
    ),
  );

  if (!employee) {
    renderError(res, "Employee not found", 404);
  }

  const assignment = employee.assignments.find(
    (assignment) => assignment.courtroom === courtId,
  );

  const responseMdms = await handleApiCall(
    res,
    () =>
      search_mdms(
        assignment.designation,
        "common-masters.Designation",
        tenantId,
        requestInfo,
      ),
    "Failed to query MDMS service for Designation",
  );
  const mdmsDesignation = responseMdms?.data?.mdms[0]?.data;
  if (!mdmsCourtRoom) {
    renderError(res, "Designation MDMS master not found", 404);
  }

  return {
    mdmsCourtRoom: {
      name: "Before The " + mdmsCourtRoom.name,
      courtName: mdmsCourtRoom.name,
      place:
        assignment.district.charAt(0).toUpperCase() +
        assignment.district.slice(1).toLowerCase(),
      state: "Kerala",
      orderHeading: "Before The " + mdmsCourtRoom.name,
      nameWithIn: "In the " + mdmsCourtRoom.name,
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

function getSelectedTitles(data, messagesMap) {
  const titles = [];

  const localizeTitle = (title) => {
    const match = title?.trim().match(/^(.*?)\s+(\d+)$/);
    if (match) {
      const baseTitle = match[1];
      const number = match[2];
      const translatedBase = messagesMap[baseTitle] || baseTitle;
      return `${translatedBase} ${number}`;
    }
    return messagesMap[title] || title;
  };

  const traverse = (items, parentTitle) => {
    items?.forEach((item) => {
      if (item.children?.length) {
        traverse(item.children, item.title);
      } else if (item.title) {
        const translatedTitle = localizeTitle(item.title);

        const excludedParentTitles = ["INITIAL_FILINGS", "AFFIDAVITS_PDF", "VAKALATS", "ADDITIONAL_FILINGS", "MEDIATION", "PLEA", "S351_EXAMINATION", "OBJECTION_APPLICATION_HEADING", "NOTICE", "WARRANT","SUMMONS", "PAYMENT_RECEIPT_CASE_PDF"];
        if (parentTitle && !excludedParentTitles.includes(parentTitle)) {
          const translatedParent = localizeTitle(parentTitle);
          titles.push(`${translatedTitle} - ${translatedParent}`);
        } else {
          titles.push(translatedTitle);
        }
      }
    });
  };

  traverse(data, null);
  return titles;
}

function getPartyType(witnessType) {
  if (witnessType?.includes("PW")) {
    return "Prosecution";
  } else if (witnessType?.includes("DW")) {
    return "Defence";
  } else {
    return "Court";
  }
}

module.exports = {
  getCourtAndJudgeDetails,
  getPartyType,
  getSelectedTitles,
};
