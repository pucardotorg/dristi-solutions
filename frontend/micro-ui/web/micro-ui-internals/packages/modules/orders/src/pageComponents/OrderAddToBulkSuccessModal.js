import React from "react";
import Modal from "../../../dristi/src/components/Modal";
import { BlackTickIcon, FileDownloadIcon } from "../../../dristi/src/icons/svgIndex";
import CustomCopyTextDiv from "../../../dristi/src/components/CustomCopyTextDiv";
import { Banner, CardLabel, CloseSvg } from "@egovernments/digit-ui-react-components";

const CloseBtn = (props) => {
  return (
    <div onClick={props?.onClick} style={{ height: "100%", display: "flex", alignItems: "center", paddingRight: "20px", cursor: "pointer" }}>
      <CloseSvg />
    </div>
  );
};

function OrderAddToBulkSuccessModal({ order, t, handleDownloadOrders, handleCloseSuccessModal }) {
  const orderModalInfo = {
    header: "CS_ORDER_ADDED_TO_BULK_SIGN_LIST",
    subHeader: "CS_ORDER_ADDED_TO_BULK_SIGN_LIST_SUBTEXT",
    caseInfo: [
      {
        key: `${t("ORDER_ID")} : ${
          order?.orderCategory === "COMPOSITE" ? order?.orderTitle : order?.orderType ? t(`ORDER_TYPE_${order?.orderType}`) : order?.orderTitle
        }`,
        value: order?.orderNumber,
        copyData: true,
        isLocalization: false,
      },
    ],
  };

  return (
    <Modal
      actionCancelLabel={t("DOWNLOAD_ORDER")}
      actionCancelOnSubmit={handleDownloadOrders}
      actionSaveLabel={t("CS_COMMON_CLOSE")}
      actionSaveOnSubmit={handleCloseSuccessModal}
      className={"orders-add-bulk-list-modal"}
      cancelButtonBody={<FileDownloadIcon></FileDownloadIcon>}
    >
      <div style={{ padding: "8px 0" }}>
        <div>
          <Banner
            successful={true}
            message={t(orderModalInfo?.header)}
            headerStyles={{ fontSize: "32px" }}
            style={{ minWidth: "100%", background: "#FFF6E8", color: "black" }}
            svg={<BlackTickIcon />}
          ></Banner>
          {orderModalInfo?.subHeader && (
            <CardLabel style={{ fontSize: "16px", fontWeight: 400, marginBottom: "10px", textAlign: "center" }}>
              {t(orderModalInfo?.subHeader)}
            </CardLabel>
          )}
          {
            <CustomCopyTextDiv
              t={t}
              keyStyle={{ margin: "8px 0px" }}
              valueStyle={{ margin: "8px 0px", fontWeight: 700 }}
              data={orderModalInfo?.caseInfo}
              cardStyle={{ marginBottom: "16px" }}
              subCardStyle={{ marginBottom: 0 }}
            />
          }
        </div>
      </div>
    </Modal>
  );
}

export default OrderAddToBulkSuccessModal;
