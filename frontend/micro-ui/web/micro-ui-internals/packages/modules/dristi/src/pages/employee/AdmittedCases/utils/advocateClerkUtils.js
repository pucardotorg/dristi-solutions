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
  return !!advocatesAndClerksUuids?.includes(userUuid);
};
