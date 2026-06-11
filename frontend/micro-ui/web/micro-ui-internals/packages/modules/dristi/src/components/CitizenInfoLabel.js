import React from "react";
import PropTypes from "prop-types";
import { InfoBannerIcon } from "@egovernments/digit-ui-react-components";

const CitizenInfoLabel = (props) => {
  props = props?.props ? props?.props : props;
  const showInfo = props?.showInfo ? props?.showInfo : true;

  return (
    <div className={`info-banner-wrap ${props?.className ? props?.className : ""}`} style={props?.style}>
      {showInfo && (
        <div>
          <InfoBannerIcon fill={props?.fill} styles={props?.iconStyle} />
          <h2 style={props?.textStyle}>{props?.info}</h2>
        </div>
      )}
      <p style={props?.textStyle}>{props?.text}</p>
      {props?.children && <p style={{ fontSize: "16px" }}>{props?.children}</p>}
    </div>
  );
};

CitizenInfoLabel.propTypes = {
  props: PropTypes.object,
  showInfo: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.object,
  fill: PropTypes.string,
  iconStyle: PropTypes.object,
  textStyle: PropTypes.object,
  info: PropTypes.string,
  text: PropTypes.string,
  children: PropTypes.node,
};

export default CitizenInfoLabel;
