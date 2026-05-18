import React, { useState } from "react";
import PropTypes from "prop-types";
import { CloseBtn } from "@egovernments/digit-ui-module-dristi/src/components/ModalComponents";

const headingStyles = {
  fontFamily: '"Roboto", sans-serif',
  fontSize: "16px",
  fontWeight: 700,
  lineHeight: "18.75px",
  textAlign: "left",
  textUnderlinePosition: "from-font",
  textDecorationSkipInk: "none",
  color: "#231F20",
};

function Heading({ label }) {
  return (
    <div className="evidence-title">
      <h1 className="heading-m">{label}</h1>
    </div>
  );
}

Heading.propTypes = {
  label: PropTypes.string.isRequired,
};

function nameKey(fullName, index) {
  return `${String(fullName)}__${index}`;
}

const viewMoreBtnStyle = {
  fontFamily: '"Roboto", sans-serif',
  fontSize: "12px",
  fontWeight: 300,
  lineHeight: "16px",
  textAlign: "left",
  textDecorationLine: "underline",
  textDecorationStyle: "solid",
  textUnderlinePosition: "from-font",
  textDecorationSkipInk: "none",
  color: "#006FD5",
  margin: "0px",
  cursor: "pointer",
  border: "none",
  padding: 0,
  background: "none",
  font: "inherit",
  display: "inline",
};

function NameListWithModal({ t, data, type }) {
  const [open, setOpen] = useState(false);
  const Modal = window?.Digit?.ComponentRegistryService?.getComponent("Modal");
  const list = Array.isArray(data) ? data : [];

  const closeModal = () => setOpen(false);

  const modalNode =
    open &&
    Modal && (
      <Modal
        headerBarEnd={<CloseBtn onClick={closeModal} />}
        formId="modal-action"
        headerBarMainStyle={{ display: "flex" }}
        headerBarMain={<Heading label={t(type)} />}
      >
        <ul style={{ listStyle: "unset" }}>
          {list.map((fullName, index) => (
            <li key={nameKey(fullName, index)} style={headingStyles}>
              {fullName}
            </li>
          ))}
        </ul>
      </Modal>
    );

  const emptyState = (
    <div className="case-info-value">
      <span>NA</span>
    </div>
  );

  if (list.length === 0) {
    return (
      <>
        {emptyState}
        {modalNode}
      </>
    );
  }

  const previewRows = list.slice(0, 2).map((fullName, index) => (
    <div key={nameKey(fullName, index)} className="case-info-value">
      <span>{fullName}</span>
    </div>
  ));

  return (
    <>
      {previewRows}
      {list.length > 2 && (
        <button type="button" style={viewMoreBtnStyle} onClick={() => setOpen(true)}>
          {t("VIEW_ALL_LINK")}
        </button>
      )}
      {modalNode}
    </>
  );
}

NameListWithModal.propTypes = {
  data: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
  t: PropTypes.func.isRequired,
  type: PropTypes.string.isRequired,
};

export default NameListWithModal;
