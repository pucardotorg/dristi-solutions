import { CloseSvg } from "@egovernments/digit-ui-components";
import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "react-query";
import Modal from "../../../dristi/src/components/Modal";
import { Urls } from "../hooks/services/Urls";
import { Toast, TextInput } from "@egovernments/digit-ui-react-components";
import Button from "@egovernments/digit-ui-module-dristi/src/components/Button";
import { OrderWorkflowAction } from "../utils/orderWorkflow";
import axiosInstance from "@egovernments/digit-ui-module-core/src/Utils/axiosInstance";

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
  setBusinessOfTheDay,
  currentDiaryEntry,
  handleUpdateBusinessOfDayEntry,
  handleReviewGoBack,
  businessOfDay,
  updateOrder,
  setShowBulkModal,
  courtId,
  saveSignLater,
}) {
  const [fileStoreId, setFileStoreID] = useState(null);
  const [fileName, setFileName] = useState();
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const DocViewerWrapper = Digit?.ComponentRegistryService?.getComponent("DocViewerWrapper");
  const [showErrorToast, setShowErrorToast] = useState(null);
  const [isDisabled, setIsDisabled] = useState();
  const orderFileStore = order?.documents?.find((doc) => doc?.documentType === "SIGNED")?.fileStore;
  // const [businessDay, setBusinessDay] = useState(businessOfDay);
  const [isUpdateLoading, setUpdateLoading] = useState(false);
  const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
  const accessToken = window.localStorage.getItem("token");

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
    },
    enabled: !!order?.id && !!order?.cnrNumber,
  });

  const Heading = (props) => {
    return <h1 className="heading-m">{props.label}</h1>;
  };

  const CloseBtn = (props) => {
    return (
      <div onClick={props?.onClick} style={{ height: "100%", display: "flex", alignItems: "center", paddingRight: "20px", cursor: "pointer" }}>
        <CloseSvg />
      </div>
    );
  };

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
          setFileStoreID(document.file?.files?.[0]?.fileStoreId);
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
  }, [orderPreviewPdf, fileName, isLoading, t]);

  const handleDocumentUpload = async (onSuccess) => {
    try {
      const pdfFile = new File([orderPreviewPdf], orderPreviewFileName, { type: "application/pdf" });
      const document = await onDocumentUpload(pdfFile, pdfFile.name);
      const fileStoreId = document.file?.files?.[0]?.fileStoreId;

      if (fileStoreId) {
        await onSuccess(fileStoreId);
      }
    } catch (e) {
      setShowErrorToast({ label: t("INTERNAL_ERROR_OCCURRED"), error: true });
      console.error("Failed to upload document:", e);
      setUpdateLoading(false);
    }
  };

  const handleAddSignature = () => {
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
        const updatedOrder = {
          ...order,
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
            setShowErrorToast({ label: t("INTERNAL_ERROR_OCCURRED"), error: true });
            console.error("Failed to save draft:", e);
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
          {/* <div className="review-order-modal-list-div">
            <div className="review-order-type-side-stepper">
              <h1> {order?.orderCategory === "COMPOSITE" ? order?.orderTitle : t(order?.orderType)} </h1>
            </div>
          </div> */}
          <div className="review-order-modal-document-div" style={{ padding: 0, overflow: "auto" }}>
            {showDocument}
            {/* <h3 style={{ marginTop: 0, marginBottom: "2px" }}>{t("BUSINESS_OF_THE_DAY")} </h3>
            <div style={{ display: "flex", gap: "10px" }}>
              <TextInput
                className="field desktop-w-full"
                onChange={(e) => {
                  setBusinessDay(e.target.value);
                  setBusinessOfTheDay(e.target.value);
                }}
                disable={isDisabled}
                defaultValue={currentDiaryEntry?.businessOfDay || businessDay}
                style={{ minWidth: "500px" }}
                textInputStyle={{ maxWidth: "100%" }}
                maxlength={1024}
              />
              {currentDiaryEntry && (
                <Button
                  label={t("SAVE")}
                  variation={"primary"}
                  style={{ padding: 15, boxShadow: "none" }}
                  onButtonClick={handleUpdateBusinessOfDayEntry}
                />
              )}
            </div> */}
          </div>
        </div>
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
    </React.Fragment>
  );
}

export default OrderReviewModal;
