import { Request } from "@egovernments/digit-ui-libraries";
import isEmpty from "lodash/isEmpty";
import axios from "axios";
import { DocumentUploadError } from "./errorUtil";

export const ServiceRequest = async ({
  serviceName,
  method = "POST",
  url,
  data = {},
  headers = {},
  useCache = false,
  params = {},
  auth,
  reqTimestamp,
  userService,
}) => {
  const preHookName = `${serviceName}Pre`;
  const postHookName = `${serviceName}Post`;

  let reqParams = params;
  let reqData = data;
  if (window[preHookName] && typeof window[preHookName] === "function") {
    let preHookRes = await window[preHookName]({ params, data });
    reqParams = preHookRes.params;
    reqData = preHookRes.data;
  }
  const resData = await Request({ method, url, data: reqData, headers, useCache, params: reqParams, auth, userService, reqTimestamp });

  if (window[postHookName] && typeof window[postHookName] === "function") {
    return await window[postHookName](resData);
  }
  return resData;
};

export function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

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

export function isEmptyObject(obj) {
  // Check if the object is empty
  if (isEmpty(obj)) {
    return true;
  }

  // Check if all properties are empty
  for (const key in obj) {
    if (Array.isArray(obj[key])) {
      return obj[key].length === 0;
    } else if (typeof obj[key] === "object" && isEmptyObject(obj[key])) {
      continue;
    } else {
      return false;
    }
  }

  return true;
}

export const formatDate = (date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

export const getMDMSObj = (mdmsdata = [], codekey, code) => {
  if (!code || !mdmsdata || mdmsdata?.length == 0) {
    return {};
  }
  return mdmsdata?.find((item) => item[codekey] == code) || {};
};

export const getSuffixByBusinessCode = (paymentType = [], businessCode) => {
  return paymentType?.find((data) => data?.businessService?.some((businessService) => businessService?.businessCode === businessCode))?.suffix || "";
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

export const modifiedEvidenceNumber = (value) => {
  return value && typeof value === "string" ? value.split("-").pop() : value;
};

export const getFilteredPaymentData = (paymentType, paymentData, bill) => {
  const processedPaymentType = paymentType?.toLowerCase()?.includes("application");
  return processedPaymentType ? [{ key: "Total Amount", value: bill?.totalAmount }] : paymentData;
};

export const getTaskType = (businessService) => {
  const normalizedBusinessService = businessService?.trim().toLowerCase();
  switch (normalizedBusinessService) {
    case "task-summons":
      return "SUMMONS";
    case "task-notice":
      return "NOTICE";
    default:
      return "WARRANT";
  }
};

export const extractFeeMedium = (feeName) => {
  const feeMediums = {
    post: "EPOST",
    email: "EMAIL",
    sms: "SMS",
    police: "POLICE",
    rpad: "RPAD",
  };
  return feeMediums?.[feeName?.toLowerCase()] || "";
};

export const getFilingType = (filingTypes, displayName) => {
  const filingType = filingTypes?.find((type) => type?.displayName === displayName);
  return filingType ? filingType?.code : null;
};

export const documentsTypeMapping = {
  complainantId: "COMPLAINANT_ID_PROOF",
  poaComplainantId: "POA_COMPLAINANT_ID_PROOF",
  poaAuthorizationDocument: "POA_AUTHORIZATION_DOCUMENT",
  complainantCompanyDetailsUpload: "case.authorizationproof.complainant",
  inquiryAffidavitFileUpload: "case.affidavit.225bnss",
  AccusedCompanyDetailsUpload: "case.authorizationproof.accused",
  bouncedChequeFileUpload: "case.cheque",
  depositChequeFileUpload: "case.cheque.depositslip",
  returnMemoFileUpload: "case.cheque.returnmemo",
  legalDemandNoticeFileUpload: "case.demandnotice",
  proofOfDispatchFileUpload: "case.demandnotice.proof",
  proofOfAcknowledgmentFileUpload: "case.demandnotice.serviceproof",
  proofOfReplyFileUpload: "case.replynotice",
  debtLiabilityFileUpload: "case.liabilityproof",
  condonationFileUpload: "CONDONATION_DOC",
  swornStatement: "case.affidavit.223bnss",
  SelectUploadDocWithName: "case.docs",
  vakalatnamaFileUpload: "VAKALATNAMA_DOC",
  submissionDocuments: "SUBMISSION_DOCUMENTS",
  pipAffidavitFileUpload: "COMPLAINANT_PIP_AFFIDAVIT",
  pipAffidavitFileUploadRespondent: "RESPONDENT_PIP_AFFIDAVIT",
  nocJudgeOrder: "NOC_JUDGE_ORDER",
  supportingDocument: "SUPPORTING_DOCUMENT",
};

export const documentLabels = {
  COMPLAINANT_ID_PROOF: "COMPLAINANT_ID_PROOF",
  "case.authorizationproof.complainant": "COMPLAINANT_AUTHORIZATION_PROOF",
  "case.affidavit.225bnss": "INQUIRY_AFFIDAVIT",
  "case.authorizationproof.accused": "ACCUSED_AUTHORIZATION_PROOF",
  "case.cheque": "DISHONORED_CHEQUE",
  "case.cheque.depositslip": "PROOF_OF_DEPOSIT_OF_CHEQUE",
  "case.cheque.returnmemo": "CHEQUE_RETURN_MEMO",
  "case.demandnotice": "LEGAL_DEMAND_NOTICE",
  "case.demandnotice.proof": "PROOF_OF_DISPATCH_OF_LEGAL_DEMAND_NOTICE",
  "case.demandnotice.serviceproof": "PROOF_OF_ACKNOWLEDGMENT",
  "case.replynotice": "PROOF_OF_REPLY",
  "case.liabilityproof": "PROOF_OF_DEBT_LIABILITY",
  CONDONATION_DOC: "DELAY_CONDONATION_APPLICATION",
  "case.affidavit.223bnss": "AFFIDAVIT_BNSS_223",
  "case.docs": "UPLOADED_DOCUMENT",
  VAKALATNAMA_DOC: "VAKALATNAMA_DOCUMENT",
  SUBMISSION_DOCUMENTS: "SUBMISSION_DOCUMENTS",
  COMPLAINANT_PIP_AFFIDAVIT: "COMPLAINANT_PIP_AFFIDAVIT",
};

export const caseFileLabels = {
  "case.authorizationproof.complainant": "COMPLAINANT_AUTHORIZATION_PROOF",
  "case.authorizationproof.accused": "ACCUSED_AUTHORIZATION_PROOF",
  "case.cheque": "DISHONORED_CHEQUE",
  "case.cheque.depositslip": "PROOF_OF_DEPOSIT_OF_CHEQUE",
  "case.cheque.returnmemo": "CHEQUE_RETURN_MEMO",
  "case.demandnotice": "LEGAL_DEMAND_NOTICE",
  "case.demandnotice.proof": "PROOF_OF_DISPATCH_OF_LEGAL_DEMAND_NOTICE",
  "case.demandnotice.serviceproof": "PROOF_OF_ACKNOWLEDGMENT",
  "case.replynotice": "PROOF_OF_REPLY",
  "case.liabilityproof": "PROOF_OF_DEBT_LIABILITY",
  "case.docs": "OTHERS_DOCUMENT",
};

export const getFileByFileStoreId = async (uri) => {
  const token = localStorage.getItem("token");
  try {
    const response = await axios.get(uri, {
      responseType: "blob", // To treat the response as a binary Blob
      headers: {
        "auth-token": `${token}`,
      },
    });
    // Create a file object from the response Blob
    const file = new File([response.data], "downloaded-file.pdf", {
      type: response.data.type || "application/pdf",
    });
    return file;
  } catch (error) {
    console.error("Error fetching file:", error);
    throw error;
  }
};

export const combineMultipleFiles = async (pdfFilesArray, finalFileName = "combined-document.pdf", key) => {
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const formData = new FormData();

  const filePromises = pdfFilesArray.map(async (file) => {
    const { fileStore } = file;
    if (fileStore) {
      // ${Urls.FileFetchById} // check-Should use this but it is causing circular dependency, need to relocate Urls later
      const uri = `${window.location.origin}/filestore/v1/files/id?tenantId=${tenantId}&fileStoreId=${fileStore}`;
      const draftFile = await getFileByFileStoreId(uri);
      return draftFile;
    } else {
      return file;
    }
  });

  const allFiles = await Promise.all(filePromises);
  allFiles.forEach((file) => {
    formData.append("documents", file);
  });

  try {
    const token = localStorage.getItem("token");
    // ${Urls.CombineDocuments} // check- Should use this but it is causing circular dependency, need to relocate Urls
    const combineDocumentsUrl = `${window.location.origin}/egov-pdf/dristi-pdf/combine-documents?tenantId=${tenantId}`;
    const response = await axios.post(combineDocumentsUrl, formData, {
      headers: {
        "auth-token": `${token}`,
      },
      responseType: "blob",
    });
    const file = new File([response.data], finalFileName, { type: response.data.type });
    return [file];
  } catch (error) {
    console.error("Error:", error);
    throw new DocumentUploadError(`Document upload failed: ${error.message}`, documentsTypeMapping[key]);
  }
};

export const cleanString = (input) => {
  return input.trim().replace(/\s+/g, " ");
};

export const getDate = (value) => {
  const date = new Date(value);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Month is zero-based
  const year = date.getFullYear();
  const formattedDate = `${day}-${month}-${year}`;
  return formattedDate;
};

// make first letter capital as well as allow someone type capital
export const formatAddress = (value) => {
  return value
    .split(" ")
    .map((word) => (word === word.toUpperCase() || /[A-Z]/.test(word.slice(1)) ? word : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()))
    .join(" ");
};

export const maskEmail = (email) => {
  if (!email || typeof email !== "string") {
    return "";
  }

  try {
    const emailParts = email.trim().split("@");
    if (emailParts.length !== 2) {
      throw new Error("Invalid email format");
    }

    const [username, domain] = emailParts;
    if (!username || !domain) {
      throw new Error("Invalid email parts");
    }

    const maskedUsername = username.length <= 2 ? username.padEnd(4, "*") : `${username.slice(0, 2)}${"*".repeat(Math.min(8, username.length - 2))}`;

    return `${maskedUsername}@${domain}`;
  } catch (error) {
    console.error("Email masking failed:", error);
    return "****@****";
  }
};

export const getUniqueAcronym = (str) => {
  if (!str) return "";

  // Remove special characters and split the string into words
  const words = str
    ?.replace(/[^a-zA-Z0-9 ]/g, "")
    ?.split(" ")
    ?.filter(Boolean);
  // Get the first letter of each word and join them
  let acronym = words?.map((word) => word?.[0]?.toUpperCase())?.join("");

  // If the acronym is too short, add more characters from the first word
  if (acronym?.length < 2 && words[0]) {
    acronym += words?.[0]?.slice(1, 3 - acronym?.length)?.toUpperCase();
  }

  return acronym;
};

export const extractValue = (data, key) => {
  if (!key.includes(".") && data && typeof data === "object") {
    return data[key];
  }
  const keyParts = key.split(".");
  let value = data;
  keyParts.forEach((part) => {
    if (value && value.hasOwnProperty(part)) {
      value = value[part];
    } else {
      value = undefined;
    }
  });
  return value;
};

export const isEmptyValue = (value) => {
  if (!value) {
    return true;
  } else if (Array.isArray(value) || typeof value === "object") {
    return Object.keys(value).length === 0;
  } else if (typeof value === "string") {
    return value.trim().length === 0;
  } else {
    return false;
  }
};
