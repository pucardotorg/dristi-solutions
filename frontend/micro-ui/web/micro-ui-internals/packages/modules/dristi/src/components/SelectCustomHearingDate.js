import React, { useMemo, useState, useEffect } from "react";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import { EditPencilIcon } from "../icons/svgIndex";
import { CloseBtn } from "./ModalComponents";
import NonWorkingDayWarningModal from "./NonWorkingDayWarningModal";
import { COURT_NON_WORKING_DAYS_COURT_ID, COURT_NON_WORKING_DAYS_MASTER, isCourtNonWorkingDay } from "../Utils/courtNonWorkingDays";

const toInternal = (dateStr) => {
  if (!dateStr || typeof dateStr !== "string") return dateStr;
  const parts = dateStr.split("-");
  if (parts[0].length === 2) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
};

const formatToUI = (dateStr) => {
  if (!dateStr || typeof dateStr !== "string") return dateStr;
  const parts = dateStr.split("-");
  if (parts[0].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
};

const Chip = ({ label, isSelected, handleClick, icon, disabled }) => {
  const chipStyle = {
    backgroundColor: disabled ? "#F0F0F0" : isSelected ? "#ecf3fd" : "#FAFAFA",
    color: disabled ? "#B0B0B0" : "#505A5F",
    border: disabled ? "2px solid #E0E0E0" : isSelected ? "2px solid #007E7E" : "2px solid #D6D5D4",
    borderRadius: "8px",
    padding: "10px 20px",
    margin: "5px",
    cursor: disabled ? "not-allowed" : "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "150px",
    fontWeight: isSelected ? "700" : "400",
    gap: "10px",
    opacity: disabled ? 0.9 : 1,
  };

  return (
    <div style={chipStyle} onClick={disabled ? undefined : handleClick}>
      {formatToUI(label)}
      {icon && <span>{icon}</span>}
    </div>
  );
};
function SelectCustomHearingDate({ t, config, onSelect, formData = {}, errors }) {
  const [showPicker, setShowPicker] = useState(false);
  // Date awaiting confirmation because it falls on a court non-working day or a weekend.
  const [pendingNonWorkingDate, setPendingNonWorkingDate] = useState(null);

  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const CustomCalendar = Digit.ComponentRegistryService.getComponent("CustomCalendarV2");

  const { data: nonWorkingDay } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    COURT_NON_WORKING_DAYS_MASTER,
    [{ name: COURT_NON_WORKING_DAYS_COURT_ID }],
    {
      select: (data) => data || [],
    }
  );

  const suggestedDates = useMemo(() => config?.populators?.inputs?.[0]?.options || [], [config]);

  const internalSuggestedDates = useMemo(() => suggestedDates.map((d) => toInternal(d)), [suggestedDates]);

  const selectedValue = formData?.[config?.key] || "";

  const isCustomDateSelected = useMemo(() => {
    return selectedValue && !internalSuggestedDates.includes(selectedValue);
  }, [selectedValue, internalSuggestedDates]);

  const convertToMillis = (dateStr) => {
    if (!dateStr) return new Date().getTime();
    const internal = toInternal(dateStr);
    const [y, m, d] = internal.split("-");
    return new Date(y, m - 1, d).getTime();
  };

  const commitDate = (date) => {
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = date.getFullYear();

    onSelect(config.key, `${y}-${m}-${d}`);
    setPendingNonWorkingDate(null);
    setShowPicker(false);
  };

  // A non-working day is only a soft block: warn and let the court confirm.
  const selectDate = (date) => {
    if (isCourtNonWorkingDay(date, nonWorkingDay)) {
      setPendingNonWorkingDate(date);
      return;
    }
    commitDate(date);
  };

  const handleDateChange = (date) => selectDate(date);

  const handleChipClick = (dateStr) => {
    const [y, m, d] = toInternal(dateStr).split("-");
    selectDate(new Date(y, m - 1, d));
  };

  useEffect(() => {
    const handleBackdropClick = (event) => {
      if (event.target.classList.contains("popup-wrap") || event.target.classList.contains("modal-wrapper")) {
        setShowPicker(false);
      }
    };

    if (showPicker && !pendingNonWorkingDate) {
      window.addEventListener("click", handleBackdropClick);
    }

    return () => {
      window.removeEventListener("click", handleBackdropClick);
    };
  }, [showPicker, pendingNonWorkingDate]);

  return (
    <div className="judge-hearing-selection-v2" style={{ width: "100%" }}>
      {config?.withoutLabel && (
        <h3 className="card-label bolder" style={{ marginBottom: "revert" }}>
          {t(config.label)}
        </h3>
      )}

      <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", borderRadius: "4px", paddingTop: "10px", backgroundColor: "#FBFAFA" }}>
        {suggestedDates.map((date, index) => {
          const internalDate = internalSuggestedDates[index];
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const isPast = new Date(internalDate) < today;
          return (
            <Chip key={index} label={date} isSelected={selectedValue === internalDate} handleClick={() => handleChipClick(date)} disabled={isPast} />
          );
        })}

        <Chip
          label={isCustomDateSelected ? formatToUI(selectedValue) : t(config?.populators?.selectDateLabel || "SELECT_ANOTHER_DATE")}
          isSelected={isCustomDateSelected}
          handleClick={() => setShowPicker(true)}
          icon={isCustomDateSelected ? <EditPencilIcon /> : null}
        />
      </div>

      {showPicker && (
        <Modal
          headerBarMain={true}
          headerBarEnd={<CloseBtn onClick={() => setShowPicker(false)} />}
          hideSubmit={true}
          className="custom-date-selector-modal-main-v2"
          popupModuleMianClassName="custom-date-selector-modal-v2"
          popupModuleMianStyles={{ width: "640px", maxHeight: "90vh" }}
          popupStyles={{ width: "fit-content" }}
          // Kept mounted but hidden behind the warning, so the shown month survives a "Back".
          popUpStyleMain={pendingNonWorkingDate ? { display: "none" } : {}}
        >
          <CustomCalendar
            config={{ showBottomBar: false }}
            t={t}
            minDate={new Date()}
            handleSelect={handleDateChange}
            selectedCustomDate={convertToMillis(selectedValue)}
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

      {errors?.[config.key] && <p style={{ color: "#BB2C2F", fontSize: "12px", marginTop: "4px" }}>{t("REQUIRED_FIELD")}</p>}
    </div>
  );
}

export default SelectCustomHearingDate;
