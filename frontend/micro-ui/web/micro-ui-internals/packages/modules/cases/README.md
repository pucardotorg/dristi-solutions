# Cases Module

## 📌 Overview

The **Cases** module (`@egovernments/digit-ui-module-cases`) handles all case-joining workflows within the DRISTI judicial platform. It enables advocates and litigants to discover cases, validate access codes, join cases as parties, manage vakalath (power of attorney) documents, and process join-case payments.

**Business Purpose:**
- Allows advocates to search for and join existing court cases
- Enables litigants to join cases through access code verification
- Manages e-sign and payment flows for case-joining
- Provides case and filing search capabilities

**Where it is used:**
- Rendered under the `/{contextPath}/employee/cases/*` and `/{contextPath}/citizen/cases/*` route namespaces
- Registered globally via `Digit.ComponentRegistryService` as `CasesModule`

---

## 🏗 Architecture

### Entry Point
- `src/Module.js` — Exports `CasesModule` (main React component) and `initCasesComponents` (initialization function)

### Folder Structure
```
src/
├── Module.js                          # Entry point, component registration
├── components/
│   ├── CasesCard.js                   # Dashboard card for cases
│   └── NameListWithModal.js           # Party name list with modal UI
├── configs/
│   ├── UICustomizations.js            # UI customization overrides
│   ├── VerifyMultipartyLitigantconfig.js  # Multi-party verification config
│   ├── advocateRegistrationConfig.js  # Advocate registration form config
│   ├── advocateSearchConfig.js        # Advocate search form config
│   ├── caseAndFilingSearchConfig.js   # Case & filing search config
│   └── poaApplicationConfig.js        # Power of Attorney config
├── hooks/
│   ├── index.js                       # Hook aggregator & exports
│   ├── services/
│   │   ├── index.js                   # CASEService (API wrappers)
│   │   ├── searchCases.js             # Case search service
│   │   └── searchTestResultData.js    # Test result data search
│   └── useIndividualView.js           # Individual data hook
├── pages/
│   ├── advocate/                      # Advocate-specific join-case flows
│   │   ├── AdvocateMain.js            # Advocate join-case main page
│   │   ├── AdvocateJoinCase.js        # Advocate join case form
│   │   ├── AdvocateEsign.js           # Advocate e-signature page
│   │   ├── AdovactePayment.js         # Advocate payment page
│   │   ├── AdvocateJoinSucess.js      # Join success confirmation
│   │   └── Vakalath.js               # Vakalath document management
│   ├── employee/                      # Employee/authenticated user pages
│   │   ├── index.js                   # Route definitions
│   │   ├── JoinCaseHome.js            # Join case landing page
│   │   ├── SearchCase.js             # Case search page
│   │   ├── CaseAndFilingSearch.js     # Case + filing combined search
│   │   ├── CasesResponse.js          # Cases response page
│   │   ├── LitigantSuccess.js        # Litigant join success page
│   │   ├── advocateRegistration.js    # Advocate registration form
│   │   └── joinCaseComponent/         # Join case sub-components
│   │       ├── AccessCodeValidation.js
│   │       ├── JoinCasePayment.js
│   │       ├── JoinCaseSuccess.js
│   │       ├── LitigantVerification.js
│   │       ├── POAInfo.js
│   │       ├── SearchCaseAndShowDetails.js
│   │       └── SelectParty.js
│   └── litigant/                      # Litigant-specific pages
│       ├── JoinCaseHome.js
│       └── index.js
└── utils/
    ├── index.js                       # Hook override & config utilities
    ├── createUtils.js                 # Case creation utilities
    └── joinCaseUtils.js               # Join case helper functions
```

### Key Design Patterns
- **Micro-frontend architecture**: Module self-registers components via `Digit.ComponentRegistryService`
- **Hook override pattern**: `overrideHooks()` injects custom hooks into the global `Digit.Hooks.cases` namespace
- **Config-driven UI**: Customization configs extend `Digit.Customizations.commonUiConfig`
- **Service layer abstraction**: `CASEService` wraps all API calls via the `Request` utility from `@egovernments/digit-ui-libraries`

---

## 🔀 Routing

All routes are defined in `src/pages/employee/index.js` and wrapped with `PrivateRoute` (authentication required).

| Route Path | Component | Description |
|---|---|---|
| `{path}/cases-response` | `CasesResponse` | Response/confirmation page |
| `{path}/join-case` | `JoinCaseHome` | Join case landing page |
| `{path}/search-case` | `SearchCase` | Case search interface |
| `{path}/join-case-advocate` | `AdvocateMain` | Advocate join case flow |
| `{path}/advocate-vakalath` | `Vakalath` | Vakalath document management |
| `{path}/advocate-esign` | `AdvocateEsign` | E-signature for advocate |
| `{path}/advocate-payment` | `AdvocatePayment` | Payment for advocate joining |
| `{path}/advocate-join-case` | `AdvocateJoinCase` | Advocate join case form |
| `{path}/advocate-join-success` | `AdvocateJoinSucess` | Success confirmation |
| `{path}/case-filing-search` | `CaseAndFilingSearch` | Case and filing search |
| `{path}/litigant-success` | `LitigantSucess` | Litigant join success |

**Route Guards:** All routes use `PrivateRoute` which requires user authentication. Additional role-based redirection logic exists in the `App` component — citizens are redirected to the citizen home, and employees to the employee home.

---

## 🧠 State Management

### Redux Slices Used
No dedicated Redux slices. The module relies on the common Redux store initialized by the `core` module.

### Global State Dependencies
- `Digit.Services.useStore` — Loads localization data for modules: `["case", "common", "workflow"]`
- `Digit.UserService` — User authentication state
- `Digit.SessionStorage` — Session-level data

### Local State Strategy
- React `useState` for form state within join-case components
- `react-hook-form` (v6.15.8) for form management in registration and verification flows

---

## 🌐 API Integrations

### Services (`CASEService`)

| Service Method | Endpoint | Description |
|---|---|---|
| `joinCaseService` | `/case/v1/joincase/_joincase` | Submit a join-case request |
| `verifyAccessCode` | `/case/v2/joincase/_verifycode` | Verify access code for joining a case |

### Additional Endpoints Referenced
| Endpoint | Usage |
|---|---|
| `/analytics/pending_task/v1/create` | Create/update pending tasks |
| `/user/oauth/token` | Authentication |

---

## 🧩 Key Components

### Container Components
- **`JoinCaseHome`** — Orchestrates the join-case workflow with step-based navigation (search → verify → select party → payment → success)
- **`AdvocateMain`** — Main entry for advocate join-case flow
- **`CaseAndFilingSearch`** — Combined case and filing search interface

### Presentational Components
- **`CasesCard`** — Dashboard card displayed on the home screen
- **`NameListWithModal`** — Displays party names with a modal for detailed view

### Shared Sub-Components (joinCaseComponent/)
- **`AccessCodeValidation`** — Access code input and verification
- **`JoinCasePayment`** — Payment step (also globally registered)
- **`LitigantVerification`** — Litigant identity verification
- **`POAInfo`** — Power of Attorney information
- **`SearchCaseAndShowDetails`** — Search and display case details
- **`SelectParty`** — Party selection interface

---

## 🔄 Data Flow

```
User Action (Search/Join Case)
  → CASEService.verifyAccessCode() → API: /case/v2/joincase/_verifycode
  → User selects party & provides details
  → CASEService.joinCaseService() → API: /case/v1/joincase/_joincase
  → Payment flow (if required)
  → Success page rendered
```

---

## 🔗 Dependencies

### Internal Module Dependencies
- `@egovernments/digit-ui-module-core` — Implicit (renders within core's routing)

### External Library Dependencies
| Library | Version | Purpose |
|---|---|---|
| `react` | 17.0.2 | UI framework |
| `react-router-dom` | 5.3.0 | Routing |
| `react-hook-form` | 6.15.8 | Form management |
| `react-i18next` | 11.16.2 | Internationalization |
| `react-query` | 3.6.1 | Async data fetching |
| `react-date-range` | ^1.4.0 | Date range picker |
| `@egovernments/digit-ui-react-components` | 1.8.2-beta.9 | Shared UI components |
| `@egovernments/digit-ui-components` | 0.0.2-beta.1 | Design system components |

---

## ⚙️ Configuration

- **`configs/UICustomizations.js`** — Extends `Digit.Customizations.commonUiConfig` to customize inbox/table behavior
- **`configs/advocateSearchConfig.js`** — Search field configurations for advocate lookup
- **`configs/caseAndFilingSearchConfig.js`** — Search field configurations for case+filing search
- **`configs/poaApplicationConfig.js`** — POA application form configuration
- **`configs/VerifyMultipartyLitigantconfig.js`** — Multi-party litigant verification form config
- No explicit feature flags found in code. Behavior is driven by role-based access (`POST_MANAGER`, citizen vs employee).

---

## 🧪 Testing

- No explicit test files found in the module (`__tests__/`, `*.test.js`, `*.spec.js`).
- **Missing test areas:** Service layer, join-case workflow, access code validation, payment flow.

---

## 🚨 Known Risks / Observations

1. **Typo in filename:** `AdovactePayment.js` (should be `AdvocatePayment.js`) and `AdvocateJoinSucess.js` (should be `AdvocateJoinSuccess.js`)
2. **Tight coupling to global `Digit` object:** The module heavily relies on `window.Digit` for service calls, hook registration, and component registry. This creates implicit dependencies.
3. **Role-based routing duplication:** The citizen/employee redirect logic (`isCitizen && !hasCitizenRoute`) is duplicated across multiple modules (cases, hearings, home, orders, submissions).
4. **No error boundary:** The module does not implement its own error boundary.
5. **Lodash imported but no explicit usage found** in `utils/index.js`.
