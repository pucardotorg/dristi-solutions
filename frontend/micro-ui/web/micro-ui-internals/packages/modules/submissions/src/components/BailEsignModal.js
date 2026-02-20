import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import React, { useEffect, useState } from "react";
import { Button, CloseSvg, InfoCard } from "@egovernments/digit-ui-components";
import useESignOpenApi from "../hooks/submissions/useESignOpenApi";

const Heading = (props) => {
  return <h1 className="heading-m">{props.label}</h1>;
};

const CloseBtn = (props) => {
  return (
    <div onClick={props?.onClick} style={{ height: "100%", display: "flex", alignItems: "center", paddingRight: "20px", cursor: "pointer" }}>
      <CloseSvg />
    </div>
  );
};

const BailEsignModal = ({
  t,
  handleProceed,
  handleCloseSignaturePopup,
  fileStoreId,
  signPlaceHolder,
  mobileNumber,
  forWitnessDeposition = false,
  handleMockESign,
  customizedNote,
}) => {
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const [isSigned, setIsSigned] = useState(false);
  const { handleEsign, checkSignStatus } = useESignOpenApi();
  const [pageModule, setPageModule] = useState("ci");
  const name = "signature";
  const mockESignEnabled = window?.globalConfigs?.getConfig("mockESignEnabled") === "true" ? true : false;

  const handleClickEsign = () => {
    if (mockESignEnabled) {
      handleMockESign();
    } else {
      sessionStorage.setItem("mobileNumber", mobileNumber);
      handleEsign(name, pageModule, fileStoreId, signPlaceHolder);
    }
  };

  useEffect(() => {
    checkSignStatus(name, setIsSigned);
  }, []);

  return (
    <Modal
      headerBarMain={<Heading label={t("ADD_SIGNATURE")} />}
      headerBarEnd={<CloseBtn onClick={() => handleCloseSignaturePopup()} />}
      actionCancelLabel={t("BACK")}
      actionCancelOnSubmit={() => handleCloseSignaturePopup()}
      actionSaveLabel={isSigned ? t("PROCEED") : t("PROCEED_TO_E_SIGN")}
      isDisabled={false}
      actionSaveOnSubmit={() => {
        if (!isSigned) {
          handleClickEsign();
        } else {
          handleProceed();
        }
      }}
      className={"submission-add-signature-modal responsive-signature-modal"}
    >
      <div style={{ paddingTop: "10px" }}>
        <InfoCard
          variant={"default"}
          label={t("PLEASE_NOTE")}
          additionalElements={[<p>{customizedNote ? t(customizedNote) : t("BAIL_BOND_WITNESS_POPUP_NOTES")}</p>]}
          inline
          textStyle={{}}
          className={`custom-info-card`}
        />
        <div className="add-signature-main-div">
          {!isSigned ? (
            <div className="not-signed">
              <h1 style={{ color: "#3d3c3c", fontSize: "24px", fontWeight: "bold" }}>{t("YOUR_SIGNATURE")}</h1>
            </div>
          ) : (
            <div className="signed">
              <h1>{t("YOUR_SIGNATURE")}</h1>
              <span>{t("SIGNED")}</span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default BailEsignModal;
