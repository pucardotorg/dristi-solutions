# Code Documentation

This document explains the functionality, purpose, and usage of the provided code. It manages submissions and pending tasks in a legal case management system.

---

### `handleDeleteApplication`

#### Purpose:

To cancel or delete the application -> Done by party which has submitted the application
updates the application with Delete action

#### Code:

```javascript
const handleDeleteApplication = async () => {
  await mutation.mutate(
    {
      url: Urls.dristi.submissionsUpdate,
      params: {},
      body: { application: deleteApplicationPayload },
      config: {
        enable: true,
      },
    },
    {
      onSuccess,
      onError,
    }
  );
};
```
