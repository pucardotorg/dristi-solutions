import PropTypes from "prop-types";
import React, { useState } from "react";
import { CustomArrowDownIcon, CustomArrowUpIcon } from "../icons/svgIndex";

const iconButtonStyle = {
  cursor: "pointer",
  border: "none",
  background: "none",
  padding: 0,
  display: "inline-flex",
  alignItems: "center",
  font: "inherit",
  color: "inherit",
};

function ErrorsAccordion({ handlePageChange, pages, t, showConfirmModal, totalErrorCount, totalWarningCount, handleGoToPage, selected, onSubmit }) {
  const [isOpen, setIsOpen] = useState(true);
  const handleAccordionClick = () => {
    setIsOpen((prev) => !prev);
  };
  const index = pages.findIndex((page) => page.key === selected);
  const resultIndex = index === -1 ? pages.length : index + 1;

  const handleGoToNext = async () => {
    if (index !== -1) {
      await onSubmit("SAVE_DRAFT");
    }
    if (resultIndex < pages.length) {
      handleGoToPage(pages[resultIndex]?.key);
    }
  };
  const handleGoToPrev = async () => {
    if (index !== -1) {
      await onSubmit("SAVE_DRAFT");
    }
    if (selected === pages[resultIndex - 1]?.key) {
      if (resultIndex > 1) {
        handleGoToPage(pages[resultIndex - 2]?.key);
      }
    } else {
      handleGoToPage(pages[resultIndex - 1]?.key);
    }
  };

  return (
    <div className="accordion-wrapper">
      <div className={`accordion-title ${isOpen ? "open" : ""} total-error-count`} style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
        <button
          type="button"
          className="reverse-arrow"
          style={{ ...iconButtonStyle, marginRight: "8px" }}
          aria-expanded={isOpen}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
        >
          {isOpen ? <CustomArrowUpIcon /> : <CustomArrowDownIcon />}
        </button>
        <button
          type="button"
          onClick={handleAccordionClick}
          style={{
            ...iconButtonStyle,
            color: "#BB2C2F",
            flex: "1 1 auto",
            textAlign: "left",
            justifyContent: "flex-start",
            minWidth: 0,
          }}
        >
          {`${totalErrorCount - totalWarningCount} ${t("CS_ERRORS_MARKED")}`}
        </button>
        <div className="icon" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
          <button
            type="button"
            className="reverse-arrow"
            style={iconButtonStyle}
            onClick={(e) => {
              e.stopPropagation();
              handleGoToNext();
            }}
            aria-label="Go to next errors section"
          >
            <CustomArrowDownIcon />
          </button>
          <span>{`${resultIndex}/${pages.length}`}</span>
          <button
            type="button"
            className="reverse-arrow"
            style={iconButtonStyle}
            onClick={(e) => {
              e.stopPropagation();
              handleGoToPrev();
            }}
            aria-label="Go to previous errors section"
          >
            <CustomArrowUpIcon />
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="accordion-item">
          {pages?.map((item) => (
            <button
              type="button"
              key={item.key}
              style={{
                padding: "10px",
                color: "#BB2C2F",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                border: "none",
                background: "none",
                font: "inherit",
                textAlign: "left",
              }}
              onClick={() => {
                handlePageChange(item?.key, !showConfirmModal);
              }}
            >
              <span>{t(item?.label)}</span>
              <span> {`${item?.errorCount || 0} ${t("CS_ERRORS")}`} </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const pageItemPropType = PropTypes.shape({
  key: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  label: PropTypes.string.isRequired,
  errorCount: PropTypes.number,
});

ErrorsAccordion.propTypes = {
  handlePageChange: PropTypes.func.isRequired,
  pages: PropTypes.arrayOf(pageItemPropType).isRequired,
  t: PropTypes.func.isRequired,
  showConfirmModal: PropTypes.bool,
  totalErrorCount: PropTypes.number.isRequired,
  totalWarningCount: PropTypes.number.isRequired,
  handleGoToPage: PropTypes.func.isRequired,
  selected: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onSubmit: PropTypes.func.isRequired,
};

export default ErrorsAccordion;
