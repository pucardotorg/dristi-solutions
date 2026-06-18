# Code Documentation

This document explains the functionality, purpose, and usage of the provided code. It manages submissions and pending tasks in a legal case management system.

---

### `getOrderTypes`

#### Purpose:

This function takes application Type and returns respective orderType in case of "accept" or "reject"

#### Code:

```javascript
const getOrderTypes = (applicationType, type) => {
  switch (applicationType) {
    case "RE_SCHEDULE":
      return type === "reject" ? "REJECTION_RESCHEDULE_REQUEST" : "INITIATING_RESCHEDULING_OF_HEARING_DATE";
    case "WITHDRAWAL":
      return "WITHDRAWAL";
    case "TRANSFER":
      return "CASE_TRANSFER";
    case "SETTLEMENT":
      return "SETTLEMENT";
    case "BAIL_BOND":
      return "BAIL";
    case "SURETY":
      return "BAIL";
    case "EXTENSION_SUBMISSION_DEADLINE":
      return "EXTENSION_OF_DOCUMENT_SUBMISSION_DATE";
    case "CHECKOUT_REQUEST":
      return type === "reject" ? "CHECKOUT_REJECT" : "CHECKOUT_ACCEPTANCE";
    default:
      return type === "reject" ? "REJECT_VOLUNTARY_SUBMISSIONS" : "APPROVE_VOLUNTARY_SUBMISSIONS";
  }
};
```
