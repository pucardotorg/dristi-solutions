import React from "react";

const RocketIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2 0-2.8a2 2 0 0 0-3 .8ZM12 15l-3-3a12 12 0 0 1 2.9-5.4A9.4 9.4 0 0 1 21 3a9.4 9.4 0 0 1-3.6 9.1A12 12 0 0 1 12 15ZM9 12H5s.5-2.8 2-4c1.7-1.3 5 0 5 0M12 15v4s2.8-.5 4-2c1.3-1.7 0-5 0-5" />
    <circle cx="15" cy="9" r="1.2" />
  </svg>
);

/**
 * Intermediate prompt shown (over the home screen after login) when the user has no password yet.
 * It offers three choices before the actual Set Password flow. Styling is self-contained so it can
 * render anywhere, not only inside the `.login-v2` scope.
 */
const SetPasswordPromptModal = ({ t, onSetPassword, onRemindLater, onDontRemindAgain }) => {
  return (
    <div className="pw-prompt-overlay">
      <div className="pw-prompt-modal">
        <div className="pw-prompt-icon">
          <RocketIcon />
        </div>
        <h3 className="pw-prompt-title">{t("SET_PASSWORD_PROMPT_TITLE")}</h3>
        <p className="pw-prompt-text">{t("SET_PASSWORD_PROMPT_MODAL_MESSAGE")}</p>
        <div className="pw-prompt-actions">
          <button className="pw-prompt-btn pw-prompt-btn-primary" onClick={onSetPassword}>
            {t("CS_SET_PASSWORD")}
          </button>
          <button className="pw-prompt-btn pw-prompt-btn-outline" onClick={onRemindLater}>
            {t("CS_REMIND_ME_LATER")}
          </button>
          <button className="pw-prompt-btn pw-prompt-btn-ghost" onClick={onDontRemindAgain}>
            {t("CS_DONT_REMIND_AGAIN")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetPasswordPromptModal;
