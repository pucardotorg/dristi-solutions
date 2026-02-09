import { CloseSvg, TextInput } from "@egovernments/digit-ui-react-components";
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
import useDownloadCasePdf from "../../../hooks/dristi/useDownloadCasePdf";
import {
  cleanString,
  getAuthorizedUuid,
  getDate,
  getOrderActionName,
  getOrderTypes,
  removeInvalidNameParts,
  setApplicationStatus,
} from "../../../Utils";
import useGetAllOrderApplicationRelatedDocuments from "../../../hooks/dristi/useGetAllOrderApplicationRelatedDocuments";
import { useToast } from "../../../components/Toast/useToast";
import useSearchEvidenceService from "../../../../../submissions/src/hooks/submissions/useSearchEvidenceService";
import CustomErrorTooltip from "../../../components/CustomErrorTooltip";
import CustomChip from "../../../components/CustomChip";
import DOMPurify from "dompurify";
import { getUserInfo } from "../../../../../submissions/src/utils";

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
  setShowMakeAsEvidenceModal,
  isApplicationAccepted,
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
  const userUuid = userInfo?.uuid; // use userUuid only if required explicitly, otherwise use only authorizedUuid.
  const authorizedUuid = getAuthorizedUuid(userUuid);
  const user = Digit.UserService.getUser()?.info?.name;
  const isLitigent = useMemo(() => !userInfo?.roles?.some((role) => ["ADVOCATE_ROLE", "ADVOCATE_CLERK_ROLE"].includes(role?.code)), [
    userInfo?.roles,
  ]);
  const isJudge = useMemo(() => userInfo?.roles?.some((role) => ["JUDGE_ROLE"].includes(role?.code)), [userInfo?.roles]);
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo?.type]);
  const todayDate = new Date().getTime();
  const [formData, setFormData] = useState({});
  const [showFileIcon, setShowFileIcon] = useState(false);
  const { downloadPdf } = useDownloadCasePdf();
  const { documents: allCombineDocs, isLoading, fetchRecursiveData } = useGetAllOrderApplicationRelatedDocuments({ caseCourtId });
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
  const [businessOfTheDay, setBusinessOfTheDay] = useState(null);
  const toast = useToast();
  const urlParams = new URLSearchParams(window.location.search);
  const applicationNumber = urlParams.get("applicationNumber");
  const compositeOrderObj = history.location?.state?.compositeOrderObj;
  const [reasonOfApplication, setReasonOfApplication] = useState("");
  const [userInfoMap, setUserInfoMap] = useState({
    senderUser: null,
    createdByUser: null,
    onBehalfOfUser: null,
  });
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
        {props?.evidenceMarkedStatus && (
          <CustomChip
            text={props?.evidenceMarkedStatus === "COMPLETED" ? t("SIGNED") : t(props?.evidenceMarkedStatus) || ""}
            shade={props?.evidenceMarkedStatus === "COMPLETED" ? "green" : "grey"}
          />
        )}

        {props.showStatus && <h3 className={props.isStatusRed ? "status-false" : "status"}>{props?.status}</h3>}
      </div>
    );
  };

  const computeDefaultBOTD = useMemo(() => {
    return `Document marked as evidence exhibit number ${documentSubmission?.[0]?.artifactList?.artifactNumber}`;
  }, [documentSubmission]);

  useEffect(() => {
    setBusinessOfTheDay(computeDefaultBOTD);
  }, [computeDefaultBOTD, setBusinessOfTheDay]);

  useEffect(() => {
    if (!documentSubmission?.length > 0 && !artifact) return;
    if (documentSubmission?.[0]?.artifactList?.sourceType === "COURT") {
      return; // directly show onwner name in case of employees, no individual api calling.
    }

    let officeAdvocateUuid = "";
    let createdBy = "";
    let onBehalfOfUuid = "";

    if (documentSubmission?.[0]?.applicationList || documentSubmission?.[0]?.artifactList) {
      const { officeAdvocateUserUuid, auditDetails, auditdetails, onBehalfOf } =
        documentSubmission?.[0]?.applicationList || documentSubmission?.[0]?.artifactList;
      officeAdvocateUuid = officeAdvocateUserUuid;
      createdBy = auditDetails?.createdBy || auditdetails?.createdBy;
      onBehalfOfUuid = onBehalfOf?.[0];
    } else if (artifact?.artifactList) {
      const { officeAdvocateUserUuid, auditDetails } = artifact?.artifactList;
      officeAdvocateUuid = officeAdvocateUserUuid;
      createdBy = auditDetails?.createdBy;
    }

    const uuids = [...new Set([officeAdvocateUuid, createdBy, onBehalfOfUuid].filter(Boolean))];

    if (uuids.length === 0) {
      setUserInfoMap({
        senderUser: null,
        createdByUser: null,
        onBehalfOfUser: null,
      });
      return;
    }

    let isMounted = true;

    const fetchUsers = async () => {
      try {
        const result = await getUserInfo(uuids);

        const lookup = new Map(result.map((user) => [user.userUuid, user.name]));

        if (!isMounted) return;

        setUserInfoMap({
          senderUser: officeAdvocateUuid
            ? { uuid: officeAdvocateUuid, name: lookup.get(officeAdvocateUuid) }
            : createdBy
            ? { uuid: createdBy, name: lookup.get(createdBy) }
            : null,
          createdByUser: createdBy ? { uuid: createdBy, name: lookup.get(createdBy) } : null,
          onBehalfOfUser: onBehalfOfUuid ? { uuid: onBehalfOfUuid, name: lookup.get(onBehalfOfUuid) } : null,
        });
      } catch (error) {
        console.error("Failed to fetch user info", error);
      }
    };

    fetchUsers();

    return () => {
      isMounted = false;
    };
  }, [documentSubmission, artifact]);

  const senderName = useMemo(() => {
    if (documentSubmission?.[0]?.artifactList?.sourceType === "COURT") {
      return documentSubmission?.[0]?.artifactList?.owner;
    }
    return currentDiaryEntry && artifact
      ? artifact?.sender
      : userInfoMap?.onBehalfOfUser?.name
      ? `${userInfoMap?.senderUser?.name} on Behalf of ${userInfoMap?.onBehalfOfUser?.name}`
      : userInfoMap?.senderUser?.name;
  }, [userInfoMap, artifact, currentDiaryEntry, documentSubmission]);

  const createdByname = useMemo(() => {
    if (documentSubmission?.[0]?.artifactList?.sourceType === "COURT") {
      return null;
    }
    return userInfoMap?.createdByUser?.name;
  }, [userInfoMap, documentSubmission]);

  const documentApplicationType = useMemo(() => documentSubmission?.[0]?.applicationList?.applicationType, [documentSubmission]);

  const respondingUuids = useMemo(() => {
    return documentSubmission?.[0]?.details?.additionalDetails?.respondingParty?.map((party) => party?.uuid?.map((uuid) => uuid))?.flat() || [];
  }, [documentSubmission]);

  const isBail = useMemo(() => {
    return ["SUBMIT_BAIL_DOCUMENTS", "REQUEST_FOR_BAIL"].includes(documentSubmission?.[0]?.applicationList?.applicationType);
  }, [documentSubmission]);

  // No need to show submit, cancel and set term of bail buttons for bail applications

  const showSubmit = useMemo(() => {
    if (userType === "employee") {
      if (!isJudge) {
        if (
          modalType === "Documents" &&
          !(
            documentSubmission?.[0]?.artifactList?.isEvidence ||
            documentSubmission?.[0]?.artifactList?.isVoid ||
            documentSubmission?.[0]?.artifactList?.evidenceMarkedStatus !== null
          )
        ) {
          return true;
        }

        return false;
      }
      if (modalType === "Documents") {
        if (documentSubmission?.[0]?.artifactList?.isVoid) return false;
        return true;
      }
      return (
        userRoles.includes("SUBMISSION_APPROVER") &&
        [SubmissionWorkflowState.PENDINGAPPROVAL, SubmissionWorkflowState.PENDINGREVIEW].includes(applicationStatus)
        // &&
        // !isBail
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
  }, [userType, isJudge, modalType, userRoles, applicationStatus, isBail, documentSubmission, userInfo?.uuid, createdBy, isLitigent, allAdvocates]);

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
      if (
        documentSubmission?.[0]?.artifactList?.isEvidence ||
        documentSubmission?.[0]?.artifactList?.isVoid ||
        documentSubmission?.[0]?.artifactList?.evidenceMarkedStatus !== null
      ) {
        label = false;
      } else {
        label = t("MARK_AS_EVIDENCE");
      }
    }
    return label;
  }, [allAdvocates, applicationStatus, createdBy, documentSubmission, isLitigent, modalType, respondingUuids, t, userInfo?.uuid, userType]);

  const actionCancelLabel = useMemo(() => {
    if (
      userRoles.includes("SUBMISSION_APPROVER") &&
      [SubmissionWorkflowState.PENDINGAPPROVAL, SubmissionWorkflowState.PENDINGREVIEW].includes(applicationStatus) &&
      modalType === "Submissions"
      // &&
      // !isBail
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
    Boolean(artifactNumber && caseCourtId)
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
      "ADDING_WITNESSES",
    ];
    if (type === "reject") {
      return false;
    } else {
      return acceptedApplicationTypes.includes(applicationType);
    }
  }, [documentSubmission, showConfirmationModal?.type]);
  const showDocument = useMemo(() => {
    return (
      <React.Fragment>
        {modalType !== "Submissions" ? (
          currentDiaryEntry && artifact ? (
            <div className="application-view">
              <React.Fragment>
                <DocViewerWrapper
                  key={"selectedFileStoreId"}
                  tenantId={tenantId}
                  fileStoreId={artifact?.file?.fileStore}
                  showDownloadOption={false}
                  docHeight="100%"
                  docWidth="100%"
                  docViewerStyle={{ maxWidth: "100%" }}
                />

                {artifact?.seal?.fileStore && artifact?.evidenceMarkedStatus === "COMPLETED" && (
                  <DocViewerWrapper
                    key={"selectedFileStoreId"}
                    tenantId={tenantId}
                    fileStoreId={artifact?.seal?.fileStore}
                    showDownloadOption={false}
                    docHeight="100%"
                    docWidth="100%"
                    docViewerStyle={{ maxWidth: "100%" }}
                  />
                )}
              </React.Fragment>
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
                    <React.Fragment>
                      {docSubmission?.artifactList?.seal?.fileStore && docSubmission?.artifactList?.evidenceMarkedStatus === "COMPLETED" && (
                        <DocViewerWrapper
                          key={"selectedFileStoreId"}
                          tenantId={tenantId}
                          fileStoreId={docSubmission?.artifactList?.seal?.fileStore}
                          showDownloadOption={false}
                          docHeight="100%"
                          docWidth="100%"
                          docViewerStyle={{ maxWidth: "100%" }}
                        />
                      )}
                    </React.Fragment>
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
                  errorHeight={"460px"}
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
  }, [modalType, currentDiaryEntry, artifact, tenantId, documentSubmission, allCombineDocs, isLoading, t]);

  const handleApplicationAction = async (generateOrder, type) => {
    try {
      const orderType = getOrderTypes(documentSubmission?.[0]?.applicationList?.applicationType, type);
      const refApplicationId = documentSubmission?.[0]?.applicationList?.applicationNumber;
      const applicationCMPNumber = documentSubmission?.[0]?.applicationList?.applicationCMPNumber;
      const currentHearingPurpose = documentSubmission?.[0]?.applicationList?.applicationDetails?.initialHearingPurpose || "";
      const caseNumber =
        (caseData?.isLPRCase ? caseData?.lprNumber : caseData?.courtCaseNumber) ||
        caseData?.courtCaseNumber ||
        caseData?.cmpNumber ||
        caseData?.filingNumber;
      const formdata = {
        orderType: {
          code: orderType,
          type: orderType,
          name: `ORDER_TYPE_${orderType}`,
        },
        refApplicationId: refApplicationId,
        ...(currentHearingPurpose && { originalHearingPurpose: currentHearingPurpose }),
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
      const refHearingId = documentSubmission?.[0]?.applicationList?.additionalDetails?.formdata?.refHearingId;
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
        ...(refHearingId && { refHearingId: refHearingId }),
      };

      if (generateOrder) {
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
            orderDetails: {
              ...(parties || {}),
              applicationTitle: t(documentSubmission?.[0]?.applicationList?.applicationType),
              applicationNumber: refApplicationId,
              applicationCMPNumber: applicationCMPNumber,
              caseNumber: caseNumber,
              ...(orderType === "EXTENSION_OF_DOCUMENT_SUBMISSION_DATE" ? { action: type === "reject" ? "REJECT" : "APPROVE" } : {}),
            },
            ...(linkedOrderNumber && { linkedOrderNumber }),
          },
        };
        try {
          const res = await ordersService.createOrder(reqbody, { tenantId });
          // const name = getOrderActionName(documentSubmission?.[0]?.applicationList?.applicationType, isBail ? type : showConfirmationModal?.type);
          const name = getOrderActionName(documentSubmission?.[0]?.applicationList?.applicationType ? type : showConfirmationModal?.type);
          DRISTIService.customApiService(Urls.dristi.pendingTask, {
            //need to add actioncategory for ORDER_EXTENSION_SUBMISSION_DEADLINE , ORDER_FOR_INITIATING_RESCHEDULING_OF_HEARING_DATE
            pendingTask: {
              actionCategory:
                name === "ORDER_EXTENSION_SUBMISSION_DEADLINE"
                  ? "View Application"
                  : name === "ORDER_FOR_INITIATING_RESCHEDULING_OF_HEARING_DATE"
                  ? "Schedule Hearing"
                  : null,
              name: t(name),
              entityType: "order-default",
              referenceId: `MANUAL_${res?.order?.orderNumber}`,
              status: "DRAFT_IN_PROGRESS",
              assignedTo: [],
              assignedRole: ["PENDING_TASK_ORDER"],
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
          sessionStorage.setItem("currentOrderType", orderType);
          history.push(`/${window.contextPath}/employee/orders/generate-order?filingNumber=${filingNumber}&orderNumber=${res?.order?.orderNumber}`);
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
          `/${window.contextPath}/employee/dristi/home/view-case/review-litigant-details?caseId=${caseId}&referenceId=${documentSubmission?.[0]?.details?.additionalDetails?.pendingTaskRefId}&refApplicationId=${refApplicationId}`,
          {
            dateOfApplication: documentSubmission?.[0]?.applicationList?.additionalDetails?.dateOfApplication,
            uniqueId: documentSubmission?.[0]?.applicationList?.additionalDetails?.uniqueId,
          }
        );
        return;
      }
      if (isBail) {
        await handleApplicationAction(true, "accept");
      } else if (modalType === "Submissions") {
        await handleApplicationAction(true, "accept");
      } else {
        if (modalType === "Documents") {
          setShow(false);
          setShowMakeAsEvidenceModal(true);
        }
      }
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
      } else if (modalType === "Submissions") {
        await handleApplicationAction(true, "reject");
      }
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

  useEffect(() => {
    if (!(currentDiaryEntry && artifact)) {
      fetchRecursiveData(documentSubmission?.[0]?.applicationList);
    }
  }, [artifact, currentDiaryEntry, documentSubmission, fetchRecursiveData]);

  useEffect(() => {
    if (isApplicationAccepted && documentSubmission?.[0]?.applicationList?.applicationType !== "CORRECTION_IN_COMPLAINANT_DETAILS") {
      setShowConfirmationModal({ type: isApplicationAccepted?.value ? "accept" : "reject" });
    }
  }, [documentSubmission, isApplicationAccepted]);

  return (
    <React.Fragment>
      <style>
        {`.popup-module.evidence-modal .popup-module-main .selector-button-border {
          border-color: #BB2C2F !important;
        }
        .popup-module.evidence-modal .popup-module-main .selector-button-border h2 {
          color: #BB2C2F !important;
        }
        .popup-module.evidence-modal .info-value p {
          margin-top: 0;
        }
        .popup-module.evidence-modal .info-value ul {
          list-style-type: disc;
          margin-top: 0;
        }
       .popup-module.evidence-modal .info-value ol {
          list-style-type: decimal;
          margin-top: 0;
        }
        .confirm-submission-checkbox {
          .checkbox-wrap {
            .label {
              margin-left: 32px;
            }
          .custom-checkbox {
              height: 20px;
              width: 20px;
            }
          }
        }
      .popup-module.evidence-modal .info-value li {
        margin: 0;
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
          // actionCustomLabel={!customLabelShow ? false : actionCustomLabel} // Not allowing cancel action for court room manager
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
              evidenceMarkedStatus={
                (modalType === "Documents" && documentSubmission?.[0]?.artifactList?.evidenceMarkedStatus === "COMPLETED") || userType === "employee"
                  ? documentSubmission?.[0]?.artifactList?.evidenceMarkedStatus
                  : null
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
          // actionCancelTextStyle={
          //   customLabelShow
          //     ? {
          //         color: "#BB2C2F",
          //       }
          //     : {}
          // }
        >
          {(documentSubmission?.[0]?.artifactList?.evidenceMarkedStatus || documentSubmission?.[0]?.artifactList?.isEvidence) &&
            userType === "employee" && (
              <div style={{ margin: "16px 24px" }}>
                <div className="custom-note-main-div" style={{ padding: "8px 16px", flexDirection: "row", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <CustomErrorTooltip message={t("CS_EVIDENCE_MARKED_INFO_TEXT")} showTooltip={true} />
                    <div className="custom-note-heading-div">
                      <h2>{t("CS_PLEASE_COMMON_NOTE")}</h2>
                    </div>
                    <div className="custom-note-info-div" style={{ display: "flex", alignItems: "center" }}>
                      {<p>{t("CS_EVIDENCE_MARKED_INFO_TEXT")}</p>}
                    </div>
                  </div>
                  <div>
                    <button
                      className="custom-note-close-button"
                      style={{ fontWeight: "700", fontSize: "18px", fontStyle: "large", backgroundColor: "transparent", color: "#0F3B8C" }}
                      onClick={() => {
                        setShow(false);
                        setShowMakeAsEvidenceModal(true);
                      }}
                    >
                      {t("VIEW_DETAILS")}
                    </button>
                  </div>
                </div>
              </div>
            )}
          <div
            className="evidence-modal-main "
            style={
              documentSubmission?.[0]?.artifactList?.evidenceMarkedStatus || documentSubmission?.[0]?.artifactList?.isEvidence
                ? { height: "calc(100% - 140px)" }
                : {}
            }
          >
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
                <div className="application-info-new" style={{ display: "flex", flexDirection: "column" }}>
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
                      <h3>{senderName}</h3>
                    </div>
                  </div>
                  {createdByname && (
                    <div className="info-row">
                      <div className="info-key">
                        <h3>{t("CREATED_BY")}</h3>
                      </div>
                      <div className="info-value">
                        <h3>{createdByname}</h3>
                      </div>
                    </div>
                  )}
                  {documentSubmission?.[0]?.applicationList?.additionalDetails?.formdata?.initialHearingDate && (
                    <div className="info-row">
                      <div className="info-key">
                        <h3>{t("CURRENT_HEARING_DATE")}</h3>
                      </div>
                      <div className="info-value">
                        <h3>
                          {documentSubmission?.[0]?.applicationList?.additionalDetails?.formdata?.initialHearingDate
                            ?.split("-")
                            ?.reverse()
                            ?.join("-")}
                        </h3>
                      </div>
                    </div>
                  )}
                  {documentSubmission?.[0]?.applicationList?.additionalDetails?.formdata?.newHearingDates && (
                    <div className="info-row">
                      <div className="info-key">
                        <h3>{t("PROPOSED_HEARING_DATE")}</h3>
                      </div>
                      <div className="info-value">
                        <h3>{documentSubmission?.[0]?.applicationList?.additionalDetails?.formdata?.newHearingDates?.join(", ")}</h3>
                      </div>
                    </div>
                  )}
                  {documentSubmission?.[0]?.applicationList?.additionalDetails?.formdata?.initialHearingPurpose && (
                    <div className="info-row">
                      <div className="info-key">
                        <h3>{t("PURPOSE_OF_NEXT_HEARING")}</h3>
                      </div>
                      <div className="info-value">
                        <h3>{t(documentSubmission?.[0]?.applicationList?.additionalDetails?.formdata?.initialHearingPurpose)}</h3>
                      </div>
                    </div>
                  )}
                  {documentSubmission?.[0]?.applicationList?.additionalDetails?.formdata?.isAllPartiesAgreed?.code && (
                    <div className="info-row">
                      <div className="info-key">
                        <h3>{t("OTHER_PARTIES_CONSENT")}</h3>
                      </div>
                      <div className="info-value">
                        <h3>{t(documentSubmission?.[0]?.applicationList?.additionalDetails?.formdata?.isAllPartiesAgreed?.code)}</h3>
                      </div>
                    </div>
                  )}
                  {documentSubmission?.[0]?.artifactList?.additionalDetails?.formdata?.reasonForFiling && (
                    <div className="info-row">
                      <div className="info-key">
                        <h3>{t("REASON_FOR_FILING")}</h3>
                      </div>
                      <div
                        className="info-value"
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(documentSubmission?.[0]?.artifactList?.additionalDetails?.formdata?.reasonForFiling?.text || ""),
                        }}
                      ></div>
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>{showDocument}</div>
              </div>
            </div>
            {(userRoles.includes("SUBMISSION_RESPONDER") || userType === "employee") && (
              <div className={`application-comment`}>
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
          setReasonOfApplication={setReasonOfApplication}
          reasonOfApplication={reasonOfApplication}
          handleBack={handleBack}
          applicationType={documentSubmission?.[0]?.applicationList?.applicationType}
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
