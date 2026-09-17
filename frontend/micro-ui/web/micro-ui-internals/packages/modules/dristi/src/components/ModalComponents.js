import { CloseSvg } from "@egovernments/digit-ui-components";
import React from "react";

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
        ...props?.style,
      }}
      className={props?.className}
    >
      <CloseSvg />
    </div>
  );
};

export const Heading = (props) => {
  return (
    <h1 className={props?.className || "heading-m"} style={props?.style}>
      {props.label}
    </h1>
  );
};
