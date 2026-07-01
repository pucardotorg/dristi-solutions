import React, { useState } from "react";
import { LabelFieldPair, TextInput, CardLabelError, CardLabel } from "@egovernments/digit-ui-react-components";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import { CloseBtn, Heading } from "@egovernments/digit-ui-module-dristi/src/components/ModalComponents";

const CustomDatePicker = ({ t, config, formData, onSelect, errors, onDateChange }) => {
  const [showModal, setShowModal] = useState(false);
  const [pendingDate, setPendingDate] = useState(null);
  const [showNonWorkingWarning, setShowNonWorkingWarning] = useState(false);
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const CustomCalendar = Digit.ComponentRegistryService.getComponent("CustomCalendar");

  const { data: nonWorkingDay } = Digit.Hooks.useCustomMDMS(Digit.ULBService.getStateId(), "schedule-hearing", [{ name: "COURT000334" }], {
    select: (data) => data || [],
  });

  const applyDate = (date) => {
    if (onDateChange) {
      onDateChange(date);
    } else {
      onSelect(config.key, new Date(date).setHours(0, 0, 0, 0));
    }
  };

  const handleSelect = (date) => {
    const formattedDate = date.toLocaleDateString("en-GB");
    const formattedForCheck = formattedDate.replace(/\//g, "-");
    const isNonWorkingDay = nonWorkingDay?.["schedule-hearing"]?.["COURT000334"]?.some((item) => item.date === formattedForCheck);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

    setShowModal(false);

    if (isNonWorkingDay || isWeekend) {
      setPendingDate(date);
      setShowNonWorkingWarning(true);
      return;
    }

    applyDate(date);
  };

  const handleConfirmNonWorking = () => {
    if (pendingDate) applyDate(pendingDate);
    setPendingDate(null);
    setShowNonWorkingWarning(false);
  };

  const handleCancelNonWorking = () => {
    setPendingDate(null);
    setShowNonWorkingWarning(false);
  };
  const customDateConfig = {
    showBottomBar: false,
    buttonText: "CS_COMMON_CONFIRM",
  };

  return (
    <div style={{ marginBottom: "24px" }} className="custom-date-picker">
      <LabelFieldPair
        style={{
          border: config?.disable ? "1px solid #9e9e9e" : "1px solid black",
          background: config?.disable ? "#D9D9D9" : "transparent",
          ...(config?.customStyleLabelField && config?.customStyleLabelField),
        }}
        className={config?.className}
      >
        <TextInput
          type="text"
          style={{ border: 0, margin: 0, color: config?.disable ? "#9e9e9e" : "black" }}
          value={formData?.[config?.key] ? new Date(formData?.[config?.key]).toLocaleDateString() : ""}
          placeholder={t(config.placeholder || t("mm/dd/yyy"))}
          readOnly
        />
        <button
          type="button"
          onClick={() => setShowModal(true)}
          style={{ background: "transparent", border: "none", cursor: "pointer" }}
          disabled={config?.disable}
        >
          <CalendarIcon />
        </button>
      </LabelFieldPair>
      {errors?.[config?.key] && (
        <CardLabelError style={{ width: "70%", fontSize: "12px" }}>
          {errors?.[config?.key]?.message ? t(errors?.[config?.key]?.message) : t(`required`)}
        </CardLabelError>
      )}

      {showModal && (
        <Modal
          headerBarMain={true}
          headerBarEnd={<CloseBtn onClick={() => setShowModal(false)} />}
          hideSubmit={true}
          popmoduleClassName="custom-date-selector-modal"
          popupStyles={{
            width: "fit-content",
          }}
        >
          <CustomCalendar
            config={customDateConfig}
            t={t}
            minDate={new Date()}
            handleSelect={handleSelect}
            selectedCustomDate={formData?.[config?.key]}
            tenantId={tenantId}
          />
        </Modal>
      )}
      {showNonWorkingWarning && (
        <Modal
          headerBarMain={<Heading style={{ marginLeft: "24px" }} label={t("CS_COURT_NON_WORKING_WARNING_TITLE")} />}
          headerBarEnd={<CloseBtn onClick={handleCancelNonWorking} />}
          actionSaveLabel={t("CS_COMMON_CONFIRM")}
          actionSaveOnSubmit={handleConfirmNonWorking}
          actionCancelLabel={t("CS_COMMON_CANCEL")}
          actionCancelOnSubmit={handleCancelNonWorking}
          formId="modal-action"
          style={{ backgroundColor: "#BB2C2F", border: "none" }}
          popupModuleActionBarStyles={{ margin: "10px" }}
        >
          <p style={{ fontFamily: "Roboto Condensed", fontWeight: 400, fontSize: "16px", color: "#3D3C3C", marginLeft: "24px" }}>
            {t("CS_COURT_NON_WORKING_CONFIRM_MESSAGE")}
          </p>
        </Modal>
      )}
    </div>
  );
};
const CalendarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_1959_2689)">
      <path
        d="M9 11H7V13H9V11ZM13 11H11V13H13V11ZM17 11H15V13H17V11ZM19 4H18V2H16V4H8V2H6V4H5C3.89 4 3.01 4.9 3.01 6L3 20C3 21.1 3.89 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4 19 4ZM19 20H5V9H19V20Z"
        fill="#B1B4B6"
      />
    </g>
    <defs>
      <clipPath id="clip0_1959_2689">
        <rect width="24" height="24" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

export default CustomDatePicker;
