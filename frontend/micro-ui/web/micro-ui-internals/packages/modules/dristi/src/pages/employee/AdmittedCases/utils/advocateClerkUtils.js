import React from "react";
import { Modal } from "@egovernments/digit-ui-react-components";
import { Heading, CloseBtn } from "./componentUtils";

// Helper function to get popup modal for junior advocate warning
export const getPopupForJuniorAdvocate = (t, showPopupForClerkOrAdvocate, setShowPopupForClerkOrAdvocate) => {
  return (
    <Modal
      headerBarMain={<Heading label={t("JUNIOR_ADVOCATE_WARNING_HEADER")} />}
      headerBarEnd={
        <CloseBtn
          onClick={() => {
            sessionStorage.removeItem("showPopupIfCaseAccessThroughMultipleAdvocates");
            setShowPopupForClerkOrAdvocate({ show: false, message: "" });
          }}
        />
      }
      actionSaveLabel={t("ADVOCATE_CONFIRM_OK")}
      children={<div style={{ margin: "25px 0px" }}>{showPopupForClerkOrAdvocate?.message || ""}</div>}
      actionSaveOnSubmit={() => {
        sessionStorage.removeItem("showPopupIfCaseAccessThroughMultipleAdvocates");
        setShowPopupForClerkOrAdvocate({ show: false, message: "" });
      }}
    ></Modal>
  );
};

// Helper function to check if user is a member of the case
export const getIsMemberPartOfCase = (caseDetails, isAdvocateOrClerk, userUuid, getAllAdvocatesAndClerksUuids) => {
  if (!caseDetails?.filingNumber) return null;
  if (!isAdvocateOrClerk) return true;

  const advocatesAndClerksUuids = getAllAdvocatesAndClerksUuids(caseDetails);
  if (advocatesAndClerksUuids?.includes(userUuid)) return true;

  // An advocate may have filed as their own complainant (party-in-person).
  // In that case they won't appear in representatives/clerks but will be a litigant.
  const isLitigantInCase = caseDetails?.litigants?.some((litigant) => litigant?.additionalDetails?.uuid === userUuid);
  return !!isLitigantInCase;
};
