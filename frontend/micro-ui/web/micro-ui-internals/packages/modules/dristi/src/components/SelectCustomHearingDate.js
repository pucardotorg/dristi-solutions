import React, { useMemo, useState, useEffect } from "react";
import CustomToast from "@egovernments/digit-ui-module-dristi/src/components/CustomToast";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import { EditPencilIcon } from "../icons/svgIndex";
import { CloseBtn } from "./ModalComponents";

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

const Chip = ({ label, isSelected, handleClick, icon }) => {
  const chipStyle = {
    backgroundColor: isSelected ? "#ecf3fd" : "#FAFAFA",
    color: "#505A5F",
    border: isSelected ? "2px solid #007E7E" : "2px solid #D6D5D4",
    borderRadius: "8px",
    padding: "10px 20px",
    margin: "5px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "150px",
    fontWeight: isSelected ? "700" : "400",
    gap: "10px",
  };

  return (
    <div style={chipStyle} onClick={handleClick}>
      {formatToUI(label)}
      {icon && <span>{icon}</span>}
    </div>
  );
};
function SelectCustomHearingDate({ t, config, onSelect, formData = {}, errors }) {
  const [showPicker, setShowPicker] = useState(false);
  const [showToast, setShowToast] = useState(null);

  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const CustomCalendar = Digit.ComponentRegistryService.getComponent("CustomCalendarV2");

  const { data: nonWorkingDay } = Digit.Hooks.useCustomMDMS(Digit.ULBService.getStateId(), "schedule-hearing", [{ name: "COURT000334" }], {
    select: (data) => data || [],
  });

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

  const handleDateChange = (date) => {
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = date.getFullYear();

    const formattedForCheck = `${d}-${m}-${y}`;
    const isNonWorkingDay = nonWorkingDay?.["schedule-hearing"]?.["COURT000334"]?.some((item) => item.date === formattedForCheck);

    if (isNonWorkingDay) {
      setShowToast({ error: true, label: t("CS_COMMON_COURT_NON_WORKING"), errorId: null });
      return;
    }

    const finalInternalDate = `${y}-${m}-${d}`;
    onSelect(config.key, finalInternalDate);
    setShowPicker(false);
  };

  const handleChipClick = (dateStr) => {
    onSelect(config.key, toInternal(dateStr));
    setShowPicker(false);
  };

  useEffect(() => {
    const handleBackdropClick = (event) => {
      if (event.target.classList.contains("popup-wrap") || event.target.classList.contains("modal-wrapper")) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      window.addEventListener("click", handleBackdropClick);
    }

    return () => {
      window.removeEventListener("click", handleBackdropClick);
    };
  }, [showPicker]);

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
          return <Chip key={index} label={date} isSelected={selectedValue === internalDate} handleClick={() => handleChipClick(date)} />;
        })}

        <Chip
          label={isCustomDateSelected ? formatToUI(selectedValue) : t("SELECT_ANOTHER_DATE")}
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

      {showToast && (
        <CustomToast
          error={showToast?.error}
          label={showToast?.label}
          errorId={showToast?.errorId}
          onClose={() => setShowToast(null)}
          duration={showToast?.errorId ? 7000 : 5000}
        />
      )}

      {errors?.[config.key] && <p style={{ color: "#BB2C2F", fontSize: "12px", marginTop: "4px" }}>{t("REQUIRED_FIELD")}</p>}
    </div>
  );
}

export default SelectCustomHearingDate;
