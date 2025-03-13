# Code Documentation

This document explains the functionality, purpose, and usage of the provided code.

---

### `extractValue`

#### Purpose:

This function gets value of json nested object. Nesting is represented by ".". The below example will showcase it better

```javascript
const data = {
  swornStatement: {
    document: [
      {
        fileName: "CS_SWORN_STATEMENT_HEADER",
        fileStore: "a66cd69a-9c62-4096-83d4-11afdb37e6c1",
        documentName: "js.jpg",
        documentType: "case.affidavit.223bnss",
      },
    ],
  },
  memorandumOfComplaint: {
    text: "test Complaint",
  },
  SelectUploadDocWithName: null,
  prayerAndSwornStatementType: {
    code: "NO",
    name: "NO",
  },
};
extractValue(data, "memorandumOfComplaint.text");
```

This will return "test Complaint"

#### Code:

```javascript
const extractValue = (data, key) => {
  if (!key?.includes(".")) {
    return data[key];
  }
  const keyParts = key.split(".");
  let value = data;
  keyParts.forEach((part) => {
    if (value && value.hasOwnProperty(part)) {
      value = value[part];
    } else {
      value = undefined;
    }
  });
  return value;
};
```
