# Hearings Module

## 📌 Overview

The **Hearings** module (`@egovernments/digit-ui-module-hearings`) manages the complete hearing lifecycle — scheduling, calendar views, in-hearing actions, hearing transcription, attendance tracking, adjournment, evidence presentation, witness depositions, and bulk rescheduling. It provides both the calendar-based overview and the inside-hearing management interface.

**Business Purpose:**
- Display monthly calendar view of scheduled hearings
- Manage inside-hearing workflows (attendance, transcripts, evidence, witnesses)
- Handle hearing adjournment and end-hearing flows
- Bulk reschedule hearings across multiple cases
- Manage summons, warrants, and notice process flows
- Track witness depositions and diary entries

**Where it is used:**
- Rendered under `/{contextPath}/employee/hearings/*`
- `HearingsCalendar` (MonthlyCalendar) is globally registered and used in the home module
- `SummonsAndWarrantsModal`, `CustomDatePicker`, `NoticeProcessModal` are globally registered for cross-module use

---

## 🏗 Architecture

### Entry Point
- `src/Module.js` — Exports `HearingsModule` (main component) and `initHearingsComponents` (initialization function)

### Folder Structure
```
src/
├── Module.js                          # Entry, component registration
├── components/
│   ├── Accordian.js                   # Accordion component
│   ├── BreadCrumbHearings.js          # Custom breadcrumb for hearings
│   ├── BulkRescheduleModal.js         # Bulk reschedule modal
│   ├── BulkRescheduleTable.js         # Bulk reschedule data table
│   ├── CustomDatePicker.js            # Date picker component
│   ├── CustomDatePickerV2.js          # Date picker v2
│   ├── HearingOverlayDropdown.js      # Hearing action overlay
│   ├── HearingsCard.js                # Dashboard card
│   ├── NextHearingModal.js            # Next hearing scheduling modal
│   ├── PreHearingModal.js             # Pre-hearing preparation modal
│   ├── SummaryModal.js                # Hearing summary modal
│   ├── TaskComponent.js               # Task item component
│   ├── TaskComponentCalander.js       # Calendar task component
│   ├── UpComingHearing.js             # Upcoming hearings widget
│   └── WitnessModal.js                # Witness management modal
├── configs/
│   ├── AddNewPartyConfig.js           # Add new party form config
│   ├── AddWitnessConfig.js            # Add witness form config
│   ├── HearingsHomeConfig.js          # Hearings home page config
│   ├── MakeSubmissionConfig.js        # Make submission from hearing config
│   ├── PreHearingConfig.js            # Pre-hearing form config
│   ├── SummonsNWarrantConfig.js       # Summons & warrant config
│   └── UICustomizations.js            # UI customization overrides
├── hooks/
│   ├── index.js                       # Hook aggregator
│   ├── hearings/
│   │   ├── useGetAvailableDates.js    # Judge availability dates
│   │   ├── useGetHearingCounts.js     # Hearing count aggregation
│   │   ├── useGetHearingLink.js       # Hearing join link
│   │   ├── useGetHearings.js          # Hearing search
│   │   ├── useGetTaskList.js          # Task list for hearings
│   │   └── useUpdateHearingsService.js # Hearing update mutation
│   ├── services/
│   │   ├── index.js                   # hearingService (API wrappers)
│   │   ├── Urls.js                    # API endpoint URLs
│   │   ├── downloadHearingPDF.js      # PDF download service
│   │   └── searchHearings.js          # Hearing search service
│   ├── useGetHearingSlotMetaData.js   # Hearing slot metadata
│   ├── useIndividualView.js           # Individual data hook
│   └── usePreHearingModalData.js      # Pre-hearing modal data
├── pages/
│   └── employee/
│       ├── index.js                   # Route definitions
│       ├── CalendarView.js            # Monthly calendar view (MonthlyCalendar)
│       ├── InsideHearingMainPage.js   # In-hearing management
│       ├── AdjournHearing.js          # Adjourn hearing flow
│       ├── EndHearing.js              # End hearing flow
│       ├── AddAttendees.js            # Attendee management
│       ├── AddParty.js                # Add party to hearing
│       ├── AddWitnessModal.js         # Add witness dialog
│       ├── BulkReschedule.js          # Bulk reschedule page
│       ├── DisplayAttendees.js        # Attendee display
│       ├── EvidenceHeader.js          # Evidence section header
│       ├── HearingSideCard.js         # Side panel for hearing
│       ├── HearingsResponse.js        # Hearing action response
│       ├── NoticeProcessModal.js      # Notice process management
│       ├── SummonsAndWarrantsModal.js  # Summons/warrants management
│       └── CustomSVGs.js              # Custom SVG icons
└── utils/
    ├── index.js                       # Hook override & config utilities
    └── ... (1 more file)
```

### Key Design Patterns
- **Calendar-centric UI:** FullCalendar library drives the scheduling view
- **In-hearing state machine:** InsideHearingMainPage manages hearing state transitions (START → IN_PROGRESS → END/ADJOURN)
- **Component registry sharing:** `SummonsAndWarrantsModal`, `NoticeProcessModal` are registered globally for use in the home module
- **Breadcrumb context consumption:** Uses `BreadCrumbsParamsDataContext` from Core for case-aware breadcrumbs

---

## 🔀 Routing

All routes in `src/pages/employee/index.js` use `PrivateRoute` (authentication required).

| Route Path | Component | Description |
|---|---|---|
| `{path}/inside-hearing` | `InsideHearingMainPage` | Active hearing management page |
| `{path}/end-hearing` | `EndHearing` | End hearing workflow |
| `{path}/adjourn-hearing` | `AdjournHearing` | Adjourn hearing workflow |
| `{path}/` (exact) | `MonthlyCalendar` | Calendar view of hearings |

### Route Guards
- All routes use `PrivateRoute` requiring authentication
- Role-based redirection: Citizens → citizen home, employees → employee home/home-screen
- E-post users (`POST_MANAGER` role) are redirected to pending task home

---

## 🧠 State Management

### Redux Slices
No dedicated Redux slices. Relies on common store from Core.

### Global State Dependencies
- `Digit.Services.useStore` — Loads modules: `["hearings", "case", "common", "workflow"]`
- `BreadCrumbsParamsDataContext` — Case navigation context from Core
- `Digit.UserService` — Authentication and role detection

### Local State Strategy
- `useState` for hearing step management, modal visibility, attendee lists
- `react-query` via custom hooks for hearing data fetching and mutations

---

## 🌐 API Integrations

### hearingService

| Service Method | Endpoint | Description |
|---|---|---|
| `searchHearings` | `/hearing/v1/search` | Search hearings |
| `updateHearings` | `/hearing/v1/update` | Update hearing details |
| `updateHearingTranscript` | `/hearing/v1/update_transcript_additional_attendees` | Update transcript & attendees |
| `startHearing` | `/hearing/v1/update` (action: START) | Start a hearing |
| `searchHearingCount` | `/hearing-management/hearing/v1/search` | Get hearing counts |
| `searchTaskList` | `/task/v1/search` | Search tasks for hearing |
| `generateWitnessDepostionDownload` | `/hearing/witnessDeposition/v1/downloadPdf` | Download witness deposition PDF |
| `bulkReschedule` | `/hearing/v1/bulk/_reschedule` | Bulk reschedule hearings |
| `updateBulkHearing` | `/hearing/v1/bulk/_update` | Bulk update hearings |
| `addBulkDiaryEntries` | `/ab-diary/case/diary/v1/bulkEntry` | Add bulk diary entries |
| `createNotification` | `/notification/v1/_create` | Create notification |
| `updateNotification` | `/notification/v1/_update` | Update notification |
| `searchNotification` | `/notification/v1/_search` | Search notifications |
| `aDiaryEntryUpdate` | `/ab-diary/case/diary/entry/v1/update` | Update diary entry |
| `customApiService` | Dynamic URL | Generic API caller |

### Additional Endpoints
| Endpoint | Usage |
|---|---|
| `/order/v1/create` | Create orders from hearing context |
| `/case/v1/_search` | Search cases related to hearings |
| `/scheduler/causelist/v1/_download` | Download cause list |
| `/egov-pdf/hearing` | Generate hearing notification PDF |

---

## 🧩 Key Components

### Container Components
- **`MonthlyCalendar` (CalendarView.js)** — Full-month calendar view using FullCalendar library, showing hearing schedules
- **`InsideHearingMainPage`** — Active hearing management: transcript, attendees, evidence, witness depositions
- **`EndHearing`** — End-hearing workflow with summary and next-hearing scheduling
- **`AdjournHearing`** — Hearing adjournment with reason capture

### Globally Registered Components
- **`HearingsCalendar`** — MonthlyCalendar component, available for home module
- **`SummonsAndWarrantsModal`** — Summons and warrants issuance modal
- **`CustomDatePicker`** — Reusable date picker
- **`NoticeProcessModal`** — Notice process management modal

### Presentational Components
- **`HearingsCard`** — Dashboard card for hearings module
- **`PreHearingModal`** — Pre-hearing preparation checklist
- **`NextHearingModal`** — Schedule next hearing date
- **`WitnessModal`** — Witness examination management
- **`BulkRescheduleModal` / `BulkRescheduleTable`** — Bulk operation UI
- **`UpComingHearing`** — Widget showing upcoming hearings

---

## 🔄 Data Flow

```
Calendar View:
  User → MonthlyCalendar
    → useGetHearings() → API: /hearing/v1/search
    → Calendar renders events
    → User clicks hearing → navigates to inside-hearing

Inside Hearing:
  User → InsideHearingMainPage
    → hearingService.startHearing() → API: /hearing/v1/update (START)
    → Transcript recording, attendee marking
    → hearingService.updateHearingTranscript() → API: /hearing/v1/update_transcript_additional_attendees
    → End Hearing / Adjourn Hearing
    → hearingService.updateHearings() → API: /hearing/v1/update
```

---

## 🔗 Dependencies

### Internal Module Dependencies
- `@egovernments/digit-ui-module-core` — `BreadCrumbsParamsDataContext` context

### External Library Dependencies
| Library | Version | Purpose |
|---|---|---|
| `react` | 17.0.2 | UI framework |
| `react-router-dom` | 5.3.0 | Routing |
| `react-i18next` | 11.16.2 | i18n |
| `react-query` | 3.6.1 | Data fetching |
| `@fullcalendar/core` | ^6.1.14 | Calendar core |
| `@fullcalendar/daygrid` | ^6.1.14 | Day grid plugin |
| `@fullcalendar/interaction` | ^6.1.14 | Calendar interactions |
| `@fullcalendar/react` | ^6.1.14 | React wrapper |
| `@fullcalendar/timegrid` | ^6.1.14 | Time grid plugin |
| `@egovernments/digit-ui-react-components` | 1.8.2-beta.9 | Shared UI |
| `@egovernments/digit-ui-components` | 0.0.2-beta.1 | Design system |
| `@egovernments/digit-ui-module-core` | 1.8.1-beta.6 | Core module |

---

## ⚙️ Configuration

- **`configs/HearingsHomeConfig.js`** — Hearing home page configuration
- **`configs/PreHearingConfig.js`** — Pre-hearing checklist/form config
- **`configs/AddWitnessConfig.js`** — Witness addition form config
- **`configs/SummonsNWarrantConfig.js`** — Summons and warrant form config
- **`configs/UICustomizations.js`** — UI customization overrides
- Module codes loaded: `["hearings", "case", "common", "workflow"]`

---

## 🧪 Testing

- No explicit test files found in the module.
- `searchTestResultData.js` exists in `hooks/services/` but appears to be test data fixture, not actual test coverage.
- **Missing test areas:** Calendar rendering, hearing lifecycle, bulk reschedule, transcript management, witness deposition flow.

---

## 🚨 Known Risks / Observations

1. **Typo in filename:** `TaskComponentCalander.js` (should be `TaskComponentCalendar.js`)
2. **FullCalendar version upgrade risk:** Using v6.1.14 of FullCalendar which is a major dependency — calendar library upgrades can be breaking.
3. **Cross-module component usage:** `SummonsAndWarrantsModal` is used by the home module via component registry, but the source lives in hearings — changes here affect home module workflows.
4. **Breadcrumb context tight coupling:** Module directly imports `BreadCrumbsParamsDataContext` from `@egovernments/digit-ui-module-core`.
5. **No dedicated citizen routes:** The module only has employee routes. Citizen access to hearing data happens through the dristi module's admitted case viewer.
