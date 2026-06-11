import { Card, SubmitBar } from "@egovernments/digit-ui-react-components";
import PropTypes from "prop-types";
import React from "react";

const PageBasedInput = ({ style, children, texts, onSubmit }) => {
  return (
    <div style={{ ...(style ? style.pageStyle : {}) }} className="PageBasedInputWrapper PageBased">
      <Card style={{ ...(style ? style.cardStyle : {}) }}>
        {children}
        <SubmitBar className="SubmitBarInCardInDesktopView" label={texts.submitBarLabel} onSubmit={onSubmit} />
      </Card>
      <div className="SubmitBar">
        <SubmitBar label={texts.submitBarLabel} onSubmit={onSubmit} />
      </div>
    </div>
  );
};

PageBasedInput.propTypes = {
  style: PropTypes.shape({
    pageStyle: PropTypes.object,
    cardStyle: PropTypes.object,
  }),
  children: PropTypes.node,
  texts: PropTypes.shape({
    submitBarLabel: PropTypes.string.isRequired,
  }).isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default PageBasedInput;
