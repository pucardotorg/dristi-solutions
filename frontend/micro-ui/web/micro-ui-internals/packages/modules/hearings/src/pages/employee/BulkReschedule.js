import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Banner, Button, CloseSvg, FormComposerV2, Loader, TextInput, Toast } from "@egovernments/digit-ui-react-components";
import { InfoCard } from "@egovernments/digit-ui-components";
import { Urls } from "../../hooks/services/Urls";
import { FileUploadIcon } from "@egovernments/digit-ui-module-dristi/src/icons/svgIndex";
import AuthenticatedLink from "@egovernments/digit-ui-module-dristi/src/Utils/authenticatedLink";
import isEqual from "lodash/isEqual";
import { hearingService } from "../../hooks/services";
import { useHistory } from "react-router-dom";
import { FileDownloadIcon } from "@egovernments/digit-ui-module-dristi/src/icons/svgIndex";
import CustomCopyTextDiv from "@egovernments/digit-ui-module-dristi/src/components/CustomCopyTextDiv";
import BulkRescheduleModal from "../../components/BulkRescheduleModal";
import axiosInstance from "@egovernments/digit-ui-module-core/src/Utils/axiosInstance";
import { DateUtils } from "@egovernments/digit-ui-module-dristi/src/Utils";

const tenantId = window?.Digit.ULBService.getCurrentTenantId();
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
const BulkReschedule = ({ stepper, setStepper, refetch, selectedDate = new Date().setHours(0, 0, 0, 0), selectedSlot = [] }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const { handleEsign, checkSignStatus } = Digit.Hooks.orders.useESign();
  const { uploadDocuments } = Digit.Hooks.orders.useDocumentUpload();
  const { downloadPdf } = Digit.Hooks.dristi.useDownloadCasePdf();

  const UploadSignatureModal = window?.Digit?.ComponentRegistryService?.getComponent("UploadSignatureModal");
  const DocViewerWrapper = Digit?.ComponentRegistryService?.getComponent("DocViewerWrapper");
  const MemoDocViewerWrapper = React.memo(DocViewerWrapper);
  const Modal = window?.Digit?.ComponentRegistryService?.getComponent("Modal");

  const [openUploadSignatureModal, setOpenUploadSignatureModal] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [signedDocumentUploadID, setSignedDocumentUploadID] = useState(""); //signed notification filestore id
  const [isBulkRescheduleDisabled, setIsBulkRescheduleDisabled] = useState(true);
  const [businessOfTheDay, setBusinessOfTheDay] = useState("");
  const [Loading, setLoader] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo?.type]);
  const accessToken = window.localStorage.getItem("token");

  const name = "Signature";
  const pageModule = "en";
  const judgeId = localStorage.getItem("judgeId");
  const courtId = localStorage.getItem("courtId");

  const bulkNotificationStepper = sessionStorage.getItem("bulkNotificationStepper")
    ? parseInt(sessionStorage.getItem("bulkNotificationStepper"))
    : null;

  const bulkNotificationFormData = sessionStorage.getItem("bulkNotificationFormData")
    ? JSON.parse(sessionStorage.getItem("bulkNotificationFormData"))
    : null;

  const bulkOldHearingData = sessionStorage.getItem("bulkOldHearingData") ? JSON.parse(sessionStorage.getItem("bulkOldHearingData")) : null;

  const bulkNewHearingData = sessionStorage.getItem("bulkNewHearingData") ? JSON.parse(sessionStorage.getItem("bulkNewHearingData")) : [];

  const bulkNotificationNumber = sessionStorage.getItem("bulkNotificationNumber")
    ? JSON.parse(sessionStorage.getItem("bulkNotificationNumber"))
    : null;

  const bulkNotificationFileStoreId = sessionStorage.getItem("bulkNotificationFileStoreId")
    ? JSON.parse(sessionStorage.getItem("bulkNotificationFileStoreId"))
    : null;

  const currentDiaryEntry = history.location?.state?.diaryEntry;
  const isADiarySigned = history.location?.state?.aDiarySigned;
  const [bulkFormData, setBulkFormData] = useState(currentDiaryEntry?.additionalDetails?.formData || bulkNotificationFormData || {});
  const [bulkToDate, setBulkToDate] = useState(bulkFormData?.toDate || selectedDate);
  const [bulkFromDate, setBulkFromDate] = useState(bulkFormData?.fromDate || selectedDate);
  const [signFormData, setSignFormData] = useState({});
  const [newHearingData, setNewHearingData] = useState(bulkNewHearingData);
  const [notificationNumber, setNotificationNumber] = useState(bulkNotificationNumber);
  const [originalHearingData, setOriginalHearingData] = useState(bulkOldHearingData);
  const [notificationFileStoreId, setNotificationFileStoreId] = useState(bulkNotificationFileStoreId);
  const [notificationReviewBlob, setNotificationReviewBlob] = useState({});
  const [notificationReviewFilename, setNotificationReviewFilename] = useState("");
  const [issignLoader, setSignLoader] = useState(false);
  const [fileUploadError, setFileUploadError] = useState(null);

  const [fileStoreIds, setFileStoreIds] = useState(new Set());

  const uri = `${window.location.origin}${Urls.FileFetchById}?tenantId=${tenantId}&fileStoreId=${notificationFileStoreId}`;
  const defaultValues = {
    toDate: bulkFormData?.toDate || selectedDate,
    fromDate: bulkFormData?.fromDate || selectedDate,
    reason: bulkFormData?.reason || "",
  };

  const showToast = (type, message, duration = 5000) => {
    setToastMsg({ key: type, action: message });
    setTimeout(() => {
      setToastMsg(null);
    }, duration);
  };

  useEffect(() => {
    if (currentDiaryEntry) setStepper(1);
    const esignProcess = sessionStorage.getItem("esignProcess");
    if (esignProcess) {
      setTimeout(() => {
        sessionStorage.removeItem("esignProcess");
        clearLocalStorage();
      }, 200);
    }
  }, [currentDiaryEntry, setStepper]);

  useEffect(() => {
    if (bulkNotificationStepper) {
      setStepper(bulkNotificationStepper);
    }
  }, [bulkNotificationStepper, setStepper]);

  const { data: hearingDetails } = Digit.Hooks.hearings.useGetHearings(
    {
      criteria: {
        tenantId,
        fromDate: bulkFromDate ? bulkFromDate : null,
        toDate: bulkToDate ? bulkToDate + 24 * 60 * 60 * 1000 - 1 : null, //to get the end of the day
        ...(courtId && userType === "employee" && { courtId }),
      },
    },
    {},
    `${bulkFromDate}-${bulkToDate}`,
    Boolean(bulkFromDate && bulkToDate && stepper > 0 && courtId)
  );

  function formatTimeFromEpoch(epoch) {
    return new Date(epoch).toLocaleTimeString("en-GB", { hour12: false });
  }

  function timeToSeconds(timeStr) {
    const [hours, minutes, seconds] = timeStr.split(":").map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  }
  const bulkHearingsCount = useMemo(() => {
    // if (bulkFormData?.slotIds?.length > 0) {
    //   const filteredHearings = hearingDetails?.HearingList?.filter((hearing) => {
    //     const hearingStart = timeToSeconds(formatTimeFromEpoch(hearing.startTime));

    //     return (
    //       hearing?.status != "COMPLETED" &&
    //       bulkFormData?.slotIds?.some((slot) => hearingStart >= timeToSeconds(slot.slotStartTime) && hearingStart <= timeToSeconds(slot.slotEndTime))
    //     );
    //   });

    //   setOriginalHearingData(filteredHearings);
    //   return filteredHearings?.length || 0;
    // }
    setOriginalHearingData(hearingDetails?.HearingList);
    const filteredHearings = hearingDetails?.HearingList?.filter((hearing) => hearing?.status !== "COMPLETED");
    return filteredHearings?.length || 0;
  }, [hearingDetails]);

  const onSelect = (key, value) => {
    if (value?.Signature === null) {
      setSignFormData({});
      setIsSigned(false);
    } else {
      setSignFormData((prevData) => ({
        ...prevData,
        [key]: value,
      }));
    }
    setFileUploadError(null);
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

  const clearLocalStorage = () => {
    sessionStorage.removeItem("bulkNotificationStepper");
    sessionStorage.removeItem("bulkNotificationFormData");
    sessionStorage.removeItem("bulkOldHearingData");
    sessionStorage.removeItem("bulkNewHearingData");
    sessionStorage.removeItem("bulkNotificationNumber");
    sessionStorage.removeItem("bulkNotificationFileStoreId");
    return;
  };

  const uploadSignedPdf = async () => {
    try {
      setLoader(true);
      const localStorageID = sessionStorage.getItem("fileStoreId");
      const searchNotification = await hearingService?.searchNotification({
        criteria: {
          tenantId: tenantId,
          notificationNumber: notificationNumber,
          courtId: courtId,
        },
        pagination: {
          limit: 100,
        },
      });

      const newFileStoreId = signedDocumentUploadID || localStorageID;
      fileStoreIds.delete(newFileStoreId);
      await hearingService?.updateNotification({
        notification: {
          ...searchNotification?.list?.[0],
          documents: [
            ...searchNotification?.list?.[0]?.documents?.map((doc) => {
              if (doc?.documentType === "Bulk Reschedule unsigned") {
                const unsignedFileStoreId = doc.fileStore;
                fileStoreIds.delete(unsignedFileStoreId);
                return { ...doc, isActive: false };
              }
              return { ...doc };
            }),
            {
              fileStore: signedDocumentUploadID || localStorageID,
              documentType: "Bulk Reschedule signed",
            },
            ...Array.from(fileStoreIds).map((fileStoreId) => ({
              fileStore: fileStoreId,
              isActive: false,
            })),
          ],
          workflow: {
            action: "E-SIGN",
          },
        },
      });
      const updatedHearingsData = newHearingData.map((newHearing) => {
        const orginalHearing = originalHearingData.find((original) => newHearing.hearingBookingId === original.hearingId);
        return orginalHearing
          ? {
              ...orginalHearing,
              startTime: newHearing.startTime,
              endTime: newHearing.endTime,
            }
          : newHearing;
      });
      await hearingService?.updateBulkHearing({
        hearings: updatedHearingsData,
      });
      const diaryEntries = newHearingData?.map((hearing) => {
        return {
          courtId: courtId,
          businessOfDay: `No sitting notified on ${DateUtils.getFormattedDate(
            hearing?.originalHearingDate,
            "DD-MM-YYYY",
            "/"
          )}. Case posted to ${DateUtils.getFormattedDate(hearing?.hearingDate, "DD-MM-YYYY", "/")}`,
          tenantId: tenantId,
          entryDate: new Date().setHours(0, 0, 0, 0),
          hearingDate: hearing?.startTime,
          referenceType: "notice",
          caseNumber: hearing?.caseId,
          referenceId: notificationNumber,
          additionalDetails: {
            filingNumber: hearing?.filingNumber,
            formData: bulkFormData || [],
            caseId: hearing?.caseId,
          },
        };
      });
      await hearingService?.addBulkDiaryEntries({
        diaryEntries: diaryEntries,
      });
      setLoader(false);
      setIsSigned(false);
      setStepper((prev) => prev + 1);
    } catch (error) {
      console.error("Error :", error);
      setLoader(false);
      showToast("error", t("ISSUE_IN_BULK_HEARING"), 5000);
      setStepper(0);
      setIsSigned(false);
      setSignedDocumentUploadID("");
    }
    clearLocalStorage();
  };

  const handleUpdateBusinessOfDayEntry = async () => {
    try {
      await hearingService
        .aDiaryEntryUpdate(
          {
            diaryEntry: {
              ...currentDiaryEntry,
              businessOfDay: businessOfTheDay,
            },
          },
          {}
        )
        .then(async () => {
          history.goBack();
        });
    } catch (error) {
      console.error("error: ", error);
      showToast("error", t("SOMETHING_WENT_WRONG"), 5000);
    }
  };

  useEffect(() => {
    const upload = async () => {
      if (signFormData?.uploadSignature?.Signature?.length > 0) {
        setIsSigned(true);
      }
    };
    upload();
  }, [signFormData, uploadDocuments]);

  useEffect(() => {
    checkSignStatus(name, signFormData, uploadModalConfig, onSelect, setIsSigned);
  }, [checkSignStatus, signFormData, uploadModalConfig]);

  const onCancel = () => {
    if (stepper === 1) {
      clearLocalStorage();
      setBulkFormData({});
      setNewHearingData([]);
    }
    setStepper((prev) => prev - 1);
  };

  const config = useMemo(
    () => [
      {
        body: [
          {
            type: "dropdown",
            key: "reason",
            label: "BULK_RESCHEDULE_REASON",
            isMandatory: true,
            disable: currentDiaryEntry ? true : false,
            populators: {
              label: "Reason for Reschedule",
              optionsKey: "name",
              isMandatory: true,
              name: "reason",
              mdmsConfig: {
                masterName: "BulkRescheduleReason",
                moduleName: "Hearing",
                select: "(data) => { return data['Hearing'].BulkRescheduleReason?.map((item) => {return item;});}",
              },
            },
          },
          {
            type: "component",
            component: "CustomDatePicker",
            disable: currentDiaryEntry ? true : false,
            key: "fromDate",
            label: "BULK_FROM_DATE",
            isMandatory: true,
            customStyleLabelField: { display: "flex", justifyContent: "space-between" },
            populators: {
              name: "fromDate",
              // error: "Required",
            },
          },
          {
            label: "BULK_TO_DATE",
            isMandatory: true,
            key: "toDate",
            type: "component",
            component: "CustomDatePicker",
            customStyleLabelField: { display: "flex", justifyContent: "space-between" },
            disable: currentDiaryEntry ? true : false,
            populators: {},
          },
          // {
          //   label: "BULK_SLOT",
          //   isMandatory: true,
          //   key: "slotIds",
          //   type: "dropdown",
          //   disable: currentDiaryEntry ? true : false,
          //   // disable: true,//dynamic based on dates court.slots
          //   populators: {
          //     name: "slotIds",
          //     optionsKey: "slotName",
          //     allowMultiSelect: true,
          //     isMandatory: true,
          //     // defaultText: "select slot",
          //     selectedText: "Slot(s)",
          //     mdmsConfig: {
          //       masterName: "slots",
          //       moduleName: "court",
          //       select: "(data) => {return data['court'].slots?.map((item) => {return item;});}",
          //     },
          //   },
          // },
        ],
      },
    ],
    [currentDiaryEntry]
  );

  const compareDates = (dateStr1, dateStr2) => {
    const date1 = new Date(dateStr1);
    const date2 = new Date(dateStr2);

    return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth() && date1.getDate() === date2.getDate();
  };

  const modifiedConfig = useMemo(() => {
    if (bulkToDate && bulkToDate && !compareDates(bulkFromDate, bulkToDate)) {
      let updatedConfig = [{}];
      updatedConfig[0].body = config[0].body.map((item) => {
        return item;
      });
      return updatedConfig;
    }
    return config;
  }, [bulkFromDate, bulkToDate, config]);

  const onFormValueChange = (setValue, formData, formState, reset, setError, clearErrors) => {
    const newFromDate = formData?.fromDate;
    let newToDate = formData?.toDate;
    if (newToDate && newFromDate) {
      const date1 = new Date(newFromDate);
      const date2 = new Date(newToDate);
      if (date1 > date2) {
        setError("toDate", { message: "BULK_INVALID_DATE_RANGE" });
        setValue("toDate", null);
        newToDate = null;
      } else if (Object.keys(formState?.errors).includes("toDate") && date2) {
        clearErrors("toDate");
      }
    }
    if (newFromDate && !compareDates(newFromDate, bulkFromDate)) {
      setBulkFromDate(newFromDate);
    }

    if (newToDate && !compareDates(newToDate, bulkToDate)) {
      setBulkToDate(newToDate);
    }

    if (newFromDate && newToDate && Boolean(formData?.reason && formData?.toDate && formData?.fromDate && Object.keys(formState?.errors))) {
      setIsBulkRescheduleDisabled(false);
    } else if (
      Boolean(formData?.slotIds?.length > 0 && formData?.reason && formData?.toDate && formData?.fromDate && Object.keys(formState?.errors))
    ) {
      setIsBulkRescheduleDisabled(false);
    } else if (!isBulkRescheduleDisabled) {
      setIsBulkRescheduleDisabled(true);
      if (Object.keys(formState?.errors)) {
        clearErrors();
      }
    }
    if (!isEqual(bulkFormData, formData)) {
      setBulkFormData(formData);
    }
  };

  const onSumbitReschedule = async () => {
    try {
      setLoader(true);

      const response = await axiosInstance.post(
        Urls.hearing.createNotificationPdf,

        {
          RequestInfo: {
            authToken: accessToken,
            userInfo: userInfo,
            msgId: `${Date.now()}|${Digit.StoreData.getCurrentLanguage()}`,
            apiId: "Dristi",
          },
          BulkReschedule: {
            reason: bulkFormData?.reason,
            courtId: courtId,
            hearings:
              newHearingData?.map(({ filingNumber, startTime, originalHearingDate, hearingType }) => ({
                filingNumber,
                startTime,
                originalHearingDate,
                hearingType,
              })) || [],
          },
        },
        {
          params: {
            tenantId: tenantId,
            qrCode: false,
            hearingPdfType: "order-bulk-reschedule",
          },
          responseType: "blob",
        }
      );

      const notificationReviewPdf = response.data;
      const notificationPreviewFileName = response.headers["content-disposition"]?.split("filename=")[1];

      if (notificationReviewPdf) {
        setNotificationReviewBlob(notificationReviewPdf);
        setNotificationReviewFilename(notificationPreviewFileName);
        setStepper((prev) => prev + 1);
      } else {
        console.error("Failed to generate PDF");
      }
      setLoader(false);
    } catch (error) {
      setLoader(false);
      console.error("Error generating notificationReviewPdf:", error);
    }
  };

  const onAddSignature = async () => {
    try {
      let fileStoreId = notificationFileStoreId;
      if (notificationReviewBlob?.size) {
        const pdfFile = new File([notificationReviewBlob], notificationReviewFilename, { type: "application/pdf" });
        const fileUploadRes = await Digit.UploadServices.Filestorage("DRISTI", pdfFile, Digit.ULBService.getCurrentTenantId());
        fileStoreId = fileUploadRes?.data?.files?.[0]?.fileStoreId;
        setNotificationFileStoreId(fileStoreId);
        setFileStoreIds((fileStoreIds) => new Set([...fileStoreIds, fileStoreId]));
      } else if (!notificationFileStoreId) {
        showToast("error", t("SOME_ERRORS_IN_HEARING_RESCHEDULE"), 5000);
        return;
      }
      const caseNumbers = newHearingData?.filter((hearing) => hearing?.caseId).map((hearing) => hearing.caseId);
      const createNotificationResponse = await hearingService?.createNotification({
        notification: {
          additionalDetails: { reason: bulkFormData?.reason?.code },
          tenantId: tenantId,
          caseNumber: caseNumbers,
          notificationType: "Notification for Bulk Reschedule",
          courtId: courtId,
          issuedBy: userInfo?.userName,
          createdDate: new Date().getTime(),
          workflow: { action: "CREATE" },
          isActive: true,
          documents: [
            {
              documentType: "Bulk Reschedule unsigned",
              fileStore: fileStoreId,
              additionalDetails: {},
            },
          ],
        },
      });
      setNotificationNumber(createNotificationResponse?.notification?.notificationNumber);
      if (stepper === 2) setStepper(3);
    } catch (error) {
      console.error("Error:", error);
    }
  };
  const handleDownloadOrders = () => {
    const downloadFileStoreId = signedDocumentUploadID || sessionStorage.getItem("fileStoreId");
    downloadPdf(tenantId, downloadFileStoreId);
  };

  const onUploadSubmit = async () => {
    if (signFormData?.uploadSignature?.Signature?.length > 0) {
      try {
        setSignLoader(true);
        const uploadedFileId = await uploadDocuments(signFormData?.uploadSignature?.Signature, tenantId);
        const newFileStoreId = uploadedFileId?.[0]?.fileStoreId;
        setSignedDocumentUploadID(newFileStoreId);
        setFileStoreIds((fileStoreIds) => new Set([...fileStoreIds, newFileStoreId]));
        setIsSigned(true);
        setOpenUploadSignatureModal(false);
      } catch (error) {
        console.error("error", error);
        setSignLoader(false);
        setSignFormData({});
        setIsSigned(false);
        setFileUploadError(error?.response?.data?.Errors?.[0]?.code || "CS_FILE_UPLOAD_ERROR");
      }
      setSignLoader(false);
    }
  };

  return (
    <React.Fragment>
      {stepper === 1 && (
        <BulkRescheduleModal
          t={t}
          Loading={Loading}
          modifiedConfig={modifiedConfig}
          onFormValueChange={onFormValueChange}
          defaultValues={defaultValues}
          currentDiaryEntry={currentDiaryEntry}
          onCancel={onCancel}
          onSumbitReschedule={onSumbitReschedule}
          isBulkRescheduleDisabled={isBulkRescheduleDisabled}
          bulkHearingsCount={bulkHearingsCount}
          setBusinessOfTheDay={setBusinessOfTheDay}
          handleUpdateBusinessOfDayEntry={handleUpdateBusinessOfDayEntry}
          bulkFromDate={bulkFromDate}
          bulkToDate={bulkToDate}
          toastMsg={toastMsg}
          setToastMsg={setToastMsg}
          setNewHearingData={setNewHearingData}
          newHearingData={newHearingData}
          bulkFormData={bulkFormData}
          isADiarySigned={isADiarySigned}
        />
      )}
      {stepper === 2 && (
        <Modal
          headerBarEnd={<CloseBtn onClick={onCancel} />}
          formId="modal-action"
          headerBarMain={<Heading label={t("NOTIFICATION_REVIEW")} />}
          actionSaveOnSubmit={onAddSignature}
          actionSaveLabel={t("ADD_SIGNATURE")}
          popupStyles={{
            width: "70%",
          }}
        >
          {Loading ? (
            <Loader />
          ) : (
            <MemoDocViewerWrapper
              key={"bulk"}
              fileStoreId={notificationReviewBlob?.size ? null : notificationFileStoreId}
              selectedDocs={[notificationReviewBlob]}
              tenantId={tenantId}
              docWidth="100%"
              docHeight="70vh"
              showDownloadOption={false}
              documentName={t("BULK_RESCHEDULE")}
            />
          )}
        </Modal>
      )}
      {stepper === 3 && !openUploadSignatureModal && !isSigned && (
        <Modal
          headerBarMain={<Heading label={t("ADD_SIGNATURE")} />}
          headerBarEnd={<CloseBtn onClick={onCancel} />}
          actionCancelLabel={t("CS_COMMON_BACK")}
          actionCancelOnSubmit={onCancel}
          actionSaveLabel={t("CS_COMMON_SUBMIT")}
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
                    <span style={{ fontWeight: "bold" }}>{`${t("NOTIFICATION")}`}</span>
                  </p>,
                ]}
                inline
                style={{ marginBottom: "10px", backgroundColor: "rgba(0, 0, 0, 0.05)" }}
                textStyle={{}}
                className={`custom-info-card`}
              />
              <h1>{t("YOUR_SIGNATURE")}</h1>
              <div className="sign-button-wrap">
                <Button
                  label={t("CS_ESIGN")}
                  onButtonClick={() => {
                    sessionStorage.setItem("bulkNotificationStepper", parseInt(stepper));
                    sessionStorage.setItem("bulkNotificationFormData", JSON.stringify(bulkFormData));
                    sessionStorage.setItem("bulkOldHearingData", JSON.stringify(originalHearingData));
                    sessionStorage.setItem("bulkNewHearingData", JSON.stringify(newHearingData));
                    sessionStorage.setItem("bulkNotificationNumber", JSON.stringify(notificationNumber));
                    sessionStorage.setItem("bulkNotificationFileStoreId", JSON.stringify(notificationFileStoreId));
                    handleEsign(name, pageModule, notificationFileStoreId, "Signature");
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
                <h2>{t("DOWNLOAD_NOTIFICATION_TEXT")}</h2>
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

      {stepper === 3 && openUploadSignatureModal && (
        <UploadSignatureModal
          t={t}
          key={name}
          name={name}
          setOpenUploadSignatureModal={setOpenUploadSignatureModal}
          onSelect={onSelect}
          config={uploadModalConfig}
          formData={signFormData}
          onSubmit={onUploadSubmit}
          isDisabled={issignLoader}
          fileUploadError={fileUploadError}
        />
      )}

      {stepper === 3 && !openUploadSignatureModal && isSigned && (
        <Modal
          headerBarMain={<Heading label={t("ADD_SIGNATURE")} />}
          headerBarEnd={<CloseBtn onClick={onCancel} />}
          actionCancelLabel={t("CS_COMMON_BACK")}
          actionCancelOnSubmit={onCancel}
          actionSaveLabel={t("SUBMIT_BUTTON")}
          actionSaveOnSubmit={uploadSignedPdf}
          className="add-signature-modal"
        >
          {Loading ? (
            <Loader />
          ) : (
            <div className="add-signature-main-div">
              <InfoCard
                variant={"default"}
                label={t("PLEASE_NOTE")}
                additionalElements={[
                  <p key="note">
                    {t("YOU_ARE_ADDING_YOUR_SIGNATURE_TO_THE")}
                    <span style={{ fontWeight: "bold" }}>{`${t("NOTIFICATION")} `}</span>
                  </p>,
                ]}
                inline
                style={{ marginBottom: "16px" }}
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
          )}
        </Modal>
      )}
      {stepper === 4 && (
        <Modal
          actionCancelLabel={t("CS_COMMON_DOWNLOAD")}
          actionCancelOnSubmit={handleDownloadOrders}
          actionSaveLabel={t("CS_CLOSE")}
          actionSaveOnSubmit={async () => {
            setSignedDocumentUploadID("");
            sessionStorage.removeItem("fileStoreId");
            setStepper(0);
            await refetch();
          }}
          className={"orders-success-modal"}
          cancelButtonBody={<FileDownloadIcon></FileDownloadIcon>}
          popupModuleMianStyles={{ padding: "0px !important" }}
        >
          <div style={{ padding: "8px 24px" }}>
            <div>
              <Banner
                whichSvg={"tick"}
                successful={true}
                message={t("SUCCESS_NOTIFICATION_TEXT")}
                headerStyles={{ fontSize: "32px" }}
                style={{ minWidth: "100%", marginTop: "10px" }}
              ></Banner>
              {
                <CustomCopyTextDiv
                  t={t}
                  keyStyle={{ margin: "8px 0px" }}
                  valueStyle={{ margin: "8px 0px", fontWeight: 700 }}
                  data={[
                    { key: t("NOTIFICATION_DATE"), value: new Date().toLocaleDateString("en-GB"), copyData: false },
                    { key: t("NOTIFICATION_ID"), value: notificationNumber, copyData: true },
                  ]}
                />
              }
            </div>
          </div>
        </Modal>
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
    </React.Fragment>
  );
};

export default BulkReschedule;
