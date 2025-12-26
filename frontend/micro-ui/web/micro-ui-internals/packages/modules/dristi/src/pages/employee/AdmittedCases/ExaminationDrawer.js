import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Dropdown, LabelFieldPair, CardLabel, Loader, Toast } from "@egovernments/digit-ui-react-components";
import { LeftArrow, CustomAddIcon, CustomDeleteIcon } from "../../../icons/svgIndex";
import Button from "../../../components/Button";
import isEmpty from "lodash/isEmpty";
import TranscriptComponent from "../../../../../hearings/src/pages/employee/Transcription";
import { Urls } from "../../../hooks";
import { getFilingType } from "../../../Utils";
import { constructFullName } from "@egovernments/digit-ui-module-orders/src/utils";
import { DRISTIService } from "../../../services";
import isEqual from "lodash/isEqual";
import WitnessDepositionSignatureModal from "./WitnessDepositionSignatureModal";
import useDownloadCasePdf from "../../../hooks/dristi/useDownloadCasePdf";
import WitnessDepositionESignLockModal from "./WitnessDepositionESignLockModal";
import AddWitnessMobileNumberModal from "./AddWitnessMobileNumberModal";
import SuccessBannerModal from "../../../../../submissions/src/components/SuccessBannerModal";
import ConfirmDepositionDeleteModal from "./ConfirmDepositionDeleteModal";
import useCaseDetailSearchService from "../../../hooks/dristi/useCaseDetailSearchService";
import SelectCustomFormatterTextArea from "../../../components/SelectCustomFormatterTextArea";
import { MultiSelectDropdownNew } from "../../../components/MultiSelectDropdownNew";
import PreviewPdfModal from "../../../../../submissions/src/components/PreviewPdfModal";

const defaultExaminationQuestionOptions = [
  { code: "Q1", title: "whereabouts", label: "Where were you on the night of the incident?" },
  { code: "Q2", title: "silence", label: "Are you sure you want to stay silent?" },
  { code: "Q3", title: "threat", label: "Did anyone threaten you to stay silent?" },
];

const formatAddress = (addr) => {
  if (!addr) return "";
  const { locality = "", city = "", district = "", state = "", pincode = "" } = addr;
  return `${locality}, ${city}, ${district}, ${state}, ${pincode}`.trim();
};

const formatAddressFromIndividualData = (addr) => {
  if (!addr) return "";
  const { addressLine1 = "", addressLine2 = "", buildingName = "", street = "", city = "", pincode = "" } = addr;
  return `${addressLine1}, ${addressLine2}, ${buildingName}, ${street}, ${city}, ${pincode}`.trim();
};

export const _getPdfConfigForExamination = (documentNumber, caseDetails, courtId, tenantId) => {
  return {
    id: documentNumber,
    cnrNumber: caseDetails?.cnrNumber,
    pdfMap: "digitisation-examination-of-accused",
    url: Urls.digitalization.examinationPreviewPdf,
    params: {
      tenantId,
      documentNumber: documentNumber,
      cnrNumber: caseDetails?.cnrNumber,
      qrCode: false,
      documentType: "digitisation-examination-of-accused",
      courtId: courtId,
    },
    enabled: !!documentNumber && !!caseDetails?.cnrNumber,
  };
};

const ExaminationDrawer = ({ isOpen, onClose, tenantId, documentNumber = null, caseId, courtId }) => {
  const { t } = useTranslation();
  const textAreaRef = useRef(null);
  const [options, setOptions] = useState([]);
  const [selectedAccused, setSelectedAccused] = useState({});
  const [examinationText, setExaminationText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProceeding, setIsProceeding] = useState(false);
  const [activeTabs, setActiveTabs] = useState([]);
  const [activeTabIndex, setActiveTabIndex] = useState(0); // set activetabindex based on new or already existing tab.
  const [currentDocument, setCurrentDocument] = useState(null);
  const [showErrorToast, setShowErrorToast] = useState(null);
  const [showAccusedExaminationReview, setShowAccusedExaminationReview] = useState(localStorage.getItem("showPdfPreview") || false);
  const [documentFileStoreId, setDocumentFileStoreId] = useState("");
  const [showSignatureModal, setShowsignatureModal] = useState(false);
  const [currentDocumentNumber, setCurrentDocumentNumber] = useState(documentNumber || localStorage.getItem("documentNumber") || null);
  const [examinationUploadLoader, setExaminationUploadLoader] = useState(false);
  const [showExaminationESign, setShowExaminationESign] = useState(false);
  const { downloadPdf } = useDownloadCasePdf();
  const [showAddAccusedMobileNumberModal, setShowAddAccusedMobileNumberModal] = useState(false);
  const [accusedMobileNumber, setAccusedMobileNumber] = useState("");
  const [examinationSignatureURL, setExaminationSignatureURL] = useState("");
  const [showUploadSignature, setShowUploadSignature] = useState(false);
  const [loader, setLoader] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmDeleteExaminationModal, setShowConfirmDeleteExaminationModal] = useState({ show: false, tab: {} });
  const [respondentsData, setRespondentsData] = useState([]);
  const [active, setActive] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState([]);

  const closeToast = () => {
    setShowErrorToast(null);
  };

  const formatText = (text) => {
    if (!text) return "";
    return text.replace(/\\n/g, "<wbr>").replace(/\n/g, "<wbr>");
  };

  useEffect(() => {
    if (showErrorToast) {
      const timer = setTimeout(() => {
        setShowErrorToast(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showErrorToast]);

  const { isLoading: examinationQuestionsDataLoading, data: examinationQuestionsData } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    "Examination-Of-Accused",
    [{ name: "Examination-Questions" }],
    {
      cacheTime: 0,
      select: (data) => {
        return data?.["Examination-Of-Accused"]?.["Examination-Questions"] || [];
      },
    }
  );

  const examinationQuestionOptions = useMemo(() => {
    return (
      examinationQuestionsData
        ?.map((item) => ({
          code: item?.code,
          title: item?.title,
          label: item?.label,
        }))
        ?.reverse() || []
    );
  }, [examinationQuestionsData]);

  const { data: apiCaseData, isLoading: caseApiLoading, refetch: refetchCaseData, isFetching: isCaseFetching } = useCaseDetailSearchService(
    {
      criteria: {
        caseId: caseId,
        ...(courtId && { courtId }),
      },
      tenantId,
    },
    {},
    `dristi-admitted-${caseId}`,
    caseId,
    Boolean(caseId)
  );

  const caseDetails = useMemo(() => apiCaseData?.cases || {}, [apiCaseData]);

  // Fetch mobile numbers for respondents when missing from local data
  useEffect(() => {
    const fetchRespondentData = async () => {
      const respondentsWithFetchedData = await Promise.all(
        caseDetails?.additionalDetails?.respondentDetails?.formdata?.map(async (userData) => {
          const fullName = constructFullName(
            userData?.data?.respondentFirstName,
            userData?.data?.respondentMiddleName,
            userData?.data?.respondentLastName
          );
          const uniqueId = userData?.uniqueId;
          let mobileNumber = [];
          let numberFromIndividual = null;
          const accusedIndividualId = userData?.data?.respondentVerification?.individualDetails?.individualId;
          const accusedUuid = caseDetails?.litigants?.find((lit) => lit?.individualId === accusedIndividualId)?.additionalDetails?.uuid;
          if (accusedIndividualId && tenantId) {
            try {
              const individualData = await window?.Digit.DRISTIService.searchIndividualUser(
                {
                  Individual: {
                    individualId: accusedIndividualId,
                  },
                },
                { tenantId, limit: 1000, offset: 0 }
              );
              // Use API data if local data is missing or append if new number found
              numberFromIndividual = individualData?.Individual?.[0]?.mobileNumber
                ? individualData?.Individual?.[0]?.mobileNumber
                : individualData?.Individual?.[0]?.userDetails?.username
                ? individualData?.Individual?.[0]?.userDetails?.username
                : "";
            } catch (error) {
              console.error("Error fetching respondent individual data:", error);
            }
          }
          if (numberFromIndividual) {
            mobileNumber = [numberFromIndividual];
          } else {
            mobileNumber = userData?.data?.phonenumbers?.mobileNumber || [];
          }
          return {
            name: `${fullName}`,
            uuid: accusedUuid,
            individualId: accusedIndividualId,
            uniqueId,
            mobileNumbers: mobileNumber?.length > 0 ? mobileNumber : [],
          };
        }) || []
      );
      setRespondentsData(respondentsWithFetchedData);
    };

    fetchRespondentData();
  }, [caseDetails, tenantId]);

  const { data: documentsData, isloading: isDocumentsDataLoading, refetch: documentsRefetch } = Digit.Hooks.submissions.useSearchDigitalization(
    {
      criteria: {
        caseId: caseDetails?.id,
        type: "EXAMINATION_OF_ACCUSED",
        tenantId,
        ...(caseDetails?.courtId && { courtId: caseDetails?.courtId }),
      },
      tenantId,
    },
    {},
    caseDetails?.filingNumber,
    Boolean(caseDetails?.filingNumber && caseDetails?.courtId)
  );

  const documentsList = useMemo(() => documentsData?.documents?.filter((document) => document?.status === "DRAFT_IN_PROGRESS") || [], [
    documentsData,
  ]);
  const { data: filingTypeData, isLoading: isFilingTypeLoading } = Digit.Hooks.dristi.useGetStatuteSection("common-masters", [
    { name: "FilingType" },
  ]);
  const filingType = useMemo(() => getFilingType(filingTypeData?.FilingType, "CaseFiling"), [filingTypeData?.FilingType]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const respondents = useMemo(() => respondentsData, [respondentsData]);
  const allParties = useMemo(() => [...respondents], [respondents]);

  // Create a new draft
  const createNewDraft = useCallback(
    async (documentsList = [], isrefetch = false) => {
      try {
        const newTab = {
          isNew: true,
          examinationOfAccusedDetails: {
            accusedName: "",
            accusedUniqueId: selectedAccused?.value,
            examinationDescription: "",
            accusedMobileNumber: "",
          },
        };
        // Add the new tab to the list and set it as active
        const updatedTabs = [...documentsList, newTab];
        setActiveTabs(updatedTabs);
        setActiveTabIndex(updatedTabs.length - 1);
        setCurrentDocumentNumber(null);
        setSelectedAccused({});
        setExaminationText(""); // Clear the text area for new draft
        isrefetch && documentsRefetch();
      } catch (error) {
        console.error("Error creating draft:", error);
      }
    },
    [selectedAccused, caseDetails, tenantId, activeTabs, setActiveTabs, setActiveTabIndex, setExaminationText]
  );

  useEffect(() => {
    const partiesOption =
      allParties?.map((party) => ({
        label: party?.name,
        value: party?.uniqueId, // map using uniqueId because accused might not have joined the case at this stage.
      })) || [];

    setOptions(partiesOption);
  }, [caseDetails, allParties, activeTabs.length]);

  useEffect(() => {
    if (!(currentDocumentNumber || localStorage.getItem("documentNumber"))) {
      createNewDraft([]);
    }
  }, []);

  // Process examination document list when data is loaded
  useEffect(() => {
    if (!isDocumentsDataLoading) {
      const documentWithunsaved = [...documentsList];
      const documentNumber = localStorage.getItem("documentNumber");
      const docNum = currentDocumentNumber || documentNumber;
      if (docNum) {
        const document = documentWithunsaved?.find((tab) => tab?.documentNumber === docNum);
        if (document) {
          const activeindex = documentWithunsaved?.findIndex((tab) => tab?.documentNumber === docNum);
          const selectedUniqueId = document?.examinationOfAccusedDetails?.accusedUniqueId;
          const matchingAccused = options.find((opt) => opt?.value === selectedUniqueId);
          setActiveTabs(documentWithunsaved); // basically we show only that particular tab when editing an examination(it will have corresponding document number)
          setActiveTabIndex(activeindex);
          setCurrentDocument(documentWithunsaved[activeindex]);
          setSelectedAccused({ label: matchingAccused?.label, value: matchingAccused?.value });
          setExaminationText(formatText(document?.examinationOfAccusedDetails?.examinationDescription) || "");
          return;
        }
      } else {
        const newTab = {
          isNew: true,
          examinationOfAccusedDetails: {
            accusedName: "",
            accusedUniqueId: selectedAccused?.value,
            examinationDescription: formatText(examinationText) || "",
            accusedMobileNumber: "",
          },
        };
        // Add the new tab to the list and set it as active
        const updatedTabs = [...documentsList, newTab];

        if (!isEqual(updatedTabs, activeTabs)) {
          setActiveTabs(updatedTabs);
          setActiveTabIndex(updatedTabs.length - 1);
          setExaminationText(""); // Clear the text area for new draft
          setSelectedAccused({});
        }
      }
    }
  }, [documentsList, options, documentNumber, currentDocumentNumber, isDocumentsDataLoading]);

  // Handle tab change
  const handleTabChange = async (tab) => {
    const currentDocument = activeTabs?.find((t) => t?.documentNumber === currentDocumentNumber);
    if (currentDocument?.documentNumber) {
      if (
        !isEqual(selectedAccused?.value, currentDocument?.examinationOfAccusedDetails?.accusedUniqueId) ||
        !isEqual(formatText(examinationText), formatText(currentDocument?.examinationOfAccusedDetails?.examinationDescription))
      ) {
        handleSaveDraft(false, tab?.documentNumber);
      }
      setCurrentDocumentNumber(tab?.documentNumber);
    } else if (activeTabs?.find((tab) => tab?.isNew && selectedAccused?.value)) {
      handleSaveDraft(false, currentDocumentNumber);
    }
    setCurrentDocumentNumber(tab?.documentNumber);
  };

  const handleDropdownChange = (selectedPartyOption) => {
    const selectedUniqueId = selectedPartyOption?.value;
    const matchingAccused = options.find((opt) => opt?.value === selectedUniqueId);
    setSelectedAccused({ label: matchingAccused?.label, value: matchingAccused?.value });
    // setExaminationText("");
  };

  const IsSelectedAccused = useMemo(() => {
    return !isEmpty(selectedAccused);
  }, [selectedAccused]);

  const caseCourtId = useMemo(() => caseDetails?.courtId, [caseDetails]);

  const handleSaveDraft = async (submit = false, newCurrentDocumentNumber = null, backAction = false) => {
    if (!selectedAccused?.value) {
      setShowErrorToast({ label: t("PLEASE_SELECT_ACCUSED_FIRST"), error: true });
      if (backAction) {
        onClose();
      }
      return;
    }

    const formattedText = formatText(examinationText);
    if (!formattedText.trim() && submit) {
      setShowErrorToast({ label: t("PLEASE_ENTER_EXAMINATION_DETAILS"), error: true });
      if (backAction) {
        onClose();
      }
      return;
    }

    try {
      setLoader(true);
      const party = allParties?.find((p) => p?.uniqueId === selectedAccused?.value);
      // Check if we need to create or update
      const documentNum = documentNumber || currentDocumentNumber;
      if (documentNum) {
        const document = activeTabs?.find((tab) => tab?.documentNumber === documentNum);
        if (
          !backAction ||
          (backAction &&
            (!isEqual(selectedAccused?.value, document?.examinationOfAccusedDetails?.accusedUniqueId) ||
              !isEqual(formatText(examinationText), formatText(document?.examinationOfAccusedDetails?.examinationDescription))))
        ) {
          // Update existing
          const reqBody = {
            digitalizedDocument: {
              ...document,
              examinationOfAccusedDetails: {
                accusedName: party?.name || "",
                accusedUniqueId: party?.uniqueId || "",
                examinationDescription: formatText(examinationText) || "",
                accusedMobileNumber: document?.examinationOfAccusedDetails?.accusedMobileNumber || "",
              },
              workflow: {
                action: "SAVE_DRAFT",
              },
            },
          };

          const newDocument = await DRISTIService.updateDigitizedDocument(reqBody);
          // Update the tab in activeTabs directly
          if (newDocument?.digitalizedDocument?.documentNumber) {
            const updatedTabs = [...activeTabs];
            if (newCurrentDocumentNumber) {
              setCurrentDocumentNumber(newCurrentDocumentNumber);
            } else {
              setCurrentDocumentNumber(newDocument?.digitalizedDocument?.documentNumber);
            }
            setActiveTabs(updatedTabs);
          }
          setShowErrorToast({ label: t("EXAMINATION_OF_ACCUSED_UPDATED_SUCCESSFULLY"), error: false });
        }
      } else {
        // Create new
        const reqBody = {
          digitalizedDocument: {
            courtId: caseCourtId,
            tenantId,
            type: "EXAMINATION_OF_ACCUSED",
            caseId: caseDetails?.id,
            caseFilingNumber: caseDetails?.filingNumber,
            examinationOfAccusedDetails: {
              accusedName: party?.name || "",
              accusedUniqueId: party?.uniqueId || "",
              examinationDescription: formatText(examinationText) || "",
              accusedMobileNumber: "",
            },
            workflow: {
              action: "SAVE_DRAFT",
            },
          },
        };
        const newDocument = await DRISTIService.createDigitizedDocument(reqBody);
        if (newDocument?.digitalizedDocument?.documentNumber) {
          const updatedTabs = [...activeTabs];
          if (activeTabs?.length > 0 && activeTabs?.[activeTabIndex]?.isNew) {
            updatedTabs[activeTabIndex] = newDocument?.digitalizedDocument;
          } else {
            updatedTabs.push(newDocument?.digitalizedDocument);
            setActiveTabIndex(updatedTabs.length - 1);
          }
          setActiveTabs(updatedTabs);
          if (newCurrentDocumentNumber) {
            setCurrentDocumentNumber(newCurrentDocumentNumber);
          } else {
            setCurrentDocumentNumber(newDocument.digitalizedDocument?.documentNumber);
            setCurrentDocument(newDocument.digitalizedDocument);
          }
        }

        setShowErrorToast({ label: t("EXAMINATION_OF_ACCUSED_CREATED_SUCCESSFULLY"), error: false });
      }

      // Also refresh to ensure server and client are in sync
      documentsRefetch();
      if (submit) {
        setShowAccusedExaminationReview(true);
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
    } finally {
      setLoader(false);
      if (backAction) {
        onClose();
      }
    }
  };

  const handleCloseExaminationDrawer = () => {
    handleSaveDraft(null, null, true);
  };

  const handleConfirmDeleteDeposition = async (selectedTab) => {
    try {
      if (!selectedTab?.documentNumber) {
        const deletedDocumentIndex = activeTabs?.length - 1;
        const updatedActiveTabs = activeTabs?.filter((tab) => tab?.documentNumber);
        setActiveTabs(updatedActiveTabs);
        const newCurrentDocument = updatedActiveTabs?.[deletedDocumentIndex - 1];
        if (newCurrentDocument?.documentNumber) {
          setCurrentDocument(newCurrentDocument);
          setCurrentDocumentNumber(newCurrentDocument?.documentNumber);
        } else {
          setCurrentDocumentNumber(null);
        }
        return;
      }

      // If the examination document has document number.
      const document = activeTabs?.find((tab) => tab?.documentNumber === selectedTab?.documentNumber);
      const deletedDocumentIndex = activeTabs?.findIndex((tab) => tab?.documentNumber === selectedTab?.documentNumber);
      if (document?.documentNumber) {
        // Update existing document
        setLoader(true);

        const reqBody = {
          digitalizedDocument: {
            ...document,
            workflow: {
              action: "DELETE_DRAFT",
            },
          },
        };

        const updatedDocument = await DRISTIService.updateDigitizedDocument(reqBody);
        setShowErrorToast({ label: t("EXAMINATION_OF_ACCUSED_DELETED_SUCCESSFULLY"), error: false });
        const updatedActiveTabs = activeTabs?.filter((tab) => tab?.documentNumber !== selectedTab?.documentNumber);
        setActiveTabs(updatedActiveTabs);
        if (deletedDocumentIndex === activeTabs?.length - 1) {
          const newCurrentDocument = updatedActiveTabs?.[deletedDocumentIndex - 1];
          if (newCurrentDocument?.documentNumber) {
            setCurrentDocument(newCurrentDocument);
            setCurrentDocumentNumber(newCurrentDocument?.documentNumber);
          } else {
            setCurrentDocumentNumber(null);
          }
        } else {
          const newCurrentDocument = updatedActiveTabs?.[deletedDocumentIndex];
          if (newCurrentDocument?.documentNumber) {
            setCurrentDocument(newCurrentDocument);
            setCurrentDocumentNumber(newCurrentDocument?.documentNumber);
          } else {
            setCurrentDocumentNumber(null);
            setActiveTabs(updatedActiveTabs);
          }
        }
        setShowConfirmDeleteExaminationModal({ show: false, tab: {} });
        documentsRefetch();
      }
    } catch (error) {
      console.error("Error while deleting examination of accused", error);
      setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
    } finally {
      setLoader(false);
    }
  };

  const handleAddNewDepositionDraft = async () => {
    if (!selectedAccused?.value) {
      setShowErrorToast({ label: t("PLEASE_SELECT_ACCUSED_FIRST"), error: true });
      return;
    }
    try {
      setLoader(true);
      const party = allParties?.find((p) => p?.uniqueId === selectedAccused?.value);
      // Check if we need to create or update document
      const documentNum = documentNumber || currentDocumentNumber;
      if (documentNum) {
        const currentActiveIndex = activeTabs?.findIndex((tab) => tab?.documentNumber === documentNum);
        const document = activeTabs?.find((tab) => tab?.documentNumber === documentNum);

        if (
          !isEqual(selectedAccused?.value, document?.examinationOfAccusedDetails?.accusedId) ||
          !isEqual(formatText(examinationText), formatText(document?.examinationOfAccusedDetails?.examinationDescription))
        ) {
          // Update existing document
          const reqBody = {
            digitalizedDocument: {
              ...document,
              examinationOfAccusedDetails: {
                accusedName: party?.name || "",
                accusedUniqueId: party?.uniqueId || "",
                examinationDescription: formatText(examinationText) || "",
                accusedMobileNumber: document?.examinationOfAccusedDetails?.accusedMobileNumber || "",
              },
              workflow: {
                action: "SAVE_DRAFT",
              },
            },
          };
          const newDocument = await DRISTIService.updateDigitizedDocument(reqBody);
          if (newDocument?.digitalizedDocument) {
            // Update the activeTabs array by replacing the updated document object
            const updatedTabs = [...activeTabs];
            if (currentActiveIndex !== -1) {
              updatedTabs[currentActiveIndex] = newDocument?.digitalizedDocument;
              setActiveTabs(updatedTabs);
              setCurrentDocument(newDocument?.digitalizedDocument);
              setShowErrorToast({ label: t("EXAMINATION_OF_ACCUSED_UPDATED_SUCCESSFULLY"), error: false });
              setCurrentDocumentNumber(null);
              createNewDraft(updatedTabs, true);
            }
          }
        } else {
          setCurrentDocumentNumber(null);
          createNewDraft(activeTabs, true);
        }
      } else {
        // Create new document
        const currentActiveIndex = activeTabs?.findIndex((tab) => !tab?.documentNumber);
        const reqBody = {
          digitalizedDocument: {
            courtId: caseCourtId,
            tenantId,
            type: "EXAMINATION_OF_ACCUSED",
            caseId: caseDetails?.id,
            caseFilingNumber: caseDetails?.filingNumber,
            examinationOfAccusedDetails: {
              accusedName: party?.name || "",
              accusedUniqueId: party?.uniqueId || "",
              examinationDescription: formatText(examinationText) || "",
              accusedMobileNumber: "",
            },
            workflow: {
              action: "SAVE_DRAFT",
            },
          },
        };
        const updatedDocument = await DRISTIService.createDigitizedDocument(reqBody);
        if (updatedDocument?.digitalizedDocument?.documentNumber) {
          // Update the activeTabs array by replacing the updated document object
          const updatedTabs = [...activeTabs];
          if (currentActiveIndex !== -1) {
            updatedTabs[currentActiveIndex] = updatedDocument.digitalizedDocument;
            setActiveTabs(updatedTabs);
            setCurrentDocument(updatedDocument.digitalizedDocument);
            setShowErrorToast({ label: t("EXAMINATION_OF_ACCUSED_UPDATED_SUCCESSFULLY"), error: false });
            setCurrentDocumentNumber(null);
            createNewDraft(updatedTabs, true);
          }
        }
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
    } finally {
      setLoader(false);
    }
  };

  const handleConfirmQuestions = (selectedQuestions) => {
    let newString = "";
    selectedQuestions.forEach((q) => {
      newString += `<p>Q: ${q.label}</p><p>A:&nbsp;</p><p> </p>`;
    });
    if (examinationText !== "") {
      newString = "<p> </p>" + newString;
    }
    setExaminationText((prev) => prev + newString);
    setActive(false);
  };

  const mobileNumber = useMemo(() => {
    const currentParty = allParties?.find((p) => p?.uniqueId === selectedAccused?.value);
    let accusedMobileNum = "";
    if (currentParty?.mobileNumbers?.length > 0) {
      accusedMobileNum = currentParty?.mobileNumbers?.[0];
    } else if (accusedMobileNumber) {
      accusedMobileNum = accusedMobileNumber;
    }
    return accusedMobileNum;
  }, [allParties, selectedAccused, accusedMobileNumber]);

  const updateExaminationDocument = async (fileStoreId = null, action, number) => {
    try {
      const documents = Array.isArray(currentDocument?.file) ? currentDocument.file : {};
      const party = allParties?.find((p) => p?.uniqueId === selectedAccused?.value);
      const documentsFile = fileStoreId
        ? [
            {
              fileStore: fileStoreId,
              documentType: action === "UPLOAD" ? "SIGNED" : "UNSIGNED",
              additionalDetails: { name: `${t("S351_EXAMINATION")} (${party?.name}).pdf` },
              tenantId,
            },
          ]
        : null;
      const document = activeTabs?.find((tab) => tab?.documentNumber === currentDocumentNumber);
      const reqBody = {
        digitalizedDocument: {
          ...document,
          documents: documentsFile ? documentsFile : documents,
          examinationOfAccusedDetails: {
            accusedName: party?.name || "",
            accusedUniqueId: party?.uniqueId || "",
            examinationDescription: formatText(examinationText) || "",
            accusedMobileNumber: number || document?.examinationOfAccusedDetails?.accusedMobileNumber || "",
          },
          workflow: {
            action,
            ...(action === "INITIATE_E-SIGN" && party?.uuid && { assignes: [party?.uuid] }), // uniqueId of accused, so that accused can receive the pending task
          },
        },
      };
      const updatedDocument = await DRISTIService.updateDigitizedDocument(reqBody);
      return updatedDocument;
    } catch (error) {
      console.error("error:", error);
      throw error;
    }
  };

  const handleESign = async (number = "") => {
    // TODO: call Api then close this modal and show next modal
    try {
      const updatedDocument = await updateExaminationDocument(documentFileStoreId, "INITIATE_E-SIGN", number);
      setExaminationSignatureURL(updatedDocument?.digitalizedDocument?.shortenedUrl);
      setShowAddAccusedMobileNumberModal(false);
      setShowsignatureModal(false);
      setShowExaminationESign(true);
      documentsRefetch();
      setCurrentDocumentNumber(null);
    } catch (error) {
      console.error("Error while updating bail bond:", error);
      setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
    } finally {
      setShowsignatureModal(false);
    }
  };

  const handleSubmitSignature = async (fileStoreId) => {
    // TODO: api call with fileStoreID then
    try {
      setLoader(false);
      const res = await updateExaminationDocument(fileStoreId, "UPLOAD");
      setShowsignatureModal(false);
      setShowUploadSignature(false);
      setShowSuccessModal(true);
      documentsRefetch();
      setCurrentDocumentNumber(null);
    } catch (error) {
      console.error("Error while updating bail bond:", error);
      setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
    } finally {
      setLoader(false);
      setShowsignatureModal(false);
      setShowUploadSignature(false);
      setExaminationText("");
    }
  };

  const handleCloseSignatureModal = () => {
    setShowsignatureModal(false);
    setShowAccusedExaminationReview(true);
  };

  const handleDownload = () => {
    downloadPdf(tenantId, documentFileStoreId);
  };

  if (isFilingTypeLoading || isDocumentsDataLoading || caseApiLoading || examinationQuestionsDataLoading) {
    return <Loader />;
  }
  const CONFIG_KEY = "examinationOfAccused";
  const FIELD_NAME = "comment";

  const formData = {
    [CONFIG_KEY]: {
      [FIELD_NAME]: examinationText,
    },
  };

  const onSelect = (key, value) => {
    if (key === CONFIG_KEY && value?.[FIELD_NAME] !== undefined) {
      setExaminationText(value[FIELD_NAME]);
    }
  };

  const isDisabled = isProceeding;

  const config = {
    key: CONFIG_KEY,
    disable: isDisabled,
    populators: {
      inputs: [
        {
          name: FIELD_NAME,
          rows: 10,
          isOptional: false,
          style: {
            width: "100%",
            minHeight: "40vh",
            fontSize: "large",
            opacity: isDisabled ? 0.5 : 1,
            pointerEvents: !IsSelectedAccused ? "unset !important" : "auto",
            backgroundColor: isDisabled ? "#f5f5f5" : "white",
            color: isDisabled ? "#666" : "black",
          },
        },
      ],
    },
    disableScrutinyHeader: true,
  };
  return (
    <React.Fragment>
      <style>
        {`
        .rdw-editor-wrapper{
          height: 375px;
          }
        `}
      </style>
      <div className="bottom-drawer-wrapper">
        {loader && (
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
        <div className="bottom-drawer-overlay" onClick={onClose} />
        <div className={`bottom-drawer ${isOpen ? "open" : ""}`}>
          <div className="drawer-header">
            <div className="header-content">
              <button className="drawer-close-button" onClick={handleCloseExaminationDrawer}>
                <LeftArrow color="#0b0c0c" />
              </button>
              <h2>{t("EXAMINATION_OF_ACCUSED_HEADER")}</h2>
            </div>
          </div>
          <div className="drawer-content">
            <div className="drawer-section">
              {/* Tabs UI for drafts*/}

              <div className="witness-tabs" style={{ display: "flex", marginTop: "16px", borderBottom: "1px solid #d6d5d4", overflowX: "auto" }}>
                {/* Display tabs for both examination list items and unsaved drafts */}
                {activeTabs?.map((tab, index) => (
                  <div
                    key={tab.documentNumber || `new-tab-${index}`}
                    className={`witness-tab ${activeTabIndex === index ? "active" : ""}`}
                    onClick={() => handleTabChange(tab)}
                    style={{
                      padding: "8px 16px",
                      marginRight: "8px",
                      cursor: "pointer",
                      fontSize: "16px",
                      backgroundColor: "transparent",
                      color: activeTabIndex === index ? "#0A5757" : "#6F767E",
                      borderBottom: activeTabIndex === index ? "3px solid #0A5757" : "none",
                      fontWeight: activeTabIndex === index ? "bold" : "normal",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                    }}
                  >
                    <span>
                      {tab?.isNew
                        ? `${t("CS_EXAMINATION")} (${t("UNSAVED")})`
                        : `${t("CS_EXAMINATION")} (${tab?.examinationOfAccusedDetails?.accusedName})`}
                    </span>
                    <span
                      style={{
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        marginLeft: "8px",
                      }}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent tab change when clicking delete
                        if (tab?.documentNumber) {
                          setShowConfirmDeleteExaminationModal({ show: true, tab: tab });
                        } else {
                          handleConfirmDeleteDeposition(tab);
                        }
                      }}
                    >
                      <CustomDeleteIcon />
                    </span>
                  </div>
                ))}
                {/* Add new tab button */}
                {
                  <div
                    className="witness-tab add-tab"
                    onClick={() => handleAddNewDepositionDraft()}
                    style={{
                      padding: "8px 18px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      fill: "#0B6265",
                    }}
                  >
                    <CustomAddIcon width="17" height="17" fill="#0A5757" />
                  </div>
                }
              </div>
              <div style={{ display: "flex", gap: "50px", margin: "16px 0px 0px" }}>
                <LabelFieldPair>
                  <CardLabel className="case-input-label">{t("ACCUSED_NAME")}</CardLabel>
                  <div style={{ width: "450px" }}>
                    <Dropdown
                      t={t}
                      option={options?.sort((a, b) => a?.label?.localeCompare(b?.label))}
                      optionKey={"label"}
                      select={handleDropdownChange}
                      freeze={true}
                      disable={isProceeding}
                      selected={selectedAccused}
                      placeholder={t("SELECT_HERE")}
                      style={{ width: "100%", height: "40px", fontSize: "16px", marginBottom: "0px" }}
                    />
                  </div>
                </LabelFieldPair>
                <LabelFieldPair>
                  <CardLabel className="case-input-label">{t("ADD_QUESTION")}</CardLabel>
                  <div style={{ width: "450px" }}>
                    <MultiSelectDropdownNew
                      t={t}
                      defaultLabel={t("SELECT_HERE")}
                      options={examinationQuestionOptions}
                      selected={selectedQuestions}
                      onConfirm={handleConfirmQuestions}
                      optionsKey="code"
                      displayKey="title"
                      active={active}
                      setActive={setActive}
                    />
                  </div>
                </LabelFieldPair>
              </div>
              <div style={{ marginTop: "16px" }}>{t("CS_EXAMINATION_DESCRIPTION")}</div>

              <div style={{ gap: "16px", border: "1px solid" }}>
                <SelectCustomFormatterTextArea t={t} config={config} formData={formData} onSelect={onSelect} errors={{}} />
                {IsSelectedAccused && (
                  <TranscriptComponent
                    setExaminationText={setExaminationText}
                    isRecording={isRecording}
                    setIsRecording={setIsRecording}
                    activeTab={"Witness Deposition"}
                  ></TranscriptComponent>
                )}
              </div>
              <div className="drawer-footer" style={{ display: "flex", justifyContent: "end", flexDirection: "row", gap: "16px" }}>
                <Button
                  label={t("SAVE_DRAFT")}
                  isDisabled={!IsSelectedAccused || isProceeding}
                  onButtonClick={() => handleSaveDraft()}
                  style={{
                    width: "130px",
                    backgroundColor: "#fff",
                    color: "#0B6265",
                    border: "1px solid #0B6265",
                    boxShadow: "none",
                  }}
                />
                <Button
                  label={t("SUBMIT_BUTTON")}
                  isDisabled={!IsSelectedAccused || isProceeding || examinationText?.length === 0}
                  className={"order-drawer-save-btn"}
                  onButtonClick={() => handleSaveDraft(true)}
                  style={{
                    width: "110px",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {showAccusedExaminationReview && (
          <PreviewPdfModal
            t={t}
            header={"REVIEW_EXAMINATION"}
            cancelLabel={"CS_COMMON_BACK"}
            saveLabel={"PROCEED_TO_SIGN"}
            handleBack={() => {
              setShowAccusedExaminationReview(false);
              localStorage.removeItem("documentNumber");
              localStorage.removeItem("showPdfPreview");
            }}
            setPreviewModal={setShowAccusedExaminationReview}
            pdfConfig={_getPdfConfigForExamination(currentDocumentNumber, caseDetails, courtId, tenantId)}
            setShowsignatureModal={setShowsignatureModal}
            setFileStoreId={setDocumentFileStoreId}
            callback={() => {
              localStorage.removeItem("documentNumber");
              localStorage.removeItem("showPdfPreview");
            }}
            documents={[]}
          />
        )}

        {showSignatureModal && (
          <WitnessDepositionSignatureModal
            t={t}
            handleCloseSignatureModal={handleCloseSignatureModal}
            handleDownload={handleDownload}
            handleESign={() => setShowAddAccusedMobileNumberModal(true)}
            setShowUploadSignature={setShowUploadSignature}
            showUploadSignature={showUploadSignature}
            handleSubmit={handleSubmitSignature}
            setLoader={setExaminationUploadLoader}
            loader={examinationUploadLoader}
            witnessDepositionFileStoreId={documentFileStoreId}
          />
        )}

        {showAddAccusedMobileNumberModal && (
          <AddWitnessMobileNumberModal
            t={t}
            handleClose={() => {
              setShowAddAccusedMobileNumberModal(false);
              setShowsignatureModal(true);
              setAccusedMobileNumber("");
            }}
            submit={(mobileNumber) => handleESign(mobileNumber)}
            witnesMobileNumber={mobileNumber}
            setWitnessMobileNumber={setAccusedMobileNumber}
            allParties={allParties}
            mainHeader={"EXAMINATION_OF_ACCUSED_MOBILE_NUMBER"}
            selectedPartyId={selectedAccused?.value}
          />
        )}

        {showExaminationESign && (
          <WitnessDepositionESignLockModal
            t={t}
            handleSaveOnSubmit={() => {
              setShowExaminationESign(false);
              documentsRefetch();
              onClose();
            }}
            url={examinationSignatureURL}
            header={"EXAMINATION_OF_ACCUSED_ESIGN_LOCK_BANNER_HEADER"}
          />
        )}

        {showConfirmDeleteExaminationModal?.show && (
          <ConfirmDepositionDeleteModal
            t={t}
            selectedAccused={selectedAccused}
            allParties={allParties}
            onCancel={() => setShowConfirmDeleteExaminationModal({ show: false, tab: {} })}
            onSubmit={() => handleConfirmDeleteDeposition(showConfirmDeleteExaminationModal?.tab)}
            name={showConfirmDeleteExaminationModal?.tab?.examinationOfAccusedDetails?.accusedName}
            saveLabel={"CS_CONFIRM_DELETE_EXAMNINATION"}
            mainHeader={"DELETE_EXAMINATION_OF_ACCUSED"}
            confirmMessage1={"ARE_YOU_SURE_YOU_WANT_TO_DELETE_EXAMINATION_OF_ACCUSED"}
            confirmMessage2={"PLEASE_CONFIRM_DELETE_EXAMINATION_OF_ACCUSED"}
          />
        )}
        {showSuccessModal && (
          <SuccessBannerModal
            t={t}
            handleCloseSuccessModal={() => {
              setShowSuccessModal(false);
              documentsRefetch();
              setCurrentDocument(null);
              setExaminationUploadLoader(false);
              onClose();
            }}
            message={"EXAMINATION_OF_ACCUSED_SUCCESS_BANNER_HEADER"}
          />
        )}

        {showErrorToast && <Toast error={showErrorToast?.error} label={showErrorToast?.label} isDleteBtn={true} onClose={closeToast} />}
      </div>
    </React.Fragment>
  );
};

export default ExaminationDrawer;
