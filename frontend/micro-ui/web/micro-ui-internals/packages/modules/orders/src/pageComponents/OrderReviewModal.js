import { CloseSvg } from "@egovernments/digit-ui-components";
import Axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "react-query";
import Modal from "../../../dristi/src/components/Modal";
import { Urls } from "../hooks/services/Urls";
import { Toast, TextInput } from "@egovernments/digit-ui-react-components";
import Button from "@egovernments/digit-ui-module-dristi/src/components/Button";

const OrderPreviewOrderTypeMap = {
  MANDATORY_SUBMISSIONS_RESPONSES: "mandatory-async-submissions-responses",
  ASSIGNING_DATE_RESCHEDULED_HEARING: "new-hearing-date-after-rescheduling",
  SCHEDULE_OF_HEARING_DATE: "schedule-hearing-date",
  SUMMONS: "summons-issue",
  NOTICE: "order-notice",
  INITIATING_RESCHEDULING_OF_HEARING_DATE: "accept-reschedule-request",
  OTHERS: "order-generic",
  REFERRAL_CASE_TO_ADR: "order-referral-case-adr",
  EXTENSION_DEADLINE_ACCEPT: "order-for-extension-deadline",
  EXTENSION_DEADLINE_REJECT: "order-reject-application-submission-deadline",
  SCHEDULING_NEXT_HEARING: "schedule-hearing-date",
  RESCHEDULE_OF_HEARING_DATE: "new-hearing-date-after-rescheduling",
  REJECTION_RESCHEDULE_REQUEST: "order-for-rejection-rescheduling-request",
  ASSIGNING_NEW_HEARING_DATE: "order-generic",
  CASE_TRANSFER: "order-case-transfer",
  SETTLEMENT: "order-case-settlement-acceptance",
  SETTLEMENT_REJECT: "order-case-settlement-rejected",
  SETTLEMENT_ACCEPT: "order-case-settlement-acceptance",
  BAIL_APPROVED: "order-bail-acceptance",
  BAIL_REJECT: "order-bail-rejection",
  WARRANT: "order-warrant",
  WITHDRAWAL_ACCEPT: "order-case-withdrawal-acceptance",
  WITHDRAWAL_REJECT: "order-case-withdrawal-rejected",
  APPROVE_VOLUNTARY_SUBMISSIONS: "order-accept-voluntary",
  REJECT_VOLUNTARY_SUBMISSIONS: "order-reject-voluntary",
  JUDGEMENT: "order-generic",
  SECTION_202_CRPC: "order-202-crpc",
  CHECKOUT_ACCEPTANCE: "order-accept-checkout-request",
  CHECKOUT_REJECT: "order-reject-checkout-request",
  ADMIT_DISMISS_CASE: "order-acceptance-rejection-case",
  ACCEPTANCE_REJECTION_DCA: "order-acceptance-rejection-dca",
  SET_BAIL_TERMS: "order-set-terms-of-bail",
  REJECT_BAIL: "order-bail-rejection",
  ACCEPT_BAIL: "order-bail-acceptance",
};

const orderPDFMap = {
  BAIL: {
    APPROVED: "BAIL_APPROVED",
    REJECTED: "BAIL_REJECT",
  },
  BAILREQUEST: {
    APPROVED: "ACCEPT_BAIL",
    REJECTED: "REJECT_BAIL",
    SET_TERM_BAIL: "SET_BAIL_TERMS",
  },
  SETTLEMENT: {
    APPROVED: "SETTLEMENT_ACCEPT",
    REJECTED: "SETTLEMENT_REJECT",
  },
  WITHDRAWAL: {
    APPROVED: "WITHDRAWAL_ACCEPT",
    REJECTED: "WITHDRAWAL_REJECT",
  },
  EXTENSION_OF_DOCUMENT_SUBMISSION_DATE: {
    APPROVED: "EXTENSION_DEADLINE_ACCEPT",
    REJECTED: "EXTENSION_DEADLINE_REJECT",
  },
};

const onDocumentUpload = async (fileData, filename) => {
  try {
    const fileUploadRes = await Digit.UploadServices.Filestorage("DRISTI", fileData, Digit.ULBService.getCurrentTenantId());
    return { file: fileUploadRes?.data, fileType: fileData.type, filename };
  } catch (error) {
    console.error("Failed to upload document:", error);
    throw error; // or handle error appropriately
  }
};

const applicationStatusType = (Type) => {
  switch (Type) {
    case "APPROVED":
      return "APPROVED";
    case "SET_TERM_BAIL":
      return "SET_TERM_BAIL";
    default:
      return "REJECTED";
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
}) {
  const [fileStoreId, setFileStoreID] = useState(null);
  const [fileName, setFileName] = useState();
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const DocViewerWrapper = Digit?.ComponentRegistryService?.getComponent("DocViewerWrapper");
  const filestoreId = "9d23b127-c9e9-4fd1-9dc8-e2e762269046";
  const [showErrorToast, setShowErrorToast] = useState(null);
  const [isDisabled, setIsDisabled] = useState();
  const orderFileStore = order?.documents?.find((doc) => doc?.documentType === "SIGNED")?.fileStore;

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

  const applicationStatus = applicationStatusType(order?.additionalDetails?.applicationStatus);
  const orderType = order?.orderType;
  let orderPreviewKey = orderPDFMap?.[orderType]?.[applicationStatus] || orderType;
  orderPreviewKey = OrderPreviewOrderTypeMap[orderPreviewKey];

  const { data: { file: orderPreviewPdf, fileName: orderPreviewFileName } = {}, isFetching: isLoading } = useQuery({
    queryKey: ["orderPreviewPdf", tenantId, order?.id, order?.cnrNumber, orderPreviewKey],
    retry: 3,
    cacheTime: 0,
    queryFn: async () => {
      return Axios({
        method: "POST",
        url: Urls.orders.orderPreviewPdf,
        params: {
          tenantId: tenantId,
          orderId: order?.id,
          cnrNumber: order?.cnrNumber,
          qrCode: false,
          orderType: orderPreviewKey,
        },
        data: {
          RequestInfo: {
            authToken: Digit.UserService.getUser().access_token,
            userInfo: Digit.UserService.getUser()?.info,
            msgId: `${Date.now()}|${Digit.StoreData.getCurrentLanguage()}`,
            apiId: "Rainmaker",
          },
        },
        responseType: "blob",
      }).then((res) => ({ file: res.data, fileName: res.headers["content-disposition"]?.split("filename=")[1] }));
    },
    onError: (error) => {
      console.error("Failed to fetch order preview PDF:", error);
    },
    enabled: !!order?.id && !!order?.cnrNumber && !!orderPreviewKey,
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
            docWidth={"calc(80vw* 62/ 100)"}
            docHeight={"50vh"}
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

  return (
    <React.Fragment>
      <Modal
        headerBarMain={<Heading label={t("REVIEW_ORDERS_HEADING")} />}
        headerBarEnd={<CloseBtn onClick={handleReviewGoBack} />}
        actionSaveLabel={showActions && t("ADD_SIGNATURE")}
        isDisabled={isLoading}
        actionSaveOnSubmit={() => {
          if (showActions) {
            const pdfFile = new File([orderPreviewPdf], orderPreviewFileName, { type: "application/pdf" });

            onDocumentUpload(pdfFile, pdfFile.name)
              .then((document) => {
                const fileStoreId = document.file?.files?.[0]?.fileStoreId;
                if (fileStoreId) {
                  setOrderPdfFileStoreID(fileStoreId);
                }
              })
              .then(() => {
                setShowsignatureModal(true);
                setShowReviewModal(false);
              })
              .catch((e) => {
                setShowErrorToast({ label: t("INTERNAL_ERROR_OCCURRED"), error: true });
                console.error("Failed to upload document:", e);
              });
          }
        }}
        className={"review-order-modal"}
      >
        <div className="review-order-body-main">
          <div className="review-order-modal-list-div">
            <div className="review-order-type-side-stepper">
              <h1> {t(order?.orderType)}</h1>
            </div>
          </div>
          <div className="review-order-modal-document-div" style={{ padding: 0 }}>
            {showDocument}
            <h3 style={{ marginTop: 0, marginBottom: "2px" }}>{t("BUSINESS_OF_THE_DAY")} </h3>
            <div style={{ display: "flex", gap: "10px" }}>
              <TextInput
                className="field desktop-w-full"
                onChange={(e) => {
                  setBusinessOfTheDay(e.target.value);
                }}
                disable={isDisabled}
                defaultValue={currentDiaryEntry?.businessOfDay}
                style={{ minWidth: "500px" }}
                textInputStyle={{ maxWidth: "100%" }}
              />
              {currentDiaryEntry && (
                <Button
                  label={t("SAVE")}
                  variation={"primary"}
                  style={{ padding: 15, boxShadow: "none" }}
                  onButtonClick={handleUpdateBusinessOfDayEntry}
                />
              )}
            </div>
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
