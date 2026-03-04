# DRISTI Frontend Modules — Summary

## Module Overview Table

| Module | Primary Responsibility | API Calls | Routes | State Usage |
|---|---|---|---|---|
| **[cases](./cases)** | Case joining workflows — search, verify access code, join as party, vakalath, payment | 2 service methods (`joinCaseService`, `verifyAccessCode`) + pending task API | 11 employee routes | No Redux slices; global `Digit.Services.useStore`; `react-hook-form` for forms |
| **[core](./core)** | Application shell — Redux store, routing, authentication, layout, context providers | `useInitStore`, `useCustomMDMS` (MDMS/tenant config), token refresh | 6 employee routes, 8 citizen routes, dynamic module routes | Redux store (`common` reducer + module reducers); `BreadCrumbsParamsDataContext`, `AdvocateDataContext`; React Query (stale: 15min, cache: 50min) |
| **[dristi](./dristi)** | Core case lifecycle — registration, filing, scrutiny, admission, evidence, payments, e-sign, 80+ shared components | 60+ `DRISTIService` methods covering individuals, cases, evidence, hearings, orders, submissions, payments, e-sign, OCR, diary, office management | 10 employee routes, 20+ citizen routes (incl. 7 open/unauthenticated) | No Redux slices; `Digit.Services.useStore` (5 module codes); `ToastProvider`; `react-hook-form`; `sessionStorage` for e-sign callbacks |
| **[hearings](./hearings)** | Hearing lifecycle — calendar views, in-hearing management, transcription, adjournment, bulk reschedule | 14 `hearingService` methods covering hearings, transcripts, tasks, notifications, bulk ops, diary | 4 employee routes | No Redux slices; `Digit.Services.useStore` (4 module codes); `BreadCrumbsParamsDataContext`; `react-query` for data fetching |
| **[home](./home)** | Central dashboard — pending tasks, payments, bulk signing, analytics, e-post tracking | 30+ `HomeService` methods covering inbox, pending tasks, bail bonds, witness depositions, evidence, diary, templates | 25+ employee routes | No Redux slices; `Digit.Services.useStore` (4 module codes); `Digit.ComponentRegistryService` for dynamic component loading |
| **[orders](./orders)** | Order lifecycle — creation, drafting, e-sign, publishing, summons/warrants delivery, payments | 8 service objects: `ordersService`, `EpostService`, `schedulerService`, `taskService`, `SBIPaymentService`, `orderManagementService`, `processManagementService`, `openApiService` | 6 employee routes + 2 unauthenticated pages | `OrderWorkflowState` / `OrderWorkflowAction` enums; `Digit.Services.useStore` (5 module codes); `BreadCrumbsParamsDataContext` |
| **[submissions](./submissions)** | Submissions — applications, bail bonds, plea, evidence, 3 unauthenticated e-sign flows (bail bond, witness deposition, digitized document) | 20+ `submissionService` methods covering applications, evidence, bail bonds, digitalization, open API | 6 employee routes + 7 globally registered open components | No Redux slices; `Digit.Services.useStore` (3 module codes); `BreadCrumbsParamsDataContext`; `sessionStorage` for SMS flow |

---

## Architecture Diagram

```
                              ┌──────────────────────────────────┐
                              │            Core Module           │
                              │   (Redux Store, React Query,     │
                              │    Router, Auth, Contexts,       │
                              │    TopBar/Sidebar Shell)         │
                              └───────────────┬──────────────────┘
                                              │
                    ┌─────────────────────────┼──────────────────────────┐
                    │                         │                          │
                    ▼                         ▼                          ▼
          ┌─────────────────┐     ┌───────────────────┐     ┌────────────────────┐
          │  DRISTI Module  │     │   Home Module      │     │   Cases Module     │
          │  (Case Lifecycle│     │  (Dashboard, Tasks, │     │  (Join Case,       │
          │   Registration, │◀────│   Payments, Signing)│     │   Search, Payment) │
          │   80+ shared    │     └─────────┬───────────┘     └────────────────────┘
          │   components)   │               │
          └──────┬──────────┘     ┌─────────┼───────────┐
                 │                │                     │
                 ▼                ▼                     ▼
     ┌────────────────────┐ ┌──────────────────┐ ┌───────────────────┐
     │  Hearings Module   │ │  Orders Module   │ │ Submissions Module│
     │  (Calendar, In-    │ │ (Order Lifecycle, │ │ (Applications,    │
     │   Hearing, Bulk    │ │  Summons, E-Post, │ │  Bail Bonds, Plea,│
     │   Reschedule)      │ │  Payments)        │ │  E-Sign Flows)    │
     └────────────────────┘ └──────────────────┘ └───────────────────┘

Legend:
  ──▶  Component Registry / Hook dependency
  ──── Direct import dependency
```

---

## Shared Infrastructure

| Concern | Implementation | Module |
|---|---|---|
| **Redux Store** | `getStore()` with `combineReducers`, `redux-thunk` | Core |
| **React Query** | `QueryClient` (stale: 15min, cache: 50min, no retry) | Core |
| **Authentication** | `PrivateRoute`, `Digit.UserService`, `localStorage` token | Core |
| **Component Registry** | `Digit.ComponentRegistryService.setComponent()` | All modules |
| **Hook Injection** | `overrideHooks()` → `Digit.Hooks[module]` | All modules |
| **Config Injection** | `updateCustomConfigs()` → `Digit.Customizations` | All modules |
| **API Layer** | `Request()` from `@egovernments/digit-ui-libraries` | All modules |
| **Breadcrumbs** | `BreadCrumbsParamsDataContext` | Core (provider), All (consumers) |
| **Advocate Data** | `AdvocateDataContext` | Core (provider), DRISTI (consumer) |
| **i18n** | `react-i18next` with `useTranslation()` | All modules |

---

## Cross-Module Dependencies

```
dristi ──(80+ shared components)──▶ orders, submissions, hearings, home, cases
home ────(direct file import)─────▶ orders (PaymentStatus)
home ────(direct package import)──▶ dristi (MediationFormSignaturePage)
orders ──(direct package import)──▶ dristi (MediationFormSignaturePage)
submissions ──(component registry)──▶ dristi (citizen routes host open pages)
hearings ──(component registry)───▶ home (SummonsAndWarrantsModal, Calendar)
```

---

## Common Patterns Across Modules

1. **Module Self-Registration:** Each module exports an `init[Module]Components` function that registers components with `Digit.ComponentRegistryService`
2. **Hook Override:** Each module calls `overrideHooks()` in its init function to inject custom hooks into `Digit.Hooks[module]`
3. **Config Update:** Each module calls `updateCustomConfigs()` to extend `Digit.Customizations`
4. **Service Layer:** Each module defines a service object in `hooks/services/index.js` wrapping the `Request` utility
5. **URL Constants:** Each module defines API endpoint URLs in `hooks/services/Urls.js`
6. **PrivateRoute Guard:** All authenticated routes use `PrivateRoute` from `@egovernments/digit-ui-react-components`
7. **Role-Based Redirection:** Each module checks user type (citizen/employee) and role-specific logic for routing
8. **Breadcrumb Context:** Modules consume `BreadCrumbsParamsDataContext` for case-aware breadcrumb navigation
9. **E-Sign Callback Handling:** `sessionStorage.eSignWindowObject` stores pre-e-sign state for post-callback route restoration
10. **Open API Pattern:** Unauthenticated endpoints under `/openapi/*` for SMS-based external access (orders, submissions modules)
