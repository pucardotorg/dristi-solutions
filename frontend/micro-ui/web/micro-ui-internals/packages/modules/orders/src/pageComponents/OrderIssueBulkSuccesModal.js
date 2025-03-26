import React from "react";
import Modal from "../../../dristi/src/components/Modal";
import CustomCopyTextDiv from "../../../dristi/src/components/CustomCopyTextDiv";
import { Banner, CardLabel } from "@egovernments/digit-ui-react-components";
import { numberToWords } from "../utils";

function OrderIssueBulkSuccesModal({ t, history, userType, bulkSignOrderListLength }) {
  const getFormattedDate = () => {
    const currentDate = new Date();
    const year = String(currentDate.getFullYear());
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");
    return `${day}/${month}/${year}`;
  };

  const orderModalInfo = {
    header: `${t("YOU_HAVE_SUCCESSFULLY_ISSUED_BULK_ORDER")} ${numberToWords(bulkSignOrderListLength)} ${t("ISSUE_ORDERS")} `,
    subHeader: "YOU_HAVE_SUCCESSFULLY_ISSUED_BULK_ORDER_TEXT",
    caseInfo: [
      {
        key: t("ORDER_ISSUE_DATE"),
        value: getFormattedDate(),
        copyData: false,
      },
    ],
  };

  return (
    <Modal
      actionSaveLabel={t("BULK_SUCCESS_CLOSE")}
      actionSaveOnSubmit={() => history.replace(`/${window?.contextPath}/${userType}/home/home-pending-task`)}
      className={"orders-issue-bulk-success-modal"}
    >
      <div>
        <Banner
          whichSvg={"tick"}
          successful={true}
          message={orderModalInfo?.header}
          headerStyles={{ fontSize: "32px" }}
          style={{ minWidth: "100%" }}
        ></Banner>
        {orderModalInfo?.subHeader && <CardLabel>{t(orderModalInfo?.subHeader)}</CardLabel>}
        {
          <CustomCopyTextDiv
            t={t}
            keyStyle={{ margin: "8px 0px" }}
            valueStyle={{ margin: "8px 0px", fontWeight: 700 }}
            data={orderModalInfo?.caseInfo}
          />
        }
      </div>
    </Modal>
  );
}

export default OrderIssueBulkSuccesModal;
