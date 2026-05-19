import { FormComposerV2 } from "@egovernments/digit-ui-module-core";
import CustomToast from "@egovernments/digit-ui-module-dristi/src/components/CustomToast";
import React, { useState } from "react";
import { createRegistrationPatternValidationOnChange, useUserRegistrationSessionRestore } from "../registration/shared/registrationFlowShared";

function SelectId({ config, t, params, history, onSelect, pathOnRefresh }) {
  const [showToast, setShowToast] = useState(null);
  const [isDisabled, setIsDisabled] = useState(false);

  const onFormValueChange = createRegistrationPatternValidationOnChange(config, setIsDisabled);

  const validateFormData = (data) => {
    let isValid = true;
    if (!data?.IdVerification?.selectIdType) {
      isValid = false;
    }

    return isValid;
  };

  useEffect(() => {
    const handleRedirect = async () => {
      if (!params?.address) {
        const storedParams = sessionStorage.getItem("userRegistrationParams");
        let newParams = storedParams ? JSON.parse(storedParams) : params;

        const fileStoreId = newParams?.uploadedDocument?.filedata?.files?.[0]?.fileStoreId;
        const filename = newParams?.uploadedDocument?.filename;

        const barCouncilFileStoreId = newParams?.formData?.clientDetails?.barCouncilId?.[1]?.fileStoreId;
        const barCouncilFilename = newParams?.formData?.clientDetails?.barCouncilId?.[0];

        if (barCouncilFileStoreId && barCouncilFilename) {
          const barCouncilUri = `${
            window.location.origin
          }/filestore/v1/files/id?tenantId=${Digit.ULBService.getCurrentTenantId()}&fileStoreId=${barCouncilFileStoreId}`;
          const barCouncilFile = await getFileByFileStore(barCouncilUri, barCouncilFilename);

          newParams = {
            ...newParams,
            formData: {
              ...newParams.formData,
              clientDetails: {
                ...newParams.formData.clientDetails,
                barCouncilId: [
                  [
                    barCouncilFilename,
                    {
                      file: barCouncilFile,
                      fileStoreId: barCouncilFileStoreId,
                    },
                  ],
                ],
              },
            },
          };
        }

        if (fileStoreId && filename) {
          const uri = `${window.location.origin}/filestore/v1/files/id?tenantId=${Digit.ULBService.getCurrentTenantId()}&fileStoreId=${fileStoreId}`;
          const file = await getFileByFileStore(uri, filename);

          newParams = {
            ...newParams,
            uploadedDocument: {
              ...newParams.uploadedDocument,
              file,
            },
          };
        }

        sessionStorage.removeItem("userRegistrationParams");
        history.push(pathOnRefresh, { newParams });
      }
    };

    handleRedirect();
  }, [params?.address, params, history, pathOnRefresh]);

  return (
    <div className="id-verification">
      <FormComposerV2
        config={config}
        t={t}
        noBoxShadow
        inline
        isDisabled={isDisabled}
        label={t("CS_COMMON_CONTINUE")}
        onSecondayActionClick={() => {}}
        onFormValueChange={onFormValueChange}
        defaultValues={params?.indentity || {}}
        value={params?.indentity || {}}
        onSubmit={(props) => {
          if (!validateFormData(props)) {
            setShowToast({ label: t("ID_NOT_SELECTED_ERROR_MESSAGE"), error: true, errorId: null });
          } else {
            onSelect(props);
          }
          return;
        }}
        submitInForm
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

export default SelectId;
