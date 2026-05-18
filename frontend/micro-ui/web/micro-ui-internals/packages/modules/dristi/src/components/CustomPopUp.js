import React from "react";
import PropTypes from "prop-types";
import ReactDOM from "react-dom";

function CustomPopUp({ children, onClose, popupstyle }) {
  return ReactDOM.createPortal(
    <div className="pop-up-class" style={{ position: "fixed", inset: 0, zIndex: 100000 }}>
      <button
        type="button"
        aria-label="Close popup"
        style={{ position: "fixed", inset: 0, background: "transparent", border: "none", cursor: "default", width: "100%", height: "100%" }}
        onClick={onClose}
      />
      <div className="popup" style={{ position: "relative", zIndex: 1, ...popupstyle }}>
        {onClose && (
          <button type="button" className="close" style={{ background: "none", border: "none", cursor: "pointer" }} onClick={onClose}></button>
        )}
        {children}
      </div>
    </div>,
    document.querySelector("body")
  );
}

CustomPopUp.propTypes = {
  children: PropTypes.node,
  onClose: PropTypes.func,
  popupstyle: PropTypes.object,
};

export default CustomPopUp;
