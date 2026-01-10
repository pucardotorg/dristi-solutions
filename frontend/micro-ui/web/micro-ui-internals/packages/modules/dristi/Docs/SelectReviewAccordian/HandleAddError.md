# Code Documentation

This document explains the functionality, purpose, and usage of the provided code.

---

### `handleAddError`

#### Purpose:

- When FSO wants to add any specific comment, then we set `FSOError` to `trimmedError` or `scrutinyMessage` to `trimmedError` depending on whether that is input error or sectionwise error
- `scrutinyMessage` denotes Sectionwise Error
- `FSOError` denotes input error
- `dependentFields` is used to mark all the dependable fields, like how we want to mark all the dates if one of the dates is marked

#### Code:

```javascript
const handleAddError = (popupInfoData, message, type) => {
  const trimmedError = message ? message : scrutinyError.trim();

  const { name, configKey, index, fieldName, inputlist, fileName } = popupInfoData ? popupInfoData : popupInfo;
  let fieldObj = { [fieldName]: { [type ? type : "FSOError"]: trimmedError, ...(isPrevScrutiny && { markError: true }) } };
  inputlist.forEach((key) => {
    fieldObj[key] = { [type ? type : "FSOError"]: trimmedError, fileName, ...(isPrevScrutiny && { markError: true }) };
  });
  let currentMessage =
    formData && formData[configKey] && formData[config.key]?.[name]
      ? { ...formData[config.key]?.[name] }
      : {
          scrutinyMessage: "",
          form: inputs.find((item) => item.name === name)?.data?.map(() => ({})),
        };

  if (currentMessage?.form) {
    if (index == null) {
      currentMessage.scrutinyMessage = { [type ? type : "FSOError"]: trimmedError, fileName, ...(isPrevScrutiny && { markError: true }) };
    } else {
      currentMessage.form[index] = {
        ...(currentMessage?.form?.[index] || {}),
        ...fieldObj,
      };
    }
    setValue(config.key, currentMessage, name);

    const dependentFields = inputs?.find((item) => item.name === name)?.config?.find((f) => f.value === fieldName)?.dependentFields || [];
    for (const { configKey, page, field } of dependentFields) {
      const scrutinyMessage = {
        ...(get(formData, [configKey, page]) || {
          scrutinyMessage: "",
          form: inputs.find((item) => item.name === name)?.data?.map(() => ({})),
        }),
      };
      const fieldInputData = config.populators.inputs.find((input) => input.name === page)?.data?.[0]?.data?.[field];
      if (fieldInputData) {
        set(
          scrutinyMessage,
          ["form", index, field].filter((x) => x != null),
          {
            [type ? type : "FSOError"]: trimmedError,
          }
        );
        setValue(configKey, scrutinyMessage, page);
      }
    }

    setValue("scrutinyMessage", { popupInfo: null, imagePopupInfo: null }, ["popupInfo", "imagePopupInfo"]);
    setScrutinyError("");
    setSystemError("");
  }
};
```
