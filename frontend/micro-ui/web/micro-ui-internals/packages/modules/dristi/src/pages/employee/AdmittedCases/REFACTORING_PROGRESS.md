# AdmittedCaseV2.js Refactoring Progress

## Current Status: All Phases Complete

### ✅ Completed Work

#### Phase 1: Constants & Utils (COMPLETE)

All constants and utility functions have been extracted to:

- `utils/constants.js` - stateSla, styles, HearingWorkflowState, homeTabEnum, etc.
- `utils/caseDataProcessingUtils.js` - getStatue(), getLitigants(), getComplainants(), getRespondents(), getWitnesses(), getShowMakeSubmission(), etc.
- `utils/partyUtils.js` - removeInvalidNameParts(), getFormattedName(), constructFullName()
- `utils/actionOptionsUtils.js` - action options configuration
- `utils/permissionMappings.js` - citizenActionOptions, employeeActionsPermissionsMapping, filterActionsByPermissions()
- `utils/breadcrumbUtils.js` - getEmployeeCrumbs(), getAdvocateName()
- `utils/partyFilterUtils.js` - getPipComplainants(), getPipAccuseds(), getComplainantsList()
- `utils/modalConfigUtils.js` - getDcaConfirmModalConfig(), getVoidModalConfig()
- `utils/caseInfoUtils.js` - getCaseInfo()
- `utils/tabConfigUtils.js` - getTabConfig()
- `utils/advocateClerkUtils.js` - getPopupForJuniorAdvocate(), getIsMemberPartOfCase()
- `utils/caseSubmissionUtils.js` - handleCaseAdmittedSubmit(), handleAdmitDismissCaseOrderUtil()
- `utils/deleteHandlers.js` - handleDeleteApplication(), handleDeleteOrder()
- `utils/bailBondUtils.js` - createBailBondTask()
- `utils/caseSubmissionUtils.js` - submission handling utilities
- `utils/componentUtils.js` - Heading, CloseBtn components
- `utils/pdfDownloadUtils.js` - PDF download utilities
- `utils/toastUtils.js` - toast helper utilities
- `utils/index.js` - Barrel export file

#### Phase 2: Custom Hooks (COMPLETE)

The following hooks have been created in `hooks/` directory:

- ✅ `useUserContext.js` - User info, roles, permissions (already existed)
- ✅ `useCaseParties.js` - Litigants, representatives extraction (already existed)
- ✅ `useApplicationFilters.js` - Application filtering logic (already existed)
- ✅ `useInboxData.js` - Inbox fetching logic (already existed)
- ✅ `useEvidenceActions.js` - Evidence mutations (already existed)
- ✅ `useHearingNavigation.js` - Hearing navigation logic (already existed)
- ✅ `useToast.js` - Toast notifications (already existed)
- ✅ `useOrderActions.js` - Order creation, schedule hearing logic (NEW)
- ✅ `useCitizenActions.js` - Citizen action handlers (NEW)
- ✅ `useEmployeeActions.js` - Employee action handlers (NEW)
- `hooks/index.js` - Updated barrel export

#### Phase 3: Modal Components (COMPLETE)

The following modal components have been created in `components/` directory:

- ✅ `CalendarModal.js` - Calendar view modal
- ✅ `BailBondModal.js` - Bail bond creation/exists modal
- ✅ `DismissCaseModal.js` - Dismiss case confirmation
- ✅ `PendingDelayModal.js` - Pending delay condonation modal
- ✅ `DownloadCasePdfModal.js` - Already exists in AdmittedCases folder
- ✅ `EndHearingModal.js` - Already exists in AdmittedCases folder
- `components/index.js` - Barrel export file

### ✅ All Remaining Work Completed

#### Phase 4: Layout Components (COMPLETE)

All layout components extracted to `components/` directory:

- ✅ `CaseHeader.js` - Case title, action buttons, tabs
- ✅ `CaseDetailsStrip.js` - Case details strip
- ✅ `CaseActionBar.js` - Take action buttons and menus
- ✅ `CaseTabContent.js` - Tab content rendering area

#### Phase 5: Integration & Final Cleanup (COMPLETE)

- ✅ All extracted hooks imported and used in `AdmittedCaseV2.js`
- ✅ All extracted components imported and used
- ✅ Inline constants removed; all imported from `utils/constants.js`
- ✅ `Heading`/`CloseBtn` inline components removed (moved to `utils/componentUtils.js`)
- ✅ Toast imports removed from main file (handled by extracted utils)
- ✅ `removeInvalidNameParts` unused import removed from `AdmittedCaseV2.js`
- ✅ Build passes successfully

### 📊 File Size Reduction

**Before Refactoring:**

- AdmittedCaseV2.js: 4,356 lines, 165 KB

**Target State:**

- AdmittedCaseV2.js: ~400-500 lines
- Supporting files: ~2,000 lines across hooks, utils, and components

**Benefits:**

- Better code organization
- Easier maintenance
- Improved testability
- Better separation of concerns
- Reusable components and hooks

### ⚠️ Important Notes

1. **No Logic Changes**: This is a pure structural refactoring - all behavior stays identical
2. **Incremental Approach**: Each extraction should result in a working application
3. **Import Management**: Ensure all imports are updated correctly
4. **Testing**: Test thoroughly after each major extraction
5. **Dependencies**: Some hooks depend on others - maintain proper dependency order

### 🔧 Tools Created

**Hooks:**

- useOrderActions - Handles order creation and scheduling
- useCitizenActions - Handles citizen-specific actions
- useEmployeeActions - Handles employee-specific actions

**Components:**

- CalendarModal - Reusable calendar modal
- BailBondModal - Reusable bail bond modal
- DismissCaseModal - Reusable dismiss confirmation modal
- PendingDelayModal - Reusable pending delay modal

**Utils:**

- All constants centralized
- Data transformation utilities
- Party extraction utilities
- Action options utilities
