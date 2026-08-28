# Code Documentation

This document explains the functionality, purpose, and usage of the provided code.

---

### `mergeErrors`

#### Purpose:

- This functions gets formdata (which has scrutiny Errors), recursively checks with previous Scrutiny Errors, which are defaultScrutinyErrors and keeps only errors which are marked in current round of scrutiny, replaces all other errors with "" (which are previously marked errors)

- Basically, this functions overrides old errors with new ones and keeps only those errors which are marked in current scrutiny round
- This function is used to get `newScrutinyData`

#### Code:

```javascript
function mergeErrors(formdata, defaultScrutinyErrors) {
  // Helper function to handle the comparison and merging of objects
  function compareAndReplace(formDataNode, defaultNode) {
    // Iterate over each key in the formdata node
    for (let key in formDataNode) {
      // Check if the key exists in both formdata and defaultScrutinyErrors
      if (defaultNode?.hasOwnProperty(key)) {
        // If the value is an object, recursively compare and replace
        if (typeof formDataNode[key] === "object" && formDataNode[key] !== null) {
          compareAndReplace(formDataNode[key], defaultNode[key]);
        } else {
          // If the value is a string (for FSOError and scrutinyMessage)
          if (key === "FSOError" || key === "scrutinyMessage") {
            if (formDataNode[key] === defaultNode[key] && !formDataNode?.markError) {
              formDataNode[key] = "";
            } else {
              formDataNode[key] = formDataNode[key];
            }
            formDataNode["markError"] = false;
          }
        }
      }
    }
  }
  // Clone the formdata object to avoid modifying the original one
  const result = JSON.parse(JSON.stringify(formdata));
  // Start the comparison and replacement
  compareAndReplace(result.data, defaultScrutinyErrors.data);
  return result;
}
```
