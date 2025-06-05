import { CloseSvg, TextInput, Toast } from "@egovernments/digit-ui-react-components";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import CommentComponent from "../../../components/CommentComponent";
import ConfirmEvidenceAction from "../../../components/ConfirmEvidenceAction";
import ConfirmSubmissionAction from "../../../components/ConfirmSubmissionAction";
import Modal from "../../../components/Modal";
import SubmissionSuccessModal from "../../../components/SubmissionSuccessModal";
import { Urls } from "../../../hooks";
import { RightArrow, WarningInfoIconYellow } from "../../../icons/svgIndex";
import { DRISTIService } from "../../../services";
import { SubmissionWorkflowAction, SubmissionWorkflowState } from "../../../Utils/submissionWorkflow";
import { getAdvocates } from "../../citizen/FileCase/EfilingValidationUtils";
import DocViewerWrapper from "../docViewerWrapper";
import SelectCustomDocUpload from "../../../components/SelectCustomDocUpload";
import ESignSignatureModal from "../../../components/ESignSignatureModal";
import useDownloadCasePdf from "../../../hooks/dristi/useDownloadCasePdf";
import { cleanString, getDate, modifiedEvidenceNumber, removeInvalidNameParts } from "../../../Utils";
import useGetAllOrderApplicationRelatedDocuments from "../../../hooks/dristi/useGetAllOrderApplicationRelatedDocuments";
import { useToast } from "../../../components/Toast/useToast";
import Button from "../../../components/Button";
import { compositeOrderAllowedTypes } from "@egovernments/digit-ui-module-orders/src/pages/employee/GenerateOrders";
import useSearchEvidenceService from "../../../../../submissions/src/hooks/submissions/useSearchEvidenceService";

const stateSla = {
  DRAFT_IN_PROGRESS: 2,
};

const dayInMillisecond = 24 * 3600 * 1000;

const EvidenceModal = ({
  caseData,
  documentSubmission = [],
  setShow,
  userRoles,
  modalType,
  setUpdateCounter,
  showToast,
  caseId,
  setIsDelayApplicationPending,
  currentDiaryEntry,
  artifact,
}) => {
  const [comments, setComments] = useState(documentSubmission[0]?.comments ? documentSubmission[0].comments : artifact?.comments || []);
  const [showConfirmationModal, setShowConfirmationModal] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(null);
  const [currentComment, setCurrentComment] = useState("");
  const history = useHistory();
  const filingNumber = useMemo(() => caseData?.filingNumber, [caseData]);
  const cnrNumber = useMemo(() => caseData?.cnrNumber, [caseData]);
  const caseCourtId = useMemo(() => caseData?.case?.courtId, [caseData]);
  const allAdvocates = useMemo(() => getAdvocates(caseData?.case), [caseData]);
  const createdBy = useMemo(() => documentSubmission?.[0]?.details?.auditDetails?.createdBy, [documentSubmission]);
  const applicationStatus = useMemo(() => documentSubmission?.[0]?.status, [documentSubmission]);
  const { t } = useTranslation();
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const OrderWorkflowAction = Digit.ComponentRegistryService.getComponent("OrderWorkflowActionEnum") || {};
  const ordersService = Digit.ComponentRegistryService.getComponent("OrdersService") || {};
  const userInfo = Digit.UserService.getUser()?.info;
  const user = Digit.UserService.getUser()?.info?.name;
  const isLitigent = useMemo(() => !userInfo?.roles?.some((role) => ["ADVOCATE_ROLE", "ADVOCATE_CLERK"].includes(role?.code)), [userInfo?.roles]);
  const isCourtRoomManager = useMemo(() => userInfo?.roles?.some((role) => ["COURT_ROOM_MANAGER"].includes(role?.code)), [userInfo?.roles]);
  const isJudge = useMemo(() => userInfo?.roles?.some((role) => ["JUDGE_ROLE"].includes(role?.code)), [userInfo?.roles]);
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo?.type]);
  const todayDate = new Date().getTime();
  const [formData, setFormData] = useState({});
  const [showFileIcon, setShowFileIcon] = useState(false);
  const { downloadPdf } = useDownloadCasePdf();
  const { documents: allCombineDocs, isLoading, fetchRecursiveData } = useGetAllOrderApplicationRelatedDocuments({ caseCourtId });
  const [isDisabled, setIsDisabled] = useState();
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
  const [businessOfTheDay, setBusinessOfTheDay] = useState(null);
  const toast = useToast();
  const urlParams = new URLSearchParams(window.location.search);
  const applicationNumber = urlParams.get("applicationNumber");
  const compositeOrderObj = history.location?.state?.compositeOrderObj;

  const setData = (data) => {
    setFormData(data);
  };

  const CloseBtn = (props) => {
    return (
      <div onClick={props?.onClick} style={{ height: "100%", display: "flex", alignItems: "center", paddingRight: "20px", cursor: "pointer" }}>
        <CloseSvg />
      </div>
    );
  };
  const Heading = (props) => {
    return (
      <div className="evidence-title">
        <h1 className="heading-m">{props.label}</h1>
        {props.showStatus && <h3 className={props.isStatusRed ? "status-false" : "status"}>{props?.status}</h3>}
      </div>
    );
  };

  const computeDefaultBOTD = useMemo(() => {
    return `${documentSubmission?.[0]?.artifactList?.artifactNumber} ${
      documentSubmission?.[0]?.artifactList?.isEvidence ? "unmarked" : "marked"
    } as evidence`;
  }, [documentSubmission]);

  useEffect(() => {
    setBusinessOfTheDay(computeDefaultBOTD);
  }, [computeDefaultBOTD, setBusinessOfTheDay]);

  const documentApplicationType = useMemo(() => documentSubmission?.[0]?.applicationList?.applicationType, [documentSubmission]);

  const respondingUuids = useMemo(() => {
    return documentSubmission?.[0]?.details?.additionalDetails?.respondingParty?.map((party) => party?.uuid?.map((uuid) => uuid))?.flat() || [];
  }, [documentSubmission]);

  const showSubmit = useMemo(() => {
    if (userType === "employee") {
      if (!isJudge) {
        return false;
      }
      if (modalType === "Documents") {
        if (documentSubmission?.[0]?.artifactList?.isVoid) return false;
        return true;
      }
      return (
        userRoles.includes("SUBMISSION_APPROVER") &&
        [SubmissionWorkflowState.PENDINGAPPROVAL, SubmissionWorkflowState.PENDINGREVIEW].includes(applicationStatus)
      );
    } else {
      if (modalType === "Documents") {
        return false;
      }
      if (userInfo?.uuid === createdBy) {
        return [SubmissionWorkflowState.DELETED].includes(applicationStatus) ? false : true;
      }
      if (isLitigent && [...allAdvocates?.[userInfo?.uuid], userInfo?.uuid]?.includes(createdBy)) {
        return [SubmissionWorkflowState.DELETED].includes(applicationStatus) ? false : true;
      }
      if (!isLitigent && allAdvocates?.[createdBy]?.includes(userInfo?.uuid)) {
        return true;
      }
      if (!isLitigent || (isLitigent && allAdvocates?.[userInfo?.uuid]?.includes(userInfo?.uuid))) {
        return [SubmissionWorkflowState?.PENDINGREVIEW, SubmissionWorkflowState.PENDINGRESPONSE].includes(applicationStatus);
      }
      return false;
    }
  }, [userType, modalType, userRoles, applicationStatus, userInfo?.uuid, createdBy, isLitigent, allAdvocates]);

  const actionSaveLabel = useMemo(() => {
    let label = "";
    if (modalType === "Submissions") {
      if (userType === "employee") {
        const applicationType = documentSubmission?.[0]?.applicationList?.applicationType;
        label = applicationType === "CORRECTION_IN_COMPLAINANT_DETAILS" ? t("REVIEW_CHANGES") : t("Approve");
      } else {
        if (userInfo?.uuid === createdBy) {
          label = t("DOWNLOAD_SUBMISSION");
        } else if (isLitigent && [...allAdvocates?.[userInfo?.uuid], userInfo?.uuid]?.includes(createdBy)) {
          label = t("DOWNLOAD_SUBMISSION");
        } else if (
          (respondingUuids?.includes(userInfo?.uuid) || !documentSubmission?.[0]?.details?.referenceId) &&
          [SubmissionWorkflowState.PENDINGRESPONSE, SubmissionWorkflowState.PENDINGREVIEW].includes(applicationStatus)
        ) {
          label = t("ADD_COMMENT");
        }
      }
    } else {
      label = !documentSubmission?.[0]?.artifactList?.isEvidence ? t("MARK_AS_EVIDENCE") : t("UNMARK_AS_EVIDENCE");
    }
    return label;
  }, [allAdvocates, applicationStatus, createdBy, documentSubmission, isLitigent, modalType, respondingUuids, t, userInfo?.uuid, userType]);
  const actionCustomLabel = useMemo(() => {
    let label = "";
    if (modalType === "Submissions") {
      if (userType === "employee") {
        label = t("SET_TERMS_OF_BAIL");
      }
    }
    return label;
  }, [allAdvocates, applicationStatus, createdBy, documentSubmission, isLitigent, modalType, respondingUuids, t, userInfo?.uuid, userType]);
  const actionCancelLabel = useMemo(() => {
    if (
      userRoles.includes("SUBMISSION_APPROVER") &&
      [SubmissionWorkflowState.PENDINGAPPROVAL, SubmissionWorkflowState.PENDINGREVIEW].includes(applicationStatus) &&
      modalType === "Submissions"
    ) {
      return t("REJECT");
    }
    if (userType === "citizen") {
      if (isLitigent && !allAdvocates?.[userInfo?.uuid]?.includes(userInfo?.uuid)) {
        return null;
      }
      if (
        userInfo?.uuid === createdBy &&
        userRoles?.includes("SUBMISSION_DELETE") &&
        !documentSubmission?.[0]?.details?.referenceId &&
        ![
          SubmissionWorkflowState.COMPLETED,
          SubmissionWorkflowState.DELETED,
          SubmissionWorkflowState.ABATED,
          SubmissionWorkflowState.REJECTED,
        ].includes(applicationStatus)
      ) {
        return t("CANCEL_SUBMISSION");
      }
    }
    return null;
  }, [allAdvocates, applicationStatus, createdBy, documentSubmission, isLitigent, modalType, t, userInfo?.uuid, userRoles, userType]);

  const reqCreate = {
    url: `/application/v1/update`,
    params: {},
    body: {},
    config: {
      enable: false,
    },
  };
  const reqEvidenceUpdate = {
    url: Urls.dristi.evidenceUpdate,
    params: {},
    body: {},
    config: {
      enable: false,
    },
  };
  const addSubmissionComment = {
    url: Urls.dristi.addSubmissionComment,
    params: {},
    body: {},
    config: {
      enable: false,
    },
  };

  const addEvidenceComment = {
    url: Urls.dristi.addEvidenceComment,
    params: {},
    body: {},
    config: {
      enable: false,
    },
  };

  const mutation = Digit.Hooks.useCustomAPIMutationHook(reqCreate);
  const evidenceUpdateMutation = Digit.Hooks.useCustomAPIMutationHook(reqEvidenceUpdate);
  const submissionComment = Digit.Hooks.useCustomAPIMutationHook(addSubmissionComment);
  const evidenceComment = Digit.Hooks.useCustomAPIMutationHook(addEvidenceComment);

  // const markAsReadPayload = {
  //   tenantId: tenantId,
  //   artifact: {
  //     tenantId: tenantId,
  //     caseId: caseId,
  //     artifactType: "AFFIDAVIT",
  //     sourceType: "COURT",
  //     application: documentSubmission[0]?.details.applicationId,
  //     isActive: true,
  //     isEvidence: true,
  //     status: documentSubmission[0]?.status,
  //     file: documentSubmission.map((doc) => {
  //       return {
  //         id: doc?.applicationContent?.id,
  //         documentType: doc?.applicationContent?.documentType,
  //         fileStore: doc?.applicationContent?.fileStoreId,
  //         documentUid: doc?.applicationContent?.documentUid,
  //         additionalDetails: doc?.applicationContent?.additionalDetails,
  //       };
  //     }),
  //     comments: [],
  //     auditDetails: documentSubmission[0]?.details.auditDetails,
  //     workflow: {
  //       comments: documentSubmission[0]?.applicationList?.workflow.comments,
  //       documents: [{}],
  //       id: documentSubmission[0]?.applicationList?.workflow.id,
  //       status: documentSubmission[0]?.applicationList?.workflow?.status,
  //       action: "TYPE DEPOSITION",
  //     },
  //   },
  // };

  const respondApplicationPayload = {
    ...documentSubmission?.[0]?.applicationList,
    statuteSection: {
      ...documentSubmission?.[0]?.applicationList?.statuteSection,
      tenantId: tenantId,
    },
    workflow: {
      ...documentSubmission?.[0]?.applicationList?.workflow,
      action: SubmissionWorkflowAction.RESPOND,
    },
  };

  const deleteApplicationPayload = {
    ...documentSubmission?.[0]?.applicationList,
    statuteSection: {
      ...documentSubmission?.[0]?.applicationList?.statuteSection,
      tenantId: tenantId,
    },
    workflow: {
      ...documentSubmission?.[0]?.applicationList?.workflow,
      action: SubmissionWorkflowAction.DELETE,
    },
  };

  const acceptApplicationPayload = {
    ...documentSubmission?.[0]?.applicationList,
    statuteSection: {
      ...documentSubmission?.[0]?.applicationList?.statuteSection,
      tenantId: tenantId,
    },
    workflow: {
      ...documentSubmission?.[0]?.applicationList?.workflow,
      action: SubmissionWorkflowAction.APPROVE,
    },
  };

  const rejectApplicationPayload = {
    ...documentSubmission?.[0]?.applicationList,
    statuteSection: {
      ...documentSubmission?.[0]?.applicationList?.statuteSection,
      tenantId: tenantId,
    },
    workflow: {
      ...documentSubmission?.[0]?.applicationList?.workflow,
      action: SubmissionWorkflowAction.REJECT,
    },
  };

  const applicationCommentsPayload = (newComment) => {
    return {
      ...documentSubmission[0]?.applicationList,
      statuteSection: { ...documentSubmission[0]?.applicationList?.statuteSection, tenantId: tenantId },
      comment: documentSubmission[0]?.applicationList.comment ? [...documentSubmission[0]?.applicationList.comment, newComment] : [newComment],
      workflow: {
        ...documentSubmission[0]?.applicationList?.workflow,
        action: "RESPOND",
      },
    };
  };

  const onSuccess = async () => {
    let message = "";
    if (modalType === "Documents") {
      message = documentSubmission?.[0].artifactList?.isEvidence ? "SUCCESSFULLY_UNMARKED_MESSAGE" : "SUCCESSFULLY_MARKED_MESSAGE";
    } else {
      if (showConfirmationModal?.type === "reject") {
        message = "SUCCESSFULLY_REJECTED_APPLICATION_MESSAGE";
      }
      if (showConfirmationModal?.type === "accept") {
        message = "SUCCESSFULLY_ACCEPTED_APPLICATION_MESSAGE";
      }
      if (actionSaveLabel === t("ADD_COMMENT")) {
        message = "SUCCESSFULLY_RESPONDED_APPLICATION_MESSAGE";
      } else {
        message = "";
      }
    }
    if (message) {
      showToast({
        isError: false,
        message,
      });
    }
    counterUpdate();
    handleBack();
    setIsSubmitDisabled(false);
  };

  const onError = async (result) => {
    if (modalType === "Documents") {
      showToast({
        isError: true,
        message: documentSubmission?.[0].artifactList?.isEvidence ? "UNSUCCESSFULLY_UNMARKED_MESSAGE" : "UNSUCCESSFULLY_MARKED_MESSAGE",
      });
    }
    handleBack();
    setIsSubmitDisabled(false);
  };

  const counterUpdate = () => {
    setUpdateCounter((prevCount) => prevCount + 1);
  };

  const handleMarkEvidence = async () => {
    if (documentSubmission?.[0].artifactList.artifactType === "DEPOSITION") {
      await evidenceUpdateMutation.mutate(
        {
          url: Urls.dristi.evidenceUpdate,
          params: {},
          body: {
            artifact: {
              ...documentSubmission?.[0].artifactList,
              isEvidence: !documentSubmission?.[0]?.artifactList?.isEvidence,
              isVoid: false,
              workflow: {
                ...documentSubmission?.[0].artifactList.workflow,
                action: "SIGN DEPOSITION",
              },
            },
          },
          config: {
            enable: true,
          },
        },
        {
          onSuccess,
          onError,
        }
      );
    } else {
      await evidenceUpdateMutation.mutate(
        {
          url: Urls.dristi.evidenceUpdate,
          params: {},
          body: {
            artifact: {
              ...documentSubmission?.[0].artifactList,
              comments: comments,
              isEvidence: !documentSubmission?.[0]?.artifactList?.isEvidence,
              isVoid: false,
              filingNumber: filingNumber,
            },
          },
          config: {
            enable: true,
          },
        },
        {
          onSuccess,
          onError,
        }
      );
    }
  };

  const handleRespondApplication = async () => {
    await mutation.mutate(
      {
        url: Urls.dristi.submissionsUpdate,
        params: {},
        body: {
          application: {
            ...respondApplicationPayload,
            comment: comments,
          },
        },
        config: {
          enable: true,
        },
      },
      {
        onSuccess,
        onError,
      }
    );
  };

  const handleDeleteApplication = async () => {
    await mutation.mutate(
      {
        url: Urls.dristi.submissionsUpdate,
        params: {},
        body: { application: deleteApplicationPayload },
        config: {
          enable: true,
        },
      },
      {
        onSuccess,
        onError,
      }
    );
  };

  const handleAcceptApplication = async () => {
    await mutation.mutate(
      {
        url: Urls.dristi.submissionsUpdate,
        params: {},
        body: { application: acceptApplicationPayload },
        config: {
          enable: true,
        },
      },
      {
        onSuccess,
        onError,
      }
    );
  };

  const handleRejectApplication = async () => {
    await mutation.mutate(
      {
        url: Urls.dristi.submissionsUpdate,
        params: {},
        body: { application: rejectApplicationPayload },
        config: {
          enable: true,
        },
      },
      {
        onSuccess,
        onError,
      }
    );
  };

  const submitCommentApplication = async (newComment) => {
    await submissionComment.mutate({
      url: Urls.dristi.addSubmissionComment,
      params: {},
      body: { applicationAddComment: newComment },
      config: {
        enable: true,
      },
    });
    counterUpdate();
  };

  const submitCommentEvidence = async (newComment) => {
    await evidenceComment.mutate({
      url: Urls.dristi.addEvidenceComment,
      params: {},
      body: { evidenceAddComment: newComment },
      config: {
        enable: true,
      },
    });
    counterUpdate();
  };

  const artifactNumber = documentSubmission?.[0]?.artifactList?.artifactNumber;
  const { data: evidenceData, isloading: isEvidenceLoading, refetch: evidenceRefetch } = useSearchEvidenceService(
    {
      criteria: {
        filingNumber,
        artifactNumber,
        tenantId,
        ...(caseCourtId && { courtId: caseCourtId }),
      },
      tenantId,
    },
    {},
    artifactNumber,
    Boolean(artifactNumber)
  );

  const evidenceDetails = useMemo(() => evidenceData?.artifacts?.[0], [evidenceData]);

  const handleEvidenceAction = async () => {
    if (businessOfTheDay) {
      setIsSubmitDisabled(true);
      const response = await Digit.HearingService.searchHearings(
        {
          criteria: {
            tenantId: Digit.ULBService.getCurrentTenantId(),
            filingNumber: filingNumber,
            ...(caseCourtId && { courtId: caseCourtId }),
          },
        },
        {}
      );
      const nextHearing = response?.HearingList?.filter((hearing) => hearing.status === "SCHEDULED");
      const courtId = localStorage.getItem("courtId");
      let evidenceReqBody = {};
      let evidence = {};
      evidenceReqBody = {
        artifact: {
          ...evidenceDetails,
          publishedDate: new Date().getTime(),
        },
      };
      await DRISTIService.updateEvidence(evidenceReqBody);
      await DRISTIService.addADiaryEntry(
        {
          diaryEntry: {
            courtId: courtId,
            businessOfDay: businessOfTheDay,
            tenantId: tenantId,
            entryDate: new Date().setHours(0, 0, 0, 0),
            caseNumber: caseData?.case?.cmpNumber,
            referenceId: documentSubmission?.[0]?.artifactList?.artifactNumber,
            referenceType: "Documents",
            hearingDate: (Array.isArray(nextHearing) && nextHearing.length > 0 && nextHearing[0]?.startTime) || null,
            additionalDetails: {
              filingNumber: filingNumber,
              caseId: caseId,
            },
          },
        },
        {}
      ).catch((error) => {
        console.error("error: ", error);
        toast.error(t("SOMETHING_WENT_WRONG"));
        setIsSubmitDisabled(false);
      });
    }
    await handleMarkEvidence();
  };

  const getOrderTypes = (applicationType, type) => {
    switch (applicationType) {
      case "RE_SCHEDULE":
        return type === "reject" ? "REJECTION_RESCHEDULE_REQUEST" : "INITIATING_RESCHEDULING_OF_HEARING_DATE";
      case "WITHDRAWAL":
        return type === "reject" ? "WITHDRAWAL_REJECT" : "WITHDRAWAL_ACCEPT";
      case "TRANSFER":
        return "CASE_TRANSFER";
      case "SETTLEMENT":
        return "SETTLEMENT";
      case "BAIL_BOND":
        return "BAIL";
      case "SURETY":
        return "BAIL";
      case "REQUEST_FOR_BAIL":
      case "SUBMIT_BAIL_DOCUMENTS":
        return type === "reject" ? "REJECT_BAIL" : type === "SET_TERM_BAIL" ? "SET_BAIL_TERMS" : "ACCEPT_BAIL";
      case "EXTENSION_SUBMISSION_DEADLINE":
        return "EXTENSION_OF_DOCUMENT_SUBMISSION_DATE";
      case "CHECKOUT_REQUEST":
        return type === "reject" ? "CHECKOUT_REJECT" : "CHECKOUT_ACCEPTANCE";
      case "DELAY_CONDONATION":
        return "ACCEPTANCE_REJECTION_DCA";
      default:
        return type === "reject" ? "REJECT_VOLUNTARY_SUBMISSIONS" : "APPROVE_VOLUNTARY_SUBMISSIONS";
    }
  };

  const getOrderActionName = (applicationType, type) => {
    switch (applicationType) {
      case "RE_SCHEDULE":
        return type === "reject" ? "REJECTION_ORDER_RESCHEDULE_REQUEST" : "ORDER_FOR_INITIATING_RESCHEDULING_OF_HEARING_DATE";
      case "WITHDRAWAL":
        return type === "reject" ? "ORDER_FOR_ACCEPT_WITHDRAWAL" : "ORDER_FOR_REJECT_WITHDRAWAL";
      case "TRANSFER":
        return "ORDER_FOR_CASE_TRANSFER";
      case "SETTLEMENT":
        return "ORDER_FOR_SETTLEMENT";
      case "BAIL_BOND":
        return "ORDER_FOR_BAIL";
      case "SURETY":
        return "ORDER_FOR_BAIL";
      case "EXTENSION_SUBMISSION_DEADLINE":
        return "ORDER_EXTENSION_SUBMISSION_DEADLINE";
      case "REQUEST_FOR_BAIL":
      case "SUBMIT_BAIL_DOCUMENTS":
        return type === "reject" ? "REJECT_BAIL" : type === "SET_TERM_BAIL" ? "SET_BAIL_TERMS" : "ACCEPT_BAIL";
      case "CHECKOUT_REQUEST":
        return type === "reject" ? "REJECT_CHECKOUT_REQUEST" : "ACCEPT_CHECKOUT_REQUEST";
      case "DELAY_CONDONATION":
        return "ACCEPTANCE_REJECTION_DCA";
      default:
        return type === "reject" ? "REJECT_ORDER_VOLUNTARY_SUBMISSIONS" : "APPROVE_ORDER_VOLUNTARY_SUBMISSIONS";
    }
  };
  const isMandatoryOrderCreation = useMemo(() => {
    const applicationType = documentSubmission?.[0]?.applicationList?.applicationType;
    const type = showConfirmationModal?.type;
    const acceptedApplicationTypes = [
      "RE_SCHEDULE",
      "WITHDRAWAL",
      "TRANSFER",
      "SETTLEMENT",
      "BAIL_BOND",
      "SURETY",
      "EXTENSION_SUBMISSION_DEADLINE",
      "CHECKOUT_REQUEST",
    ];
    if (type === "reject") {
      return false;
    } else {
      return acceptedApplicationTypes.includes(applicationType);
    }
  }, [documentSubmission, showConfirmationModal?.type]);
  const isBail = useMemo(() => {
    return ["SUBMIT_BAIL_DOCUMENTS", "REQUEST_FOR_BAIL"].includes(documentSubmission?.[0]?.applicationList?.applicationType);
  }, [documentSubmission]);
  const showDocument = useMemo(() => {
    return (
      <React.Fragment>
        {modalType !== "Submissions" ? (
          currentDiaryEntry && artifact ? (
            <div className="application-view">
              <DocViewerWrapper
                fileStoreId={artifact?.file?.fileStore}
                tenantId={tenantId}
                docWidth={"calc(80vw * 62 / 100)"}
                docHeight={"unset"}
                showDownloadOption={false}
              />
            </div>
          ) : (
            documentSubmission?.map((docSubmission, index) => (
              <React.Fragment key={index}>
                {docSubmission.applicationContent && (
                  <div className="application-view">
                    <DocViewerWrapper
                      fileStoreId={docSubmission.applicationContent.fileStoreId}
                      displayFilename={docSubmission.applicationContent.fileName}
                      tenantId={docSubmission.applicationContent.tenantId}
                      docWidth={"calc(80vw * 62 / 100)"}
                      docHeight={"unset"}
                      showDownloadOption={false}
                      documentName={docSubmission.applicationContent.fileName}
                    />
                  </div>
                )}
              </React.Fragment>
            ))
          )
        ) : allCombineDocs?.length > 0 ? (
          allCombineDocs.map((docs, index) => (
            <React.Fragment key={index}>
              <div className="application-view">
                <DocViewerWrapper
                  fileStoreId={docs?.fileStore}
                  displayFilename={docs?.additionalDetails?.name}
                  tenantId={tenantId}
                  docWidth={"calc(80vw * 62 / 100)"}
                  showDownloadOption={false}
                  docHeight={"unset"}
                  documentName={docs?.additionalDetails?.name}
                />
              </div>
            </React.Fragment>
          ))
        ) : (
          <h2>{isLoading ? t("Loading.....") : t("PREVIEW_DOC_NOT_AVAILABLE")}</h2>
        )}
      </React.Fragment>
    );
  }, [allCombineDocs, documentSubmission, modalType, tenantId, isLoading, t]);

  const setApplicationStatus = (type, applicationType) => {
    if (["SUBMIT_BAIL_DOCUMENTS", "REQUEST_FOR_BAIL"].includes(applicationType)) {
      return type === "SET_TERM_BAIL" ? "SET_TERM_BAIL" : type === "accept" ? "APPROVED" : "REJECTED";
    }
    if (["DELAY_CONDONATION"].includes(applicationType)) {
      return type === "accept" ? "APPROVED" : "REJECTED";
    }
    return type === "accept" ? "APPROVED" : "REJECTED";
  };

  const checkOrderTypeValidation = (a, b) => {
    let errorObj = { isIncompatible: false, isDuplicate: false };
    for (let i = 0; i < compositeOrderAllowedTypes?.length; i++) {
      const currentObj = compositeOrderAllowedTypes?.[i];
      if (currentObj?.orderTypes?.includes(a)) {
        if (currentObj?.unAllowedOrderTypes?.includes(b)) {
          if (a === b) {
            errorObj.isDuplicate = true;
          } else {
            errorObj.isIncompatible = true;
          }
          break;
        }
      }
    }
    return errorObj;
  };

  const checkOrderValidation = (orderType, compositeOrderObj) => {
    if (compositeOrderObj?.orderCategory === "INTERMEDIATE") {
      const orderTypeA = compositeOrderObj?.additionalDetails?.formdata?.orderType?.code;
      const { isIncompatible, isDuplicate } = checkOrderTypeValidation(orderTypeA, orderType);
      return isIncompatible || isDuplicate;
    }
    return compositeOrderObj?.compositeItems?.some((item) => {
      if (!item?.isEnabled) return false;
      const orderTypeA = item?.orderSchema?.additionalDetails?.formdata?.orderType?.code;
      const { isIncompatible, isDuplicate } = checkOrderTypeValidation(orderTypeA, orderType);
      return isIncompatible || isDuplicate;
    });
  };

  const handleApplicationAction = async (generateOrder, type) => {
    try {
      const orderType = getOrderTypes(documentSubmission?.[0]?.applicationList?.applicationType, type);
      const refApplicationId = documentSubmission?.[0]?.applicationList?.applicationNumber;
      const formdata = {
        orderType: {
          code: orderType,
          type: orderType,
          name: `ORDER_TYPE_${orderType}`,
        },
        refApplicationId: refApplicationId,
        applicationStatus: documentSubmission?.[0]?.applicationList?.applicationType
          ? setApplicationStatus(type, documentSubmission[0].applicationList.applicationType)
          : null,
        ...(documentSubmission?.[0]?.applicationList?.applicationType === "DELAY_CONDONATION" && {
          isDcaAcceptedOrRejected: {
            code: type === "reject" ? "REJECTED" : type === "accept" ? "ACCEPTED" : null,
            name: type === "reject" ? "REJECTED" : type === "accept" ? "ACCEPTED" : null,
          },
        }),
      };
      const linkedOrderNumber = documentSubmission?.[0]?.applicationList?.additionalDetails?.formdata?.refOrderId;
      const applicationNumber = [refApplicationId];
      const hearingNumber =
        ["INITIATING_RESCHEDULING_OF_HEARING_DATE", "CHECKOUT_ACCEPTANCE"].includes(orderType) &&
        documentSubmission?.[0]?.applicationList?.additionalDetails?.hearingId;
      const parties = documentSubmission?.[0]?.applicationList?.additionalDetails?.onBehalOfName && {
        parties: [{ partyName: documentSubmission?.[0]?.applicationList?.additionalDetails?.onBehalOfName }],
      };
      const additionalDetails = {
        formdata,
        applicationStatus: documentSubmission?.[0]?.applicationList?.applicationType
          ? setApplicationStatus(type, documentSubmission[0].applicationList.applicationType)
          : null,
        ...(linkedOrderNumber && { linkedOrderNumber: linkedOrderNumber }),
        ...(applicationNumber && { applicationNumber: applicationNumber }),
        ...(hearingNumber && {
          hearingNumber: hearingNumber,
        }),
      };
      const isSameOrder =
        compositeOrderObj?.orderCategory === "COMPOSITE"
          ? compositeOrderObj?.compositeItems?.some(
              (item) => item?.isEnabled && item?.orderSchema?.additionalDetails?.formdata?.refApplicationId === refApplicationId
            )
          : compositeOrderObj?.additionalDetails?.formdata?.refApplicationId === refApplicationId;
      const isNewOrder = isSameOrder || checkOrderValidation(orderType, compositeOrderObj);

      if (generateOrder && compositeOrderObj && compositeOrderObj?.orderTitle && !isNewOrder) {
        try {
          let response;
          if (compositeOrderObj?.orderCategory === "INTERMEDIATE") {
            const compositeItems = [
              {
                orderType: compositeOrderObj?.orderType,
                orderSchema: {
                  applicationNumber: compositeOrderObj?.applicationNumber,
                  orderDetails: compositeOrderObj?.orderDetails,
                  additionalDetails: {
                    ...compositeOrderObj?.additionalDetails,
                    hearingNumber: compositeOrderObj?.hearingNumber,
                    linkedOrderNumber: compositeOrderObj?.linkedOrderNumber,
                    applicationNumber: compositeOrderObj?.applicationNumber,
                  },
                },
              },
              {
                orderType: orderType,
                orderSchema: {
                  additionalDetails: additionalDetails,
                  ...(parties && { orderDetails: parties }),
                  ...(hearingNumber && {
                    hearingNumber: hearingNumber,
                  }),
                  ...(linkedOrderNumber && { linkedOrderNumber }),
                  ...(applicationNumber && {
                    applicationNumber: applicationNumber,
                  }),
                },
              },
            ];
            const payload = {
              order: {
                ...compositeOrderObj,
                additionalDetails: null,
                orderDetails: null,
                orderType: null,
                orderCategory: "COMPOSITE",
                orderTitle: `${t(compositeOrderObj?.orderType)} and Other Items`,
                compositeItems,
                ...(hearingNumber && {
                  hearingNumber: hearingNumber,
                }),
                ...(linkedOrderNumber && { linkedOrderNumber }),
                workflow: {
                  action: OrderWorkflowAction.SAVE_DRAFT,
                  comments: "Creating order",
                  assignes: null,
                  rating: null,
                  documents: [{}],
                },
              },
            };
            if (compositeOrderObj?.orderNumber) {
              response = await ordersService.addOrderItem(payload, { tenantId });
            } else {
              response = await ordersService.createOrder(payload, { tenantId });
            }
          } else {
            const compositeItems = [
              ...compositeOrderObj?.compositeItems?.filter((item) => item?.isEnabled && item?.orderType),
              {
                orderType: orderType,
                orderSchema: {
                  additionalDetails: additionalDetails,
                  ...(parties && { orderDetails: parties }),
                  ...(hearingNumber && {
                    hearingNumber: hearingNumber,
                  }),
                  ...(linkedOrderNumber && { linkedOrderNumber }),
                  ...(applicationNumber && {
                    applicationNumber: applicationNumber,
                  }),
                },
              },
            ];
            const payload = {
              order: {
                ...compositeOrderObj,
                additionalDetails: null,
                orderDetails: null,
                orderType: null,
                compositeItems,
                workflow: {
                  action: OrderWorkflowAction.SAVE_DRAFT,
                  comments: "Creating order",
                  assignes: null,
                  rating: null,
                  documents: [{}],
                },
                applicationNumber: [...(compositeOrderObj?.applicationNumber || []), refApplicationId],
                ...(hearingNumber && {
                  hearingNumber: hearingNumber,
                }),
                ...(linkedOrderNumber && { linkedOrderNumber }),
              },
            };
            if (compositeOrderObj?.orderNumber) {
              response = await ordersService.addOrderItem(payload, { tenantId });
            } else {
              response = await ordersService.createOrder(payload, { tenantId });
            }
          }
          DRISTIService.customApiService(Urls.dristi.pendingTask, {
            pendingTask: {
              name: `${compositeOrderObj?.orderTitle}`,
              entityType: "order-default",
              referenceId: `MANUAL_${response?.order?.orderNumber}`,
              status: "DRAFT_IN_PROGRESS",
              assignedTo: [],
              assignedRole: ["JUDGE_ROLE"],
              cnrNumber,
              filingNumber,
              caseId,
              caseTitle: caseData?.title,
              isCompleted: false,
              stateSla: stateSla.DRAFT_IN_PROGRESS * dayInMillisecond + todayDate,
              additionalDetails: { orderType },
              tenantId,
            },
          });
          history.replace(
            `/${window.contextPath}/employee/orders/generate-orders?filingNumber=${filingNumber}&orderNumber=${response?.order?.orderNumber}`
          );
        } catch (error) {
          toast.error(t("SOMETHING_WENT_WRONG"));
        }
      } else if (generateOrder) {
        const reqbody = {
          order: {
            createdDate: null,
            tenantId,
            cnrNumber,
            filingNumber,
            applicationNumber: applicationNumber,
            statuteSection: {
              tenantId,
            },
            orderTitle: orderType,
            orderCategory: "INTERMEDIATE",
            orderType,
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
            additionalDetails: additionalDetails,
            ...(parties && { orderDetails: parties }),
            ...(hearingNumber && {
              hearingNumber: hearingNumber,
            }),
            ...(linkedOrderNumber && { linkedOrderNumber }),
          },
        };
        try {
          const res = await ordersService.createOrder(reqbody, { tenantId });
          const name = getOrderActionName(documentSubmission?.[0]?.applicationList?.applicationType, isBail ? type : showConfirmationModal?.type);
          DRISTIService.customApiService(Urls.dristi.pendingTask, {
            pendingTask: {
              name: t(name),
              entityType: "order-default",
              referenceId: `MANUAL_${res?.order?.orderNumber}`,
              status: "DRAFT_IN_PROGRESS",
              assignedTo: [],
              assignedRole: ["JUDGE_ROLE"],
              cnrNumber,
              filingNumber,
              caseId,
              caseTitle: caseData?.title,
              isCompleted: false,
              stateSla: stateSla.DRAFT_IN_PROGRESS * dayInMillisecond + todayDate,
              additionalDetails: { orderType },
              tenantId,
            },
          });
          history.push(`/${window.contextPath}/employee/orders/generate-orders?filingNumber=${filingNumber}&orderNumber=${res?.order?.orderNumber}`);
        } catch (error) {}
      } else {
        if (showConfirmationModal.type === "reject") {
          await handleRejectApplication();
        }
        if (showConfirmationModal.type === "accept") {
          try {
            await handleAcceptApplication();
            if (setIsDelayApplicationPending) setIsDelayApplicationPending(false);
          } catch (error) {
            console.error("error :>> ", error);
          }
        }
        counterUpdate();
        setShowSuccessModal(true);
        setShowConfirmationModal(null);
      }
    } catch (error) {
      toast.error(t("SOMETHING_WENT_WRONG"));
    }
  };

  const handleBack = () => {
    if (modalType === "Submissions" && history.location?.state?.applicationDocObj && compositeOrderObj) {
      history.goBack();
    } else if (modalType === "Submissions" && history.location?.state?.applicationDocObj) {
      history.push(`/${window.contextPath}/${userType}/dristi/home/view-case?caseId=${caseId}&filingNumber=${filingNumber}&tab=Submissions`);
    } else {
      if (currentDiaryEntry) {
        history.goBack();
      }
      setShow(false);
      setShowSuccessModal(false);
      counterUpdate();
    }
  };

  const handleSubmitComment = async (newComment) => {
    if (modalType === "Submissions") {
      await submitCommentApplication(newComment);
      setShowFileIcon(false);
    } else {
      await submitCommentEvidence(newComment);
    }
  };

  const signedSubmission = useMemo(() => {
    return documentSubmission?.filter((item) => item?.applicationContent?.documentType === "SIGNED")?.[0] || {};
  }, [documentSubmission]);

  const actionSaveOnSubmit = async () => {
    if (actionSaveLabel === t("DOWNLOAD_SUBMISSION") && signedSubmission?.applicationContent?.fileStoreId) {
      downloadPdf(tenantId, signedSubmission?.applicationContent?.fileStoreId);
      return;
    }
    if (userType === "employee") {
      if (documentApplicationType === "CORRECTION_IN_COMPLAINANT_DETAILS") {
        const refApplicationId = documentSubmission?.[0]?.applicationList?.applicationNumber;
        history.push(
          `/${window.contextPath}/employee/dristi/home/view-case/review-litigant-details?caseId=${caseId}&referenceId=${documentSubmission?.[0]?.details?.additionalDetails?.pendingTaskRefId}&refApplicationId=${refApplicationId}`
        );
        return;
      }
      if (isBail) {
        await handleApplicationAction(true, "accept");
      } else if (modalType === "Submissions" && documentSubmission?.[0]?.applicationList?.applicationType === "DELAY_CONDONATION") {
        await handleApplicationAction(true, "accept");
      } else modalType === "Documents" ? setShowConfirmationModal({ type: "documents-confirmation" }) : setShowConfirmationModal({ type: "accept" });
    } else {
      if (actionSaveLabel === t("ADD_COMMENT")) {
        try {
        } catch (error) {}
        await handleRespondApplication();
        try {
          DRISTIService.customApiService(Urls.dristi.pendingTask, {
            pendingTask: {
              entityType: "application-order-submission-feedback",
              status: "RESPOND_TO_PRODUCTION_DOCUMENTS",
              referenceId: `MANUAL_${signedSubmission?.applicationList?.applicationNumber}`,
              cnrNumber,
              filingNumber,
              caseId,
              caseTitle: caseData?.title,
              isCompleted: true,
              tenantId,
            },
          });
        } catch (error) {
          console.error("error :>> ", error);
        }
      }
      ///show a toast message
      counterUpdate();
      setShow(false);
      counterUpdate();
      history.replace(`/${window.contextPath}/${userType}/dristi/home/view-case?caseId=${caseId}&filingNumber=${filingNumber}&tab=Submissions`);
    }
  };

  const actionCancelOnSubmit = async () => {
    if (userType === "employee") {
      if (isBail) {
        await handleApplicationAction(true, "reject");
      } else if (modalType === "Submissions" && documentSubmission?.[0]?.applicationList?.applicationType === "DELAY_CONDONATION") {
        await handleApplicationAction(true, "reject");
      } else setShowConfirmationModal({ type: "reject" });
    } else {
      try {
        await handleDeleteApplication();
        setShow(false);
        counterUpdate();
      } catch (error) {}
    }
  };
  const actionCustomLabelSubmit = async () => {
    if (userType === "employee") {
      await handleApplicationAction(true, "SET_TERM_BAIL");
    } else {
      setShow(false);
    }
  };

  const handleUpdateBusinessOfDayEntry = async () => {
    try {
      await DRISTIService.aDiaryEntryUpdate(
        {
          diaryEntry: {
            ...currentDiaryEntry,
            businessOfDay: businessOfTheDay,
          },
        },
        {}
      ).then(async () => {
        history.goBack();
      });
    } catch (error) {
      console.error("error: ", error);
      toast.error(t("SOMETHING_WENT_WRONG"));
    }
  };

  const documentUploaderConfig = useMemo(
    () => [
      {
        body: [
          {
            type: "component",
            component: "SelectUserTypeComponent",
            key: "SelectUserTypeComponent",
            withoutLabel: true,
            populators: {
              inputs: [
                {
                  label: "Document Type",
                  type: "dropdown",
                  name: "selectIdType",
                  optionsKey: "name",
                  error: "CORE_REQUIRED_FIELD_ERROR",
                  validation: {},
                  isMandatory: true,
                  disableMandatoryFieldFor: ["aadharNumber"],
                  disableFormValidation: false,
                  options: [
                    {
                      code: "EVIDENCE",
                      name: "Evidence",
                    },
                  ],
                  optionsCustomStyle: {
                    top: "40px",
                  },
                },
                {
                  label: "Upload Document",
                  type: "documentUpload",
                  name: "doc",
                  validation: {},
                  allowedFileTypes: /(.*?)(pdf)$/i,
                  isMandatory: true,
                  disableMandatoryFieldFor: ["aadharNumber"],
                  errorMessage: "CUSTOM_DOCUMENT_ERROR_MSG",
                  notSupportedError: "ALLOW_PDF_TYPE",
                  noteMsg: "CS_DOCUMENT_PDF_TYPE",
                  disableFormValidation: false,
                  multiple: false,
                },
              ],
              validation: {},
            },
          },
        ],
      },
    ],
    []
  );

  const onDocumentUpload = async (fileData, filename, tenantId) => {
    if (fileData?.fileStore) return fileData;
    const fileUploadRes = await window?.Digit.UploadServices.Filestorage("DRISTI", fileData, tenantId);
    return { file: fileUploadRes?.data, fileType: fileData.type, filename };
  };

  useEffect(() => {
    if (!(currentDiaryEntry && artifact)) {
      fetchRecursiveData(documentSubmission?.[0]?.applicationList);
    }
  }, [artifact, currentDiaryEntry, documentSubmission, fetchRecursiveData]);

  const customLabelShow = useMemo(() => {
    return (
      isJudge &&
      ["REQUEST_FOR_BAIL"].includes(documentSubmission?.[0]?.applicationList?.applicationType) &&
      userRoles.includes("SUBMISSION_APPROVER") &&
      [SubmissionWorkflowState.PENDINGAPPROVAL, SubmissionWorkflowState.PENDINGREVIEW].includes(applicationStatus) &&
      modalType === "Submissions"
    );
  }, [isJudge, documentSubmission, userRoles, applicationStatus, modalType]);

  return (
    <React.Fragment>
      <style>
        {`.popup-module.evidence-modal .popup-module-main .selector-button-border {
          border-color: #BB2C2F !important;
        }
        .popup-module.evidence-modal .popup-module-main .selector-button-border h2 {
          color: #BB2C2F !important;
        }`}
      </style>
      {!showConfirmationModal && !showSuccessModal && (
        <Modal
          hideModalActionbar={actionSaveLabel === t("UNMARK_AS_EVIDENCE")}
          headerBarEnd={<CloseBtn onClick={handleBack} />}
          actionSaveLabel={actionSaveLabel}
          actionSaveOnSubmit={actionSaveOnSubmit}
          hideSubmit={currentDiaryEntry || !showSubmit} // Not allowing submit action for court room manager
          actionCancelLabel={
            documentApplicationType === "CORRECTION_IN_COMPLAINANT_DETAILS" || currentDiaryEntry || !isJudge ? false : actionCancelLabel
          } // Not allowing cancel action for court room manager
          actionCustomLabel={!customLabelShow ? false : actionCustomLabel} // Not allowing cancel action for court room manager
          actionCancelOnSubmit={actionCancelOnSubmit}
          actionCustomLabelSubmit={actionCustomLabelSubmit}
          formId="modal-action"
          headerBarMain={
            <Heading
              label={t("DOCUMENT_SUBMISSION")}
              status={
                modalType === "Documents"
                  ? documentSubmission?.[0]?.artifactList?.isEvidence
                    ? "Accepeted"
                    : "Action Pending"
                  : t(applicationStatus)
              }
              showStatus={modalType === "Documents" ? false : true}
              isStatusRed={modalType === "Documents" ? !documentSubmission?.[0]?.artifactList?.isEvidence : applicationStatus}
            />
          }
          className="evidence-modal"
          style={{
            backgroundColor: "#007e7e",
          }}
          textStyle={{
            color: "#fff",
          }}
          actionCancelTextStyle={
            customLabelShow
              ? {
                  color: "#BB2C2F",
                }
              : {}
          }
        >
          <div className="evidence-modal-main">
            <div className={"application-details"}>
              <div style={{ display: "flex", flexDirection: "column", overflowY: "auto", height: "fit-content" }}>
                {isJudge && documentSubmission?.[0]?.applicationList?.applicationType === "DELAY_CONDONATION" && !Boolean(applicationNumber) && (
                  <div
                    className="dca-infobox-message"
                    style={{
                      display: "flex",
                      gap: "8px",
                      backgroundColor: "#FEF4F4",
                      border: "1px",
                      borderColor: "#FCE8E8",
                      padding: "8px",
                      borderRadius: "8px",
                      marginBottom: "24px",
                    }}
                  >
                    <div className="dca-infobox-icon" style={{}}>
                      <WarningInfoIconYellow />{" "}
                    </div>
                    <div className="dca-infobox-me" style={{}}>
                      {t("ENSURE_DUE_PROCESS") + ": " + t("CONDUCT_HEARING_BEFORE_ACTING_DCA")}
                    </div>
                  </div>
                )}
                <div className="application-info" style={{ display: "flex", flexDirection: "column" }}>
                  <div className="info-row">
                    <div className="info-key">
                      <h3>{t("APPLICATION_TYPE")}</h3>
                    </div>
                    <div className="info-value">
                      <h3>{currentDiaryEntry && artifact ? t(artifact?.artifactType) : t(documentSubmission[0]?.details?.applicationType)}</h3>
                    </div>
                  </div>
                  <div className="info-row">
                    <div className="info-key">
                      <h3>{t("APPLICATION_SENT_ON")}</h3>
                    </div>
                    <div className="info-value">
                      <h3>
                        {currentDiaryEntry && artifact
                          ? t(getDate(parseInt(artifact?.createdDate)))
                          : documentSubmission[0]?.details?.applicationSentOn}
                      </h3>
                    </div>
                  </div>
                  {!(
                    documentSubmission[0]?.artifactList?.publishedDate === 0 || documentSubmission[0]?.artifactList?.publishedDate === undefined
                  ) && (
                    <div className="info-row">
                      <div className="info-key">
                        <h3>{t("DATE_OF_EVIDENCE")}</h3>
                      </div>
                      <div className="info-value">
                        <h3>
                          {currentDiaryEntry && artifact
                            ? t(getDate(parseInt(artifact?.publishedDate)))
                            : t(getDate(parseInt(documentSubmission[0]?.artifactList?.publishedDate)))}
                        </h3>
                      </div>
                    </div>
                  )}

                  <div className="info-row">
                    <div className="info-key">
                      <h3>{t("SENDER")}</h3>
                    </div>
                    <div className="info-value">
                      <h3>{currentDiaryEntry && artifact ? artifact?.sender : removeInvalidNameParts(documentSubmission[0]?.details?.sender)}</h3>
                    </div>
                  </div>
                  <div className="info-row">
                    <div className="info-key">
                      <h3>{t("EVIDENCE_ADDITIONAL_DETAILS")}</h3>
                    </div>
                    <div className="info-value">
                      {/* <h3>{JSON.stringify(documentSubmission[0]?.details.additionalDetails)}</h3> */}
                      <h3>N/A</h3>
                    </div>
                  </div>
                  {documentSubmission?.[0]?.artifactList?.additionalDetails?.formdata?.reasonForFiling && (
                    <div className="info-row">
                      <div className="info-key">
                        <h3>{t("REASON_FOR_FILING")}</h3>
                      </div>
                      <div className="info-value">
                        <h3>{documentSubmission?.[0]?.artifactList?.additionalDetails?.formdata?.reasonForFiling?.text}</h3>
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>{showDocument}</div>
              </div>
              {modalType === "Documents" && isJudge && (
                <div>
                  <h3 style={{ marginTop: 0, marginBottom: "2px" }}>{t("BUSINESS_OF_THE_DAY")} </h3>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <TextInput
                      className="field desktop-w-full"
                      onChange={(e) => {
                        setBusinessOfTheDay(e.target.value);
                      }}
                      disable={isDisabled}
                      defaultValue={currentDiaryEntry?.businessOfDay || computeDefaultBOTD}
                      style={{ minWidth: "500px" }}
                      textInputStyle={{ maxWidth: "100%" }}
                    />
                    {currentDiaryEntry && (
                      <Button
                        label={t("SAVE")}
                        variation={"primary"}
                        style={{ padding: 15, boxShadow: "none" }}
                        onButtonClick={() => {
                          handleUpdateBusinessOfDayEntry();
                        }}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
            {(userRoles.includes("SUBMISSION_RESPONDER") || userRoles.includes("JUDGE_ROLE")) && (
              <div className={`application-comment ${isCourtRoomManager && "disabled"}`}>
                <div className="comment-section">
                  <h1 className="comment-xyzoo">{t("DOC_COMMENTS")}</h1>
                  <div className="comment-main">
                    {comments?.map((comment, index) => (
                      <CommentComponent key={index} comment={comment} />
                    ))}
                  </div>
                </div>
                {((modalType === "Submissions" &&
                  [
                    SubmissionWorkflowState.PENDINGAPPROVAL,
                    SubmissionWorkflowState.PENDINGREVIEW,
                    SubmissionWorkflowState.PENDINGRESPONSE,
                    SubmissionWorkflowState.COMPLETED,
                    SubmissionWorkflowState.REJECTED,
                    SubmissionWorkflowState.DOC_UPLOAD,
                  ].includes(applicationStatus)) ||
                  modalType === "Documents") && (
                  <div className="comment-send">
                    <div className="comment-input-wrapper">
                      <div style={{ display: "flex" }}>
                        <TextInput
                          placeholder={"Type here..."}
                          value={currentComment}
                          onChange={(e) => {
                            setCurrentComment(e.target.value);
                          }}
                          disable={currentDiaryEntry}
                        />
                        <div
                          className="send-comment-btn"
                          onClick={async () => {
                            if (cleanString(currentComment) !== "") {
                              let newComment =
                                modalType === "Submissions"
                                  ? {
                                      tenantId,
                                      comment: [
                                        {
                                          tenantId,
                                          comment: cleanString(currentComment),
                                          individualId: "",
                                          commentDocumentId: "",
                                          commentDocumentName: "",
                                          additionalDetails: {
                                            author: user,
                                            timestamp: new Date(Date.now()).toLocaleDateString("en-in", {
                                              year: "2-digit",
                                              month: "short",
                                              day: "2-digit",
                                              hour: "2-digit",
                                              minute: "2-digit",
                                              hour12: true,
                                            }),
                                          },
                                        },
                                      ],
                                      applicationNumber: documentSubmission?.[0]?.applicationList?.applicationNumber,
                                    }
                                  : {
                                      tenantId,
                                      comment: [
                                        {
                                          tenantId,
                                          comment: currentComment,
                                          individualId: "",
                                          commentDocumentId: "",
                                          commentDocumentName: "",
                                          artifactId: documentSubmission?.[0]?.artifactList?.id,
                                          additionalDetails: {
                                            author: user,
                                            timestamp: new Date(Date.now()).toLocaleDateString("en-in", {
                                              year: "2-digit",
                                              month: "short",
                                              day: "2-digit",
                                              hour: "2-digit",
                                              minute: "2-digit",
                                              hour12: true,
                                            }),
                                          },
                                        },
                                      ],
                                      artifactNumber: documentSubmission?.[0]?.artifactList?.artifactNumber,
                                    };
                              if (formData) {
                                if (formData?.SelectUserTypeComponent?.doc?.length > 0) {
                                  newComment = {
                                    ...newComment,
                                    comment: [
                                      {
                                        ...newComment.comment[0],
                                        additionalDetails: {
                                          ...newComment.comment[0].additionalDetails,
                                          commentDocumentId: formData?.SelectUserTypeComponent?.doc?.[0]?.[1]?.fileStoreId?.fileStoreId,
                                          commentDocumentName: documentUploaderConfig?.[0]?.body?.[0]?.populators?.inputs?.[0]?.options?.[0]?.code,
                                        },
                                      },
                                    ],
                                  };
                                }
                              }
                              setComments((prev) => [...prev, ...newComment.comment]);
                              setFormData({});
                              try {
                                await handleSubmitComment(newComment);
                                setCurrentComment("");
                              } catch (error) {
                                console.error("error :>> ", error);
                              }
                            } else {
                              setCurrentComment("");
                            }
                          }}
                        >
                          <RightArrow />
                        </div>
                      </div>
                      {!currentDiaryEntry && (
                        <div style={{ display: "flex" }}>
                          <SelectCustomDocUpload
                            t={t}
                            formUploadData={formData}
                            config={[documentUploaderConfig?.[0]]}
                            setData={setData}
                            documentSubmission={documentSubmission}
                            showDocument={showFileIcon}
                            setShowDocument={setShowFileIcon}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
      {showConfirmationModal && !showSuccessModal && modalType === "Submissions" && (
        <ConfirmSubmissionAction
          t={t}
          setShowConfirmationModal={setShowConfirmationModal}
          type={showConfirmationModal.type}
          setShow={setShow}
          handleAction={handleApplicationAction}
          disableCheckBox={isMandatoryOrderCreation}
        />
      )}
      {showConfirmationModal && !showSuccessModal && modalType === "Documents" && (
        <ConfirmEvidenceAction
          t={t}
          setShowConfirmationModal={setShowConfirmationModal}
          type={showConfirmationModal.type}
          setShow={setShow}
          handleAction={handleEvidenceAction}
          isDisabled={isSubmitDisabled}
          isEvidence={documentSubmission?.[0]?.artifactList?.isEvidence}
        />
      )}
      {showSuccessModal && modalType === "Submissions" && <SubmissionSuccessModal t={t} handleBack={handleBack} />}
    </React.Fragment>
  );
};

export default EvidenceModal;
