import { FormComposerV2 } from "@egovernments/digit-ui-module-core";
import React, { useMemo, useState } from "react";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import isEqual from "lodash/isEqual";
import {
  createRegistrationPatternValidationOnChange,
  syncAddressFormDataIfChanged,
  useUserRegistrationSessionRestore,
} from "./shared/registrationFlowShared";

const SelectUserAddress = ({ config, onSelect, t, params, pathOnRefresh }) => {
  const history = useHistory();
  const [isDisabled, setIsDisabled] = useState(false);
  const [formdata, setformData] = useState(params?.address || {});

  const onFormValueChange = createRegistrationPatternValidationOnChange(config, setIsDisabled, {
    onAfterValidate: (setValue, formData) => {
      if (formData?.isBothAddressSame?.code === "YES") {
        const existing = formData?.currentAddress;
        const target = { ...formData?.addressDetails, temp: 1 };
        if (!isEqual(existing, target)) {
          setValue("currentAddress", target);
        }
      } else if (formData?.isBothAddressSame?.code === "NO" && formData?.currentAddress?.temp) {
        setValue("currentAddress", undefined);
      }
      syncAddressFormDataIfChanged(formdata, formData, setformData);
    },
  });

  useUserRegistrationSessionRestore({
    params,
    history,
    pathOnRefresh,
    shouldRestore: (p) => !p?.name,
    effectDeps: [params?.address],
  });

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
