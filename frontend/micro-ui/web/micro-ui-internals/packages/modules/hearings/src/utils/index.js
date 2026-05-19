import { applyCustomizations, applyHookOverrides } from "@egovernments/digit-ui-module-dristi/src/Utils/moduleSetup";
import { UICustomizations } from "../configs/UICustomizations";
import { CustomisedHooks } from "../hooks";
import { getFormattedName } from "@egovernments/digit-ui-module-common";

export const overrideHooks = () => applyHookOverrides(CustomisedHooks);

export const updateCustomConfigs = () => applyCustomizations("commonUiConfig", UICustomizations);

export { getFormattedName };

export default {};
