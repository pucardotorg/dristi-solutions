import PropTypes from "prop-types";
import React, { useMemo } from "react";
import { CustomArrowDownIcon, CustomCompleteIcon, CustomSchedule } from "../icons/svgIndex";

const accordionTabItemPropType = PropTypes.shape({
  key: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  label: PropTypes.string.isRequired,
  checked: PropTypes.bool,
  isCompleted: PropTypes.bool,
});

function Accordion({
  t,
  title,
  handlePageChange,
  handleAccordionClick,
  children,
  parentIndex,
  isOpen,
  showConfirmModal,
  errorCount,
  isCaseReAssigned,
  isDraftInProgress,
  isEditingAllowed,
  AccordionTabs,
}) {
  const getTime = useMemo(() => {
    switch (parentIndex) {
      case 0: {
        return "04m";
      }
      case 1: {
        return "15m";
      }
      case 2: {
        return "10m";
      }
      case 3: {
        return "06m";
      }
      case 4: {
        return "05m";
      }
      default:
        return "";
    }
  }, [parentIndex]);

  return (
    <div className="accordion-wrapper">
      <button type="button" className={`accordion-title ${isOpen ? "open" : ""}`} onClick={handleAccordionClick}>
        <span>{`${parentIndex + 1}. ${t(title)}`}</span>
        {isCaseReAssigned && (
          <div className="icon">
            <span>{`${errorCount || 0} ${t("CS_ERRORS")}`}</span>
            <span className="reverse-arrow">
              <CustomArrowDownIcon />
            </span>
          </div>
        )}
        {isDraftInProgress && isEditingAllowed && (
          <div className="icon">
            <CustomSchedule />
            <span style={{ paddingRight: "8px" }}>{getTime}</span>
            <span className="reverse-arrow">
              <CustomArrowDownIcon />
            </span>
          </div>
        )}
      </button>
      <div className={`accordion-item ${isOpen ? "" : "collapsed"}`}>
        <div className="accordion-content">
          {children.map((item) => {
            const onRowNavigate = () => {
              if (isEditingAllowed) {
                handlePageChange(item.key, !showConfirmModal);
              } else {
                handlePageChange(AccordionTabs.REVIEW_CASE_FILE, !showConfirmModal);
              }
            };
            const onRowKeyDown = (e) => {
              if (e.key !== "Enter" && e.key !== " ") return;
              e.preventDefault();
              onRowNavigate();
            };
            const rowProps = {
              role: "button",
              tabIndex: 0,
              className: "radio-wrap",
              style: item.checked ? { background: "#E8E8E8", color: "#3D3C3C", borderRadius: "0px" } : { color: "#77787B" },
              onClick: onRowNavigate,
              onKeyDown: onRowKeyDown,
            };
            // NOSONAR S6827 — role=button row: native <button> cannot wrap readOnly <input type="radio"> (Digit CSS)
            return (
              <div key={item.key} {...rowProps}>
                {item.isCompleted && !item?.checked ? (
                  <CustomCompleteIcon />
                ) : (
                  <span className="radio-btn-wrap">
                    <input className="radio-btn" type="radio" checked={Boolean(item?.checked)} readOnly tabIndex={-1} />
                    <span className="radio-btn-checkmark"></span>
                  </span>
                )}
                <label>{t(item?.label)}</label>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

Accordion.propTypes = {
  t: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  handlePageChange: PropTypes.func.isRequired,
  handleAccordionClick: PropTypes.func.isRequired,
  children: PropTypes.arrayOf(accordionTabItemPropType).isRequired,
  parentIndex: PropTypes.number.isRequired,
  isOpen: PropTypes.bool,
  showConfirmModal: PropTypes.bool,
  errorCount: PropTypes.number,
  isCaseReAssigned: PropTypes.bool,
  isDraftInProgress: PropTypes.bool,
  isEditingAllowed: PropTypes.bool,
  AccordionTabs: PropTypes.shape({
    REVIEW_CASE_FILE: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
};

export default Accordion;
