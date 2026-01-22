# Code Documentation

This document explains the functionality, purpose, and usage of the provided code.

---

### `CustomReviewCardRow`

#### Purpose:

It calles [`handleClickImage`](./../SelectReviewAccordian/HandleClickImage.md) function and openes up the document/image in full screen mode
example - When clicked upon bounced cheque document, following parameters are passed down inside handleImageClick function:

- configKey -> configkey of [`SelectReviewAccordion`](./../SelectReviewAccordian/SelectReviewAccordion.md)
- name -> Name of that particular section or [`CustomReviewCard`](./../CustomReviewCard/CustomReviewCard.md)
- dataIndex -> which index this document belongs to (sometimes we can have multiple cheques)
- data -> the fileStoreId, fileName of the document which is opened in fullscreen mode
- inputlist -> the json path to that particular field in the formdata

```json
{
  "configKey": "caseSpecificDetails",
  "name": "chequeDetails",
  "dataIndex": 0,
  "fieldName": "bouncedChequeFileUpload.document",
  "data": {
    "fileName": "CS_BOUNCED_CHEQUE",
    "fileStore": "761c9b7d-216f-4cf5-b516-97fcafaa54f4",
    "documentName": "js.jpg",
    "documentType": "case.cheque"
  },
  "inputlist": ["bouncedChequeFileUpload.document"]
}
```

#### Code:

```javascript
const handleImageClick = useCallback(
  (configKey, name, dataIndex, fieldName, data, inputlist, dataError) => {
    if (isScrutiny && data) {
      handleClickImage(null, configKey, name, dataIndex, fieldName, data, inputlist, dataError, disableScrutiny, enableScrutinyField);
    }
    return null;
  },
  [handleClickImage, isScrutiny]
);
```
