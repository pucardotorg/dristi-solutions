import React from "react";
import PropTypes from "prop-types";
import { Card, CardLabel, CardText, SubmitBar } from "@egovernments/digit-ui-react-components";

const CustomCard = ({ Icon, label, style, onClick, subLabel, buttonLabel, className }) => {
  return (
    <Card
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-evenly",
        ...style,
      }}
      className={className}
      onClick={() => {
        if (Icon) {
          onClick();
        }
      }}
    >
      <CardLabel style={{ fontSize: "24px", fontWeight: "600", marginBottom: "5px" }}>{label}</CardLabel>
      <CardText style={{ fontSize: "14px", fontWeight: "400", marginBottom: "10px" }}> {subLabel}</CardText>
      {buttonLabel && <SubmitBar label={buttonLabel} onSubmit={onClick} />}
      {Icon ? Icon : null}
    </Card>
  );
};

CustomCard.propTypes = {
  Icon: PropTypes.node,
  label: PropTypes.string,
  style: PropTypes.object,
  onClick: PropTypes.func,
  subLabel: PropTypes.string,
  buttonLabel: PropTypes.string,
  className: PropTypes.string,
};

export default CustomCard;
