import React, { useEffect, useMemo, useState } from "react";
import { submissionDocumentDetailsConfig } from "../../configs/submitDocumentConfig";
import { FormComposerV2, Header, Loader, Toast } from "@egovernments/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import isEqual from "lodash/isEqual";
import ReviewDocumentSubmissionModal from "../../components/ReviewDocumentSubmissionModal";
import { combineMultipleFiles } from "@egovernments/digit-ui-module-dristi/src/Utils";
import { SubmissionDocumentWorflowState } from "../../utils/submissionDocumentsWorkflow";
import SubmissionDocumentSuccessModal from "../../components/SubmissionDocumentSuccessModal";
import { getAdvocates } from "@egovernments/digit-ui-module-dristi/src/pages/citizen/FileCase/EfilingValidationUtils";
import { DRISTIService } from "@egovernments/digit-ui-module-dristi/src/services";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";

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
  const [showErrorToast, setShowErrorToast] = useState(null);
  const [combinedDocumentFile, setCombinedDocumentFile] = useState(null);
  const [combinedFileStoreId, setCombinedFileStoreId] = useState(null);
  const [signedDoucumentUploadedID, setSignedDocumentUploadID] = useState("");
  const [currentSubmissionStatus, setCurrentSubmissionStatus] = useState("");

  const [loader, setLoader] = useState(false);

  const { data: individualData } = window?.Digit.Hooks.dristi.useGetIndividualUser(
    {
      Individual: {
        userUuid: [userInfo?.uuid],
      },
    },
    { tenantId, limit: 1000, offset: 0 },
    "Home",
    "",
    userInfo?.uuid
  );
  const individualId = useMemo(() => individualData?.Individual?.[0]?.individualId, [individualData]);

  const { data: caseData } = Digit.Hooks.dristi.useSearchCaseService(
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

  const caseDetails = useMemo(() => {
    return caseData?.criteria?.[0]?.responseList?.[0];
  }, [caseData]);
  const allAdvocates = useMemo(() => getAdvocates(caseDetails), [caseDetails]);
  const onBehalfOfuuid = useMemo(() => Object.keys(allAdvocates)?.find((key) => allAdvocates[key].includes(userInfo?.uuid)), [
    allAdvocates,
    userInfo?.uuid,
  ]);
  const onBehalfOfLitigent = useMemo(() => caseDetails?.litigants?.find((item) => item?.additionalDetails?.uuid === onBehalfOfuuid), [
    caseDetails,
    onBehalfOfuuid,
  ]);
  const sourceType = useMemo(
    () => (onBehalfOfLitigent?.partyType?.toLowerCase()?.includes("complainant") ? "COMPLAINANT" : !isCitizen ? "COURT" : "ACCUSED"),
    [onBehalfOfLitigent, isCitizen]
  );

  const { data: evidenceData, isloading: isEvidenceLoading, refetch: evidenceRefetch } = Digit.Hooks.submissions.useSearchEvidenceService(
    {
      criteria: {
        filingNumber,
        artifactNumber,
        tenantId,
      },
      tenantId,
    },
    {},
    artifactNumber,
    Boolean(artifactNumber)
  );

  const evidenceDetails = evidenceData?.artifacts?.[0];

  useEffect(() => {
    if (evidenceDetails) {
      if (evidenceDetails?.status === SubmissionDocumentWorflowState.PENDING_ESIGN) {
        setCombinedFileStoreId(evidenceDetails?.file.fileStore);
        setCurrentSubmissionStatus(evidenceDetails?.status);
        setShowReviewModal(true);
        return;
      }
      if (evidenceDetails?.status === SubmissionDocumentWorflowState.SUBMITTED) {
        setCurrentSubmissionStatus(evidenceDetails?.status);
        setShowSubmissionSuccessModal(true);
        return;
      }
    }
  }, [evidenceDetails]);

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

  const handleGoToSign = async () => {
    try {
      setLoader(true);
      const documentFile = (await Promise.all(combinedDocumentFile?.map((doc) => onDocumentUpload(doc, doc?.name)))) || [];
      let file = null;
      let evidenceReqBody = {};
      let evidence = {};
      for (let res of documentFile) {
        const fileStoreId = res?.file?.files?.[0]?.fileStoreId;
        file = {
          documentType: res?.fileType,
          fileStore: res?.fileStore || fileStoreId,
          additionalDetails: { name: res?.filename || res?.additionalDetails?.name },
        };
        evidenceReqBody = {
          artifact: {
            artifactType: "DOCUMENTARY",
            caseId: caseDetails?.id,
            filingNumber,
            tenantId,
            comments: [],
            file,
            sourceType,
            sourceID: individualId,
            additionalDetails: {
              uuid: userInfo?.uuid,
              formdata,
            },
          },
        };
        evidence = await DRISTIService.createEvidence(evidenceReqBody);
      }
      setLoader(false);
      history.push(
        `/digit-ui/citizen/submissions/submissions-document?filingNumber=${filingNumber}&artifactNumber=${evidence?.artifact?.artifactNumber}`
      );
    } catch (error) {
      console.log("Error occured", error);
      setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
      setLoader(false);
    }
  };

  const handleOpenReview = async () => {
    try {
      setLoader(true);
      const combinedDocumentFile = await combineMultipleFiles(
        formdata?.submissionDocuments?.uploadedDocs,
        `${t("COMBINED_DOC")}.pdf`,
        "submissionDocuments"
      );
      setCombinedDocumentFile(combinedDocumentFile);
      setShowReviewModal(true);
      setLoader(false);
    } catch (error) {
      console.log("Error occured", error);
      setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
      setLoader(false);
    }
  };

  const handleGoBack = async () => {
    if (currentSubmissionStatus === SubmissionDocumentWorflowState.PENDING_ESIGN) {
      history.replace(`/digit-ui/${userType}/dristi/home/view-case?caseId=${caseDetails?.id}&filingNumber=${filingNumber}&tab=Submissions`);
    } else {
      setShowReviewModal(false);
    }
  };

  const onFormValueChange = (setValue, formData, formState, reset, setError, clearErrors, trigger, getValues) => {
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

  useEffect(() => {
    const isSignSuccess = localStorage.getItem("isSignSuccess");
    // const applicationPDF = localStorage.getItem("applicationPDF");
    if (isSignSuccess) {
      setShowReviewModal(true);
      // setShowsignatureModal(true);
      // setApplicationPdfFileStoreId(applicationPDF);
      localStorage.removeItem("esignProcess");
      localStorage.removeItem("applicationPDF");
    }
  }, []);

  if (loader) {
    return <Loader />;
  }
  return (
    <React.Fragment>
      <style>
        {`
          .formComposer .card {
            margin: 0px;
            padding: 0px;
            border: none;
          }

          .formComposer .card .label-field-pair h2.card-label {
            font-weight: 400;
            font-size : 16px;
            margin-bottom: 8px !important;
          }          
        `}
      </style>

      <div className="citizen create-submission" style={{ width: "50%", padding: "24px 24px 24px 40px" }}>
        {" "}
        <Header> {t(submissionDocumentDetailsConfig.header)}</Header>
        <div style={{ lineHeight: "24px" }}> {t(submissionDocumentDetailsConfig.subText1)}</div>
        <div style={{ marginBottom: "10px" }}> {t(submissionDocumentDetailsConfig.subText2)}</div>
        <div style={{ minHeight: "550px", overflowY: "auto", marginTop: "15px" }}>
          <FormComposerV2
            label={t("REVIEW_SUBMISSION_DOCS")}
            config={submissionDocumentDetailsConfig.formConfig}
            // defaultValues={defaultFormValue}
            onFormValueChange={onFormValueChange}
            onSubmit={handleOpenReview}
            fieldStyle={fieldStyle}
            // key={formKey}
            className={"formComposer"}
            isDisabled={isSubmitDisabled}
          />
        </div>
        {showReviewModal && (
          <ReviewDocumentSubmissionModal
            t={t}
            handleGoBack={handleGoBack}
            setSignedDocumentUploadID={setSignedDocumentUploadID}
            handleGoToSign={handleGoToSign}
            currentSubmissionStatus={currentSubmissionStatus}
            combinedDocumentFile={combinedDocumentFile?.[0]}
            combinedFileStoreId={combinedFileStoreId}
            setShowReviewModal={setShowReviewModal}
          />
        )}
        {showSubmissionSuccessModal && <SubmissionDocumentSuccessModal t={t} />}
      </div>
      {showErrorToast && <Toast error={showErrorToast?.error} label={showErrorToast?.label} isDleteBtn={true} onClose={closeToast} />}
    </React.Fragment>
  );
};

export default SubmissionDocuments;
