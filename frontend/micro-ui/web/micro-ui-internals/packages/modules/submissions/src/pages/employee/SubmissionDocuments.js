import React, { useMemo, useState } from "react";
import { submissionDocumentDetailsConfig } from "../../configs/submitDocumentConfig";
import { FormComposerV2, Header, Loader } from "@egovernments/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import isEqual from "lodash/isEqual";

const fieldStyle = { marginRight: 0, width: "100%" };

const SubmissionDocuments = ({ path }) => {
  const { t } = useTranslation();
  const [formdata, setFormdata] = useState({});
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);

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
            // onSubmit={handleOpenReview}
            fieldStyle={fieldStyle}
            // key={formKey}
            className={"formComposer"}
            isDisabled={isSubmitDisabled}
          />
        </div>
      </div>
    </React.Fragment>
  );
};

export default SubmissionDocuments;
