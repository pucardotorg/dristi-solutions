# Common Module Import Fix

## Issues Identified

### 1. Correct Module Entry Point Configuration

**Initial Mistake:** Initially created a `src/index.js` file and set `"source": "src/index.js"` in package.json, which was incorrect.

**Why it matters:**

- All modules in this project (dristi, orders, submissions, hearings) use `"source": "src/Module.js"` as the entry point
- They do NOT have a `src/index.js` file in the root
- Following the established pattern ensures consistency and proper build behavior

**Final Fix Applied:**

- **Deleted** the incorrect `src/index.js` file
- **Updated** `package.json` to use `"source": "src/Module.js"` to match other modules
- **Updated** `Module.js` to re-export utilities:
  ```javascript
  export const initCommonComponents = () => { ... };
  export * from "./utils";
  ```

### 2. Module Not Built

**Problem:** The common module's dist files didn't exist because we hadn't built it yet.

**Why it matters:**

- When you hover over imports like `import { initDRISTIComponents } from "@egovernments/digit-ui-module-dristi"`, your IDE navigates to the built `dist/index.js` file
- Without building, the import won't resolve properly in the IDE
- The application loads from the dist files, not the source files

**Fix Applied:**

- Built the module: `yarn build` in the common module directory
- Reinstalled dependencies: `yarn install` in the web directory

**Result:**

```
Build "digitUiModuleCommon" to dist:
    858 B: index.js.gz
    768 B: index.js.br
```

### 3. Common Module Not in enabledModules Array

**Question:** Why isn't "Common" in the `enabledModules` array?

**Answer:** This is **intentional and correct**. Here's why:

#### What enabledModules is for:

The `enabledModules` array in App.js is specifically for modules that have:

- **UI Routes** (pages that users navigate to)
- **React Components** (screens, forms, etc.)
- **Navigation entries** (menu items, links)

Example modules in enabledModules:

- `"DRISTI"` - Has case filing pages, case details pages, etc.
- `"Orders"` - Has order creation and management pages
- `"Hearings"` - Has hearing scheduling pages
- `"Submissions"` - Has submission forms and views

#### Why Common is NOT in enabledModules:

The common module is a **utility-only module** that:

- Has **NO UI routes** or pages
- Has **NO React components** for rendering
- Only provides **shared utility functions** (getAdvocates, getFormattedName, getAllAssignees)
- Is initialized via `initCommonComponents()` to register utilities in the component registry

#### How Common Module Works:

```javascript
// In App.js
const initDigitUI = () => {
  window.Digit.ComponentRegistryService.setupRegistry({});
  setupRequestInterceptor();
  initCoreComponents();
  initCommonComponents(); // ← Registers utilities, no routes
  initDRISTIComponents(); // ← Registers routes AND utilities
  initOrdersComponents(); // ← Registers routes AND utilities
  // ...
};
```

The common module utilities are accessed like this:

```javascript
// In any module
import { getFormattedName, getAdvocates, getAllAssignees } from "@egovernments/digit-ui-module-common";

// Or via the component registry
const utils = Digit.ComponentRegistryService.getComponent("CommonUtils");
```

## Verification Steps

After the fixes, you should now be able to:

1. **Hover over the import** in App.js:

   ```javascript
   import { initCommonComponents } from "@egovernments/digit-ui-module-common";
   ```

   - Your IDE should now navigate to the dist file when you click on it

2. **Use the utilities** in other modules:

   ```javascript
   import { getFormattedName } from "@egovernments/digit-ui-module-common";
   ```

3. **Build succeeds** without errors:
   ```bash
   cd /home/bhcp0181/Music/dristi-solutions/frontend/micro-ui/web
   yarn build:libraries
   ```

## Module Structure Comparison

### Modules WITH Routes (in enabledModules):

```
dristi/
├── src/
│   ├── Module.js         ← Entry point, exports initDRISTIComponents
│   ├── pages/            ← UI pages
│   ├── components/       ← UI components
│   └── utils/            ← Utilities
```

### Modules WITHOUT Routes (NOT in enabledModules):

```
common/
├── src/
│   ├── Module.js         ← Entry point, exports initCommonComponents and utilities
│   ├── components/       ← (empty - no UI components)
│   ├── hooks/            ← (empty - no custom hooks)
│   └── utils/            ← Shared utilities
│       ├── caseUtils.js  ← getAllAssignees, getAdvocates
│       └── index.js      ← getFormattedName
```

## Summary

✅ **Created:** `src/Module.js` - Module entry point with initCommonComponents and utility re-exports
✅ **Created:** `src/utils/caseUtils.js` - Contains getAllAssignees and getAdvocates functions
✅ **Created:** `src/utils/index.js` - Contains getFormattedName function
✅ **Created:** `package.json` - Module configuration with source pointing to Module.js
✅ **Deleted:** `src/index.js` - Initially created incorrectly, then deleted to follow project pattern
✅ **Updated:** `package.json` - Uses `"source": "src/Module.js"` to match other modules
✅ **Built:** Module dist files generated successfully
✅ **Installed:** Dependencies linked properly with yarn install
✅ **Verified:** Import now resolves correctly in IDE

❌ **NOT NEEDED:** Adding "Common" to enabledModules (it's a utility module, not a UI module)
