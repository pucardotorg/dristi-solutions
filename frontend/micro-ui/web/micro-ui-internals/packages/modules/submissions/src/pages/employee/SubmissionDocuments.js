import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { submissionDocumentDetailsConfig } from "../../configs/submitDocumentConfig";
import { FormComposerV2, Header, Loader } from "@egovernments/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import isEqual from "lodash/isEqual";
import ReviewDocumentSubmissionModal from "../../components/ReviewDocumentSubmissionModal";
import { combineMultipleFiles, getAuthorizedUuid, getFilingType, runComprehensiveSanitizer } from "@egovernments/digit-ui-module-dristi/src/Utils";
import SubmissionDocumentSuccessModal from "../../components/SubmissionDocumentSuccessModal";
import { getAdvocates } from "@egovernments/digit-ui-module-dristi/src/pages/citizen/FileCase/EfilingValidationUtils";
import { DRISTIService } from "@egovernments/digit-ui-module-dristi/src/services";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import useSearchEvidenceService from "../../hooks/submissions/useSearchEvidenceService";
import downloadPdfFromFile from "@egovernments/digit-ui-module-dristi/src/Utils/downloadPdfFromFile";
import { SubmissionDocumentWorkflowAction, SubmissionDocumentWorkflowState } from "../../utils/submissionDocumentsWorkflow";
import { BreadCrumbsParamsDataContext } from "@egovernments/digit-ui-module-core";
import { formatName } from "@egovernments/digit-ui-module-home/src/utils";
import { validateAndFormatFields } from "../../utils";
import CustomToast from "@egovernments/digit-ui-module-dristi/src/components/CustomToast";

const fieldStyle = { marginRight: 0, width: "100%" };

const onDocumentUpload = async (fileData, filename) => {
  try {
    const fileUploadRes = await Digit.UploadServices.Filestorage("DRISTI", fileData, Digit.ULBService.getCurrentTenantId());
    return { file: fileUploadRes?.data, fileType: fileData.type, filename };
  } catch (error) {
    console.error("Failed to upload document:", error);
    throw error;
  }
};

const SubmissionDocuments = ({ path }) => {
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const { t } = useTranslation();
  const history = useHistory();
  const { filingNumber, artifactNumber } = Digit.Hooks.useQueryParams();
  const userInfo = Digit.UserService.getUser()?.info;
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo?.type]);
  const isCitizen = useMemo(() => userInfo?.type === "CITIZEN", [userInfo]);
  const [formdata, setFormdata] = useState({});
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showSubmissionSuccessModal, setShowSubmissionSuccessModal] = useState(false);
  const [showToast, setShowToast] = useState(null);
  const [combinedDocumentFile, setCombinedDocumentFile] = useState(null);
  const [combinedFileStoreId, setCombinedFileStoreId] = useState(null);
  const [signedDocumentUploadedID, setSignedDocumentUploadID] = useState(null);
  const [currentSubmissionStatus, setCurrentSubmissionStatus] = useState(null);
  const { downloadPdf } = Digit.Hooks.dristi.useDownloadCasePdf();
  const [loader, setLoader] = useState(false);
  const { BreadCrumbsParamsData, setBreadCrumbsParamsData } = useContext(BreadCrumbsParamsDataContext);
  const [evidenceId, setEvidenceId] = useState(null);

  const { caseId: caseIdFromBreadCrumbs, filingNumber: filingNumberFromBreadCrumbs } = BreadCrumbsParamsData;
  const isEmployee = useMemo(() => userInfo?.type === "EMPLOYEE", [userInfo]);

  const { data: filingTypeData, isLoading: isFilingTypeLoading } = Digit.Hooks.dristi.useGetStatuteSection("common-masters", [
    { name: "FilingType" },
  ]);

  const filingType = useMemo(() => getFilingType(filingTypeData?.FilingType, "Direct"), [filingTypeData?.FilingType]);
  const userUuid = userInfo?.uuid; // use userUuid only if required explicitly, otherwise use only authorizedUuid.
  const authorizedUuid = getAuthorizedUuid(userUuid);

  const { data: individualData } = window?.Digit.Hooks.dristi.useGetIndividualUser(
    {
      Individual: {
        userUuid: [authorizedUuid],
      },
    },
    { tenantId, limit: 1000, offset: 0 },
    "Home",
    "",
    authorizedUuid
  );
  const individualId = useMemo(() => individualData?.Individual?.[0]?.individualId, [individualData]);

  const [caseData, setCaseData] = useState(undefined);
  const isBreadCrumbsParamsDataSet = useRef(false);

  useEffect(() => {
    const fetchCaseDetails = async () => {
      try {
        setLoader(true);
        const caseData = await DRISTIService.searchCaseService(
          {
            criteria: [
              {
                filingNumber: filingNumber,
              },
            ],
            tenantId,
          },
          {},
          `case-details-${filingNumber}`,
          filingNumber,
          Boolean(filingNumber)
        );
        const caseId = caseData?.criteria?.[0]?.responseList?.[0]?.id;
        setCaseData(caseData);
        // Only update breadcrumb data if it's different from current and hasn't been set yet
        if (!(caseIdFromBreadCrumbs === caseId && filingNumberFromBreadCrumbs === filingNumber) && !isBreadCrumbsParamsDataSet.current) {
          setBreadCrumbsParamsData({
            caseId,
            filingNumber,
          });
          isBreadCrumbsParamsDataSet.current = true;
        }
      } catch (err) {
        console.error("Failed to fetch case details:", err);
        const errorId = err?.response?.headers?.["x-correlation-id"] || err?.response?.headers?.["X-Correlation-Id"];
        setShowToast({ label: t("ERROR_FETCHING_CASE_DETAILS"), error: true, errorId });
      } finally {
        setLoader(false);
      }
    };

    fetchCaseDetails();
  }, [caseIdFromBreadCrumbs, filingNumber, filingNumberFromBreadCrumbs, setBreadCrumbsParamsData, t, tenantId]);

  const caseDetails = useMemo(() => {
    return caseData?.criteria?.[0]?.responseList?.[0];
  }, [caseData]);
  const caseCourtId = useMemo(() => caseDetails?.courtId, [caseDetails]);
  const allAdvocates = useMemo(() => getAdvocates(caseDetails), [caseDetails]);
  const onBehalfOfuuid = useMemo(() => Object.keys(allAdvocates)?.find((key) => allAdvocates[key].includes(authorizedUuid)), [
    allAdvocates,
    authorizedUuid,
  ]);
  const onBehalfOfLitigent = useMemo(() => caseDetails?.litigants?.find((item) => item?.additionalDetails?.uuid === onBehalfOfuuid), [
    caseDetails,
    onBehalfOfuuid,
  ]);
  const sourceType = useMemo(
    () => (onBehalfOfLitigent?.partyType?.toLowerCase()?.includes("complainant") ? "COMPLAINANT" : !isCitizen ? "COURT" : "ACCUSED"),
    [onBehalfOfLitigent, isCitizen]
  );

  const { data: evidenceData, isloading: isEvidenceLoading } = useSearchEvidenceService(
    {
      criteria: {
        filingNumber,
        artifactNumber,
        tenantId,
        asUser: authorizedUuid,
        ...(caseCourtId && { courtId: caseCourtId }),
      },
      tenantId,
    },
    {},
    artifactNumber,
    Boolean(artifactNumber && caseCourtId)
  );

  const evidenceDetails = useMemo(() => evidenceData?.artifacts?.[0], [evidenceData]);
  const defaultFormValue = useMemo(() => {
    const formData = evidenceDetails?.additionalDetails?.formdata || {};
    const updatedFormData = {
      ...formData,
      submissionDocuments: {
        ...formData.submissionDocuments,
        uploadedDocs: evidenceDetails?.file ? [evidenceDetails?.file] : [],
      },
    };

    return updatedFormData;
  }, [evidenceDetails]);

  const formKey = useMemo(() => (evidenceDetails ? "default-values" : ""), [evidenceDetails]);

  useEffect(() => {
    if (evidenceDetails) {
      if (evidenceDetails?.status === SubmissionDocumentWorkflowState.PENDING_ESIGN) {
        setCombinedFileStoreId(evidenceDetails?.file.fileStore);
        setCurrentSubmissionStatus(evidenceDetails?.status);
        setShowReviewModal(true);
        return;
      }
      if (evidenceDetails?.status === SubmissionDocumentWorkflowState.SUBMITTED) {
        setCurrentSubmissionStatus(evidenceDetails?.status);
        setShowSubmissionSuccessModal(true);
        return;
      }
    }
  }, [evidenceDetails]);

  const handleClose = () => {
    setShowSubmissionSuccessModal(false);
    sessionStorage.removeItem("fileStoreId");
    history.replace(`/${window?.contextPath}/${userType}/dristi/home/view-case?caseId=${caseDetails?.id}&filingNumber=${filingNumber}&tab=Documents`);
  };

  const handleSuccessDownloadSubmission = () => {
    downloadPdf(tenantId, signedDocumentUploadedID);
  };

  const handleDownloadReviewModal = async () => {
    if ([SubmissionDocumentWorkflowState.PENDING_ESIGN].includes(currentSubmissionStatus)) {
      const fileStoreId = sessionStorage.getItem("fileStoreId");
      downloadPdf(tenantId, signedDocumentUploadedID || fileStoreId || evidenceDetails?.file?.fileStore);
    } else {
      await downloadPdfFromFile(combinedDocumentFile?.[0]);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoader(true);
      let evidenceReqBody = {};
      let evidence = {};
      const documentFile = (await Promise.all(combinedDocumentFile?.map((doc) => onDocumentUpload(doc, doc?.name)))) || [];
      let file = null;
      for (let res of documentFile) {
        const fileStoreId = res?.file?.files?.[0]?.fileStoreId;
        file = {
          documentType: res?.fileType,
          fileStore: res?.fileStore || fileStoreId,
          additionalDetails: { name: res?.filename || res?.additionalDetails?.name },
        };
        evidenceReqBody = {
          artifact: {
            artifactType: formdata?.documentType?.code,
            caseId: caseDetails?.id,
            filingNumber,
            tenantId,
            comments: [],
            file,
            sourceType,
            asUser: authorizedUuid,
            sourceID: isEmployee ? authorizedUuid : individualId,
            filingType: filingType,
            additionalDetails: {
              uuid: authorizedUuid,
              formdata,
            },
            workflow: {
              action: SubmissionDocumentWorkflowAction.CREATE,
            },
          },
        };
        evidence = await DRISTIService.createEvidence(evidenceReqBody);
        if (evidence?.artifact?.status === SubmissionDocumentWorkflowState.SUBMITTED) {
          setShowReviewModal(false);
          setSignedDocumentUploadID(fileStoreId);
          setEvidenceId(evidence?.artifact?.artifactNumber);
          setShowSubmissionSuccessModal(true);
        }
      }
    } catch (error) {
      console.error("Failed to upload submission document:", error);
      const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
      const errorCode = error?.response?.data?.Errors?.[0]?.code;
      setShowToast({ label: t(errorCode || "SUBMISSION_DOCUMENT_UPLOAD_FAILED"), error: true, errorId });
    } finally {
      setLoader(false);
    }
  };

  const handleOpenReview = async () => {
    try {
      if (
        ![SubmissionDocumentWorkflowState.PENDING_ESIGN, SubmissionDocumentWorkflowState.SUBMITTED].includes(currentSubmissionStatus) &&
        formdata?.submissionDocuments?.uploadedDocs?.length !== 0
      ) {
        setLoader(true);
        const combinedDocumentFile = await combineMultipleFiles(
          formdata?.submissionDocuments?.uploadedDocs,
          `${t("COMBINED_DOC")}.pdf`,
          "submissionDocuments"
        );
        setCombinedDocumentFile(combinedDocumentFile);
        setShowReviewModal(true);
      }
    } catch (error) {
      console.error("Error whike combining documents:", error);
      const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
      setShowToast({ label: t("SUBMISSION_COMBINE_DOCUMENTS_FAILED"), error: true, errorId });
    } finally {
      setLoader(false);
    }
  };

  const handleGoBack = async () => {
    if ([SubmissionDocumentWorkflowState.PENDING_ESIGN, SubmissionDocumentWorkflowState.SUBMITTED].includes(currentSubmissionStatus)) {
      history.replace(
        `/${window?.contextPath}/${userType}/dristi/home/view-case?caseId=${caseDetails?.id}&filingNumber=${filingNumber}&tab=Documents`
      );
    } else {
      setShowReviewModal(false);
    }
  };

  if (!artifactNumber && evidenceDetails) {
    handleGoBack();
  }

  const onFormValueChange = (setValue, formData, formState, reset, setError, clearErrors, trigger, getValues) => {
    runComprehensiveSanitizer({ formData, setValue });
    validateAndFormatFields({
      formData,
      setValue,
      clearErrors,
      fieldConfigs: [
        {
          key: "documentTitle",
          maxLength: 100,
          formatter: formatName,
        },
      ],
    });
    if (formData?.submissionDocuments?.uploadedDocs?.length > 0 && Object.keys(formState?.errors).includes("uploadedDocs")) {
      clearErrors("uploadedDocs");
    } else if (
      formState?.submitCount &&
      !formData?.submissionDocuments?.uploadedDocs?.length &&
      !Object.keys(formState?.errors).includes("uploadedDocs")
    ) {
      setError("uploadedDocs", { message: t("CORE_REQUIRED_FIELD_ERROR") });
    }

    if (!isEqual(formdata, formData)) {
      setFormdata(formData);
    }

    if (Object.keys(formState?.errors).length) {
      setIsSubmitDisabled(true);
    } else {
      setIsSubmitDisabled(false);
    }
  };

  const modifiedFormConfig = useMemo(() => {
    const applyUiChanges = (config) => ({
      ...config,
      body: config?.body?.map((body) => {
        if (body?.labelChildren === "optional") {
          return {
            ...body,
            labelChildren: <span style={{ color: "#77787B" }}>&nbsp;{`${t("CS_IS_OPTIONAL")}`}</span>,
          };
        }

        if (body?.key === "documentType") {
          return {
            ...body,
            populators: {
              ...body.populators,
              mdmsConfig: {
                moduleName: "Submission",
                masterName: "SubmissionDocumentType",
                select: `(data) => {return data['Submission'].SubmissionDocumentType?.filter((item) => {return !(item.code === "MISCELLANEOUS" && ${!isEmployee});}).sort((a,b) => a.code.localeCompare(b.code));}`,
              },
            },
          };
        }
        return body;
      }),
    });

    const originalFormConfig = submissionDocumentDetailsConfig.formConfig;

    if (!artifactNumber) {
      return originalFormConfig?.map((config) => applyUiChanges(config));
    } else {
      return originalFormConfig?.map((config) =>
        applyUiChanges({
          ...config,
          body: config?.body?.map((item) => ({ ...item, disable: true })),
        })
      );
    }
  }, [artifactNumber, t, isEmployee]);

  return (
    <React.Fragment>
      {(loader || isFilingTypeLoading || isEvidenceLoading) && (
        <div
          style={{
            width: "100vw",
            height: "100vh",
            zIndex: "10001",
            position: "fixed",
            right: "0",
            display: "flex",
            top: "0",
            background: "rgb(234 234 245 / 50%)",
            alignItems: "center",
            justifyContent: "center",
          }}
          className="submit-loader"
        >
          <Loader />
        </div>
      )}
      <div className="citizen create-submission" style={{ padding: "24px 24px 24px 40px" }}>
        {" "}
        <Header> {t(submissionDocumentDetailsConfig.header)}</Header>
        {isEmployee ? (
          <div style={{ lineHeight: "24px" }}> {t(submissionDocumentDetailsConfig.subText11)}</div>
        ) : (
          <div style={{ lineHeight: "24px" }}> {t(submissionDocumentDetailsConfig.subText1)}</div>
        )}
        <div style={{ marginBottom: "10px" }}> {t(submissionDocumentDetailsConfig.subText2)}</div>
        <div style={{ minHeight: "550px", overflowY: "auto", marginTop: "15px", width: "50%" }}>
          <FormComposerV2
            label={t("REVIEW_SUBMISSION_DOCS")}
            config={modifiedFormConfig}
            defaultValues={defaultFormValue}
            onFormValueChange={onFormValueChange}
            onSubmit={handleOpenReview}
            fieldStyle={fieldStyle}
            key={formKey}
            className={"submitDocument-formComposer"}
            isDisabled={isSubmitDisabled}
          />
        </div>
        {showReviewModal && (
          <ReviewDocumentSubmissionModal
            t={t}
            handleGoBack={handleGoBack}
            handleSubmit={handleSubmit}
            currentSubmissionStatus={currentSubmissionStatus}
            combinedDocumentFile={combinedDocumentFile?.[0]}
            combinedFileStoreId={combinedFileStoreId}
            handleDownloadReviewModal={handleDownloadReviewModal}
          />
        )}
        {showSubmissionSuccessModal && (
          <SubmissionDocumentSuccessModal
            t={t}
            handleClose={handleClose}
            handleSuccessDownloadSubmission={handleSuccessDownloadSubmission}
            documentSubmissionNumber={evidenceDetails?.artifactNumber || evidenceId}
          />
        )}
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
    </React.Fragment>
  );
};

export default SubmissionDocuments;
