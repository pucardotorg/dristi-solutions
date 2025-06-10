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
  setupLibraries("Customizations", "dristiOrders", { ...window?.Digit?.Customizations?.dristiOrders, ...UICustomizations });
  // setupLibraries("Utils", "parsingUtils", { ...window?.Digit?.Utils?.parsingUtils, ...parsingUtils });
};

export default {};

export const formatDateDifference = (previousDate) => {
  const currentDate = new Date();
  let previousDateObj;

  if (typeof previousDate === "string" && previousDate.includes("-")) {
    const [day, month, year] = previousDate.split("-");
    previousDateObj = new Date(year, month - 1, day);
  } else {
    previousDateObj = new Date(Number(previousDate));
  }

  const timeDifference = currentDate - previousDateObj;
  const dayDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

  return dayDifference;
};

export const formatDate = (dateInput) => {
  if (!dateInput) return "N/A";

  const date = new Date(dateInput);
  // Check for invalid date
  if (isNaN(date)) return "N/A";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

export const convertToDateInputFormat = (dateInput) => {
  if (!dateInput) {
    return "";
  }
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

export const getSuffixByBusinessCode = (paymentType = [], businessCode) => {
  return paymentType?.find((data) => data?.businessService?.some((businessService) => businessService?.businessCode === businessCode))?.suffix || "";
};

export const getSuffixByDeliveryChannel = (paymentType = [], deliveryChannel, businessCode) => {
  return (
    paymentType?.find(
      (data) =>
        data?.deliveryChannel === deliveryChannel && data?.businessService?.some((businessService) => businessService?.businessCode === businessCode)
    )?.suffix || ""
  );
};

export const getTaxPeriodByBusinessService = (taxPeriod = [], businessService) => {
  return taxPeriod?.find((data) => data?.service === businessService) || {};
};
export const removeInvalidNameParts = (name) => {
  return name
    ?.split(" ")
    .filter((part) => part && !["undefined", "null"].includes(part.toLowerCase()))
    .join(" ");
};

export const constructFullName = (firstName, middleName, lastName) => {
  return [firstName, middleName, lastName].filter(Boolean).join(" ").trim();
};

export const getFormattedName = (firstName, middleName, lastName, designation, partyTypeLabel) => {
  const nameParts = [firstName, middleName, lastName].filter(Boolean).join(" ");

  const nameWithDesignation = designation && nameParts ? `${nameParts} - ${designation}` : designation || nameParts;

  return partyTypeLabel ? `${nameWithDesignation} ${partyTypeLabel}` : nameWithDesignation;
};

// name format for entity type
export const getRespondantName = (respondentNameData) => {
  const isWitness = respondentNameData?.partyType?.toLowerCase() === "witness";
  const partyName = isWitness
    ? getFormattedName(
        respondentNameData?.firstName,
        respondentNameData?.middleName,
        respondentNameData?.lastName,
        respondentNameData?.witnessDesignation,
        null
      )
    : constructFullName(respondentNameData?.firstName, respondentNameData?.middleName, respondentNameData?.lastName);

  if (respondentNameData?.respondentCompanyName) {
    return `${respondentNameData?.respondentCompanyName} (Represented By ${partyName})`;
  }

  return partyName || respondentNameData;
};

export const getComplainantName = (complainantDetails) => {
  const partyName = complainantDetails?.firstName && `${complainantDetails?.firstName || ""} ${complainantDetails?.lastName || ""}`.trim();
  if (complainantDetails?.complainantType?.code === "INDIVIDUAL") {
    return partyName;
  }
  return `${complainantDetails?.complainantCompanyName} (Represented By ${partyName})` || "";
};

export const numberToWords = (num) => {
  if (num === 0) return "zero";

  const ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
  const teens = ["", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
  const tens = ["", "ten", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  const thousands = ["", "thousand"];

  let words = "";

  if (num >= 1000) {
    words += ones[Math.floor(num / 1000)] + " " + thousands[1] + " ";
    num %= 1000;
  }

  if (num >= 100) {
    words += ones[Math.floor(num / 100)] + " hundred ";
    num %= 100;
  }

  if (num >= 11 && num <= 19) {
    words += teens[num - 10] + " ";
    return words.trim();
  }

  if (num >= 10) {
    words += tens[Math.floor(num / 10)] + " ";
    num %= 10;
  }

  if (num > 0) {
    words += ones[num] + " ";
  }

  return words.trim();
};

export const formatAddress = (value) => {
  const parts = [value?.locality, value?.city, value?.district, value?.pincode];
  return parts.filter((part) => part !== undefined && part !== null && part !== "").join(", ");
};
