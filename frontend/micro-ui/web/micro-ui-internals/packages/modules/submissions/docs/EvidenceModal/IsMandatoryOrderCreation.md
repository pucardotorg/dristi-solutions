# Code Documentation

This document explains the functionality, purpose, and usage of the provided code. It manages submissions and pending tasks in a legal case management system.

---

### `isMandatoryOrderCreation`

#### Purpose:

Whether the checkbox "Generate Order" while accepting or rejecting submission is default enabled or not.
Basically the schenarios where application can not be accepted or rejected without creating respective order

#### Code:

```javascript
const isMandatoryOrderCreation = useMemo(() => {
  const applicationType = documentSubmission?.[0]?.applicationList?.applicationType;
  const type = showConfirmationModal?.type;
  const acceptedApplicationTypes = [
    "RE_SCHEDULE",
    "WITHDRAWAL",
    "TRANSFER",
    "SETTLEMENT",
    "BAIL_BOND",
    "SURETY",
    "EXTENSION_SUBMISSION_DEADLINE",
    "CHECKOUT_REQUEST",
  ];
  if (type === "reject") {
    return false;
  } else {
    return acceptedApplicationTypes.includes(applicationType);
  }
}, [documentSubmission, showConfirmationModal?.type]);
```
