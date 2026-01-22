# Code Documentation

This document explains the functionality, purpose, and usage of the provided code.

---

### `scrutinyErrors`

#### Purpose:

Gives total errors throughtout entire page, along with input errors and section errors

Send to judge button will be disabled if totalErrors?.total > 0

#### Code:

```javascript
const totalErrors = useMemo(() => {
  let total = 0;
  let sectionErrors = 0;
  let inputErrors = 0;

  for (const key in scrutinyErrors) {
    total += scrutinyErrors[key].total || 0;
    sectionErrors += scrutinyErrors[key].sectionErrors || 0;
    inputErrors += scrutinyErrors[key].inputErrors || 0;
  }

  return {
    total,
    sectionErrors,
    inputErrors,
  };
}, [scrutinyErrors]);
```

#### Sample obj

```javascript
cosnt totalErrors ={
    "total": 2,
    "sectionErrors": 1,
    "inputErrors": 1
}
```
