import React from "react";
import Modal from "./Modal";
import { CloseSvg, Loader, TextArea } from "@egovernments/digit-ui-react-components";
import SelectCustomNote from "./SelectCustomNote";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { sanitizeData } from "../Utils";

function SendCaseBackModal({
  loading,
  comment,
  setComment,
  totalErrors,
  onCancel,
  onSubmit,
  t,
  heading,
  type,
  actionCancelLabel,
  actionSaveLabel,
  handleCloseModal,
}) {
  const handleChange = (event) => {
    const newValue = sanitizeData(event.target.value);
    setComment(newValue);
  };

  const Heading = (props) => {
    return <h1 className="heading-m">{props.label}</h1>;
  };
  const history = useHistory();
  const CloseBtn = (props) => {
    return (
      <div onClick={props?.onClick} style={{ height: "100%", display: "flex", alignItems: "center", paddingRight: "20px", cursor: "pointer" }}>
        <CloseSvg />
      </div>
    );
  };
  const textAreaHeader = {
    registerCase: t("COMMENTS_FOR_JUDGE"),
    sendCaseBack: t("COMMENTS_FOR_SEND_BACK"),
  };
  const subtexts = {
    registerCase: t("CS_NO_ERROR_MARKED"),
    sendCaseBack: `${t("CS_YOU_HAVE_MARKED")} ${totalErrors} ${t("CS_COMMON_ERRORS")} ${t("CS_IN_THIS_FILE")}`,
    sendCaseBackPotential: `${t("CS_CONFIRMING")} ${totalErrors} ${t("CS_POTENTIAL_ERRORS")} ${t("CS_FLAGGED_BY_SYSTEM")}`,
  };
  const isDisabled = (type === "sendCaseBack" || type === "sendCaseBackPotential") && totalErrors === 0;
  const nodeConfig = {
    populators: {
      inputs: [
        {
          infoHeader: "CS_COMMON_NOTE",
          infoText: "SCRUTINY_SEND_CASE_NOTE",
          infoTooltipMessage: "SCRUTINY_SEND_CASE_NOTE",
          type: "InfoComponent",
          linkText: "VIEW_CHECKLIST",
        },
      ],
    },
  };
  return (
    <Modal
      headerBarEnd={
        <CloseBtn
          onClick={() => {
            if (!loading) handleCloseModal ? handleCloseModal() : onCancel();
          }}
        />
      }
      actionCancelLabel={t(actionCancelLabel)}
      actionCancelOnSubmit={onCancel}
      actionSaveLabel={t(actionSaveLabel)}
      actionSaveOnSubmit={onSubmit}
      formId="modal-action"
      isDisabled={isDisabled || loading}
      isBackButtonDisabled={loading}
      headerBarMain={<Heading label={t(heading)} />}
      className="case-types"
    >
      {loading ? (
        <Loader />
      ) : (
        <div style={{ padding: "16px 24px" }}>
          <div>
            <SelectCustomNote
              config={nodeConfig}
              t={t}
              onClick={() => {
                handleCloseModal ? handleCloseModal() : onCancel();
              }}
            />
          </div>
          <p>{subtexts[type]}</p>
          {(type === "registerCase" || type === "sendCaseBack") && (
            <React.Fragment>
              <p>{textAreaHeader[type]}</p>
              <TextArea
                style={{ marginBottom: "0px" }}
                name={textAreaHeader[type]}
                value={comment}
                onChange={handleChange}
                maxlength="1000"
              ></TextArea>
            </React.Fragment>
          )}
        </div>
      )}
    </Modal>
  );
}

export default SendCaseBackModal;
