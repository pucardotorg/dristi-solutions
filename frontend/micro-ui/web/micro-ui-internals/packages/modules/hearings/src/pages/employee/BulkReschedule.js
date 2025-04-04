import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Banner, Button, CloseSvg, FormComposerV2, Loader, TextInput, Toast } from "@egovernments/digit-ui-react-components";
import { InfoCard } from "@egovernments/digit-ui-components";
import { Urls } from "../../hooks/services/Urls";
import { FileUploadIcon } from "@egovernments/digit-ui-module-dristi/src/icons/svgIndex";
import AuthenticatedLink from "@egovernments/digit-ui-module-dristi/src/Utils/authenticatedLink";
import isEqual from "lodash/isEqual";
import { hearingService } from "../../hooks/services";
import Axios from "axios";
import { useHistory } from "react-router-dom";
import { FileDownloadIcon } from "@egovernments/digit-ui-module-dristi/src/icons/svgIndex";
import CustomCopyTextDiv from "@egovernments/digit-ui-module-dristi/src/components/CustomCopyTextDiv";
import { useToast } from "@egovernments/digit-ui-module-dristi/src/components/Toast/useToast";

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
const BulkReschedule = ({ stepper, setStepper, selectedDate = new Date().setHours(0, 0, 0, 0), selectedSlot = [] }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const toast = useToast();
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
  const userInfo = Digit.UserService.getUser()?.info;

  const name = "Signature";
  const pageModule = "en";
  const judgeId = window?.globalConfigs?.getConfig("JUDGE_ID") || "JUDGE_ID";
  const courtId = window?.globalConfigs?.getConfig("COURT_ID") || "KLKM52";

  const bulkNotificationStepper = localStorage.getItem("bulkNotificationStepper") ? parseInt(localStorage.getItem("bulkNotificationStepper")) : null;

  const bulkNotificationFormData = localStorage.getItem("bulkNotificationFormData")
    ? JSON.parse(localStorage.getItem("bulkNotificationFormData"))
    : null;

  const bulkOldHearingData = localStorage.getItem("bulkOldHearingData") ? JSON.parse(localStorage.getItem("bulkOldHearingData")) : null;

  const bulkNewHearingData = localStorage.getItem("bulkNewHearingData") ? JSON.parse(localStorage.getItem("bulkNewHearingData")) : [];

  const bulkNotificationNumber = localStorage.getItem("bulkNotificationNumber") ? JSON.parse(localStorage.getItem("bulkNotificationNumber")) : null;

  const bulkNotificationFileStoreId = localStorage.getItem("bulkNotificationFileStoreId")
    ? JSON.parse(localStorage.getItem("bulkNotificationFileStoreId"))
    : null;

  const currentDiaryEntry = history.location?.state?.diaryEntry;
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

  const uri = `${window.location.origin}${Urls.FileFetchById}?tenantId=${tenantId}&fileStoreId=${notificationFileStoreId}`;
  const defaultValues = {
    toDate: bulkFormData?.toDate || selectedDate,
    fromDate: bulkFormData?.fromDate || selectedDate,
    slotIds: bulkFormData?.slotIds || (Array.isArray(selectedSlot) ? selectedSlot : []),
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
  }, [currentDiaryEntry]);

  useEffect(() => {
    if (bulkNotificationStepper) {
      setStepper(bulkNotificationStepper);
      localStorage.removeItem("bulkNotificationStepper");
    }
  }, [bulkNotificationStepper]);

  const { data: hearingDetails, refetch: refetchHearingDetails } = Digit.Hooks.hearings.useGetHearings(
    {
      criteria: {
        tenantId,
        fromDate: bulkFromDate ? bulkFromDate : null,
        toDate: bulkToDate ? bulkToDate + 24 * 60 * 60 * 1000 - 1 : null, //to get the end of the day
      },
    },
    {},
    `${bulkFromDate}-${bulkToDate}`,
    Boolean(bulkFromDate && bulkToDate)
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
    const filteredHearings = hearingDetails?.HearingList?.filter((hearing) => hearing?.status != "COMPLETED");
    return filteredHearings?.length || 0;
  }, [hearingDetails, bulkFormData?.slotIds]);

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
            maxFileSize: 5,
            maxFileErrorMessage: "CS_FILE_LIMIT_5_MB",
            fileTypes: ["JPG", "PNG", "JPEG", "PDF"],
            isMultipleUpload: false,
          },
        ],
        validation: {},
      },
    };
  }, [name]);

  const clearLocalStorage = () => {
    localStorage.removeItem("bulkNotificationStepper");
    localStorage.removeItem("bulkNotificationFormData");
    localStorage.removeItem("bulkOldHearingData");
    localStorage.removeItem("bulkNewHearingData");
    localStorage.removeItem("bulkNotificationNumber");
    localStorage.removeItem("bulkNotificationFileStoreId");
    localStorage.removeItem("bulkNotificationReviewBlob");
    localStorage.removeItem("bulkNotificationFileName");
    return;
  };

  const uploadSignedPdf = async () => {
    try {
      setLoader(true);
      const localStorageID = localStorage.getItem("fileStoreId");
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
      const updateNotificationResponse = await hearingService?.updateNotification({
        notification: {
          ...searchNotification?.list?.[0],
          documents: searchNotification?.list?.[0]?.documents?.map((doc) =>
            doc?.documentType === "Bulk Reschedule unsigned"
              ? { ...doc, fileStore: signedDocumentUploadID || localStorageID, documentType: "Bulk Reschedule signed" }
              : doc
          ),
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
      const newBulkHearings = await hearingService?.updateBulkHearing({
        hearings: updatedHearingsData,
      });
      const diaryEntries = newHearingData?.map((hearing) => {
        return {
          judgeId: judgeId,
          businessOfDay: `No sitting notified on ${formatDate(hearing?.originalHearingDate)}. Case adjourned to ${formatDate(hearing?.hearingDate)}`,
          tenantId: tenantId,
          entryDate: new Date().setHours(0, 0, 0, 0),
          hearingDate: hearing?.startTime,
          referenceType: "bulkreschedule",
          caseNumber: hearing?.caseId,
          referenceId: notificationNumber,
          additionalDetails: {
            filingNumber: hearing?.filingNumber,
            formData: bulkFormData || [],
            caseId: hearing?.caseId,
          },
        };
      });
      const addBulkDiaryEntries = await hearingService?.addBulkDiaryEntries({
        diaryEntries: diaryEntries,
      });
      setLoader(false);
      setIsSigned(false);
      setStepper((prev) => prev + 1);
    } catch (error) {
      console.log("Error :", error);
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
        const uploadedFileId = await uploadDocuments(signFormData?.uploadSignature?.Signature, tenantId);
        setSignedDocumentUploadID(uploadedFileId[0]?.fileStoreId);
        setIsSigned(true);
      }
    };
    upload();
  }, [signFormData]);

  useEffect(() => {
    checkSignStatus(name, signFormData, uploadModalConfig, onSelect, setIsSigned);
  }, [checkSignStatus]);

  const onCancel = () => {
    if (stepper === 1) {
      clearLocalStorage();
    }
    setStepper((prev) => prev - 1);
  };

  const config = [
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
          disable: currentDiaryEntry ? true : false,
          populators: {},
        },
        {
          label: "BULK_SLOT",
          isMandatory: true,
          key: "slotIds",
          type: "dropdown",
          disable: currentDiaryEntry ? true : false,
          // disable: true,//dynamic based on dates court.slots
          populators: {
            name: "slotIds",
            optionsKey: "slotName",
            allowMultiSelect: true,
            isMandatory: true,
            // defaultText: "select slot",
            selectedText: "Slot(s)",
            mdmsConfig: {
              masterName: "slots",
              moduleName: "court",
              select: "(data) => {return data['court'].slots?.map((item) => {return item;});}",
            },
          },
        },
      ],
    },
  ];

  const compareDates = (dateStr1, dateStr2) => {
    const date1 = new Date(dateStr1);
    const date2 = new Date(dateStr2);

    return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth() && date1.getDate() === date2.getDate();
  };

  const modifiedConfig = useMemo(() => {
    if (bulkToDate && bulkToDate && !compareDates(bulkFromDate, bulkToDate)) {
      let updatedConfig = [{}];
      updatedConfig[0].body = config[0].body.map((item) => {
        return item.key === "slotIds" ? { ...item, disable: true, isMandatory: false } : item;
      });
      return updatedConfig;
    }
    return config;
  }, [bulkFromDate, bulkToDate]);

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

    if (newFromDate && newToDate && !compareDates(newFromDate, newToDate)) {
      if (formData?.["slotIds"]?.length > 0) setValue("slotIds", []);
      if (Boolean(formData?.reason && formData?.toDate && formData?.fromDate && Object.keys(formState?.errors))) {
        setIsBulkRescheduleDisabled(false);
      }
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const onSumbitReschedule = async () => {
    try {
      setLoader(true);
      const tentativeDates = await hearingService?.bulkReschedule({
        BulkReschedule: {
          judgeId,
          courtId,
          scheduleAfter: bulkFormData?.toDate + 24 * 60 * 60 * 1000 + 1, //we are sending next day
          tenantId,
          startTime: bulkFormData?.fromDate,
          endTime: bulkFormData?.toDate + 24 * 60 * 60 * 1000 - 1, // End of the day
          slotIds: bulkFormData?.slotIds?.map((slot) => slot?.id) || [],
          reason: bulkFormData?.reason,
        },
      });
      if (tentativeDates?.Hearings?.length === 0) {
        showToast("error", t("NO_NEW_HEARINGS_AVAILABLE"), 5000);
        setLoader(false);
        return;
      }

      setNewHearingData(tentativeDates?.Hearings);

      const response = await Axios.post(
        Urls.hearing.createNotificationPdf,

        {
          RequestInfo: {
            authToken: Digit.UserService.getUser().access_token,
            userInfo: Digit.UserService.getUser()?.info,
            msgId: `${Date.now()}|${Digit.StoreData.getCurrentLanguage()}`,
            apiId: "Rainmaker",
          },
          BulkReschedule: {
            reason: bulkFormData?.reason,
            hearings:
              tentativeDates?.Hearings?.map(({ filingNumber, startTime, originalHearingDate, hearingType }) => ({
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
      } else if (!notificationFileStoreId) {
        showToast("error", t("SOME_ERRORS_IN_HEARING_RESCHEDULE"), 5000);
        return;
      }
      const caseNumbers = newHearingData?.filter((hearing) => hearing?.caseId).map((hearing) => hearing.caseId);
      const createNotificationResponse = await hearingService?.createNotification({
        notification: {
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
      if (stepper == 2) setStepper(3);
    } catch (error) {
      console.error("Error:", error);
    }
  };
  const handleDownloadOrders = () => {
    const downloadFileStoreId = signedDocumentUploadID || localStorage.getItem("fileStoreId");
    downloadPdf(tenantId, downloadFileStoreId);
  };

  const onUploadSubmit = async () => {
    if (signFormData?.uploadSignature?.Signature?.length > 0) {
      try {
        const uploadedFileId = await uploadDocuments(signFormData?.uploadSignature?.Signature, tenantId);
        setSignedDocumentUploadID(uploadedFileId?.[0]?.fileStoreId);
        setIsSigned(true);
        localStorage.setItem("formData", JSON.stringify(signFormData));
        setOpenUploadSignatureModal(false);
      } catch (error) {
        console.error("error", error);
        setSignFormData({});
        setIsSigned(false);
      }
    }
  };

  return (
    <React.Fragment>
      {stepper === 1 && (
        <Modal
          headerBarEnd={<CloseBtn onClick={() => (currentDiaryEntry ? history.goBack() : onCancel())} />}
          formId="modal-action"
          headerBarMain={
            <Heading
              label={`${t("BULK_RESCHEDULE")}${
                currentDiaryEntry?.additionalDetails?.caseId ? " - " + currentDiaryEntry?.additionalDetails?.caseId : ""
              }`}
            />
          }
          actionCancelLabel={t("CS_COMMON_BACK")}
          actionCancelOnSubmit={onCancel}
          actionSaveOnSubmit={onSumbitReschedule}
          actionSaveLabel={t("RESHEDULE_BTN")}
          style={{ margin: "10px 0px" }}
          isDisabled={isBulkRescheduleDisabled || bulkHearingsCount === 0}
          actionCancelStyle={{ margin: "10px 0px" }}
          hideModalActionbar={currentDiaryEntry ? true : false}
        >
          {Loading ? (
            <Loader />
          ) : (
            <div>
              <FormComposerV2
                key="bulk-reschedule"
                config={modifiedConfig}
                style={{ width: "100%", margin: "0px", padding: "0px !important" }}
                onFormValueChange={onFormValueChange}
                t={t}
                noBoxShadow
                inline={true}
                className={"bulk-reschedule"}
                fieldStyle={{ margin: 0, Background: "black" }}
                cardStyle={{ minWidth: "100%", Background: "blue" }}
                cardClassName={"card-shec"}
                headingStyle={{ textAlign: "center" }}
                defaultValues={defaultValues}
              />

              {currentDiaryEntry && (
                <div style={{ padding: "10px" }}>
                  <h3 style={{ marginTop: 0, marginBottom: "2px" }}>{t("BUSINESS_OF_THE_DAY")} </h3>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <TextInput
                      className="field desktop-w-full"
                      onChange={(e) => {
                        setBusinessOfTheDay(e.target.value);
                      }}
                      defaultValue={currentDiaryEntry?.businessOfDay}
                      style={{}}
                      textInputStyle={{ maxWidth: "100%" }}
                    />
                    {currentDiaryEntry && (
                      <Button
                        label={t("SAVE")}
                        variation={"primary"}
                        style={{ padding: 15, boxShadow: "none" }}
                        onButtonClick={() => {
                          handleUpdateBusinessOfDayEntry();
                        }}
                      />
                    )}
                  </div>
                </div>
              )}

              {!isBulkRescheduleDisabled && !currentDiaryEntry && bulkHearingsCount !== 0 && (
                <InfoCard
                  variant={"default"}
                  label={t("PLEASE_NOTE")}
                  additionalElements={{}}
                  inline
                  text={t(`${t("BULK_INFO1")} ${bulkHearingsCount} ${t("BULK_INFO2")} ${formatDate(bulkFromDate)} and ${formatDate(bulkToDate)}`)}
                  textStyle={{}}
                  className={`custom-info-card`}
                  style={{ margin: "15px" }}
                />
              )}
              {!isBulkRescheduleDisabled && !currentDiaryEntry && bulkHearingsCount === 0 && (
                <InfoCard
                  variant={"default"}
                  label={t("PLEASE_NOTE")}
                  additionalElements={{}}
                  inline
                  text={t("BULK_NO_HEARINGS_SELECTED")}
                  textStyle={{}}
                  className={`custom-info-card`}
                  style={{ margin: "15px" }}
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
          )}
        </Modal>
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
                    localStorage.setItem("bulkNotificationStepper", parseInt(stepper));
                    localStorage.setItem("bulkNotificationFormData", JSON.stringify(bulkFormData));
                    localStorage.setItem("bulkOldHearingData", JSON.stringify(originalHearingData));
                    localStorage.setItem("bulkNewHearingData", JSON.stringify(newHearingData));
                    localStorage.setItem("bulkNotificationNumber", JSON.stringify(notificationNumber));
                    localStorage.setItem("bulkNotificationFileStoreId", JSON.stringify(notificationFileStoreId));
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
          actionSaveOnSubmit={() => {
            setSignedDocumentUploadID("");
            localStorage.removeItem("fileStoreId");
            setStepper(0);
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
