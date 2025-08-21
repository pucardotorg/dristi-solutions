import React, { useState } from "react";
import { CustomArrowDownIcon, CustomArrowUpIcon } from "../icons/svgIndex";

function ErrorsAccordion({ handlePageChange, pages, t, showConfirmModal, totalErrorCount, totalWarningCount, handleGoToPage, selected, onSubmit }) {
  const [isOpen, setIsOpen] = useState(false);
  const handleAccordionClick = () => {
    // disabling accordion Functionality as per the requirements
    // setIsOpen((prev) => {
    //   return !prev;
    // });
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
    <div key={"ErrorAccordion"} className="accordion-wrapper">
      <div className={`accordion-title ${isOpen ? "open" : ""} total-error-count`} style={{ cursor: "default" }} onClick={handleAccordionClick}>
        <span style={{ color: "#BB2C2F" }}>{`${totalErrorCount - totalWarningCount} ${t("CS_ERRORS_MARKED")}`}</span>
        <div className="icon">
          <span className="reverse-arrow" style={{ cursor: "pointer" }} onClick={handleGoToNext}>
            <CustomArrowDownIcon />
          </span>
          <span>{`${resultIndex}/${pages.length}`}</span>
          <span className="reverse-arrow" style={{ cursor: "pointer" }} onClick={handleGoToPrev}>
            <CustomArrowUpIcon />
          </span>
        </div>
      </div>
      <div className={`accordion-item ${!isOpen ? "collapsed" : ""}`}>
        <div className={`accordion-item ${!isOpen ? "collapsed" : ""}`}>
          {pages?.map((item, index) => (
            <div
              style={{ padding: "10px", color: "#BB2C2F", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}
              onClick={() => {
                handlePageChange(item?.key, !showConfirmModal);
              }}
              key={index}
            >
              <label>{t(item?.label)}</label>
              <label> {`${item?.errorCount || 0} ${t("CS_ERRORS")}`} </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ErrorsAccordion;
