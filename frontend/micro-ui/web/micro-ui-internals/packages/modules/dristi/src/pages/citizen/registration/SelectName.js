import { FormComposerV2, Toast } from "@egovernments/digit-ui-react-components";
import React, { useEffect, useMemo, useState } from "react";
import { getFileByFileStore } from "../../../Utils";

const SelectName = ({ config, t, onSubmit, isDisabled, params, history, value, isUserLoggedIn, pathOnRefresh, isLitigantPartialRegistered }) => {
  const [showErrorToast, setShowErrorToast] = useState(false);

  const closeToast = () => {
    setShowErrorToast(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      closeToast();
    }, 2000);

    return () => clearTimeout(timer);
  }, [closeToast]);

  if (!params?.mobileNumber && !isUserLoggedIn) {
    history.push(`/${window?.contextPath}/citizen/dristi/home/login`);
  }

  useEffect(() => {
    const handleRedirect = async () => {
      if (!params?.isSkip && !params?.email) {
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

  const onFormValueChange = (setValue, formData, formState) => {
    const formDataCopy = structuredClone(formData);
    for (const key in formDataCopy) {
      if (Object.hasOwnProperty.call(formDataCopy, key)) {
        const oldValue = formDataCopy[key];
        let value = oldValue;
        if (typeof value === "string") {
          let updatedValue = value
            .replace(/[^a-zA-Z\s]/g, "")
            .trimStart()
            .replace(/ +/g, " ");
          if (updatedValue !== oldValue) {
            const element = document.querySelector(`[name="${key}"]`);
            const start = element?.selectionStart;
            const end = element?.selectionEnd;
            setValue(key, updatedValue);
            setTimeout(() => {
              element?.setSelectionRange(start, end);
            }, 0);
          }
        }
      }
    }
  };

  const modifiedFormConfig = useMemo(() => {
    const applyUiChanges = (config) => ({
      ...config,
      body: config?.body?.map((body) => {
        let tempBody = {
          ...body,
        };
        if (isLitigantPartialRegistered) {
          tempBody = {
            ...tempBody,
            disable: true,
          };
        }
        return tempBody;
      }),
    });

    return config?.map((config) => applyUiChanges(config));
  }, [config, isLitigantPartialRegistered]);

  return (
    <React.Fragment>
      <FormComposerV2
        key={params?.name?.firstName}
        config={modifiedFormConfig}
        t={t}
        noBoxShadow
        inline={false}
        label={t("CORE_COMMON_CONTINUE")}
        onSecondayActionClick={() => {}}
        onFormValueChange={onFormValueChange}
        onSubmit={(props) => onSubmit(props)}
        defaultValues={params?.name || {}}
        submitInForm
        className={"registration-select-name"}
      ></FormComposerV2>
    </React.Fragment>
  );
};

export default SelectName;
