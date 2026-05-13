import { CardText, Modal } from "@egovernments/digit-ui-react-components";
import PropTypes from "prop-types";
import React from "react";
import { useTranslation } from "react-i18next";
import { CloseBtn, Heading } from "@egovernments/digit-ui-module-dristi/src/components/ModalComponents";

const MOBILE_BREAKPOINT = 780;

const LogoutDialog = ({ onSelect, onCancel, onDismiss }) => {
  const { t } = useTranslation();
  const [isMobileView, setIsMobileView] = React.useState(() => typeof window !== "undefined" && window.innerWidth <= MOBILE_BREAKPOINT);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= MOBILE_BREAKPOINT);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobileView ? (
    <Modal
      popupStyles={{
        height: "174px",
        maxHeight: "174px",
        width: "324px",
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      }}
      popupModuleActionBarStyles={{
        display: "flex",
        flex: 1,
        justifyContent: "flex-start",
        width: "100%",
        position: "absolute",
        left: 0,
        bottom: 0,
        padding: "18px",
      }}
      style={{
        flex: 1,
      }}
      popupModuleMianStyles={{
        padding: "18px",
      }}
      headerBarMain={<Heading label={t("CORE_LOGOUT_WEB_HEADER")} />}
      headerBarEnd={<CloseBtn onClick={onDismiss} isMobileView={isMobileView} />}
      actionCancelLabel={t("CORE_LOGOUT_CANCEL")}
      actionCancelOnSubmit={onCancel}
      actionSaveLabel={t("CORE_LOGOUT_WEB_YES")}
      actionSaveOnSubmit={onSelect}
      formId="modal-action"
    >
      <div>
        <CardText style={{ margin: 0 }}>{t("CORE_LOGOUT_WEB_CONFIRMATION_MESSAGE") + " "}</CardText>
      </div>
    </Modal>
  ) : (
    <Modal
      popupModuleMianStyles={{}}
      headerBarMain={<Heading label={t("CORE_LOGOUT_WEB_HEADER")} />}
      headerBarEnd={<CloseBtn onClick={onDismiss} isMobileView={false} />}
      actionCancelLabel={t("CORE_LOGOUT_CANCEL")}
      actionCancelOnSubmit={onCancel}
      actionSaveLabel={t("CORE_LOGOUT_WEB_YES")}
      actionSaveOnSubmit={onSelect}
      formId="modal-action"
    >
      <div>
        <CardText style={{ marginBottom: "54px", color: "#0B0C0C", textAlign: "center", fontSize: "24px" }}>
          {t("CORE_LOGOUT_WEB_CONFIRMATION_MESSAGE") + " "}
          <strong>{t("CORE_LOGOUT_MESSAGE")}</strong>
        </CardText>
      </div>
    </Modal>
  );
};

LogoutDialog.propTypes = {
  onSelect: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onDismiss: PropTypes.func.isRequired,
};

export default LogoutDialog;
