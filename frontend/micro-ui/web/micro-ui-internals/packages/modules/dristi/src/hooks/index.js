import useGetAdvocateClerk from "./dristi/useGetAdvocateClerk";
import useGetAdvocateClientServices from "./dristi/useGetAdvocateClientServices";
import useGetIndividualAdvocate from "./dristi/useGetIndividualAdvocate";
import useGetIndividualUser from "./dristi/useGetIndividualUser";
import useIndividualService from "./dristi/useIndividualService";

import { DRISTIService } from "../services";
import useGetEvidence from "./dristi/useGetEvidence";
import useGetOrders from "./dristi/useGetOrders";
import useGetBotdOrders from "./dristi/useGetBotdOrders";
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
import useDownloadFiles from "./dristi/useDownloadFiles.js";
import useWorkflowDetails from "./dristi/useWorkflowDetails.js";
import useSummonsPaymentBreakUp from "./dristi/useSummonsPaymentBreakUp.js";
import { extractFeeMedium, getTaskType, combineMultipleFiles, getFilingType } from "../Utils/index.js";
import useRepondentPincodeDetails from "./dristi/useRepondentPincodeDetails.js";
import downloadPdfFromFile from "../Utils/downloadPdfFromFile.js";
import useGetAllAdvocates from "./dristi/useGetAllAdvocates.js";
import useSearchADiaryService from "./dristi/useSearchADiaryService.js";
import useEtreasuryCreateDemand from "./dristi/useEtreasuryCreateDemand.js";
import useFetchBill from "./dristi/useFetchBill.js";
import { useSurveyManager } from "./dristi/useSurveyManager.js";
import useSearchTaskMangementService from "./dristi/useSearchTaskMangementService.js";
import useSortedMDMSData from "./dristi/useSortedMDMSData.js";

export const Urls = {
  Authenticate: "/user/oauth/token",
  dristi: {
    getMarkAsEvidencePdf: "/egov-pdf/evidence",
    individual: "/individual/v1/_create",
    updateIndividual: "/individual/v1/_update",
    searchIndividual: "/individual/v1/_search",
    deleteIndividual: "/individual/v1/_delete",
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
    searchDigitizedDocument: "/digitalized-documents/v1/_search",
    createDigitizedDocument: "/digitalized-documents/v1/_create",
    updateDigitizedDocument: "/digitalized-documents/v1/_update",
    searchHearings: "/hearing/v1/search",
    createHearings: "/hearing/v1/create",
    updateHearings: "/hearing/v1/update",
    getDraftOrder: "/order-management/v1/getDraftOrder",
    demandCreate: "/billing-service/demand/_create",
    ordersSearch: "/order/v1/search",
    botdOrdersSearch: "/order-management/v1/getBotdOrders",
    ordersCreate: "/order/v1/create",
    submissionsSearch: "/application/v1/search",
    submissionsUpdate: "/application/v1/update",
    addSubmissionComment: "/application/v1/addcomment",
    addEvidenceComment: "/evidence/v1/addcomment",
    pendingTask: "/analytics/pending_task/v1/create",
    getPendingTaskFields: "/inbox/v2/_getFields",
    applicationCreate: "/application/v1/create",
    eligibility: "/inportal-survey/v1/eligibility",
    feedback: "/inportal-survey/v1/feedback",
    remindMeLater: "/inportal-survey/v1/remind-me-later",

    //Solutions
    billFileStoreId: "/etreasury/payment/v1/_getPaymentReceipt",
    eSign: "/e-sign-svc/v1/_esign",
    paymentCalculator: "/payment-calculator/v1/case/fees/_calculate",
    getTreasuryPaymentBreakup: "/etreasury/payment/v1/_getHeadBreakDown",
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
    taskSearch: "/task/v1/search",
    searchBailBonds: "/bail-bond/v1/_search",
    // Advocate Office Management
    addOfficeMember: "/advocate-office-management/v1/_addMember",
  },
  case: {
    addWitness: "/case/v1/add/witness",
    addNewWitness: "/case/v2/add/witness",
    taskCreate: "/task/v1/create",
    searchTasks: "/task/v1/search",
    addAddress: "/case/v1/address/_add",
  },
  hearing: {
    hearingUpdateTranscript: "/hearing/v1/update_transcript_additional_attendees",
    uploadWitnesspdf: "/hearing/witnessDeposition/v1/uploadPdf",
    witnessDepositionPreviewPdf: "/egov-pdf/hearing",
  },
  FileFetchById: "/filestore/v1/files/id",
  CombineDocuments: "/egov-pdf/dristi-pdf/combine-documents",
  taskManagement: {
    taskManagementCreate: "/task-management/v1/_create",
    taskManagementUpdate: "/task-management/v1/_update",
    taskManagementSearch: "/task-management/v1/_search",
    createOfflinePayment: "/analytics/offline-payment/_create",
  },
  digitalization: {
    examinationPreviewPdf: "/egov-pdf/digitisation",
  },
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
  useGetBotdOrders,
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
  useDownloadFiles,
  useSummonsPaymentBreakUp,
  useRepondentPincodeDetails,
  downloadPdfFromFile,
  useGetAllAdvocates,
  useSearchADiaryService,
  useEtreasuryCreateDemand,
  useSurveyManager,
  useSearchTaskMangementService,
  useSortedMDMSData,
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
