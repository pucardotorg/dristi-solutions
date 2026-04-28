import React, { useMemo, useState } from "react";
import Modal from "../../../dristi/src/components/Modal";
import { OrderWorkflowAction } from "../utils/orderWorkflow";
import { ordersService } from "../hooks/services";
import { Loader } from "@egovernments/digit-ui-react-components";
import { CloseBtn, Heading } from "@egovernments/digit-ui-module-dristi/src/components/ModalComponents";
import CustomToast from "@egovernments/digit-ui-module-dristi/src/components/CustomToast";

function OrderBulkReviewModal({ t, history, orderDetails }) {
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const userInfo = Digit.UserService.getUser()?.info;
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo?.type]);
  const DocViewerWrapper = Digit?.ComponentRegistryService?.getComponent("DocViewerWrapper");
  const [showOrderDeleteModal, setShowOrderDeleteModal] = useState(false);
  const [showToast, setShowToast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const orderFileStoreId = useMemo(() => {
    return orderDetails?.documents?.find((doc) => doc?.documentType === "UNSIGNED")?.fileStore;
  }, [orderDetails]);

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
          <DocViewerWrapper docWidth={"74vw"} docHeight={"50vh"} fileStoreId={orderFileStoreId} tenantId={tenantId} showDownloadOption={false} />
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
              ...orderDetails,
              workflow: { ...orderDetails.workflow, action, documents: [{}] },
            },
          },
          { tenantId }
        )
        .then(async (response) => {
          history.replace(
            `/${window.contextPath}/${userType}/orders/generate-order?filingNumber=${response?.order?.filingNumber}&orderNumber=${response?.order?.orderNumber}`
          );
        });
    } catch (e) {
      const errorId = e?.response?.headers?.["x-correlation-id"] || e?.response?.headers?.["X-Correlation-Id"];
      setShowToast({ label: t("FAILED_TO_REMOVE_ORDER_FROM_BULK_LIST"), error: true, errorId });
      console.error("Failed to remove the order from bulk list", e);
    } finally {
      setIsLoading(false);
      setShowOrderDeleteModal(false);
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
              history.goBack();
            }}
          />
        }
        actionSaveLabel={t("BULK_EDIT")}
        actionSaveOnSubmit={() => setShowOrderDeleteModal(true)}
        isDisabled={isLoading}
        className={"review-order-modal"}
      >
        {
          <div className="review-order-body-main">
            {
              <React.Fragment>
                <div className="review-order-modal-document-div" style={{ padding: "0px 20px", width: "100%", overflow: "auto" }}>
                  {showDocument}
                </div>
              </React.Fragment>
            }
          </div>
        }
        {showToast && (
          <CustomToast
            error={showToast?.error}
            label={showToast?.label}
            errorId={showToast?.errorId}
            onClose={() => setShowToast(null)}
            duration={showToast?.errorId ? 7000 : 5000}
          />
        )}
      </Modal>
      {showOrderDeleteModal && (
        <Modal
          headerBarMain={<Heading label={t("CONFIRM_BULK_REMOVAL")} />}
          headerBarEnd={<CloseBtn onClick={() => !isLoading && setShowOrderDeleteModal(false)} />}
          actionCancelLabel={t("CS_BULK_BACK")}
          actionCancelOnSubmit={() => setShowOrderDeleteModal(false)}
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
