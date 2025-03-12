import { CloseSvg } from "@egovernments/digit-ui-components";
import React, { useEffect, useMemo, useState } from "react";
import Modal from "../../../dristi/src/components/Modal";
import { Toast } from "@egovernments/digit-ui-react-components";
import { OrderWorkflowAction } from "../utils/orderWorkflow";
import { orderManagementService, ordersService } from "../hooks/services";
import { Loader } from "@egovernments/digit-ui-react-components";
import axios from "axios";

function OrderBulkReviewModal({ t, showActions, refetchOrdersData, pendingSignOrderList, setShowBulkSignAllModal, setIssueBulkSuccessData }) {
  const [pendingOrderList, setPendingOrderList] = useState(pendingSignOrderList);
  const [selectedOrder, setSelectedOrder] = useState(pendingOrderList?.[0]);
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const DocViewerWrapper = Digit?.ComponentRegistryService?.getComponent("DocViewerWrapper");
  const [showOrderDeleteModal, setShowOrderDeleteModal] = useState(false);
  const [deleteOrder, setDeleteOrder] = useState(null);
  const [showErrorToast, setShowErrorToast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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
        const response = await axios.post("http://localhost:1620/", {
          criteria: order,
        });
        responses?.push(response?.data);
      } catch (error) {
        console.error(`Error fetching order ${order?.orderNumebr}:`, error);
      }
    });

    await Promise.allSettled(requests);
    console.log("Successful Responses:", responses);
    return responses;
  };

  const handleSignLater = async () => {
    setIsLoading(true);
    const criteriaList = pendingOrderList?.map((order) => {
      return {
        fileStoreId: order?.documents?.find((doc) => doc?.documentType === "UNSIGNED")?.fileStore || "",
        orderNumber: order?.orderNumber,
        placeholder: order?.orderCategory === "COMPOSITE" ? "Fduy44hjb" : "Signature",
      };
    });
    try {
      const response = await orderManagementService.getOrdersToSign(
        {
          criteria: criteriaList,
        },
        { tenantId }
      );
      fetchResponseFromXmlRequest(response?.orderList)
        .then((data) => console.log("Final Response List:", data))
        .catch((err) => console.error("Unexpected Error:", err));
      setIssueBulkSuccessData({ show: true, bulkSignOrderListLength: response?.orderList?.length });
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
            setShowOrderDeleteModal(false);
          }}
          actionSaveLabel={t("CS_BULK_REMOVE")}
          actionSaveOnSubmit={() => handleRemoveOrderFromBulkList(OrderWorkflowAction.DELETE)}
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
