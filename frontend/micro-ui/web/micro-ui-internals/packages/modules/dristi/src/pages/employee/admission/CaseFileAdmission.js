import { BackButton, FormComposerV2, Header, Loader, Toast } from "@egovernments/digit-ui-react-components";
import React, { useEffect, useMemo, useState } from "react";
import { Redirect, useHistory, useLocation } from "react-router-dom/cjs/react-router-dom.min";
import CustomCaseInfoDiv from "../../../components/CustomCaseInfoDiv";
import { Urls } from "../../../hooks";
import useSearchCaseService from "../../../hooks/dristi/useSearchCaseService";
import { FileDownloadIcon, WarningInfoRedIcon } from "../../../icons/svgIndex";
import { DRISTIService } from "../../../services";
import { CaseWorkflowState } from "../../../Utils/caseWorkflow";
import { OrderTypes, OrderWorkflowAction } from "../../../Utils/orderWorkflow";
import Breadcrumb from "../../../components/BreadCrumb";

import { formatDate } from "../../citizen/FileCase/CaseType";
import {
  admitCaseSubmitConfig,
  registerCaseConfig,
  scheduleCaseSubmitConfig,
  sendBackCase,
} from "../../citizen/FileCase/Config/admissionActionConfig";
import { reviewCaseFileFormConfig } from "../../citizen/FileCase/Config/reviewcasefileconfig";
import { getAdvocates } from "../../citizen/FileCase/EfilingValidationUtils";
import AdmissionActionModal from "./AdmissionActionModal";
import {
  advocateCaseFilingStatusTypes,
  getAuthorizedUuid,
  getCaseEditAllowedAssignees,
  getFilingType,
  runComprehensiveSanitizer,
} from "../../../Utils";
import { documentTypeMapping } from "../../citizen/FileCase/Config";
import ScheduleHearing from "../AdmittedCases/ScheduleHearing";
import { SubmissionWorkflowAction, SubmissionWorkflowState } from "../../../Utils/submissionWorkflow";
import useDownloadCasePdf from "../../../hooks/dristi/useDownloadCasePdf";
import WorkflowTimeline from "../../../components/WorkflowTimeline";

const stateSla = {
  SCHEDULE_HEARING: 3 * 24 * 3600 * 1000,
  NOTICE: 3 * 24 * 3600 * 1000,
};

const casePrimaryActions = [
  { action: "REGISTER", label: "CS_REGISTER" },
  { action: "ADMIT", label: "CS_ADMIT_CASE" },
  { action: "SCHEDULE_ADMISSION_HEARING", label: "CS_SCHEDULE_HEARING" },
];
const caseSecondaryActions = [
  { action: "SEND_BACK", label: "SEND_BACK_FOR_CORRECTION" },
  { action: "REJECT", label: "CS_CASE_REJECT" },
];
const caseTertiaryActions = [{ action: "ISSUE_ORDER", label: "ISSUE_NOTICE" }];

const downloadSvgStyle = {
  height: "16px",
  width: "16px",
};

const downloadPathStyle = {
  fill: "#007e7e",
};

const downloadButtonTextStyle = {
  color: "#007e7e",
  fontFamily: "Roboto, sans-serif",
  fontSize: "16px",
  fontWeight: 700,
  lineHeight: "18.75px",
  textAlign: "center",
  width: "fit-content",
  marginLeft: "5px",
};

const delayCondonationStylsMain = {
  padding: "6px 8px",
  borderRadius: "999px",
  backgroundColor: "#E9A7AA",
};

const delayCondonationTextStyle = {
  margin: "0px",
  fontFamily: "Roboto",
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "16.41px",
  textAlign: "center",
  color: "#231F20",
};

function CaseFileAdmission({ t, path }) {
  const [isDisabled, setIsDisabled] = useState(false);
  const history = useHistory();
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalInfo, setModalInfo] = useState(null);
  const [submitModalInfo, setSubmitModalInfo] = useState(null);
  const [formdata, setFormdata] = useState({ isenabled: true, data: {}, displayindex: 0 });
  const location = useLocation();
  const homeFilterData = location?.state?.homeFilteredData;

  const todayDate = new Date().getTime();
  const searchParams = new URLSearchParams(location.search);
  const caseId = searchParams.get("caseId");
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const [caseAdmitLoader, setCaseADmitLoader] = useState(false);
  const [updatedCaseDetails, setUpdatedCaseDetails] = useState({});
  const [createAdmissionOrder, setCreateAdmissionOrder] = useState(true);
  const [showScheduleHearingModal, setShowScheduleHearingModal] = useState(false);
  const [updateCounter, setUpdateCounter] = useState(0);
  const userInfo = Digit?.UserService?.getUser()?.info;
  const roles = userInfo?.roles;
  const userInfoType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo]);
  const isCaseApprover = roles?.some((role) => role.code === "CASE_APPROVER"); // check
  const moduleCode = "case-default";
  const ordersService = Digit.ComponentRegistryService.getComponent("OrdersService") || {};
  const [isLoader, setLoader] = useState(false);
  const { downloadPdf } = useDownloadCasePdf();
  const courtId = localStorage.getItem("courtId");
  const userUuid = userInfo?.uuid;
  const authorizedUuid = getAuthorizedUuid(userUuid);

  // const employeeCrumbs = useMemo(
  //   () => [
  //     {
  //       path: `/${window?.contextPath}/employee/home/home-screen`,
  //       content: t("ES_COMMON_HOME"),
  //       show: true,
  //       isLast: false,
  //       homeActiveTab: location?.state?.homeActiveTab || null,
  //     },
  //   ],
  //   [location?.state?.homeActiveTab, t]
  // );
  const { data: caseFetchResponse, isLoading, refetch } = useSearchCaseService(
    {
      criteria: [
        {
          caseId: caseId,
          ...(courtId && userInfoType === "employee" && { courtId }),
        },
      ],
      tenantId,
    },
    {},
    `dristi-${caseId}`,
    caseId,
    Boolean(caseId)
  );
  const caseDetails = useMemo(() => caseFetchResponse?.criteria?.[0]?.responseList?.[0] || null, [caseFetchResponse]);
  const caseCourtId = useMemo(() => caseDetails?.courtId, [caseDetails]);
  const delayCondonationData = useMemo(() => caseDetails?.caseDetails?.delayApplications?.formdata?.[0]?.data, [caseDetails]);
  const allAdvocates = useMemo(() => getAdvocates(caseDetails), [caseDetails]);

  const representativesUuid = useMemo(() => {
    if (!caseDetails || !allAdvocates) return [];
    return allAdvocates?.[caseDetails?.litigants?.find((litigant) => litigant?.partyType === "complainant.primary")?.additionalDetails?.uuid];
  }, [allAdvocates, caseDetails]);

  const complainantPrimaryUUId = useMemo(
    () => caseDetails?.litigants?.find((item) => item?.partyType === "complainant.primary").additionalDetails?.uuid || "",
    [caseDetails]
  );

  const { isLoading: isWorkFlowLoading, data: workFlowDetails, revalidate } = window?.Digit.Hooks.useWorkflowDetailsV2({
    tenantId,
    id: caseDetails?.filingNumber,
    moduleCode,
    config: {
      enabled: Boolean(caseDetails?.filingNumber && tenantId),
      cacheTime: 10,
    },
  });

  const filingNumber = useMemo(() => caseDetails?.filingNumber, [caseDetails?.filingNumber]);

  const { data: filingTypeData, isLoading: isFilingTypeLoading } = Digit.Hooks.dristi.useGetStatuteSection("common-masters", [
    { name: "FilingType" },
  ]);

  const filingType = useMemo(() => getFilingType(filingTypeData?.FilingType, "CaseFiling"), [filingTypeData?.FilingType]);

  const { data: hearingDetails } = Digit.Hooks.hearings.useGetHearings(
    {
      hearing: { tenantId },
      criteria: {
        tenantID: tenantId,
        filingNumber: filingNumber,
        ...(caseCourtId && { courtId: caseCourtId }),
      },
    },
    {},
    filingNumber,
    Boolean(filingNumber && caseCourtId)
  );

  const { data: applicationData, isLoading: isApplicationLoading, refetch: applicationRefetch } = Digit.Hooks.submissions.useSearchSubmissionService(
    {
      criteria: {
        filingNumber,
        tenantId,
        ...(caseCourtId && { courtId: caseCourtId }),
      },
      tenantId,
    },
    {},
    filingNumber + "allApplications",
    Boolean(filingNumber && caseCourtId)
  );

  const isDelayApplicationPending = useMemo(
    () =>
      Boolean(
        applicationData?.applicationList?.some(
          (item) =>
            item?.applicationType === "DELAY_CONDONATION" &&
            [SubmissionWorkflowState.PENDINGAPPROVAL, SubmissionWorkflowState.PENDINGREVIEW].includes(item?.status)
        )
      ),
    [applicationData]
  );

  const isDelayApplicationCompleted = useMemo(
    () =>
      Boolean(
        applicationData?.applicationList?.some(
          (item) => item?.applicationType === "DELAY_CONDONATION" && [SubmissionWorkflowState.COMPLETED].includes(item?.status)
        )
      ),
    [applicationData]
  );

  const currentHearingId = useMemo(
    () =>
      hearingDetails?.HearingList?.find((list) => list?.hearingType === "ADMISSION" && !(list?.status === "COMPLETED" || list?.status === "ABATED"))
        ?.hearingId,
    [hearingDetails?.HearingList]
  );

  const homeActiveTab = useMemo(() => location?.state?.homeActiveTab || "TOTAL_HEARINGS_TAB", [location?.state?.homeActiveTab]);
  useEffect(() => {
    const unlisten = history.listen((location, action) => {
      if (action === "POP" && location?.pathname?.includes("home-screen")) {
        history.replace(location.pathname, {
          ...location.state,
          homeActiveTab: homeActiveTab,
        });
      }
    });

    return () => {
      unlisten();
    };
  }, [history, homeActiveTab]);

  const employeeCrumbs = useMemo(
    () => [
      {
        path: `/${window?.contextPath}/${userInfoType}/home/home-screen`,
        content: t("ES_COMMON_HOME"),
        show: true,
        isLast: false,
        homeFilteredData: homeFilterData,
      },
      {
        path: `/${window?.contextPath}/${userInfoType}/home/home-screen`,
        content: t("HOME_REGISTER_CASES"),
        show: homeActiveTab === "REGISTRATION",
        homeActiveTab: homeActiveTab,
        isLast: false,
      },
      {
        content: t("VIEW"),
        show: homeActiveTab === "REGISTRATION",
        isLast: true,
      },
    ],
    [userInfoType, t, homeFilterData, homeActiveTab]
  );
  const nextActions = useMemo(() => workFlowDetails?.nextActions || [{}], [workFlowDetails]);

  const primaryAction = useMemo(
    () => casePrimaryActions?.find((action) => nextActions?.some((data) => data.action === action?.action)) || { action: "", label: "" },
    [nextActions]
  );
  const secondaryAction = useMemo(
    () => caseSecondaryActions?.find((action) => nextActions?.some((data) => data.action === action?.action)) || { action: "", label: "" },
    [nextActions]
  );
  const tertiaryAction = useMemo(
    () => caseTertiaryActions?.find((action) => nextActions?.some((data) => data.action === action?.action)) || { action: "", label: "" },
    [nextActions]
  );

  const formConfig = useMemo(() => {
    if (!caseDetails) return null;
    const reviewFileConfig = structuredClone(reviewCaseFileFormConfig);
    reviewFileConfig?.[0]?.body?.push({
      type: "component",
      component: "SelectReviewAccordion",
      key: "paymentDetails",
      label: "CS_PAYMENT_DETAILS",
      number: 4,
      withoutLabel: true,
      populators: {
        inputs: [
          {
            key: "paymentReceipt",
            name: "paymentReceipt",
            label: "CS_PAYMENT_RECEIPT",
            icon: "PaymentDetailsIcon",
            disableScrutiny: true,
            config: [
              {
                type: "image",
                label: "",
                value: ["document"],
              },
            ],
            data: {},
          },
        ],
      },
    });
    return [
      ...reviewFileConfig?.map((form) => {
        return {
          ...form,
          body: form.body?.map((section) => {
            return {
              ...section,
              populators: {
                ...section.populators,
                inputs: section.populators.inputs?.map((input) => {
                  delete input.data;
                  return {
                    ...input,
                    data:
                      input?.key === "witnessDetails"
                        ? caseDetails?.witnessDetails?.map((witness) => {
                            return {
                              data: witness,
                            };
                          }) || {}
                        : input?.key === "paymentReceipt"
                        ? [
                            {
                              data: {
                                document:
                                  caseDetails?.documents
                                    ?.filter((doc) => doc?.documentType === "PAYMENT_RECEIPT")
                                    ?.map((doc) => ({
                                      ...doc,
                                      fileName: doc?.documentType,
                                    })) || [],
                              },
                            },
                          ]
                        : caseDetails?.additionalDetails?.[input?.key]?.formdata || caseDetails?.caseDetails?.[input?.key]?.formdata || {},
                  };
                }),
              },
            };
          }),
        };
      }),
    ];
  }, [caseDetails]);

  // Case correction/edition is allowed to all complainant side parties including poa holders, advocates, advocate's associated office members.
  // but no need to send uuid of office members in assignee payload
  const allComplainantSideUuids = useMemo(() => {
    return getCaseEditAllowedAssignees(caseDetails);
  }, [caseDetails]);

  const updateCaseDetails = async (action, data = {}) => {
    const newcasedetails = {
      ...caseDetails,
      additionalDetails: { ...caseDetails.additionalDetails, judge: data },
    };
    let filteredDocuments = caseDetails?.documents || [];
    if (action === "SEND_BACK") {
      filteredDocuments = filteredDocuments?.filter(
        (doc) => doc?.documentType !== "case.complaint.signed" && doc?.documentType !== "case.complaint.unsigned"
      );
    }

    return await DRISTIService.caseUpdateService(
      {
        cases: {
          ...newcasedetails,
          documents: filteredDocuments,
          linkedCases: caseDetails?.linkedCases ? caseDetails?.linkedCases : [],
          ...(action === "REGISTER" && { registrationDate: new Date().getTime() }),
          workflow: {
            ...caseDetails?.workflow,
            action,
            ...(action === "SEND_BACK" && { assignes: [...allComplainantSideUuids] || [], comments: data?.comment }),
          },
        },
        tenantId,
      },
      tenantId
    ).then((response) => {
      setUpdatedCaseDetails(response?.cases?.[0]);
      refetch();
      revalidate();
      return response;
    });
  };

  const caseInfo = [
    {
      key: "CASE_NUMBER",
      value: caseDetails?.filingNumber,
    },
    {
      key: "CASE_CATEGORY",
      value: caseDetails?.caseCategory,
    },
    {
      key: "CASE_TYPE",
      value: "NIA S138",
    },
    {
      key: "COURT_NAME",
      value: t(`COMMON_MASTERS_COURT_R00M_${caseDetails?.courtId}`),
    },
    {
      key: "SUBMITTED_ON",
      value: formatDate(new Date(caseDetails?.filingDate)),
    },
  ];

  const litigants = useMemo(() => (caseDetails?.litigants?.length > 0 ? caseDetails?.litigants : []), [caseDetails]);
  const finalLitigantsData = useMemo(
    () =>
      litigants.map((litigant) => {
        return {
          ...litigant,
          name: litigant.additionalDetails?.fullName,
        };
      }),
    [litigants]
  );

  const reps = useMemo(() => (caseDetails?.representatives?.length > 0 ? caseDetails?.representatives : []), [caseDetails]);
  const finalRepresentativesData = useMemo(
    () =>
      reps.map((rep) => {
        return {
          ...rep,
          name: rep.additionalDetails?.advocateName,
          partyType: `Advocate (for ${rep.representing?.map((client) => client?.additionalDetails?.fullName)?.join(", ")})`,
        };
      }),
    [reps]
  );

  const statue = useMemo(
    () =>
      caseDetails?.statutesAndSections?.[0]?.sections?.[0]
        ? `${caseDetails?.statutesAndSections[0]?.sections[0]
            ?.split(" ")
            ?.map((splitString) => splitString.charAt(0))
            ?.join("")} S${caseDetails?.statutesAndSections[0]?.subsections[0]}`
        : "",
    [caseDetails?.statutesAndSections]
  );

  const caseRelatedData = useMemo(
    () => ({
      caseId,
      filingNumber: caseDetails?.filingNumber,
      cnrNumber: updatedCaseDetails?.cnrNumber,
      title: caseDetails?.caseTitle || "",
      stage: caseDetails?.stage,
      parties: [...finalLitigantsData, ...finalRepresentativesData],
      case: caseDetails,
      statue: statue,
    }),
    [caseDetails, caseId, finalLitigantsData, finalRepresentativesData, statue, updatedCaseDetails]
  );

  const onFormValueChange = (setValue, formData, formState, reset, setError, clearErrors, trigger, getValues) => {
    if (JSON.stringify(formData) !== JSON.stringify(formdata.data)) {
      runComprehensiveSanitizer({ formData, setValue });
      setFormdata((prev) => {
        return { ...prev, data: formData };
      });
    }
  };
  const onSubmit = async () => {
    switch (primaryAction.action) {
      case "REGISTER":
        try {
          if (isDelayCondonationApplicable) {
            try {
              setLoader(true);
              setIsDisabled(true);
              await createDcaAndPendingTasks();
            } catch (error) {
              setShowErrorToast("INTERNAL_ERROR_OCCURRED");
              setIsDisabled(false);
              throw new Error("Delay condonation application creation failed: " + error.message);
            }
          }
          await handleRegisterCase();
          await applicationRefetch();
          setCreateAdmissionOrder(true);
          setLoader(false);
        } catch (error) {
          setShowErrorToast("INTERNAL_ERROR_OCCURRED");
          console.error("some error occurred:", error);
          setLoader(false);
        }
        break;
      case "ADMIT":
        setSubmitModalInfo({ ...admitCaseSubmitConfig, caseInfo: caseInfo });
        setModalInfo({ type: "admitCase", page: 0 });
        setShowModal(true);
        break;
      case "SCHEDULE_ADMISSION_HEARING":
        setShowModal(true);
        setSubmitModalInfo({
          ...scheduleCaseSubmitConfig,
          caseInfo: [...caseInfo],
          shortCaseInfo: [
            {
              key: "CASE_NUMBER",
              value: caseDetails?.filingNumber,
            },
            {
              key: "COURT_NAME",
              value: t(`COMMON_MASTERS_COURT_R00M_${caseDetails?.courtId}`),
            },
            {
              key: "CASE_TYPE",
              value: "NIA S138",
            },
          ],
        });
        setModalInfo({ type: "schedule", page: 0 });
        break;
      default:
        setSubmitModalInfo({ ...admitCaseSubmitConfig, caseInfo: caseInfo });
        setModalInfo({ type: "admitCase", page: 0 });
        setShowModal(true);
        break;
    }
  };

  const onSaveDraft = () => {
    setShowModal(true);
    setSubmitModalInfo({
      ...scheduleCaseSubmitConfig,
      caseInfo: [...caseInfo],
      shortCaseInfo: [
        {
          key: "CASE_NUMBER",
          value: caseDetails?.filingNumber,
        },
        {
          key: "COURT_NAME",
          value: t(`COMMON_MASTERS_COURT_R00M_${caseDetails?.courtId}`),
        },
        {
          key: "CASE_TYPE",
          value: "NIA S138",
        },
      ],
    });
    setModalInfo({ type: "schedule", page: 0 });
    setCreateAdmissionOrder(true);
  };
  const onSendBack = () => {
    setSubmitModalInfo({
      ...sendBackCase,
      caseInfo: [{ key: "CASE_FILE_NUMBER", value: caseDetails?.filingNumber }],
    });
    setShowModal(true);
    setModalInfo({ type: "sendCaseBack", page: 0 });
  };

  const closeToast = () => {
    setShowErrorToast(false);
  };

  const handleSendCaseBack = (props) => {
    updateCaseDetails("SEND_BACK", { comment: props?.commentForLitigant }).then((res) => {
      setModalInfo({ ...modalInfo, page: 1 });
    });
  };

  const fetchBasicUserInfo = async () => {
    const individualData = await window?.Digit.DRISTIService.searchIndividualUser(
      {
        Individual: {
          userUuid: [caseDetails?.auditDetails?.createdBy],
        },
      },
      { tenantId, limit: 1000, offset: 0 },
      "",
      caseDetails?.auditDetails?.createdBy
    );

    return individualData?.Individual?.[0]?.individualId;
  };

  const efilingCreatorMainUser = useMemo(() => {
    // If either an advocate or its associated members(jr. advocate/clerk) created the case.
    const isAdvocateOfficeCreator = caseDetails?.representatives?.find(
      (rep) => rep?.advocateFilingStatus === advocateCaseFilingStatusTypes?.CASE_OWNER
    );
    if (isAdvocateOfficeCreator) {
      return isAdvocateOfficeCreator?.additionalDetails?.uuid;
    }
    // else if a complainant created the case
    return caseDetails?.auditDetails?.createdBy;
  }, [caseDetails]);

  const handleRegisterCase = async () => {
    setIsDisabled(true);
    setCaseADmitLoader(true);
    const individualId = await fetchBasicUserInfo();
    let documentList = [];
    documentList = [
      ...documentList,
      ...caseDetails?.caseDetails?.chequeDetails?.formdata?.map((form) => ({
        document: form?.data?.bouncedChequeFileUpload?.document,
        key: "bouncedChequeFileUpload",
      })),
      ...caseDetails?.caseDetails?.chequeDetails?.formdata?.map((form) => ({
        document: form?.data?.depositChequeFileUpload?.document,
        key: "depositChequeFileUpload",
      })),
      ...caseDetails?.caseDetails?.chequeDetails?.formdata?.map((form) => ({
        document: form?.data?.returnMemoFileUpload?.document,
        key: "returnMemoFileUpload",
      })),
      ...caseDetails?.caseDetails?.debtLiabilityDetails?.formdata?.map((form) => ({
        document: form?.data?.debtLiabilityFileUpload?.document,
        key: "debtLiabilityFileUpload",
      })),
      ...caseDetails?.caseDetails?.demandNoticeDetails?.formdata?.map((form) => ({
        document: form?.data?.legalDemandNoticeFileUpload?.document,
        key: "legalDemandNoticeFileUpload",
      })),
      ...caseDetails?.caseDetails?.demandNoticeDetails?.formdata?.map((form) => ({
        document: form?.data?.proofOfAcknowledgmentFileUpload?.document,
        key: "proofOfAcknowledgmentFileUpload",
      })),
      ...caseDetails?.caseDetails?.demandNoticeDetails?.formdata?.map((form) => ({
        document: form?.data?.proofOfDispatchFileUpload?.document,
        key: "proofOfDispatchFileUpload",
      })),
      ...caseDetails?.caseDetails?.demandNoticeDetails?.formdata?.map((form) => ({
        document: form?.data?.proofOfReplyFileUpload?.document,
        key: "proofOfReplyFileUpload",
      })),
      ...caseDetails?.additionalDetails?.prayerSwornStatement?.formdata?.map((form) => ({
        document: form?.data?.swornStatement?.document,
        key: "swornStatement",
      })),
      ...caseDetails?.additionalDetails?.respondentDetails?.formdata?.map((form) => ({
        document: form?.data?.inquiryAffidavitFileUpload?.document,
        key: "inquiryAffidavitFileUpload",
      })),
      ...caseDetails?.additionalDetails?.advocateDetails?.formdata?.map((form) => ({
        document: form?.data?.multipleAdvocatesAndPip?.vakalatnamaFileUpload
          ? form?.data?.multipleAdvocatesAndPip?.vakalatnamaFileUpload?.document
          : form?.data?.multipleAdvocatesAndPip?.pipAffidavitFileUpload?.document,
        key: form?.data?.multipleAdvocatesAndPip?.vakalatnamaFileUpload ? "vakalatnamaFileUpload" : "pipAffidavitFileUpload",
      })),
    ].flat();

    updateCaseDetails("REGISTER", formdata).then(async (res) => {
      await Promise.all(
        documentList
          ?.filter((data) => data)
          ?.map(async (data) => {
            data?.document?.forEach(async (docFile) => {
              if (docFile?.fileStore) {
                try {
                  await DRISTIService.createEvidence({
                    artifact: {
                      artifactType: documentTypeMapping[data?.key],
                      sourceType: "COMPLAINANT",
                      sourceID: individualId,
                      asUser: efilingCreatorMainUser, // Sending uuid of the main advocate even if clerk/jr. adv has filed/edited the case.
                      caseId: caseDetails?.id,
                      filingNumber: caseDetails?.filingNumber,
                      cnrNumber: res?.cases?.[0]?.cnrNumber,
                      tenantId,
                      comments: [],
                      file: {
                        documentType: docFile?.fileType || docFile?.documentType,
                        fileStore: docFile?.fileStore,
                        fileName: docFile?.fileName,
                        documentName: docFile?.documentName,
                      },
                      filingType: filingType,
                      workflow: {
                        action: "TYPE DEPOSITION",
                        documents: [
                          {
                            documentType: docFile?.fileType || docFile?.documentType,
                            fileName: docFile?.fileName,
                            documentName: docFile?.documentName,
                            fileStoreId: docFile?.fileStore,
                          },
                        ],
                      },
                    },
                  });
                } catch (error) {
                  console.error(`Error creating evidence for document ${docFile.fileName}:`, error);
                }
              }
            });
          })
      );
      setCaseADmitLoader(false);
      setSubmitModalInfo({
        ...registerCaseConfig,
        showCopytext: true,
        showTable: false,
        caseInfo: [
          {
            key: "Complaint/ CMP No.",
            value: res?.cases?.[0]?.cmpNumber,
          },
          {
            key: "CNR No.",
            value: res?.cases?.[0]?.cnrNumber,
          },
        ],
      });
      setModalInfo({ ...modalInfo, page: 4 });
      setIsDisabled(false);
      setShowModal(true);
    });
  };

  const isDelayCondonationApplicable = useMemo(
    () => caseDetails?.caseDetails?.delayApplications?.formdata[0]?.data?.delayCondonationType?.code === "NO",
    [caseDetails]
  );
  const isDelayCondonationDocUploadSkipped = useMemo(
    () =>
      caseDetails?.caseDetails?.delayApplications?.formdata[0]?.data?.delayCondonationType?.code === "NO" &&
      caseDetails?.caseDetails?.delayApplications?.formdata[0]?.data?.isDcaSkippedInEFiling?.code === "YES",
    [caseDetails]
  );
  const delayCondonationDocument = useMemo(() => caseDetails?.caseDetails?.delayApplications?.formdata[0]?.data?.condonationFileUpload?.document, [
    caseDetails,
  ]);

  const isButtonDisabled = useMemo(() => isLoading || isWorkFlowLoading || caseAdmitLoader || isLoader, [
    isLoading,
    isWorkFlowLoading,
    caseAdmitLoader,
    isLoader,
  ]);

  const createDcaAndPendingTasks = async () => {
    if (isDelayCondonationApplicable) {
      if (!isDelayCondonationDocUploadSkipped) {
        await handleCreateDelayCondonation();
      } else {
        try {
          DRISTIService.customApiService(Urls.dristi.pendingTask, {
            pendingTask: {
              name: "Create DCA Applications",
              entityType: "delay-condonation-submission",
              referenceId: `MANUAL_DCA_${caseDetails?.filingNumber}`,
              status: "CREATE_DCA_SUBMISSION",
              assignedTo: representativesUuid?.map((uuid) => ({ uuid })),
              assignedRole: [],
              cnrNumber: caseDetails?.cnrNumber,
              filingNumber: caseDetails?.filingNumber,
              caseId: caseDetails?.id,
              caseTitle: caseDetails?.caseTitle,
              isCompleted: false,
              additionalDetails: {
                litigants: [caseDetails?.litigants?.find((litigant) => litigant?.partyType === "complainant.primary")?.individualId],
              },
              tenantId,
            },
          });
        } catch (error) {
          console.error("error", error);
          throw new Error(error);
        }
      }
    }
  };

  const handleCreateDelayCondonation = async () => {
    const applicationReqBody = {
      tenantId,
      application: {
        tenantId,
        filingNumber,
        cnrNumber: caseDetails?.cnrNumber,
        cmpNumber: caseDetails?.cmpNumber,
        caseId: caseDetails?.id,
        asUser: efilingCreatorMainUser, // Sending uuid of the main advocate even if clerk/jr. adv has filed/edited the case.
        createdDate: new Date().getTime(),
        applicationType: "DELAY_CONDONATION",
        status: caseDetails?.status,
        isActive: true,
        statuteSection: { tenantId },
        documents: delayCondonationDocument?.map((item) => ({
          documentType: item?.documentType,
          fileStore: item?.fileStore,
          additionalDetails: { name: item?.fileName },
        })),
        additionalDetails: {
          owner: caseDetails?.additionalDetails?.payerName || "",
        },
        onBehalfOf: [complainantPrimaryUUId],
        comment: [],
        workflow: {
          id: "workflow123",
          action: SubmissionWorkflowAction.CREATE,
          status: "in_progress",
          comments: "Workflow comments",
          documents: [{}],
        },
      },
    };
    try {
      return await DRISTIService.createApplication(applicationReqBody, { tenantId });
    } catch (error) {
      console.error("Failed to create applications :>> ", error);
    }
  };

  const handleScheduleNextHearing = () => {
    const reqBody = {
      order: {
        createdDate: null,
        tenantId,
        cnrNumber: updatedCaseDetails?.cnrNumber || caseDetails?.cnrNumber,
        filingNumber: caseDetails?.filingNumber,
        statuteSection: {
          tenantId,
        },
        orderTitle: OrderTypes.SCHEDULE_OF_HEARING_DATE,
        orderCategory: "INTERMEDIATE",
        orderType: OrderTypes.SCHEDULE_OF_HEARING_DATE,
        status: "",
        isActive: true,
        workflow: {
          action: OrderWorkflowAction.SAVE_DRAFT,
          comments: "Creating order",
          assignes: null,
          rating: null,
          documents: [{}],
        },
        documents: [],
        additionalDetails: {
          formdata: {
            orderType: {
              code: OrderTypes.SCHEDULE_OF_HEARING_DATE,
              type: OrderTypes.SCHEDULE_OF_HEARING_DATE,
              name: `ORDER_TYPE_${OrderTypes.SCHEDULE_OF_HEARING_DATE}`,
            },
          },
        },
      },
    };
    DRISTIService.customApiService(Urls.dristi.ordersCreate, reqBody, { tenantId })
      .then((res) => {
        history.push(
          `/${window?.contextPath}/employee/orders/generate-order?filingNumber=${caseDetails?.filingNumber}&orderNumber=${res.order.orderNumber}`,
          {
            caseId: caseId,
            tab: "Orders",
          }
        );
        DRISTIService.customApiService(Urls.dristi.pendingTask, {
          pendingTask: {
            actionCategory: "Schedule Hearing",
            name: "Schedule Hearing",
            entityType: "case-default",
            referenceId: `MANUAL_${caseDetails?.filingNumber}`,
            status: "SCHEDULE_HEARING",
            assignedTo: [],
            assignedRole: ["PENDING_TASK_ORDER"],
            cnrNumber: updatedCaseDetails?.cnrNumber,
            filingNumber: caseDetails?.filingNumber,
            caseId: caseDetails?.id,
            caseTitle: caseDetails?.caseTitle,
            isCompleted: true,
            stateSla: todayDate + stateSla.SCHEDULE_HEARING,
            additionalDetails: {},
            tenantId,
          },
        });
      })
      .catch((error) => {
        console.error("Error while creating order", error);
      });
  };

  const sidebar = ["litigentDetails", "caseSpecificDetails", "additionalDetails"];
  const labels = {
    litigentDetails: "CS_LITIGENT_DETAILS",
    caseSpecificDetails: "CS_CASE_SPECIFIC_DETAILS",
    additionalDetails: "CS_ADDITIONAL_DETAILS",
  };

  const caseAdmittedSubmit = (data) => {
    const dateArr = data.date.split(" ").map((date, i) => (i === 0 ? date.slice(0, date.length - 2) : date));
    const date = new Date(dateArr.join(" "));
    const reqBody = {
      order: {
        createdDate: null,
        tenantId,
        cnrNumber: updatedCaseDetails?.cnrNumber,
        filingNumber: caseDetails?.filingNumber,
        statuteSection: {
          tenantId,
        },
        orderTitle: "SCHEDULE_OF_HEARING_DATE",
        orderCategory: "INTERMEDIATE",
        orderType: "SCHEDULE_OF_HEARING_DATE",
        status: "",
        isActive: true,
        workflow: {
          action: OrderWorkflowAction.SAVE_DRAFT,
          comments: "Creating order",
          assignes: null,
          rating: null,
          documents: [{}],
        },
        documents: [],
        additionalDetails: {
          formdata: {
            hearingDate: formatDate(date).split("-").reverse().join("-"),
            hearingPurpose: data.purpose,
            orderType: {
              code: "SCHEDULE_OF_HEARING_DATE",
              type: "SCHEDULE_OF_HEARING_DATE",
              name: "ORDER_TYPE_SCHEDULE_OF_HEARING_DATE",
            },
          },
        },
      },
    };
    ordersService
      .createOrder(reqBody, { tenantId })
      .then(async (res) => {
        await DRISTIService.customApiService(Urls.dristi.pendingTask, {
          pendingTask: {
            name: `Draft in Progress for ${t(data.purpose?.code)} Hearing Order`,
            entityType: "order-default",
            referenceId: `MANUAL_${res.order.orderNumber}`,
            status: "DRAFT_IN_PROGRESS",
            assignedTo: [],
            assignedRole: ["PENDING_TASK_ORDER"],
            cnrNumber: updatedCaseDetails?.cnrNumber,
            filingNumber: caseDetails?.filingNumber,
            caseId: caseDetails?.id,
            caseTitle: caseDetails?.caseTitle,
            isCompleted: false,
            stateSla: todayDate + stateSla.SCHEDULE_HEARING,
            additionalDetails: {},
            tenantId,
          },
        });
        await DRISTIService.customApiService(Urls.dristi.pendingTask, {
          pendingTask: {
            name: "Pending Response",
            entityType: "case-default",
            referenceId: `MANUAL_${caseDetails?.filingNumber}`,
            status: "PENDING_RESPONSE",
            assignedRole: ["CASE_RESPONDER"],
            cnrNumber: caseDetails?.cnrNumber,
            filingNumber: caseDetails?.filingNumber,
            caseId: caseDetails?.id,
            caseTitle: caseDetails?.caseTitle,
            isCompleted: true,
            tenantId,
          },
        });
        history.replace(
          `/${window.contextPath}/employee/orders/generate-order?filingNumber=${caseDetails?.filingNumber}&orderNumber=${res.order.orderNumber}`
        );
      })
      .catch((err) => {});
  };

  const handleDownloadPdf = () => {
    const fileStoreId =
      caseDetails?.documents?.find((doc) => doc?.key === "case.complaint.signed")?.fileStore || caseDetails?.additionalDetails?.signedCaseDocument;

    if (fileStoreId) {
      downloadPdf(tenantId, fileStoreId);
      return;
    } else {
      console.error("No fileStoreId available for download.");
      return;
    }
  };

  if (!caseId || (caseDetails && caseDetails?.status === CaseWorkflowState.CASE_ADMITTED)) {
    return caseId ? (
      <Redirect
        to={`/${window?.contextPath}/${userInfoType}/dristi/home/view-case?caseId=${caseId}&filingNumber=${caseDetails?.filingNumber}&tab=Overview`}
      />
    ) : (
      <Redirect to="/" />
    );
  }

  if (isLoading || isWorkFlowLoading || isLoader || caseAdmitLoader || isApplicationLoading || isFilingTypeLoading) {
    return <Loader />;
  }
  const scrollToHeading = (heading) => {
    const scroller = Array.from(document.querySelectorAll(".label-field-pair .accordion-title")).find((el) => el.textContent === heading);
    scroller.scrollIntoView({ block: "center", behavior: "smooth" });
  };
  return (
    <React.Fragment>
      <Breadcrumb crumbs={employeeCrumbs} breadcrumbStyle={{ paddingLeft: 20 }}></Breadcrumb>

      <div className={"case-and-admission"}>
        <div className="view-case-file">
          <div className="file-case">
            <div className="file-case-side-stepper">
              <div className="file-case-select-form-section">
                {sidebar?.map((key, index) => (
                  <div className="accordion-wrapper">
                    <div key={index} className="accordion-title" onClick={() => scrollToHeading(`${index + 1}. ${t(labels[key])}`)}>
                      <div>{`${index + 1}. ${t(labels[key])}`}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="file-case-form-section">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <BackButton style={{ marginBottom: 0 }}></BackButton>
                <button style={{ display: "flex", alignItems: "center", background: "none" }} onClick={handleDownloadPdf}>
                  <span style={{ display: "flex", alignItems: "center" }}>
                    <FileDownloadIcon svgStyle={downloadSvgStyle} pathStyle={downloadPathStyle} />
                  </span>
                  <span style={downloadButtonTextStyle}>{t("CS_COMMON_DOWNLOAD")}</span>
                </button>
              </div>
              <div className="employee-card-wrapper">
                <div className="header-content">
                  <div className="header-details" style={{ justifyContent: "normal", gap: "8px" }}>
                    <Header>{caseDetails?.caseTitle}</Header>
                    {delayCondonationData?.delayCondonationType?.code === "NO" && (
                      <div className="delay-condonation-chip" style={delayCondonationStylsMain}>
                        <p style={delayCondonationTextStyle}>
                          {(delayCondonationData?.isDcaSkippedInEFiling?.code === "NO" &&
                            ["PENDING_REGISTRATION", "UNDER_SCRUTINY"]?.includes(caseDetails?.status)) ||
                          (delayCondonationData?.isDcaSkippedInEFiling?.code === "NO" && isDelayApplicationPending) ||
                          isDelayApplicationPending ||
                          isDelayApplicationCompleted
                            ? t("DELAY_CONDONATION_FILED")
                            : t("DELAY_CONDONATION_NOT_FILED")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <CustomCaseInfoDiv t={t} data={caseInfo} style={{ margin: "24px 0px" }} />
                {caseDetails?.additionalDetails?.scrutinyComment && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "#fdf7ec",
                      padding: "10px",
                      fontSize: "14px",
                      fontFamily: "Arial, sans-serif",
                      margin: "16px 0px",
                    }}
                  >
                    <div style={{ marginRight: "8px" }}>
                      <WarningInfoRedIcon />
                    </div>
                    <p style={{ margin: 0, fontWeight: "bold" }}>
                      {t("FSO_COMMENTS")} <span style={{ fontWeight: "normal" }}>{caseDetails?.additionalDetails?.scrutinyComment}</span>
                    </p>
                  </div>
                )}
                <FormComposerV2
                  // by disabling label, we hide the action bar for court room manager.
                  label={isCaseApprover ? t(primaryAction?.label || "") : false}
                  config={formConfig}
                  onSubmit={onSubmit}
                  // defaultValues={}
                  onSecondayActionClick={onSaveDraft}
                  defaultValues={{}}
                  onFormValueChange={onFormValueChange}
                  cardStyle={{ minWidth: "100%" }}
                  isDisabled={isButtonDisabled}
                  cardClassName={`e-filing-card-form-style review-case-file`}
                  secondaryLabel={
                    [CaseWorkflowState.PENDING_RESPONSE, CaseWorkflowState.PENDING_NOTICE].includes(caseDetails?.status)
                      ? t("HEARING_IS_SCHEDULED")
                      : t(tertiaryAction.label || "")
                  }
                  showSecondaryLabel={Boolean(tertiaryAction?.action)}
                  actionClassName={"case-file-admission-action-bar"}
                  showSkip={secondaryAction?.label}
                  onSkip={onSendBack}
                  skiplabel={t(secondaryAction?.label || "")}
                  noBreakLine
                  skipStyle={{ position: "fixed", left: "20px", bottom: "18px", color: "#007E7E", fontWeight: "700" }}
                />
                {showErrorToast && <Toast error={true} label={t(showErrorToast)} isDleteBtn={true} onClose={closeToast} />}
                {showScheduleHearingModal && (
                  <ScheduleHearing
                    setUpdateCounter={setUpdateCounter}
                    showToast={() => {}}
                    tenantId={tenantId}
                    caseData={caseRelatedData}
                    setShowModal={setShowScheduleHearingModal}
                    caseAdmittedSubmit={caseAdmittedSubmit}
                    isCaseAdmitted={false}
                    createAdmissionOrder={createAdmissionOrder}
                    delayCondonationData={delayCondonationData}
                    hearingDetails={hearingDetails}
                    isDelayApplicationPending={isDelayApplicationPending}
                    isDelayApplicationCompleted={isDelayApplicationPending}
                  />
                )}
                {showModal && (
                  <AdmissionActionModal
                    t={t}
                    setShowModal={setShowModal}
                    setSubmitModalInfo={setSubmitModalInfo}
                    submitModalInfo={submitModalInfo}
                    modalInfo={modalInfo}
                    setModalInfo={setModalInfo}
                    handleSendCaseBack={handleSendCaseBack}
                    handleScheduleNextHearing={handleScheduleNextHearing}
                    caseDetails={caseDetails}
                    caseAdmittedSubmit={caseAdmittedSubmit}
                    createAdmissionOrder={createAdmissionOrder}
                    isAdmissionHearingAvailable={Boolean(currentHearingId)}
                    delayCondonationData={delayCondonationData}
                    hearingDetails={hearingDetails}
                    isDelayApplicationPending={isDelayApplicationPending}
                    isDelayApplicationCompleted={isDelayApplicationPending}
                    tenantId={tenantId}
                  ></AdmissionActionModal>
                )}
              </div>
            </div>
            <div className={"file-case-checklist"}>
              <WorkflowTimeline t={t} applicationNo={caseDetails?.filingNumber} tenantId={tenantId} businessService="case-default" />
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

export default CaseFileAdmission;
