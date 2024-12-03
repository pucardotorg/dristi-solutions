# Code Documentation

This document explains the functionality, purpose, and usage of the provided code.

---

### `scrutinyErrors`

#### Purpose:

Gives scrutiny errors accross all the accordions on viewCaseFile page, along with input errors and section errors

#### Code:

```javascript
const scrutinyErrors = useMemo(() => {
  const errorCount = {};
  for (const key in newScrutinyData?.data) {
    if (typeof newScrutinyData.data[key] === "object" && newScrutinyData.data[key] !== null) {
      if (!errorCount[key]) {
        errorCount[key] = { total: 0, sectionErrors: 0, inputErrors: 0 };
      }
      const temp = countSectionErrors(newScrutinyData.data[key]);
      errorCount[key] = {
        total: errorCount[key].total + temp.total,
        sectionErrors: errorCount[key].sectionErrors + temp.sectionErrors,
        inputErrors: errorCount[key].inputErrors + temp.inputErrors,
      };
    }
  }
  return errorCount;
}, [newScrutinyData]);
```

#### Sample obj

```javascript
cosnt scrutinyErrors = {
  "litigentDetails": {
    "total": 1,
    "sectionErrors": 0,
    "inputErrors": 1
  },
  "caseSpecificDetails": {
    "total": 1,
    "sectionErrors": 1,
    "inputErrors": 0
  },
  "scrutinyMessage": {
    "total": 0,
    "sectionErrors": 0,
    "inputErrors": 0
  }
}
```
