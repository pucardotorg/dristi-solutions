import React, { useEffect, useState } from "react";
import { LabelFieldPair, TextInput, CloseSvg, CardLabelError, Toast } from "@egovernments/digit-ui-react-components";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";

const CustomDatePickerV2 = ({ t, config, formData, onSelect, errors, onDateChange }) => {
  const [showModal, setShowModal] = useState(false);
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const CustomCalendar = Digit.ComponentRegistryService.getComponent("CustomCalendarV2");

  const { data: nonWorkingDay } = Digit.Hooks.useCustomMDMS(Digit.ULBService.getStateId(), "schedule-hearing", [{ name: "COURT000334" }], {
    select: (data) => {
      return data || [];
    },
  });

  const [showErrorToast, setShowErrorToast] = useState(null);

  useEffect(() => {
    if (showErrorToast) {
      const timer = setTimeout(() => {
        setShowErrorToast(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showErrorToast]);

  const closeToast = () => {
    setShowErrorToast(null);
  };

  const handleSelect = (date) => {
    const formattedDate = date.toLocaleDateString("en-GB");
    const formattedForCheck = formattedDate.replace(/\//g, "-");
    const isNonWorkingDay = nonWorkingDay?.["schedule-hearing"]?.["COURT000334"]?.some((item) => item.date === formattedForCheck);
    if (isNonWorkingDay) {
      setShowErrorToast({
        error: true,
        label: t("CS_COMMON_COURT_NON_WORKING"),
      });
    }
    if (onDateChange) {
      onDateChange(date);
    } else {
      onSelect(config.key, new Date(date).setHours(0, 0, 0, 0));
    }
    setShowModal(false);
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
          placeholder={t(config.placeholder || t("mm/dd/yyyy"))}
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
          className="custom-date-selector-modal-main-v2"
          popupModuleMianClassName="custom-date-selector-modal-v2"
          popupModuleMianStyles={{ width: "640px" }}
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
      {showErrorToast && <Toast error={showErrorToast?.error} label={showErrorToast?.label} isDleteBtn={true} onClose={closeToast} />}
    </div>
  );
};

const CloseBtn = (props) => {
  return (
    <div onClick={props?.onClick} style={{ height: "100%", display: "flex", alignItems: "center", paddingRight: "20px", cursor: "pointer" }}>
      <CloseSvg />
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

export default CustomDatePickerV2;
