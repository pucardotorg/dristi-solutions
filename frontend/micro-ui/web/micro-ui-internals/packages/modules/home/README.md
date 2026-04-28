# Home Module

## 📌 Overview

The **Home** module (`@egovernments/digit-ui-module-home`) serves as the **central dashboard and task management hub** for the DRISTI platform. It provides the main home screen, pending task lists, payment workflows, hearing management shortcuts, bail bond signing, witness deposition signing, e-post tracking, and the analytics dashboard. It acts as the primary navigation entry point for all user roles.

**Business Purpose:**
- Display role-specific home screens (Judge, Advocate, Litigant, Clerk, FSO, Bench, Court Room, E-Post Manager)
- Manage and display pending tasks with categorized views
- Handle e-filing payment flows (breakdown, response)
- Provide hearing scheduling and viewing interfaces
- Manage bail bond and witness deposition bulk signing
- Support mediation form signing
- Display analytics dashboard for judges
- Handle e-post tracking for postal service managers

**Where it is used:**
- Rendered under `/{contextPath}/employee/home/*` and `/{contextPath}/citizen/home/*`
- The primary landing page after authentication for all user roles

---

## 🏗 Architecture

### Entry Point
- `src/Module.js` — Exports `HomeModule` (main component) and `initHomeComponents`

### Folder Structure
```
src/
├── Module.js                          # Entry point, component registration
├── components/
│   ├── AddTemplateModal.js            # Template management modal
│   ├── AdvocateReplacementComponent.js # Advocate replacement
│   ├── ClerkWithoutAdvocateView.js    # Clerk standalone view
│   ├── CustomDateRangePicker.js       # Date range picker
│   ├── EfilingPaymentBreakdown.js     # E-filing payment breakdown
│   ├── EfilingPaymentRes.js           # Payment response handler
│   ├── EmptyStates.js                 # Empty state illustrations
│   ├── GeneratePaymentDemandBreakdown.js # Payment demand breakdown
│   ├── HomeAccordian.js               # Home page accordion
│   ├── HomeCard.js                    # Dashboard card
│   ├── HomeHeader.js                  # Home page header
│   ├── HomeSidebar.js                 # Home page sidebar
│   ├── NoticeSummonPaymentModal.js    # Notice/summon payment
│   ├── PendingTaskAccordion.js        # Pending task accordion
│   ├── ReviewCard.js                  # Review card component
│   ├── SideBarItem.js                 # Sidebar navigation item
│   ├── TaskComponent.js               # Task list item
│   ├── UpComingHearing.js             # Upcoming hearings widget
│   └── custom_dropdown.js            # Custom dropdown component
├── configs/                           # 23 config files
│   ├── BenchHomeConfig.js             # Bench officer home config
│   ├── CourtRoomHomeConfig.js         # Court room home config
│   ├── FSOHomeConfig.js               # FSO home config
│   ├── HomeConfig.js                  # General home config
│   ├── JudgeHomeConfig.js             # Judge home config
│   ├── LitigantHomeConfig.js          # Litigant home config
│   ├── PendingTaskConfig.js           # Pending task display config
│   ├── ScrutinyPendingTaskConfig.js   # Scrutiny pending task config
│   ├── ScheduleHearingHomeConfig.js   # Schedule hearing config
│   ├── ViewHearingConfig.js           # View hearing config
│   ├── BulkSignConfig.js             # Bulk order signing config
│   ├── BulkBailBondSignConfig.js     # Bulk bail bond signing config
│   ├── BulkEvidenceSignConfig.js     # Bulk evidence signing config
│   ├── BulkWitnessDepositionSignConfig.js # Bulk witness dep. signing
│   ├── BulkADiarySignConfig.js       # Bulk A-Diary signing config
│   ├── BulkSignFormsConfig.js        # Bulk sign form config
│   ├── BulkMarkAsEvidenceConfig.js   # Bulk mark as evidence config
│   ├── RegisterUserConfig.js         # User registration config
│   ├── OfflinePaymentsConfig.js      # Offline payments config
│   ├── MakeSubmissionConfig.js       # Make submission config
│   ├── AddTeamplateFormConfig.js     # Add template form config
│   ├── TemplateOrConfigurationConfig.js # Template/config settings
│   └── UICustomizations.js           # UI customization overrides
├── hooks/
│   ├── index.js                       # Hook aggregator + URL exports
│   ├── services/
│   │   ├── index.js                   # HomeService (30+ API methods)
│   │   ├── downloadHearingPDF.js     # PDF download
│   │   └── searchTestResultData.js
│   ├── useGetPendingTask.js           # Pending task hook
│   ├── useInboxSearch.js              # Inbox search hook
│   └── useSearchReschedule.js         # Reschedule search hook
├── pages/
│   └── employee/
│       ├── index.js                   # Route definitions (25+ routes)
│       ├── HomeView.js                # Pending task home view
│       ├── MainHomeScreen.js          # Main home screen (role-based)
│       ├── Dashboard.js               # Analytics dashboard
│       ├── HearingsResponse.js        # Hearing response page
│       ├── ScheduleHearing.js         # Hearing scheduling
│       ├── ScheduleNextHearing.js     # Next hearing scheduling
│       ├── ViewHearing.js             # View hearing details
│       ├── HomePopUp.js               # Home pop-up modal
│       ├── BailBondModal.js           # Bail bond review modal
│       ├── BailBondSignModal.js       # Bail bond bulk signing
│       ├── WitnessDepositionSignModal.js # Witness dep. bulk signing
│       ├── DigitalDocumentSignModal.js # Digital document signing
│       └── ... (more pages)
└── utils/
    ├── index.js                       # Hook override & config utilities
    └── ... (1 more file)
```

### Key Design Patterns
- **Role-based configuration:** Separate config files for each user role (Judge, Litigant, FSO, Bench, CourtRoom, E-Post Manager)
- **Pending task aggregation:** Central hub for displaying all pending actions from various modules
- **Component registry consumption:** Dynamically loads components from other modules (orders, hearings) via `Digit.ComponentRegistryService`
- **Cross-module route imports:** Directly imports `PaymentStatus` from orders module and `MediationFormSignaturePage` from dristi module

---

## 🔀 Routing

All routes in `src/pages/employee/index.js` use `PrivateRoute`.

| Route Path | Component | Description |
|---|---|---|
| `{path}/home-pending-task` | `HomeView` | Pending task list (primary landing) |
| `{path}/home-screen` | `MainHomeScreen` | Main home screen (employees) |
| `{path}/hearings-response` | `HearingsResponse` | Hearing action response |
| `{path}/home-pending-task/e-filing-payment-response` | `EFilingPaymentRes` | E-filing payment response |
| `{path}/home-pending-task/e-filing-payment-breakdown` | `EfilingPaymentBreakdown` | Payment breakdown details |
| `{path}/home-pending-task/case-payment-demand-breakdown` | `GeneratePaymentDemandBreakdown` | Case payment demand |
| `{path}/home-pending-task/summons-warrants-modal` | `SummonsAndWarrantsModal` | Summons/warrants issuance |
| `{path}/home-pending-task/reissue-summons-modal` | `ReIssueSummonsModal` | Reissue summons |
| `{path}/home-pending-task/post-payment-modal` | `PaymentForSummonModal` | Post payment for summon |
| `{path}/home-pending-task/rpad-payment-modal` | `PaymentForRPADModal` | RPAD payment |
| `{path}/home-pending-task/icops-payment-modal` | `PaymentForSummonModalSMSAndEmail` | iCOPS payment |
| `{path}/home-pending-task/sms-payment-modal` | `PaymentForSummonModalSMSAndEmail` | SMS payment |
| `{path}/home-pending-task/email-payment-modal` | `PaymentForSummonModalSMSAndEmail` | Email payment |
| `{path}/home-pending-task/home-schedule-hearing` | `ScheduleHearing` | Schedule hearing |
| `{path}/home-pending-task/home-set-next-hearing` | `ScheduleNextHearing` | Set next hearing |
| `{path}/bail-bond` | `BailBondModal` | Bail bond review |
| `{path}/sign-bail-bond` | `BailBondSignModal` | Bulk bail bond signing |
| `{path}/sign-witness-deposition` | `WitnessDepositionSignModal` | Bulk witness deposition signing |
| `{path}/dashboard` | `DashboardPage` | Analytics dashboard |
| `{path}/sbi-epost-payment` | `SBIEpostPayment` | SBI e-post payment |
| `{path}/post-payment-screen` | `PaymentStatus` | Payment status |
| `{path}/sbi-payment-screen` | `SBIPaymentStatus` | SBI payment status |
| `{path}/view-hearing` | `ViewHearing` | View hearing details |
| `{path}/home-popup` | `HomePopUp` | Home popup modal |
| `{path}/epost-home-screen` | `EpostTrackingPage` | E-post tracking |
| `{path}/mediation-form-sign` | `MediationFormSignaturePage` | Mediation form e-sign |
| `{path}/digitized-document-sign` | `DigitalDocumentSignModal` | Digitized document signing |

---

## 🧠 State Management

### Redux Slices
No dedicated Redux slices.

### Global State Dependencies
- `Digit.Services.useStore` — Loads modules: `["home", "common", "workflow", "orders"]`
- `Digit.UserService` — User authentication and role detection
- `Digit.ComponentRegistryService` — Dynamically loads components from other modules

### Local State Strategy
- `useGetPendingTask` hook for pending task data
- `useInboxSearch` for inbox search functionality
- `useSearchReschedule` for reschedule search
- Component-level `useState` for modal states and form data

---

## 🌐 API Integrations

### HomeService (30+ methods)

**Inbox & Pending Tasks:**
| Method | Endpoint |
|---|---|
| `InboxSearch` | `/inbox/v2/index/_search` |
| `pendingTaskSearch` | `/inbox/v2/_getFields/actionCategory` |
| `getPendingTaskService` | `/inbox/v2/_getFields` |

**Case & Order Management:**
| Method | Endpoint |
|---|---|
| `customApiService` | Dynamic URL |

**Hearing Scheduling:**
| Method | Endpoint |
|---|---|
| `searchReschedule` | `/scheduler/hearing/v1/reschedule/_search` |

**A-Diary Management:**
| Method | Endpoint |
|---|---|
| `generateADiaryPDF` | `/ab-diary/case/diary/v1/generate` |
| `updateADiaryPDF` | `/ab-diary/case/diary/v1/update` |
| `getADiarySearch` | `/ab-diary/case/diary/v1/search` |

**Bail Bond Management:**
| Method | Endpoint |
|---|---|
| `getBailBondsToSign` | `/bail-bond/v1/_getBailsToSign` |
| `updateSignedBailBonds` | `/bail-bond/v1/_updateSignedBails` |
| `updateBailBond` | `/bail-bond/v1/_update` |
| `searchBailBond` | `/bail-bond/v1/_search` |

**Witness Deposition Management:**
| Method | Endpoint |
|---|---|
| `getWitnessDepositionsToSign` | `/evidence/v1/_getArtifactsToSign` |
| `updateSignedWitnessDepositions` | `/evidence/v1/_updateSignedArtifacts` |
| `updateWitnessDeposition` | `/evidence/v1/_update` |
| `searchWitnessDeposition` | `/evidence/v1/_search` |

**Evidence Management:**
| Method | Endpoint |
|---|---|
| `getEvidencesToSign` | `/evidence/v1/_getArtifactsToSign` |
| `updateSignedEvidences` | `/evidence/v1/_updateSignedArtifacts` |

**Template Management:**
| Method | Endpoint |
|---|---|
| `createTemplate` | `/template-configuration/v1/create` |
| `updateTemplate` | `/template-configuration/v1/update` |
| `searchTemplate` | `/template-configuration/v1/search` |

---

## 🧩 Key Components

### Container Components
- **`HomeView`** — Primary pending task home view with task categorization
- **`MainHomeScreen`** — Role-based main home screen
- **`DashboardPage`** — Analytics dashboard for judges
- **`BailBondSignModal`** — Bulk bail bond signing interface
- **`WitnessDepositionSignModal`** — Bulk witness deposition signing
- **`DigitalDocumentSignModal`** — Digital document signing

### Presentational Components
- **`HomeCard`** — Dashboard card (globally registered)
- **`CustomDateRangePicker`** — Date range picker (globally registered)
- **`PendingTaskAccordion`** — Expandable pending task groups
- **`EfilingPaymentBreakdown`** — Payment breakdown display
- **`GeneratePaymentDemandBreakdown`** — Demand-based payment breakdown
- **`EmptyStates`** — Empty state illustrations
- **`HomeSidebar`** — Home page navigation sidebar
- **`UpComingHearing`** — Upcoming hearings widget

---

## 🔄 Data Flow

```
Home Screen Load:
  User login → HomeModule
    → Role detection (Judge/Advocate/Litigant/Clerk/FSO/E-Post)
    → Role-specific config loaded (JudgeHomeConfig, LitigantHomeConfig, etc.)
    → HomeService.pendingTaskSearch() → API: /inbox/v2/_getFields/actionCategory
    → Pending tasks rendered in categorized accordion

Payment Flow:
  Pending task click (e-filing payment) → EfilingPaymentBreakdown
    → Payment calculation displayed
    → User proceeds to payment → e-Treasury integration
    → EFilingPaymentRes → Success/failure display

Bulk Signing Flow:
  Judge → BailBondSignModal
    → HomeService.getBailBondsToSign() → API: /bail-bond/v1/_getBailsToSign
    → Judge reviews and signs
    → HomeService.updateSignedBailBonds() → API: /bail-bond/v1/_updateSignedBails
```

---

## 🔗 Dependencies

### Internal Module Dependencies
- `@egovernments/digit-ui-module-core` — Core shell, context
- `@egovernments/digit-ui-module-orders` — `PaymentStatus` component (direct import from `../../../../orders/src/components/PaymentStatus`)
- `@egovernments/digit-ui-module-dristi` — `MediationFormSignaturePage` component (import via package path)
- `@egovernments/digit-ui-module-hearings` — `SummonsAndWarrantsModal`, `SBIEpostPayment`, `EpostTrackingPage` etc. (via ComponentRegistryService)

### External Library Dependencies
| Library | Version | Purpose |
|---|---|---|
| `react` | 17.0.2 | UI framework |
| `react-router-dom` | 5.3.0 | Routing |
| `react-i18next` | 11.16.2 | i18n |
| `react-query` | 3.6.1 | Data fetching |
| `react-date-range` | ^1.4.0 | Date range picker |
| `@egovernments/digit-ui-react-components` | 1.8.2-beta.9 | Shared UI |
| `@egovernments/digit-ui-components` | 0.0.2-beta.1 | Design system |
| `@egovernments/digit-ui-module-core` | 1.8.1-beta.6 | Core module |

---

## ⚙️ Configuration

- **23 config files** covering role-based home screens, bulk signing, pending tasks, and form configurations
- **Role-specific configs:** `JudgeHomeConfig.js`, `LitigantHomeConfig.js`, `BenchHomeConfig.js`, `CourtRoomHomeConfig.js`, `FSOHomeConfig.js`
- **Bulk signing configs:** `BulkSignConfig.js`, `BulkBailBondSignConfig.js`, `BulkEvidenceSignConfig.js`, `BulkWitnessDepositionSignConfig.js`, `BulkADiarySignConfig.js`
- **Module codes loaded:** `["home", "common", "workflow", "orders"]`
- **URL params:** `result` and `filestoreId` query params are captured for e-sign callback handling

---

## 🧪 Testing

- No explicit test files found in the module.
- **Missing test areas:** Pending task aggregation, role-based rendering, payment flow, bulk signing, dashboard analytics.

---

## 🚨 Known Risks / Observations

1. **Direct cross-module file import:** `PaymentStatus` is imported directly from `../../../../orders/src/components/PaymentStatus` — a relative path that bypasses package boundaries. This is fragile and will break if directory structure changes.
2. **Heavy dependency on ComponentRegistryService:** Many route components are loaded via `Digit.ComponentRegistryService.getComponent()` with `|| <React.Fragment>` fallbacks — if the registered component is missing, a blank fragment renders silently without error.
3. **Route explosion:** 25+ routes in a single file, many following similar patterns — could benefit from route configuration abstraction.
4. **Typo in config filename:** `AddTeamplateFormConfig.js` (should be `AddTemplateFormConfig.js`).
5. **Payment modal duplication:** `PaymentForSummonModalSMSAndEmail` is used for three different routes (iCOPS, SMS, email) — the same component handles multiple payment channels.
6. **`homeIcon.js` at module root:** A 9.9KB file outside `src/` — appears to be misplaced.
