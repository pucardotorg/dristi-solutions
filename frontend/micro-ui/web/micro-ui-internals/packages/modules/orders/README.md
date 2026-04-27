# Orders Module

## 📌 Overview

The **Orders** module (`@egovernments/digit-ui-module-orders`) manages the complete order lifecycle within the DRISTI judicial platform — order creation, drafting, review, e-signing, publishing, and delivery (including summons, warrants, and notices). It also handles payment processing for summons delivery via multiple channels (post, RPAD, iCOPS, SMS, email, SBI e-post) and provides the e-post tracking interface.

**Business Purpose:**
- Generate and manage court orders (drafting, review, e-sign, publish)
- Manage order workflow states (DRAFT_IN_PROGRESS → PENDING_BULK_E_SIGN → PUBLISHED / ABATED)
- Handle summons, warrants, and notice issuance with delivery channel selection
- Process payments for summons via treasury and SBI payment gateways
- Track e-post delivery status
- Support SMS-based unauthenticated payment flows for summons recipients
- Manage order notification delivery

**Where it is used:**
- Rendered under `/{contextPath}/employee/orders/*`
- Multiple components are globally registered: `OrderWorkflowAction`, `OrderWorkflowState`, `OrdersService`, `OrderReviewModal`, `PaymentForSummonModal`, etc.

---

## 🏗 Architecture

### Entry Point
- `src/Module.js` — Exports `OrdersModule` (main component) and `initOrdersComponents` with 20+ registered components

### Folder Structure
```
src/
├── Module.js                          # Entry point, 20+ registrations
├── components/
│   ├── AddSignatureComponent.js       # Signature addition UI
│   ├── AddSubmissionDocument.js       # Add submission document
│   ├── ApplicationInfoComponent.js    # Application info display
│   ├── BreadCrumbsNew.js             # Custom breadcrumb component
│   ├── CommentBox/                    # Comment components
│   │   ├── Comment.js
│   │   └── CommentBox.js
│   ├── CustomInfo.js                  # Custom info display
│   ├── CustomStepperSuccess.js        # Step-based success display
│   ├── DocumentModal.js               # Document viewer modal
│   ├── DocumentPrintComponent.js      # Document print handler
│   ├── DocumentViewerWithComment.js   # Document viewer + comments
│   ├── GetPoliceStationModal.js       # Police station lookup
│   ├── InboxComposerHeader.js/        # Inbox components
│   │   ├── EmptyTable.js
│   │   ├── Inboxheader.js
│   │   └── RenderFields.js
│   ├── ListOfSuretyDocumentModal.js   # Surety document list
│   ├── MultiPartyAddressSelector.js   # Multi-party address selector
│   ├── NoticeSummonPartyComponent.js  # Notice/summon party config
│   ├── OrderTypeControls.js           # Order type control panel
│   ├── OrderTypeControlItem.js        # Individual order type control
│   ├── PaymentStatus.js               # Payment status display
│   ├── Print&SendDocuments.js         # Print and send workflow
│   ├── ReIssueSummonsModal.js         # Re-issue summons modal
│   ├── ReviewNoticeModal.js           # Notice review modal
│   ├── SBIPaymentStatus.js            # SBI payment status
│   ├── SelectAddreseeCustomComponent.js # Addressee selector
│   ├── SubmitBar.js                   # Submit action bar
│   ├── SummonsOrderComponent.js       # Summons order config
│   ├── Toast/ordersToast.js           # Order-specific toasts
│   ├── UpdateDeliveryStatusComponent.js # Delivery status update
│   ├── WarrantOrderComponent.js       # Warrant order config
│   └── WarrantRenderDeliveryChannels.js # Warrant delivery channels
├── configs/
│   ├── E-PostTrackingConfig.js        # E-post tracking config
│   ├── EpostFormConfigs.js            # E-post form config
│   ├── GenerateOrdersConfig.js        # Order generation config
│   ├── MakeSubmissionBailConfig.js    # Bail submission config
│   ├── OrdersHomeConfig.js            # Orders home config
│   ├── SuumonsConfig.js               # Summons config
│   ├── UICustomizations.js            # UI customization overrides
│   └── ordersCreateConfig.js          # Order creation config
├── hooks/
│   ├── index.js                       # Hook aggregator (6 services exported)
│   ├── Epost/
│   │   └── UpdateEpost.js             # E-post update hook
│   ├── SmsPayment/                    # SMS payment hooks (unauthenticated)
│   │   ├── useOpenApiDownloadFile.js
│   │   ├── useOpenApiOrderSearch.js
│   │   ├── useOpenApiPaymentProcess.js
│   │   ├── useOpenApiSummonsPaymentBreakup.js
│   │   └── useOpenApiTaskManagementSearch.js
│   ├── orders/
│   │   ├── useDocumentUpload.js       # Document upload hook
│   │   ├── useESign.js                # E-sign hook
│   │   ├── useGetPendingTask.js       # Pending task hook
│   │   ├── useSearchMiscellaneousTemplate.js # Template search
│   │   ├── useSearchOrdersNotificationService.js # Order notifications
│   │   └── useSearchOrdersService.js  # Order search hook
│   ├── services/
│   │   ├── index.js                   # 8 service objects (390 lines)
│   │   └── Urls.js                    # API endpoint URLs
│   └── useIndividualView.js
├── pageComponents/
│   ├── DeliveryChannels.js            # Delivery channel selection
│   ├── OrderReviewModal.js            # Order review modal
│   └── ... (10 more page components)
├── pages/
│   └── employee/
│       ├── index.js                   # Route definitions
│       ├── OrdersResponse.js          # Order action response
│       ├── GenerateOrdersV2.js        # Order generation (V2)
│       ├── ReviewSummonsNoticeAndWarrant.js # Summons/notice review
│       ├── PaymentForSummonModal.js    # Post payment for summons
│       ├── PaymentForRPADModal.js      # RPAD payment
│       ├── PaymentForSummonModalSMSAndEmail.js # SMS/Email payment
│       ├── SBIEpostPayment.js         # SBI e-post payment
│       ├── E-PostTracking.js          # E-post tracking page
│       ├── PaymentLoginPage.js        # Payment login (SMS flow)
│       └── SmsPaymentPage.js          # SMS payment page
└── utils/
    ├── index.js                       # Hook override & config utilities
    ├── orderWorkflow.js               # Order workflow states & actions
    └── ... (9 more utility files)
```

### Key Design Patterns
- **Workflow state machine:** `OrderWorkflowState` and `OrderWorkflowAction` enums drive order lifecycle
- **Multi-service architecture:** 8 distinct service objects (`ordersService`, `EpostService`, `schedulerService`, `taskService`, `SBIPaymentService`, `orderManagementService`, `digitalizationService`, `processManagementService`, `openApiService`)
- **Open API pattern:** SMS payment flow uses `/openapi/*` endpoints for unauthenticated access
- **Cross-module import:** Imports `MediationFormSignaturePage` directly from the dristi module package

---

## 🔀 Routing

All routes in `src/pages/employee/index.js` use `PrivateRoute`.

| Route Path | Component | Description |
|---|---|---|
| `{path}/generate-order` | `GenerateOrdersV2` | Order generation interface |
| `{path}/Summons&Notice` | `ReviewSummonsNoticeAndWarrant` | Summons/notice/warrant review |
| `{path}/payment-screen` | `PaymentStatus` | Payment status display |
| `{path}/payment-modal` | `PaymentForSummonModal` | Payment modal for summons |

### Route Guards
- All routes use `PrivateRoute` with authentication check
- Role-based redirection: Citizens → citizen home, Employees → employee home
- `PROCESS_VIEWER` role hides breadcrumbs and gets a custom home path pointing to `Summons&Notice`
- E-post users (`POST_MANAGER`) route to pending tasks

---

## 🧠 State Management

### Workflow State Machine (`utils/orderWorkflow.js`)

**OrderWorkflowState:**
| State | Description |
|---|---|
| `DRAFT_IN_PROGRESS` | Order is being drafted |
| `PENDING_BULK_E_SIGN` | Order awaiting bulk e-signature |
| `PUBLISHED` | Order has been published |
| `ABATED` | Order has been terminated |

**OrderWorkflowAction:**
| Action | Description |
|---|---|
| `SAVE_DRAFT` | Save order as draft |
| `SUBMIT_BULK_E_SIGN` | Submit for bulk e-signing |
| `ESIGN` | Individual e-sign |
| `ABANDON` | Abandon order |
| `DELETE` | Delete order |

### Global State Dependencies
- `Digit.Services.useStore` — Loads modules: `["orders", "hearings", "common", "case", "workflow"]`
- `BreadCrumbsParamsDataContext` — Case navigation context from Core

### Local State Strategy
- Custom hooks for order search, e-sign, document upload
- `react-query` for data fetching and mutations

---

## 🌐 API Integrations

### ordersService

| Method | Endpoint | Description |
|---|---|---|
| `createOrder` | `/order-management/v1/_createOrder` | Create order via management service |
| `addOrderItem` | `/order-management/v2/add-item` | Add item to order |
| `removeOrderItem` | `/order/v2/remove-item` | Remove item from order |
| `updateOrder` | `/order-management/v1/_updateOrder` | Update order |
| `searchOrder` | `/order/v1/search` | Search orders |
| `searchOrderNotifications` | `/inbox/v2/index/_search` | Search order notifications |
| `createHearings` | `/hearing/v1/create` | Create hearing from order |
| `updateHearings` | `/hearing/v1/update` | Update hearing from order |
| `customApiService` | Dynamic URL | Generic API caller |
| `getPendingTaskService` | `/inbox/v2/_getFields` | Get pending task fields |

### EpostService

| Method | Endpoint |
|---|---|
| `EpostUpdate` | `/epost-tracker/epost/v1/_updateEPost` |
| `epostUser` | MDMS search for e-post users |
| `ePostDownloadReports` | `/epost-tracker/epost/v1/download/excel` |

### schedulerService

| Method | Endpoint |
|---|---|
| `RescheduleHearing` | `/scheduler/hearing/v1/_reschedule` |

### taskService

| Method | Endpoint |
|---|---|
| `UploadTaskDocument` | `/task/v1/uploadDocument` |
| `updateTask` | `/task/v1/update` |
| `searchTask` | `/task/v1/search` |

### SBIPaymentService

| Method | Endpoint |
|---|---|
| `SBIPayment` | `/sbi-backend/payment/v1/_processTransaction` |

### orderManagementService

| Method | Endpoint |
|---|---|
| `getOrdersToSign` | `/order-management/v1/_getOrdersToSign` |
| `updateSignedOrders` | `/order-management/v1/_updateSignedOrders` |

### processManagementService

| Method | Endpoint |
|---|---|
| `getProcessToSign` | `/task/v1/_getTasksToSign` |
| `updateSignedProcess` | `/task/v1/_updateSignedTasks` |
| `bulkSend` | `/task/v1/bulk-send` |

### openApiService (unauthenticated)

| Method | Endpoint |
|---|---|
| `searchOpenApiOrders` | `/openapi/v1/getOrderDetails` |
| `createTaskManagementService` | `/openapi/task-management/v1/_create` |
| `updateTaskManagementService` | `/openapi/task-management/v1/_update` |
| `searchTaskManagementService` | `/openapi/task-management/v1/_search` |
| `getSummonsPaymentBreakup` | `/openapi/payment/v1/_calculate` |
| `getTreasuryPaymentBreakup` | `/openapi/payment/v1/_getHeadBreakDown` |
| `fetchBill` | `/openapi/payment/v1/_fetchbill` |
| `callETreasury` | `/openapi/payment/v1/_processChallan` |
| `setCaseLock` / `setCaseUnlock` | `/openapi/lock/v1/_set` / `_release` |
| `offlinePayment` | `/openapi/offline-payment/_create` |
| `addAddress` | `/openapi/v1/case/addAddress` |

---

## 🧩 Key Components

### Container Components
- **`GenerateOrdersV2`** — Order generation/drafting interface with form configuration
- **`ReviewSummonsNoticeAndWarrant`** — Summons, notices, and warrants review and dispatch
- **`PaymentForSummonModal`** — Payment processing for summon delivery (post)
- **`PaymentForRPADModal`** — RPAD payment processing
- **`PaymentForSummonModalSMSAndEmail`** — SMS/email/iCOPS payment processing
- **`SBIEpostPayment`** — SBI e-post payment flow
- **`EpostTrackingPage`** — E-post delivery tracking dashboard
- **`SmsPaymentPage`** — Unauthenticated SMS payment page (for summons recipients)

### Globally Registered Components
- **`OrdersModule`** — Main module component
- **`DeliveryChannels`** — Delivery channel selection component
- **`OrderWorkflowActionEnum`** / **`OrderWorkflowStateEnum`** — Workflow constants
- **`OrdersService`** — Service object for external use
- **`OrderReviewModal`** — Order review and approval modal
- **`SummonsOrderComponent`** — Summons-specific order form
- **`WarrantOrderComponent`** — Warrant-specific order form
- **`ReIssueSummonsModal`** — Re-issue summons modal
- **`SBIPaymentStatus`** — SBI payment status display
- **`OrderTypeControls` / `OrderTypeControlItem`** — Order type selection UI
- **`PaymentLoginPage`** / **`SmsPaymentPage`** — Unauthenticated payment pages
- **`MediationFormSignaturePage`** — Mediation form e-sign (imported from dristi)

---

## 🔄 Data Flow

```
Order Creation Flow:
  Judge/Clerk → GenerateOrdersV2
    → ordersService.createOrder() → API: /order-management/v1/_createOrder
    → Draft editing → ordersService.updateOrder()
    → E-sign → /e-sign-svc/v1/_esign
    → ordersService.updateOrder() (PUBLISHED)
    → Success

Summons Payment Flow (SMS - unauthenticated):
  Recipient receives SMS → PaymentLoginPage → SmsPaymentPage
    → openApiService.searchOpenApiOrders() → API: /openapi/v1/getOrderDetails
    → openApiService.getSummonsPaymentBreakup() → API: /openapi/payment/v1/_calculate
    → openApiService.callETreasury() → API: /openapi/payment/v1/_processChallan
    → Payment processed → Status displayed
```

---

## 🔗 Dependencies

### Internal Module Dependencies
- `@egovernments/digit-ui-module-core` — `BreadCrumbsParamsDataContext`
- `@egovernments/digit-ui-module-dristi` — `MediationFormSignaturePage` (direct package import)

### External Library Dependencies
| Library | Version | Purpose |
|---|---|---|
| `react` | 17.0.2 | UI framework |
| `react-router-dom` | 5.3.0 | Routing |
| `react-hook-form` | 6.15.8 | Form management |
| `react-i18next` | 11.16.2 | i18n |
| `react-query` | 3.6.1 | Data fetching |
| `react-tooltip` | 4.1.2 | Tooltips |
| `@egovernments/digit-ui-react-components` | 1.8.2-beta.11 | Shared UI |
| `@egovernments/digit-ui-components` | 0.0.2-beta.1 | Design system |
| `@egovernments/digit-ui-module-core` | 1.8.1-beta.6 | Core module |

---

## ⚙️ Configuration

- **`configs/GenerateOrdersConfig.js`** — Order generation form configuration
- **`configs/ordersCreateConfig.js`** — Order creation form config
- **`configs/SuumonsConfig.js`** — Summons form config (typo: should be `SummonsConfig`)
- **`configs/E-PostTrackingConfig.js`** — E-post tracking table/filter config
- **`configs/OrdersHomeConfig.js`** — Orders home page config
- **`configs/MakeSubmissionBailConfig.js`** — Bail submission from orders
- **Module codes loaded:** `["orders", "hearings", "common", "case", "workflow"]`

---

## 🧪 Testing

- No explicit test files found in the module.
- **Missing test areas:** Order workflow state transitions, payment flows (all channels), e-post tracking, open API endpoints, service layer (8 service objects), delivery channel selection.

---

## 🚨 Known Risks / Observations

1. **8 service objects in a single file:** `hooks/services/index.js` (390 lines) defines `ordersService`, `EpostService`, `schedulerService`, `taskService`, `SBIPaymentService`, `orderManagementService`, `digitalizationService`, `processManagementService`, and `openApiService` — should be split into separate files.
2. **Cross-module direct import:** `MediationFormSignaturePage` is imported from `@egovernments/digit-ui-module-dristi/src/pages/employee/AdmittedCases/MediationFormSignaturePage` — accessing internal module source directly.
3. **Typo in config filename:** `SuumonsConfig.js` (should be `SummonsConfig.js`).
4. **`InboxComposerHeader.js/` directory confusion:** This path contains `.js` in the directory name, which is unconventional and may cause tooling issues.
5. **`useCache: true` on mutation-like endpoints:** Some services like `EpostUpdate`, `UploadTaskDocument`, `updateTask` use `useCache: true` which is incorrect for write operations.
6. **`localStorage` usage for judge/court IDs:** `ordersService.createHearings` reads `judgeId` and `courtId` from `localStorage` directly — fragile and not type-safe.
7. **`PROCESS_VIEWER` role special-casing:** Breadcrumbs and home path are conditionally modified for this role, adding complexity.
