import { Button, CardLabel, SubmitBar } from "@egovernments/digit-ui-react-components";
import CustomToast from "@egovernments/digit-ui-module-dristi/src/components/CustomToast";
import React, { useState } from "react";
import DependentCheckBoxComponent from "../../../components/DependentCheckBoxComponent";

function SelectParticipant({
  config,
  setShowModal,
  modalInfo,
  setModalInfo,
  scheduleHearingParams,
  setScheduleHearingParam,
  selectedValues,
  setSelectedValues,
  handleInputChange,
  handleScheduleCase,
  t,
}) {
  const [showToast, setShowToast] = useState(null);

  const onSubmitSchedule = (props) => {
    const isInvalid =
      Object.keys(selectedValues).length === 0 ||
      !Object.values(selectedValues).every((value) => (value ? Object.values(value).some((innerVal) => innerVal) : false));
    if (isInvalid) {
      setShowToast({ label: t("ES_COMMON_PLEASE_ENTER_ALL_MANDATORY_FIELDS"), error: true, errorId: null });
    } else {
      handleScheduleCase({ ...scheduleHearingParams, participant: selectedValues });
    }
  };

  return (
    <div className="select-participants-main-div">
      <CardLabel className={"choose-participants-heading"}>{t(config?.header)}</CardLabel>
      {config?.checkBoxText && (
        <span className="participants-present">
          <h2>{t(config?.checkBoxText)}</h2>
          <span>{scheduleHearingParams?.date} ? </span>
        </span>
      )}
      <DependentCheckBoxComponent t={t} options={config} onInputChange={handleInputChange} selectedValues={selectedValues} />
      <div className="select-participants-submit-bar">
        <Button
          variation="secondary"
          onButtonClick={() => setModalInfo({ ...modalInfo, page: 0 })}
          className="primary-label-btn select-back-button"
          label={"Back"}
        ></Button>

        <SubmitBar
          variation="primary"
          onSubmit={(props) => {
            onSubmitSchedule(props);
          }}
          className="primary-label-btn select-schedule-button"
          label={"Schedule"}
        ></SubmitBar>
      </div>
      {showToast && (
        <CustomToast
          error={showToast?.error}
          label={showToast?.label}
          errorId={showToast?.errorId}
          onClose={() => setShowToast(null)}
          duration={showToast?.errorId ? 7000 : 5000}
        />
      )}
    </div>
  );
}

export default SelectParticipant;
