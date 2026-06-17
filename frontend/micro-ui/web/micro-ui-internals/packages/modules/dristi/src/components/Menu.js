import React from "react";
import PropTypes from "prop-types";

const Menu = (props) => {
  const Digit = window?.Digit || {};
  const keyPrefix = props.localeKeyPrefix || "CS_ACTION";

  return (
    <div className="menu-wrap" style={props.style}>
      {props.options.map((option, index) => {
        const labelKey = option.forcedName || `${keyPrefix}_${props.optionKey ? option[props.optionKey] : option}`;
        return (
          <button
            key={option?.code ?? option?.[props.optionKey] ?? index}
            type="button"
            onClick={() => props.onSelect(option)}
            style={{ ...props?.menuItemStyle, width: "100%", background: "none", border: "none", textAlign: "inherit", cursor: "pointer", padding: 0 }}
          >
            <p style={props?.textStyles}>
              {props.t ? props.t(Digit.Utils.locale.getTransformedLocale(labelKey)) : option}
            </p>
          </button>
        );
      })}
    </div>
  );
};

Menu.propTypes = {
  options: PropTypes.array,
  onSelect: PropTypes.func,
  localeKeyPrefix: PropTypes.string,
  style: PropTypes.object,
  menuItemStyle: PropTypes.object,
  textStyles: PropTypes.object,
  optionKey: PropTypes.string,
  t: PropTypes.func,
};

Menu.defaultProps = {
  options: [],
  onSelect: () => {},
};

export default Menu;
