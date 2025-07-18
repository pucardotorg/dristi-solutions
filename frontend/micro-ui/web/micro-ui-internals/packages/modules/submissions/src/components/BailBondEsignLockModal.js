import React from "react";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import { BlackTickIcon, FileDownloadIcon } from "@egovernments/digit-ui-module-dristi/src/icons/svgIndex";
import CustomCopyTextDiv from "@egovernments/digit-ui-module-dristi/src/components/CustomCopyTextDiv";
import { Banner, CardLabel } from "@egovernments/digit-ui-react-components";

function BailBondEsignLockModal({ t, handleSaveOnSubmit, userType, filingNumber, bailBondSignatureURL }) {
  const orderModalInfo = {
    header: "BAIL_BOND_BANNER_HEADER",
    url: [
      {
        value: bailBondSignatureURL,
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
      className={"orders-add-bulk-list-modal"}
      cancelButtonBody={<FileDownloadIcon></FileDownloadIcon>}
      popupStyles={{ width: "700px", borderRadius: "4px" }}
      style={{ width: "100%" }}
    >
      <div style={{ padding: "8px 0" }}>
        <div>
          <Banner
            successful={true}
            message={t(orderModalInfo?.header)}
            headerStyles={{ fontSize: "32px" }}
            style={{ minWidth: "100%" }}
            svg={<BlackTickIcon color={"white"} />}
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

export default BailBondEsignLockModal;
