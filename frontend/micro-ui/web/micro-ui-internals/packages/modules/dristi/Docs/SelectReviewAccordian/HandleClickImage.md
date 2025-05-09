# Code Documentation

This document explains the functionality, purpose, and usage of the provided code.

---

### `handleClickImage`

#### Purpose:

scrutinyMessage.imagePopupInfo stores which particular document or image has been opened in full screen.
Once closed, scrutinyMessage.imagePopupInfo is set to null

#### Code:

```javascript
const handleClickImage = (
  e,
  configKey,
  name,
  index = null,
  fieldName,
  data,
  inputlist = [],
  dataError = {},
  disableScrutiny = false,
  enableScrutinyField = false
) => {
  setValue(
    "scrutinyMessage",
    {
      name,
      index,
      fieldName,
      configKey,
      data,
      inputlist,
      dataError,
      disableScrutiny,
      enableScrutinyField,
    },
    "imagePopupInfo"
  );
};
```
