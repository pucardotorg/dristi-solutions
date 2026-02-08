import _ from "lodash";
import { UICustomizations } from "../configs/UICustomizations";

import { CustomisedHooks } from "../hooks";

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
  setupLibraries("Customizations", "dristiSubmissions", { ...window?.Digit?.Customizations?.dristiSubmissions, ...UICustomizations });
  // setupLibraries("Utils", "parsingUtils", { ...window?.Digit?.Utils?.parsingUtils, ...parsingUtils });
};

export const getSuffixByBusinessCode = (paymentType = [], businessCode) => {
  return paymentType?.find((data) => data?.businessService?.some((businessService) => businessService?.businessCode === businessCode))?.suffix || "";
};

export const getTaxPeriodByBusinessService = (taxPeriod = [], businessService) => {
  return taxPeriod?.find((data) => data?.service === businessService) || {};
};

export const getCourtFeeAmountByPaymentType = (courtFeeAmount = [], paymentCode) => {
  return courtFeeAmount?.find((data) => data?.paymentCode === paymentCode)?.amount || "";
};

export const formatDate = (date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

export const convertToDateInputFormat = (dateInput) => {
  let date;

  if (typeof dateInput === "number") {
    date = new Date(dateInput);
  } else if (typeof dateInput === "string" && dateInput.includes("-")) {
    const [day, month, year] = dateInput.split("-");
    if (!isNaN(day) && !isNaN(month) && !isNaN(year) && day.length === 2 && month.length === 2 && year.length === 4) {
      date = new Date(`${year}-${month}-${day}`);
    } else {
      console.error("Invalid date format");
    }
  } else {
    console.error("Invalid input type or format");
  }

  return formatDate(date);
};

export function convertTaskResponseToPayload(responseArray, id = null) {
  if (!Array.isArray(responseArray) || !responseArray.length) return null;

  let data = [];
  if (id) {
    const matchedTask = responseArray?.find((task) =>
      task?.fields?.some((field) => field.key === "additionalDetails.litigantUuid" && field?.value === id)
    );
    data = matchedTask?.fields || [];
  } else {
    data = responseArray?.[0]?.fields || [];
  }
  const flatData = data;
  const structuredData = {};

  function setDeepValue(obj, path, value) {
    const parts = path?.replace(/\[(\w+)\]/g, ".$1")?.split(".");
    let current = obj;
    for (let i = 0; i < parts?.length; i++) {
      const key = parts[i];
      if (i === parts.length - 1) {
        current[key] = value;
      } else {
        if (!current[key] || typeof current[key] !== "object") {
          current[key] = isNaN(parts[i + 1]) ? {} : [];
        }
        current = current[key];
      }
    }
  }

  flatData?.forEach(({ key, value }) => {
    const normalizedValue = value === "null" ? null : value === "true" ? true : value === "false" ? false : value;
    setDeepValue(structuredData, key, normalizedValue);
  });

  const pendingTask = {
    name: structuredData?.name,
    entityType: structuredData?.entityType,
    referenceId: structuredData?.referenceId,
    status: structuredData?.status,
    assignedTo: structuredData?.assignedTo,
    assignedRole: structuredData?.assignedRole,
    actionCategory: structuredData?.actionCategory,
    cnrNumber: structuredData?.cnrNumber,
    filingNumber: structuredData?.filingNumber,
    caseId: structuredData?.caseId,
    caseTitle: structuredData?.caseTitle,
    isCompleted: structuredData?.isCompleted,
    expiryDate: structuredData?.expiryDate,
    stateSla: structuredData?.stateSla,
    additionalDetails: structuredData?.additionalDetails,
    courtId: structuredData?.courtId,
  };

  return pendingTask;
}

export const getFormattedName = (firstName, middleName, lastName, designation, partyTypeLabel) => {
  const nameParts = [firstName, middleName, lastName]
    ?.map((part) => part?.trim())
    ?.filter(Boolean)
    ?.join(" ")
    ?.trim();

  const nameWithDesignation = designation && nameParts ? `${nameParts} - ${designation}` : designation || nameParts;

  return partyTypeLabel ? `${nameWithDesignation} ${partyTypeLabel}` : nameWithDesignation;
};

export const getUserInfo = async (uuidList) => {
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const uuids = [...new Set(uuidList)];
  if (uuids) {
    const individualData = await window?.Digit.DRISTIService.searchIndividualUser(
      {
        Individual: {
          userUuid: uuidList || [],
        },
      },
      { tenantId, limit: 1000, offset: 0 },
      "",
      true
    );
    if (Array.isArray(individualData?.Individual) && individualData?.Individual?.length > 0) {
      const userData = individualData?.Individual?.map((user) => {
        const userName = `${user?.name?.givenName} ${user?.name?.familyName || ""}`.trim();
        return {
          userUuid: user?.userUuid,
          name: userName,
        };
      });
      return userData;
    }
  }
};

export const getUserNames = async (uuidList = []) => {
  if (!Array.isArray(uuidList) || uuidList.length === 0) return [];

  const tenantId = Digit.ULBService.getCurrentTenantId();
  const uuids = [...new Set(uuidList)?.filter(Boolean)];

  const individualData = await Digit.DRISTIService.searchIndividualUser(
    { Individual: { userUuid: uuids } },
    { tenantId, limit: 1000, offset: 0 },
    "",
    true
  );

  return (
    individualData?.Individual?.map((user) => ({
      userUuid: user?.userUuid,
      name: `${user?.name?.givenName} ${user?.name?.familyName || ""}`.trim(),
    })) || []
  );
};

export default {};
