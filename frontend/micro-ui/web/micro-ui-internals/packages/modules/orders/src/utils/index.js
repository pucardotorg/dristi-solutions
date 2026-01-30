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
  return [firstName, middleName, lastName]
    ?.map((part) => part?.trim())
    ?.filter(Boolean)
    ?.join(" ")
    ?.trim();
};

export const getFormattedName = (firstName, middleName, lastName, designation, partyTypeLabel) => {
  const nameParts = [firstName, middleName, lastName]
    ?.map((part) => part?.trim())
    ?.filter(Boolean)
    ?.join(" ")
    ?.trim();

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
  const partyName =
    complainantDetails?.firstName &&
    `${complainantDetails?.firstName?.trim() || ""} ${complainantDetails?.middleName?.trim() || ""} ${
      complainantDetails?.lastName?.trim() || ""
    }`.trim();
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

const IST_OFFSET = 5.5 * 60 * 60 * 1000;

function getISTEpoch(year, month, day, hour, minute, second, ms) {
  const utcDate = Date.UTC(year, month, day, hour, minute, second, ms - IST_OFFSET);

  return utcDate;
}

export function getEpochRangeFromDateIST(dateStr) {
  if (!dateStr) return { start: null, end: null };

  const [year, month, day] = dateStr.split("-").map(Number);
  const monthIndex = month - 1;

  const start = getISTEpoch(year, monthIndex, day, 0, 0, 0, 0);
  const end = getISTEpoch(year, monthIndex, day, 23, 59, 59, 999);

  return { start, end };
}

export function getEpochRangeFromMonthIST(monthStr) {
  if (!monthStr) return { start: null, end: null };

  const [year, month] = monthStr.split("-").map(Number);
  const monthIndex = month - 1;

  const start = getISTEpoch(year, monthIndex, 1, 0, 0, 0, 0);

  // Gets the number of the last day of the month
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();

  const end = getISTEpoch(year, monthIndex, lastDay, 23, 59, 59, 999);

  return { start, end };
}

export const formatDateWithTime = (dateInput, showTime = false) => {
  if (!dateInput) return "-";

  const date = new Date(dateInput);

  if (isNaN(date.getTime())) return "N/A";
  const dateInIST = new Date(date.getTime() + IST_OFFSET);

  const day = String(dateInIST.getUTCDate()).padStart(2, "0");
  const month = String(dateInIST.getUTCMonth() + 1).padStart(2, "0");
  const year = dateInIST.getUTCFullYear();

  let formattedDate = `${day}-${month}-${year}`;

  if (showTime) {
    const hours = String(dateInIST.getUTCHours()).padStart(2, "0");
    const minutes = String(dateInIST.getUTCMinutes()).padStart(2, "0");
    const seconds = String(dateInIST.getUTCSeconds()).padStart(2, "0");

    formattedDate += ` ${hours}:${minutes}:${seconds}`;
  }

  return formattedDate;
};

export const _getDate = (epoch, formatDate = false) => {
  const date = epoch ? new Date(epoch) : new Date();

  const options = { timeZone: "Asia/Kolkata" };
  const istDate = new Date(date.toLocaleString("en-US", options));

  const year = istDate.getFullYear();
  const month = String(istDate.getMonth() + 1).padStart(2, "0");
  const day = String(istDate.getDate()).padStart(2, "0");

  if (formatDate) {
    return `${day}-${month}-${year}`;
  }

  return `${year}-${month}-${day}`;
};

export const _toEpoch = (dateString) => {
  if (!dateString) return null;
  const [year, month, day] = dateString.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const istOffset = 5.5 * 60 * 60 * 1000;
  return utcDate.getTime() - istOffset;
};

export const _getStatus = (status, dropdownData = []) => {
  if (!status || !dropdownData?.length) return null;
  return dropdownData?.find((item) => item.code === status) || null;
};

export const downloadFile = (responseBlob, fileName) => {
  if (!(responseBlob instanceof Blob)) {
    throw new Error("Invalid response format for download.");
  }
  const url = window.URL.createObjectURL(responseBlob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const getPartyNameForInfos = (orderDetails, compositeItem, orderType, taskDetails) => {
  const formDataKeyMap = {
    NOTICE: "noticeOrder",
    SUMMONS: "SummonsOrder",
    WARRANT: "warrantFor",
    PROCLAMATION: "proclamationFor",
    ATTACHMENT: "attachmentFor", // same formdata key as WARRANT
    // Add more types here easily in future
  };

  const formdata =
    orderDetails?.orderCategory === "COMPOSITE" ? compositeItem?.orderSchema?.additionalDetails?.formdata : orderDetails?.additionalDetails?.formdata;

  const key = formDataKeyMap[orderType];
  const partyData = formdata?.[key]?.party?.data;

  const name =
    getFormattedName(
      partyData?.firstName?.trim(),
      partyData?.middleName?.trim(),
      partyData?.lastName?.trim(),
      partyData?.witnessDesignation?.trim(),
      null
    ) ||
    (["NOTICE", "SUMMONS"]?.includes(orderType) && (taskDetails?.respondentDetails?.name || taskDetails?.witnessDetails?.name)) ||
    (orderType === "WARRANT" && formdata?.warrantFor?.name) ||
    (orderType === "PROCLAMATION" && formdata?.proclamationFor?.name) ||
    (orderType === "ATTACHMENT" && formdata?.attachmentFor?.name) ||
    formdata?.warrantFor ||
    formdata?.proclamationFor ||
    formdata?.attachmentFor ||
    "";

  return name;
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

export const getSafeFileExtension = (fileName, fallback = "pdf") => {
  if (typeof fileName !== "string" || !fileName?.trim()) return fallback;

  const lastDotIndex = fileName?.lastIndexOf(".");

  if (
    lastDotIndex <= 0 || 
    lastDotIndex === fileName?.length - 1
  ) {
    return fallback;
  }

  const extension = fileName?.substring(lastDotIndex + 1)?.toLowerCase();

  return extension || fallback;
};
