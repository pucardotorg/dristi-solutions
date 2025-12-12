import { CloseSvg } from "@egovernments/digit-ui-components";
import React, { useEffect, useMemo, useState } from "react";
import Modal from "../../../dristi/src/components/Modal";
import { Toast } from "@egovernments/digit-ui-react-components";
import { OrderWorkflowAction } from "../utils/orderWorkflow";
import { ordersService } from "../hooks/services";
import { Loader, TextInput } from "@egovernments/digit-ui-react-components";

function OrderBulkReviewModal({ t, history, orderDetails }) {
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const userInfo = Digit.UserService.getUser()?.info;
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo?.type]);
  const DocViewerWrapper = Digit?.ComponentRegistryService?.getComponent("DocViewerWrapper");
  const [showOrderDeleteModal, setShowOrderDeleteModal] = useState(false);
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
      setShowErrorToast({ label: t("FAILED_TO_REMOVE_ORDER_FROM_BULK_LIST"), error: true });
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
                  {/* <h3 style={{ marginTop: 0, marginBottom: "2px" }}>{t("BUSINESS_OF_THE_DAY")} </h3>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <TextInput
                      className="field desktop-w-full"
                      disable={true}
                      defaultValue={orderDetails?.additionalDetails?.businessOfTheDay}
                      style={{ minWidth: "500px" }}
                      textInputStyle={{ maxWidth: "100%" }}
                    />
                  </div> */}
                </div>
              </React.Fragment>
            }
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
