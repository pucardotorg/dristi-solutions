# Code Documentation

This document explains the functionality, purpose, and usage of the provided code. It manages submissions and pending tasks in a legal case management system.

---

### `actionSaveOnSubmit`

#### Purpose:

HandleClick Function on secondary button of `EvidenceModal` - [`actionCancelLabel`](./ActionCancelLabel.md)

- If it's "Reject", the confirmation modal to reject submission will open up
- If the button is cancel application, it will update submission with "Delete" Action

#### Code:

```javascript
const actionCancelOnSubmit = async () => {
  if (userType === "employee") {
    setShowConfirmationModal({ type: "reject" });
  } else {
    try {
      await handleDeleteApplication();
      setShow(false);
      counterUpdate();
    } catch (error) {}
  }
};
```
