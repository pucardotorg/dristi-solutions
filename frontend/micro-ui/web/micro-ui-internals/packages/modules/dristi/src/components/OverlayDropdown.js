import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { CustomThreeDots, ThreeDots } from "../icons/svgIndex";

export const Context = React.createContext();

// Track currently open dropdown globally within this module
let activeDropdownSetter = null;

const OverlayDropdown = ({ column, row, master, module, cutomDropdownItems = [], position = "absolute", textStyle = {} }) => {
  const { t } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const history = useHistory();

  const dropdownItems = master ? Digit.Customizations[master]?.[module]?.dropDownItems?.(row, column, t) : cutomDropdownItems || [];

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
    <div ref={dropdownRef} style={{ position: position, display: "flex", justifyContent: "center", alignItems: "center", width: "40px", height: 0 }}>
      <div
        style={{
          cursor: "pointer",
          padding: "10px 20px",
        }}
        onClick={toggleDropdown}
      >
        <ThreeDots />
      </div>

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
            <li
              key={item.id}
              style={{ padding: "10px", cursor: "pointer", color: item.disabled ? "grey" : "black", ...textStyle }}
              onClick={() => {
                setIsDropdownOpen(false);
                return !item.disabled && item.action(history, column, row, item);
              }}
            >
              {t(item.label)}
            </li>
          ))}
          {Array.isArray(filteredDropdownItems) && filteredDropdownItems.length === 0 && (
            <p style={{ padding: "5px" }}>{t("ACTIONS_NOT_AVAILABLE")}</p>
          )}
        </ul>
      )}
    </div>
  );
};

export default OverlayDropdown;
