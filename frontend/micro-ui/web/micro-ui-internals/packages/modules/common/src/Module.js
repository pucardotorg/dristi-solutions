import * as utils from "./utils";

const componentsToRegister = {
  CommonUtils: utils,
};

export const initCommonComponents = () => {
  Object.entries(componentsToRegister).forEach(([key, value]) => {
    Digit.ComponentRegistryService.setComponent(key, value);
  });
};

// Re-export all utilities for direct import
export * from "./utils";
