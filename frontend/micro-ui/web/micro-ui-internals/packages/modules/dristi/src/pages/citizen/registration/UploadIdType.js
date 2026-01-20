import { FormComposerV2, Toast } from "@egovernments/digit-ui-react-components";
import React, { useEffect, useState } from "react";
import { useHistory, useLocation } from "react-router-dom/cjs/react-router-dom.min";
import { getFileByFileStore } from "../../../Utils";

function UploadIdType({ config, t, onAadharChange, onDocumentUpload, params, pathOnRefresh, isAdvocateUploading, onFormValueChange }) {
  const [showErrorToast, setShowErrorToast] = useState(false);
  const history = useHistory();
  const validateFormData = (data) => {
    let isValid = true;
    config.forEach((curr) => {
      if (!isValid) return;
      if (!(curr.body[0].key in data) || !data[curr.body[0].key]) {
        isValid = false;
      }
      curr.body[0].populators.inputs.forEach((input) => {
        if (!isValid) return;
        if (Array.isArray(input.name)) return;
        if (input.disableMandatoryFieldFor) {
          if (input.disableMandatoryFieldFor.some((field) => !data[curr.body[0].key][field]) && data[curr.body[0].key][input.name]) {
            if (Array.isArray(data[curr.body[0].key][input.name]) && data[curr.body[0].key][input.name].length === 0) {
              isValid = false;
            }
            if ((input?.isMandatory && !(input.name in data[curr.body[0].key])) || !data[curr.body[0].key][input.name]) {
              isValid = false;
            }
            return;
          } else {
            if (
              (input?.isMandatory && !(input.name in data[curr.body[0].key])) ||
              (!data[curr.body[0].key][input.name] && !input.disableMandatoryFieldFor.some((field) => data[curr.body[0].key][field]))
            ) {
              isValid = false;
            }
          }
          return;
        } else {
          if (Array.isArray(data[curr.body[0].key][input.name]) && data[curr.body[0].key][input.name].length === 0) {
            isValid = false;
          }
          if (input?.isMandatory && !(input.name in data[curr.body[0].key])) {
            isValid = false;
          }
        }
      });
    });
    return isValid;
  };

  const closeToast = () => {
    setShowErrorToast(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      closeToast();
    }, 2000);

    return () => clearTimeout(timer);
  }, [closeToast]);

  useEffect(() => {
    const handleRedirect = async () => {
      if (!isAdvocateUploading && !params?.indentity) {
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
  }, [params.address, params, history, pathOnRefresh, isAdvocateUploading]);

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
          if (!validateFormData(data)) {
            setShowErrorToast(!validateFormData(data));
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
      {showErrorToast && <Toast error={true} label={t("ES_COMMON_PLEASE_ENTER_ALL_MANDATORY_FIELDS")} isDleteBtn={true} onClose={closeToast} />}
    </div>
  );
}
export default UploadIdType;
