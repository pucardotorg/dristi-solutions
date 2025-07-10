import { FormComposerV2, Header, Loader } from "@egovernments/digit-ui-react-components";
import React, { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { bailBondConfig } from "../../configs/generateBailBondConfig";
import isEqual from "lodash/isEqual";
import BailBondReviewModal from "../../components/BailBondReviewModal";
import BailUploadSignatureModal from "../../components/BailUploadSignatureModal";
import useDownloadCasePdf from "@egovernments/digit-ui-module-dristi/src/hooks/dristi/useDownloadCasePdf";
import SuccessBannerModal from "../../components/SuccessBannerModal";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import BailBondEsignLockModal from "../../components/BailBondEsignLockModal";

const fieldStyle = { marginRight: 0, width: "100%" };

const GenerateBailBond = () => {
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const { t } = useTranslation();
  const history = useHistory();
  const { filingNumber } = Digit.Hooks.useQueryParams();
  const userInfo = Digit.UserService.getUser()?.info;
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo?.type]);
  const isCitizen = useMemo(() => userInfo?.type === "CITIZEN", [userInfo]);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
  const [showBailBondReview, setShowBailBondReview] = useState(false);
  const [showSignatureModal, setShowsignatureModal] = useState(false);
  const [showUploadSignature, setShowUploadSignature] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showBailBondEsign, setShowBailBondEsign] = useState(false);
  const [loader, setLoader] = useState(false);
  const { downloadPdf } = useDownloadCasePdf();
  const setFormErrors = useRef(null);
  const setFormState = useRef(null);
  const resetFormData = useRef(null);
  const setFormDataValue = useRef(null);
  const clearFormDataErrors = useRef(null);
  const [formdata, setFormdata] = useState({});

  const { data: caseData, isLoading: isCaseLoading } = Digit.Hooks.dristi.useSearchCaseService(
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

  const pipComplainants = useMemo(() => {
    return caseDetails?.litigants
      ?.filter((litigant) => litigant.partyType.includes("complainant"))
      ?.filter(
        (litigant) =>
          !caseDetails?.representatives?.some((representative) =>
            representative?.representing?.some((rep) => rep?.individualId === litigant?.individualId)
          )
      );
  }, [caseDetails]);

  const pipAccuseds = useMemo(() => {
    return caseDetails?.litigants
      ?.filter((litigant) => litigant.partyType.includes("respondent"))
      ?.filter(
        (litigant) =>
          !caseDetails?.representatives?.some((representative) =>
            representative?.representing?.some((rep) => rep?.individualId === litigant?.individualId)
          )
      );
  }, [caseDetails]);

  const complainantsList = useMemo(() => {
    const loggedinUserUuid = userInfo?.uuid;
    // If logged in person is an advocate
    const isAdvocateLoggedIn = caseDetails?.representatives?.find((rep) => rep?.additionalDetails?.uuid === loggedinUserUuid);
    const isPipLoggedIn = pipComplainants?.find((p) => p?.additionalDetails?.uuid === loggedinUserUuid);
    const accusedLoggedIn = pipAccuseds?.find((p) => p?.additionalDetails?.uuid === loggedinUserUuid);

    if (isAdvocateLoggedIn) {
      return isAdvocateLoggedIn?.representing?.map((r) => {
        return {
          code: r?.additionalDetails?.fullName,
          name: r?.additionalDetails?.fullName,
          uuid: r?.additionalDetails?.uuid,
        };
      });
    } else if (isPipLoggedIn) {
      return [
        {
          code: isPipLoggedIn?.additionalDetails?.fullName,
          name: isPipLoggedIn?.additionalDetails?.fullName,
          uuid: isPipLoggedIn?.additionalDetails?.uuid,
        },
      ];
    } else if (accusedLoggedIn) {
      return [
        {
          code: accusedLoggedIn?.additionalDetails?.fullName,
          name: accusedLoggedIn?.additionalDetails?.fullName,
          uuid: accusedLoggedIn?.additionalDetails?.uuid,
        },
      ];
    }
    return [];
  }, [caseDetails, pipComplainants, pipAccuseds, userInfo]);

  const modifiedFormConfig = useMemo(() => {
    const updatedConfig = bailBondConfig.map((config) => {
      const bailType = formdata?.bailType?.code;
      return {
        ...config,
        body: config?.body.map((body) => {
          if (body?.key === "sureties") {
            return {
              ...body,
              isMandatory: bailType !== "SURETY",
              populators: {
                ...body.populators,
                hideInForm: bailType !== "SURETY",
              },
            };
          }
          if (body?.populators?.validation) {
            const customValidations =
              Digit?.Customizations?.[body.populators.validation.pattern.masterName]?.[body.populators.validation.pattern.moduleName];

            if (typeof customValidations === "function") {
              const patternType = body.populators.validation.pattern.patternType;
              const message = body.populators.validation.pattern.message;

              body.populators.validation = {
                ...body.populators.validation,
                pattern: {
                  value: customValidations(patternType),
                  message,
                },
              };
            }
          }
          if (body?.key === "selectComplainant") {
            body.populators.options = complainantsList;
            if (complainantsList?.length === 1) {
              const updatedBody = {
                ...body,
                disable: true,
              };
              return updatedBody;
            }
          }
          return {
            ...body,
          };
        }),
      };
    });
    return updatedConfig;
  }, [complainantsList, formdata]);
  
  const onFormValueChange = (setValue, formData, formState, reset, setError, clearErrors, trigger, getValues) => {

    if (formData?.bailAmount <= 0 && !Object.keys(formState?.errors).includes("bailAmount")) {
      setError("bailAmount", { message: t("Must be greater than zero") });
    } else if (formData?.bailAmount > 0 && Object.keys(formState?.errors).includes("bailAmount")) {
      clearErrors("bailAmount");
    }
    if (formData?.bailType?.code === "SURETY") {
      if (!formData?.sureties && !Object.keys(formState?.errors).includes("sureties")) {
        setValue("sureties", [{}]);
        setError("sureties", { message: t("CORE_REQUIRED_FIELD_ERROR") });
      } else if (formData?.sureties?.length > 0 && !Object.keys(formState?.errors).includes("sureties")) {
        formData?.sureties?.forEach((docs, index) => {
          if (!docs?.name && !Object.keys(formState?.errors).includes(`name_${index}`)) {
            setError(`name_${index}`, { message: t("CORE_REQUIRED_FIELD_ERROR") });
          }
          else if (docs?.name && Object.keys(formState?.errors).includes(`name_${index}`)) {
            clearErrors(`name_${index}`);
          }

          if (!docs?.fatherName && !Object.keys(formState?.errors).includes(`fatherName_${index}`)) {
            setError(`fatherName_${index}`, { message: t("CORE_REQUIRED_FIELD_ERROR") });
          } else if (docs?.fatherName && Object.keys(formState?.errors).includes(`fatherName_${index}`)) {
            clearErrors(`fatherName_${index}`);
          }

          if (!docs?.mobileNumber && !Object.keys(formState?.errors).includes(`mobileNumber_${index}`)) {
            setError(`mobileNumber_${index}`, { message: t("CORE_REQUIRED_FIELD_ERROR") });
          } else if (docs?.mobileNumber && Object.keys(formState?.errors).includes(`mobileNumber_${index}`)) {
            clearErrors(`mobileNumber_${index}`);
          }

          if (!docs?.identityProof && !Object.keys(formState?.errors).includes(`identityProof_${index}`)) {
            setError(`identityProof_${index}`, { message: t("CORE_REQUIRED_FIELD_ERROR") });
          } else if (docs?.identityProof && Object.keys(formState?.errors).includes(`identityProof_${index}`)) {
            clearErrors(`identityProof_${index}`);
          }

          if (!docs?.proofOfSolvency && !Object.keys(formState?.errors).includes(`proofOfSolvency_${index}`)) {
            setError(`proofOfSolvency_${index}`, { message: t("CORE_REQUIRED_FIELD_ERROR") });
          } else if (docs?.proofOfSolvency && Object.keys(formState?.errors).includes(`proofOfSolvency_${index}`)) {
            clearErrors(`proofOfSolvency_${index}`);
          }

          if (!docs?.otherDocuments && !Object.keys(formState?.errors).includes(`otherDocuments_${index}`)) {
            setError(`otherDocuments_${index}`, { message: t("CORE_REQUIRED_FIELD_ERROR") });
          } else if (docs?.otherDocuments && Object.keys(formState?.errors).includes(`otherDocuments_${index}`)) {
            clearErrors(`otherDocuments_${index}`);
          }
        });
      } else if (formData?.sureties?.length > 0 && Object.keys(formState?.errors).includes("sureties")) {
        clearErrors("sureties");
      }
    }

    if (Object.keys(formState?.errors).length) {
      setIsSubmitDisabled(true);
    } else {
      setIsSubmitDisabled(false);
    }

    if (!isEqual(formdata, formData)) {
      setFormdata(formData);
    }
    setFormErrors.current = setError;
    setFormState.current = formState;
    resetFormData.current = reset;
    setFormDataValue.current = setValue;
    clearFormDataErrors.current = clearErrors;
  };

  const defaultFormValue = useMemo(() => {
    if (!complainantsList || complainantsList.length === 0) return {};

    if (complainantsList.length === 1) {
      const onlyComplainant = complainantsList[0];
      return {
        selectComplainant: {
          code: onlyComplainant.code,
          name: onlyComplainant.name,
          uuid: onlyComplainant.uuid,
        },
      };
    }

    return {};
  }, [complainantsList]);

  const formKey = useMemo(() => {
    return defaultFormValue ? JSON.stringify(defaultFormValue) : "initial";
  }, [defaultFormValue]);

  const handleSubmit = () => {
    // Todo : create and Update Api Call
    console.log(formdata,"formdata");

    const payload = { 
      tenantId,
      caseId: caseDetails?.id,
      filingNumber: filingNumber,
      complainant: formdata?.selectComplainant?.uuid,
      bailType: formdata?.bailType?.code,
      auditDetails: {
        createdBy: userInfo?.uuid,
        lastModifiedBy: userInfo?.uuid,
      },
      bailAmount: formdata?.bailAmount,
      sureties: formdata?.sureties,
      litigantId: formdata?.selectComplainant?.uuid,
      litigantName: formdata?.selectComplainant?.name,
      litigantFatherName: formdata?.selectComplainant?.fatherName,
      courtId: caseDetails?.courtId,
      caseTitle: caseDetails?.caseTitle,
      cnrNumber: caseDetails?.cnrNumber,
      caseType: caseDetails?.caseType,
      documents:[],
      additionalDetails: {
        ...formdata
      }
    };

    console.log(payload, "payload");
    
    
    setShowBailBondReview(true);
  };

  const handleSaveDraft = () => {
    // Todo : Create and Update Api Call
  };

  const handleCloseSignatureModal = () => {
    setShowsignatureModal(false);
    setShowBailBondReview(true);
  };

  const handleDownload = () => {
    // TODO : need to change
    downloadPdf(tenantId, "620e3843-1f9c-4abb-92fe-af6bc30f0e6b");
  };

  const handleESign = () => {
    // TODO: call Api then close this modal and show next modal
    setShowsignatureModal(false);
    setShowBailBondEsign(true);
  };

  const handleSubmitSignature = async (fileStoreId) => {
    // TODO: api call with fileStoreID then
    setLoader(false);
    setShowsignatureModal(false);
    setShowUploadSignature(false);
    setShowSuccessModal(true);
  };

  const handleCloseSuccessModal = () => {
    history.replace(`/${window?.contextPath}/${userType}/dristi/home/view-case?caseId=${caseDetails?.id}&filingNumber=${filingNumber}&tab=Documents`);
  };

  if (isCaseLoading || !caseDetails) {
    return <Loader />;
  }
    
  return (
    <React.Fragment>
      <style>
        {`
          .bail-action-bar {
            display: flex;
            flex-direction: row-reverse;
            gap: 16px;
          }

          .submit-bar {
            width: fit-content;
            padding-inline: 20px;
            box-shadow: none;
          }
          
          .card .label-field-pair .card-label{
          font-weight : unset !important;
          margin-bottom : 8px !important
          }
        `}
      </style>
      <div className="citizen create-submission" style={{ width: "90%", ...(!isCitizen && { padding: "0 8px 24px 16px" }) }}>
        <Header styles={{ margin: "25px 0px 0px 25px" }}> {t("BAIL_BOND_DETAILS")}</Header>
        <div style={{ minHeight: "550px", overflowY: "auto" }}>
          <FormComposerV2
            key={formKey}
            className={"bailbond"}
            label={t("REVIEW_BAIL_BOND")}
            secondaryLabel={t("SAVE_AS_DRAFT")}
            showSecondaryLabel={true}
            config={modifiedFormConfig}
            defaultValues={defaultFormValue}
            onFormValueChange={onFormValueChange}
            onSubmit={handleSubmit}
            onSecondayActionClick={handleSaveDraft}
            fieldStyle={fieldStyle}
            isDisabled={isSubmitDisabled}
            actionClassName={"bail-action-bar"}
          />
        </div>

        {showBailBondReview && (
          <BailBondReviewModal
            t={t}
            handleBack={() => setShowBailBondReview(false)}
            setShowBailBondReview={setShowBailBondReview}
            setShowsignatureModal={setShowsignatureModal}
          />
        )}

        {showSignatureModal && (
          <BailUploadSignatureModal
            t={t}
            handleCloseSignatureModal={handleCloseSignatureModal}
            handleDownload={handleDownload}
            handleESign={handleESign}
            setShowUploadSignature={setShowUploadSignature}
            showUploadSignature={showUploadSignature}
            handleSubmit={handleSubmitSignature}
            setLoader={setLoader}
            loader={loader}
          />
        )}

        {showBailBondEsign && <BailBondEsignLockModal t={t} handleSaveOnSubmit={handleCloseSuccessModal} userType={userType} filingNumber={filingNumber}/>}
        {showSuccessModal && <SuccessBannerModal t={t} handleCloseSuccessModal={handleCloseSuccessModal} message={"SIGNED_BAIL_BOND_MESSAGE"} />}
      </div>
    </React.Fragment>
  );
};

export default GenerateBailBond;
