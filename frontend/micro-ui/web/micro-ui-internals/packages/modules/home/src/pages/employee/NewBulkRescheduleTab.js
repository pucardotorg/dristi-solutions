import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Banner, Button, CardLabel, Dropdown, LabelFieldPair, Loader } from "@egovernments/digit-ui-react-components";
import { CloseBtn, Heading } from "@egovernments/digit-ui-module-dristi/src/components/ModalComponents";
import { FileDownloadIcon } from "@egovernments/digit-ui-module-dristi/src/icons/svgIndex";
import CustomCopyTextDiv from "@egovernments/digit-ui-module-dristi/src/components/CustomCopyTextDiv";
import NewBulkRescheduleTable from "./NewBulkRescheduleTable";
import { Urls } from "@egovernments/digit-ui-module-hearings/src/hooks/services/Urls";
import { hearingService } from "@egovernments/digit-ui-module-hearings/src/hooks/services";
import get from "lodash/get";
import axiosInstance from "@egovernments/digit-ui-module-core/src/Utils/axiosInstance";
import { DateUtils } from "@egovernments/digit-ui-module-dristi/src/Utils";
import CustomToast from "@egovernments/digit-ui-module-dristi/src/components/CustomToast";
import { SIGNATURE_UPLOAD_CONFIG, buildUploadModalConfig, getUploadErrorToast } from "@egovernments/digit-ui-module-common";
import {
  loadBulkRescheduleSession,
  clearBulkRescheduleSession,
  saveBulkRescheduleSession,
  bulkRescheduleSignatureOnSelect,
  BulkNotificationSignatureModals,
} from "@egovernments/digit-ui-module-hearings/src/pages/employee/shared/bulkRescheduleShared";

const tenantId = window?.Digit.ULBService.getCurrentTenantId();

const NewBulkRescheduleTab = ({ stepper, setStepper, selectedDate = new Date().setHours(0, 0, 0, 0), selectedSlot = [] }) => {
  const { t } = useTranslation();
  const { handleEsign, checkSignStatus } = Digit.Hooks.orders.useESign();
  const { uploadDocuments } = Digit.Hooks.orders.useDocumentUpload();
  const { downloadPdf } = Digit.Hooks.dristi.useDownloadCasePdf();

  const DocViewerWrapper = Digit?.ComponentRegistryService?.getComponent("DocViewerWrapper");
  const MemoDocViewerWrapper = React.memo(DocViewerWrapper);
  const Modal = window?.Digit?.ComponentRegistryService?.getComponent("Modal");

  const [showToast, setShowToast] = useState(null);
  const [openUploadSignatureModal, setOpenUploadSignatureModal] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [signedDocumentUploadID, setSignedDocumentUploadID] = useState(""); //signed notification filestore id
  const [loader, setLoader] = useState(false);
  const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo?.type]);
  const accessToken = window.localStorage.getItem("token");

  const name = "Signature";
  const pageModule = "en";
  const judgeId = localStorage.getItem("judgeId");
  const courtId = localStorage.getItem("courtId");

  const {
    bulkNotificationStepper,
    bulkNotificationFormData,
    bulkOldHearingData,
    bulkNewHearingData,
    bulkNotificationNumber,
    bulkNotificationFileStoreId,
    bulkAllHearingsData,
  } = loadBulkRescheduleSession({ includeHomeFields: true });

  const [signFormData, setSignFormData] = useState({});
  const [newHearingData, setNewHearingData] = useState(bulkNewHearingData);
  const [notificationNumber, setNotificationNumber] = useState(bulkNotificationNumber);
  const [originalHearingData, setOriginalHearingData] = useState(bulkOldHearingData);
  const [notificationFileStoreId, setNotificationFileStoreId] = useState(bulkNotificationFileStoreId);
  const [notificationReviewBlob, setNotificationReviewBlob] = useState({});
  const [notificationReviewFilename, setNotificationReviewFilename] = useState("");
  const [issignLoader, setSignLoader] = useState(false);
  const [fileUploadError, setFileUploadError] = useState(null);
  const [allHearings, setAllHearings] = useState(bulkAllHearingsData || []);
  const [loading, setIsLoader] = useState(false);
  const roles = useMemo(() => userInfo?.roles, [userInfo]);
  const assignedRoles = useMemo(() => roles?.map((role) => role?.code), [roles]);
  const hasNotificationApproveAccess = useMemo(() => userInfo?.roles?.some((role) => role.code === "NOTIFICATION_APPROVER"), [userInfo]);
  const hasBulkRescheduleAccess = useMemo(
    () =>
      ["BULK_RESCHEDULE_UPDATE_ACCESS", "NOTIFICATION_CREATOR", "NOTIFICATION_APPROVER", "DIARY_EDITOR"].every((role) =>
        assignedRoles?.includes(role)
      ),
    [assignedRoles]
  );

  const [fileStoreIds, setFileStoreIds] = useState(new Set());
  const today = new Date();
  const defaultBulkFormData = {
    fromDate: today.setHours(0, 0, 0, 0),
    toDate: today.setHours(0, 0, 0, 0),
    slotIds: [],
    searchableFields: null,
    reason: null,
  };
  const [bulkFormData, setBulkFormData] = useState(bulkNotificationFormData || defaultBulkFormData);

  const uri = `${window.location.origin}${Urls.FileFetchById}?tenantId=${tenantId}&fileStoreId=${notificationFileStoreId}`;

  useEffect(() => {
    const esignProcess = sessionStorage.getItem("esignProcess");
    if (esignProcess) {
      setTimeout(() => {
        sessionStorage.removeItem("esignProcess");
        clearLocalStorage();
      }, 200);
    }
  }, [setStepper]);

  useEffect(() => {
    if (bulkNotificationStepper) {
      setStepper(bulkNotificationStepper);
    }
  }, [bulkNotificationStepper, setStepper]);

  const { data: hearingDetails, refetch } = Digit.Hooks.hearings.useGetHearings(
    {
      criteria: {
        tenantId,
        fromDate: bulkFormData?.fromDate ? bulkFormData?.fromDate : null,
        toDate: bulkFormData?.toDate ? bulkFormData?.toDate + 24 * 60 * 60 * 1000 - 1 : null, //to get the end of the day
        ...(courtId && userType === "employee" && { courtId }),
      },
    },
    {},
    `${bulkFormData?.fromDate}-${bulkFormData?.toDate}`,
    Boolean(bulkFormData?.fromDate && bulkFormData?.toDate && courtId)
  );

  const { data: rescheduleReasonData, isLoading: isRescheduleReasonLoading } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    "Hearing",
    [{ name: "BulkRescheduleReason" }],
    {
      select: (data) => {
        return get(data, "Hearing.BulkRescheduleReason", []).map((opt) => ({ ...opt }));
      },
    }
  );

  const bulkHearingsCount = useMemo(() => {
    setOriginalHearingData(hearingDetails?.HearingList);
    const filteredHearings = hearingDetails?.HearingList?.filter((hearing) => hearing?.status !== "COMPLETED");
    return filteredHearings?.length || 0;
  }, [hearingDetails]);

  const onSelect = bulkRescheduleSignatureOnSelect(setSignFormData, setIsSigned, setFileUploadError);

  const uploadModalConfig = useMemo(() => buildUploadModalConfig(name, SIGNATURE_UPLOAD_CONFIG), [name]);

  const clearLocalStorage = () => {
    clearBulkRescheduleSession({ includeHomeFields: true });
    return;
  };

  const uploadSignedPdf = async () => {
    if (!hasNotificationApproveAccess) return;
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
      const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
      setShowToast({ error: true, label: t("ISSUE_IN_BULK_HEARING"), errorId });
      setStepper(1);
      setIsSigned(false);
      setSignedDocumentUploadID("");
    }
    clearLocalStorage();
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
      setBulkFormData((prev) => ({ ...prev, reason: null }));
    }
    setStepper((prev) => prev - 1);
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
      const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
      setShowToast({ error: true, label: t("ERROR_GENERATING_NOTIFICATION_PDF"), errorId });
    }
  };

  const onAddSignature = async () => {
    try {
      setLoader(true);
      let fileStoreId = notificationFileStoreId;
      if (notificationReviewBlob?.size) {
        const pdfFile = new File([notificationReviewBlob], notificationReviewFilename, { type: "application/pdf" });
        const fileUploadRes = await Digit.UploadServices.Filestorage("DRISTI", pdfFile, Digit.ULBService.getCurrentTenantId());
        fileStoreId = fileUploadRes?.data?.files?.[0]?.fileStoreId;
        setNotificationFileStoreId(fileStoreId);
        setFileStoreIds((fileStoreIds) => new Set([...fileStoreIds, fileStoreId]));
      } else if (!notificationFileStoreId) {
        setShowToast({ error: true, label: t("SOME_ERRORS_IN_HEARING_RESCHEDULE") });
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
      const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
      setShowToast({ error: true, label: t("SOME_ERRORS_IN_HEARING_RESCHEDULE"), errorId });
    } finally {
      setLoader(false);
    }
  };
  const handleDownloadOrders = () => {
    const downloadFileStoreId = signedDocumentUploadID || sessionStorage.getItem("fileStoreId");
    downloadPdf(tenantId, downloadFileStoreId);
  };

  const onUploadSubmit = async (combineResult) => {
    if (signFormData?.uploadSignature?.Signature?.length > 0) {
      try {
        setSignLoader(true);
        const filesToUpload = combineResult?.combinedFiles || signFormData?.uploadSignature?.Signature;
        const uploadedFileId = await uploadDocuments(filesToUpload, tenantId);
        const newFileStoreId = uploadedFileId?.[0]?.fileStoreId;
        setSignedDocumentUploadID(newFileStoreId);
        setFileStoreIds((fileStoreIds) => new Set([...fileStoreIds, newFileStoreId]));
        setIsSigned(true);
        setOpenUploadSignatureModal(false);
      } catch (error) {
        console.error("error", error);
        setSignFormData({});
        setIsSigned(false);
        setFileUploadError(getUploadErrorToast(error, t));
      } finally {
        setSignLoader(false);
      }
    }
  };

  const handleBulkHearingSearch = async (newFormData) => {
    try {
      setIsLoader(true);
      const tentativeDates = await hearingService?.bulkReschedule({
        BulkReschedule: {
          judgeId,
          courtId,
          scheduleAfter: newFormData?.toDate + 24 * 60 * 60 * 1000 + 1, //we are sending next day
          tenantId,
          startTime: newFormData?.fromDate,
          endTime: newFormData?.toDate + 24 * 60 * 60 * 1000 - 1, // End of the day
          slotIds: newFormData?.slotIds?.map((slot) => slot?.id) || [],
          reason: newFormData?.reason,
          searchableFields: newFormData?.searchableFields,
        },
      });
      setAllHearings(tentativeDates?.Hearings || []);
      setNewHearingData(tentativeDates?.Hearings || []);
      if (tentativeDates?.Hearings?.length === 0) {
        setShowToast({ error: true, label: t("NO_NEW_HEARINGS_AVAILABLE") });
      }
    } catch (error) {
      console.error(error);
      const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
      setShowToast({ error: true, label: t("BULK_RESCHEDULE_ERROR_FETCHING"), errorId });
    } finally {
      setIsLoader(false);
    }
  };

  return (
    <React.Fragment>
      <NewBulkRescheduleTable
        t={t}
        loader={isRescheduleReasonLoading}
        setStepper={setStepper}
        setNewHearingData={setNewHearingData}
        newHearingData={newHearingData}
        defaultBulkFormData={defaultBulkFormData}
        bulkFormData={bulkFormData}
        setBulkFormData={setBulkFormData}
        bulkHearingsCount={bulkHearingsCount}
        allHearings={allHearings}
        setAllHearings={setAllHearings}
        loading={loading}
        setIsLoader={setIsLoader}
        handleBulkHearingSearch={handleBulkHearingSearch}
        hasBulkRescheduleAccess={hasBulkRescheduleAccess}
        bulkAllHearingsData={bulkAllHearingsData}
      />
      {stepper === 1 && (
        <Modal
          headerBarEnd={<CloseBtn onClick={() => !loader && onCancel()} />}
          formId="modal-action"
          headerBarMain={<Heading label={t("CS_DETAILS")} />}
          actionSaveOnSubmit={onSumbitReschedule}
          actionCancelOnSubmit={onCancel}
          isDisabled={loader || !bulkFormData?.reason}
          isBackButtonDisabled={loader}
          actionCancelLabel={t("CS_BULK_BACK")}
          actionSaveLabel={t("CS_COMMON_CONFIRM")}
          popupStyles={{
            width: "40%",
          }}
        >
          {loader ? (
            <Loader />
          ) : (
            <LabelFieldPair className="case-label-field-pair" style={{ padding: "22px 0px" }}>
              <CardLabel className="case-input-label">{`${t("BULK_RESCHEDULE_REASON")}`}</CardLabel>
              <Dropdown
                t={t}
                option={rescheduleReasonData}
                selected={bulkFormData?.reason}
                optionKey={"name"}
                select={(e) => {
                  setBulkFormData((prev) => ({ ...prev, reason: e }));
                }}
                topbarOptionsClassName={"top-bar-option"}
                style={{
                  marginBottom: "1px",
                  maxWidth: "100%",
                }}
              />
            </LabelFieldPair>
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
          {loader ? (
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
      <BulkNotificationSignatureModals
        stepper={stepper}
        t={t}
        Modal={Modal}
        onCancel={onCancel}
        openUploadSignatureModal={openUploadSignatureModal}
        setOpenUploadSignatureModal={setOpenUploadSignatureModal}
        isSigned={isSigned}
        uploadSignedPdf={uploadSignedPdf}
        onBeforeEsign={() => {
          saveBulkRescheduleSession({
            stepper,
            formData: bulkFormData,
            oldHearingData: originalHearingData,
            newHearingData,
            notificationNumber,
            fileStoreId: notificationFileStoreId,
            allHearingsData: allHearings,
            homeActiveTab: "CS_HOME_BULK_RESCHEDULE",
          });
          handleEsign(name, pageModule, notificationFileStoreId, setShowToast, t, "Signature");
        }}
        uri={uri}
        name={name}
        signFormData={signFormData}
        onSelect={onSelect}
        onUploadSubmit={onUploadSubmit}
        issignLoader={issignLoader}
        fileUploadError={fileUploadError}
        setFileUploadError={setFileUploadError}
        isLoading={loader}
      />
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
            await handleBulkHearingSearch(bulkFormData);
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
      {showToast && (
        <CustomToast
          error={showToast?.error}
          label={showToast?.label}
          errorId={showToast?.errorId}
          onClose={() => setShowToast(null)}
          duration={showToast?.errorId ? 7000 : 5000}
        />
      )}
    </React.Fragment>
  );
};

export default NewBulkRescheduleTab;
