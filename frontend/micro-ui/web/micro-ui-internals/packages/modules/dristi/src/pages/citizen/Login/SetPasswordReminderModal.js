import React from "react";
import Modal from "../../../components/Modal";
import { CardText } from "@egovernments/digit-ui-react-components";

/**
 * Shown after a successful OTP login when the user has not set a password yet
 * and has not opted out via "Don't Remind Me Again".
 */
const SetPasswordReminderModal = ({ t, onSetPassword, onRemindLater, onDontRemindAgain }) => {
  return (
    <Modal
      headerBarMain={<h1 className="heading-m">{t("SET_PASSWORD_REMINDER_TITLE")}</h1>}
      actionSaveLabel={t("SET_PASSWORD")}
      actionSaveOnSubmit={onSetPassword}
      actionCancelLabel={t("REMIND_ME_LATER")}
      actionCancelOnSubmit={onRemindLater}
      actionCustomLabel={t("DONT_REMIND_ME_AGAIN")}
      actionCustomLabelSubmit={onDontRemindAgain}
      className="set-password-reminder-modal"
    >
      <CardText>{t("SET_PASSWORD_REMINDER_MESSAGE")}</CardText>
    </Modal>
  );
};

export default SetPasswordReminderModal;
