import { applyCustomizations, applyHookOverrides } from "@egovernments/digit-ui-module-dristi/src/Utils/moduleSetup";
import { UICustomizations } from "../configs/UICustomizations";
import { CustomisedHooks } from "../hooks";

export const overrideHooks = () => applyHookOverrides(CustomisedHooks);

export const updateCustomConfigs = () => applyCustomizations("commonUiConfig", UICustomizations);

export default {};
