import React, { useEffect, useRef, useState } from "react";
import StateEmblemIcon from "../../../components/StateEmblemIcon";
import { maskEmail } from "../../../Utils";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const AlertIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 8v4.5" />
    <circle cx="12" cy="16" r=".6" fill="currentColor" stroke="none" />
    <path d="M10.3 3.9 2.4 18a1.9 1.9 0 0 0 1.7 2.9h15.8a1.9 1.9 0 0 0 1.7-2.9L13.7 3.9a1.9 1.9 0 0 0-3.4 0Z" />
  </svg>
);

const OtpStep = ({ t, mobileNumber, otp, onOtpChange, onSelect, onResend, onBack, canSubmit, error }) => {
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [email, setEmail] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN);
  const inputsRef = useRef([]);

  const Digit = window.Digit || {};
  const tenantId = Digit.ULBService?.getCurrentTenantId?.();

  // Fetch the registered e-mail so the subtext can show where the OTP was sent, mirroring the design.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const {
          user: [userDetail],
        } = await Digit.UserService.userSearch(tenantId, { mobileNumber }, {});
        if (active && userDetail?.emailId) {
          setEmail(userDetail.emailId);
        }
      } catch (e) {
        /* email is optional in the subtext */
      }
    })();
    return () => {
      active = false;
    };
  }, [mobileNumber]);

  // Resend cooldown countdown.
  useEffect(() => {
    if (secondsLeft <= 0) {
      return undefined;
    }
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  // Keep the boxes in sync when the parent clears the OTP (e.g. after a wrong-code error).
  useEffect(() => {
    if (!otp && digits.some((d) => d !== "")) {
      setDigits(Array(OTP_LENGTH).fill(""));
      inputsRef.current[0]?.focus();
    }
  }, [otp]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const commit = (next) => {
    setDigits(next);
    onOtpChange(next.join(""));
  };

  const handleChange = (index, value) => {
    const sanitized = value.replace(/\D/g, "").slice(0, 1);
    const next = [...digits];
    next[index] = sanitized;
    commit(next);
    if (sanitized && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    } else if (e.key === "Enter" && digits.every((d) => d) && canSubmit) {
      onSelect();
    }
  };

  const handlePaste = (e) => {
    const pasted = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) {
      return;
    }
    e.preventDefault();
    const next = Array(OTP_LENGTH)
      .fill("")
      .map((_, i) => pasted[i] || "");
    commit(next);
    inputsRef.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleResend = () => {
    if (secondsLeft > 0) {
      return;
    }
    onResend();
    commit(Array(OTP_LENGTH).fill(""));
    setSecondsLeft(RESEND_COOLDOWN);
    inputsRef.current[0]?.focus();
  };

  const isComplete = digits.every((d) => d !== "");
  const maskedMobile = mobileNumber ? `+91******${mobileNumber.slice(-4)}` : "";

  return (
    <div className="login-v2-card">
      <button className="login-v2-back-link" onClick={onBack}>
        <BackIcon />
        {t("CS_COMMON_BACK")}
      </button>
      <div className="login-v2-brand" style={{ marginBottom: "18px" }}>
        <StateEmblemIcon className="login-v2-emblem" />
      </div>
      <h2 className="login-v2-heading">{t("CS_VERIFY_MOBILE_HEADING")}</h2>
      <p className="login-v2-subtext">
        {t("CS_ENTER_OTP_SENT_TO")} {maskedMobile}
        {email ? ` ${t("CS_COMMON_AND")} ${maskEmail(email)}` : ""}
      </p>

      <div className="login-v2-otp-row" onPaste={handlePaste}>
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputsRef.current[index] = el)}
            className={`login-v2-otp-box ${digit ? "login-v2-filled" : ""} ${error ? "login-v2-err" : ""}`}
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
          />
        ))}
      </div>
      {error && (
        <div className="login-v2-error-text" style={{ marginTop: "8px" }}>
          <AlertIcon />
          <span>{error}</span>
        </div>
      )}

      <button className="login-v2-btn" style={{ marginTop: "20px" }} onClick={onSelect} disabled={!isComplete || !canSubmit}>
        {t("VERIFY")}
      </button>

      <div className="login-v2-resend">
        <span>{t("CS_DIDNT_RECEIVE_OTP")}</span>
        {secondsLeft > 0 && <span>{t("CS_REQUEST_NEW_OTP_IN", { seconds: secondsLeft })}</span>}
        <button className="login-v2-link-btn" onClick={handleResend} disabled={secondsLeft > 0}>
          {t("CS_RESEND_OTP")}
        </button>
      </div>
    </div>
  );
};

export default OtpStep;
