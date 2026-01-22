# Code Documentation

This document explains the functionality, purpose, and usage of the provided code.

---

### `ViewCaseFile`

#### Purpose:

Review case Page for FSO to mark errors. It mainly contains

- [`ScrutinyErrors`](./ScrutinyErrors.md) - All the section wise marked error by FSO
- [`TotalErrors`](./TotalErrors.md) - Gives total errors marked by FSO
- [`formconfig`](./formConfig.md) - formconfig for FormComposerV2
- [`MergeErrors`](./MergeErrors.md) - recurssiuve function being used to merge errors and remove previously marked errors on nth round of scrutiny (n>1)
