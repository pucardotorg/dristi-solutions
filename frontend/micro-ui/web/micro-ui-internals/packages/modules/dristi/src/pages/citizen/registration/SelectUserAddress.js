import { FormComposerV2 } from "@egovernments/digit-ui-react-components";
import React, { useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import isEqual from "lodash/isEqual";

const SelectUserAddress = ({ config, onSelect, t, params, pathOnRefresh }) => {
  const history = useHistory();
  const [isDisabled, setIsDisabled] = useState(false);
  const [formdata, setformData] = useState({});

  const onFormValueChange = (setValue, formData, formState) => {
    if (formData?.isBothAddressSame?.code === "YES" && !formData?.currentAddress) {
      setValue("currentAddress", { ...formData?.addressDetails, temp: 1 });
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
  if (!params?.name) {
    history.push(pathOnRefresh);
  }

  useEffect(() => {
    setformData(params?.address);
  }, [params]);

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
