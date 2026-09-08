import React, { useEffect, useState } from "react";
import { LabelFieldPair, TextInput, CardLabelError } from "@egovernments/digit-ui-react-components";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import { CloseBtn } from "@egovernments/digit-ui-module-dristi/src/components/ModalComponents";
import NonWorkingDayWarningModal from "@egovernments/digit-ui-module-dristi/src/components/NonWorkingDayWarningModal";
import {
  COURT_NON_WORKING_DAYS_COURT_ID,
  COURT_NON_WORKING_DAYS_MASTER,
  isCourtNonWorkingDay,
} from "@egovernments/digit-ui-module-dristi/src/Utils/courtNonWorkingDays";

const CustomDatePickerV2 = ({
  t,
  config,
  formData,
  onSelect,
  errors,
  onDateChange,
  disable = false,
  disableColor = "#9e9e9e",
  disableBorderColor = "#9e9e9e",
  disableBackgroundColor = "#D9D9D9",
  styles = { marginBottom: "24px" },
  isShowHearing = true,
  // Court-side flows must confirm before scheduling on a court non-working day.
  // Citizen flows only propose dates for the court to consider, so they pick freely (dristi#5854).
  warnOnNonWorkingDay = true,
}) => {
  const [showModal, setShowModal] = useState(false);
  // Date awaiting confirmation because it falls on a court non-working day.
  const [pendingNonWorkingDate, setPendingNonWorkingDate] = useState(null);
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const CustomCalendar = Digit.ComponentRegistryService.getComponent("CustomCalendarV2");

  const { data: nonWorkingDay } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    COURT_NON_WORKING_DAYS_MASTER,
    [{ name: COURT_NON_WORKING_DAYS_COURT_ID }],
    {
      select: (data) => {
        return data || [];
      },
    }
  );

  // Add event listener to handle clicks outside the modal
  useEffect(() => {
    // Function to handle clicks on the popup-wrap element (modal backdrop)
    const handleBackdropClick = (event) => {
      // Check if the click is directly on the popup-wrap element (the overlay)
      // and not on any of its children
      if (
        event.target.className &&
        typeof event.target.className === "string" &&
        event.target.className.includes("popup-wrap") &&
        event.target === event.currentTarget
      ) {
        setShowModal(false);
      }
    };

    // Add event listener when modal is shown
    if (showModal) {
      // Find the popup-wrap element after a short delay to ensure it's in the DOM
      setTimeout(() => {
        const popupWrapElement = document.querySelector(".popup-wrap");
        if (popupWrapElement) {
          popupWrapElement.addEventListener("click", handleBackdropClick);
        }
      }, 100);
    }

    // Clean up function
    return () => {
      const popupWrapElement = document.querySelector(".popup-wrap");
      if (popupWrapElement) {
        popupWrapElement.removeEventListener("click", handleBackdropClick);
      }
    };
  }, [showModal]);

  const commitDate = (date) => {
    if (onDateChange) {
      onDateChange(date);
    } else {
      onSelect(config.key, new Date(date).setHours(0, 0, 0, 0));
    }
    setPendingNonWorkingDate(null);
    setShowModal(false);
  };

  // A non-working day is only a soft block: warn and let the court confirm.
  const handleSelect = (date) => {
    if (warnOnNonWorkingDay && isCourtNonWorkingDay(date, nonWorkingDay)) {
      setPendingNonWorkingDate(date);
      return;
    }
    commitDate(date);
  };
  const customDateConfig = {
    showBottomBar: false,
    buttonText: "CS_COMMON_CONFIRM",
    isShowHearing: isShowHearing,
  };

  return (
    <div style={styles} className="custom-date-picker">
      <LabelFieldPair
        style={{
          border: config?.disable || disable ? `1px solid ${disableBorderColor}` : "1px solid black",
          background: config?.disable || disable ? disableBackgroundColor : "transparent",
          ...(config?.customStyleLabelField && config?.customStyleLabelField),
        }}
        className={config?.className}
      >
        <TextInput
          type="text"
          style={{ border: 0, margin: 0, color: config?.disable || disable ? disableColor : "black" }}
          // Locale is pinned so this reads as the DD/MM/YYYY every caller's placeholder promises,
          // instead of following the browser locale and showing US order beside en-GB dates.
          value={formData?.[config?.key] ? new Date(formData?.[config?.key]).toLocaleDateString("en-GB") : ""}
          placeholder={t(config.placeholder || t("mm/dd/yyyy"))}
          disabled={true}
          readOnly
        />
        <button
          type="button"
          onClick={() => setShowModal(true)}
          style={{ background: "transparent", border: "none", cursor: "pointer" }}
          disabled={config?.disable || disable}
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
          // Kept mounted but hidden behind the warning, so the shown month survives a "Back".
          popUpStyleMain={pendingNonWorkingDate ? { display: "none" } : {}}
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
      {pendingNonWorkingDate && (
        <NonWorkingDayWarningModal
          t={t}
          selectedDate={pendingNonWorkingDate}
          onCancel={() => setPendingNonWorkingDate(null)}
          onConfirm={() => commitDate(pendingNonWorkingDate)}
        />
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

export default CustomDatePickerV2;
