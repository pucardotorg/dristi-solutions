/**
 * Shared plumbing every PUCAR module uses inside its `utils/index.js` to wire
 * its CustomisedHooks and UICustomizations into the global `window.Digit`
 * registry. Before this utility, each of the six modules (cases, home,
 * hearings, orders, submissions, and dristi itself) inlined the same ~35 line
 * `overrideHooks` + `setupHooks` + `setupLibraries` block, and only the
 * customisation key passed to `updateCustomConfigs` differed.
 *
 * Keeping the helpers in `dristi/src/Utils` mirrors the existing pattern where
 * `dristi` is the shared module every other UI package already depends on.
 */

/**
 * Register a single hook or util onto `window.Digit.Hooks[Hook][Fn]` or
 * `window.Digit.Utils[Hook][Fn]` depending on `isHook`. Lazy-initialises the
 * intermediate buckets so callers don't have to worry about ordering.
 */
const setupHook = (HookName, HookFunction, method, isHook = true) => {
  window.Digit = window.Digit || {};
  const bucket = isHook ? "Hooks" : "Utils";
  window.Digit[bucket] = window.Digit[bucket] || {};
  window.Digit[bucket][HookName] = window.Digit[bucket][HookName] || {};
  window.Digit[bucket][HookName][HookFunction] = method;
};

/**
 * Register an entire library (e.g. `Customizations.commonUiConfig`) by
 * overwriting `window.Digit[Library][service]` with the provided method.
 */
const setupLibrary = (Library, service, method) => {
  window.Digit = window.Digit || {};
  window.Digit[Library] = window.Digit[Library] || {};
  window.Digit[Library][service] = method;
};

/**
 * Walks the per-module CustomisedHooks tree and registers each leaf with the
 * `setupHook` / `setupLibrary` helpers above. Modules expect the tree shape:
 *   {
 *     Hooks: { hookName: { method: fn } },          // becomes window.Digit.Hooks
 *     Utils: { hookName: { method: fn } },          // becomes window.Digit.Utils
 *     <library>: { service: <value> }               // becomes window.Digit[library]
 *   }
 *
 * Replaces the identical 22-line `overrideHooks` previously inlined per module.
 */
export const applyHookOverrides = (CustomisedHooks) => {
  Object.keys(CustomisedHooks).forEach((ele) => {
    if (ele === "Hooks") {
      Object.keys(CustomisedHooks[ele]).forEach((hook) => {
        Object.keys(CustomisedHooks[ele][hook]).forEach((method) => {
          setupHook(hook, method, CustomisedHooks[ele][hook][method]);
        });
      });
    } else if (ele === "Utils") {
      Object.keys(CustomisedHooks[ele]).forEach((hook) => {
        Object.keys(CustomisedHooks[ele][hook]).forEach((method) => {
          setupHook(hook, method, CustomisedHooks[ele][hook][method], false);
        });
      });
    } else {
      Object.keys(CustomisedHooks[ele]).forEach((method) => {
        setupLibrary(ele, method, CustomisedHooks[ele][method]);
      });
    }
  });
};

/**
 * Merges the module's UICustomizations into the global Customizations registry
 * under `customizationsKey`. Equivalent to the previous inline:
 *   setupLibraries(
 *     "Customizations",
 *     customizationsKey,
 *     { ...window?.Digit?.Customizations?.[customizationsKey], ...UICustomizations }
 *   );
 */
export const applyCustomizations = (customizationsKey, UICustomizations) => {
  setupLibrary(
    "Customizations",
    customizationsKey,
    { ...window?.Digit?.Customizations?.[customizationsKey], ...UICustomizations }
  );
};
