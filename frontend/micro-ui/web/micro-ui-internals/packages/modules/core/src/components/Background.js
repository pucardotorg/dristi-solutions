import PropTypes from "prop-types";
import React from "react";

const Background = ({ children }) => {
  return <div className="banner banner-container">{children}</div>;
};

Background.propTypes = {
  children: PropTypes.node,
};

export default Background;
