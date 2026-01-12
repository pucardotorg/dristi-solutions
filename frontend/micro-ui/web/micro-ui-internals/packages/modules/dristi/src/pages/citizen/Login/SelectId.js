import { FormComposerV2, Toast } from "@egovernments/digit-ui-react-components";
import React, { useEffect, useState } from "react";
import { getFileByFileStore } from "../../../Utils";

function SelectId({ config, t, params, history, onSelect, pathOnRefresh }) {
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const closeToast = () => {
    setShowErrorToast(false);
  };
  useEffect(() => {
    const timer = setTimeout(() => {
      closeToast();
    }, 2000);

    return () => clearTimeout(timer);
  }, [closeToast]);
  const onFormValueChange = (setValue, formData, formState) => {
    let isDisabled = false;
    config.forEach((curr) => {
      if (isDisabled) return;
      if (!(curr.body[0].key in formData) || !formData[curr.body[0].key]) {
        return;
      }
      curr.body[0].populators.inputs.forEach((input) => {
        if (isDisabled) return;
        if (Array.isArray(input.name)) return;
        if (
          formData[curr.body[0].key][input.name] &&
          formData[curr.body[0].key][input.name].length > 0 &&
          !["documentUpload", "radioButton"].includes(input.type) &&
          input.validation &&
          !formData[curr.body[0].key][input.name].match(Digit.Utils.getPattern(input.validation.patternType) || input.validation.pattern)
        ) {
          isDisabled = true;
        }
        if (Array.isArray(formData[curr.body[0].key][input.name]) && formData[curr.body[0].key][input.name].length === 0) {
          isDisabled = true;
        }
      });
    });
    if (isDisabled) {
      setIsDisabled(isDisabled);
    } else {
      setIsDisabled(false);
    }
  };

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
            setShowErrorToast(!validateFormData(props));
          } else {
            onSelect(props);
          }
          return;
        }}
        submitInForm
      ></FormComposerV2>
      {showErrorToast && <Toast error={true} label={t("ID_NOT_SELECTED_ERROR_MESSAGE")} isDleteBtn={true} onClose={closeToast} />}
    </div>
  );
}

export default SelectId;
