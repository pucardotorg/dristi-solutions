import React, { useMemo, useState } from "react";
import { CloseSvg, FormComposerV2 } from "@egovernments/digit-ui-react-components";
import { VerifyMultipartyLitigantConfig } from "../../../configs/VerifyMultipartyLitigantconfig";
import ButtonSelector from "@egovernments/digit-ui-module-dristi/src/components/ButtonSelector";
import { ForwardArrow, BackwardArrow } from "@egovernments/digit-ui-module-dristi/src/icons/svgIndex";

const CloseBtn = (props) => {
  return (
    <div onClick={props?.onClick} style={{ height: "100%", display: "flex", alignItems: "center", paddingRight: "20px", cursor: "pointer" }}>
      <CloseSvg />
    </div>
  );
};

const Heading = (props) => {
  return (
    <div className="evidence-title">
      <h1 className="heading-m">{props.label}</h1>
    </div>
  );
};

const getStyles = () => ({
  buttonStyles: {
    border: "1px solid #C5C5C5",
    boxShadow: "none",
    height: "32px",
    borderRadius: "4px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
});

const fieldStyle = { marginRight: 0, width: "100%" };

const MultiPartyLitigant = ({ t, label, closeModal }) => {
  const Modal = window?.Digit?.ComponentRegistryService?.getComponent("Modal");
  const styles = getStyles();
  const [isForward, setIsForward] = useState(false);

  const modifiedFormConfig = useMemo(() => {
    const applyUiChanges = (config) => ({
      ...config,
      head: "Accused's Basic Details",
      body: config?.body?.map((body) => {
        if (body?.labelChildren === "optional") {
          return {
            ...body,
            labelChildren: <span style={{ color: "#77787B" }}>&nbsp;{`${t("CS_IS_OPTIONAL")}`}</span>,
          };
        }
        return body;
      }),
    });

    return VerifyMultipartyLitigantConfig?.map((config) => applyUiChanges(config));
  }, [t]);

  // TODO : change with you logic
  const handleForward = () => {
    setIsForward(!isForward);
  };

  return (
    <React.Fragment>
      <Modal
        headerBarEnd={<CloseBtn onClick={closeModal} />}
        formId="modal-action"
        headerBarMain={<Heading label={label} />}
        className={`join-a-case-modal`}
      >
        <FormComposerV2
          config={modifiedFormConfig}
          // defaultValues={defaultFormValue}
          // onFormValueChange={onFormValueChange}
          // onSubmit={handleOpenReview}
          fieldStyle={fieldStyle}
          // key={formKey}
          className={"multi-litigant-composer"}
          // isDisabled={isSubmitDisabled}
        />
        <div className={"multi-litigant-composer-footer"}>
          <div className={"multi-litigant-composer-footer-left"}>
            <ButtonSelector
              style={{ ...styles.buttonStyles, backgroundColor: isForward ? "#EEEEEE" : "#ffff" }}
              ButtonBody={<BackwardArrow />}
              onSubmit={handleForward}
            />
            <ButtonSelector
              style={{ ...styles.buttonStyles, backgroundColor: !isForward ? "#EEEEEE" : "#ffff" }}
              ButtonBody={<ForwardArrow />}
              onSubmit={handleForward}
            />
          </div>

          <div className={"multi-litigant-composer-footer-right"}>
            <ButtonSelector theme={"border"} textStyles={{ margin: 0 }} label={t("JOIN_CASE_BACK_TEXT")} />
            <ButtonSelector textStyles={{ margin: 0 }} label={t("PROCEED_TEXT")} />
          </div>
        </div>
      </Modal>
    </React.Fragment>
  );
};

export default MultiPartyLitigant;
