# Common Module Refactoring Summary

## Overview

Successfully created a new `common` module to consolidate duplicate utility functions across the orders, submissions, and hearings modules. This eliminates code duplication and ensures bug fixes and behavioral changes only need to be applied in one place.

## Changes Made

### 1. Created Common Module Structure

**Location:** `micro-ui-internals/packages/modules/common/`

**Files Created:**

- `src/Module.js` - Module initialization and component registration (ENTRY POINT)
- `src/utils/caseUtils.js` - Contains `getAllAssignees()` and `getAdvocates()` functions
- `src/utils/index.js` - Contains `getFormattedName()` function and re-exports from caseUtils
- `package.json` - Module package configuration with `"source": "src/Module.js"`

**Directory Structure:**

```
common/
├── package.json
└── src/
    ├── Module.js
    ├── components/
    ├── hooks/
    └── utils/
        ├── caseUtils.js
        └── index.js
```

### 2. Registered Common Module

**File:** `package.json:21` (in micro-ui/web)

- Added `"@egovernments/digit-ui-module-common": "0.0.1"` to dependencies

**File:** `src/App.js:8,39` (in micro-ui/web)

- Imported `initCommonComponents` from common module
- Added `initCommonComponents()` call in `initDigitUI()` function

### 3. Updated Orders Module

**File:** `packages/modules/orders/src/utils/caseUtils.js:1`

- **Removed:** 54 lines of duplicate code (getAllAssignees and getAdvocates functions)
- **Added:** Single export statement importing from common module

**File:** `packages/modules/orders/src/utils/index.js:6,103`

- **Added:** Import statement for getFormattedName from common module
- **Removed:** 10 lines of duplicate getFormattedName function
- **Added:** Re-export statement for getFormattedName

### 4. Updated Submissions Module

**File:** `packages/modules/submissions/src/utils/caseUtils.js:1`

- **Removed:** 54 lines of duplicate code (getAllAssignees and getAdvocates functions)
- **Added:** Single export statement importing from common module

**File:** `packages/modules/submissions/src/utils/index.js:5,132`

- **Added:** Import statement for getFormattedName from common module
- **Removed:** 10 lines of duplicate getFormattedName function
- **Added:** Re-export statement for getFormattedName

### 5. Updated Hearings Module

**File:** `packages/modules/hearings/src/utils/index.js:4,46`

- **Added:** Import statement for getFormattedName from common module
- **Removed:** 9 lines of duplicate getFormattedName function
- **Added:** Re-export statement for getFormattedName

## Functions Consolidated

### 1. `getAllAssignees(caseDetails, getAdvocates, getLitigent)`

- **Previously duplicated in:** orders/caseUtils.js, submissions/caseUtils.js
- **Now located in:** common/src/utils/caseUtils.js
- **Lines saved:** 31 lines × 2 duplicates = 62 lines

### 2. `getAdvocates(caseDetails)`

- **Previously duplicated in:** orders/caseUtils.js, submissions/caseUtils.js
- **Now located in:** common/src/utils/caseUtils.js
- **Lines saved:** 22 lines × 2 duplicates = 44 lines

### 3. `getFormattedName(firstName, middleName, lastName, designation, partyTypeLabel)`

- **Previously duplicated in:** orders/index.js, submissions/index.js, hearings/index.js
- **Now located in:** common/src/utils/index.js
- **Lines saved:** 10 lines × 3 duplicates = 30 lines

## Benefits

1. **Single Source of Truth:** All three utility functions now have a single implementation
2. **Easier Maintenance:** Bug fixes only need to be applied once in the common module
3. **Consistency:** Ensures all modules use identical logic
4. **Reduced Code Duplication:** Eliminated ~136 lines of duplicate code
5. **Better Organization:** Common utilities are now in a dedicated module

## Next Steps

To complete the integration, run the following commands:

```bash
# Navigate to the web directory
cd micro-ui/web

# Install dependencies (this will link the new common module)
yarn install

# Build the libraries
yarn build:libraries

# Start the development server to test
yarn start
```

## Testing Checklist

After running the build, verify the following:

- [ ] Orders module loads without errors
- [ ] Submissions module loads without errors
- [ ] Hearings module loads without errors
- [ ] Functions that use `getAllAssignees()` work correctly
- [ ] Functions that use `getAdvocates()` work correctly
- [ ] Functions that use `getFormattedName()` work correctly
- [ ] No console errors related to missing imports

## Notes

- All lint errors shown during the refactoring are pre-existing issues (using `.map()` instead of `.forEach()` in overrideHooks functions)
- The common module follows the same structure and patterns as other modules in the project
- The module is registered in the component registry and initialized before other domain modules
- **Important:** All modules in this project use `src/Module.js` as the entry point (not `src/index.js`). The package.json specifies `"source": "src/Module.js"` and the build tool generates `dist/index.js` from this entry point
- The common module was built with `yarn build` to generate dist files, and dependencies were linked with `yarn install` in the web directory
- The common module is intentionally NOT in the `enabledModules` array because it's a utility-only module with no UI routes or pages
