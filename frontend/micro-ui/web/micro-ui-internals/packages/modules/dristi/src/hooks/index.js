import useGetAdvocateClerk from "./dristi/useGetAdvocateClerk";
import useGetAdvocateClientServices from "./dristi/useGetAdvocateClientServices";
import useGetIndividualAdvocate from "./dristi/useGetIndividualAdvocate";
import useGetIndividualUser from "./dristi/useGetIndividualUser";
import useIndividualService from "./dristi/useIndividualService";

import { DRISTIService } from "../services";
import useGetEvidence from "./dristi/useGetEvidence";
import useGetOrders from "./dristi/useGetOrders";
import useGetSubmissions from "./dristi/useGetSubmissions";
import useInboxCustomHook from "./dristi/useInboxCustomHook";
import useSearchCaseService from "./dristi/useSearchCaseService";
import useCasePdfGeneration from "./dristi/useCasePdfGeneration";

import usePaymentCalculator from "./dristi/usePaymentCalculator";
import { useToast } from "../components/Toast/useToast.js";
import useCreateHearings from "./dristi/useCreateHearings.js";
import useBillSearch from "./dristi/useBillSearch";
import useCreateDemand from "./dristi/useCreateDemand";
import useApplicationDetails from "./dristi/useApplicationDetails.js";
import useJudgeAvailabilityDates from "./dristi/useJudgeAvailabilityDates.js";
import useGetOCRData from "./dristi/useGetOCRData.js";
import { useGetPendingTask } from "./dristi/useGetPendingTask.js";

import useEvidenceDetails from "./dristi/useEvidenceDetails.js";
import useGetStatuteSection from "./dristi/useGetStatuteSection.js";
import useDownloadCasePdf from "./dristi/useDownloadCasePdf.js";
import useWorkflowDetails from "./dristi/useWorkflowDetails.js";
import useSummonsPaymentBreakUp from "./dristi/useSummonsPaymentBreakUp.js";
import { extractFeeMedium, getTaskType, combineMultipleFiles, getFilingType } from "../Utils/index.js";
import useRepondentPincodeDetails from "./dristi/useRepondentPincodeDetails.js";
import downloadPdfFromFile from "../Utils/downloadPdfFromFile.js";
import useGetAllAdvocates from "./dristi/useGetAllAdvocates.js";
import useSearchADiaryService from "./dristi/useSearchADiaryService.js";
import useEtreasuryCreateDemand from "./dristi/useEtreasuryCreateDemand.js";
import useFetchBill from "./dristi/useFetchBill.js";

export const Urls = {
  Authenticate: "/user/oauth/token",
  dristi: {
    individual: "/individual/v1/_create",
    updateIndividual: "/individual/v1/_update",
    searchIndividual: "/individual/v1/_search",
    searchEmployee: "/egov-hrms/employees/_search",
    searchIndividualAdvocate: "/advocate/v1/_search",
    searchIndividualClerk: "/advocate/clerk/v1/_search",
    updateAdvocateDetails: "/advocate/v1/_update",
    caseCreate: "/case/v1/_create",
    searchAllAdvocates: "/advocate/v1/status/_search",
    caseUpdate: "/case/v1/_update",
    caseSearch: "/case/v1/_search",
    caseDetailSearch: "/case/v2/search/details",
    summaryCaseSearch: "/case/v2/search/summary",
    caseListSearch: "/case/v2/search/list",
    casePfGeneration: "/case/v1/_generatePdf",
    evidenceSearch: "/evidence/v1/_search",
    evidenceCreate: "/evidence/v1/_create",
    evidenceUpdate: "/evidence/v1/_update",
    searchHearings: "/hearing/v1/search",
    createHearings: "/hearing/v1/create",
    updateHearings: "/hearing/v1/update",
    demandCreate: "/billing-service/demand/_create",
    ordersSearch: "/order/v1/search",
    ordersCreate: "/order/v1/create",
    submissionsSearch: "/application/v1/search",
    submissionsUpdate: "/application/v1/update",
    addSubmissionComment: "/application/v1/addcomment",
    addEvidenceComment: "/evidence/v1/addcomment",
    pendingTask: "/analytics/pending_task/v1/create",
    getPendingTaskFields: "/inbox/v2/_getFields",
    applicationCreate: "/application/v1/create",

    //Solutions
    billFileStoreId: "/etreasury/payment/v1/_getPaymentReceipt",
    eSign: "/e-sign-svc/v1/_esign",
    paymentCalculator: "/payment-calculator/v1/case/fees/_calculate",
    fetchBill: "/billing-service/bill/v2/_fetchbill",
    searchBill: "/billing-service/bill/v2/_search",
    eTreasury: "/etreasury/payment/v1/_processChallan",
    judgeAvailabilityDates: "/scheduler/judge/v1/_availability",
    sendOCR: "/ocr-service/verify",
    receiveOCR: "/ocr-service/data",
    taskDocuments: "/task/v1/document/search",
    summonsPayment: "/payment-calculator/v1/_calculate",
    repondentPincodeSearch: "/payment-calculator/hub/v1/_search",
    downloadCaseBundle: "/casemanagement/casemanager/case/v1/_buildcasebundle",
    setCaseUnlock: "/lock-svc/v1/_release",
    getCaseLockStatus: "/lock-svc/v1/_get",
    setCaseLock: "/lock-svc/v1/_set",
    addADiaryEntry: "/ab-diary/case/diary/v1/addDiaryEntry",
    aDiaryEntryUpdate: "/ab-diary/case/diary/entry/v1/update",
    aDiaryEntrySearch: "/ab-diary/case/diary/entries/v1/search",
    getLocationBasedJurisdiction: "/kerala-icops/v1/integrations/iCops/_getLocationBasedJurisdiction",
    createProfileRequest: "/case/v2/profilerequest/create",
    processProfileRequest: "/case/v2/profilerequest/process",
    etreasuryCreateDemand: "/etreasury/payment/v1/_createDemand",
  },
  case: {
    addWitness: "/case/v1/add/witness",
  },
  hearing: {
    hearingUpdateTranscript: "/hearing/v1/update_transcript_additional_attendees",
    uploadWitnesspdf: "/hearing/witnessDeposition/v1/uploadPdf",
  },
  FileFetchById: "/filestore/v1/files/id",
  CombineDocuments: "/egov-pdf/dristi-pdf/combine-documents",
};

const dristi = {
  useGetAdvocateClerk,
  useGetAdvocateClientServices,
  useGetIndividualAdvocate,
  useIndividualService,
  useGetIndividualUser,
  useInboxCustomHook,
  useSearchCaseService,
  useCasePdfGeneration,
  usePaymentCalculator,
  useCreateHearings,
  useGetEvidence,
  useGetOrders,
  useGetSubmissions,
  useApplicationDetails,
  useEvidenceDetails,
  useToast,
  useGetStatuteSection,
  useWorkflowDetails,
  useGetPendingTask,
  useBillSearch,
  useFetchBill,
  useCreateDemand,
  useJudgeAvailabilityDates,
  useGetOCRData,
  useDownloadCasePdf,
  useSummonsPaymentBreakUp,
  useRepondentPincodeDetails,
  downloadPdfFromFile,
  useGetAllAdvocates,
  useSearchADiaryService,
  useEtreasuryCreateDemand,
};

const Hooks = {
  dristi,
};

const Utils = {
  dristi: { extractFeeMedium, getTaskType, combineMultipleFiles, getFilingType },
};
export const CustomizedHooks = {
  Hooks,
  DRISTIService,
  Utils,
};
