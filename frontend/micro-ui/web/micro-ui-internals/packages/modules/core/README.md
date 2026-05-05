# Core Module

## 📌 Overview

The **Core** module (`@egovernments/digit-ui-module-core`) is the **foundational shell** of the DRISTI micro-frontend application. It bootstraps the entire UI — setting up the Redux store, React Query client, routing infrastructure, authentication, breadcrumb context, and the top-bar/sidebar layout shell. All other modules (dristi, cases, hearings, orders, submissions, home) are loaded *through* this module.

**Business Purpose:**
- Provides the application shell (layout, navigation, top bar, sidebar)
- Manages authentication (login, logout, OTP, change password)
- Initializes the Redux store with module-specific reducers
- Provides shared contexts (breadcrumb data, advocate data, privacy, component registry)
- Routes between citizen and employee interfaces

**Where it is used:**
- This is the root module. All other modules render within the layout provided by Core.
- Entry point of the entire DRISTI frontend application.

---

## 🏗 Architecture

### Entry Point
- `src/Module.js` — Exports `DigitUI` (root component), `initCoreComponents` (initialization function), and context providers (`BreadCrumbsParamsDataContext`, `AdvocateDataContext`)

### Folder Structure
```
src/
├── Module.js                          # Root component, context providers, store setup
├── App.js                            # Top-level router (employee/citizen switch)
├── Utils/
│   ├── index.js                      # Utility exports
│   ├── ApiMonitorPanel.js            # API monitoring panel (dev tool)
│   ├── apiMonitor.js                 # API monitoring logic
│   ├── axiosInstance.js              # Axios HTTP client instance
│   └── requestInterceptor.js         # HTTP request interceptor
├── components/
│   ├── AppModules.js                 # Dynamic module loader
│   ├── Background.js                 # Background component
│   ├── ChangeCity.js                 # City selection component
│   ├── ChangeLanguage.js             # Language selection component
│   ├── ErrorBoundaries.js            # Error boundary wrapper
│   ├── ErrorComponent.js             # Error display component
│   ├── Header.js                     # Application header
│   ├── Home.js                       # Home page component
│   ├── Search/                       # Search components
│   │   ├── index.js
│   │   ├── SearchFields.js
│   │   └── MobileSearchApplication.js
│   ├── TopBarSideBar/                # Navigation shell
│   │   ├── index.js
│   │   ├── TopBar.js
│   │   ├── TopBarComponent.js
│   │   ├── ProfileComponent.js
│   │   └── SideBar/
│   │       ├── index.js
│   │       ├── SideBar.js
│   │       ├── CitizenSideBar.js
│   │       ├── EmployeeSideBar.js
│   │       └── StaticCitizenSideBar.js
│   ├── Dialog/
│   │   └── LogoutDialog.js
│   └── utils.js
├── config/
│   └── sidebar-menu.js               # Sidebar menu configuration
├── context/
│   └── index.js                      # Context exports
├── hooks/
│   ├── useGetAccessToken.js           # Token refresh hook
│   └── useInterval.js                # Interval polling hook
├── lib/
│   └── gtag.js                       # Google Analytics tracking
├── pages/
│   ├── citizen/                      # Citizen-facing pages
│   │   ├── index.js                  # Citizen app router
│   │   ├── Home/
│   │   │   ├── index.js              # Citizen home page
│   │   │   ├── LanguageSelection.js
│   │   │   ├── LocationSelection.js
│   │   │   ├── UserProfile.js
│   │   │   └── ImageUpload/
│   │   ├── Login/
│   │   │   ├── index.js
│   │   │   ├── SelectMobileNumber.js
│   │   │   ├── SelectOtp.js
│   │   │   ├── SelectName.js
│   │   │   └── config.js
│   │   ├── Allservices/
│   │   ├── FAQs/
│   │   ├── HowItWorks/
│   │   └── SearchApp.js
│   └── employee/                     # Employee-facing pages
│       ├── index.js                  # Employee app router
│       ├── Login/                    # Employee login
│       ├── ChangePassword.js
│       ├── ForgotPassword.js
│       └── LanguageSelection.js
└── redux/
    ├── store.js                      # Redux store factory
    └── reducers/                     # Common reducer
```

### Key Design Patterns
- **Shell architecture:** Core acts as the application shell that dynamically loads module components via `Digit.ComponentRegistryService`
- **Context Providers:** `BreadCrumbsParamsDataContext` and `AdvocateDataContext` are created here and consumed by child modules
- **Redux + Thunk:** Centralized store with `redux-thunk` middleware
- **React Query:** Global `QueryClient` configured with 15-minute stale time and 50-minute cache time, no retry
- **Session storage abstraction:** Custom storage wrapper with TTL-based expiration

---

## 🔀 Routing

### Top-Level Routes (`App.js`)

| Route Path | Component | Description |
|---|---|---|
| `/{contextPath}/employee` | `EmployeeApp` | Employee application shell |
| `/{contextPath}/citizen` | `CitizenApp` | Citizen application shell |
| Default | Redirect to `/{contextPath}/{defaultLanding}` | Default redirect |

### Employee Routes (`pages/employee/index.js`)

| Route Path | Component | Auth |
|---|---|---|
| `{path}/user/login` | `EmployeeLogin` | Public |
| `{path}/user/change-password` | `ChangePassword` | Public |
| `{path}/user/profile` | `UserProfile` | Private |
| `{path}/user/error` | `ErrorComponent` | Public |
| `{path}/user/language-selection` | `LanguageSelection` | Public |
| `{path}/*` (non-user) | `AppModules` (dynamic) | Authenticated |

### Citizen Routes (`pages/citizen/index.js`)

| Route Path | Component | Auth |
|---|---|---|
| `{path}` (exact) | `CitizenHome` | Public |
| `{path}/select-language` | `LanguageSelection` | Public |
| `{path}/select-location` | `LocationSelection` | Public |
| `{path}/login` | `Login` | Public |
| `{path}/register` | `Login` (registration mode) | Public |
| `{path}/user/profile` | `UserProfile` | Authenticated |
| `{path}/all-services` | `AppHome` | Public |
| `{path}/{moduleCode}` | Dynamic module routes | Module-dependent |

### Route Guards
- Mobile view restriction: Screens < 900px display a "Switch to desktop" message, except for specific open routes (bail-bond-sign, payment-login, sms-payment, etc.)
- Employee routes use `PrivateRoute` for authenticated paths

---

## 🧠 State Management

### Redux Store
- **`redux/store.js`** — Factory function `getStore(defaultStore, moduleReducers)` creates the Redux store
- Uses `combineReducers` with a `common` reducer and optional module-specific reducers
- Middleware: `redux-thunk`
- Redux DevTools Extension integration

### Global State Dependencies
- `Digit.Hooks.useInitStore(stateCode, enabledModules)` — Initializes module data, tenants, state info
- `Digit.Hooks.useStore.getInitData()` — Retrieves initialized store data

### Context State
- `BreadCrumbsParamsDataContext` — Shares `{ caseId, filingNumber }` across modules for breadcrumb navigation
- `AdvocateDataContext` — Shares selected advocate data across modules
- `PrivacyProvider` — Manages field-level privacy settings
- `ComponentProvider` — Provides component registry to child components

---

## 🌐 API Integrations

No dedicated service layer in this module. API interactions are handled through:
- `Digit.Hooks.useInitStore` — Fetches initial configuration data
- `Digit.Hooks.useCustomMDMS` — Fetches MDMS data for tenant info and link data
- `useGetAccessToken` hook — Handles token refresh via `refresh-token`
- `Digit.UserService` — Authentication state management

---

## 🧩 Key Components

### Container Components
- **`DigitUI`** — Root application component; sets up QueryClient, Redux Provider, Router, and all context providers
- **`DigitUIWrapper`** — Handles store initialization and renders `DigitApp`
- **`DigitApp` (App.js)** — Top-level router switching between citizen and employee apps
- **`AppModules`** — Dynamically renders registered module components based on enabled modules

### Layout Components
- **`TopBarSideBar`** — Navigation shell consisting of top bar and sidebar
- **`TopBar` / `TopBarComponent`** — Application header bar
- **`SideBar`** — Navigation sidebar (citizen and employee variants)
- **`ProfileComponent`** — User profile dropdown

### Authentication Components
- **`EmployeeLogin`** — Employee login page
- **`Login` (citizen)** — Citizen login with mobile number + OTP
- **`SelectOtp`** — OTP verification component (globally registered)
- **`ChangePassword`** — Password change form
- **`ChangeCity`** / **`ChangeLanguage`** — City and language selectors (globally registered)

---

## 🔄 Data Flow

```
Application Bootstrap:
  DigitUI → QueryClientProvider → Redux Provider → Router
    → DigitUIWrapper
      → Digit.Hooks.useInitStore(stateCode, enabledModules)
      → API: MDMS, tenant config, localization
      → Redux Store initialized
      → DigitApp renders
        → Employee/Citizen route matched
          → TopBarSideBar rendered
          → AppModules dynamically loads registered modules
```

---

## 🔗 Dependencies

### Internal Module Dependencies
- All other modules depend on Core (this module provides the application shell)
- Core does not depend on other business modules

### External Library Dependencies
| Library | Version | Purpose |
|---|---|---|
| `react` | 17.0.2 | UI framework |
| `react-dom` | 17.0.2 | DOM rendering |
| `react-router-dom` | 5.3.0 | Routing |
| `react-redux` | 7.2.8 | Redux bindings |
| `redux` | 4.1.2 | State management |
| `redux-thunk` | 2.4.1 | Async Redux middleware |
| `react-query` | 3.6.1 | Async data fetching/caching |
| `react-i18next` | 11.16.2 | Internationalization |
| `react-tooltip` | 4.1.2 | Tooltip component |
| `@egovernments/digit-ui-react-components` | 1.8.2-beta.11 | Shared UI components |
| `@egovernments/digit-ui-components` | 0.0.1-beta.28 | Design system components |

---

## ⚙️ Configuration

- **Mobile view restriction:** Screens < 900px are blocked with a "desktop site" prompt, except for specific open routes (bail-bond, payment, e-sign)
- **React Query defaults:** `staleTime: 15min`, `cacheTime: 50min`, `retry: false`
- **Session storage TTL:** Default 86400 seconds (24 hours)
- **DRISTI module auto-injection:** If `DRISTI` is not in the modules list, it is automatically added with `order: 11`
- **Sidebar menu:** Configured via `config/sidebar-menu.js`

---

## 🧪 Testing

- No explicit test files found in the module.
- **Missing test areas:** Store initialization, context providers, routing logic, authentication flow, mobile view detection.

---

## 🚨 Known Risks / Observations

1. **`QueryClient` instantiation in render:** The `QueryClient` is created inside the `DigitUI` component body (not memoized), which could theoretically cause re-creation on re-renders. However, since `DigitUI` is a top-level component that rarely re-renders, practical impact is minimal.
2. **DRISTI module hardcoded injection:** Lines 36–53 in `Module.js` forcefully add a `DRISTI` module entry if not present — this is a hardcoded assumption.
3. **`window.Digit` global dependency:** Core heavily relies on and mutates `window.Digit`, creating a global mutable state pattern that is difficult to test and trace.
4. **Session storage wrapper complexity:** The custom storage abstraction with TTL expiration adds a layer that could silently discard data.
5. **Web vitals tracking commented out:** Performance tracking code exists but is commented out in `App.js`.
6. **Footer commented out:** The employee home footer image is commented out.
