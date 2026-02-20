import React, { useEffect, useState, useRef, useMemo } from "react";

const ArrowDown2 = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black" class="cp" width="24px" height="24px">
    <path d="M0 0h24v24H0V0z" fill="none"></path>
    <path d="M7 10l5 5 5-5H7z"></path>
  </svg>
);

const ArrowUp2 = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black" class="cp" width="24px" height="24px">
    <path d="M0 0h24v24H0V0z" fill="none"></path>
    <path d="M7 14l5-5 5 5H7z"></path>
  </svg>
);

const CheckBoxIcon = ({ checked }) => (
  <svg width="20" height="20" viewBox="0 0 20 20">
    <rect x="1" y="1" width="18" height="18" rx="5" fill={checked ? "#1E63EE" : "white"} stroke={checked ? "#1E63EE" : "#94A3B8"} strokeWidth="2" />

    {checked && <path d="M5 10L8.5 13.5L15 6.5" stroke="white" strokeWidth="2" fill="none" />}
  </svg>
);

export const MultiSelectDropdownNew = React.memo(
  ({
    options = [],
    optionsKey = "label",
    displayKey = "code",
    selected = [],
    onConfirm,
    onSelect,
    defaultLabel = "",
    t = (s) => s,
    disable = false,
    active,
    setActive = () => {},
  }) => {
    const [localSelected, setLocalSelected] = useState(selected || []);
    const dropdownRef = useRef(null);

    useEffect(() => {
      setLocalSelected(selected || []);
    }, [selected]);

    useEffect(() => {
      function handleClickOutside(e) {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
          setActive(false);
        }
      }
      if (active) document.addEventListener("mousedown", handleClickOutside, { capture: true });
      return () => {
        document.removeEventListener("mousedown", handleClickOutside, { capture: true });
        setLocalSelected([]);
      };
    }, [active]);

    function toggleOption(option) {
      const exists = localSelected?.some((s) => s?.[optionsKey] === option?.[optionsKey]);
      const updated = exists ? localSelected.filter((s) => s?.[optionsKey] !== option?.[optionsKey]) : [...localSelected, option];

      setLocalSelected(updated);
      onSelect?.(updated);
    }

    function handleReset() {
      setLocalSelected([]);
    }

    function handleConfirm() {
      onConfirm?.(localSelected);
      setActive(false);
    }

    return (
      <div className="multi-select-dropdown-wrap" ref={dropdownRef} style={{ position: "relative" }}>
        <div
          style={{
            padding: "0px 10px",
            height: "40px",
            border: "1px solid black",
            cursor: "pointer",
            background: "#fff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
          onClick={() => !disable && setActive((a) => !a)}
        >
          <span style={{ color: !active ? "#9C9DA0" : "#9C9DA0" }}>{defaultLabel}</span>
          <span style={{ marginLeft: 8, marginTop: 5 }}>{active ? <ArrowUp2 /> : <ArrowDown2 />}</span>
        </div>
        {active && !disable ? (
          <div
            className="server"
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              width: "100%",
              zIndex: 9999,
              maxHeight: 300,
              overflow: "auto",
              border: "1px solid black",
              marginTop: 4,
              background: "#fff",
              boxShadow: "0px 4px 10px rgba(0,0,0,0.12)",
            }}
          >
            {options.map((option, idx) => {
              const checked = localSelected?.some((s) => s?.[optionsKey] === option?.[optionsKey]);

              return (
                <label
                  key={idx}
                  style={{ display: "flex", padding: "8px 12px", cursor: "pointer", alignItems: "center" }}
                  onClick={() => toggleOption(option)}
                >
                  <CheckBoxIcon checked={checked} />
                  <span style={{ marginLeft: 8 }}>{t(option?.[displayKey])}</span>
                </label>
              );
            })}
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #E3E3E3", padding: "10px 12px" }}>
              <button
                onClick={handleReset}
                style={{
                  border: "1px solid teal",
                  background: "white",
                  padding: "3px 12px",
                  borderRadius: 6,
                  cursor: "pointer",
                  color: "#007E7E",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
              >
                {t("Reset")}
              </button>
              <button
                onClick={handleConfirm}
                style={{
                  border: "none",
                  background: "#007E7E",
                  color: "white",
                  padding: "3px 12px",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
              >
                {t("Confirm")}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    );
  }
);
