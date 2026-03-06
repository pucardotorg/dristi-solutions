import { Card } from "@egovernments/digit-ui-react-components";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import OrderReviewModal from "../../../../../orders/src/pageComponents/OrderReviewModal";
import useGetOrders from "../../../hooks/dristi/useGetOrders";
import { CustomArrowOut } from "../../../icons/svgIndex";
import { useHistory } from "react-router-dom";

const OrderDrafts = ({ caseData, setOrderModal }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const filingNumber = caseData.filingNumber;
  const caseId = caseData.id;
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState({});
  const caseCourtId = useMemo(() => caseData?.case?.courtId, [caseData]);

  const { data: ordersRes, refetch: refetchOrdersData, isLoading: isOrdersLoading } = useGetOrders(
    {
      criteria: {
        filingNumber: filingNumber,
        tenantId: tenantId,
        status: "DRAFT_IN_PROGRESS",
        ...(caseCourtId && { courtId: caseCourtId }),
      },
    },
    {},
    filingNumber,
    filingNumber
  );

  const orderResList = useMemo(() => ordersRes?.list, [ordersRes]);

  return orderResList?.length ? (
    <React.Fragment>
      <Card
        style={{
          width: "100%",
          marginTop: "10px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: "24px",
              lineHeight: "28.8px",
              color: "#231F20",
            }}
          >
            Drafts ({orderResList?.length})
          </div>
          <div
            onClick={() => setOrderModal(orderResList)}
            style={{ cursor: "pointer", fontWeight: 500, fontSize: "16px", lineHeight: "20px", color: "#0A5757" }}
          >
            {t("VIEW_ALL_LINK")}
          </div>
        </div>
        <div style={{ display: "flex", gap: "16px", marginTop: "10px" }}>
          {orderResList?.slice(0, 3)?.map((order) => (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "4px",
                width: "33%",
                cursor: "pointer",
                background: "#ECF3FD66",
              }}
              onClick={() => {
                setCurrentOrder(order);
                history.push(`/${window.contextPath}/employee/orders/generate-order?filingNumber=${filingNumber}&orderNumber=${order.orderNumber}`, {
                  caseId: caseId,
                  tab: "Orders",
                });
              }}
            >
              <div style={{ width: "100%", display: "flex", justifyContent: "space-between" }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "16px",
                    lineHeight: "18.75px",
                    color: "#101828",
                  }}
                >
                  {order?.orderCategory === "COMPOSITE" ? order?.orderTitle : t(order?.orderTitle) || t(order?.orderType)}
                </div>
                <CustomArrowOut />
              </div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: "14px",
                  lineHeight: "20px",
                  color: "#101828",
                  marginTop: "12px",
                }}
              >
                Deadline:{" "}
                <span
                  style={{
                    fontWeight: 500,
                    fontSize: "14px",
                    lineHeight: "20px",
                  }}
                ></span>
              </div>
            </div>
          ))}
        </div>
      </Card>
      {showReviewModal && (
        <OrderReviewModal
          t={t}
          order={currentOrder}
          setShowReviewModal={setShowReviewModal}
          setShowsignatureModal={() => {}}
          handleSaveDraft={() => {}}
          showActions={false}
        />
      )}
    </React.Fragment>
  ) : null;
};

export default OrderDrafts;
