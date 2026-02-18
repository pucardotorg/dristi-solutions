import { InboxSearchComposer, SubmitBar, Loader, Button, Toast } from "@egovernments/digit-ui-react-components";
import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { useTranslation } from "react-i18next";
import { bulkADiarySignConfig } from "../../configs/BulkADiarySignConfig";
import { HomeService } from "../../hooks/services";
import AuthenticatedLink from "@egovernments/digit-ui-module-dristi/src/Utils/authenticatedLink";
import { CloseSvg, InfoCard } from "@egovernments/digit-ui-components";
import { Urls } from "../../hooks";
import { FileUploadIcon } from "@egovernments/digit-ui-module-dristi/src/icons/svgIndex";
import axiosInstance from "@egovernments/digit-ui-module-core/src/Utils/axiosInstance";
import ADiaryDocumentPdfModal from "./ADiaryDocumentPdfModal";
import { DRISTIService } from "@egovernments/digit-ui-module-dristi/src/services";
import { DateUtils } from "@egovernments/digit-ui-module-dristi/src/Utils";

const buttonStyle = {
  borderRadius: "4px",
  boxShadow: "none",
};

const CloseBtn = ({ onClick }) => {
  return (
    <div
      onClick={onClick}
      style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        paddingRight: "20px",
        cursor: "pointer",
      }}
    >
      <CloseSvg />
    </div>
  );
};

const Heading = ({ label }) => {
  return (
    <div className="evidence-title">
      <h1 className="heading-m">{label}</h1>
    </div>
  );
};

function BulkSignADiaryView() {
  const userInfo = Digit?.UserService?.getUser()?.info;
  const queryStrings = Digit.Hooks.useQueryParams();
  const userInfoType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo]);
  const history = useHistory();
  const { t } = useTranslation();
  const roles = useMemo(() => userInfo?.roles, [userInfo]);
  const isDiaryApprover = useMemo(() => roles?.some((role) => role.code === "DIARY_APPROVER"), [roles]);
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const courtId = localStorage.getItem("courtId");
  const [entryDate, setEntryDate] = useState(
    parseInt(queryStrings?.date?.split("-")[1] || sessionStorage.getItem("diaryDate")) || new Date().setHours(0, 0, 0, 0)
  );
  const [ADiarypdf, setADiarypdf] = useState(sessionStorage.getItem("adiarypdf") || "");
  const [isSelectedDataSigned, setIsSelectedDataSigned] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [stepper, setStepper] = useState(parseInt(sessionStorage.getItem("adiaryStepper")) || 0);

  const [openUploadSignatureModal, setOpenUploadSignatureModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [fileStoreIds, setFileStoreIds] = useState(new Set());
  const [signedDocumentUploadID, setSignedDocumentUploadID] = useState("");
  const [generateAdiaryLoader, setGenerateAdiaryLoader] = useState(false);
  const [noAdiaryModal, setNoAdiaryModal] = useState(false);
  const [loader, setLoader] = useState(false);
  const [showDocumentPdfModal, setShowDocumentPdfModal] = useState({ show: false, rowData: null });
  const [toastMsg, setToastMsg] = useState(null);
  const [reload, setReload] = useState(false);

  const DocViewerWrapper = Digit?.ComponentRegistryService?.getComponent("DocViewerWrapper");
  const MemoDocViewerWrapper = React.memo(DocViewerWrapper);
  const Modal = window?.Digit?.ComponentRegistryService?.getComponent("Modal");
  const UploadSignatureModal = window?.Digit?.ComponentRegistryService?.getComponent("UploadSignatureModal");
  const { uploadDocuments } = Digit.Hooks.orders.useDocumentUpload();
  const { handleEsign, checkSignStatus } = Digit.Hooks.orders.useESign();
  const uri = `${window.location.origin}${Urls.FileFetchById}?tenantId=${tenantId}&fileStoreId=${ADiarypdf}`;
  const today = new Date();
  const todayStr = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split("T")[0];
  const diaryDateFilter = sessionStorage.getItem("diaryDateFilter");
  const name = "Signature";
  const pageModule = "en";

  const [diaryEntries, setDiaryEntries] = useState([]);

  const showToast = (type, message, duration = 5000) => {
    setToastMsg({ key: type, action: message });
    setTimeout(() => {
      setToastMsg(null);
    }, duration);
  };

  const uploadModalConfig = useMemo(() => {
    return {
      key: "uploadSignature",
      populators: {
        inputs: [
          {
            name,
            type: "DragDropComponent",
            uploadGuidelines: "Ensure the image is not blurry and under 5MB.",
            maxFileSize: 10,
            maxFileErrorMessage: "CS_FILE_LIMIT_10_MB",
            fileTypes: ["JPG", "PNG", "JPEG", "PDF"],
            isMultipleUpload: false,
          },
        ],
        validation: {},
      },
    };
  }, [name]);

  const fetchEntries = useCallback(
    async (date) => {
      try {
        const diary = await HomeService.getADiarySearch({
          criteria: {
            tenantId: tenantId,
            courtId: courtId,
            date,
          },
        });
        const diaries = diary?.diaries;
        if (Array.isArray(diaries) && diaries?.length > 0) {
          setIsSelectedDataSigned(true);
          setADiarypdf(diaries[0]?.fileStoreID);
          setFileStoreIds((prevFileStoreIds) => new Set([...prevFileStoreIds, diaries[0]?.fileStoreID]));
        } else {
          setIsSelectedDataSigned(false);
        }
      } catch (error) {
        console.error("Error :", error);
      } finally {
        setEntryDate(date);
      }
    },
    [tenantId, courtId]
  );

  const config = useMemo(() => {
    const setADiaryFunc = async (entry) => {
      // sessionStorage.setItem("diaryDate", entry?.entryDate);
      if (entry?.referenceType === "Order") {
        try {
          const response = await DRISTIService.searchOrders(
            {
              criteria: {
                filingNumber: entry?.additionalDetails?.filingNumber,
                orderNumber: entry?.referenceId,
                status: "PUBLISHED",

                ...(courtId && { courtId: courtId }),
              },
              tenantId,
            },
            { tenantId: tenantId }
          );
          const order = response?.list?.[0];
          setShowDocumentPdfModal({ show: true, rowData: { document: order?.documents?.[0], rowData: entry } });
        } catch (error) {
          console.error("error: ", error);
          showToast("error", t("SOMETHING_WENT_WRONG"), 5000);
        }
      }

      if (entry?.referenceType === "Documents") {
        try {
          const response = await DRISTIService.searchEvidence(
            {
              criteria: {
                ...(courtId && { courtId: courtId }),
                filingNumber: entry?.additionalDetails?.filingNumber,
                artifactNumber: entry?.referenceId,
                tenantId,
              },
              tenantId,
            },
            {}
          );
          setShowDocumentPdfModal({ show: true, rowData: { document: response?.artifacts?.[0]?.file, rowData: entry } });
        } catch (error) {
          console.error("error: ", error);
          showToast("error", t("SOMETHING_WENT_WRONG"), 5000);
        }
      }
      if (entry?.referenceType === "notice") {
        try {
          const notificationResponse = await Digit.HearingService.searchNotification({
            criteria: {
              tenantId: tenantId,
              notificationNumber: entry?.referenceId,
              ...(courtId && { courtId: courtId }),
            },
            pagination: {
              limit: 100,
            },
          });
          const notification = notificationResponse?.list?.[0];
          setShowDocumentPdfModal({
            show: true,
            rowData: { document: notification?.documents?.[notification?.documents?.length - 1], rowData: entry },
          });
        } catch (error) {
          console.error("error: ", error);
          showToast("error", t("SOMETHING_WENT_WRONG"), 5000);
        }
      }
    };

    return {
      ...bulkADiarySignConfig,
      apiDetails: {
        ...bulkADiarySignConfig?.apiDetails,
        requestBody: {
          ...bulkADiarySignConfig.apiDetails.requestBody,
          criteria: {
            ...bulkADiarySignConfig.apiDetails.requestBody.criteria,
            date: diaryDateFilter ? new Date(Number(diaryDateFilter)).toLocaleDateString("en-CA") : todayStr,
          },
        },
      },
      sections: {
        ...bulkADiarySignConfig.sections,
        search: {
          ...bulkADiarySignConfig.sections.search,
          uiConfig: {
            ...bulkADiarySignConfig.sections.search.uiConfig,
            defaultValues: {
              date: diaryDateFilter ? new Date(Number(diaryDateFilter)).toLocaleDateString("en-CA") : todayStr,
            },
          },
        },
        searchResult: {
          ...bulkADiarySignConfig.sections.searchResult,
          uiConfig: {
            ...bulkADiarySignConfig.sections.searchResult.uiConfig,
            columns: bulkADiarySignConfig.sections.searchResult.uiConfig.columns.map((column) => {
              if (column.label === "PROCEEDINGS_OR_BUSINESS_OF_DAY") {
                return {
                  ...column,
                  clickFunc: setADiaryFunc,
                };
              } else {
                return column;
              }
            }),
          },
        },
      },
      additionalDetails: {
        fetchEntries: fetchEntries,
        setDiaryEntries: setDiaryEntries,
      },
    };
  }, []);

  const MemoInboxSearchComposer = useMemo(() => {
    return (
      <InboxSearchComposer
        // key={`entryDate-${}`}
        // pageSizeLimit={sessionStorage.getItem("bulkBailBondSignlimit") || 10}
        configs={config}
        // customStyle={sectionsParentStyle}
      />
    );
  }, [config]);

  useEffect(() => {
    return () => {
      sessionStorage.removeItem("homeActiveTab");
    };
  });

  useEffect(() => {
    checkSignStatus(name, formData, uploadModalConfig, onSelect, setIsSigned);
  }, [checkSignStatus]);

  const onCancel = () => {
    sessionStorage.setItem("adiaryStepper", parseInt(stepper) - 1);
    if (parseInt(stepper) === 1) {
      sessionStorage.removeItem("adiarypdf");
      sessionStorage.removeItem("adiaryStepper");
      sessionStorage.removeItem("diaryDate");
      sessionStorage.removeItem("diaryDateFilter");
    } else if (parseInt(stepper) === 2) {
      setIsSigned(false);
      setSignedDocumentUploadID("");
      setFormData({});
      sessionStorage.removeItem("fileStoreId");
    }
    setStepper(parseInt(stepper) - 1);
  };

  const onSubmit = async () => {
    // sessionStorage.setItem("diaryDate", entryDate);
    if (parseInt(stepper) === 0) {
      setGenerateAdiaryLoader(true);
      try {
        const generateADiaryPDF = await HomeService.generateADiaryPDF({
          diary: {
            tenantId: tenantId,
            diaryDate: entryDate,
            diaryType: "ADiary",
            courtId: courtId,
          },
        });
        setGenerateAdiaryLoader(false);
        setADiarypdf(generateADiaryPDF?.fileStoreID);
        setFileStoreIds((prevFileStoreIds) => new Set([...prevFileStoreIds, generateADiaryPDF?.fileStoreID]));
        sessionStorage.setItem("adiaryStepper", parseInt(stepper) + 1);
        setStepper(parseInt(stepper) + 1);
      } catch (error) {
        console.error("Error :", error);
        setGenerateAdiaryLoader(false);
      }
    } else if (parseInt(stepper) === 1) {
      sessionStorage.setItem("adiaryStepper", parseInt(stepper) + 1);
      setStepper(parseInt(stepper) + 1);
      sessionStorage.setItem("adiarypdf", ADiarypdf);
    }
  };

  const onSelect = (key, value) => {
    if (value?.Signature === null) {
      setFormData({});
      setIsSigned(false);
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [key]: value,
      }));
    }
  };

  const onUploadSubmit = async () => {
    if (formData?.uploadSignature?.Signature?.length > 0) {
      try {
        setLoader(true);
        const uploadedFileId = await uploadDocuments(formData?.uploadSignature?.Signature, tenantId);
        setSignedDocumentUploadID(uploadedFileId?.[0]?.fileStoreId);
        setFileStoreIds((prevFileStoreIds) => new Set([...prevFileStoreIds, uploadedFileId?.[0]?.fileStoreId]));
        setIsSigned(true);
        setOpenUploadSignatureModal(false);
      } catch (error) {
        console.error("error", error);
        setLoader(false);
        setFormData({});
        setIsSigned(false);
      }
      setLoader(false);
    }
  };

  const uploadSignedPdf = async () => {
    try {
      const localStorageID = sessionStorage.getItem("fileStoreId");
      const newFilestore = signedDocumentUploadID || localStorageID;
      fileStoreIds.delete(newFilestore);
      if (ADiarypdf) {
        fileStoreIds.delete(ADiarypdf);
      }
      await HomeService.updateADiaryPDF({
        diary: {
          tenantId: tenantId,
          diaryDate: entryDate,
          diaryType: "ADiary",
          courtId: courtId,
          documents: [
            {
              tenantId: tenantId,
              fileStoreId: signedDocumentUploadID || localStorageID,
              isActive: true,
            },
            {
              tenantId: tenantId,
              fileStoreId: ADiarypdf,
              isActive: false,
            },
            ...Array.from(fileStoreIds).map((fileStoreId) => ({
              fileStoreId: fileStoreId,
              tenantId: tenantId,
              isActive: false,
            })),
          ],
        },
      });
      setStepper(0);
      setIsSelectedDataSigned(true);
      setADiarypdf(signedDocumentUploadID || localStorageID);
      sessionStorage.removeItem("fileStoreId");
      sessionStorage.removeItem("adiarypdf");
      sessionStorage.removeItem("adiaryStepper");
      sessionStorage.removeItem("diaryDateFilter");
    } catch (error) {
      console.error("Error :", error);
      setIsSigned(false);
      setSignedDocumentUploadID("");
      sessionStorage.removeItem("fileStoreId");
      setIsSelectedDataSigned(false);
    }
  };

  const downloadSignedADiary = (e) => {
    e.preventDefault();

    const uriSignedADiary = `${window.location.origin}${Urls.FileFetchById}?tenantId=${tenantId}&fileStoreId=${ADiarypdf}`;

    const authToken = localStorage.getItem("token");
    axiosInstance
      .get(uriSignedADiary, {
        headers: {
          "auth-token": `${authToken}`,
        },
        responseType: "blob",
      })
      .then((response) => {
        if (response.status === 200) {
          const blob = new Blob([response.data], { type: "application/octet-stream" });
          const mimeType = response.data.type || "application/octet-stream";
          const extension = mimeType.includes("/") ? mimeType.split("/")[1] : "bin";
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = `downloadedFile.${extension}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        } else {
          console.error("Failed to fetch the PDF:", response.statusText);
        }
      })
      .catch((error) => {
        console.error("Error during the API request:", error);
      });
  };

  return (
    <React.Fragment>
      <React.Fragment>
        <div className={"bulk-esign-order-view"}>
          <div className="header">{t("BULK_SIGN_ADIARY")}</div>
          {MemoInboxSearchComposer}
        </div>
        {isDiaryApprover && !isSelectedDataSigned && entryDate !== new Date().setHours(0, 0, 0, 0) && diaryEntries.length > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              height: "72px",
              width: "-webkit-fill-available",
              position: "fixed",
              bottom: 0,
              padding: "16px 24px",
              borderTop: "1px solid #BBBBBD",
            }}
          >
            <SubmitBar style={buttonStyle} label={t(`ADD_SIGNATURE`)} onSubmit={onSubmit} />
          </div>
        )}

        {isSelectedDataSigned && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              height: "72px",
              width: "-webkit-fill-available",
              position: "fixed",
              bottom: 0,
              padding: "16px 24px",
              borderTop: "1px solid #BBBBBD",
            }}
          >
            <SubmitBar style={buttonStyle} label={t(`DOWNLOAD_SIGNED_ADIARY`)} onSubmit={downloadSignedADiary} />
          </div>
        )}
      </React.Fragment>
      <div className="adiary-container">
        {stepper === 1 && (
          <Modal
            headerBarEnd={<CloseBtn onClick={onCancel} />}
            headerBarMain={true}
            popupStyles={{ width: "70vw" }}
            actionCancelLabel={t("CORE_LOGOUT_CANCEL")}
            actionCancelOnSubmit={onCancel}
            actionSaveLabel={t("CS_COMMON_SUBMIT")}
            actionSaveOnSubmit={onSubmit}
            formId="modal-action"
            headerBarMainStyle={{ height: "50px" }}
          >
            {generateAdiaryLoader ? (
              <Loader />
            ) : (
              <MemoDocViewerWrapper
                key={ADiarypdf}
                fileStoreId={ADiarypdf}
                tenantId={tenantId}
                docWidth="100%"
                docHeight="70vh"
                showDownloadOption={false}
                documentName={"ADiary"}
              />
            )}
          </Modal>
        )}
        {stepper === 2 && !openUploadSignatureModal && !isSigned && (
          <Modal
            headerBarMain={<Heading label={t("ADD_SIGNATURE")} />}
            headerBarEnd={<CloseBtn onClick={onCancel} />}
            actionCancelLabel={t("CS_COMMON_BACK")}
            actionCancelOnSubmit={onCancel}
            actionSaveLabel={t("submit")}
            isDisabled={!isSigned}
            actionSaveOnSubmit={uploadSignedPdf}
            className="add-signature-modal"
          >
            <div className="add-signature-main-div">
              <div className="not-signed">
                <InfoCard
                  variant={"default"}
                  label={t("PLEASE_NOTE")}
                  additionalElements={[
                    <p key="note">
                      {t("YOU_ARE_ADDING_YOUR_SIGNATURE_TO_THE")}
                      <span style={{ fontWeight: "bold" }}>{`${t("ADIARY")} - ${DateUtils.getFormattedDate(entryDate, "DD-MM-YYYY", "/")}`}</span>
                    </p>,
                  ]}
                  inline
                  textStyle={{}}
                  className={`custom-info-card`}
                />
                <h1>{t("YOUR_SIGNATURE")}</h1>
                <div className="sign-button-wrap">
                  <Button
                    label={t("CS_ESIGN")}
                    onButtonClick={() => {
                      sessionStorage.setItem("homeActiveTab", "CS_HOME_A_DAIRY");
                      handleEsign(name, pageModule, ADiarypdf, "Signature");
                    }} //as sending null throwing error in esign
                    className="aadhar-sign-in"
                    labelClassName="aadhar-sign-in"
                  />
                  <Button
                    icon={<FileUploadIcon />}
                    label={t("UPLOAD_DIGITAL_SIGN_CERTI")}
                    onButtonClick={() => {
                      setOpenUploadSignatureModal(true);
                    }}
                    className="upload-signature"
                    labelClassName="upload-signature-label"
                  />
                </div>
                <div className="donwload-submission">
                  <h2>{t("DOWNLOAD_ADIARY_TEXT")}</h2>
                  <AuthenticatedLink
                    uri={uri}
                    style={{ color: "#007E7E", cursor: "pointer", textDecoration: "underline" }}
                    displayFilename={"CLICK_HERE"}
                    t={t}
                    pdf={true}
                  />
                </div>
              </div>
            </div>
          </Modal>
        )}

        {stepper === 2 && openUploadSignatureModal && (
          <UploadSignatureModal
            t={t}
            key={name}
            name={name}
            setOpenUploadSignatureModal={setOpenUploadSignatureModal}
            onSelect={onSelect}
            config={uploadModalConfig}
            formData={formData}
            onSubmit={onUploadSubmit}
            isDisabled={loader}
          />
        )}

        {stepper === 2 && !openUploadSignatureModal && isSigned && (
          <Modal
            headerBarMain={<Heading label={t("ADD_SIGNATURE")} />}
            headerBarEnd={<CloseBtn onClick={onCancel} />}
            actionCancelLabel={t("CS_COMMON_BACK")}
            actionCancelOnSubmit={onCancel}
            actionSaveLabel={t("SUBMIT_BUTTON")}
            actionSaveOnSubmit={uploadSignedPdf}
            className="add-signature-modal"
          >
            <div className="add-signature-main-div">
              <InfoCard
                variant={"default"}
                label={t("PLEASE_NOTE")}
                additionalElements={[
                  <p key="note">
                    {t("YOU_ARE_ADDING_YOUR_SIGNATURE_TO_THE")}
                    <span style={{ fontWeight: "bold" }}>{`${t("ADIARY")} - ${DateUtils.getFormattedDate(entryDate, "DD-MM-YYYY", "/")}`}</span>
                  </p>,
                ]}
                inline
                textStyle={{}}
                className={`custom-info-card`}
              />
              <div style={{ display: "flex", flexDirection: "row", gap: "16px" }}>
                <h1
                  style={{
                    margin: 0,
                    fontFamily: "Roboto",
                    fontSize: "24px",
                    fontWeight: 700,
                    lineHeight: "28.13px",
                    textAlign: "left",
                    color: "#3d3c3c",
                  }}
                >
                  {t("YOUR_SIGNATURE")}
                </h1>
                <h2
                  style={{
                    margin: 0,
                    fontFamily: "Roboto",
                    fontSize: "14px",
                    fontWeight: 400,
                    lineHeight: "16.41px",
                    textAlign: "center",
                    color: "#00703c",
                    padding: "6px",
                    backgroundColor: "#e4f2e4",
                    borderRadius: "999px",
                  }}
                >
                  {t("SIGNED")}
                </h2>
              </div>
            </div>
          </Modal>
        )}

        {noAdiaryModal && (
          <Modal
            headerBarEnd={<CloseBtn onClick={() => setNoAdiaryModal(false)} />}
            popupStyles={{ width: "600px" }}
            actionSaveLabel={t("CS_COMMON_BACK")}
            actionSaveOnSubmit={() => setNoAdiaryModal(false)}
            formId="modal-action"
            headerBarMainStyle={{ height: "60px" }}
            headerBarMain={<Heading label={t("NO_ADIARY")} />}
          >
            <div style={{ padding: "20px" }}>
              <span>{t("NO_ADIARY_TEXT")}</span>
            </div>
          </Modal>
        )}
        {showDocumentPdfModal?.show && (
          <ADiaryDocumentPdfModal
            t={t}
            tenantId={tenantId}
            data={showDocumentPdfModal?.rowData}
            setShowDocumentPdfModal={setShowDocumentPdfModal}
            isSelectedDataSigned={isSelectedDataSigned}
            setReload={setReload}
            reload={reload}
          />
        )}
        {toastMsg && (
          <Toast
            error={toastMsg.key === "error"}
            label={t(toastMsg.action)}
            onClose={() => setToastMsg(null)}
            isDleteBtn={true}
            style={{ maxWidth: "500px" }}
          />
        )}
      </div>
    </React.Fragment>
  );
}

export default BulkSignADiaryView;
