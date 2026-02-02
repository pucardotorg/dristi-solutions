//here choose primary advocate under whom the logged in clerk/junior advocate will take action.
import { CloseSvg, CheckBox, Dropdown } from "@egovernments/digit-ui-react-components";

import React, { useMemo, useState } from "react";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";

const Heading = (props) => {
  return (
    <h1 className="heading-m" style={{ marginLeft: "47px" }}>
      {props.label}
    </h1>
  );
};

const CloseBtn = (props) => {
  return (
    <div onClick={props?.onClick} style={{ height: "100%", display: "flex", alignItems: "center", paddingRight: "20px", cursor: "pointer" }}>
      <CloseSvg />
    </div>
  );
};

function SelectAdvocateModal({ t, setShowSelectAdvocateModal, confirmAdvocate, selectedSeniorAdvocate }) {
  console.log("selectedSeniorAdvocate11", selectedSeniorAdvocate, selectedSeniorAdvocate?.advocateName);
  return (
    <Modal
      headerBarEnd={
        <CloseBtn
          onClick={() => {
            setShowSelectAdvocateModal(false);
          }}
        />
      }
      actionSaveLabel={t("YES_PROCEED")}
      actionSaveOnSubmit={() => confirmAdvocate(selectedSeniorAdvocate)}
      actionCancelLabel={t("GO_BACK")}
      actionCancelOnSubmit={() => setShowSelectAdvocateModal(false)}
      formId="modal-action"
      headerBarMain={<Heading label={t("FILE_A_CASE_ADVOCATE_CONFIRM_HEADER")} />}
      //   popmoduleClassName={}
      style={{ width: "50%", height: "40px" }}
      // textStyle={{ margin: "0px", color: "" }}
      // popupStyles={{ maxWidth: "60%" }}
      popUpStyleMain={{ zIndex: "1000" }}
      actionCancelStyle={{ width: "50%", height: "40px" }}
    >
      <div className="" style={{ margin: "40px 0px" }}>
        <span> Do you want to file a case on behalf of </span>

        <span style={{ fontWeight: "bold" }}> {`Advocate ${t(selectedSeniorAdvocate?.advocateName || "")}`}</span>
      </div>
    </Modal>
  );
}

export default SelectAdvocateModal;
