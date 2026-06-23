# AdmittedCaseV2.js Integration Guide

## Overview

This guide documents how to integrate all extracted hooks and components back into AdmittedCaseV2.js.

## Completed Extractions

### Custom Hooks (in `hooks/` directory)

1. **useOrderActions** - Order creation, scheduling, draft order logic
2. **useCitizenActions** - Citizen-specific actions
3. **useEmployeeActions** - Employee-specific actions
4. **useUserContext** - User info, roles, permissions (already existed)
5. **useCaseParties** - Litigants, representatives extraction (already existed)
6. **useApplicationFilters** - Application filtering (already existed)
7. **useInboxData** - Inbox fetching (already existed)
8. **useEvidenceActions** - Evidence mutations (already existed)
9. **useHearingNavigation** - Hearing navigation (already existed)
10. **useToast** - Toast notifications (already existed)

### Modal Components (in `components/` directory)

1. **CalendarModal** - Calendar view modal
2. **BailBondModal** - Bail bond creation/exists modal
3. **DismissCaseModal** - Dismiss case confirmation
4. **PendingDelayModal** - Pending delay condonation modal

### Layout Components (in `components/` directory)

1. **CaseHeader** - Case title, action buttons, tabs
2. **CaseActionBar** - Take action buttons and menus
3. **CaseDetailsStrip** - Case details strip (CMP, court case number, etc.)
4. **CaseTabContent** - Tab content rendering area

### Utils (in `utils/` directory)

1. **constants.js** - All constants
2. **caseDataProcessingUtils.js** - Data transformation utilities
3. **partyUtils.js** - Party name utilities
4. **actionOptionsUtils.js** - Action options utilities
5. **permissionMappings.js** - Permission and action options mapping
6. **breadcrumbUtils.js** - Breadcrumb and advocate name utilities
7. **partyFilterUtils.js** - Party filtering utilities
8. **modalConfigUtils.js** - Modal configuration utilities
9. **caseInfoUtils.js** - Case info building utilities
10. **tabConfigUtils.js** - Tab configuration utilities
11. **advocateClerkUtils.js** - Advocate/clerk membership utilities
12. **caseSubmissionUtils.js** - Case submission handling utilities
13. **deleteHandlers.js** - Delete operation handlers
14. **bailBondUtils.js** - Bail bond utilities
15. **componentUtils.js** - Heading, CloseBtn components
16. **pdfDownloadUtils.js** - PDF download utilities
17. **toastUtils.js** - Toast helper utilities

## Integration Steps for AdmittedCaseV2.js

### Step 1: Update Imports

**Add these imports at the top of AdmittedCaseV2.js:**

```javascript
// Import extracted hooks
import { useOrderActions, useCitizenActions, useEmployeeActions } from "./hooks";

// Import extracted components
import { CalendarModal, DismissCaseModal, PendingDelayModal, CaseHeader, CaseTabContent } from "./components";

// Import extracted utils (if not already imported)
import {
  stateSla,
  delayCondonationTextStyle,
  HearingWorkflowState,
  homeTabEnum,
  actionEnabledStatuses,
  viewEnabledStatuses,
  judgeReviewStages,
} from "./utils/constants";
```

### Step 2: Replace Inline Constants

**Removed inline constants (already done):**

- stateSla
- delayCondonationStylsMain / delayCondonationTextStyle
- HearingWorkflowState
- homeTabEnum
- actionEnabledStatuses
- viewEnabledStatuses
- judgeReviewStages
- `Heading` and `CloseBtn` inline components (moved to `utils/componentUtils.js`)

All now imported from `utils/constants.js` or the respective util files.

### Step 3: Initialize Extracted Hooks

**Add hook initialization after existing hooks (around line 2500):**

```javascript
// Initialize order actions hook
const { handleScheduleNextHearing, handleSelect, openHearingModule } = useOrderActions({
  tenantId,
  caseDetails,
  updatedCaseDetails,
  cnrNumber,
  filingNumber,
  caseId,
  activeTab,
  currentInProgressHearing,
  ordersService,
  OrderWorkflowAction,
  showToast,
  t,
  todayDate,
  stateSla,
  setApiCalled,
  openHearingModule: () => {}, // Will be defined by the hook
  isCaseAdmitted,
  setCreateAdmissionOrder,
  setShowScheduleHearingModal,
});

// Initialize citizen actions hook
const { handleCitizenAction } = useCitizenActions({
  tenantId,
  filingNumber,
  complainantsList,
  isCitizen,
  authorizedUuid,
  courtId,
  setApiCalled,
  showToast,
});

// Initialize employee actions hook
const { handleEmployeeAction } = useEmployeeActions({
  filingNumber,
  customNextHearing,
  handleCourtAction,
  handleSelect,
  handleCaseTransition,
  setShowDownloadCasePdfModal,
  setShowCalendarModal,
  setShowEndHearingModal,
  setShowWitnessModal,
  setShowExaminationModal,
  setShowPaymentDemandModal,
  setShowAllStagesModal,
  setShowBailBondModal,
  setShowAddWitnessModal,
});
```

### Step 4: Replace Header Section JSX

**Replace lines 3462-3773 with:**

```javascript
<CaseHeader
  t={t}
  caseApiLoading={caseApiLoading}
  isCaseFetching={isCaseFetching}
  caseDetails={caseDetails}
  showJoinCase={showJoinCase}
  showMakeSubmission={showMakeSubmission}
  isCitizen={isCitizen}
  showTakeAction={showTakeAction}
  isTabDisabled={isTabDisabled}
  showMenu={showMenu}
  showCitizenMenu={showCitizenMenu}
  showOtherMenu={showOtherMenu}
  citizenActionOptions={citizenActionOptions}
  allowedTakeActionOptions={allowedTakeActionOptions}
  allowedEmployeeActionOptions={allowedEmployeeActionOptions}
  currentInProgressHearing={currentInProgressHearing}
  hasHearingPriorityView={hasHearingPriorityView}
  hasHearingEditAccess={hasHearingEditAccess}
  userRoles={userRoles}
  isJudge={isJudge}
  hideNextHearingButton={hideNextHearingButton}
  apiCalled={apiCalled}
  homeNextHearingFilter={homeNextHearingFilter}
  JoinCaseHome={JoinCaseHome}
  advocateName={advocateName}
  delayCondonationData={delayCondonationData}
  isDelayApplicationCompleted={isDelayApplicationCompleted}
  isDelayApplicationPending={isDelayApplicationPending}
  hasAnyRelevantOrderType={hasAnyRelevantOrderType}
  tabData={tabData}
  handleTakeAction={handleTakeAction}
  handleCitizenAction={handleCitizenAction}
  handleEmployeeAction={handleEmployeeAction}
  handleSelect={handleSelect}
  setShowCitizenMenu={setShowCitizenMenu}
  setShowMenu={setShowMenu}
  setShowJoinCase={setShowJoinCase}
  setShowDownloadCasePdfModal={setShowDownloadCasePdfModal}
  setShowAllStagesModal={setShowAllStagesModal}
  setShowOtherMenu={setShowOtherMenu}
  onTabChange={onTabChange}
  handleAllNoticeGeneratedForHearing={handleAllNoticeGeneratedForHearing}
/>
```

### Step 5: Replace Tab Content Section JSX

**Replace lines 3774-3852 with:**

```javascript
<CaseTabContent
  t={t}
  config={config}
  caseRelatedData={caseRelatedData}
  setUpdateCounter={setUpdateCounter}
  openDraftModal={openDraftModal}
  openSubmissionViewModal={openSubmissionViewModal}
  showMakeSubmission={showMakeSubmission}
  userRoles={userRoles}
  isCitizen={isCitizen}
  setShowAddWitnessModal={setShowAddWitnessModal}
  handleSelect={handleSelect}
  handleMakeSubmission={handleMakeSubmission}
  handleSubmitDocuments={handleSubmitDocuments}
  tabData={tabData}
  activeTab={activeTab}
  documentsInboxSearch={documentsInboxSearch}
  inboxComposer={inboxComposer}
  showActionBar={showActionBar}
  viewActionBar={viewActionBar}
  MemoCaseOverview={MemoCaseOverview}
  memoisedCaseComplaintTab={memoisedCaseComplaintTab}
  caseDetails={caseDetails}
  tenantId={tenantId}
  filingNumber={filingNumber}
/>
```

### Step 6: Replace Modal JSX

**Replace calendar modal (lines 4047-4067) with:**

```javascript
<CalendarModal t={t} showCalendarModal={showCalendarModal} setShowCalendarModal={setShowCalendarModal} />
```

**Replace bail bond modal (lines 4239-4268) with:**

```javascript
<BailBondModal
  t={t}
  showBailBondModal={showBailBondModal}
  setShowBailBondModal={setShowBailBondModal}
  isBailBondTaskExists={isBailBondTaskExists}
  createBailBondTask={createBailBondTask}
  bailBondLoading={bailBondLoading}
/>
```

**Replace dismiss case modal (lines 3963-3986) with:**

```javascript
<DismissCaseModal
  t={t}
  showDismissCaseConfirmation={showDismissCaseConfirmation}
  setShowDismissCaseConfirmation={setShowDismissCaseConfirmation}
  handleActionModal={handleActionModal}
/>
```

**Replace pending delay modal (lines 3987-4003) with:**

```javascript
<PendingDelayModal t={t} showPendingDelayApplication={showPendingDelayApplication} setShowPendingDelayApplication={setShowPendingDelayApplication} />
```

### Step 7: Remove Duplicate Functions

**Remove these functions that are now in hooks:**

- `handleCitizenAction` (lines 2327-2385) - Now in useCitizenActions
- `handleEmployeeAction` (lines 2503-2545) - Now in useEmployeeActions
- `handleSelect` (lines 2554-2733) - Now in useOrderActions
- `handleScheduleNextHearing` (lines 2006-2072) - Now in useOrderActions

### Step 8: Clean Up

1. Remove unused imports
2. Remove duplicate constant definitions
3. Verify all state variables are still needed
4. Check for any remaining inline JSX that could be extracted

## Integration Status: Complete

All steps have been applied to `AdmittedCaseV2.js`. Build passes successfully.

## File Size Results

- **Before**: 4,356 lines, 165 KB
- **After**: Significantly reduced main file, with logic spread across hooks, components, and utils
- **Extracted files**: 28+ files across hooks, components, and utils

## Testing Checklist

After integration, test these scenarios:

1. ✅ Case header displays correctly
2. ✅ Action buttons work (citizen and employee)
3. ✅ Tab navigation works
4. ✅ Modals open and close correctly
5. ✅ Calendar modal displays
6. ✅ Bail bond modal works
7. ✅ Dismiss case confirmation works
8. ✅ All hooks function correctly
9. ✅ No console errors
10. ✅ All existing functionality preserved

## Notes

- This is a **pure structural refactoring** - no logic changes
- All behavior remains identical
- Better code organization and maintainability
- Easier to test individual components
- Reusable components and hooks
