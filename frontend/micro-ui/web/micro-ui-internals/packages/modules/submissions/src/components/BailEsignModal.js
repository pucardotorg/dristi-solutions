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
      actionSaveLabel={t("PROCEED")}
      isDisabled={!isSigned}
      actionSaveOnSubmit={() => {
        handleProceed();
      }}
      className={"submission-add-signature-modal"}
    >
      <div style={{ paddingTop: "10px" }}>
        <InfoCard
          variant={"default"}
          label={t("PLEASE_NOTE")}
          additionalElements={[
            <p>
              {t("YOU_ARE_ADDING_YOUR_SIGNATURE_TO_THE")}{" "}
              <span style={{ fontWeight: "bold" }}>{forWitnessDeposition ? t("WITNESS_DEPOSITION") : t("BAIL_BOND")}</span>
            </p>,
          ]}
          inline
          textStyle={{}}
          className={`custom-info-card`}
        />
        <div className="add-signature-main-div">
          {!isSigned ? (
            <div className="not-signed">
              <h1 style={{ color: "#3d3c3c", fontSize: "24px", fontWeight: "bold" }}>{t("YOUR_SIGNATURE")}</h1>
              <div className="buttons-div">
                <Button
                  label={t("CS_ESIGN_AADHAR")}
                  onClick={handleClickEsign}
                  className={"upload-signature"}
                  labelClassName={"submission-upload-signature-label"}
                ></Button>
              </div>
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
