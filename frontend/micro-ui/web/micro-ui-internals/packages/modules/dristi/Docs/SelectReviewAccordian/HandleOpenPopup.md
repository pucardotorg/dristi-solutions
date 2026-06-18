# Code Documentation

This document explains the functionality, purpose, and usage of the provided code.

---

### `handleOpenPopup`

#### Purpose:

scrutinyMessage.popupInfo stores information on exactly which popup is opened up. whether it's section level popup or input level popup, that too in which exact selectReviewAccordion component
Once the popup to add error is closed, scrutinyMessage.popupInfo is set to null

#### Code:

```javascript
const handleOpenPopup = (e, configKey, name, index = null, fieldName, inputlist = [], fileName = null) => {
  setValue(
    "scrutinyMessage",
    {
      name,
      index,
      fieldName,
      configKey,
      inputlist,
      fileName,
    },
    "popupInfo"
  );
};
```
