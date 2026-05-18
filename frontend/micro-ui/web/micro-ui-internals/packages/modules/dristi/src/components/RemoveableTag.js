import PropTypes from "prop-types";
import React from "react";
import { CloseIcon } from "../icons/svgIndex";

const extraStylesShape = PropTypes.shape({
  tagStyles: PropTypes.object,
  textStyles: PropTypes.object,
  closeIconStyles: PropTypes.object,
});

const RemoveableTag = ({ text, onClick, extraStyles, disabled = false }) => (
  <div className="tag" style={extraStyles ? extraStyles?.tagStyles : {}}>
    <span className="text" style={extraStyles ? extraStyles?.textStyles : {}}>
      {text}
    </span>
    <button
      type="button"
      className="tag-close"
      aria-label="Remove"
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      style={{ background: "none", border: "none", padding: 0, cursor: disabled ? "default" : "pointer" }}
    >
      <CloseIcon className="close" style={extraStyles ? extraStyles?.closeIconStyles : {}} />
    </button>
  </div>
);

RemoveableTag.propTypes = {
  text: PropTypes.node.isRequired,
  onClick: PropTypes.func.isRequired,
  extraStyles: extraStylesShape,
  disabled: PropTypes.bool,
};

RemoveableTag.defaultProps = {
  extraStyles: undefined,
};

export default RemoveableTag;
