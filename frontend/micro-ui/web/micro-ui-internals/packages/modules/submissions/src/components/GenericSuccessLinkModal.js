import React from "react";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import { BlackTickIcon, FileDownloadIcon } from "@egovernments/digit-ui-module-dristi/src/icons/svgIndex";
import CustomCopyTextDiv from "@egovernments/digit-ui-module-dristi/src/components/CustomCopyTextDiv";
import { Banner, CardLabel } from "@egovernments/digit-ui-react-components";

function GenericSuccessLinkModal({ t, handleSaveOnSubmit, userType, filingNumber, signatureUrl, header="BAIL_BOND_BANNER_HEADER" }) {
  const orderModalInfo = {
    header: header,
    url: [
      {
        value: signatureUrl,
        customText: "E-Sign Link",
        copyData: true,
        isLocalization: false,
      },
    ],
  };

  return (
    <Modal
      actionSaveLabel={t("CS_CLOSE")}
      actionSaveOnSubmit={handleSaveOnSubmit}
      className={"submission-success-modal bailbondEsign"}
      cancelButtonBody={<FileDownloadIcon></FileDownloadIcon>}
      popupStyles={{ width: "700px", borderRadius: "4px" }}
      style={{ width: "100%" }}
    >
      <div style={{ padding: "8px 0" }}>
        <div>
          <Banner
            whichSvg={"tick"}
            successful={true}
            message={t(orderModalInfo?.header)}
            headerStyles={{ fontSize: "32px" }}
            style={{ minWidth: "100%" }}
          ></Banner>

          {orderModalInfo?.subHeader && (
            <CardLabel style={{ fontSize: "16px", fontWeight: 400, marginBottom: "10px", textAlign: "center" }}>
              {t(orderModalInfo?.subHeader)}
            </CardLabel>
          )}

          <CustomCopyTextDiv
            t={t}
            keyStyle={{ margin: "8px 0px" }}
            valueStyle={{ margin: "8px 0px", fontWeight: 700 }}
            data={orderModalInfo?.url}
            cardStyle={{ marginBottom: "16px" }}
            subCardStyle={{ marginBottom: 0, justifyContent: "center" }}
            isCenter={true}
            isShowValue={false}
            customTextStyle={{ color: "#007E7E" }}
          />
        </div>
      </div>
    </Modal>
  );
}

export default GenericSuccessLinkModal;
