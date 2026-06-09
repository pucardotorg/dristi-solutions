import React from "react";
import { useTranslation } from "react-i18next";
import { Dropdown } from "@egovernments/digit-ui-components";

const CustomDetailsDropdownCard = ({ header, options = [], value, onChange, style }) => {
  const { t } = useTranslation();

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        flexDirection: "row",
        alignItems: "flex-start",
        padding: "0px 0px 16px 0px",
        gap: "12px",
        ...style,
      }}
    >
      <div style={{ width: "100%" }}>
        {header && (
          <p
            style={{
              fontFamily: "Roboto",
              fontSize: "16px",
              fontWeight: 700,
              lineHeight: "18.75px",
              textAlign: "left",
              color: "#0A0A0A",
              margin: "0px 0px 12px",
            }}
          >
            {t(header)}
          </p>
        )}
        {options && (
          <div
            style={{
              position: "relative",
              width: "100%",
            }}
            className="customDropDown-case-type"
          >
            <Dropdown option={options} optionKey={"label"} selected={value} select={onChange} />
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomDetailsDropdownCard;
