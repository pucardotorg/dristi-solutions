import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";
import ButtonSelector from "./ButtonSelector";
import { RoundedCheck, DeleteBtn, ErrorIcon } from "../icons/svgIndex";

/**
 * CustomToast – Toast notification component.
 * Supports error, warning, and success states with optional YES/NO buttons.
 *
 * Props:
 *  error            {boolean}  – true → red toast
 *  warning          {boolean}  – true → orange toast
 *  label            {string}   – message text
 *  errorId          {string}   – correlation id (optional, for error state)
 *  onClose          {Function} – close callback
 *  onYes            {Function} – YES button callback (for warning with buttons)
 *  onNo             {Function} – NO button callback (for warning with buttons)
 *  isWarningButtons {boolean}  – show YES/NO buttons for warning
 *  isDeleteBtn       {boolean}  – show delete/close button
 *  duration         {number}   – auto-dismiss (ms)
 *  style            {object}   – custom styles
 *  labelstyle       {object}   – custom label styles
 */
const CustomToast = ({
  error = false,
  warning = false,
  label = "",
  errorId,
  onClose,
  onYes,
  onNo,
  isWarningButtons = false,
  isDeleteBtn = true,
  duration = 5000,
  style = {},
  labelstyle = {},
}) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!duration) return;
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleCopy = () => {
    if (!errorId) return;
    const write = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(errorId)
        .then(write)
        .catch(() => legacyCopy(write));
    } else {
      legacyCopy(write);
    }
  };

  const legacyCopy = (cb) => {
    const el = document.createElement("textarea");
    el.value = errorId;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    cb();
  };

  if (error) {
    return (
      <div className="success-toast error" style={{ backgroundColor: "#D4351C", ...style }}>
        <ErrorIcon />
        <div className="toast-label" style={{ ...labelstyle }}>
          {label}
          {errorId && (
            <span
              className="help-error"
              style={{ fontWeight: "400", marginLeft: "8px", borderLeft: "1px solid rgba(255,255,255,0.3)", paddingLeft: "8px" }}
            >
              {t("SHARE_ERROR_TO_HELPDESK")}: {errorId}
            </span>
          )}
        </div>
        {errorId && (
          <button
            onClick={handleCopy}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.4)",
              borderRadius: "4px",
              color: "#FFFFFF",
              fontSize: "12px",
              padding: "4px 8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              transition: "background 0.2s",
              marginLeft: "10px",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            {copied ? t("COPIED") : t("COPY_ERROR_ID")}
          </button>
        )}
        {isDeleteBtn ? <DeleteBtn fill="none" className="toast-close-btn" onClick={onClose} /> : null}
      </div>
    );
  }

  if (warning) {
    return (
      <div>
        <div
          className="success-toast warning"
          style={isWarningButtons ? { backgroundColor: "#EA8A3B", display: "block", ...style } : { backgroundColor: "#EA8A3B", ...style }}
        >
          {!isWarningButtons ? (
            <div className="success-toast" style={{ backgroundColor: "#EA8A3B", ...style }}>
              <ErrorIcon />
              <div className="toast-label" style={{ marginLeft: "10px", ...labelstyle }}>
                {label}
              </div>
              {isDeleteBtn ? <DeleteBtn fill="none" className="toast-close-btn" onClick={onClose} /> : null}
            </div>
          ) : (
            <div style={{ display: "flex" }}>
              <ErrorIcon />
              <div className="toast-label" style={{ marginLeft: "10px", ...labelstyle }}>
                {label}
              </div>
              {isDeleteBtn ? <DeleteBtn fill="none" className="toast-close-btn" onClick={onClose} /> : null}
            </div>
          )}
          {isWarningButtons ? (
            <div style={{ width: "100%", display: "flex", justifyContent: "flex-end" }}>
              <ButtonSelector theme="border" label={"NO"} onSubmit={onNo} style={{ marginLeft: "10px" }} />
              <ButtonSelector label={"YES"} onSubmit={onYes} style={{ marginLeft: "10px" }} />
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="success-toast" style={{ backgroundColor: "#00703C", ...style }}>
      <RoundedCheck />
      <div className="toast-label" style={{ ...labelstyle }}>
        {label}
      </div>
      {isDeleteBtn ? <DeleteBtn fill="none" className="toast-close-btn" onClick={onClose} /> : null}
    </div>
  );
};

CustomToast.propTypes = {
  label: PropTypes.string,
  onClose: PropTypes.func,
  isDeleteBtn: PropTypes.bool,
  error: PropTypes.bool,
  warning: PropTypes.bool,
  errorId: PropTypes.string,
  onYes: PropTypes.func,
  onNo: PropTypes.func,
  isWarningButtons: PropTypes.bool,
  duration: PropTypes.number,
  style: PropTypes.object,
  labelstyle: PropTypes.object,
};

CustomToast.defaultProps = {
  label: "",
  onClose: undefined,
  isDeleteBtn: true,
  error: false,
  warning: false,
  errorId: "",
  onYes: undefined,
  onNo: undefined,
  isWarningButtons: false,
  duration: 5000,
  style: {},
  labelstyle: {},
};

export default CustomToast;
