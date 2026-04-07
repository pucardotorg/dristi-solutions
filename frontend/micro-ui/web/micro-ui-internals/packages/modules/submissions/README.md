# Submissions Module

## 📌 Overview

The **Submissions** module (`@egovernments/digit-ui-module-submissions`) manages all court submission workflows — application creation, bail bond generation, plea submissions, evidence submission, document digitization, and the associated e-signature flows. It also provides unauthenticated (open API) pages for bail bond signing, witness deposition signing, and digitized document signing via SMS-based access.

**Business Purpose:**
- Create, search, and manage court applications/submissions
- Generate bail bond documents with surety details
- Submit plea documents with hearing integration
- Manage evidence creation, search, and updates
- Handle bail bond e-signature flow (authenticated + unauthenticated via SMS)
- Handle witness deposition e-signature flow (unauthenticated via SMS)
- Handle digitized document e-signature flow (unauthenticated via SMS)
- Submit documents with upload functionality
- Manage digitalized document lifecycle (create, update, search)

**Where it is used:**
- Rendered under `/{contextPath}/employee/submissions/*`
- Globally registered components: `BailBondSignaturePage`, `BailBondLoginPage`, `BailBondLinkExpiredPage`, `WitnessDepositionLoginPage`, `WitnessDepositionSignaturePage`, `DigitizedDocumentLoginPage`, `DigitizedDocumentsSignaturePage`, `submissionService`
- These components are consumed by the dristi module's citizen routes for open (unauthenticated) access

---

## 🏗 Architecture

### Entry Point
- `src/Module.js` — Exports `SubmissionsModule` (main component) and `initSubmissionsComponents`

### Folder Structure
```
src/
├── Module.js                          # Entry point, 10 component registrations
├── components/
│   ├── BailBondReviewModal.js         # Bail bond review modal
│   ├── BailEsignModal.js             # Bail bond e-sign modal
│   ├── BreadCrumbSubmissions.js       # Custom breadcrumb for submissions
│   ├── GenericNumberInputModal.js     # Number input modal
│   ├── GenericSuccessLinkModal.js     # Success with link modal
│   ├── GenericUploadSignatureModal.js # Upload signature modal (key component)
│   ├── PaymentModal.js                # Payment modal
│   ├── PreviewPdfModal.js             # PDF preview modal
│   ├── ReviewDocumentSubmissionModal.js # Document submission review
│   ├── ReviewSubmissionModal.js       # Submission review modal
│   ├── SubmissionDocumentEsign.js     # Document e-sign component
│   ├── SubmissionDocumentSuccessModal.js # Document submission success
│   ├── SubmissionSignatureModal.js    # Submission signature modal
│   ├── SubmissionsCard.js             # Dashboard card
│   ├── SuccessBannerModal.js          # Success banner
│   └── SuccessModal.js                # Success modal
├── configs/
│   ├── UICustomizations.js            # UI customization overrides
│   ├── generateBailBondConfig.js      # Bail bond form configuration
│   ├── pleaSubmissionConfig.js        # Plea submission form config
│   ├── submissionsCreateConfig.js     # Submission creation form config
│   ├── submissionsSearchConfig.js     # Submission search config
│   └── submitDocumentConfig.js        # Document submission form config
├── hooks/
│   ├── index.js                       # Hook aggregator
│   ├── services/
│   │   ├── index.js                   # submissionService (20+ methods)
│   │   ├── Urls.js                    # API endpoint URLs
│   │   ├── searchSubmissions.js       # Submission search service
│   │   └── searchTestResultData.js
│   ├── submissions/
│   │   ├── useESignOpenApi.js         # Open API e-sign hook
│   │   ├── useOpenApiSearchBailBond.js # Open API bail bond search
│   │   ├── useOpenApiSearchDigitizedDocuments.js # Open API digitized doc search
│   │   ├── useOpenApiSearchWitnessDeposition.js # Open API witness dep search
│   │   ├── useSearchBailBondService.js # Bail bond search hook
│   │   ├── useSearchDigitalization.js # Digitalization search hook
│   │   ├── useSearchEvidenceService.js # Evidence search hook
│   │   ├── useSearchPendingTask.js    # Pending task search hook
│   │   └── useSearchSubmissionService.js # Submission search hook
│   └── useIndividualView.js
├── pages/
│   └── employee/
│       ├── index.js                   # Route definitions
│       ├── SubmissionsCreate.js        # Create submission page
│       ├── SubmissionsResponse.js      # Submission action response
│       ├── SubmissionsSearch.js        # Submission search page
│       ├── SubmissionDocuments.js      # Upload submission documents
│       ├── GenerateBailBondV2.js       # Bail bond generation (V2)
│       ├── PleaSubmission.js           # Plea submission page
│       ├── BailBondLoginPage.js        # Bail bond SMS login (unauthenticated)
│       ├── BailBondSignaturePage.js    # Bail bond e-sign (unauthenticated)
│       ├── BailBondExpirePage.js       # Bail bond link expired page
│       ├── WitnessDepositionLoginPage.js # Witness dep SMS login
│       ├── WitnessDepositionSignaturePage.js # Witness dep e-sign
│       ├── DigitizedDocumentLoginPage.js # Digitized doc SMS login
│       └── DigitizedDocumentsSignaturePage.js # Digitized doc e-sign
└── utils/
    ├── index.js                       # Hook override & config utilities
    └── ... (8 more utility files)
```

### Key Design Patterns
- **Open API pattern for e-signatures:** Three parallel e-sign flows (bail bond, witness deposition, digitized documents) use `/openapi/*` endpoints for unauthenticated access via SMS
- **Login → Sign two-step flow:** Each e-sign flow has a login page (mobile number + OTP for verification) and a sign page (document review + signature upload)
- **Config-driven form rendering:** Bail bond, plea, and submission forms use configuration objects
- **Service layer centralization:** `submissionService` aggregates all API calls (applications, evidence, bail bonds, digitalization, open API)

---

## 🔀 Routing

All routes in `src/pages/employee/index.js` use `PrivateRoute`.

| Route Path | Component | Description |
|---|---|---|
| `{path}/submissions-response` | `SubmissionsResponse` | Submission action response |
| `{path}/submissions-create` | `SubmissionsCreate` | Create a new submission |
| `{path}/submit-document` | `SubmissionDocuments` | Upload submission documents |
| `{path}/submissions-search` | `SubmissionsSearch` | Search submissions |
| `{path}/bail-bond` | `GenerateBailBondV2` | Generate bail bond |
| `{path}/record-plea` | `PleaSubmission` | Record a plea |

### Open Routes (unauthenticated, registered globally)
These components are registered via `Digit.ComponentRegistryService` and consumed by the dristi module's citizen router:

| Component | Citizen Route | Description |
|---|---|---|
| `BailBondLoginPage` | `/citizen/dristi/home/bail-bond-login` | Bail bond SMS verification |
| `BailBondSignaturePage` | `/citizen/dristi/home/bail-bond-sign` | Bail bond e-sign page |
| `BailBondLinkExpiredPage` | `/citizen/dristi/home/access-expired` | Link expiration page |
| `WitnessDepositionLoginPage` | `/citizen/dristi/home/evidence-login` | Witness dep SMS verification |
| `WitnessDepositionSignaturePage` | `/citizen/dristi/home/evidence-sign` | Witness dep e-sign page |
| `DigitizedDocumentLoginPage` | `/citizen/dristi/home/digitalized-document-login` | Digitized doc SMS verification |
| `DigitizedDocumentsSignaturePage` | `/citizen/dristi/home/digitalized-document-sign` | Digitized doc e-sign page |

### Route Guards
- Employee routes use `PrivateRoute` with authentication
- Open routes (bail bond, witness dep, digitized doc) are public and accessible via SMS links
- `BreadCrumbsParamsDataContext` from Core provides case-aware breadcrumbs

---

## 🧠 State Management

### Redux Slices
No dedicated Redux slices. Relies on common store from Core.

### Global State Dependencies
- `Digit.Services.useStore` — Loads modules: `["submissions", "common", "workflow"]`
- `BreadCrumbsParamsDataContext` — Case navigation context from Core
- `Digit.UserService` — Authentication and role detection

### Local State Strategy
- Custom hooks for submission search, evidence search, bail bond search
- `useState` for modal states, form data, signature uploads
- `sessionStorage` for mobile number persistence in SMS flows

---

## 🌐 API Integrations

### submissionService (20+ methods)

**Application Management:**
| Method | Endpoint | Description |
|---|---|---|
| `createApplication` | `/application/v1/create` | Create submission/application |
| `updateApplication` | `/application/v1/update` | Update application |
| `searchApplication` | `/application/v1/search` | Search applications |
| `getPendingTaskService` | `/inbox/v2/_getFields` | Get pending task fields |

**Evidence Management:**
| Method | Endpoint |
|---|---|
| `searchEvidence` | `/evidence/v1/_search` |
| `createEvidence` | `/evidence/v1/_create` |
| `updateEvidence` | `/evidence/v1/_update` |

**Bail Bond Management:**
| Method | Endpoint |
|---|---|
| `createBailBond` | `/bail-bond/v1/_create` |
| `updateBailBond` | `/bail-bond/v1/_update` |
| `searchBailBond` | `/bail-bond/v1/_search` |

**Digitalization Management:**
| Method | Endpoint |
|---|---|
| `createDigitalization` | `/digitalized-documents/v1/_create` |
| `updateDigitalization` | `/digitalized-documents/v1/_update` |
| `searchDigitalization` | `/digitalized-documents/v1/_search` |

**Open API (Unauthenticated):**
| Method | Endpoint |
|---|---|
| `searchOpenApiBailBond` | `/openapi/v1/bail/search` |
| `updateOpenBailBond` | `/openapi/v1/updateBailBond` |
| `searchOpenApiWitnessDeposition` | `/openapi/v1/witness_deposition/search` |
| `updateOpenWitnessDeposition` | `/openapi/v1/witness_deposition/update` |
| `searchOpenApiDigitizedDocument` | `/openapi/v1/digitalized_document/search` |
| `updateOpenDigitizedDocument` | `/openapi/v1/digitalized_document/update` |

**Other:**
| Method | Endpoint |
|---|---|
| `customApiService` | Dynamic URL |
| `getPendingTask` | `/inbox/v2/_getFields` |

### Additional Endpoints Referenced (Urls.js)
| Endpoint | Usage |
|---|---|
| `/egov-pdf/application` | Submission preview PDF |
| `/egov-pdf/bailBond` | Bail bond preview PDF |
| `/egov-pdf/digitisation` | Plea/digitalization preview PDF |
| `/task/v1/create` | Task creation |
| `/openapi/v1/landing_page/file` | File fetch by filestore (open API) |
| `/openapi/v1/file/upload` | File upload (open API) |

---

## 🧩 Key Components

### Container Components
- **`SubmissionsCreate`** — Multi-step submission creation form
- **`GenerateBailBondV2`** — Bail bond generation with surety details, documents, and preview
- **`PleaSubmission`** — Plea submission with hearing context
- **`SubmissionDocuments`** — Document upload and submission
- **`SubmissionsSearch`** — Submission search with filters

### Globally Registered Components (for unauthenticated flows)
- **`BailBondLoginPage`** — SMS-based login for bail bond signing
- **`BailBondSignaturePage`** — Bail bond document review and e-sign
- **`BailBondLinkExpiredPage`** — Link expiration notification
- **`WitnessDepositionLoginPage`** — SMS-based login for witness deposition
- **`WitnessDepositionSignaturePage`** — Witness deposition review and e-sign
- **`DigitizedDocumentLoginPage`** — SMS-based login for digitized document
- **`DigitizedDocumentsSignaturePage`** — Digitized document review and e-sign
- **`submissionService`** — Service object for external use

### Presentational Components
- **`SubmissionsCard`** — Dashboard card
- **`GenericUploadSignatureModal`** — Reusable signature upload modal (supports both authenticated and open API file upload)
- **`BailBondReviewModal`** — Bail bond review display
- **`BailEsignModal`** — Bail bond e-sign modal
- **`PreviewPdfModal`** — PDF preview component
- **`ReviewSubmissionModal`** — Submission review before submit
- **`PaymentModal`** — Payment processing modal
- **`SuccessModal` / `SuccessBannerModal`** — Success confirmation

---

## 🔄 Data Flow

```
Bail Bond Flow (Authenticated):
  Advocate/Clerk → GenerateBailBondV2
    → Fill surety details + upload documents
    → submissionService.createBailBond() → API: /bail-bond/v1/_create
    → PDF Preview → /egov-pdf/bailBond
    → E-sign → /e-sign-svc/v1/_esign
    → submissionService.updateBailBond() → API: /bail-bond/v1/_update
    → Success

Bail Bond Flow (Unauthenticated via SMS):
  Surety receives SMS link → BailBondLoginPage
    → Mobile number verification
    → submissionService.searchOpenApiBailBond() → API: /openapi/v1/bail/search
    → BailBondSignaturePage
    → Document review + signature upload (open API)
    → submissionService.updateOpenBailBond() → API: /openapi/v1/updateBailBond
    → E-sign → open API e-sign
    → Success

Application Submission Flow:
  User → SubmissionsCreate
    → submissionService.createApplication() → API: /application/v1/create
    → PDF Preview → /egov-pdf/application
    → E-sign → /e-sign-svc/v1/_esign
    → submissionService.updateApplication() → API: /application/v1/update
    → Pending task created → /analytics/pending_task/v1/create
    → Success
```

---

## 🔗 Dependencies

### Internal Module Dependencies
- `@egovernments/digit-ui-module-core` — `BreadCrumbsParamsDataContext`
- Components from this module are consumed by `@egovernments/digit-ui-module-dristi` (citizen routes) and `@egovernments/digit-ui-module-home` (signing modals)

### External Library Dependencies
| Library | Version | Purpose |
|---|---|---|
| `react` | 17.0.2 | UI framework |
| `react-router-dom` | 5.3.0 | Routing |
| `react-hook-form` | 6.15.8 | Form management |
| `react-i18next` | 11.16.2 | i18n |
| `react-query` | 3.6.1 | Data fetching |
| `react-date-range` | ^1.4.0 | Date range picker |
| `@egovernments/digit-ui-react-components` | 1.8.2-beta.9 | Shared UI |
| `@egovernments/digit-ui-components` | 0.0.2-beta.1 | Design system |
| `@egovernments/digit-ui-module-core` | 1.8.1-beta.6 | Core module |

---

## ⚙️ Configuration

- **`configs/generateBailBondConfig.js`** — Bail bond form configuration (surety fields, document requirements)
- **`configs/pleaSubmissionConfig.js`** — Plea submission form config
- **`configs/submissionsCreateConfig.js`** — Submission creation form config
- **`configs/submissionsSearchConfig.js`** — Submission search field config
- **`configs/submitDocumentConfig.js`** — Document submission form config
- **`configs/UICustomizations.js`** — UI customization overrides
- **Module codes loaded:** `["submissions", "common", "workflow"]`

---

## 🧪 Testing

- No explicit test files found in the module.
- **Missing test areas:** Bail bond creation and signing flows (both authenticated and unauthenticated), witness deposition e-sign flow, digitized document flow, evidence CRUD operations, plea submission, open API endpoints, file upload via open API.

---

## 🚨 Known Risks / Observations

1. **Three parallel e-sign flows with high code similarity:** `BailBondSignaturePage`, `WitnessDepositionSignaturePage`, and `DigitizedDocumentsSignaturePage` likely share significant logic — candidate for abstraction into a generic e-sign flow component.
2. **Three parallel login pages with similar logic:** `BailBondLoginPage`, `WitnessDepositionLoginPage`, `DigitizedDocumentLoginPage` — another candidate for a generic login component.
3. **Open API security concern:** Unauthenticated endpoints (`/openapi/*`) are accessible without tokens. The security relies on SMS-based token/link verification — ensure these endpoints have proper access controls.
4. **`useCache: true` on `searchApplication`:** Using cache on application search may return stale data during active submission workflows.
5. **`userService: false` on evidence and bail bond endpoints:** These services bypass user token — ensure backend validates requests appropriately.
6. **9 utility files in utils/:** Relatively high for a module of this size — some may contain duplicated logic from other modules.
7. **PDF generation dependency:** Multiple PDF preview endpoints (`/egov-pdf/application`, `/egov-pdf/bailBond`, `/egov-pdf/digitisation`) depend on an external PDF service — failure in PDF generation blocks e-sign flows.
