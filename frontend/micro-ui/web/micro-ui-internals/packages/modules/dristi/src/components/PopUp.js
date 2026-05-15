import PropTypes from "prop-types";
import React from "react";

const PopUp = ({ className, popUpStyleMain, children }) => {
  return (
    <div className={`popup-wrap ${className}`} style={popUpStyleMain}>
      {children}
    </div>
  );
};

PopUp.propTypes = {
  className: PropTypes.string,
  popUpStyleMain: PropTypes.object,
  children: PropTypes.node,
};

PopUp.defaultProps = {
  className: "",
  popUpStyleMain: undefined,
  children: null,
};

export default PopUp;
