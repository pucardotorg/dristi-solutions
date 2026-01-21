import { FormComposerV2, Toast } from "@egovernments/digit-ui-react-components";
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { clerkPhotoConfig } from "./config";
import { getFileByFileStore } from "../../../Utils";

const headerStyle = {
  fontFamily: "Roboto",
  fontSize: "24px",
  fontWeight: 700,
  lineHeight: "30px",
  textAlign: "center",
  color: "#0b0c0c",
  margin: 0,
  width: "100%",
};

const subHeaderStyle = {
  margin: 0,
  fontFamily: "Roboto",
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "21px",
  textAlign: "center",
  color: "#505a5f",
};

function ClerkPhotoUpload({ t, params, setParams, pathOnRefresh, path }) {
  const Digit = window.Digit || {};
  const history = useHistory();
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [isDisabled, setIsDisabled] = useState(true);

  const closeToast = () => {
    setShowErrorToast(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      closeToast();
    }, 2000);

    return () => clearTimeout(timer);
  }, [showErrorToast]);

  const validateFormData = (data) => {
    let isValid = true;
    clerkPhotoConfig.forEach((curr) => {
      if (!isValid) return;
      if (!(curr.body[0].key in data) || !data[curr.body[0].key]) {
        isValid = false;
        return;
      }
      curr.body[0].populators.inputs.forEach((input) => {
        if (!isValid) return;
        if (Array.isArray(input.name)) return;
        if (Array.isArray(data[curr.body[0].key][input.name]) && data[curr.body[0].key][input.name].length === 0) {
          isValid = false;
        }
        if (input?.isMandatory && !(input.name in data[curr.body[0].key])) {
          isValid = false;
        }
      });
    });
    return isValid;
  };

  const onFormValueChange = (setValue, formData, formState) => {
    let isDisabled = true;
    clerkPhotoConfig.forEach((curr) => {
      if (!(curr.body[0].key in formData) || !formData[curr.body[0].key]) {
        return;
      }
      curr.body[0].populators.inputs.forEach((input) => {
        if (!isDisabled) return;
        if (Array.isArray(input.name)) return;
        if (
          formData[curr.body[0].key][input.name] &&
          Array.isArray(formData[curr.body[0].key][input.name]) &&
          formData[curr.body[0].key][input.name].length > 0
        ) {
          isDisabled = false;
        }
      });
    });
    setIsDisabled(isDisabled);
  };

  const onSubmit = async (formData) => {
    if (!validateFormData(formData)) {
      setShowErrorToast(true);
      return;
    }

    const updatedParams = {
      ...params,
      clerkPhotoDetails: formData?.clerkPhotoDetails,
    };

    setParams(updatedParams);
    history.push(`/${window?.contextPath}/citizen/dristi/home/registration/terms-condition`, { newParams: updatedParams });
  };

  useEffect(() => {
    const handleRedirect = async () => {
      if (!params?.IndividualPayload && !params?.userType) {
        const storedParams = sessionStorage.getItem("userRegistrationParams");
        let newParams = storedParams ? JSON.parse(storedParams) : params;

        const fileStoreId = newParams?.uploadedDocument?.filedata?.files?.[0]?.fileStoreId;
        const filename = newParams?.uploadedDocument?.filename;

        const clerkPhotoFileStoreId = newParams?.clerkPhotoDetails?.clerkPhoto?.[1]?.fileStoreId;
        const clerkPhotoFilename = newParams?.clerkPhotoDetails?.clerkPhoto?.[0];

        if (clerkPhotoFileStoreId && clerkPhotoFilename) {
          const clerkPhotoUri = `${
            window.location.origin
          }/filestore/v1/files/id?tenantId=${Digit.ULBService.getCurrentTenantId()}&fileStoreId=${clerkPhotoFileStoreId}`;
          const clerkPhotoFile = await getFileByFileStore(clerkPhotoUri, clerkPhotoFilename);

          newParams = {
            ...newParams,
            clerkPhotoDetails: {
              ...newParams.clerkPhotoDetails,
              clerkPhoto: [
                [
                  clerkPhotoFilename,
                  {
                    file: clerkPhotoFile,
                    fileStoreId: clerkPhotoFileStoreId,
                  },
                ],
              ],
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
  }, [params, history, pathOnRefresh, Digit.ULBService]);

  return (
    <div className="clerk-photo-upload">
      <div className="id-verificatin-header">
        <p className="vefifcation-header" style={headerStyle}>
          {t("CS_UPLOAD_CLERK_PHOTO")}
        </p>
        <p className="vefifcation-sub-header" style={subHeaderStyle}>
          {t("CS_UPLOAD_CLERK_PHOTO_SUBTEXT")}
        </p>
        <p className="vefifcation-sub-header" style={{ ...subHeaderStyle, paddingBottom: "40px" }}>
          {t("CS_UPLOAD_CLERK_PHOTO_GUIDELINES")}
        </p>
      </div>
      <FormComposerV2
        config={clerkPhotoConfig}
        t={t}
        onSubmit={(props) => {
          onSubmit(props);
        }}
        isDisabled={isDisabled}
        label={"CS_COMMON_CONTINUE"}
        defaultValues={{ ...params?.clerkPhotoDetails } || {}}
        submitInForm
        onFormValueChange={onFormValueChange}
      ></FormComposerV2>

      {showErrorToast && <Toast error={true} label={t("ES_COMMON_PLEASE_UPLOAD_CLERK_PHOTO")} isDleteBtn={true} onClose={closeToast} />}
    </div>
  );
}

export default ClerkPhotoUpload;
