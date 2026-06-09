//here choose primary advocate under whom the logged in clerk/junior advocate will take action.
import { Dropdown } from "@egovernments/digit-ui-react-components";

import React, { useState } from "react";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import { LabelFieldPair } from "@egovernments/digit-ui-react-components";
import { CloseBtn, Heading } from "@egovernments/digit-ui-module-dristi/src/components/ModalComponents";
function SelectAdvocateModal({ t, setShowSelectAdvocateModal, confirmAdvocate, preSelectedSeniorAdvocate = null, advocatesList = [] }) {
  const [selectedSeniorAdvocate, setSelectedSeniorAdvocate] = useState(preSelectedSeniorAdvocate);
  const handleDropdownChange = (e) => {
    setSelectedSeniorAdvocate(e);
  };
  return (
    <div className="select-senior-advocate-modal">
      <Modal
        headerBarEnd={
          <CloseBtn
            onClick={() => {
              setShowSelectAdvocateModal(false);
            }}
          />
        }
        actionSaveLabel={t("YES_PROCEED")}
        actionSaveOnSubmit={() => confirmAdvocate(preSelectedSeniorAdvocate || selectedSeniorAdvocate)}
        actionCancelLabel={t("GO_BACK")}
        actionCancelOnSubmit={() => setShowSelectAdvocateModal(false)}
        formId="modal-action"
        headerBarMain={<Heading style={{ marginLeft: "24px" }} label={t("FILE_A_CASE_ADVOCATE_CONFIRM_HEADER")} />}
        submitTextClassName="select-senior-advocate-dropdown-submit"
        cancelTextClassName="select-senior-advocate-dropdown-cancel"
        popUpStyleMain={{ zIndex: "1000" }}
      >
        <div className="" style={{ margin: "20px 0px 40px" }}>
          {preSelectedSeniorAdvocate ? (
            <div>
              <span> {t("DO_YOU_WANT_TO_FILE_ON_BEHALF_OF")} </span>
              <span style={{ fontWeight: "bold" }}> {`Advocate ${t(preSelectedSeniorAdvocate?.advocateName || "")}`}</span>
            </div>
          ) : advocatesList?.length > 0 ? (
            <div className="select-advocate-drodown" style={{ marginBottom: "40px" }}>
              <LabelFieldPair>
                <span> {t("Select Advocate")} </span>
                <Dropdown
                  t={t}
                  option={advocatesList}
                  optionKey={"advocateName"}
                  select={handleDropdownChange}
                  selected={selectedSeniorAdvocate}
                  placeholder={t("SELECT_ADVOCATE")}
                />
              </LabelFieldPair>
            </div>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}

export default SelectAdvocateModal;
