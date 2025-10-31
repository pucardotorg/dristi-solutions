import _ from "lodash";
import { UICustomizations } from "../configs/UICustomizations";

import { CustomisedHooks } from "../hooks";
import { TaskManagementWorkflowAction } from "@egovernments/digit-ui-module-dristi/src/Utils";
import { DRISTIService } from "@egovernments/digit-ui-module-dristi/src/services";

const formatWithSuffix = (day) => {
  if (day > 3 && day < 21) return `${day}th`;
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
};

// Function to format a date object into "20th June 2024"
export const formatDateInMonth = (date) => {
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const day = formatWithSuffix(date.getDate());
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

export const overrideHooks = () => {
  Object.keys(CustomisedHooks).map((ele) => {
    if (ele === "Hooks") {
      Object.keys(CustomisedHooks[ele]).map((hook) => {
        Object.keys(CustomisedHooks[ele][hook]).map((method) => {
          setupHooks(hook, method, CustomisedHooks[ele][hook][method]);
        });
      });
    } else if (ele === "Utils") {
      Object.keys(CustomisedHooks[ele]).map((hook) => {
        Object.keys(CustomisedHooks[ele][hook]).map((method) => {
          setupHooks(hook, method, CustomisedHooks[ele][hook][method], false);
        });
      });
    } else {
      Object.keys(CustomisedHooks[ele]).map((method) => {
        setupLibraries(ele, method, CustomisedHooks[ele][method]);
      });
    }
  });
};
const setupHooks = (HookName, HookFunction, method, isHook = true) => {
  window.Digit = window.Digit || {};
  window.Digit[isHook ? "Hooks" : "Utils"] = window.Digit[isHook ? "Hooks" : "Utils"] || {};
  window.Digit[isHook ? "Hooks" : "Utils"][HookName] = window.Digit[isHook ? "Hooks" : "Utils"][HookName] || {};
  window.Digit[isHook ? "Hooks" : "Utils"][HookName][HookFunction] = method;
};
/* To Overide any existing libraries  we need to use similar method */
const setupLibraries = (Library, service, method) => {
  window.Digit = window.Digit || {};
  window.Digit[Library] = window.Digit[Library] || {};
  window.Digit[Library][service] = method;
};

/* To Overide any existing config/middlewares  we need to use similar method */
export const updateCustomConfigs = () => {
  setupLibraries("Customizations", "commonUiConfig", { ...window?.Digit?.Customizations?.commonUiConfig, ...UICustomizations });
  // setupLibraries("Utils", "parsingUtils", { ...window?.Digit?.Utils?.parsingUtils, ...parsingUtils });
};

export const formatDateYYMMDD = (date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
};

export const getFormattedDate = (epochTime) => {
  const date = new Date(epochTime);
  const formattedDate = date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return formattedDate;
};

export const checkIfDueDatePassed = (dueDate) => {
  if (!dueDate) return false;

  const slaDate = new Date(dueDate);
  const today = new Date();

  // Set both dates to midnight to ignore time
  slaDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return slaDate < today;
};

export const getSuffixByBusinessCode = (paymentType = [], businessCode) => {
  return paymentType?.find((data) => data?.businessService?.some((businessService) => businessService?.businessCode === businessCode))?.suffix || "";
};

export const getTaxPeriodByBusinessService = (taxPeriod = [], businessService) => {
  return taxPeriod?.find((data) => data?.service === businessService) || {};
};

export const formatNoticeDeliveryDate = (inputDate) => {
  if (!inputDate) return "";

  let dateObj;

  if (!isNaN(inputDate) && inputDate.toString().length >= 10) {
    dateObj = new Date(Number(inputDate));
  } else if (typeof inputDate === "string") {
    let parts;
    if (inputDate.includes("-")) {
      parts = inputDate.split("-");
    } else if (inputDate.includes("/")) {
      parts = inputDate.split("/");
    }

    if (parts && parts.length === 3) {
      if (inputDate.includes("-") && parts[0].length === 4) {
        const [year, month, day] = parts.map(Number);
        dateObj = new Date(year, month - 1, day);
      } else {
        const [day, month, year] = parts.map(Number);
        dateObj = new Date(year, month - 1, day);
      }
    } else {
      return "";
    }
  } else if (inputDate instanceof Date) {
    dateObj = inputDate;
  } else {
    return "";
  }

  const dd = String(dateObj.getDate()).padStart(2, "0");
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const yyyy = dateObj.getFullYear();

  return `${dd}-${mm}-${yyyy}`;
};

export const formatDateDDMMYYYY = (date) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

export const createOrUpdateTask = async ({ type, existingTask, courierData, formData, filingNumber, tenantId }) => {
  if (!courierData) return;

  const uniqueId = courierData?.uniqueId || courierData?.data?.uniqueId;
  const matchedFormData = formData?.find((item) => (item?.data?.uniqueId || item?.uniqueId) === uniqueId)?.data;

  // Build new party object
  const baseParty = {
    addresses: courierData?.addressDetails,
    deliveryChannels: courierData?.[`${type?.toLowerCase()}CourierService`],
  };

  const newParty =
    courierData?.partyType === "Respondent"
      ? { ...baseParty, respondentDetails: { ...matchedFormData, uniqueId } }
      : courierData?.partyType === "Witness"
      ? { ...baseParty, witnessDetails: { ...matchedFormData, uniqueId } }
      : baseParty;

  // Merge with existing task if present
  let updatedPartyDetails = [];

  if (existingTask) {
    const existingParties = existingTask?.partyDetails || [];

    const existingIndex = existingParties.findIndex((party) => {
      const partyUniqueId = party?.respondentDetails?.uniqueId || party?.witnessDetails?.uniqueId;
      return partyUniqueId === uniqueId;
    });

    if (existingIndex !== -1) {
      // Update existing
      existingParties[existingIndex] = newParty;
      updatedPartyDetails = existingParties;
    } else {
      // Add new
      updatedPartyDetails = [...existingParties, newParty];
    }
  } else {
    updatedPartyDetails = [newParty];
  }

  const taskManagementPayload = existingTask
    ? {
        ...existingTask,
        partyDetails: updatedPartyDetails,
        workflow: {
          action: TaskManagementWorkflowAction.UPDATE,
        },
      }
    : {
        filingNumber,
        tenantId,
        taskType: type,
        partyDetails: updatedPartyDetails,
        courtId: courierData?.courtId,
        orderNumber: courierData?.orderNumber,
        orderItemId: courierData?.orderItemId,
        workflow: {
          action: TaskManagementWorkflowAction.CREATE,
        },
      };

  const serviceMethod = existingTask ? DRISTIService.updateTaskManagementService : DRISTIService.createTaskManagementService;

  await serviceMethod({ taskManagement: taskManagementPayload });
};

export default {};
