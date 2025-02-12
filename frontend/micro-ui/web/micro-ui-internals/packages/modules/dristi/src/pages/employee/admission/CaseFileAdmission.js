import { BackButton, FormComposerV2, Header, Loader, Toast } from "@egovernments/digit-ui-react-components";
import React, { useMemo, useState } from "react";
import { Redirect, useHistory, useLocation } from "react-router-dom/cjs/react-router-dom.min";
import CustomCaseInfoDiv from "../../../components/CustomCaseInfoDiv";
import { Urls } from "../../../hooks";
import useSearchCaseService from "../../../hooks/dristi/useSearchCaseService";
import { CustomArrowDownIcon, RightArrow } from "../../../icons/svgIndex";
import { DRISTIService } from "../../../services";
import { CaseWorkflowState } from "../../../Utils/caseWorkflow";
import { OrderTypes, OrderWorkflowAction } from "../../../Utils/orderWorkflow";
import { formatDate } from "../../citizen/FileCase/CaseType";
import {
  admitCaseSubmitConfig,
  registerCaseConfig,
  scheduleCaseAdmissionConfig,
  scheduleCaseSubmitConfig,
  selectParticipantConfig,
  sendBackCase,
} from "../../citizen/FileCase/Config/admissionActionConfig";
import { reviewCaseFileFormConfig } from "../../citizen/FileCase/Config/reviewcasefileconfig";
import { getAdvocates } from "../../citizen/FileCase/EfilingValidationUtils";
import AdmissionActionModal from "./AdmissionActionModal";
import { generateUUID, getFilingType } from "../../../Utils";
import { documentTypeMapping } from "../../citizen/FileCase/Config";
import ScheduleHearing from "../AdmittedCases/ScheduleHearing";
import { SubmissionWorkflowAction, SubmissionWorkflowState } from "../../../Utils/submissionWorkflow";

const stateSla = {
  SCHEDULE_HEARING: 3 * 24 * 3600 * 1000,
  NOTICE: 3 * 24 * 3600 * 1000,
};

const casePrimaryActions = [
  { action: "REGISTER", label: "CS_REGISTER" },
  { action: "ADMIT", label: "CS_ADMIT_CASE" },
  { action: "SCHEDULE_ADMISSION_HEARING", label: "CS_SCHEDULE_ADMISSION_HEARING" },
];
const caseSecondaryActions = [
  { action: "SEND_BACK", label: "SEND_BACK_FOR_CORRECTION" },
  { action: "REJECT", label: "CS_CASE_REJECT" },
];
const caseTertiaryActions = [{ action: "ISSUE_ORDER", label: "ISSUE_NOTICE" }];

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
  const todayDate = new Date().getTime();
  const searchParams = new URLSearchParams(location.search);
  const caseId = searchParams.get("caseId");
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const [caseAdmitLoader, setCaseADmitLoader] = useState(false);
  const [updatedCaseDetails, setUpdatedCaseDetails] = useState({});
  const [createAdmissionOrder, setCreateAdmissionOrder] = useState(true);
  const [showScheduleHearingModal, setShowScheduleHearingModal] = useState(false);
  const [updateCounter, setUpdateCounter] = useState(0);
  const roles = Digit.UserService.getUser()?.info?.roles;
  const isCaseApprover = roles.some((role) => role.code === "CASE_APPROVER");
  const isCourtRoomManager = roles.some((role) => role.code === "COURT_ROOM_MANAGER");
  const moduleCode = "case-default";
  const ordersService = Digit.ComponentRegistryService.getComponent("OrdersService") || {};
  const [isLoader, setLoader] = useState(false);
  const { data: caseFetchResponse, isLoading, refetch } = useSearchCaseService(
    {
      criteria: [
        {
          caseId: caseId,
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
  const delayCondonationData = useMemo(() => caseDetails?.caseDetails?.delayApplications?.formdata?.[0]?.data, [caseDetails]);
  const allAdvocates = useMemo(() => getAdvocates(caseDetails), [caseDetails]);
  const representativesUuid = useMemo(() => allAdvocates?.[Object.keys(allAdvocates)?.[0]], [allAdvocates]);
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
      cacheTime: 0,
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
      },
    },
    {},
    filingNumber,
    Boolean(filingNumber)
  );

  const { data: applicationData, isLoading: isApplicationLoading, refetch: applicationRefetch } = Digit.Hooks.submissions.useSearchSubmissionService(
    {
      criteria: {
        filingNumber,
        tenantId,
      },
      tenantId,
    },
    {},
    filingNumber + "allApplications",
    filingNumber
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
    return [
      ...reviewCaseFileFormConfig?.map((form) => {
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
                    data: caseDetails?.additionalDetails?.[input?.key]?.formdata || caseDetails?.caseDetails?.[input?.key]?.formdata || {},
                  };
                }),
              },
            };
          }),
        };
      }),
    ];
  }, [caseDetails]);

  const handleIssueNotice = async (hearingDate, hearingNumber) => {
    try {
      const orderBody = {
        createdDate: null,
        tenantId,
        cnrNumber: caseDetails?.cnrNumber,
        filingNumber: caseDetails?.filingNumber,
        statuteSection: {
          tenantId,
        },
        orderType: "NOTICE",
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
        ...(hearingNumber && { hearingNumber }),
        additionalDetails: {
          formdata: {
            orderType: {
              code: "NOTICE",
              type: "NOTICE",
              name: "ORDER_TYPE_NOTICE",
            },
            hearingDate,
          },
        },
      };
      DRISTIService.customApiService(Urls.dristi.ordersCreate, { order: orderBody }, { tenantId })
        .then((res) => {
          DRISTIService.customApiService(Urls.dristi.pendingTask, {
            pendingTask: {
              name: t("DRAFT_IN_PROGRESS_ISSUE_NOTICE"),
              entityType: "order-default",
              referenceId: `MANUAL_${res?.order?.orderNumber}`,
              status: "DRAFT_IN_PROGRESS",
              assignedTo: [],
              assignedRole: ["JUDGE_ROLE"],
              cnrNumber: updatedCaseDetails?.cnrNumber,
              filingNumber: caseDetails?.filingNumber,
              isCompleted: false,
              stateSla: todayDate + stateSla.NOTICE,
              additionalDetails: {},
              tenantId,
            },
          });
          history.push(`/digit-ui/employee/orders/generate-orders?filingNumber=${caseDetails?.filingNumber}&orderNumber=${res.order.orderNumber}`, {
            caseId: caseDetails?.id,
            tab: "Orders",
          });
        })
        .catch();
    } catch (error) {}
  };

  const updateCaseDetails = async (action, data = {}) => {
    let respondentDetails = caseDetails?.additionalDetails?.respondentDetails;
    let witnessDetails = caseDetails?.additionalDetails?.witnessDetails;
    if (action === "ADMIT") {
      respondentDetails = {
        ...caseDetails?.additionalDetails?.respondentDetails,
        formdata: caseDetails?.additionalDetails?.respondentDetails?.formdata?.map((data) => ({
          ...data,
          data: {
            ...data?.data,
            uuid: generateUUID(),
          },
        })),
      };
      witnessDetails = {
        ...caseDetails?.additionalDetails?.witnessDetails,
        formdata: caseDetails?.additionalDetails?.witnessDetails?.formdata?.map((data) => ({
          ...data,
          data: {
            ...data?.data,
            uuid: generateUUID(),
          },
        })),
      };
    }
    const newcasedetails = {
      ...caseDetails,
      additionalDetails: { ...caseDetails.additionalDetails, respondentDetails, witnessDetails, judge: data },
    };

    return DRISTIService.caseUpdateService(
      {
        cases: {
          ...newcasedetails,
          linkedCases: caseDetails?.linkedCases ? caseDetails?.linkedCases : [],
          ...(action === "REGISTER" && { registrationDate: new Date().getTime() }),
          workflow: {
            ...caseDetails?.workflow,
            action,
            ...(action === "SEND_BACK" && { assignes: [caseDetails.auditDetails.createdBy] || [] }),
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
        if (caseDetails?.status === "ADMISSION_HEARING_SCHEDULED") {
          const { HearingList = [] } = await Digit.HearingService.searchHearings({
            hearing: { tenantId },
            criteria: {
              tenantID: tenantId,
              filingNumber: caseDetails?.filingNumber,
            },
          });
          const { startTime: hearingDate, hearingId: hearingNumber } = HearingList?.find(
            (list) => list?.hearingType === "ADMISSION" && !(list?.status === "COMPLETED" || list?.status === "ABATED")
          );
          const {
            list: [orderData],
          } = await Digit.ordersService.searchOrder({
            tenantId,
            criteria: {
              filingNumber: caseDetails?.filingNumber,
              applicationNumber: "",
              cnrNumber: caseDetails?.cnrNumber,
              status: "DRAFT_IN_PROGRESS",
              hearingNumber: hearingNumber,
            },
            pagination: { limit: 1, offset: 0 },
          });
          if (orderData?.orderType === "NOTICE") {
            history.push(`/digit-ui/employee/orders/generate-orders?filingNumber=${caseDetails?.filingNumber}&orderNumber=${orderData.orderNumber}`, {
              caseId: caseId,
              tab: "Orders",
            });
            updateCaseDetails("ADMIT");
          } else {
            handleIssueNotice(hearingDate, hearingNumber);
            await updateCaseDetails("ADMIT");
          }
        } else {
          setSubmitModalInfo({ ...admitCaseSubmitConfig, caseInfo: caseInfo });
          setModalInfo({ type: "admitCase", page: 0 });
          setShowModal(true);
        }
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
    updateCaseDetails("SEND_BACK", { comment: props?.commentForLitigant, isJudge: true }).then((res) => {
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

  const handleAdmitCase = async () => {
    setCaseADmitLoader(true);
    updateCaseDetails("ADMIT", formdata).then(async (res) => {
      setModalInfo({ ...modalInfo, page: 1 });
      setCaseADmitLoader(false);
      const { HearingList = [] } = await Digit.HearingService.searchHearings({
        hearing: { tenantId },
        criteria: {
          tenantID: tenantId,
          filingNumber: caseDetails?.filingNumber,
        },
      });
      const hearingData =
        HearingList?.find((list) => list?.hearingType === "ADMISSION" && !(list?.status === "COMPLETED" || list?.status === "ABATED")) || {};
      if (hearingData.hearingId) {
        hearingData.workflow = hearingData.workflow || {};
        hearingData.workflow.action = "ABANDON";
        await Digit.HearingService.updateHearings(
          { tenantId, hearing: hearingData, hearingType: "", status: "" },
          { applicationNumber: "", cnrNumber: "" }
        );
      }
      DRISTIService.customApiService(Urls.dristi.pendingTask, {
        pendingTask: {
          name: "Schedule Hearing",
          entityType: "case-default",
          referenceId: `MANUAL_${caseDetails?.filingNumber}`,
          status: "SCHEDULE_HEARING",
          assignedTo: [],
          assignedRole: ["JUDGE_ROLE"],
          cnrNumber: updatedCaseDetails?.cnrNumber,
          filingNumber: caseDetails?.filingNumber,
          isCompleted: false,
          stateSla: todayDate + stateSla.SCHEDULE_HEARING,
          additionalDetails: {},
          tenantId,
        },
      });
    });
  };

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
        document: form?.data?.vakalatnamaFileUpload?.document,
        key: "vakalatnamaFileUpload",
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

  const scheduleHearing = async ({ purpose, participant, date }) => {
    return DRISTIService.createHearings(
      {
        hearing: {
          tenantId: tenantId,
          filingNumber: [caseDetails.filingNumber],
          hearingType: purpose,
          status: true,
          attendees: [
            ...Object.values(participant)
              .map((val) => val.attendees.map((attendee) => JSON.parse(attendee)))
              .flat(Infinity),
          ],
          startTime: Date.parse(
            `${date
              .split(" ")
              .map((date, i) => (i === 0 ? date.slice(0, date.length - 2) : date))
              .join(" ")}`
          ),
          endTime: Date.parse(
            `${date
              .split(" ")
              .map((date, i) => (i === 0 ? date.slice(0, date.length - 2) : date))
              .join(" ")}`
          ),
          workflow: {
            action: "CREATE",
            assignes: [],
            comments: "Create new Hearing",
            documents: [{}],
          },
          documents: [],
        },
        tenantId,
      },
      { tenantId: tenantId }
    );
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
              isCompleted: false,
              additionalDetails: {},
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

  const handleScheduleCase = async (props) => {
    const hearingData = await scheduleHearing({ purpose: "ADMISSION", date: props.date, participant: props.participant });
    setSubmitModalInfo({
      ...scheduleCaseAdmissionConfig,
      caseInfo: [
        ...caseInfo,
        {
          key: "CS_ISSUE_NOTICE",
          value: props.date,
        },
        {
          hearingNumber: hearingData?.hearing?.hearingNumber,
        },
      ],
    });
    updateCaseDetails("SCHEDULE_ADMISSION_HEARING", props).then((res) => {
      setModalInfo({ ...modalInfo, page: 2 });
    });
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
        history.push(`/digit-ui/employee/orders/generate-orders?filingNumber=${caseDetails?.filingNumber}&orderNumber=${res.order.orderNumber}`, {
          caseId: caseId,
          tab: "Orders",
        });
        DRISTIService.customApiService(Urls.dristi.pendingTask, {
          pendingTask: {
            name: "Schedule Hearing",
            entityType: "case-default",
            referenceId: `MANUAL_${caseDetails?.filingNumber}`,
            status: "SCHEDULE_HEARING",
            assignedTo: [],
            assignedRole: ["JUDGE_ROLE"],
            cnrNumber: updatedCaseDetails?.cnrNumber,
            filingNumber: caseDetails?.filingNumber,
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

  const updateConfigWithCaseDetails = (config, caseDetails) => {
    const litigantsNames = caseDetails.litigants?.map((litigant) => {
      return { name: litigant.additionalDetails.fullName, individualId: litigant.individualId };
    });

    config.checkBoxes.forEach((checkbox) => {
      if (checkbox.key === "Litigants") {
        checkbox.dependentFields = litigantsNames;
      }
    });

    return config;
  };

  const updatedConfig = caseDetails && updateConfigWithCaseDetails(selectParticipantConfig, caseDetails);
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
            assignedRole: ["JUDGE_ROLE"],
            cnrNumber: updatedCaseDetails?.cnrNumber,
            filingNumber: caseDetails?.filingNumber,
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
            isCompleted: true,
            tenantId,
          },
        });
        history.push(
          `/${window.contextPath}/employee/orders/generate-orders?filingNumber=${caseDetails?.filingNumber}&orderNumber=${res.order.orderNumber}`
        );
      })
      .catch((err) => {});
  };

  if (!caseId || (caseDetails && caseDetails?.status === CaseWorkflowState.CASE_ADMITTED)) {
    return <Redirect to="/" />;
  }

  if (isLoading || isWorkFlowLoading || isLoader || caseAdmitLoader) {
    return <Loader />;
  }
  const scrollToHeading = (heading) => {
    const scroller = Array.from(document.querySelectorAll(".label-field-pair .accordion-title")).find((el) => el.textContent === heading);
    scroller.scrollIntoView({ block: "center", behavior: "smooth" });
  };
  return (
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
            <BackButton style={{ marginBottom: 0 }}></BackButton>
            <div className="employee-card-wrapper">
              <div className="header-content">
                <div className="header-details" style={{ justifyContent: "normal", gap: "8px" }}>
                  <Header>{caseDetails?.caseTitle}</Header>
                  {delayCondonationData?.delayCondonationType?.code === "NO" && (
                    <div className="delay-condonation-chip" style={delayCondonationStylsMain}>
                      <p style={delayCondonationTextStyle}>
                        {(delayCondonationData?.isDcaSkippedInEFiling?.code === "NO" && "PENDING_REGISTRATION" === caseDetails?.status) ||
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
              <FormComposerV2
                // by disabling label, we hide the action bar for court room manager.
                label={isCourtRoomManager ? false : isCaseApprover ? t(primaryAction?.label || "") : false}
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
                  [CaseWorkflowState.ADMISSION_HEARING_SCHEDULED, CaseWorkflowState.PENDING_RESPONSE, CaseWorkflowState.PENDING_NOTICE].includes(
                    caseDetails?.status
                  )
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
                  handleAdmitCase={handleAdmitCase}
                  path={path}
                  handleScheduleCase={handleScheduleCase}
                  updatedConfig={updatedConfig}
                  tenantId={tenantId}
                  handleScheduleNextHearing={handleScheduleNextHearing}
                  caseAdmitLoader={caseAdmitLoader}
                  caseDetails={caseDetails}
                  caseAdmittedSubmit={caseAdmittedSubmit}
                  createAdmissionOrder={createAdmissionOrder}
                  isAdmissionHearingAvailable={Boolean(currentHearingId)}
                  delayCondonationData={delayCondonationData}
                  hearingDetails={hearingDetails}
                  isDelayApplicationPending={isDelayApplicationPending}
                  isDelayApplicationCompleted={isDelayApplicationPending}
                ></AdmissionActionModal>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CaseFileAdmission;
