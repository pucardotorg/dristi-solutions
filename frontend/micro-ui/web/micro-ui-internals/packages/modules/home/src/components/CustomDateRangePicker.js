import React from "react";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css"; // Main CSS
import "react-date-range/dist/theme/default.css"; // Theme CSS
import { format } from "date-fns";
import { DateIcon } from "../../homeIcon";
const CustomDateRangePicker = ({ showPicker, setShowPicker, dateRange, setDateRange }) => {
  const handleSelect = (ranges) => {
    setDateRange([ranges.selection]);
    setShowPicker(false);
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setShowPicker(!showPicker)}
        style={{
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          border: "1px solid #ccc",
          cursor: "pointer",
          background: "white",
          fontSize: "16px",
          gap: "4px",
        }}
      >
        <DateIcon /> {format(dateRange[0].startDate, "d MMM yy")} - {format(dateRange[0].endDate, "d MMM yy")}
      </button>

      {showPicker && (
        <div
          style={{
            position: "absolute",
            top: "40px",
            left: "0",
            zIndex: 1000,
            boxShadow: "0px 4px 6px rgba(0,0,0,0.1)",
          }}
        >
          <DateRange editableDateInputs={true} onChange={handleSelect} moveRangeOnFirstSelection={false} ranges={dateRange} />
        </div>
      )}
    </div>
  );
};

export default CustomDateRangePicker;
