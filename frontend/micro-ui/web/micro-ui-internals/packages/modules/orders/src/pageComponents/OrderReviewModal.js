import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "react-query";
import Modal from "../../../dristi/src/components/Modal";
import { Urls } from "../hooks/services/Urls";
import CustomToast from "@egovernments/digit-ui-module-dristi/src/components/CustomToast";
import { OrderWorkflowAction } from "../utils/orderWorkflow";
import axiosInstance from "@egovernments/digit-ui-module-core/src/Utils/axiosInstance";
import { ORDER_CATEGORIES } from "../utils/constants";
import { CloseBtn, Heading } from "@egovernments/digit-ui-module-dristi/src/components/ModalComponents";

const onDocumentUpload = async (fileData, filename) => {
  try {
    const fileUploadRes = await Digit.UploadServices.Filestorage("DRISTI", fileData, Digit.ULBService.getCurrentTenantId());
    return { file: fileUploadRes?.data, fileType: fileData.type, filename };
  } catch (error) {
    console.error("Failed to upload document:", error);
    throw error; // or handle error appropriately
  }
};

function OrderReviewModal({
  setShowReviewModal,
  t,
  order,
  setShowsignatureModal,
  showActions = true,
  setOrderPdfFileStoreID,
  handleReviewGoBack,
  updateOrder,
  setShowBulkModal,
  courtId,
  saveSignLater,
}) {
  const [fileName, setFileName] = useState();
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const DocViewerWrapper = Digit?.ComponentRegistryService?.getComponent("DocViewerWrapper");
  const [showToast, setShowToast] = useState(null);
  const orderFileStore = order?.documents?.find((doc) => doc?.documentType === "SIGNED")?.fileStore;
  const [isUpdateLoading, setUpdateLoading] = useState(false);
  const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
  const accessToken = window.localStorage.getItem("token");

  const { data: { file: orderPreviewPdf, fileName: orderPreviewFileName } = {}, isFetching: isLoading } = useQuery({
    queryKey: ["orderPreviewPdf", tenantId, order?.id, order?.cnrNumber],
    retry: 3,
    cacheTime: 0,
    queryFn: async () => {
      return axiosInstance
        .post(
          Urls.orders.orderPreviewPdf,
          {
            RequestInfo: {
              authToken: accessToken,
              userInfo: userInfo,
              msgId: `${Date.now()}|${Digit.StoreData.getCurrentLanguage()}`,
              apiId: "Dristi",
            },
          },
          {
            params: {
              tenantId: tenantId,
              orderId: order?.id,
              cnrNumber: order?.cnrNumber,
              qrCode: false,
              courtId: courtId,
              orderPreviewKey: "new-order-generic",
            },
            responseType: "blob",
          }
        )
        .then((res) => ({ file: res.data, fileName: res.headers["content-disposition"]?.split("filename=")[1] }));
    },
    onError: (error) => {
      console.error("Failed to fetch order preview PDF:", error);
      const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
      setShowToast({ label: t("ERROR_FETCHING_ORDER_PREVIEW_PDF"), error: true, errorId });
    },
    enabled: !!order?.id && !!order?.cnrNumber,
  });

  useEffect(() => {
    if (order?.filesData) {
      const numberOfFiles = order?.filesData.length;
      let finalDocumentData = [];
      if (numberOfFiles > 0) {
        order?.filesData.forEach((value) => {
          finalDocumentData.push({
            fileName: value?.[0],
            fileStoreId: value?.[1]?.fileStoreId,
            documentType: value?.[1]?.file?.type,
          });
        });
      }
      if (numberOfFiles > 0) {
        onDocumentUpload(order?.filesData[0][1]?.file, order?.filesData[0][0]).then((document) => {
          setFileName(order?.filesData[0][0]);
        });
      }
    }
  }, [order, tenantId]);

  const showDocument = useMemo(() => {
    return (
      <div
        className=""
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          maxHeight: "100%",
          maxWidth: "100%",
        }}
      >
        {orderPreviewPdf || orderFileStore ? (
          <DocViewerWrapper
            docWidth={"100%"}
            docHeight={"100%"}
            selectedDocs={[orderPreviewPdf]}
            fileStoreId={orderFileStore}
            tenantId={tenantId}
            displayFilename={fileName}
            showDownloadOption={false}
          />
        ) : isLoading ? (
          <h2>{t("LOADING")}</h2>
        ) : (
          <h2>{t("PREVIEW_DOC_NOT_AVAILABLE")}</h2>
        )}
      </div>
    );
  }, [orderPreviewPdf, orderFileStore, tenantId, fileName, isLoading, t]);

  const handleDocumentUpload = async (onSuccess) => {
    try {
      const pdfFile = new File([orderPreviewPdf], orderPreviewFileName, { type: "application/pdf" });
      const document = await onDocumentUpload(pdfFile, pdfFile.name);
      const fileStoreId = document.file?.files?.[0]?.fileStoreId;

      if (fileStoreId) {
        await onSuccess(fileStoreId);
      }
    } catch (e) {
      const errorId = e?.response?.headers?.["x-correlation-id"] || e?.response?.headers?.["X-Correlation-Id"];
      setShowToast({ label: t("ERROR_UPLOADING_DOCUMENT"), error: true, errorId });
      console.error("Failed to upload document:", e);
      setUpdateLoading(false);
    }
  };

  const handleAddSignature = () => {
    setShowsignatureModal(true);
    setShowReviewModal(false);
    if (showActions) {
      handleDocumentUpload((fileStoreId) => {
        setOrderPdfFileStoreID(fileStoreId);
        setShowsignatureModal(true);
        setShowReviewModal(false);
      });
    }
  };

  const handleSignLater = () => {
    setUpdateLoading(true);
    handleDocumentUpload(async (fileStoreId) => {
      if (fileStoreId) {
        let hearingNumber = "";
        const todayDate = new Date().toISOString().split("T")[0];

        if (order?.orderCategory === ORDER_CATEGORIES.INTERMEDIATE && order?.orderType === "ACCEPT_RESCHEDULING_REQUEST") {
          const hearingDate = order?.additionalDetails?.formdata?.newHearingDate;
          if (hearingDate === todayDate) {
            hearingNumber = order?.additionalDetails?.refHearingId;
          }
        } else {
          const acceptRescheduleRequest = order?.compositeItems?.find((item) => item?.orderType === "ACCEPT_RESCHEDULING_REQUEST");
          const hearingDate = acceptRescheduleRequest?.orderSchema?.additionalDetails?.formdata?.newHearingDate;

          if (hearingDate === todayDate) {
            hearingNumber = acceptRescheduleRequest?.orderSchema?.additionalDetails?.refHearingId;
          }
        }
        const updatedOrder = {
          ...order,
          ...(hearingNumber && { hearingNumber: order?.hearingNumber || hearingNumber, scheduledHearingNumber: null }),
          additionalDetails: {
            ...order.additionalDetails,
            // businessOfTheDay: businessDay,
          },
        };
        await updateOrder(updatedOrder, OrderWorkflowAction.SUBMIT_BULK_E_SIGN, fileStoreId)
          .then((response) => {
            setShowReviewModal(false);
            setShowBulkModal(true);
            setUpdateLoading(false);
          })
          .catch((e) => {
            const errorId = e?.response?.headers?.["x-correlation-id"] || e?.response?.headers?.["X-Correlation-Id"];
            setShowToast({ label: t("ERROR_UPDATING_ORDER"), error: true, errorId });
            console.error("Failed to update order:", e);
            setUpdateLoading(false);
          });
      }
    });
  };

  return (
    <React.Fragment>
      <Modal
        headerBarMain={<Heading label={t("CS_PREVIEW_ORDER")} />}
        headerBarEnd={<CloseBtn onClick={handleReviewGoBack} />}
        actionCancelLabel={showActions && t("BULK_EDIT")}
        actionCustomLabel={showActions && t("ADD_SIGNATURE")}
        actionSaveLabel={saveSignLater && t("SAVE_FINALISE_AND_SIGN_LATER")}
        isBackButtonDisabled={isLoading || isUpdateLoading}
        isCustomButtonDisabled={isLoading || isUpdateLoading}
        isDisabled={isLoading || isUpdateLoading}
        actionCancelOnSubmit={handleReviewGoBack}
        actionCustomLabelSubmit={handleAddSignature}
        customActionStyle={{ border: "1px solid #007E7E", backgroundColor: "white" }}
        customActionTextStyle={{ color: "#007E7E" }}
        actionSaveOnSubmit={handleSignLater}
        className={"review-order-modal"}
      >
        <div className="review-order-body-main">
          <div className="review-order-modal-document-div" style={{ padding: 0, overflow: "auto" }}>
            {showDocument}
          </div>
        </div>
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
    </React.Fragment>
  );
}

export default OrderReviewModal;
