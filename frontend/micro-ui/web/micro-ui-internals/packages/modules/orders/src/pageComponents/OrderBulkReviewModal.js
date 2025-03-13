import { CloseSvg } from "@egovernments/digit-ui-components";
import React, { useEffect, useMemo, useState } from "react";
import Modal from "../../../dristi/src/components/Modal";
import { Toast } from "@egovernments/digit-ui-react-components";
import { OrderWorkflowAction } from "../utils/orderWorkflow";
import { orderManagementService, ordersService } from "../hooks/services";
import { Loader } from "@egovernments/digit-ui-react-components";
import axios from "axios";
import qs from "qs";

const parseXml = (xmlString, tagName) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "application/xml");

  const element = xmlDoc.getElementsByTagName(tagName)[0];
  return element ? element.textContent.trim() : null;
};

function OrderBulkReviewModal({ t, showActions, refetchOrdersData, pendingSignOrderList, setShowBulkSignAllModal, setIssueBulkSuccessData }) {
  const [pendingOrderList, setPendingOrderList] = useState(pendingSignOrderList);
  const [selectedOrder, setSelectedOrder] = useState(pendingOrderList?.[0]);
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const DocViewerWrapper = Digit?.ComponentRegistryService?.getComponent("DocViewerWrapper");
  const [showOrderDeleteModal, setShowOrderDeleteModal] = useState(false);
  const [deleteOrder, setDeleteOrder] = useState(null);
  const [showErrorToast, setShowErrorToast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const bulkSignUrl = window?.globalConfigs?.getConfig("BULK_SIGN_URL") || "http://localhost:1620";

  const closeToast = () => {
    setShowErrorToast(null);
  };

  useEffect(() => {
    if (showErrorToast) {
      const timer = setTimeout(() => {
        setShowErrorToast(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showErrorToast]);

  const Heading = (props) => {
    return <h1 className="heading-m">{props.label}</h1>;
  };

  const CloseBtn = (props) => {
    return (
      <div onClick={props?.onClick} style={{ height: "100%", display: "flex", alignItems: "center", cursor: "pointer" }}>
        <CloseSvg />
      </div>
    );
  };

  const orderFileStoreId = useMemo(() => {
    return selectedOrder?.documents?.find((doc) => doc?.documentType === "UNSIGNED")?.fileStore;
  }, [selectedOrder]);

  const showDocument = useMemo(() => {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {orderFileStoreId ? (
          <DocViewerWrapper
            docWidth={"calc(80vw* 62/ 100)"}
            docHeight={"60vh"}
            fileStoreId={orderFileStoreId}
            tenantId={tenantId}
            showDownloadOption={false}
          />
        ) : (
          <h2>{t("PREVIEW_DOC_NOT_AVAILABLE")}</h2>
        )}
      </div>
    );
  }, [orderFileStoreId, tenantId, t]);

  const handleRemoveOrderFromBulkList = async (action) => {
    setIsLoading(true);
    try {
      await ordersService
        .updateOrder(
          {
            order: {
              ...deleteOrder,
              workflow: { ...deleteOrder.workflow, action, documents: [{}] },
            },
          },
          { tenantId }
        )
        .then(async () => {
          setPendingOrderList((prevList) => prevList?.filter((prevOrder) => prevOrder?.id !== deleteOrder?.id));
          setSelectedOrder(() => {
            const updatedList = pendingOrderList?.filter((prevOrder) => prevOrder?.id !== deleteOrder?.id);
            return updatedList?.length > 0 ? updatedList?.[0] : null;
          });
          await refetchOrdersData();
        });
    } catch (e) {
      setShowErrorToast({ label: t("FAILED_TO_REMOVE_ORDER_FROM_BULK_LIST"), error: true });
      console.error("Failed to remove the order from bulk list", e);
    } finally {
      setIsLoading(false);
      setShowOrderDeleteModal(false);
      setDeleteOrder(null);
    }
  };

  const fetchResponseFromXmlRequest = async (orderRequestList) => {
    const responses = [];

    const requests = orderRequestList?.map(async (order) => {
      try {
        // URL encoding the XML request
        const formData = qs.stringify({ response: order?.request });
        const response = await axios.post(bulkSignUrl, formData, {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          },
        });

        const data = response?.data;

        if (parseXml(data, "status") !== "failed") {
          responses.push({
            orderNumber: order?.orderNumber,
            signedOrderData: parseXml(data, "data"),
            signed: true,
            errorMsg: null,
            tenantId: tenantId,
          });
        } else {
          responses.push({
            orderNumber: order?.orderNumber,
            signedOrderData: parseXml(data, "data"),
            signed: false,
            errorMsg: parseXml(data, "error"),
            tenantId: tenantId,
          });
        }
      } catch (error) {
        console.error(`Error fetching order ${order?.orderNumber}:`, error);
      }
    });

    await Promise.allSettled(requests);
    return responses;
  };

  const handleSignLater = async () => {
    setIsLoading(true);
    const criteriaList = pendingOrderList?.map((order) => {
      return {
        fileStoreId: order?.documents?.find((doc) => doc?.documentType === "UNSIGNED")?.fileStore || "",
        orderNumber: order?.orderNumber,
        placeholder: order?.orderCategory === "COMPOSITE" ? "Fduy44hjb" : "Signature",
        tenantId: tenantId,
      };
    });
    try {
      const response = await orderManagementService.getOrdersToSign(
        {
          criteria: criteriaList,
        },
        {}
      );
      await fetchResponseFromXmlRequest(response?.orderList).then(async (responseArray) => {
        const updateOrderResponse = await orderManagementService.updateSignedOrders(
          {
            signedOrders: responseArray,
          },
          {}
        );
        setIssueBulkSuccessData({ show: true, bulkSignOrderListLength: updateOrderResponse?.orders?.length });
        setShowBulkSignAllModal(false);
      });
    } catch (e) {
      setShowErrorToast({ label: t("FAILED_TO_PERFORM_BULK_SIGN"), error: true });
      console.error("Failed to perform bulk sign", e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <React.Fragment>
      <Modal
        headerBarMain={<Heading label={t("REVIEW_ORDERS_BULK_HEADING")} />}
        headerBarEnd={
          <CloseBtn
            onClick={async () => {
              if (isLoading) return;
              setShowBulkSignAllModal(false);
              await refetchOrdersData();
            }}
          />
        }
        actionSaveLabel={showActions && t("BULK_SIGN_ALL")}
        actionSaveOnSubmit={() => handleSignLater()}
        isDisabled={isLoading}
        className={"review-order-modal"}
      >
        {
          <div className="review-order-body-main">
            {isLoading ? (
              <div style={{ alignContent: "center", width: "100%" }}>
                <Loader />
              </div>
            ) : (
              <React.Fragment>
                <div className="review-bulk-order-modal-list-div">
                  {pendingOrderList?.map((order) => (
                    <div
                      className="review-bulk-order-type-side-stepper"
                      style={selectedOrder?.id === order?.id ? { backgroundColor: "#E8E8E8" } : { background: "none" }}
                      onClick={() => {
                        setSelectedOrder(order);
                      }}
                    >
                      <h1>{order?.orderCategory === "COMPOSITE" ? order?.orderTitle : t(order?.orderType)}</h1>
                      <CloseBtn
                        onClick={() => {
                          setShowOrderDeleteModal(true);
                          setDeleteOrder(order);
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="review-bulk-order-modal-document-div">{showDocument}</div>
              </React.Fragment>
            )}
          </div>
        }
        {showErrorToast && (
          <Toast
            error={showErrorToast?.error}
            label={showErrorToast?.label}
            isDleteBtn={true}
            onClose={closeToast}
            style={{ left: "calc(100% - 540px)", top: "92%" }}
          />
        )}
      </Modal>
      {showOrderDeleteModal && (
        <Modal
          headerBarMain={<Heading label={t("CONFIRM_BULK_REMOVAL")} />}
          headerBarEnd={
            <CloseBtn
              onClick={() => {
                setShowOrderDeleteModal(false);
              }}
            />
          }
          actionCancelLabel={t("CS_BULK_BACK")}
          actionCancelOnSubmit={() => {
            !isLoading && setShowOrderDeleteModal(false);
          }}
          actionSaveLabel={t("CS_BULK_REMOVE")}
          actionSaveOnSubmit={() => handleRemoveOrderFromBulkList(OrderWorkflowAction.SAVE_DRAFT)}
          style={{ height: "40px", background: "#BB2C2F" }}
          popupStyles={{ width: "35%" }}
          className={"review-order-modal"}
          isDisabled={isLoading}
          isBackButtonDisabled={isLoading}
          children={
            isLoading ? (
              <Loader />
            ) : (
              <div className="delete-warning-text">
                <h3 style={{ margin: "12px 24px" }}>{t("CONFIRM_BULK_REMOVAL_TEXT")}</h3>
              </div>
            )
          }
        />
      )}
    </React.Fragment>
  );
}

export default OrderBulkReviewModal;
