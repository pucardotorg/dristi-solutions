# DRISTI Module

## 📌 Overview

The **DRISTI** module (`@egovernments/digit-ui-module-dristi`) is the **largest and most central** module in the platform. It handles the core judicial case lifecycle — user registration (advocate/litigant/clerk), case filing, case admission/scrutiny, case viewing, evidence management, hearing management, order management, payment processing, e-signing, and document workflows. It also serves as a **shared component library** for other modules.

**Business Purpose:**
- User registration and identity verification (Aadhaar, ID proof)
- Case filing (e-filing) with multi-step wizard
- Case scrutiny and admission workflows for judges/court clerks
- Viewing admitted cases with tabbed interfaces (Overview, Orders, Submissions, Evidence, Hearings, History)
- Evidence creation, updates, and digitized document management
- Payment calculation and e-Treasury integration
- E-sign integration for documents
- Advocate office management

**Where it is used:**
- Rendered under `/{contextPath}/citizen/dristi/*` and `/{contextPath}/employee/dristi/*`
- Over 80 components are globally registered and consumed by other modules (orders, submissions, hearings, home)

---

## 🏗 Architecture

### Entry Point
- `src/Module.js` — Exports `DRISTIModule` (main component) and `initDRISTIComponents` (registers 80+ components globally)

### Folder Structure
```
src/
├── Module.js                          # Entry point, 80+ component registrations
├── contants.js                        # Constants (minimal)
├── Utils/                             # Utility functions (9 files)
│   ├── index.js                       # extractFeeMedium, getTaskType, combineMultipleFiles, getFilingType
│   ├── caseWorkflow.js                # Case workflow state machine
│   ├── downloadPdfFromFile.js         # PDF download utility
│   └── ... (6 more utility files)
├── components/                        # 127 files — UI components
│   ├── AddressComponent.js            # Address form
│   ├── AdhaarInput.js                 # Aadhaar number input
│   ├── BreadCrumb.js                  # Custom breadcrumb
│   ├── Button.js                      # Custom button
│   ├── CommentComponent.js            # Comments
│   ├── CustomCalendar.js / CustomCalendarV2.js  # Calendar components
│   ├── CustomRadioCard.js             # Radio card selector
│   ├── Modal.js                       # Custom modal
│   ├── MultiUploadWrapper.js          # Multi-file upload
│   ├── ScrutinyInfo.js                # Scrutiny information display
│   ├── SearchableDropdown.js          # Searchable dropdown
│   ├── SelectCustomDragDrop.js        # Drag-and-drop file upload
│   ├── Toast/useToast.js              # Toast notification context
│   ├── UploadSignatureModal.js        # Signature upload modal
│   ├── VerificationComponent.js       # Identity verification
│   ├── WorkflowTimeline.js            # Workflow timeline display
│   ├── SuretyComponent.js             # Surety/bail surety form
│   ├── CourierService.js              # Courier service integration
│   ├── EmployeeProfileEdit/           # Profile editing
│   └── ... (100+ more components)
├── configs/
│   ├── UICustomizations.js            # UI customization overrides
│   └── ... (2 more config files)
├── hooks/                             # 44 files — custom hooks
│   ├── index.js                       # Hook aggregator with 30+ hook exports
│   └── dristi/
│       ├── useSearchCaseService.js     # Case search
│       ├── usePaymentCalculator.js     # Payment calculation
│       ├── useGetEvidence.js           # Evidence fetching
│       ├── useGetOrders.js             # Orders fetching
│       ├── useCreateHearings.js        # Hearing creation
│       ├── useBillSearch.js            # Bill search
│       ├── useEtreasuryCreateDemand.js # eTreasury demand creation
│       ├── useGetOCRData.js            # OCR data extraction
│       ├── useJudgeAvailabilityDates.js # Judge availability
│       ├── useSurveyManager.js         # Inportal survey management
│       └── ... (20+ more hooks)
├── icons/                             # SVG icon components
├── images/                            # Image assets
├── pages/
│   ├── citizen/                       # Citizen-facing pages
│   │   ├── index.js                   # Citizen router (30+ routes)
│   │   ├── Home/                      # Citizen home
│   │   │   ├── LandingPage.js
│   │   │   └── ManageOffice.js
│   │   ├── FileCase/                  # Case filing wizard
│   │   ├── Login/                     # Citizen login
│   │   ├── registration/             # User registration
│   │   │   ├── config.js
│   │   │   ├── Response.js
│   │   │   ├── AdvocateClerkAdditionalDetail.js
│   │   │   ├── CustomEmailTextInput.js
│   │   │   └── SelectEmail.js
│   │   └── view-case/                 # Case viewing
│   └── employee/                      # Employee-facing pages
│       ├── index.js                   # Employee router
│       ├── home.js                    # Employee home
│       ├── ApplicationDetails.js      # Application detail view
│       ├── docViewerWrapper.js        # Document viewer
│       ├── Payment/
│       │   ├── EFilingPaymentResponse.js
│       │   ├── PaymentInbox.js
│       │   └── ViewPaymentDetails.js
│       ├── scrutiny/
│       │   └── ViewCaseFile.js        # Case scrutiny view
│       ├── admission/
│       │   └── CaseFileAdmission.js   # Case admission flow
│       └── AdmittedCases/
│           ├── AdmittedCaseV2.js       # Admitted case view (tabbed)
│           ├── ReviewLitigantDetails.js # Litigant review
│           └── MediationFormSignaturePage.js # Mediation e-sign
└── services/
    └── index.js                       # DRISTIService — 60+ API methods
```

### Key Design Patterns
- **Massive component registry:** 80+ components are globally registered, making this module a shared library
- **Service-oriented:** `DRISTIService` is the central API gateway with 60+ methods
- **Hook-rich:** 30+ custom hooks for data fetching, state management, and side effects
- **Config-driven forms:** Registration and filing use config-based form rendering
- **Context providers:** `ToastProvider` for notifications, breadcrumb context consumption
- **Workflow-driven state:** Case lifecycle follows workflow states (filing → scrutiny → admission → admitted)

---

## 🔀 Routing

### Employee Routes (`pages/employee/index.js`)

| Route Path | Component | Description |
|---|---|---|
| `{path}/registration-requests` | `Inbox` | Registration requests inbox |
| `{path}/registration-requests/details` | `ApplicationDetails` | Application detail view |
| `{path}/pending-payment-inbox/response` | `EFilingPaymentResponse` | Payment response page |
| `{path}/pending-payment-inbox/pending-payment-details` | `ViewPaymentDetails` | Payment details view |
| `{path}/cases` | `Home` | Cases home |
| `{path}/admission` | `CaseFileAdmission` | Case admission flow |
| `{path}/home/view-case` | `AdmittedCaseV2` | Admitted case viewer (tabbed) |
| `{path}/home/view-case/review-litigant-details` | `ReviewLitigantDetails` | Litigant details review |
| `{path}/case` | `ViewCaseFile` | Case scrutiny view |
| `{path}/home/edit-profile` | `EmployeeProfileEdit` | Profile editing |

### Citizen Routes (`pages/citizen/index.js`)

| Route Path | Component | Auth |
|---|---|---|
| `{path}/home` | `CitizenHome` | Private |
| `{path}/home/login` | `Login` | Public |
| `{path}/home/register` | `Login` (register mode) | Public |
| `{path}/home/registration/*` | `Registration` | Public |
| `{path}/home/file-case` | `FileCase` | Private |
| `{path}/home/view-case` | `ViewCase` | Private |
| `{path}/home/manage-office` | `ManageOffice` | Private |
| `{path}/home/edit-profile` | `SelectEmail` (profile mode) | Private |
| `{path}/home/application-details` | `ApplicationDetails` | Private |
| `{path}/home/bail-bond-sign` | `BailBondSignaturePage` | Public (open) |
| `{path}/home/bail-bond-login` | `BailBondLoginPage` | Public |
| `{path}/home/evidence-sign` | `WitnessDepositionSignaturePage` | Public (open) |
| `{path}/home/evidence-login` | `WitnessDepositionLoginPage` | Public |
| `{path}/home/digitalized-document-sign` | `DigitizedDocumentsSignaturePage` | Public (open) |
| `{path}/home/digitalized-document-login` | `DigitizedDocumentLoginPage` | Public |
| `{path}/home/mediation-form-sign` | `MediationFormSignaturePage` | Public (open) |
| `{path}/home/payment-login` | `PaymentLoginPage` | Public |
| `{path}/home/sms-payment` | `SmsPaymentPage` | Public (open) |
| `{path}/home/access-expired` | `BailBondLinkExpiredPage` | Public |
| `{path}/landing-page` | `LandingPage` | Public |
| `{path}/response` | `Response` | Private |

### Route Guards
- Unauthenticated users are redirected to `{path}/home/login`
- Authenticated users with completed registration are redirected away from login/registration routes
- E-sign callback routes (`bail-bond-sign`, `evidence-sign`, etc.) are "open routes" accessible without authentication
- Role-based redirection: Citizens → citizen home, Employees → employee home

---

## 🧠 State Management

### Redux Slices
No dedicated Redux slices in this module. Relies on the common store from Core.

### Global State Dependencies
- `Digit.Services.useStore` — Loads modules: `["DRISTI", "CASE", "ORDERS", "SUBMISSIONS", "HEARINGS"]`
- `Digit.SessionStorage.set("DRISTI_TENANTS", tenants)` — Stores tenant data
- `Digit.UserService` — Authentication and user type detection
- `BreadCrumbsParamsDataContext` — Consumed from Core for navigation breadcrumbs
- `AdvocateDataContext` — Consumed from Core for advocate data sharing

### Local State Strategy
- `react-hook-form` for multi-step registration and filing forms
- `useState` for modal states, loading states, and form step tracking
- `ToastProvider` context for toast notification state

---

## 🌐 API Integrations

### DRISTIService (60+ methods)

**Individual/User Management:**
| Method | Endpoint |
|---|---|
| `postIndividualService` | `/individual/v1/_create` |
| `updateIndividualUser` | `/individual/v1/_update` |
| `searchIndividualUser` | `/individual/v1/_search` |
| `deleteIndividualUser` | `/individual/v1/_delete` |
| `searchEmployeeUser` | `/egov-hrms/employees/_search` |
| `searchIndividualAdvocate` | `/advocate/v1/_search` |
| `updateAdvocateService` | `/advocate/v1/_update` |
| `searchAllAdvocates` | `/advocate/v1/status/_search` |

**Case Management:**
| Method | Endpoint |
|---|---|
| `caseCreateService` | `/case/v1/_create` |
| `caseUpdateService` | `/case/v1/_update` |
| `searchCaseService` | `/case/v1/_search` |
| `caseDetailSearchService` | `/case/v2/search/details` |
| `caseListSearchService` | `/case/v2/search/list` |
| `summaryCaseSearchService` | `/case/v2/search/summary` |
| `generateCasePdf` | `/case/v1/_generatePdf` |
| `downloadCaseBundle` | `/casemanagement/casemanager/case/v1/_buildcasebundle` |
| `addWitness` | `/case/v1/add/witness` |
| `addNewWitness` | `/case/v2/add/witness` |
| `addAddress` | `/case/v1/address/_add` |

**Evidence & Document Management:**
| Method | Endpoint |
|---|---|
| `createEvidence` | `/evidence/v1/_create` |
| `updateEvidence` | `/evidence/v1/_update` |
| `searchEvidence` | `/evidence/v1/_search` |
| `createDigitizedDocument` | `/digitalized-documents/v1/_create` |
| `updateDigitizedDocument` | `/digitalized-documents/v1/_update` |
| `searchDigitizedDocument` | `/digitalized-documents/v1/_search` |

**Hearing Management:**
| Method | Endpoint |
|---|---|
| `createHearings` | `/hearing/v1/create` |
| `searchHearings` | `/hearing/v1/search` |
| `startHearing` | `/hearing/v1/update` (action: START) |

**Order Management:**
| Method | Endpoint |
|---|---|
| `createOrder` | `/order/v1/create` |
| `searchOrders` | `/order/v1/search` |
| `searchBotdOrders` | `/order-management/v1/getBotdOrders` |
| `getDraftOrder` | `/order-management/v1/getDraftOrder` |

**Submissions:**
| Method | Endpoint |
|---|---|
| `searchSubmissions` | `/application/v1/search` |
| `updateSubmissions` | `/application/v1/update` |
| `createApplication` | `/application/v1/create` |

**Payment & Billing:**
| Method | Endpoint |
|---|---|
| `getPaymentBreakup` | `/payment-calculator/v1/case/fees/_calculate` |
| `getTreasuryPaymentBreakup` | `/etreasury/payment/v1/_getHeadBreakDown` |
| `callFetchBill` | `/billing-service/bill/v2/_fetchbill` |
| `callETreasury` | `/etreasury/payment/v1/_processChallan` |
| `createDemand` | `/billing-service/demand/_create` |
| `etreasuryCreateDemand` | `/etreasury/payment/v1/_createDemand` |

**E-Sign & OCR:**
| Method | Endpoint |
|---|---|
| `eSignService` | `/e-sign-svc/v1/_esign` |
| `sendDocuemntForOCR` | `/ocr-service/verify` |
| `getOCRData` | `/ocr-service/data` |

**Other:**
| Method | Endpoint |
|---|---|
| `setCaseLock` / `getCaseLockStatus` / `setCaseUnlock` | `/lock-svc/v1/_set` / `_get` / `_release` |
| `addADiaryEntry` / `aDiaryEntryUpdate` / `aDiaryEntrySearch` | `/ab-diary/case/diary/v1/*` |
| `getSummonsPaymentBreakup` | `/payment-calculator/v1/_calculate` |
| `judgeAvailabilityDates` | `/scheduler/judge/v1/_availability` |
| `createTaskManagementService` | `/task-management/v1/_create` |
| `createProfileRequest` / `processProfileRequest` | `/case/v2/profilerequest/*` |
| `addOfficeMember` / `searchOfficeMember` / `leaveOffice` | `/advocate-office-management/v1/*` |

---

## 🧩 Key Components

### Globally Registered Components (consumed by other modules)
- **`Modal`** — Custom modal component
- **`Button`** / **`CustomButton`** — Custom button with variants
- **`MultiUploadWrapper`** — Multi-file upload with preview
- **`SelectCustomDragDrop`** — Drag-and-drop file upload
- **`UploadSignatureModal`** — Signature upload modal
- **`CustomCalendar`** / **`CustomCalendarV2`** — Calendar date pickers
- **`SearchableDropdown`** — Searchable dropdown selector
- **`MultiSelectDropdown`** — Multi-select dropdown
- **`CommentComponent`** — Comment thread UI
- **`WorkflowTimeline`** — Workflow state timeline
- **`ScrutinyInfo`** — Scrutiny information panel
- **`DocViewerWrapper`** — Document viewer wrapper
- **`SuretyComponent`** — Surety/bail surety form component
- **`CustomCopyTextDiv`** — Copy-to-clipboard text component
- **`ShowAllTranscriptModal`** — Transcript display modal

### Page Components
- **`FileCase`** — Multi-step case filing wizard
- **`AdmittedCaseV2`** — Tabbed admitted case viewer
- **`CaseFileAdmission`** — Case admission workflow for judges
- **`ViewCaseFile`** — Case scrutiny view for court staff
- **`Registration`** — Multi-step user registration flow

---

## 🔄 Data Flow

```
Case Filing Flow:
  User → FileCase wizard (multi-step form)
    → DRISTIService.caseCreateService() → API: /case/v1/_create
    → Payment calculation → /payment-calculator/v1/case/fees/_calculate
    → E-sign → /e-sign-svc/v1/_esign
    → DRISTIService.caseUpdateService() → API: /case/v1/_update
    → Success → Home

Case Viewing Flow:
  User → AdmittedCaseV2
    → DRISTIService.searchCaseService() → API: /case/v1/_search
    → Tab-based data loading (Orders, Submissions, Evidence, Hearings)
    → Each tab triggers respective search API calls
```

---

## 🔗 Dependencies

### Internal Module Dependencies
- `@egovernments/digit-ui-module-core` — Core shell, context providers, routing

### External Library Dependencies
| Library | Version | Purpose |
|---|---|---|
| `react` | 17.0.2 | UI framework |
| `react-router-dom` | 5.3.0 | Routing |
| `react-hook-form` | 6.15.8 | Form management |
| `react-i18next` | 11.16.2 | Internationalization |
| `react-query` | 3.6.1 | Data fetching |
| `lodash` | 4.17.21 | Utility library |
| `react-quill` | ^2.0.0 | Rich text editor (alternative) |
| `react-drag-drop-files` | ^2.3.10 | File drag-and-drop |
| `react-select` | ^5.10.1 | Advanced select component |
| `dompurify` | ^3.2.6 | HTML sanitization |
| `react-tooltip` | 4.1.2 | Tooltips |

---

## ⚙️ Configuration

- **`configs/UICustomizations.js`** — Extends UI customizations for inbox, table, and form rendering
- **User type detection:** Dynamically routes citizens to citizen app and employees to employee app
- **E-sign redirect management:** `sessionStorage.eSignWindowObject` stores pre-e-sign state for post-callback restoration
- **Module codes loaded:** `["DRISTI", "CASE", "ORDERS", "SUBMISSIONS", "HEARINGS"]`
- **E-post user role:** `POST_MANAGER` role users get special routing behavior

---

## 🧪 Testing

- No explicit test files found in the module.
- **Missing test areas:** Registration flow, case filing wizard, service layer (60+ methods), component library, e-sign flow, payment calculation.

---

## 🚨 Known Risks / Observations

1. **Module size:** 329 files in `src/` — this is an extremely large module that functions as both a business module AND a shared component library. Strong candidate for decomposition.
2. **God service:** `DRISTIService` with 60+ methods handles case, evidence, hearing, order, payment, OCR, e-sign, and office management — violates single responsibility.
3. **Cross-module imports:** Other modules (orders, home) directly import from `@egovernments/digit-ui-module-dristi/src/pages/employee/...`, creating deep coupling.
4. **Typo in filename:** `contants.js` (should be `constants.js`).
5. **No error boundaries:** The module wraps content with `ToastProvider` but does not implement error boundaries.
6. **Large component registry:** 80+ components registered globally creates a large initialization cost and tight coupling between modules.
7. **`localStorage` usage for judge/court IDs:** `localStorage.getItem("judgeId")` and `localStorage.getItem("courtId")` are used directly in service calls — not type-safe and fragile.
