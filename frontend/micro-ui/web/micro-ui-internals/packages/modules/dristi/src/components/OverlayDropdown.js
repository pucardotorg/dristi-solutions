import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { ThreeDots } from "../icons/svgIndex";

export const Context = React.createContext();

// Track currently open dropdown globally within this module
let activeDropdownSetter = null;

const OverlayDropdown = ({ column, row, master, module, cutomDropdownItems = [], position = "absolute", textStyle = {} }) => {
  const { t } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const history = useHistory();
  const digit = globalThis.Digit ?? window.Digit;

  const dropdownItems = master ? digit?.Customizations?.[master]?.[module]?.dropDownItems?.(row, column, t) : cutomDropdownItems || [];

  const filteredDropdownItems = dropdownItems.filter((item) => !item.hide);

  const toggleDropdown = (event) => {
    event.stopPropagation();

    // If opening this dropdown, close any other open dropdown first
    if (!isDropdownOpen) {
      if (activeDropdownSetter && activeDropdownSetter !== setIsDropdownOpen) {
        activeDropdownSetter(false);
      }
      activeDropdownSetter = setIsDropdownOpen;
      setIsDropdownOpen(true);
    } else {
      setIsDropdownOpen(false);
      if (activeDropdownSetter === setIsDropdownOpen) {
        activeDropdownSetter = null;
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
        if (activeDropdownSetter === setIsDropdownOpen) {
          activeDropdownSetter = null;
        }
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <div ref={dropdownRef} style={{ position, display: "flex", justifyContent: "center", alignItems: "center", width: "40px", height: 0 }}>
      <button
        type="button"
        aria-expanded={isDropdownOpen}
        aria-haspopup="true"
        style={{
          cursor: "pointer",
          padding: "10px 20px",
          background: "none",
          border: "none",
        }}
        onClick={toggleDropdown}
      >
        <ThreeDots />
      </button>

      {isDropdownOpen && (
        <ul
          style={{
            position: "absolute",
            right: 0,
            backgroundColor: "white",
            border: "1px solid #ccc",
            listStyle: "none",
            padding: 0,
            margin: 0,
            top: "10px",
            width: "200px",
            zIndex: 1000,
          }}
        >
          {filteredDropdownItems.map((item) => (
            <li key={item.id} style={{ margin: 0, padding: 0, listStyle: "none" }}>
              <button
                type="button"
                disabled={Boolean(item.disabled)}
                style={{
                  width: "100%",
                  padding: "10px",
                  cursor: item.disabled ? "not-allowed" : "pointer",
                  color: item.disabled ? "grey" : "black",
                  border: "none",
                  background: "white",
                  textAlign: "left",
                  ...textStyle,
                }}
                onClick={() => {
                  setIsDropdownOpen(false);
                  if (!item.disabled) {
                    item.action(history, column, row, item);
                  }
                }}
              >
                {t(item.label)}
              </button>
            </li>
          ))}
          {Array.isArray(filteredDropdownItems) && filteredDropdownItems.length === 0 && (
            <li style={{ padding: "5px", listStyle: "none" }}>{t("ACTIONS_NOT_AVAILABLE")}</li>
          )}
        </ul>
      )}
    </div>
  );
};

OverlayDropdown.propTypes = {
  column: PropTypes.any,
  row: PropTypes.any,
  master: PropTypes.string,
  module: PropTypes.string,
  cutomDropdownItems: PropTypes.array,
  position: PropTypes.string,
  textStyle: PropTypes.object,
};

export default OverlayDropdown;
