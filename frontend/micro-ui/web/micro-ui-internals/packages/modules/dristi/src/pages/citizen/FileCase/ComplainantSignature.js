import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActionBar, SubmitBar, Loader, Button, CloseSvg } from "@egovernments/digit-ui-react-components";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import DocViewerWrapper from "../../employee/docViewerWrapper";
import { FileUploadIcon } from "../../../icons/svgIndex";
import { ReactComponent as InfoIcon } from "../../../icons/info.svg";
import { useTranslation } from "react-i18next";
import useSearchCaseService from "../../../hooks/dristi/useSearchCaseService";
import useDownloadCasePdf from "../../../hooks/dristi/useDownloadCasePdf";
import { DRISTIService } from "../../../services";
import {
  findCaseDraftEditAllowedParties,
  getAllComplainantSideUuids,
  getLoggedInUserOnBehalfOfUuid,
  getSuffixByBusinessCode,
  getUniqueAcronym,
} from "../../../Utils";
import UploadSignatureModal from "../../../components/UploadSignatureModal";
import { Urls } from "../../../hooks";
import { useToast } from "../../../components/Toast/useToast";
import Modal from "../../../components/Modal";
import { mergeBreakdowns } from "./EfilingValidationUtils";
import { CaseWorkflowState } from "../../../Utils/caseWorkflow";

const getStyles = () => ({
  container: { display: "flex", flexDirection: "row", marginBottom: "50px" },
  leftPanel: {
    flex: 1,
    padding: "24px 16px 16px 16px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
  },
  caseDetails: {
    border: "1px solid #9E400A24",
    borderRadius: "4px",
    padding: "12px 16px",
    backgroundColor: "#F7F5F3",
    marginBottom: "16px",
  },
  infoRow: { display: "flex", alignItems: "center" },
  infoText: { marginLeft: "8px" },
  detailsSection: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  advocateDetails: {
    marginTop: "8px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  litigantDetails: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  signedLabel: {
    padding: "6px 8px",
    borderRadius: "999px",
    color: "#00703C",
    backgroundColor: "#E4F2E4",
    fontSize: "12px",
    fontWeight: 400,
  },
  unSignedLabel: {
    padding: "6px 8px",
    borderRadius: "999px",
    color: "#9E400A",
    backgroundColor: "#FFF6E8",
    fontSize: "12px",
    fontWeight: 400,
  },
  centerPanel: { flex: 3, padding: "24px 16px 16px 16px", border: "1px solid #e0e0e0" },
  header: { height: "72px", gap: "8px", display: "flex", flexDirection: "column", justifyContent: "space-between" },
  title: { width: "584px", height: "38px", color: "#0A0A0A", fontSize: "32px", fontWeight: 700 },
  downloadButton: {
    background: "none",
    border: "none",
    color: "#007E7E",
    fontSize: "16px",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  details: { color: "#231F20", fontWeight: 700, fontSize: "20px" },
  description: { color: "#77787B", fontSize: "16px", fontWeight: 400 },
  docViewer: { marginTop: "24px", border: "1px solid #e0e0e0", display: "flex", overflow: "hidden" },
  rightPanel: { flex: 1, padding: "24px 16px 24px 24px", borderLeft: "1px solid #ccc" },
  signaturePanel: { display: "flex", flexDirection: "column" },
  signatureTitle: { fontSize: "24px", fontWeight: 700, color: "#3D3C3C" },
  signatureDescription: { fontWeight: "400", fontSize: "16px", color: "#3D3C3C", marginBottom: 0 },
  esignButton: {
    height: "40px",
    alignItems: "center",
    fontWeight: 700,
    fontSize: "16px",
    color: "#FFFFFF",
    display: "flex",
    justifyContent: "center",
    backgroundColor: "#007E7E",
    border: "none",
    cursor: "pointer",
    padding: "0 20px",
    marginTop: "20px",
  },
  uploadButton: {
    marginBottom: "16px",
    marginTop: "8px",
    height: "40px",
    fontWeight: 700,
    fontSize: "16px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "0 16px",
    color: "#007E7E",
  },
  actionBar: { display: "flex", justifyContent: "flex-end", width: "100%" },
  submitButton: { backgroundColor: "#008080", color: "#fff", fontWeight: "bold", cursor: "pointer" },
  editCaseButton: { backgroundColor: "#fff", border: "#007E7E solid", color: "#007E7E", cursor: "pointer" },
});

const Heading = (props) => {
  return <h1 className="heading-m">{props.label}</h1>;
};

const CloseBtn = (props) => {
  return (
    <div
      onClick={props?.onClick}
      style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        paddingRight: "20px",
        cursor: "pointer",
        ...(props?.backgroundColor && { backgroundColor: props.backgroundColor }),
      }}
    >
      <CloseSvg />
    </div>
  );
};

const RightArrow = () => (
  <svg style={{ marginLeft: "8px" }} width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 0L6.59 1.41L12.17 7H0V9H12.17L6.59 14.59L8 16L16 8L8 0Z" fill="white" />
  </svg>
);

const FileDownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.6693 6H10.0026V2H6.0026V6H3.33594L8.0026 10.6667L12.6693 6ZM3.33594 12V13.3333H12.6693V12H3.33594Z" fill="#007E7E" />
  </svg>
);

const caseType = {
  category: "Criminal",
  act: "Negotiable Instruments Act",
  section: "138",
  courtName: "Kollam S-138 Special Court",
  href: "https://www.indiacode.nic.in/bitstream/123456789/2189/1/a1881-26.pdf",
};

const complainantWorkflowACTION = {
  UPLOAD_DOCUMENT: "UPLOAD",
  ESIGN: "E-SIGN",
  EDIT_CASE: "EDIT_CASE",
  EDIT_UNSIGNED_CASE: "EDIT_UNSIGNED_CASE",
};

const complainantWorkflowState = {
  PENDING_ESIGN: "PENDING_E-SIGN",
  PENDING_ESIGN_SCRUTINY: "PENDING_RE_E-SIGN",
  UPLOAD_SIGN_DOC: "PENDING_SIGN",
  UPLOAD_SIGN_DOC_SCRUTINY: "PENDING_RE_SIGN",
  DRAFT_IN_PROGRESS: "DRAFT_IN_PROGRESS",
  CASE_REASSIGNED: "CASE_REASSIGNED",
};

const stateSla = {
  PENDING_PAYMENT: 2,
  RE_PENDING_PAYMENT: 2,
};

const dayInMillisecond = 24 * 3600 * 1000;

const ComplainantSignature = ({ path }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const toast = useToast();
  const Digit = window.Digit || {};
  const { filingNumber, caseId } = Digit.Hooks.useQueryParams();
  const todayDate = new Date().getTime();
  const [Loading, setLoader] = useState(false);
  const [isEsignSuccess, setEsignSuccess] = useState(false);
  const [uploadDoc, setUploadDoc] = useState(false);
  const [isDocumentUpload, setDocumentUpload] = useState(false);
  const [isEditCaseModal, setEditCaseModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [fileUploadError, setFileUploadError] = useState(null);
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const styles = getStyles();
  const roles = Digit.UserService.getUser()?.info?.roles;
  const userInfo = Digit?.UserService?.getUser()?.info;
  const userInfoType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo]);
  const [signatureDocumentId, setSignatureDocumentId] = useState(null);
  const { downloadPdf } = useDownloadCasePdf();
  const { handleEsign } = Digit.Hooks.orders.useESign();
  const { uploadDocuments } = Digit.Hooks.orders.useDocumentUpload();
  const name = "Signature";
  const [calculationResponse, setCalculationResponse] = useState({});
  const mockESignEnabled = window?.globalConfigs?.getConfig("mockESignEnabled") === "true" ? true : false;
  const updatedOnceRef = useRef(null);

  const uploadModalConfig = useMemo(() => {
    return {
      key: "uploadSignature",
      populators: {
        inputs: [
          {
            name: name,
            type: "DragDropComponent",
            uploadGuidelines: "Ensure the image is not blurry and under 5MB.",
            maxFileSize: 10,
            maxFileErrorMessage: "CS_FILE_LIMIT_10_MB",
            fileTypes: ["JPG", "PNG", "JPEG", "PDF"],
            isMultipleUpload: false,
          },
        ],
        validation: {},
      },
    };
  }, [name]);

  const onSelect = (key, value) => {
    if (value?.[name] === null) {
      setFormData({});
      setSignatureDocumentId(null);
      setUploadDoc(false);
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [key]: value,
      }));
    }
    setFileUploadError(null);
  };

  const onSubmit = async () => {
    if (formData?.uploadSignature?.Signature?.length > 0) {
      try {
        const uploadedFileId = await uploadDocuments(formData?.uploadSignature?.Signature, tenantId);
        setSignatureDocumentId(uploadedFileId?.[0]?.fileStoreId);
        setUploadDoc(true);
        setDocumentUpload(false);
      } catch (error) {
        console.error("error", error);
        setFormData({});
        setFileUploadError(error?.response?.data?.Errors?.[0]?.code || "CS_FILE_UPLOAD_ERROR");
      }
    }
  };

  const { data: caseData, refetch: refetchCaseData, isLoading, isFetching: isCaseDataFetching } = useSearchCaseService(
    {
      criteria: [
        {
          filingNumber: filingNumber,
          caseId: caseId,
        },
      ],
      tenantId,
    },
    {},
    `case-details-${filingNumber}`,
    filingNumber,
    Boolean(filingNumber)
  );
  console.log("isCaseDataFetching", isCaseDataFetching, isLoading);

  const caseDetails = useMemo(
    () => ({
      ...caseData?.criteria?.[0]?.responseList?.[0],
    }),
    [caseData]
  );

  // if logged in user is jr adv/clerk -? get uuid of senior advocate who filed the case(case owner)
  // if logged in user is senior advocate(case owner) -? get uuid of himself
  // if logged in user is litigant/poa -? get uuid of himself
  const loggedInUserOnBehalfOfUuid = useMemo(() => {
    const loggedInUserOnBehalfOfUuid = getLoggedInUserOnBehalfOfUuid(caseDetails, userInfo?.uuid);
    return loggedInUserOnBehalfOfUuid;
  }, [userInfo, caseDetails]);

  // if the senior advocate who himself filed the case(case owner) has logged in.
  const isOwnerAdvocateSelf = useMemo(() => roles?.some((role) => role.code === "ADVOCATE_ROLE") && loggedInUserOnBehalfOfUuid === userInfo?.uuid, [
    roles,
    loggedInUserOnBehalfOfUuid,
    userInfo,
  ]);

  // If the member(clerk/junior advocate) has logged in on behalf of senior advocate who filed the case(case owner).
  const isMemberOnBehalfOfOwnerAdvocate = useMemo(
    () => roles?.some((role) => ["ADVOCATE_ROLE", "ADVOCATE_CLERK_ROLE"]?.includes(role.code)) && loggedInUserOnBehalfOfUuid !== userInfo?.uuid,
    [roles, loggedInUserOnBehalfOfUuid, userInfo]
  );

  const DocumentFileStoreId = useMemo(() => {
    return caseDetails?.additionalDetails?.signedCaseDocument;
  }, [caseDetails]);

  const litigants = useMemo(() => {
    return caseDetails?.litigants
      ?.filter((litigant) => litigant.partyType.includes("complainant"))
      ?.map((litigant) => ({
        ...litigant,
        representatives:
          caseDetails?.representatives?.filter((rep) =>
            rep?.representing?.some((complainant) => complainant?.individualId === litigant?.individualId)
          ) || [],
        poaHolder: caseDetails?.poaHolders?.find((poaHolder) =>
          poaHolder?.representingLitigants?.some((complainant) => complainant?.individualId === litigant?.individualId)
        ),
      }));
  }, [caseDetails]);

  const poaHolders = useMemo(() => {
    return caseDetails?.poaHolders?.map((poaHolder) => {
      const representingWithLitigant = poaHolder?.representingLitigants?.map((rep) => {
        return {
          ...litigants?.find((lit) => rep?.individualId === lit?.individualId),
          ...rep,
        };
      });
      return {
        ...poaHolder,
        representingLitigants: representingWithLitigant,
      };
    });
  }, [caseDetails, litigants]);

  // Case correction/edition is allowed to all complainant side parties including poa holders, advocates, advocate's associated office members.
  const allComplainantSideUuids = useMemo(() => {
    return getAllComplainantSideUuids(caseDetails);
  }, [caseDetails]);

  const caseDraftEditAllowedParties = useMemo(() => {
    const createdByUuid = caseDetails?.auditDetails?.createdBy;
    // Parties who are allowed to edit case details during filing draft stage:
    // 1. If the case created by litigant -> only that litigant can have the edit access.
    // 2. If the case created by Advocate/clerk -> The primary advocate(the owner i.e. senior advocate) and all its associated office members(like clerks, junior advocates) can have the edit access.
    return findCaseDraftEditAllowedParties(caseDetails, createdByUuid);
  }, [caseDetails]);

  // Parties which are allowed to edit during efiling process
  const isEFilingEditAllowedMember = useMemo(() => {
    if ([CaseWorkflowState?.PENDING_SIGN, CaseWorkflowState.PENDING_E_SIGN]?.includes(caseDetails?.status)) {
      const loggedInUserUuid = userInfo?.uuid;
      const isEditingAllowedToUser = caseDraftEditAllowedParties?.includes(loggedInUserUuid);
      return isEditingAllowedToUser;
    }
    return false;
  }, [caseDraftEditAllowedParties, userInfo?.uuid, caseDetails?.status]);

  // Parties which are allowed to edit during case correction process
  const isCaseCorrectionAllowedMember = useMemo(() => {
    if ([CaseWorkflowState?.PENDING_RE_SIGN, CaseWorkflowState.PENDING_RE_E_SIGN]?.includes(caseDetails?.status)) {
      const isCaseCorrectionAllowed = allComplainantSideUuids?.includes(userInfo?.uuid);
      return isCaseCorrectionAllowed;
    }
    return false;
  }, [allComplainantSideUuids, userInfo?.uuid, caseDetails?.status]);

  useEffect(() => {
    console.log("complainant-mounted");
    return () => {
      console.log("complainant-unmounted");
    };
  }, []);

  useEffect(() => {
    if ([CaseWorkflowState?.DRAFT_IN_PROGRESS, CaseWorkflowState.CASE_REASSIGNED]?.includes(caseDetails?.status)) {
      history.replace(`/${window?.contextPath}/${userInfoType}/dristi/home/file-case/case?caseId=${caseId}&selected=complainantDetails`);
    } else if (
      caseDetails?.status &&
      ![
        CaseWorkflowState?.PENDING_RE_SIGN,
        CaseWorkflowState.PENDING_RE_E_SIGN,
        CaseWorkflowState.PENDING_E_SIGN,
        CaseWorkflowState.PENDING_SIGN,
      ]?.includes(caseDetails?.status)
    ) {
      history.replace(`/${window?.contextPath}/${userInfoType}/home/home-pending-task`);
    }
  }, [caseDetails, caseId, history, isLoading, allComplainantSideUuids, userInfoType]);

  const isCurrentLitigantSigned = useMemo(() => {
    return litigants?.some((lit) => lit?.hasSigned && lit?.additionalDetails?.uuid === loggedInUserOnBehalfOfUuid);
  }, [litigants, loggedInUserOnBehalfOfUuid]);

  const isCurrentAdvocateSigned = useMemo(() => {
    return caseDetails?.representatives?.some((advocate) => advocate?.hasSigned && advocate?.additionalDetails?.uuid === loggedInUserOnBehalfOfUuid);
  }, [caseDetails?.representatives, loggedInUserOnBehalfOfUuid]);

  const isCurrentPoaSigned = useMemo(() => {
    return caseDetails?.poaHolders?.some((poa) => poa?.hasSigned && poa?.additionalDetails?.uuid === loggedInUserOnBehalfOfUuid);
  }, [caseDetails, loggedInUserOnBehalfOfUuid]);

  const isCurrentLitigantContainPoa = useMemo(
    () => litigants?.some((lit) => lit?.additionalDetails?.uuid === loggedInUserOnBehalfOfUuid && lit?.poaHolder),
    [litigants, loggedInUserOnBehalfOfUuid]
  );

  const isCurrentPersonPoa = useMemo(
    () => caseDetails?.poaHolders?.some((poaHolder) => poaHolder?.additionalDetails?.uuid === loggedInUserOnBehalfOfUuid),
    [caseDetails, loggedInUserOnBehalfOfUuid]
  );

  const isCurrentPersonPoaComplainant = useMemo(
    () => isCurrentPersonPoa && litigants?.some((litigant) => litigant?.additionalDetails?.uuid === loggedInUserOnBehalfOfUuid),
    [litigants, loggedInUserOnBehalfOfUuid, isCurrentPersonPoa]
  );

  const state = useMemo(() => caseDetails?.status, [caseDetails]);
  const isSelectedEsign = useMemo(() => {
    const esignStates = [complainantWorkflowState.PENDING_ESIGN, complainantWorkflowState.PENDING_ESIGN_SCRUTINY];

    return esignStates.includes(state);
  }, [state]);

  const isSelectedUploadDoc = useMemo(
    () => [complainantWorkflowState.UPLOAD_SIGN_DOC, complainantWorkflowState.UPLOAD_SIGN_DOC_SCRUTINY].includes(state),
    [state]
  );

  const isLastPersonSigned = useMemo(() => {
    if (!litigants?.length) return false;
    return litigants?.every((litigant) => {
      const litigantSigned = litigant?.hasSigned;
      const poaHolderSigned = litigant?.poaHolder?.hasSigned;
      const hasReps = litigant?.representatives?.length > 0;
      const anyRepresentativeSigned = hasReps ? litigant?.representatives?.some((rep) => rep?.hasSigned) : true;
      return (litigantSigned || poaHolderSigned) && anyRepresentativeSigned;
    });
  }, [litigants]);

  const paymentCriteriaList = useMemo(() => {
    const processCourierDetails =
      caseDetails?.additionalDetails?.processCourierService?.formdata?.map((process) => process?.data?.multipleAccusedProcessCourier) || [];
    return processCourierDetails.flatMap((accused) => {
      const combinations = [];
      const addressList = accused?.addressDetails?.filter((addr) => addr?.checked) || [];
      const courierGroups = [
        { taskType: "NOTICE", channels: accused?.noticeCourierService || [] },
        { taskType: "SUMMONS", channels: accused?.summonsCourierService || [] },
      ];
      courierGroups.forEach(({ taskType, channels }) => {
        channels.forEach((channel) => {
          addressList.forEach((address) => {
            const pincode = address?.addressDetails?.pincode;
            if (pincode && channel?.channelId) {
              combinations.push({
                channelId: channel.channelId,
                receiverPincode: pincode,
                tenantId,
                id: `${taskType}_${channel.channelId}_${address?.id}`,
                taskType,
              });
            }
          });
        });
      });
      return combinations;
    });
  }, [caseDetails, tenantId]);

  const closePendingTask = async ({ status, assignee, closeUploadDoc }) => {
    const entityType = "case-default";
    const filingNumber = caseDetails?.filingNumber;
    await DRISTIService.customApiService(Urls.dristi.pendingTask, {
      pendingTask: {
        entityType,
        status,
        referenceId: closeUploadDoc ? `MANUAL_${filingNumber}` : `MANUAL_${filingNumber}_${assignee}`,
        cnrNumber: caseDetails?.cnrNumber,
        filingNumber: filingNumber,
        caseId: caseDetails?.id,
        caseTitle: caseDetails?.caseTitle,
        isCompleted: true,
        additionalDetails: {},
        tenantId,
      },
    });
  };

  const handleEditCase = async () => {
    setLoader(true);
    setEditCaseModal(false);
    try {
      const tempDocs = (caseDetails?.documents || [])?.filter(
        (doc) => doc?.documentType !== "case.complaint.signed" && doc?.documentType !== "case.complaint.unsigned"
      );
      if (signatureDocumentId) {
        tempDocs.push({
          documentType: "oldCaseSignedDocument",
          fileStore: signatureDocumentId,
          fileName: "case Complaint Signed Document",
          isActive: false,
          toDelete: true,
        });
      }

      const action = [CaseWorkflowState?.PENDING_SIGN, CaseWorkflowState.PENDING_E_SIGN]?.includes(caseDetails?.status)
        ? complainantWorkflowACTION.EDIT_CASE
        : complainantWorkflowACTION.EDIT_UNSIGNED_CASE;

      await DRISTIService.caseUpdateService(
        {
          cases: {
            ...caseDetails,
            additionalDetails: {
              ...caseDetails?.additionalDetails,
              signedCaseDocument: null,
            },
            documents: tempDocs,
            workflow: {
              ...caseDetails?.workflow,
              action: action,
              assignes: [],
            },
          },
          tenantId,
        },
        tenantId
      ).then(async (res) => {
        if ([complainantWorkflowState.CASE_REASSIGNED, complainantWorkflowState.DRAFT_IN_PROGRESS].includes(res?.cases?.[0]?.status)) {
          if ((isOwnerAdvocateSelf || isMemberOnBehalfOfOwnerAdvocate) && isSelectedUploadDoc) {
            await closePendingTask({
              status: state,
              assignee: loggedInUserOnBehalfOfUuid,
              closeUploadDoc: true,
            });
          }
          if (isSelectedEsign) {
            const promises = [
              ...(Array.isArray(caseDetails?.litigants)
                ? litigants?.map(async (litigant) => {
                    if (!litigant?.poaHolder) {
                      return closePendingTask({
                        status: state,
                        assignee: litigant?.additionalDetails?.uuid,
                      });
                    }
                  })
                : []),
              ...(Array.isArray(caseDetails?.representatives)
                ? caseDetails?.representatives?.map(async (advocate) => {
                    return closePendingTask({
                      status: state,
                      assignee: advocate?.additionalDetails?.uuid,
                    });
                  })
                : []),
              ...(Array.isArray(caseDetails?.poaHolders)
                ? caseDetails?.poaHolders?.map(async (poaHolder) => {
                    return closePendingTask({
                      status: state,
                      assignee: poaHolder?.additionalDetails?.uuid,
                    });
                  })
                : []),
            ];
            await Promise.all(promises);
          }
          history.replace(
            `/${window?.contextPath}/${userInfoType}/dristi/home/file-case/case?caseId=${res?.cases?.[0]?.id}&selected=complainantDetails`
          );
        }
      });
    } catch (error) {
      console.error("Error:", error);
      toast.error(t("SOMETHING_WENT_WRONG"));
      setLoader(false);
    }
  };

  function getOtherAdvocatesForClosing() {
    // Step 1: Find the representative with current uuid
    const currentAdvocate = caseDetails?.representatives?.find((rep) => rep?.additionalDetails?.uuid === loggedInUserOnBehalfOfUuid);

    if (!currentAdvocate) {
      return [];
    }

    // Extract the representing objects for the target representative
    const currentAdvocateLitigants = currentAdvocate?.representing;

    // Step 2: Iterate through other representatives to compare
    const matchingRepresentatives = caseDetails?.representatives?.filter((rep) => {
      // Skip the target representative itself
      if (rep?.additionalDetails?.uuid === loggedInUserOnBehalfOfUuid) return true;

      const otherAdvocateLitigants = rep?.representing;

      // If otherAdvocateLitigants has one item, check if it's in the currentAdvocateLitigants
      if (otherAdvocateLitigants?.length === 1) {
        return otherAdvocateLitigants?.some((item) =>
          currentAdvocateLitigants?.some((targetItem) => targetItem?.individualId === item?.individualId)
        );
      }

      // If otherAdvocateLitigants has multiple items, check if all are in the currentAdvocateLitigants
      if (otherAdvocateLitigants?.length > 1) {
        return currentAdvocateLitigants?.every((targetItem) =>
          otherAdvocateLitigants?.some((item) => item?.individualId === targetItem?.individualId)
        );
      }

      return false;
    });

    return matchingRepresentatives;
  }

  const isOtherAdvocateSigned = useMemo(() => {
    // Find the litigant(s) that have a representative with current uuid
    const litigantsWithCurrentAdv = litigants?.filter((litigant) =>
      litigant?.representatives?.some((rep) => rep?.additionalDetails?.uuid === loggedInUserOnBehalfOfUuid)
    );

    // If there are no litigants with current uuid, return false
    if (!litigantsWithCurrentAdv?.length) return false;

    // Check if every such litigant has at least one signed representative
    return litigantsWithCurrentAdv?.every((litigant) => litigant?.representatives?.some((rep) => rep?.hasSigned));
  }, [litigants, loggedInUserOnBehalfOfUuid]);

  const handleCasePdf = () => {
    downloadPdf(tenantId, signatureDocumentId ? signatureDocumentId : DocumentFileStoreId);
  };

  const getPlaceholder = () => {
    let placeholder = "";

    if (isCurrentPersonPoaComplainant) {
      const litigant = litigants?.find((litigant) => litigant?.additionalDetails?.uuid === loggedInUserOnBehalfOfUuid);
      const poaHolder = poaHolders?.find((poa) => poa?.individualId === litigant?.individualId);
      const representedNames = poaHolder?.representingLitigants
        ?.map((rep) => rep?.additionalDetails?.fullName)
        ?.filter(Boolean)
        ?.join(", ");
      placeholder = `${litigant?.additionalDetails?.fullName} - Complainant ${litigant?.additionalDetails?.currentPosition}, PoA holder for ${representedNames}`;
    } else if (isCurrentPersonPoa) {
      const poaHolder = poaHolders?.find((poa) => poa?.additionalDetails?.uuid === loggedInUserOnBehalfOfUuid);
      const representedNames = poaHolder?.representingLitigants
        ?.map((rep) => rep?.additionalDetails?.fullName)
        ?.filter(Boolean)
        ?.join(", ");
      placeholder = `${poaHolder?.name} - PoA holder for ${representedNames}`;
    } else {
      if (isOwnerAdvocateSelf) {
        const advocate = caseDetails?.representatives?.find((advocate) => advocate?.additionalDetails?.uuid === loggedInUserOnBehalfOfUuid);
        const representingWithAllUnsigned = advocate?.representing?.find((rep) => {
          // match litigant using UUID
          const litigant = litigants?.find((lit) => lit?.additionalDetails?.uuid === rep?.additionalDetails?.uuid);

          // if no litigant → skip
          if (!litigant?.representatives?.length) return false;

          // check all representatives unsigned
          return litigant.representatives.every((r) => r?.hasSigned === false);
        });

        placeholder = `Advocate ${representingWithAllUnsigned?.additionalDetails?.currentPosition} Signature`;
        return placeholder; // Return placeholder directly for advocate filing case
      } else {
        const litigant = litigants?.find((litigant) => litigant?.additionalDetails?.uuid === loggedInUserOnBehalfOfUuid);
        placeholder = `${litigant?.additionalDetails?.fullName} - Complainant ${litigant?.additionalDetails?.currentPosition}`;
      }
    }

    return getUniqueAcronym(placeholder);
  };

  const handleCaseUnlockingWhenMockESign = async () => {
    await DRISTIService.setCaseUnlock({}, { uniqueId: caseDetails?.filingNumber, tenantId: tenantId });
    setEsignSuccess(true);
  };

  const handleEsignAction = async () => {
    setLoader(true);
    try {
      const caseLockStatus = await DRISTIService.getCaseLockStatus(
        {},
        {
          uniqueId: caseDetails?.filingNumber,
          tenantId: tenantId,
        }
      );
      if (caseLockStatus?.Lock?.isLocked) {
        toast.error(t("SOMEONEELSE_IS_ESIGNING_CURRENTLY"));
        setLoader(false);
        return;
      }

      await DRISTIService.setCaseLock({ Lock: { uniqueId: caseDetails?.filingNumber, tenantId: tenantId, lockType: "ESIGN" } }, {});

      setLoader(false);

      if (mockESignEnabled) {
        try {
          await handleCaseUnlockingWhenMockESign();
        } catch (error) {
          console.error("Error:", error);
          toast.error(t("SOMETHING_WENT_WRONG"));
        }
      } else {
        handleEsign(name, "ci", DocumentFileStoreId, getPlaceholder());
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(t("SOMETHING_WENT_WRONG"));
      setLoader(false);
    }
  };

  const handleUploadFile = () => {
    setDocumentUpload(true);
  };

  const isDelayCondonation = useMemo(() => {
    const dcaData = caseDetails?.caseDetails?.["delayApplications"]?.formdata[0]?.data;
    if (
      dcaData?.delayCondonationType?.code === "YES" ||
      (dcaData?.delayCondonationType?.code === "NO" && dcaData?.isDcaSkippedInEFiling?.code === "YES")
    ) {
      return false;
    }
    return true;
  }, [caseDetails]);

  const chequeDetails = useMemo(() => {
    const debtLiability = caseDetails?.caseDetails?.debtLiabilityDetails?.formdata?.[0]?.data;
    if (debtLiability?.liabilityType?.code === "PARTIAL_LIABILITY") {
      return {
        totalAmount: debtLiability?.totalAmount,
      };
    } else {
      const chequeData = caseDetails?.caseDetails?.chequeDetails?.formdata || [];
      const totalAmount = chequeData.reduce((sum, item) => {
        return sum + parseFloat(item.data.chequeAmount);
      }, 0);
      return {
        totalAmount: totalAmount.toString(),
      };
    }
  }, [caseDetails]);

  const { data: paymentTypeData, isLoading: isPaymentTypeLoading } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    "payment",
    [{ name: "paymentType" }],
    {
      select: (data) => {
        return data?.payment?.paymentType || [];
      },
    }
  );

  const callCreateDemandAndCalculation = async (caseDetails, tenantId, caseId) => {
    const suffix = getSuffixByBusinessCode(paymentTypeData, "case-default");

    const processCourierCalculationResponse = await DRISTIService.getSummonsPaymentBreakup(
      {
        Criteria: paymentCriteriaList,
      },
      {}
    );
    const calculationList = processCourierCalculationResponse?.Calculation || [];
    const allBreakdowns = calculationList?.flatMap((item) => item?.breakDown);

    const calculationResponse = await DRISTIService.getPaymentBreakup(
      {
        EFillingCalculationCriteria: [
          {
            checkAmount: chequeDetails?.totalAmount,
            numberOfApplication: 1,
            tenantId: tenantId,
            caseId: caseId,
            isDelayCondonation: isDelayCondonation,
            filingNumber: caseDetails?.filingNumber,
          },
        ],
      },
      {},
      "dristi",
      Boolean(chequeDetails?.totalAmount && chequeDetails.totalAmount !== "0")
    );
    const mergedBreakdowns = mergeBreakdowns(calculationResponse?.Calculation?.[0]?.breakDown || [], allBreakdowns || []);
    const totalAmount = mergedBreakdowns?.reduce((sum, item) => sum + item?.amount, 0);
    const updatedCalculation = (calculationResponse?.Calculation || [])?.map((calc) => ({
      ...calc,
      totalAmount,
      breakDown: mergedBreakdowns,
    }));

    await DRISTIService.etreasuryCreateDemand({
      tenantId,
      entityType: "case-default",
      filingNumber: caseDetails?.filingNumber,
      consumerCode: caseDetails?.filingNumber + `_${suffix}`,
      calculation: updatedCalculation,
    });

    return { Calculation: updatedCalculation };
  };

  const updateSignedDocInCaseDoc = () => {
    const tempDocList = structuredClone(caseDetails?.documents || []);
    const index = tempDocList.findIndex((doc) => doc?.documentType === "case.complaint.signed");
    const signedDoc = {
      documentType: "case.complaint.signed",
      fileStore: signatureDocumentId ? signatureDocumentId : DocumentFileStoreId,
      fileName: "case Complaint Signed Document",
    };
    if (index > -1) {
      tempDocList.splice(index, 1);
    }
    tempDocList.push(signedDoc);
    return tempDocList;
  };

  const handleSubmit = (state) => {
    if (isSelectedUploadDoc) {
      updateCase(state);
    } else {
      if (isLastPersonSigned && (state === "PENDING_PAYMENT" || state === "RE_PENDING_PAYMENT")) {
        history.replace(`${path}/e-filing-payment?caseId=${caseId}`, { state: { calculationResponse } });
      } else {
        history.replace(`/${window?.contextPath}/${userInfoType}/dristi/landing-page`);
      }
    }
  };

  const updateCase = async (state) => {
    updatedOnceRef.current = true;
    sessionStorage.removeItem("isTopbarMounted");
    setLoader(true);
    console.log("updatecase1");
    const caseDocList = updateSignedDocInCaseDoc();
    console.log("updatecase12");
    let tempDocList = [...caseDocList];
    const isSignedDocumentsPresent = tempDocList?.some((doc) => doc?.documentType === "case.complaint.signed");
    if (isSignedDocumentsPresent) tempDocList = tempDocList?.filter((doc) => doc?.documentType !== "case.complaint.unsigned");
    console.log("updatecase123");

    try {
      await DRISTIService.caseUpdateService(
        {
          cases: {
            ...caseDetails,
            additionalDetails: {
              ...caseDetails?.additionalDetails,
              signedCaseDocument: signatureDocumentId ? signatureDocumentId : DocumentFileStoreId,
            },
            documents: tempDocList,
            workflow: {
              ...caseDetails?.workflow,
              action: isSelectedUploadDoc ? complainantWorkflowACTION.UPLOAD_DOCUMENT : complainantWorkflowACTION.ESIGN,
              assignes: [],
            },
          },
          tenantId,
        },
        tenantId
      )
        .then(async (res) => {
          if ((isOwnerAdvocateSelf || isMemberOnBehalfOfOwnerAdvocate) && isSelectedUploadDoc) {
            await closePendingTask({
              status: state,
              assignee: loggedInUserOnBehalfOfUuid,
              closeUploadDoc: true,
            });
          }
          if (isSelectedEsign) {
            if (!isOwnerAdvocateSelf && !isMemberOnBehalfOfOwnerAdvocate) {
              await closePendingTask({
                status: state,
                assignee: loggedInUserOnBehalfOfUuid,
              });
            } else {
              const advocates = getOtherAdvocatesForClosing();
              const promises = advocates?.map(async (advocate) => {
                return closePendingTask({
                  status: state,
                  assignee: advocate?.additionalDetails?.uuid,
                });
              });
              await Promise.all(promises);
            }
          }
          if (res?.cases?.[0]?.status === "PENDING_PAYMENT" || res?.cases?.[0]?.status === "RE_PENDING_PAYMENT") {
            // Extract UUIDs of litigants and representatives if available
            const uuids = [
              ...(Array.isArray(caseDetails?.litigants)
                ? caseDetails?.litigants?.map((litigant) => ({
                    uuid: litigant?.additionalDetails?.uuid,
                  }))
                : []),
              ...(Array.isArray(caseDetails?.representatives)
                ? caseDetails?.representatives?.map((advocate) => ({
                    uuid: advocate?.additionalDetails?.uuid,
                  }))
                : []),
              ...(Array.isArray(caseDetails?.poaHolders)
                ? caseDetails?.poaHolders?.map((poaHolder) => ({
                    uuid: poaHolder?.additionalDetails?.uuid,
                  }))
                : []),
            ];
            await DRISTIService.customApiService(Urls.dristi.pendingTask, {
              pendingTask: {
                name: "Pending Payment",
                entityType: "case-default",
                referenceId: `MANUAL_${caseDetails?.filingNumber}`,
                status: "PENDING_PAYMENT",
                assignedTo: uuids,
                assignedRole: ["CASE_CREATOR"],
                cnrNumber: caseDetails?.cnrNumber,
                filingNumber: caseDetails?.filingNumber,
                caseId: caseDetails?.id,
                caseTitle: caseDetails?.caseTitle,
                isCompleted: false,
                stateSla: stateSla.PENDING_PAYMENT * dayInMillisecond + todayDate,
                additionalDetails: {},
                tenantId,
              },
            });
            let calculation = null;
            if (!res?.cases?.[0]?.additionalDetails?.lastSubmissionConsumerCode) {
              calculation = await callCreateDemandAndCalculation(caseDetails, tenantId, caseId);
            } else {
              const suffix = getSuffixByBusinessCode(paymentTypeData, "case-default");
              try {
                calculation = await DRISTIService.getTreasuryPaymentBreakup(
                  {
                    tenantId: tenantId,
                  },
                  { consumerCode: res?.cases?.[0]?.additionalDetails?.lastSubmissionConsumerCode },
                  "dristi",
                  Boolean(caseDetails?.filingNumber && suffix)
                );
                calculation = { Calculation: [calculation?.TreasuryHeadMapping?.calculation] };
              } catch (error) {
                console.error("Error fetching treasury payment breakup:", error);
              }
            }
            setCalculationResponse(calculation);
            setLoader(false);
            if (isSelectedUploadDoc) {
              history.replace(`${path}/e-filing-payment?caseId=${caseId}`, { state: { calculationResponse: calculation } });
            }
          } else {
            setLoader(false);
            if (isSelectedUploadDoc) {
              history.replace(`/${window?.contextPath}/${userInfoType}/dristi/landing-page`);
            }
          }
        })
        .catch((error) => {
          toast.error(t("SOMETHING_WENT_WRONG"));
          setEsignSuccess(false);
          throw error;
        });
    } catch (error) {
      console.error("Error:", error);
      toast.error(t("SOMETHING_WENT_WRONG"));
      setEsignSuccess(false);
      setLoader(false);
    }
  };

  const isSubmitEnabled = () => {
    return (
      [
        CaseWorkflowState?.PENDING_RE_SIGN,
        CaseWorkflowState.PENDING_RE_E_SIGN,
        CaseWorkflowState.PENDING_E_SIGN,
        CaseWorkflowState.PENDING_SIGN,
      ]?.includes(caseDetails?.status) &&
      (isEsignSuccess ||
        isCurrentAdvocateSigned ||
        isCurrentLitigantSigned ||
        isCurrentPoaSigned ||
        (![CaseWorkflowState?.PENDING_RE_SIGN, CaseWorkflowState.PENDING_SIGN]?.includes(caseDetails?.status) && isCurrentLitigantContainPoa) ||
        uploadDoc ||
        (isSelectedEsign && isMemberOnBehalfOfOwnerAdvocate)) && // If junior adv/clerk is on this screen.
      !Loading &&
      !isLoading
    );
  };

  console.log("caseDetails", caseDetails, isEsignSuccess, isLoading, updatedOnceRef.current);

  useEffect(() => {
    return () => {
      console.log("useeffect12345", updatedOnceRef.current);
      updatedOnceRef.current = false;
    };
  }, []);

  useEffect(() => {
    const esignCaseUpdate = async () => {
      const isTopbarMounted = sessionStorage.getItem("isTopbarMounted");
      console.log("useeffect1", isLoading, isEsignSuccess, caseDetails?.filingNumber, isTopbarMounted, updatedOnceRef.current);

      if (!isLoading && isEsignSuccess && caseDetails?.filingNumber && isTopbarMounted && !updatedOnceRef.current) {
        await updateCase(state).then(async () => {
          console.log("useeffect123", isLoading, isEsignSuccess, caseDetails?.filingNumber);
          await refetchCaseData();
          setEsignSuccess(false);
        });
      }
    };

    esignCaseUpdate();
    return () => {
      console.log("useeffect1234", updatedOnceRef.current);
    };
  }, [isEsignSuccess, caseDetails, isLoading]);

  useEffect(() => {
    if (!caseDetails?.filingNumber || isLoading) return;
    console.log("set-esign");
    const handleCaseUnlocking = async () => {
      await DRISTIService.setCaseUnlock({}, { uniqueId: caseDetails?.filingNumber, tenantId: tenantId });
    };

    const isSignSuccess = sessionStorage.getItem("isSignSuccess");
    const storedESignObj = sessionStorage.getItem("signStatus");
    const parsedESignObj = JSON.parse(storedESignObj);
    const esignProcess = sessionStorage.getItem("esignProcess");
    console.log("set-esign1", isSignSuccess);

    if (isSignSuccess) {
      console.log("set-esign12", isSignSuccess);

      const matchedSignStatus = parsedESignObj?.find((obj) => obj.name === name && obj.isSigned === true);
      console.log("set-esign123", isSignSuccess, matchedSignStatus);

      if (isSignSuccess === "success" && matchedSignStatus) {
        const fileStoreId = sessionStorage.getItem("fileStoreId");
        setSignatureDocumentId(fileStoreId);
        setEsignSuccess(true);
      }
    }
    if (esignProcess && caseDetails?.filingNumber) {
      handleCaseUnlocking();
    }

    setTimeout(() => {
      sessionStorage.removeItem("esignProcess");
      sessionStorage.removeItem("isSignSuccess");
      localStorage.removeItem("signStatus");
      sessionStorage.removeItem("fileStoreId");
    }, 3000);
  }, [caseDetails, tenantId, isLoading]);

  const isRightPannelEnable = () => {
    if (isOwnerAdvocateSelf || isMemberOnBehalfOfOwnerAdvocate) {
      return !(isCurrentAdvocateSigned || isOtherAdvocateSigned || isCurrentPoaSigned || isEsignSuccess || uploadDoc);
    }
    return !(isCurrentLitigantSigned || isCurrentPoaSigned || (isCurrentLitigantContainPoa && !isCurrentPersonPoa) || isEsignSuccess);
  };

  const clearStorage = () => {
    sessionStorage.removeItem("esignProcess");
    sessionStorage.removeItem("isSignSuccess");
    localStorage.removeItem("signStatus");
    sessionStorage.removeItem("fileStoreId");
  };

  if (isLoading || isCaseDataFetching) {
    return <Loader />;
  }

  return (
    <div style={styles.container}>
      {Loading && (
        <div
          style={{
            width: "100vw",
            height: "100vh",
            zIndex: "9999",
            position: "fixed",
            right: "0",
            display: "flex",
            top: "0",
            background: "rgb(234 234 245 / 50%)",
            alignItems: "center",
            justifyContent: "center",
          }}
          className="submit-loader"
        >
          <Loader />
        </div>
      )}
      <div style={styles.leftPanel}>
        <div style={styles.caseDetails}>
          <div style={styles.infoRow}>
            <InfoIcon />
            <span style={styles.infoText}>
              <b>{t("CS_YOU_ARE_FILING_A_CASE")}</b>
            </span>
          </div>
          <div>
            <p>
              {t("CS_UNDER")}{" "}
              <a href={caseType?.href} target="_blank" rel="noreferrer" style={{ color: "#3d3c3c" }}>{`S-${caseType.section}, ${caseType.act}`}</a>{" "}
              {t("CS_IN")}
              <span style={{ fontWeight: 700 }}>{` ${caseType.courtName}.`}</span>
            </p>
          </div>
        </div>

        <div style={styles.detailsSection}>
          <div style={styles.details}>
            <div>{t("COMPLAINT_SIGN")}:</div>
            {litigants?.map((litigant, index) => (
              <div key={index} style={{ ...styles.litigantDetails, marginTop: "5px", fontSize: "15px" }}>
                {litigant?.additionalDetails?.fullName}
                {litigant?.hasSigned ||
                litigant?.poaHolder?.hasSigned ||
                (litigant?.additionalDetails?.uuid === loggedInUserOnBehalfOfUuid && (isEsignSuccess || uploadDoc)) ? (
                  <span style={{ ...styles.signedLabel, alignItems: "right" }}>{t("SIGNED")}</span>
                ) : (
                  <span style={{ ...styles.unSignedLabel, alignItems: "right" }}>{t("PENDING")}</span>
                )}
              </div>
            ))}
          </div>
          {Array.isArray(caseDetails?.representatives) && caseDetails?.representatives?.length > 0 && (
            <div style={{ ...styles.details, marginTop: "15px" }}>
              <div>{t("ADVOCATE_SIGN")}:</div>
              {litigants?.map(
                (litigant) =>
                  litigant?.representatives?.length > 0 && (
                    <div style={{ ...styles.advocateDetails, marginTop: "5px", fontSize: "15px" }}>
                      {`${t("ADVOCATE_FOR")} ${litigant?.additionalDetails?.fullName}`}
                      {litigant?.representatives?.some((rep) => rep?.hasSigned) ||
                      litigant?.representatives?.some(
                        (rep) => rep?.additionalDetails?.uuid === litigant?.poaHolder?.additionalDetails?.uuid && litigant?.poaHolder?.hasSigned
                      ) ||
                      (litigant?.representatives?.some((rep) => rep?.additionalDetails?.uuid === loggedInUserOnBehalfOfUuid) &&
                        (isEsignSuccess || uploadDoc)) ? (
                        <span style={styles.signedLabel}>{t("SIGNED")}</span>
                      ) : (
                        <span style={styles.unSignedLabel}>{t("PENDING")}</span>
                      )}
                    </div>
                  )
              )}
            </div>
          )}
        </div>
      </div>
      <div style={styles.centerPanel}>
        <div style={styles.header}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={styles.title}>{t("SIGN_COMPLAINT")}</div>
            <button style={styles.downloadButton} onClick={handleCasePdf}>
              <span style={{ marginRight: "8px", display: "flex", alignItems: "center" }}>
                <FileDownloadIcon />
              </span>
              <span>{t("DOWNLOAD_PDF")}</span>
            </button>
          </div>
          <div style={styles.description}>{t("CS_REVIEW_CASE_FILE_SUBTEXT")}</div>
        </div>
        <div style={styles.docViewer}>
          {signatureDocumentId || DocumentFileStoreId ? (
            <DocViewerWrapper
              docWidth={"100vh"}
              docHeight={"70vh"}
              fileStoreId={signatureDocumentId ? signatureDocumentId : DocumentFileStoreId}
              tenantId={tenantId}
              docViewerCardClassName={"doc-card"}
              showDownloadOption={false}
            />
          ) : (
            <h2>{t("PREVIEW_DOC_NOT_AVAILABLE")}</h2>
          )}
        </div>
      </div>
      <div style={styles.rightPanel}>
        {isRightPannelEnable() && (
          <div style={styles.signaturePanel}>
            <div style={styles.signatureTitle}>{t("ADD_SIGNATURE")}</div>
            {isSelectedUploadDoc && isOwnerAdvocateSelf && (isEFilingEditAllowedMember || isCaseCorrectionAllowedMember) && (
              <p style={styles.signatureDescription}>{t("EITHER_ESIGN_UPLOAD")}</p>
            )}
            {isSelectedUploadDoc && isMemberOnBehalfOfOwnerAdvocate && (isEFilingEditAllowedMember || isCaseCorrectionAllowedMember) && (
              <p style={styles.signatureDescription}>{t("YOU_CAN_ONLY_UPLOAD_SIGNED_COPY")}</p>
            )}
            {isSelectedUploadDoc && !(isOwnerAdvocateSelf || isMemberOnBehalfOfOwnerAdvocate) && (
              <p style={styles.signatureDescription}>{t("ONLY_ADVOCATES_AND_ASSOCIATED_MEMBERS_CAN_UPLOAD_SIGNED_COPY")}</p>
            )}
            {isSelectedEsign && isMemberOnBehalfOfOwnerAdvocate && (
              <p style={styles.signatureDescription}>{t("YOU_ARE_NOT_AUTHORIZED_TO_DO_ESIGN")}</p>
            )}
            {isSelectedEsign && !isMemberOnBehalfOfOwnerAdvocate && (
              <button style={styles.esignButton} onClick={handleEsignAction}>
                {t("CS_ESIGN")}
              </button>
            )}

            {isSelectedUploadDoc && (
              <button
                style={{
                  ...styles.uploadButton,
                  opacity: isOwnerAdvocateSelf || isMemberOnBehalfOfOwnerAdvocate ? 1 : 0.5,
                  cursor: isOwnerAdvocateSelf || isMemberOnBehalfOfOwnerAdvocate ? "pointer" : "default",
                }}
                onClick={handleUploadFile}
                disabled={!(isOwnerAdvocateSelf || isMemberOnBehalfOfOwnerAdvocate)}
              >
                <FileUploadIcon />
                <span style={{ marginLeft: "8px" }}>{t("UPLOAD_SIGNED_PDF")}</span>
              </button>
            )}
          </div>
        )}
      </div>
      <ActionBar>
        <div style={styles.actionBar}>
          {(isEFilingEditAllowedMember || isCaseCorrectionAllowedMember) && ((isSelectedEsign && !isLastPersonSigned) || isSelectedUploadDoc) && (
            <Button
              label={t("EDIT_A_CASE")}
              variation={"secondary"}
              onButtonClick={() => {
                clearStorage();
                setEditCaseModal(true);
              }}
              style={{ boxShadow: "none", backgroundColor: "#fff", padding: "10px", width: "240px", marginRight: "20px" }}
              textStyles={{
                fontFamily: "Roboto",
                fontSize: "16px",
                fontWeight: 700,
                lineHeight: "18.75px",
                textAlign: "center",
                color: "#007E7E",
              }}
              isDisabled={Loading || isLoading}
            />
          )}
          <SubmitBar
            label={
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
                <span>{isSelectedUploadDoc || isLastPersonSigned ? t("CS_SUBMIT_CASE") : t("ESIGN_GO_TO_HOME")}</span>
                <RightArrow />
              </div>
            }
            onSubmit={() => {
              clearStorage();
              handleSubmit(state);
            }}
            style={styles.submitButton}
            disabled={!isSubmitEnabled()}
          />
        </div>
      </ActionBar>

      {isDocumentUpload && (
        <UploadSignatureModal
          t={t}
          key={name}
          name={name}
          setOpenUploadSignatureModal={setDocumentUpload}
          onSelect={onSelect}
          config={uploadModalConfig}
          formData={formData}
          showWarning={true}
          warningText={t("UPLOAD_SIGNED_DOC_WARNING")}
          onSubmit={onSubmit}
          fileUploadError={fileUploadError}
        />
      )}
      {isEditCaseModal && (
        <Modal
          headerBarMain={<Heading label={t("CS_CONFIRM_EDIT")} />}
          headerBarEnd={
            <CloseBtn
              onClick={() => {
                setEditCaseModal(false);
              }}
            />
          }
          actionSaveLabel={t("EDIT_CONFIRM")}
          actionCancelLabel={t("CS_EDIT_BACK")}
          actionCancelOnSubmit={() => {
            setEditCaseModal(false);
          }}
          style={{
            backgroundColor: "#007E7E",
          }}
          children={<div style={{ margin: "16px 0px" }}>{t("CS_CONFIRM_EDIT_TEXT")}</div>}
          actionSaveOnSubmit={() => {
            handleEditCase();
          }}
        ></Modal>
      )}
    </div>
  );
};

export default ComplainantSignature;
