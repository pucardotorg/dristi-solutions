import React from "react";
import { CloseSvg } from "@egovernments/digit-ui-react-components";

// Heading component for modal/section titles
export const Heading = (props) => {
  return <h1 className="heading-m">{props.label}</h1>;
};

// Close button component with customizable styling
export const CloseBtn = (props) => {
  return (
    <div
      onClick={props?.onClick}
      style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        paddingRight: "20px",
        cursor: "pointer",
        ...(props?.backgroundColor && { backgroundColor: props.backgroundColor }),
      }}
    >
      <CloseSvg />
    </div>
  );
};
