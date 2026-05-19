import { FormComposerV2 } from "@egovernments/digit-ui-module-core";
import React, { useState } from "react";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import CustomToast from "../../../components/CustomToast";
import { useUserRegistrationSessionRestore, validateRegistrationMandatoryFormData } from "./shared/registrationFlowShared";

function UploadIdType({ config, t, onAadharChange, onDocumentUpload, params, pathOnRefresh, isAdvocateUploading, onFormValueChange }) {
  const [showToast, setShowToast] = useState(false);
  const history = useHistory();
  useUserRegistrationSessionRestore({
    params,
    history,
    pathOnRefresh,
    shouldRestore: (p) => !isAdvocateUploading && !p?.indentity,
    effectDeps: [params?.address, isAdvocateUploading],
  });

  return (
    <div className="advocate-additional-details upload-id">
      <FormComposerV2
        config={config}
        t={t}
        defaultValues={
          params?.uploadedDocument
            ? {
                SelectUserTypeComponent: {
                  selectIdType: params?.uploadedDocument?.IdType || "",
                  ID_Proof: [
                    [
                      params?.uploadedDocument?.filename,
                      {
                        file: params?.uploadedDocument?.file,
                        fileStoreId: {
                          fileStoreId: params?.uploadedDocument?.filedata?.files?.[0]?.fileStoreId || "",
                        },
                      },
                    ],
                  ],
                },
              }
            : {}
        }
        onSubmit={(data) => {
          if (isAdvocateUploading) {
            return;
          }
          if (!validateRegistrationMandatoryFormData(config, data)) {
            setShowToast({ label: t("ES_COMMON_PLEASE_ENTER_ALL_MANDATORY_FIELDS"), error: true });
          } else if (data?.SelectUserTypeComponent?.aadharNumber) {
            onAadharChange(data?.SelectUserTypeComponent?.aadharNumber);
          } else {
            onDocumentUpload(
              data?.SelectUserTypeComponent?.ID_Proof[0][0],
              data?.SelectUserTypeComponent?.ID_Proof[0][1]?.file,
              data?.SelectUserTypeComponent?.selectIdType
            );
          }
          return;
        }}
        onFormValueChange={onFormValueChange}
        noBoxShadow
        inline
        label={!isAdvocateUploading ? "CS_COMMON_CONTINUE" : ""}
        // onFormValueChange={onFormValueChange}
        onSecondayActionClick={() => {}}
        submitInForm={!isAdvocateUploading}
      ></FormComposerV2>
      {showToast && (
        <CustomToast
          error={showToast?.error}
          label={showToast?.label}
          errorId={showToast?.errorId}
          onClose={() => setShowToast(null)}
          duration={showToast?.errorId ? 7000 : 5000}
        />
      )}
    </div>
  );
}
export default UploadIdType;
