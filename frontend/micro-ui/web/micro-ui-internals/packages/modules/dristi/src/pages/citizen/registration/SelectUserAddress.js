import { FormComposerV2 } from "@egovernments/digit-ui-react-components";
import React, { useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import isEqual from "lodash/isEqual";
import { getFileByFileStore } from "../../../Utils";

const SelectUserAddress = ({ config, onSelect, t, params, pathOnRefresh }) => {
  const history = useHistory();
  const [isDisabled, setIsDisabled] = useState(false);
  const [formdata, setformData] = useState(params?.address || {});

  const onFormValueChange = (setValue, formData, formState) => {
    if (formData?.isBothAddressSame?.code === "YES") {
      const existing = formData?.currentAddress;
      const target = { ...formData?.addressDetails, temp: 1 };
      if (!isEqual(existing, target)) {
        setValue("currentAddress", target);
      }
    } else if (formData?.isBothAddressSame?.code === "NO" && formData?.currentAddress?.temp) {
      setValue("currentAddress", undefined);
    }

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

    if (!isEqual(formdata, formData)) {
      setformData(formData);
    }
  };

  useEffect(() => {
    const handleRedirect = async () => {
      if (!params?.name) {
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

  const modifiedConfig = useMemo(() => {
    const shouldDisable = formdata?.isBothAddressSame?.code === "YES";

    return config.map((section) => {
      const updatedBody = section.body.map((item) => {
        if (item.key === "currentAddress" && item.populators && Array.isArray(item.populators.inputs)) {
          const updatedInputs = item.populators.inputs.map((input) => ({
            ...input,
            isDisabled: shouldDisable,
          }));
          return {
            ...item,
            populators: {
              ...item.populators,
              inputs: updatedInputs,
            },
          };
        }
        return item;
      });

      return {
        ...section,
        body: updatedBody,
      };
    });
  }, [config, formdata?.isBothAddressSame?.code]);

  return (
    <div className="user-address">
      <FormComposerV2
        key={formdata?.currentAddress?.temp}
        config={modifiedConfig}
        t={t}
        defaultValues={formdata}
        onSubmit={(props) => {
          onSelect(formdata);
        }}
        noBoxShadow
        inline
        label={"CS_COMMON_CONTINUE"}
        labelBold={true}
        onSecondayActionClick={() => {}}
        cardStyle={{ padding: 40, flexDirection: "column" }}
        submitInForm
        onFormValueChange={onFormValueChange}
        isDisabled={isDisabled}
        className={"user-address-form"}
        // defaultValues={params?.address || {}}
      ></FormComposerV2>
    </div>
  );
};

export default SelectUserAddress;
