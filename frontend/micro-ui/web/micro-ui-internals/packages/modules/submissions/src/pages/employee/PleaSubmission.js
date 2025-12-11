import { FormComposerV2, Header, Loader, Toast } from "@egovernments/digit-ui-react-components";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { pleaSubmissionDetailConfig } from "../../configs/pleaSubmissionConfig";
import isEqual from "lodash/isEqual";
import { BreadCrumbsParamsDataContext } from "@egovernments/digit-ui-module-core";
import { DRISTIService } from "@egovernments/digit-ui-module-dristi/src/services";
import useSearchDigitalization from "../../hooks/submissions/useSearchDigitalization";
import { useHistory } from "react-router-dom/cjs/react-router-dom";
import {
  _getCreatePleaPayload,
  _getPdfConfig,
  _getUpdatePleaPayload,
  BooleanToCode,
  checkTextValidation,
  pleaWorkflowActions,
  validateMobileNumber,
} from "../../utils/digitilization";
import { submissionService } from "../../hooks/services";
import PreviewPdfModal from "../../components/PreviewPdfModal";
import GenericUploadSignatureModal from "../../components/GenericUploadSignatureModal";
import useDownloadCasePdf from "@egovernments/digit-ui-module-dristi/src/hooks/dristi/useDownloadCasePdf";
import GenericSuccessLinkModal from "../../components/GenericSuccessLinkModal";
import GenericNumberInputModal from "../../components/GenericNumberInputModal";
import { getFormattedName } from "../../utils";
import SuccessBannerModal from "../../components/SuccessBannerModal";

const fieldStyle = { marginRight: 0, width: "100%" };
const convertToFormData = (obj) => {
  const formdata = {
    accusedDetails: {
      name: obj?.accusedName,
      code: obj?.accusedName,
      uniqueId: obj?.accusedUniqueId,
    },
    fatherName: obj?.fatherName,
    village: obj?.village,
    taluk: obj?.taluk,
    calling: obj?.calling,
    age: obj?.age,
    isChargesUnderstood: BooleanToCode(obj?.isChargesUnderstood),
    pleadGuilty: BooleanToCode(obj?.pleadGuilty),
    magistrateRemarks: {
      text: obj?.magistrateRemarks,
    },
  };

  return formdata;
};

const PleaSubmission = () => {
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const { t } = useTranslation();
  const history = useHistory();
  const userInfo = Digit.UserService.getUser()?.info;
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo?.type]);
  const homePath = `/${window?.contextPath}/${userType}/home/home-pending-task`;
  const { filingNumber, documentNumber, showModal } = Digit.Hooks.useQueryParams();
  const [formdata, setFormdata] = useState({});
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(null);
  const [loader, setLoader] = useState(false);
  const isBreadCrumbsParamsDataSet = useRef(false);
  const { BreadCrumbsParamsData, setBreadCrumbsParamsData } = useContext(BreadCrumbsParamsDataContext);
  const { caseId: caseIdFromBreadCrumbs, filingNumber: filingNumberFromBreadCrumbs } = BreadCrumbsParamsData;
  const courtId = localStorage.getItem("courtId");
  const [caseData, setCaseData] = useState(null);
  const [isCaseDetailsLoading, setIsCaseDetailsLoading] = useState(false);
  const [defaultFormValueData, setDefaultFormValueData] = useState({});
  const [previewPleaModal, setPreviewPleModal] = useState(false);
  const [showSignatureModal, setShowsignatureModal] = useState(false);
  const [pleaFileStoreId, setPleaFileStoreId] = useState("");
  const [pleUploadLoader, setPleaUploadLoader] = useState(false);
  const { downloadPdf } = useDownloadCasePdf();
  const [showUploadSignature, setShowUploadSignature] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPleaEsign, setShowPleaEsign] = useState(false);
  const [pleaSignatureURL, setPleaSignatureURL] = useState("");
  const [showAddPleaMobileNumber, setShowAddPleaMobileNumber] = useState(false);
  const [pleaMobileNumber, setPleaMobileNumber] = useState("");
  const [pleaMobileNumberError, setPleaMobileNumberError] = useState("");
  const setFormErrors = useRef([]);

  const fetchCaseDetails = async () => {
    try {
      setIsCaseDetailsLoading(true);
      const caseData = await DRISTIService.searchCaseService(
        {
          criteria: [
            {
              filingNumber: filingNumber,
              ...(courtId && { courtId }),
            },
          ],
          tenantId,
        },
        {}
      );
      const caseId = caseData?.criteria?.[0]?.responseList?.[0]?.id;
      setCaseData(caseData);
      if (!(caseIdFromBreadCrumbs === caseId && filingNumberFromBreadCrumbs === filingNumber) && !isBreadCrumbsParamsDataSet.current) {
        setBreadCrumbsParamsData({
          caseId,
          filingNumber,
        });
        isBreadCrumbsParamsDataSet.current = true;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCaseDetailsLoading(false);
    }
  };

  useEffect(() => {
    if (!caseData && !isBreadCrumbsParamsDataSet.current) {
      fetchCaseDetails();
    }
  }, []);

  const caseDetails = useMemo(() => {
    return caseData?.criteria?.[0]?.responseList?.[0];
  }, [caseData]);

  const { data: pleaSearchResponse, isLoading: isPleaSearchResponseLoading } = useSearchDigitalization(
    {
      criteria: {
        filingNumber: filingNumber,
        documentNumber: documentNumber,
        ...(courtId && { courtId: courtId }),
        tenantId,
      },
    },
    {},
    `digitilization-${documentNumber}`,
    Boolean(documentNumber && filingNumber)
  );

  const pleaResponseDetails = useMemo(() => {
    if (Object.keys(defaultFormValueData).length > 0) {
      return defaultFormValueData;
    }
    return pleaSearchResponse?.documents?.[0] || {};
  }, [defaultFormValueData, pleaSearchResponse]);

  const accusedList = useMemo(() => {
    return (
      caseDetails?.additionalDetails?.respondentDetails?.formdata?.map?.((respondent) => {
        const respondentDetails = respondent?.data || {};
        const fullName = getFormattedName(
          respondentDetails?.respondentFirstName,
          respondentDetails?.respondentMiddleName,
          respondentDetails?.respondentLastName,
          null,
          null
        );
        const uniqueId = respondent?.uniqueId;

        return {
          code: fullName,
          name: fullName,
          uniqueId: uniqueId,
          individualId: respondentDetails?.respondentVerification?.individualDetails?.individualId,
        };
      }) || []
    );
  }, [caseDetails]);

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

        if (body?.key === "accusedDetails") {
          return {
            ...body,
            populators: {
              ...body.populators,
              options: [...accusedList],
            },
          };
        }

        if (body?.populators?.validation?.customValidationFn) {
          const customValidations =
            Digit.Customizations[body.populators.validation.customValidationFn.moduleName][body.populators.validation.customValidationFn.masterName];

          body.populators.validation = {
            ...body.populators.validation,
            ...customValidations(),
          };
        }
        return body;
      }),
    });

    const originalFormConfig = pleaSubmissionDetailConfig.formConfig;
    return originalFormConfig?.map((config) => applyUiChanges(config));
  }, [accusedList, t]);

  const defaultFormValue = useMemo(() => {
    if (Object.keys(defaultFormValueData).length > 0 && Object.keys(defaultFormValueData?.pleaDetails).length > 0) {
      return convertToFormData(t, defaultFormValueData?.pleaDetails || {});
    }

    if (documentNumber && pleaResponseDetails) {
      return convertToFormData(pleaResponseDetails?.pleaDetails || {});
    }

    return {
      ...(accusedList?.length === 1 ? { accusedDetails: accusedList?.[0] } : {}),
      magistrateRemarks: { text: "Taken down by/before me in open court, interpreted/read over to the accused and admitted by him/her label" },
      pleadGuilty: { code: "NO", name: "NO" },
      isChargesUnderstood: { code: "YES", name: "YES" },
    };
  }, [accusedList, defaultFormValueData, documentNumber, pleaResponseDetails, t]);

  const onFormValueChange = (setValue, formData, formState, reset, setError, clearErrors, trigger, getValues) => {
    checkTextValidation({ formData, setValue, formdata, reset, clearErrors, formState });
    if (!isEqual(formdata, formData)) {
      setFormdata(formData);
    }

    if (Object.keys(formState?.errors).length) {
      setIsSubmitDisabled(true);
    } else {
      setIsSubmitDisabled(false);
    }

    setFormErrors.current = setError;
  };

  const handleSubmit = async () => {
    try {
      if (formdata?.age < 18) {
        setFormErrors?.current("age", { message: t("AGE_LIMIT_ERROR") });
        return;
      }
      setLoader(true);
      let pleaSubmissionUpdateResponse = null;
      if (!documentNumber) {
        const payload = _getCreatePleaPayload(caseDetails, formdata, tenantId, courtId);
        pleaSubmissionUpdateResponse = await submissionService.createDigitalization(payload, tenantId);
        setDefaultFormValueData(pleaSubmissionUpdateResponse?.digitalizedDocument || {});
        history.replace(
          `/${window?.contextPath}/${userType}/submissions/record-plea?filingNumber=${filingNumber}&documentNumber=${pleaSubmissionUpdateResponse?.digitalizedDocument?.documentNumber}&showModal=true`
        );
      } else {
        const payload = _getUpdatePleaPayload(t, pleaResponseDetails, formdata, tenantId, pleaWorkflowActions.SAVEDRAFT, null);
        pleaSubmissionUpdateResponse = await submissionService.updateDigitalization(payload, tenantId);
        setDefaultFormValueData(pleaSubmissionUpdateResponse?.digitalizedDocument || {});
        setPreviewPleModal(true);
      }
    } catch (error) {
      console.error("Error while updating bail bond:", error);
      setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
    } finally {
      setLoader(false);
    }
  };

  const handleSubmitSignature = async (fileStoreId) => {
    try {
      setLoader(true);
      const payload = _getUpdatePleaPayload(t, pleaResponseDetails, formdata, tenantId, pleaWorkflowActions.UPLOAD, fileStoreId, null);
      const res = await submissionService.updateDigitalization(payload, tenantId);
      setShowsignatureModal(false);
      setShowUploadSignature(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error while updating bail bond:", error);
      setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
    } finally {
      setLoader(false);
    }
  };

  const handleEsgin = async () => {
    // TODO : extract current selected plea number and setPleaNumber

    try {
      setLoader(true);
      const respondentData = caseDetails?.additionalDetails?.respondentDetails?.formdata?.find(
        (respondent) => respondent?.uniqueId === formdata?.accusedDetails?.uniqueId
      );
      if (respondentData?.data?.respondentVerification?.individualDetails?.individualId) {
        const individualId = respondentData?.data?.respondentVerification?.individualDetails?.individualId;
        const individualData = await window?.Digit.DRISTIService.searchIndividualUser(
          {
            Individual: {
              individualId: individualId,
            },
          },
          { tenantId, limit: 1000, offset: 0 }
        );
        setPleaMobileNumber(individualData?.Individual?.[0]?.mobileNumber);
      }
      else if(respondentData?.data?.phonenumbers?.mobileNumber?.[0]){
        setPleaMobileNumber(respondentData?.data?.phonenumbers?.mobileNumber?.[0]);
      }
      setShowsignatureModal(false);
      setShowAddPleaMobileNumber(true);
    } catch (error) {
      console.error("Error while updating bail bond:", error);
      setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
    } finally {
      setLoader(false);
    }
  };

  const handleCloseSignatureModal = () => {
    setShowsignatureModal(false);
    setPreviewPleModal(true);
  };

  const handleDownload = () => {
    downloadPdf(tenantId, pleaFileStoreId);
  };

  const handleCloseMobileModal = () => {
    setShowAddPleaMobileNumber(false);
    setShowsignatureModal(true);
  };

  const handlePleaMobileSubmit = async () => {
    try {
      const validationError = validateMobileNumber(pleaMobileNumber);
      if (validationError) {
        setPleaMobileNumberError(validationError);
        return;
      }
      setLoader(true);
      const partyDetails = accusedList?.find((accused) => accused?.uniqueId === formdata?.accusedDetails?.uniqueId);
      const partyUUID = caseDetails?.litigants?.find((lit) => lit?.individualId === partyDetails?.individualId)?.additionalDetails?.uuid;
      const payload = _getUpdatePleaPayload(
        t,
        pleaResponseDetails,
        formdata,
        tenantId,
        pleaWorkflowActions.ESIGN,
        pleaFileStoreId,
        pleaMobileNumber,
        partyUUID
      );
      const res = await submissionService.updateDigitalization(payload, tenantId);
      setPleaSignatureURL(res?.digitalizedDocument?.shortenedUrl);
      setShowAddPleaMobileNumber(false);
      setShowPleaEsign(true);
    } catch (error) {
      console.error("Error while updating bail bond:", error);
      setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
    } finally {
      setLoader(false);
    }
  };

  const handleCloseSuccessModal = () => {
    sessionStorage.setItem("documents-activeTab", "Digitalization Forms");
    history.replace(`/${window?.contextPath}/${userType}/dristi/home/view-case?caseId=${caseDetails?.id}&filingNumber=${filingNumber}&tab=Documents`);
  };

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

  if (userInfo?.type === "CITIZEN") {
    history.replace(homePath);
  }

  useEffect(() => {
    if (showModal) {
      setPreviewPleModal(true);
    }
  }, []);

  useEffect(() => {
    if (!isCaseDetailsLoading && !isPleaSearchResponseLoading && documentNumber && pleaResponseDetails?.status !== "DRAFT_IN_PROGRESS") {
      history.replace(
        `/${window?.contextPath}/${userType}/dristi/home/view-case?caseId=${caseDetails?.id}&filingNumber=${filingNumber}&tab=Documents`
      );
    }
  }, [isCaseDetailsLoading, caseDetails, filingNumber, history, userType, isPleaSearchResponseLoading, documentNumber, pleaResponseDetails]);

  if (isCaseDetailsLoading || !caseDetails || isPleaSearchResponseLoading) {
    return <Loader />;
  }

  return (
    <React.Fragment>
      {loader && (
        <div
          style={{
            width: "100vw",
            height: "100vh",
            zIndex: "100001",
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
        <Header styles={{ margin: "0px" }}> {t(pleaSubmissionDetailConfig.header)}</Header>
        <div style={{ minHeight: "550px", overflowY: "auto", marginTop: "0px", width: "50%" }}>
          <FormComposerV2
            label={t("REVIEW_PLEA_SUBMISSION_BUTTON")}
            config={modifiedFormConfig}
            defaultValues={defaultFormValue}
            onFormValueChange={onFormValueChange}
            onSubmit={handleSubmit}
            fieldStyle={fieldStyle}
            className={"formComposer plea-form-composer"}
            isDisabled={isSubmitDisabled}
          />
        </div>
        {previewPleaModal && (
          <PreviewPdfModal
            t={t}
            header={"REVIEW_PLEA_SUBMISSION"}
            cancelLabel={"CS_COMMON_BACK"}
            saveLabel={"PROCEED_TO_SIGN"}
            handleBack={() => {
              setPreviewPleModal(false);
              if (showModal) {
                history.replace(
                  `/${window?.contextPath}/${userType}/submissions/record-plea?filingNumber=${filingNumber}&documentNumber=${documentNumber}`
                );
              }
            }}
            setPreviewModal={setPreviewPleModal}
            pdfConfig={_getPdfConfig(pleaResponseDetails, caseDetails, courtId, tenantId)}
            setShowsignatureModal={setShowsignatureModal}
            setFileStoreId={setPleaFileStoreId}
          />
        )}
        {showSignatureModal && (
          <GenericUploadSignatureModal
            t={t}
            handleCloseSignatureModal={handleCloseSignatureModal}
            handleDownload={handleDownload}
            handleESign={handleEsgin}
            setShowUploadSignature={setShowUploadSignature}
            showUploadSignature={showUploadSignature}
            handleSubmit={handleSubmitSignature}
            setLoader={setPleaUploadLoader}
            loader={pleUploadLoader}
            fileStoreId={pleaFileStoreId}
            infoText={"PLEA_SIGN_INFO"}
          />
        )}
        {showAddPleaMobileNumber && (
          <GenericNumberInputModal
            t={t}
            handleClose={handleCloseMobileModal}
            handleSubmit={handlePleaMobileSubmit}
            mobileNumber={pleaMobileNumber}
            setMobileNumber={setPleaMobileNumber}
            error={pleaMobileNumberError}
            setError={setPleaMobileNumberError}
            header={"ADD_PLEA_MOBILE_NUMBER"}
          />
        )}
        {showPleaEsign && (
          <GenericSuccessLinkModal
            t={t}
            userType={userType}
            filingNumber={filingNumber}
            handleSaveOnSubmit={handleCloseSuccessModal}
            signatureUrl={pleaSignatureURL}
            header={"PLEA_ESIGN_MODAL_HEADER"}
          />
        )}
        {showSuccessModal && <SuccessBannerModal t={t} handleCloseSuccessModal={handleCloseSuccessModal} message={"PLEA_ESIGN_MODAL_SUCCESS"} />}
      </div>
      {showErrorToast && <Toast error={showErrorToast?.error} label={showErrorToast?.label} isDleteBtn={true} onClose={closeToast} />}
    </React.Fragment>
  );
};

export default PleaSubmission;
