import React, { useMemo, useState } from "react";
import SelectMultiUpload from "./SelectMultiUpload";
import { CardLabel, TextInput, CardLabelError, CustomDropdown } from "@egovernments/digit-ui-react-components";

const CloseBtn = () => {
  return (
    <svg width="16" height="18" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3 18C2.45 18 1.97917 17.8042 1.5875 17.4125C1.19583 17.0208 1 16.55 1 16V3H0V1H5V0H11V1H16V3H15V16C15 16.55 14.8042 17.0208 14.4125 17.4125C14.0208 17.8042 13.55 18 13 18H3ZM13 3H3V16H13V3ZM5 14H7V5H5V14ZM9 14H11V5H9V14Z"
        fill="#C62326"
      />
    </svg>
  );
};
const SupportingDocsComponent = ({ t, config, onSelect, formData = {}, errors, setError, clearErrors }) => {
  const [formInstances, setFormInstances] = useState(formData?.[config?.key]?.submissionDocuments || [{}]);
  const disable = config?.disable;
  console.log(disable, "DISABLE")
  const addAnotherForm = () => {
    setFormInstances([...formInstances, {}]);
  };
  const updateFormData = (updatedFormInstances) => {
    onSelect(config.key, {
      ...formData[config.key],
      submissionDocuments: updatedFormInstances.map((instance) => instance[config.key]),
    });
  };
  const deleteForm = (index) => {
    const updatedFormInstances = [...formInstances];
    updatedFormInstances.splice(index, 1);
    setFormInstances(updatedFormInstances);
    updateFormData(updatedFormInstances);
  };

  const inputs = useMemo(
    () =>

      config?.populators?.inputs || [
        {
          isMandatory: true,
          key: "documentType",
          type: "dropdown",
          label: "DOCUMENT_TYPE",
          populators: {
            name: "documentType",
            optionsKey: "code",
            error: "CORE_REQUIRED_FIELD_ERROR",
            styles: { maxWidth: "100%" },
            required: true,
            isMandatory: true,
            mdmsConfig: {
              moduleName: "Submission",
              masterName: "SubmissionDocumentType",
              select: "(data) => {return data['Submission'].SubmissionDocumentType?.map((item) => {return item;});}",
            },
            customStyle: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
          },
        },
        {
          isMandatory: true,
          key: "documentSubType",
          type: "dropdown",
          label: "Document Sub Type",
          populators: {
            name: "documentSubType",
            optionsKey: "code",
            error: "CORE_REQUIRED_FIELD_ERROR",
            styles: { maxWidth: "100%" },
            required: true,
            isMandatory: true,
            mdmsConfig: {
              moduleName: "Submission",
              masterName: "SubmissionDocumentType",
              select: "(data) => {return data['Submission'].SubmissionDocumentType?.map((item) => {return item;});}",
            },
            customStyle: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
          },
        },
        {
          label: "DOCUMENT_TITLE_OPTIONAL",
          labelChildren: "optional",
          isMandatory: false,
          key: "documentTitle",
          type: "text",
          name: "documentTitle",
          validation: {
            isRequired: true,
            pattern: /^[0-9A-Z/]{0,20}$/,
            errMsg: "",
          },
        },
        {
          type: "component",
          key: "submissionDocuments",
          component: "SelectMultiUpload",
          disable: false,
          populators: {
            inputs: [
              {
                name: "uploadedDocs",
                isMandatory: true,
                textAreaHeader: "CS_DOCUMENT",
                fileTypes: ["JPG", "PDF", "PNG", "JPEG"],
                uploadGuidelines: "UPLOAD_DOC_50",
                maxFileSize: 50,
                maxFileErrorMessage: "CS_FILE_LIMIT_50_MB",
                textAreaStyle: {
                  fontSize: "16px",
                  fontWeight: 400,
                  marginBottom: "8px",
                },
              },
            ],
          },
        },
      ],
    [config?.populators?.inputs]
  );

  return (
    <React.Fragment>
      {formInstances.map((formInstance, index) => (
        <div key={index}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <p style={{ fontSize: "24px", fontWeight: 700 }}>{`Submission Document (${index + 1})`}</p>
            {formInstances.length > 1 && !disable && (
              <button type="button" style={{ background: "none" }} onClick={() => deleteForm(index)}>
                <CloseBtn />
              </button>
            )}
          </div>

          {inputs?.map((input, index) => (
            <React.Fragment key={index}>
              {input?.type === "text" && (
                <div>
                  <div>{t(input.label)}</div>
                  <TextInput
                    className="field desktop-w-full"
                    key={input?.name}
                    value={formInstance[input.key] || ""}
                    onChange={(e) => {
                      const updatedInstances = [...formInstances];
                      updatedInstances[index][input.key] = e.target.value;
                      setFormInstances(updatedInstances);
                    }}
                    disable={input?.isDisabled}
                    isRequired={input?.validation?.isRequired}
                    pattern={input?.validation?.pattern}
                    errMsg={input?.validation?.errMsg}
                    maxlength={input?.validation?.maxlength}
                    minlength={input?.validation?.minlength}
                    style={{ minWidth: "500px" }}
                  />
                </div>
              )}
              {input?.component === "SelectMultiUpload" && (
                <SelectMultiUpload config={input} t={t} formData={formData} onSelect={onSelect} errors={errors} />
              )}
              {input?.type === "dropdown" && (
                <div>
                  <div>{t(input.label)}</div>
                  <CustomDropdown
                    label={input.name}
                    type={input.type}
                    value={formInstance[input.key] || ""}
                    onChange={(e) => {
                      const updatedInstances = [...formInstances];
                      updatedInstances[index][input.key] = e;
                      setFormInstances(updatedInstances);
                    }}
                    config={input.populators}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      ))}
      {!disable && (
        <button
          type="button"
          onClick={addAnotherForm}
          style={{ background: "none", fontSize: "16px", fontWeight: 700, color: "#007E7E" }}
        >
          {formInstances.length < 1 ? `+ ${t("ADD_SUBMISSION_DOCUMENTS")}` : `+ ${t("ADD_ANOTHER")}`}
        </button>
      )}
    </React.Fragment>
  );

};

export default SupportingDocsComponent;
