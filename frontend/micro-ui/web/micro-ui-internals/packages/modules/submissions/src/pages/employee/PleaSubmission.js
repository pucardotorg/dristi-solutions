import { FormComposerV2, Header, Loader, Toast } from "@egovernments/digit-ui-react-components";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { pleaSubmissionDetailConfig } from "../../configs/pleaSubmissionConfig";
import isEqual from "lodash/isEqual";
import { BreadCrumbsParamsDataContext } from "@egovernments/digit-ui-module-core";
import { DRISTIService } from "@egovernments/digit-ui-module-dristi/src/services";
import useSearchDigitalization from "../../hooks/submissions/useSearchDigitalization";
import { useHistory } from "react-router-dom/cjs/react-router-dom";
import { _getCreatePleaPayload, _getPdfConfig, _getUploadPleaPayload, BooleanToCode, pleaWorkflowActions } from "../../utils/digitilization";
import { submissionService } from "../../hooks/services";
import PreviewPdfModal from "../../components/PreviewPdfModal";

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
    caste: obj?.caste,
    calling: obj?.calling,
    religion: obj?.religion,
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
        documentNumber: documentNumber,
        ...(courtId && { courtId: courtId }),
      },
      tenantId,
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
              options: [
                {
                  code: "complainantOne",
                  name: "ComplainantOne",
                },
              ],
            },
          };
        }

        if (body?.populators?.validation?.customValidationFn) {
          const customValidations =
            Digit.Customizations[body.populators.validation.customValidationFn.moduleName][body.populators.validation.customValidationFn.masterName];

          debugger;
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
  }, [t]);

  const defaultFormValue = useMemo(() => {
    if (Object.keys(defaultFormValueData).length > 0) {
      return convertToFormData(t, defaultFormValueData);
    }

    if (documentNumber && pleaResponseDetails) {
      return convertToFormData(pleaResponseDetails);
    }

    return {
      magistrateRemarks: { text: "Taken down by/before me in open court, interpreted/read over to the accused and admitted by him/her label" },
      pleadGuilty: { code: "NO", name: "NO" },
      isChargesUnderstood: { code: "YES", name: "YES" },
    };
  }, [defaultFormValueData, documentNumber, pleaResponseDetails, t]);

  const onFormValueChange = (setValue, formData, formState, reset, setError, clearErrors, trigger, getValues) => {
    if (!isEqual(formdata, formData)) {
      setFormdata(formData);
    }

    if (Object.keys(formState?.errors).length) {
      setIsSubmitDisabled(true);
    } else {
      setIsSubmitDisabled(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoader(true);
      let pleaSubmissionUpdateResponse = null;
      if (!documentNumber) {
        const payload = _getCreatePleaPayload(caseDetails, formdata, tenantId);
        debugger;
        pleaSubmissionUpdateResponse = await submissionService.createDigitalization(payload, tenantId);
        setDefaultFormValueData(pleaSubmissionUpdateResponse?.digitalizedDocument || {});
        history.replace(
          `/${window?.contextPath}/${userType}/submissions/plea?filingNumber=${filingNumber}&documentNumber=${pleaSubmissionUpdateResponse?.digitalizedDocument?.documentNumber}&showModal=true`
        );
      } else {
        const payload = _getUploadPleaPayload(t, pleaResponseDetails, formdata, tenantId, pleaWorkflowActions.SAVEDRAFT, null);
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
            zIndex: "9999",
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
        <Header> {t(pleaSubmissionDetailConfig.header)}</Header>
        <div style={{ minHeight: "550px", overflowY: "auto", marginTop: "15px", width: "50%" }}>
          <FormComposerV2
            label={t("REVIEW_PLEA_SUBMISSION")}
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
                  `/${window?.contextPath}/${userType}/submissions/bail-bond?filingNumber=${filingNumber}&documentNumber=${documentNumber}`
                );
              }
            }}
            setPreviewModal={setPreviewPleModal}
            pdfConfig={_getPdfConfig(pleaResponseDetails, caseDetails, courtId, tenantId)}
            setShowsignatureModal={setShowsignatureModal}
            setFileStoreId={setPleaFileStoreId}
          />
        )}
      </div>
      {showErrorToast && <Toast error={showErrorToast?.error} label={showErrorToast?.label} isDleteBtn={true} onClose={closeToast} />}
    </React.Fragment>
  );
};

export default PleaSubmission;
