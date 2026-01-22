# Code Documentation

This document explains the functionality, purpose, and usage of the provided code. It manages submissions and pending tasks in a legal case management system.

---

### Extension of Submission Deadline

- If we have both orderNumber and isExtension in query params while landing on the createSubmission Page, then it's considered as application for extension of submission deadline. We fill out original submission date and applicationType accordingly.
- First we fetch all the orders have orderType `EXTENSION_OF_DOCUMENT_SUBMISSION_DATE` and status as `Approved` along with linkedorderNumber as the orderNumber of the originial order of mandatory submission
- If we get latest Extension of submission date order with approved status, that will give up the latest or updated deadline for the document submission