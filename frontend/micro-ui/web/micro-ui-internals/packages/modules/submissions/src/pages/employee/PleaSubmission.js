import { FormComposerV2, Header, Toast } from "@egovernments/digit-ui-react-components";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { pleaSubmissionDetailConfig } from "../../configs/pleaSubmissionConfig";
import isEqual from "lodash/isEqual";

const fieldStyle = { marginRight: 0, width: "100%" };

const PleaSubmission = () => {
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const { t } = useTranslation();
  const [formdata, setFormdata] = useState({});
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(null);

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
        return body;
      }),
    });

    const originalFormConfig = pleaSubmissionDetailConfig.formConfig;

    return originalFormConfig?.map((config) => applyUiChanges(config));
  }, [t]);

  // TODO: change
  const defaultFormValue = useMemo(() => {
    return {
      remarks: { text: "Taken down by/before me in open court, interpreted/read over to the accused and admitted by him/her label" },
      pleadGuilty: { code: "NO", name: "NO" },
      chargesUnderstood: { code: "YES", name: "YES" },
    };
  }, []);

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

  const handleOpenReview = () => {
    // TODO: review plea
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

  return (
    <React.Fragment>
      <div className="citizen create-submission" style={{ padding: "24px 24px 24px 40px" }}>
        {" "}
        <Header> {t(pleaSubmissionDetailConfig.header)}</Header>
        <div style={{ minHeight: "550px", overflowY: "auto", marginTop: "15px", width: "50%" }}>
          <FormComposerV2
            label={t("REVIEW_PLEA_SUBMISSION")}
            config={modifiedFormConfig}
            defaultValues={defaultFormValue}
            onFormValueChange={onFormValueChange}
            onSubmit={handleOpenReview}
            fieldStyle={fieldStyle}
            // key={formKey}
            className={"formComposer plea-form-composer"}
            isDisabled={isSubmitDisabled}
          />
        </div>
      </div>
      {showErrorToast && <Toast error={showErrorToast?.error} label={showErrorToast?.label} isDleteBtn={true} onClose={closeToast} />}
    </React.Fragment>
  );
};

export default PleaSubmission;
