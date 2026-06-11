import React from "react";
import PropTypes from "prop-types";
import { formatDateInMonth } from "../Utils";

function isEpoch(item) {
  return typeof item === "number" && item.toString().length === 13;
}

function convertEpochToDate(item) {
  return isEpoch(item) ? new Date(item) : item;
}

const Chip = ({ label, isSelected, handleClick, item, isDisabled }) => {
  const chipStyle = {
    backgroundColor: isDisabled ? "#E8E8E8" : isSelected ? "#ecf3fd" : "#FAFAFA",
    color: "#505A5F",
    border: isSelected ? "1px solid #007E7E" : "1px solid #D6D5D4",
    borderRadius: "8px",
    padding: "5px 10px",
    margin: "5px",
    cursor: isDisabled ? "not-allowed" : "pointer",
  };

  return (
    <button
      type="button"
      style={{ ...chipStyle, background: "none", border: chipStyle.border }}
      disabled={isDisabled}
      onClick={() => !isDisabled && handleClick(isEpoch(item) ? item : label)}
    >
      {label}
    </button>
  );
};

Chip.propTypes = {
  label: PropTypes.string,
  isSelected: PropTypes.bool,
  handleClick: PropTypes.func,
  item: PropTypes.any,
  isDisabled: PropTypes.bool,
};

const CustomChooseDate = ({ data, selectedChip, handleClick, scheduleHearingParams, isSelectMulti = false, enabledData }) => {
  return (
    <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", border: "1px solid lightgrey", padding: "10px", marginBottom: "10px" }}>
      {data.map((item) => (
        <Chip
          key={item}
          label={isEpoch(item) ? formatDateInMonth(convertEpochToDate(item)) : item}
          item={item}
          isSelected={isSelectMulti ? selectedChip.includes(item) : selectedChip === item}
          handleClick={handleClick}
          isDisabled={enabledData ? !enabledData.includes(item) : false}
        />
      ))}
    </div>
  );
};

CustomChooseDate.propTypes = {
  data: PropTypes.array,
  selectedChip: PropTypes.any,
  handleClick: PropTypes.func,
  scheduleHearingParams: PropTypes.any,
  isSelectMulti: PropTypes.bool,
  enabledData: PropTypes.array,
};

export default CustomChooseDate;
