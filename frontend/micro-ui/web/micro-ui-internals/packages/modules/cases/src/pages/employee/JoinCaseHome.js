import { Button, CloseSvg, Loader, Toast } from "@egovernments/digit-ui-react-components";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DRISTIService } from "../../../../dristi/src/services";
import { useTranslation } from "react-i18next";
import {
  createPendingTask,
  getFullName,
  getTaskDetails,
  registerIndividualWithNameAndMobileNumber,
  searchIndividualUserWithUuid,
  submitJoinCase,
} from "../../utils/joinCaseUtils";
import { Urls } from "@egovernments/digit-ui-module-dristi/src/hooks";
import SearchCaseAndShowDetails from "./joinCaseComponent/SearchCaseAndShowDetails";
import AccessCodeValidation from "./joinCaseComponent/AccessCodeValidation";
import useDownloadCasePdf from "@egovernments/digit-ui-module-dristi/src/hooks/dristi/useDownloadCasePdf";
import SelectParty from "./joinCaseComponent/SelectParty";
import JoinCasePayment from "./joinCaseComponent/JoinCasePayment";
import JoinCaseSuccess from "./joinCaseComponent/JoinCaseSuccess";
import LitigantVerification from "./joinCaseComponent/LitigantVerification";
import usePaymentProcess from "../../../../home/src/hooks/usePaymentProcess";
import POAInfo from "./joinCaseComponent/POAInfo";
import { cleanString, combineMultipleFiles, removeInvalidNameParts } from "@egovernments/digit-ui-module-dristi/src/Utils";
import { SubmissionWorkflowAction } from "@egovernments/digit-ui-module-orders/src/utils/submissionWorkflow";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";

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
    </div>
  );
};

const JoinHomeLocalisation = {
  ADVOCATE_OPT: "ADVOCATE_OPT",
  LITIGANT_OPT: "LITIGANT_OPT",
  COMPLAINANT_BRACK: "COMPLAINANT_BRACK",
  RESPONDENT_BRACK: "RESPONDENT_BRACK",
  CASE_NOT_ADMITTED_TEXT: "CASE_NOT_ADMITTED_TEXT",
  JOIN_CASE_BACK_TEXT: "JOIN_CASE_BACK_TEXT",
  INVALID_ACCESS_CODE_MESSAGE: "INVALID_ACCESS_CODE_MESSAGE",
  JOIN_CASE_SUCCESS: "JOIN_CASE_SUCCESS",
  APPLICATION_CREATION_FAILED: "APPLICATION_CREATION_FAILED",
};

const JoinCaseHome = ({ refreshInbox, setShowJoinCase, showJoinCase, type, data }) => {
  const { t } = useTranslation();
  const todayDate = new Date().getTime();

  const { downloadPdf } = useDownloadCasePdf();

  const Modal = window?.Digit?.ComponentRegistryService?.getComponent("Modal");
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const courtId = localStorage.getItem("courtId");

  const [show, setShow] = useState(false);

  const [step, setStep] = useState(0);
  const [caseNumber, setCaseNumber] = useState("");
  const [caseDetails, setCaseDetails] = useState({});
  const [barRegNumber, setBarRegNumber] = useState("");
  const [selectedParty, setSelectedParty] = useState({});
  const [roleOfNewAdvocate, setRoleOfNewAdvocate] = useState({ label: "", value: "" });
  const [parties, setParties] = useState([]);
  const [advocateDetailForm, setAdvocateDetailForm] = useState({});
  const [isSearchingCase, setIsSearchingCase] = useState(false);
  const [caseList, setCaseList] = useState([]);
  const [partyInPerson, setPartyInPerson] = useState({ label: "", value: "" });
  const [selectPartyData, setSelectPartyData] = useState({
    userType: { label: "", value: "" },
    partyInvolve: { label: "", value: "" },
    isReplaceAdvocate: { label: "", value: "" },
    isPoaRightsClaiming: { label: "", value: "" },
    advocateToReplaceList: [],
    approver: { label: "", value: "" },
    reasonForReplacement: "",
    affidavit: {},
  });
  const [successScreenData, setSuccessScreenData] = useState({
    complainantList: [],
    complainantAdvocateList: [],
    respondentList: [],
    respondentAdvocateList: [],
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [party, setParty] = useState({});
  const [validationCode, setValidationCode] = useState("");
  const [isDisabled, setIsDisabled] = useState(false);
  const [isApiCalled, setIsApiCalled] = useState(false);
  const [isPipApiCalled, setIsPipApiCalled] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [messageHeader, setMessageHeader] = useState(t(JoinHomeLocalisation.JOIN_CASE_SUCCESS));

  const [advocateId, setAdvocateId] = useState("");
  const [advocateData, setAdvocateData] = useState({});
  const [individual, setIndividual] = useState({});
  const [individualId, setIndividualId] = useState("");
  const [isSignedAdvocate, setIsSignedAdvocate] = useState(false);
  const [isSignedParty, setIsSignedParty] = useState(false);
  const [complainantList, setComplainantList] = useState([]);
  const [respondentList, setRespondentList] = useState([]);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [isAttendeeAdded, setIsAttendeeAdded] = useState(false);
  const [isLitigantJoined, setIsLitigantJoined] = useState(false);
  const [isAdvocateJoined, setIsAdvocateJoined] = useState(false);
  const [alreadyJoinedMobileNumber, setAlreadyJoinedMobileNumber] = useState([]);
  const [taskNumber, setTaskNumber] = useState("");
  const [bailBondRequired, setBailBondRequired] = useState(false);
  const [poa, setIsPoa] = useState(false);
  const [poaJoinedParties, setPoaJoinedParties] = useState([]);
  const [formdata, setFormData] = useState({});
  const history = useHistory();

  const [isVerified, setIsVerified] = useState(false);

  const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
  const userInfoType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo]);

  const closeToast = () => {
    setShowErrorToast(false);
    setIsAttendeeAdded(false);
  };

  useEffect(() => {
    if (type === "external") {
      setValidationCode(data?.caseDetails?.accessCode);
      setCaseDetails(data?.caseDetails);
      setStep(2);
      setShow(showJoinCase);
    }
  }, [data?.caseDetails, showJoinCase, type]);

  useEffect(() => {
    let timer;
    if (showErrorToast) {
      timer = setTimeout(() => {
        closeToast();
      }, 2000);
    }
    return () => clearTimeout(timer);
  }, [showErrorToast]);

  const { fetchBill, openPaymentPortal } = usePaymentProcess({ tenantId });

  const searchCase = useCallback(
    async (caseNumber) => {
      if (caseNumber && !caseDetails?.filingNumber) {
        try {
          const response = await DRISTIService.summaryCaseSearchService(
            {
              criteria: {
                filingNumber: caseNumber,
                ...(courtId && { courtId }),
                pagination: {
                  limit: 5,
                  offSet: 0,
                },
              },
              tenantId,
            },
            {}
          );
          setCaseList(response?.caseSummaries);
          if (response?.caseSummaries?.length === 0) {
            setErrors((errors) => ({
              ...errors,
              caseNumber: {
                type: "not-admitted",
                message: "NO_CASE_FOUND",
              },
            }));
          }
        } catch (error) {
          setErrors((errors) => ({
            ...errors,
            caseNumber: {
              type: "not-admitted",
              message: "NO_CASE_FOUND",
            },
          }));
          console.error("error :>> ", error);
        }
      }
      setIsSearchingCase(false);
    },
    [caseDetails?.filingNumber, tenantId, courtId]
  );

  const searchLitigantInRepresentives = useCallback((representatives, individualId) => {
    const representativesList = representatives?.filter((data) => data?.representing?.find((rep) => rep?.individualId === individualId));
    let representing;
    if (representativesList?.length > 0) representing = representativesList?.[0]?.representing?.find((rep) => rep?.individualId === individualId);

    if (representativesList && representing) {
      return { isFound: true, representatives: representativesList, representing: representing };
    } else return { isFound: false, representatives: undefined, representing: undefined };
  }, []);

  const searchAdvocateInRepresentives = useCallback(
    (advocateId) => {
      const representative = caseDetails?.representatives?.find((data) => data.advocateId === advocateId);
      if (representative) {
        return {
          isFound: true,
          representative: representative,
          partyType: representative?.representing?.[0]?.partyType.includes("complainant") ? "complainant" : "respondent",
        };
      } else
        return {
          isFound: false,
          representative: undefined,
          partyType: undefined,
        };
    },
    [caseDetails?.representatives]
  );

  const getUserUUID = useCallback(
    async (individualId) => {
      const individualData = await window?.Digit.DRISTIService.searchIndividualUser(
        {
          Individual: {
            individualId: individualId,
          },
        },
        { tenantId, limit: 1000, offset: 0 }
      );
      return individualData;
    },
    [tenantId]
  );

  useEffect(() => {
    if (step === 0 && caseNumber) {
      setErrors((errors) => ({
        ...errors,
        caseNumber: undefined,
      }));
      setIsDisabled(false);
    }
    if (step === 2) {
      if (
        selectPartyData?.userType &&
        selectPartyData?.userType?.value === "Litigant" &&
        selectPartyData?.partyInvolve?.value &&
        selectPartyData?.isPoaRightsClaiming?.value === "NO" &&
        party &&
        partyInPerson?.value &&
        ((partyInPerson?.value === "YES" && selectPartyData?.affidavit?.affidavitData) ||
          (partyInPerson?.value === "NO" && !Boolean(party?.individualId)))
      ) {
        setIsDisabled(false);
      } else if (
        selectPartyData?.userType &&
        selectPartyData?.userType?.value === "Litigant" &&
        selectPartyData?.partyInvolve?.value &&
        selectPartyData?.isPoaRightsClaiming?.value === "YES" &&
        party?.length > 0
      ) {
        setIsDisabled(false);
      } else if (
        selectPartyData?.userType &&
        selectPartyData?.userType?.value === "Advocate" &&
        selectPartyData?.partyInvolve?.value &&
        party?.length > 0 &&
        selectPartyData?.isReplaceAdvocate?.value &&
        ((selectPartyData?.isReplaceAdvocate?.value === "YES" &&
          selectPartyData?.advocateToReplaceList?.length > 0 &&
          selectPartyData?.approver?.label &&
          selectPartyData?.reasonForReplacement) ||
          selectPartyData?.isReplaceAdvocate?.value === "NO")
      ) {
        setIsDisabled(false);
      } else {
        setIsDisabled(true);
      }
    }

    if (step !== 5) {
      setSuccess(false);
    }
  }, [
    step,
    selectPartyData?.userType,
    selectedParty,
    roleOfNewAdvocate,
    caseNumber,
    barRegNumber,
    parties,
    advocateDetailForm,
    isSignedAdvocate,
    isSignedParty,
    searchAdvocateInRepresentives,
    advocateId,
    searchLitigantInRepresentives,
    party,
    partyInPerson,
    selectPartyData?.partyInvolve,
    selectPartyData?.affidavit,
    selectPartyData?.isReplaceAdvocate?.value,
    selectPartyData,
  ]);

  const fetchBasicUserInfo = useCallback(async () => {
    const individualData = await searchIndividualUserWithUuid(userInfo?.uuid, tenantId);

    setIndividualId(individualData?.Individual?.[0]?.individualId);
    setIndividual(individualData?.Individual?.[0]);

    const advocateResponse = await DRISTIService.searchIndividualAdvocate(
      {
        criteria: [
          {
            individualId: individualData?.Individual?.[0]?.individualId,
          },
        ],
        tenantId,
      },
      {}
    );

    if (advocateResponse?.advocates[0]?.responseList?.length > 0) {
      setBarRegNumber(advocateResponse?.advocates[0]?.responseList?.[0]?.barRegistrationNumber);
      setAdvocateId(advocateResponse?.advocates[0]?.responseList?.[0]?.id);
      setAdvocateData(advocateResponse?.advocates[0]?.responseList?.[0]);
      setSelectPartyData((selectPartyData) => ({
        ...selectPartyData,
        userType: { label: t(JoinHomeLocalisation.ADVOCATE_OPT), value: "Advocate" },
      }));
      setAdvocateDetailForm(advocateResponse?.advocates[0]?.responseList[0]);
    } else {
      setSelectPartyData((selectPartyData) => ({
        ...selectPartyData,
        userType: { label: t(JoinHomeLocalisation.LITIGANT_OPT), value: "Litigant" },
      }));
    }
  }, [t, tenantId, userInfo?.uuid]);

  useEffect(() => {
    if (show === true) {
      fetchBasicUserInfo();
    }
    setIsSearchingCase(false);
  }, [show, fetchBasicUserInfo]);

  const closeModal = useCallback(() => {
    setAlreadyJoinedMobileNumber([]);
    setSelectPartyData({
      userType: { label: "", value: "" },
      partyInvolve: { label: "", value: "" },
      isReplaceAdvocate: { label: "", value: "" },
      affidavit: {},
      isPoaRightsClaiming: { label: "", value: "" },
    });
    setPartyInPerson(false);
    setParty({});
    setIsDisabled(false);
    setCaseNumber("");
    setValidationCode("");
    setIsVerified(false);
    setCaseDetails({});
    setSelectedParty({});
    setRoleOfNewAdvocate("");
    setBarRegNumber("");
    setErrors({});
    setStep(0);
    setShow(false);
    if (setShowJoinCase) setShowJoinCase(false);
    setIsSignedAdvocate(false);
    setIsSignedParty(false);
    setAdvocateDetailForm({});
    setComplainantList([]);
    setRespondentList([]);
    setCaseList([]);
    setIsLitigantJoined(false);
    setSuccess(false);
    setIsPoa(false);
    setFormData({});
  }, [setShowJoinCase]);

  const onSelect = (option) => {
    if (["PENDING_RESPONSE", "ADMISSION_HEARING_SCHEDULED", "CASE_ADMITTED", "PENDING_ADMISSION"].includes(option?.status)) {
      setIsDisabled(false);
      setCaseDetails(option);

      setErrors({
        ...errors,
        caseNumber: undefined,
      });
    } else {
      setIsDisabled(true);
      setErrors({
        ...errors,
        caseNumber: {
          type: "not-admitted",
          message: JoinHomeLocalisation.CASE_NOT_ADMITTED_TEXT,
        },
      });
    }
  };

  const handleDownloadPDF = async () => {
    const caseId = caseDetails?.id;
    try {
      if (!caseId) {
        throw new Error("Case ID is not available.");
      }
      const response = await DRISTIService.downloadCaseBundle({ tenantId, caseId }, { tenantId });
      const fileStoreId = response?.fileStoreId?.toLowerCase();
      if (!fileStoreId || ["null", "undefined"].includes(fileStoreId)) {
        throw new Error("Invalid fileStoreId received in the response.");
      }
      downloadPdf(tenantId, response?.fileStoreId);
    } catch (error) {
      console.error("Error downloading PDF: ", error.message || error);
    }
  };

  const onDocumentUpload = async (fileData, filename, tenantId) => {
    if (fileData?.fileStore) return fileData;
    const fileUploadRes = await window?.Digit.UploadServices.Filestorage("DRISTI", fileData, tenantId);
    return { file: fileUploadRes?.data, fileType: fileData.type, filename };
  };

  const getComplainantListNew = (formdata) => {
    const complainantList = formdata?.map((data, index) => {
      const individualId = data?.data?.complainantVerification?.individualDetails?.individualId;

      const { representatives } = searchLitigantInRepresentives(caseDetails?.representatives, individualId);
      const isAdvocateRepresenting = representatives?.find((representative) => representative?.advocateId === advocateData?.id);
      if (isAdvocateRepresenting) {
        setIsAdvocateJoined(true);
        setSelectPartyData((selectPartyData) => ({
          ...selectPartyData,
          partyInvolve: {
            label: t("COMPLAINANTS_TEXT"),
            value: "COMPLAINANTS",
          },
        }));
      }

      const { firstName, middleName, lastName } = data?.data;

      const fullName = getFullName(" ", firstName, middleName, lastName);
      const complaintUuid = data?.data?.complainantVerification?.individualDetails?.userUuid;
      const poaAuthorizationDocument = complaintUuid === userInfo?.uuid ? data?.data?.poaAuthorizationDocument : null;
      const isAlreadyPoa = data?.data?.transferredPOA || { code: "NO", name: "NO", showPoaDetails: false };
      const poaVerification = data?.data?.poaVerification;

      return {
        ...data?.data,
        label: `${fullName} ${t(JoinHomeLocalisation.COMPLAINANT_BRACK)}`,
        fullName,
        partyType: index === 0 ? "complainant.primary" : "complainant.additional",
        isComplainant: true,
        individualId,
        uuid: data?.data?.complainantVerification?.individualDetails?.userUuid || "",
        firstName,
        middleName,
        lastName,
        phoneNumberVerification: {
          isUserVerified: true,
          mobileNumber: data?.data?.complainantVerification?.mobileNumber,
          individualDetails: {
            individualId: individualId,
            userUuid: data?.data?.complainantVerification?.individualDetails?.userUuid,
          },
        },
        isPoaAvailable: isAlreadyPoa,
        poaAuthorizationDocument: poaAuthorizationDocument,
        poaVerification,
        isAdvocateRepresenting: !!isAdvocateRepresenting,
        advocateRepresentingLength: representatives?.length || 0,
      };
    });

    setSuccessScreenData((successScreenData) => ({
      ...successScreenData,
      complainantList: complainantList?.map((complainant) => complainant?.fullName),
    }));
    setComplainantList(complainantList?.map((data) => data));
  };

  const getRespondentList = async (formdata) => {
    const respondentList = await Promise.all(
      formdata?.map(async (data, index) => {
        try {
          let response;
          let fullName = "";

          const individualId = data?.data?.respondentVerification?.individualDetails?.individualId;

          const { representatives } = searchLitigantInRepresentives(caseDetails?.representatives, individualId);
          const isAdvocateRepresenting = representatives?.find((representative) => representative?.advocateId === advocateData?.id);
          if (isAdvocateRepresenting) {
            setIsAdvocateJoined(true);
            setSelectPartyData((selectPartyData) => ({
              ...selectPartyData,
              partyInvolve: {
                label: t("RESPONDENTS_TEXT"),
                value: "RESPONDENTS",
              },
            }));
          }
          const isPip = caseDetails?.litigants?.find((litigant) => litigant?.individualId === individualId)?.isPartyInPerson;

          if (individualId) {
            response = await getUserUUID(individualId);
          }

          const { respondentFirstName, respondentMiddleName, respondentLastName } = data?.data;

          fullName = getFullName(" ", respondentFirstName, respondentMiddleName, respondentLastName);
          const respondentUUID = response?.Individual?.[0]?.userUuid || "";
          const poaAuthorizationDocument = respondentUUID === userInfo?.uuid ? data?.data?.poaAuthorizationDocument : null;
          const isAlreadyPoa = data?.data?.transferredPOA || { code: "NO", name: "NO", showPoaDetails: false };
          const poaVerification = data?.data?.poaVerification;

          return {
            ...data?.data,
            label: `${fullName} ${t(JoinHomeLocalisation.RESPONDENT_BRACK)}`,
            fullName,
            index,
            partyType: index === 0 ? "respondent.primary" : "respondent.additional",
            isRespondent: true,
            individualId,
            uuid: response?.Individual?.[0]?.userUuid || "",
            firstName: respondentFirstName,
            middleName: respondentMiddleName,
            lastName: respondentLastName,
            ...(individualId && {
              phoneNumberVerification: {
                isUserVerified: true,
                mobileNumber: response?.Individual?.[0]?.mobileNumber,
                individualDetails: {
                  individualId: individualId,
                  userUuid: response?.Individual?.[0]?.userUuid,
                },
              },
            }),
            isPoaAvailable: isAlreadyPoa,
            poaAuthorizationDocument: poaAuthorizationDocument,
            poaVerification,
            isAdvocateRepresenting: !!isAdvocateRepresenting,
            advocateRepresentingLength: representatives?.length || 0,
            uniqueId: data?.uniqueId,
            isPip,
          };
        } catch (error) {
          console.error(error);
        }
      })
    );
    setSuccessScreenData((successScreenData) => ({
      ...successScreenData,
      respondentList: respondentList?.map((respondent) => respondent?.fullName),
    }));
    setRespondentList(respondentList?.map((data) => data));
  };

  useEffect(() => {
    setParties([...complainantList, ...respondentList].map((data, index) => ({ ...data, key: index })));
  }, [complainantList, respondentList]);

  useEffect(() => {
    if (caseDetails?.caseCategory && selectPartyData?.userType?.value) {
      setSuccessScreenData((successScreenData) => ({
        ...successScreenData,
        complainantAdvocateList: caseDetails?.representatives
          ?.filter((represent) => represent?.representing?.[0]?.partyType?.includes("complainant"))
          ?.map((represent) => represent?.additionalDetails?.advocateName),
        respondentAdvocateList: caseDetails?.representatives
          ?.filter((represent) => represent?.representing?.[0]?.partyType?.includes("respondent"))
          ?.map((represent) => represent?.additionalDetails?.advocateName),
      }));
      getComplainantListNew(caseDetails?.additionalDetails?.complainantDetails?.formdata);
      getRespondentList(caseDetails?.additionalDetails?.respondentDetails?.formdata);
    }
  }, [caseDetails, t, selectPartyData?.userType?.value]);

  useEffect(() => {
    if (caseDetails?.cnrNumber && individual && selectPartyData?.userType && selectPartyData?.userType?.value === "Litigant") {
      const litigant = caseDetails?.litigants?.find((item) => item.individualId === individual?.individualId);
      if (litigant !== undefined) {
        setIsLitigantJoined(true);
        setSelectPartyData((selectPartyData) => ({
          ...selectPartyData,
          partyInvolve: {
            label: litigant?.partyType?.includes("respondent") ? t("RESPONDENTS_TEXT") : t("COMPLAINANTS_TEXT"),
            value: litigant?.partyType?.includes("respondent") ? "RESPONDENTS" : "COMPLAINANTS",
          },
        }));
        const { givenName, otherNames, familyName } = individual?.name;
        const fullName = getFullName(" ", givenName, otherNames, familyName);
        setParty({
          label: `${fullName} ${t(litigant?.partyType?.includes("respondent") ? "RESPONDENT_BRACK" : "COMPLAINANT_BRACK")}`,
          fullName: fullName,
          partyType: litigant?.partyType,
          isComplainant: !litigant?.partyType?.includes("respondent"),
          individualId: individual?.individualId,
          uuid: userInfo?.uuid,
        });
      }
    }
  }, [caseDetails, t, userInfo.name, userInfo?.uuid, selectPartyData?.userType, individual]);

  const registerLitigants = useCallback(
    async (data) => {
      const usersWithUUID = data
        .filter((item) => item?.phoneNumberVerification?.userDetails?.uuid)
        .map((item) => ({
          firstName: item?.firstName,
          middleName: item?.middleName,
          lastName: item?.lastName,
          username: item?.phoneNumberVerification?.userDetails?.userName,
          type: item?.phoneNumberVerification?.userDetails?.type,
          userUuid: item.phoneNumberVerification.userDetails.uuid,
          userId: item.phoneNumberVerification.userDetails.id,
          mobileNumber: item.phoneNumberVerification.userDetails.mobileNumber,
        }));

      if (usersWithUUID.length === 0) {
        return data?.map((item) => ({
          ...item,
          individualId: item?.phoneNumberVerification?.individualDetails?.individualId,
          uuid: item?.phoneNumberVerification?.individualDetails?.userUuid,
          fullName: getFullName(" ", item?.firstName, item?.middleName, item?.lastName),
        }));
      }

      try {
        const apiCalls = usersWithUUID.map((user) =>
          registerIndividualWithNameAndMobileNumber(user, tenantId).then((userData) => ({
            ...user,
            individualDetails: userData?.Individual,
          }))
        );

        const results = await Promise.all(apiCalls);

        const updatedData = data.map((item) => {
          const matchedUser = results.find((res) => res.userUuid === item.phoneNumberVerification?.userDetails?.uuid);
          return matchedUser
            ? {
                ...item,
                phoneNumberVerification: {
                  ...item.phoneNumberVerification,
                  individualDetails: matchedUser?.individualDetails,
                },
                individualId: matchedUser?.individualDetails?.individualId,
                uuid: matchedUser?.individualDetails?.userUuid,
                fullName: getFullName(" ", item?.firstName, item?.middleName, item?.lastName),
              }
            : {
                ...item,
                individualId: item?.phoneNumberVerification?.individualDetails?.individualId,
                uuid: item?.phoneNumberVerification?.individualDetails?.userUuid,
                fullName: getFullName(" ", item?.firstName, item?.middleName, item?.lastName),
              };
        });

        return updatedData;
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    },
    [tenantId]
  );

  const getRespondentDetails = (respondentDetails, updatedParty) => {
    let modifiedRespondentDetails = structuredClone(respondentDetails?.formdata)?.map((formdataItem, index) => {
      const matchedUser = updatedParty.find((res) => index === res?.index);
      return matchedUser
        ? {
            ...formdataItem,
            data: {
              ...formdataItem?.data,
              respondentFirstName: matchedUser?.firstName,
              respondentMiddleName: matchedUser?.middleName,
              respondentLastName: matchedUser?.lastName,
              respondentVerification: {
                individualDetails: {
                  individualId: matchedUser?.individualId,
                },
              },
            },
          }
        : formdataItem;
    });

    return {
      ...respondentDetails,
      formdata: modifiedRespondentDetails,
    };
  };

  const onPipConfirm = useCallback(async () => {
    setIsPipApiCalled(true);
    try {
      const affidavitUpload = await onDocumentUpload(
        selectPartyData?.affidavit?.affidavitData?.document?.[0],
        selectPartyData?.affidavit?.affidavitData?.document?.name,
        tenantId
      ).then((uploadedData) => ({
        document: [
          {
            documentType: uploadedData.fileType || document?.documentType,
            fileStore: uploadedData.file?.files?.[0]?.fileStoreId || document?.fileStore,
            documentName: `UPLOAD_PIP_AFFIDAVIT`,
            fileName: `UPLOAD_PIP_AFFIDAVIT`,
          },
        ],
      }));

      const litigantPipPayloadNew = {
        joinCaseData: {
          tenantId,
          accessCode: validationCode,
          filingNumber: caseDetails?.filingNumber,
          litigant: [
            {
              ...caseDetails?.litigants?.find((litigant) => litigant?.individualId === individual?.individualId),
              isPip: true,
              documents: [
                {
                  documentType: affidavitUpload?.document?.[0]?.documentType,
                  fileStore: affidavitUpload?.document?.[0]?.fileStore,
                  additionalDetails: { documentName: "UPLOAD_PIP_AFFIDAVIT" },
                },
              ],
            },
          ],
        },
      };
      const [res] = await submitJoinCase(litigantPipPayloadNew, {});

      if (res) {
        let advocateList = caseDetails?.representatives
          ?.filter((represent) => represent?.representing?.[0]?.partyType?.includes(party?.isComplainant ? "complainant" : "respondent"))
          ?.filter((representative) => {
            const filterData = representative?.representing?.filter((represent) => party?.individualId === represent?.individualId);

            if (filterData?.length === 1 && representative?.representing?.length === 1) return false;
            return true;
          });

        if (party.isComplainant) {
          setSuccessScreenData((successScreenData) => ({
            ...successScreenData,
            complainantAdvocateList: [...advocateList?.map((adv) => adv?.additionalDetails?.fullName)],
          }));
        } else {
          setSuccessScreenData((successScreenData) => ({
            ...successScreenData,
            respondentAdvocateList: [...advocateList?.map((adv) => adv?.additionalDetails?.fullName)],
          }));
        }

        const isResponseSubmitted = caseDetails?.litigants?.find((litigant) => litigant?.individualId === party?.individualId)?.isResponseSubmitted;

        if ("PENDING_RESPONSE" === caseDetails?.status && !party?.isComplainant && !isResponseSubmitted) {
          const poaHolders = (caseDetails?.poaHolders || [])
            ?.filter((poa) => poa?.representingLitigants?.some((represent) => represent?.individualId === individual?.individualId))
            ?.map((poaHolder) => ({ uuid: poaHolder?.additionalDetails?.uuid }));

          try {
            await DRISTIService.customApiService(Urls.dristi.pendingTask, {
              pendingTask: {
                name: `${t("PENDING_RESPONSE_FOR")} ${party?.fullName}`,
                entityType: "case-default",
                referenceId: `MANUAL_PENDING_RESPONSE_${caseDetails?.filingNumber}_${individual?.individualId}`,
                status: "PENDING_RESPONSE",
                assignedTo: [{ uuid: individual?.userUuid }, ...(poaHolders?.length > 0 ? poaHolders : [])],
                assignedRole: ["CASE_RESPONDER"],
                cnrNumber: caseDetails?.cnrNumber,
                filingNumber: caseDetails?.filingNumber,
                caseId: caseDetails?.id,
                caseTitle: caseDetails?.caseTitle,
                isCompleted: false,
                stateSla: todayDate + 20 * 24 * 60 * 60 * 1000,
                additionalDetails: {
                  individualId: individual?.individualId,
                  caseId: caseDetails?.id,
                  litigants: [individual?.individualId],
                },
                tenantId,
                courtId: caseDetails?.courtId,
              },
            });
          } catch (err) {
            console.error("err :>> ", err);
          }
        }
        setShowConfirmModal(false);
        setMessageHeader(t("YOU_ARE_NOW_PARTY_IN_PERSON"));
        setSuccess(true);
        setStep(step + 3);
      }
    } catch (error) {
      console.error("error :>> ", error);
    }
    setIsApiCalled(false);
    setIsPipApiCalled(false);
  }, [
    caseDetails?.caseTitle,
    caseDetails?.cnrNumber,
    caseDetails?.courtId,
    caseDetails?.filingNumber,
    caseDetails?.id,
    caseDetails?.litigants,
    caseDetails?.poaHolders,
    caseDetails?.representatives,
    caseDetails?.status,
    individual?.individualId,
    individual?.userUuid,
    party?.fullName,
    party?.individualId,
    party.isComplainant,
    selectPartyData?.affidavit?.affidavitData?.document,
    step,
    t,
    tenantId,
    todayDate,
    validationCode,
  ]);

  const onProceed = useCallback(
    async (litigants) => {
      if (step === 0) {
        if (caseDetails?.cnrNumber) {
          if (selectPartyData?.userType?.value === "Litigant") {
            const litigant = caseDetails?.litigants?.find((item) => item.individualId === individualId);

            if (litigant !== undefined) {
              setSelectedParty({ isRespondent: litigant?.partyType?.includes("respondent") });
            }
          }
          setIsDisabled(true);
          setStep(step + 1);
        } else {
          searchCase(caseNumber);
        }
      } else if (step === 1 && validationCode.length === 6) {
        if (!isVerified) {
          try {
            const [res] = await submitJoinCase(
              {
                code: {
                  filingNumber: caseDetails?.filingNumber,
                  tenantId: tenantId,
                  code: validationCode,
                },
              },
              "VERIFY"
            );
            if (res?.isValid === true) {
              setIsVerified(true);
            } else {
              setIsDisabled(true);
              setErrors({
                ...errors,
                validationCode: {
                  message: JoinHomeLocalisation.INVALID_ACCESS_CODE_MESSAGE,
                },
              });
            }
          } catch (error) {
            console.error("error :>> ", error);
          }
        } else {
          setStep(step + 1);
        }
      } else if (step === 2) {
        if (
          selectPartyData?.userType &&
          selectPartyData?.userType?.value === "Litigant" &&
          selectPartyData?.partyInvolve?.value &&
          selectPartyData?.isPoaRightsClaiming?.value === "NO" &&
          party &&
          partyInPerson?.value
        ) {
          setIsPoa(false);
          const { isFound } = searchLitigantInRepresentives(caseDetails?.representatives, individualId);
          if (isLitigantJoined && partyInPerson?.value === "NO") {
            setMessageHeader(t("ALREADY_PART_OF_CASE"));
            setSuccess(true);
            setStep(step + 3);
          } else if (isLitigantJoined && partyInPerson?.value === "YES" && !isFound) {
            setMessageHeader(t("YOU_ALREADY_PARTY_IN_PERSON"));
            setSuccess(true);
            setStep(step + 3);
          } else if (isLitigantJoined && partyInPerson?.value === "YES" && isFound) {
            setIsApiCalled(true);
            setShowConfirmModal(true);
          } else if (!isLitigantJoined && !Boolean(party?.individualId)) {
            setIsApiCalled(true);
            try {
              setMessageHeader(t("JOIN_CASE_SUCCESS"));
              const { givenName, otherNames, familyName } = individual?.name;

              let affidavitUpload;
              if (partyInPerson?.value === "YES") {
                affidavitUpload = await onDocumentUpload(
                  selectPartyData?.affidavit?.affidavitData?.document?.[0],
                  selectPartyData?.affidavit?.affidavitData?.document?.name,
                  tenantId
                ).then((uploadedData) => ({
                  document: [
                    {
                      documentType: uploadedData.fileType || document?.documentType,
                      fileStore: uploadedData.file?.files?.[0]?.fileStoreId || document?.fileStore,
                      documentName: `UPLOAD_PIP_AFFIDAVIT`,
                      fileName: `UPLOAD_PIP_AFFIDAVIT`,
                    },
                  ],
                }));
              }

              const litigantJoinPyaloadNew = {
                joinCaseData: {
                  tenantId,
                  accessCode: validationCode,
                  filingNumber: caseDetails?.filingNumber,
                  litigant: [
                    {
                      additionalDetails: {
                        fullName: getFullName(" ", givenName, otherNames, familyName),
                        uuid: userInfo?.uuid,
                      },
                      caseId: caseDetails?.id,
                      tenantId: tenantId,
                      individualId: individual?.individualId,
                      partyCategory: "INDIVIDUAL",
                      partyType: party?.partyType,
                      ...(partyInPerson?.value === "YES" && {
                        isPip: true,
                        documents: [
                          {
                            documentType: affidavitUpload?.document?.[0]?.documentType,
                            fileStore: affidavitUpload?.document?.[0]?.fileStore,
                            additionalDetails: { documentName: "UPLOAD_PIP_AFFIDAVIT" },
                          },
                        ],
                      }),
                      isResponseRequired: "PENDING_RESPONSE" === caseDetails?.status,
                      uniqueId: party?.uniqueId,
                    },
                  ],
                },
              };
              const [res] = await submitJoinCase(litigantJoinPyaloadNew, {});

              if (res) {
                setSuccessScreenData((successScreenData) => ({
                  ...successScreenData,
                  respondentList: caseDetails?.additionalDetails?.respondentDetails?.formdata?.map((respondent, index) => {
                    if (index === party?.index) {
                      return getFullName(" ", givenName, otherNames, familyName);
                    } else {
                      const { respondentFirstName, respondentMiddleName, respondentLastName } = respondent?.data;
                      return getFullName(" ", respondentFirstName, respondentMiddleName, respondentLastName);
                    }
                  }),
                }));

                if ("PENDING_RESPONSE" === caseDetails?.status && !party?.isComplainant) {
                  try {
                    await DRISTIService.customApiService(Urls.dristi.pendingTask, {
                      pendingTask: {
                        name: `${t("PENDING_RESPONSE_FOR")} ${getFullName(" ", givenName, otherNames, familyName)}`,
                        entityType: "case-default",
                        referenceId: `MANUAL_PENDING_RESPONSE_${caseDetails?.filingNumber}_${individual?.individualId}`,
                        status: "PENDING_RESPONSE",
                        assignedTo: [{ uuid: individual?.userUuid }],
                        assignedRole: ["CASE_RESPONDER"],
                        cnrNumber: caseDetails?.cnrNumber,
                        filingNumber: caseDetails?.filingNumber,
                        caseId: caseDetails?.id,
                        caseTitle: caseDetails?.caseTitle,
                        isCompleted: false,
                        stateSla: todayDate + 20 * 24 * 60 * 60 * 1000,
                        additionalDetails: { individualId: individual?.individualId, caseId: caseDetails?.id, litigants: [individual?.individualId] },
                        tenantId,
                        courtId: caseDetails?.courtId,
                      },
                    });
                  } catch (err) {
                    console.error("err :>> ", err);
                  }
                }
                setStep(step + 3);
                setSuccess(true);
              } else {
                setErrors({
                  ...errors,
                  validationCode: {
                    message: JoinHomeLocalisation.INVALID_ACCESS_CODE_MESSAGE,
                  },
                });
              }
            } catch (error) {
              console.error("error :>> ", error);
            }
            setIsApiCalled(false);
          }
        } else if (
          selectPartyData?.userType &&
          selectPartyData?.userType?.value === "Litigant" &&
          selectPartyData?.partyInvolve?.value &&
          selectPartyData?.isPoaRightsClaiming?.value === "YES" &&
          party
        ) {
          setIsPoa(true);
          setStep(step + 1);
        } else if (
          selectPartyData?.userType &&
          selectPartyData?.userType?.value === "Advocate" &&
          selectPartyData?.partyInvolve?.value &&
          party?.length > 0 &&
          selectPartyData?.isReplaceAdvocate?.value
        ) {
          setAlreadyJoinedMobileNumber([
            ...parties?.filter((party) => party?.phoneNumberVerification?.mobileNumber)?.map((party) => party?.phoneNumberVerification?.mobileNumber),
          ]);
          if (
            (selectPartyData?.isReplaceAdvocate?.value === "YES" && selectPartyData?.approver?.label && selectPartyData?.reasonForReplacement) ||
            selectPartyData?.isReplaceAdvocate?.value === "NO"
          ) {
            setIsDisabled(true);
            setStep(step + 1);
          }
        }
      } else if (step === 3 && !isDisabled) {
        setIsApiCalled(true);
        const party = litigants;
        const updatedParty = await registerLitigants(party);
        if (selectPartyData?.userType?.value === "Litigant") {
          try {
            const poaUpdatedData = await Promise.all(
              updatedParty?.map(async (user) => {
                const document = user?.poaAuthorizationDocument?.poaDocument;
                const hasFileTypeDoc = document?.some((doc) => doc instanceof File || (doc.file && doc.file instanceof File));
                let uploadedData = {};

                if (hasFileTypeDoc && document?.length > 1) {
                  const combineDocs = await combineMultipleFiles(document);
                  uploadedData = await onDocumentUpload(combineDocs[0], "poaAuthorization.pdf", tenantId);
                } else if (hasFileTypeDoc && document?.length > 0) {
                  uploadedData = await onDocumentUpload(document[0], "poaAuthorization.pdf", tenantId);
                }

                return {
                  ...user,
                  poaAuthorizationDocument: {
                    poaDocument: [
                      {
                        documentType: "POA_AUTHORIZATION_DOCUMENT",
                        fileStore: uploadedData?.file?.files?.[0]?.fileStoreId || document?.[0]?.fileStore || "",
                        additionalDetails: {
                          documentName: "poaAuthorization.pdf",
                          fileName: "Company documents",
                        },
                      },
                    ],
                  },
                };
              })
            );
            setPoaJoinedParties(poaUpdatedData);
            setStep(step + 3);
          } catch (error) {
            console.error("error :>> ", error);
          }
          setIsApiCalled(false);
        } else if (selectPartyData?.isReplaceAdvocate?.value === "NO" || selectPartyData?.isReplaceAdvocate?.value === "YES") {
          try {
            const litigantData = [
              ...updatedParty
                .filter((item1) => !caseDetails?.litigants.some((item2) => item1.individualId === item2.individualId))
                ?.map((user) => ({
                  additionalDetails: {
                    fullName: user?.fullName,
                    uuid: user?.uuid,
                  },
                  tenantId: tenantId,
                  individualId: user?.individualId,
                  partyCategory: "INDIVIDUAL",
                  partyType: user?.partyType,
                  isResponseRequired: "PENDING_RESPONSE" === caseDetails?.status,
                  uniqueId: user?.uniqueId,
                })),
            ];

            const { givenName, otherNames, familyName } = individual?.name;
            const documentToUploadApiCall = updatedParty?.map((user) => {
              if (user?.isVakalatnamaNew?.code === "YES") {
                return onDocumentUpload(user?.vakalatnama?.document?.[0], user?.vakalatnama?.document?.name, tenantId).then((uploadedData) => ({
                  ...user,
                  uploadedVakalatnama: {
                    documentType: uploadedData.fileType || document?.documentType,
                    fileStore: uploadedData.file?.files?.[0]?.fileStoreId || document?.fileStore,
                    fileName: "VAKALATNAMA",
                  },
                }));
              }
              return user;
            });

            const documentUploadResult = await Promise.all(documentToUploadApiCall);

            let affidavitUpload;
            if (selectPartyData?.affidavit?.affidavitData?.document?.[0]) {
              affidavitUpload = await onDocumentUpload(
                selectPartyData?.affidavit?.affidavitData?.document?.[0],
                selectPartyData?.affidavit?.affidavitData?.document?.name,
                tenantId
              ).then((uploadedData) => ({
                document: [
                  {
                    documentType: uploadedData.fileType || document?.documentType,
                    fileStore: uploadedData.file?.files?.[0]?.fileStoreId || document?.fileStore,
                    documentName: `NOC_JUDGE_ORDER`,
                    fileName: `NOC_JUDGE_ORDER`,
                  },
                ],
              }));
            }
            const respondentDetails = getRespondentDetails(caseDetails?.additionalDetails?.respondentDetails, updatedParty);

            const litigantAdvocateGroup = selectPartyData?.advocateToReplaceList?.reduce((acc, item) => {
              const { individualId } = item;
              if (!acc[individualId]) {
                acc[individualId] = [];
              }
              acc[individualId].push(item);
              return acc;
            }, {});
            const joinAdvocatePayloadNew = {
              joinCaseData: {
                accessCode: validationCode,
                tenantId: tenantId,
                filingNumber: caseDetails?.filingNumber,
                litigant: litigantData,
                representative: {
                  advocateId: advocateData?.id,
                  ...(selectPartyData?.isReplaceAdvocate?.value === "YES" && {
                    isReplacing: true,
                    isJudgeApproving: selectPartyData?.approver?.value === "JUDGE",
                    reason: selectPartyData?.reasonForReplacement,
                    reasonDocument: {
                      fileStore: affidavitUpload?.document?.[0]?.fileStore,
                    },
                  }),
                  representing: documentUploadResult?.map((item) => {
                    const { isFound } = searchLitigantInRepresentives(caseDetails?.representatives, item?.individualId);
                    return {
                      individualId: item?.individualId,
                      uniqueId: item?.uniqueId,
                      replaceAdvocates: (litigantAdvocateGroup?.[item?.individualId] || [])
                        ?.map((advocate) => advocate?.advocateId)
                        ?.filter((advocateId) => Boolean(advocateId))
                        ?.filter((advocateId) => advocateId !== advocateData?.id),
                      isAlreadyPip: !isFound,
                      isVakalathnamaAlreadyPresent: item?.isVakalatnamaNew?.code === "YES",
                      ...(item?.isVakalatnamaNew?.code === "YES" && {
                        noOfAdvocates: item?.noOfAdvocates,
                        documents: [
                          {
                            documentType: item?.uploadedVakalatnama?.documentType,
                            fileStore: item?.uploadedVakalatnama?.fileStore,
                            additionalDetails: { documentName: "VAKALATNAMA" },
                          },
                        ],
                      }),
                    };
                  }),
                },
              },
            };
            const [res] = await submitJoinCase(joinAdvocatePayloadNew);

            if (res) {
              setTaskNumber(res?.paymentTaskNumber);
              if (selectPartyData?.isReplaceAdvocate?.value === "NO") {
                if (documentUploadResult?.[0]?.isComplainant) {
                  setSuccessScreenData((successScreenData) => ({
                    ...successScreenData,
                    complainantAdvocateList: [
                      ...(successScreenData?.complainantAdvocateList || []),
                      ...(isAdvocateJoined ? [] : [getFullName(" ", givenName, otherNames, familyName)]),
                    ],
                  }));
                } else {
                  setSuccessScreenData((successScreenData) => ({
                    ...successScreenData,
                    respondentList: respondentDetails?.formdata?.map((respondent) => {
                      const { respondentFirstName, respondentMiddleName, respondentLastName } = respondent?.data;
                      return getFullName(" ", respondentFirstName, respondentMiddleName, respondentLastName);
                    }),
                    respondentAdvocateList: [...successScreenData?.respondentAdvocateList, getFullName(" ", givenName, otherNames, familyName)],
                  }));
                }

                // create/update pending task for submit response
                if ("PENDING_RESPONSE" === caseDetails?.status && documentUploadResult?.[0]?.isRespondent) {
                  const pendingResponseTaskCreate = updatedParty
                    ?.filter((user) => {
                      const litigant = caseDetails?.litigants?.find((litigant) => litigant?.individualId === user?.individualId);
                      if (!litigant) return true;

                      if (!litigant?.isResponseRequired) return false;

                      return !litigant?.documents?.some((document) => document?.additionalDetails?.fileType === "respondent-response");
                    })
                    ?.map((user) => {
                      const { isFound, representatives } = searchLitigantInRepresentives(caseDetails?.representatives, user?.individualId);

                      const poaHolders = (caseDetails?.poaHolders || [])
                        ?.filter((poa) => poa?.representingLitigants?.some((represent) => represent?.individualId === user?.individualId))
                        ?.map((poaHolder) => ({ uuid: poaHolder?.additionalDetails?.uuid }));

                      return DRISTIService.customApiService(Urls.dristi.pendingTask, {
                        pendingTask: {
                          name: `${t("PENDING_RESPONSE_FOR")} ${user?.fullName}`,
                          entityType: "case-default",
                          referenceId: `MANUAL_PENDING_RESPONSE_${caseDetails?.filingNumber}_${user?.individualId}`,
                          status: "PENDING_RESPONSE",
                          assignedTo: [
                            { uuid: user?.uuid },
                            ...(isFound ? representatives?.map((representative) => ({ uuid: representative?.additionalDetails?.uuid })) : []),
                            { uuid: individual?.userUuid },
                            ...(poaHolders?.length > 0 ? poaHolders : []),
                          ],
                          assignedRole: ["CASE_RESPONDER"],
                          cnrNumber: caseDetails?.cnrNumber,
                          filingNumber: caseDetails?.filingNumber,
                          caseId: caseDetails?.id,
                          caseTitle: caseDetails?.caseTitle,
                          isCompleted: false,
                          stateSla: todayDate + 20 * 24 * 60 * 60 * 1000,
                          additionalDetails: { individualId: user?.individualId, caseId: caseDetails?.id, litigants: [user?.individualId] },
                          tenantId,
                          courtId: caseDetails?.courtId,
                        },
                      });
                    });
                  try {
                    await Promise.all(pendingResponseTaskCreate);
                  } catch (err) {
                    console.error("err :>> ", err);
                  }
                }
              }
              if (res?.paymentTaskNumber) {
                setStep(step + 1);
              } else {
                setStep(step + 2);
              }
              setSuccess(true);
            } else {
              setErrors({
                ...errors,
                validationCode: {
                  message: JoinHomeLocalisation.INVALID_ACCESS_CODE_MESSAGE,
                },
              });
            }
          } catch (error) {
            console.error("error :>> ", error);
          }
        }
        setIsApiCalled(false);
      } else if (step === 4) {
        setIsApiCalled(true);
        try {
          const bill = await fetchBill(taskNumber + "_JOIN_CASE", tenantId, "task-payment");
          const paymentStatus = await openPaymentPortal(bill, bill?.Bill?.[0]?.totalAmount);
          if (paymentStatus) {
            setStep(step + 1);
            setSuccess(true);
          }
        } catch (error) {
          console.error("error", error);
        }
        setIsApiCalled(false);
      } else if (step === 6) {
        setIsApiCalled(true);
        try {
          const poaRepresenting = litigants?.map((party) => {
            return {
              uniqueId: party?.uniqueId,
              individualId: party?.individualId,
              isRevoking: party?.transferredPOA?.code === "YES" ? true : false,
              poaAuthDocument: party?.poaAuthorizationDocument?.poaDocument?.[0],
              existingPoaIndividualId: party?.poaVerification?.individualDetails?.individualId,
            };
          });

          const payload = {
            joinCaseData: {
              accessCode: validationCode,
              tenantId: tenantId,
              filingNumber: caseDetails?.filingNumber,
              litigant: [],
              poa: {
                individualId: individualId,
                poaRepresenting: poaRepresenting,
              },
            },
          };

          const [res] = await submitJoinCase(payload);

          if (res) {
            setTaskNumber(res?.paymentTaskNumber);
            const taskNumber = res?.paymentTaskNumber;
            const taskSearchResponse = await getTaskDetails(taskNumber, tenantId);
            const taskDetails = taskSearchResponse?.list?.[0]?.taskDetails;
            const ownerName = cleanString(userInfo?.name);

            const documents =
              taskDetails?.individualDetails?.map((res, index) => {
                const poaDoc = res?.poaAuthDocument || {};
                return {
                  documentType: poaDoc?.documentType,
                  fileStore: poaDoc?.fileStore,
                  documentName:poaDoc?.additionalDetails?.documentName,
                  additionalDetails: {
                    name: poaDoc?.additionalDetails?.documentName,
                  },
                };
              }) || [];

            const applicationReqBody = {
              tenantId,
              application: {
                tenantId,
                filingNumber: caseDetails?.filingNumber,
                cnrNumber: caseDetails?.cnrNumber,
                cmpNumber: caseDetails?.cmpNumber,
                caseId: caseDetails?.id,
                referenceId: null,
                createdDate: new Date().getTime(),
                applicationType: "APPLICATION_TO_CHANGE_POWER_OF_ATTORNEY_DETAILS",
                status: "",
                isActive: true,
                createdBy: userInfo?.uuid,
                statuteSection: { tenantId },
                additionalDetails: {
                  formdata: {
                    ...formdata,
                    submissionType: {
                      code: "APPLICATION",
                      name: "APPLICATION",
                    },
                    applicationType: {
                      type: "APPLICATION_TO_CHANGE_POWER_OF_ATTORNEY_DETAILS",
                      name: "APPLICATION_TYPE_APPLICATION_TO_CHANGE_POWER_OF_ATTORNEY_DETAILS",
                      isActive: true,
                    },
                  },
                  caseTitle: caseDetails?.caseTitle,
                  caseNumber:
                    (caseDetails?.isLPRCase ? caseDetails?.lprNumber : caseDetails?.courtCaseNumber) ||
                    caseDetails?.courtCaseNumber ||
                    caseDetails?.cmpNumber ||
                    caseDetails?.filingNumber,
                  partyType: selectPartyData?.partyInvolve?.value === "COMPLAINANTS" ? "COMPLAINANTS" : "ACCUSED",
                  owner: removeInvalidNameParts(ownerName),
                  onBehalOfName: removeInvalidNameParts(ownerName),
                },
                documents: [...documents],
                onBehalfOf: [userInfo?.uuid],
                comment: [],
                applicationDetails: {
                  taskNumber: taskNumber,
                  taskDetails: taskDetails,
                },
                workflow: {
                  id: "workflow123",
                  action: SubmissionWorkflowAction.SUBMIT,
                  status: "in_progress",
                  comments: "Workflow comments",
                  documents: [{}],
                },
              },
            };

            const resApplication = await DRISTIService.createApplication(applicationReqBody, { tenantId });
            if (resApplication) {
              await createPendingTask({
                name: t("ESIGN_THE_SUBMISSION_FOR_POA_CLAIM"),
                status: "ESIGN_THE_SUBMISSION",
                assignedRole: [],
                refId: resApplication?.application?.applicationNumber,
                entityType: "application-voluntary-submission",
                userInfo: userInfo,
                cnrNumber: caseDetails?.cnrNumber,
                filingNumber: caseDetails?.filingNumber,
                caseId: caseDetails?.id,
                caseTitle: caseDetails?.caseTitle,
                applicationType: "APPLICATION_TO_CHANGE_POWER_OF_ATTORNEY_DETAILS",
                stateSla: todayDate + 2 * 24 * 3600 * 1000,
                isCompleted: false,
                tenantId,
              });
              history.push(
                `/${window?.contextPath}/${userInfoType}/submissions/submissions-create?filingNumber=${caseDetails?.filingNumber}&applicationNumber=${resApplication?.application?.applicationNumber}&applicationType=APPLICATION_TO_CHANGE_POWER_OF_ATTORNEY_DETAILS`
              );
            } else {
              setErrors({
                ...errors,
                validationCode: {
                  message: JoinHomeLocalisation.APPLICATION_CREATION_FAILED,
                },
              });
            }
          } else {
            setErrors({
              ...errors,
              validationCode: {
                message: JoinHomeLocalisation.INVALID_ACCESS_CODE_MESSAGE,
              },
            });
          }
          // TODO : create application
        } catch (error) {
          console.error("error :>> ", error);
        }
        setIsApiCalled(false);
      }
    },
    [
      step,
      validationCode,
      isDisabled,
      caseDetails,
      selectPartyData?.userType,
      selectPartyData?.partyInvolve?.value,
      selectPartyData?.isReplaceAdvocate?.value,
      selectPartyData?.affidavit?.affidavitData?.document,
      selectPartyData?.approver?.label,
      selectPartyData?.approver?.value,
      selectPartyData?.reasonForReplacement,
      selectPartyData?.advocateToReplaceList,
      individualId,
      searchCase,
      caseNumber,
      isVerified,
      tenantId,
      errors,
      party,
      partyInPerson?.value,
      searchLitigantInRepresentives,
      isLitigantJoined,
      t,
      individual?.name,
      individual?.individualId,
      individual?.userUuid,
      userInfo?.uuid,
      todayDate,
      parties,
      registerLitigants,
      advocateData?.id,
      isAdvocateJoined,
      fetchBill,
      taskNumber,
      openPaymentPortal,
    ]
  );

  const searchApplications = useCallback(
    async (uuid) => {
      try {
        const response = await DRISTIService.searchSubmissions({
          criteria: {
            filingNumber: caseDetails?.filingNumber,
            tenantId,
            courtId: caseDetails?.courtId,
            applicationType: "REQUEST_FOR_BAIL",
            onBehalfOf: [uuid],
          },
        });

        return response?.applicationList?.length > 0;
      } catch (error) {
        console.error("Error searching applications:", error);
        return false;
      }
    },
    [caseDetails?.courtId, caseDetails?.filingNumber, tenantId]
  );

  useEffect(() => {
    const checkBailBondRequirement = async () => {
      try {
        let isBondRequired = true;

        if (selectPartyData?.userType?.value === "Advocate" && selectPartyData?.isReplaceAdvocate?.value === "NO") {
          const representedPersonUuids = party?.map((item) => item?.uuid).filter(Boolean);

          if (representedPersonUuids?.length > 0) {
            const applicationChecks = await Promise.all(representedPersonUuids.map((uuid) => searchApplications(uuid)));

            const hasExistingApplication = applicationChecks.some((exists) => exists);
            isBondRequired = !hasExistingApplication;
          }
        } else if (selectPartyData?.userType?.value === "Litigant" && partyInPerson?.value === "YES") {
          const litigantUuid = individual?.userUuid;
          if (litigantUuid) {
            const hasExistingApplication = await searchApplications(litigantUuid);
            isBondRequired = !hasExistingApplication;
          }
        }

        setBailBondRequired(isBondRequired);
      } catch (error) {
        console.error("Error in checkBailBondRequirement:", error);
        setBailBondRequired(true);
      }
    };

    // Only run the check if we have the necessary data
    if (
      (selectPartyData?.userType?.value === "Advocate" && selectPartyData?.isReplaceAdvocate?.value === "NO" && party?.length > 0) ||
      (selectPartyData?.userType?.value === "Litigant" && partyInPerson?.value === "YES" && individual?.userUuid)
    ) {
      checkBailBondRequirement();
    }
  }, [selectPartyData, party, individual, partyInPerson, searchApplications]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter") {
        if (!isDisabled && !(step === 2 || step === 3)) onProceed();
        if (step === 0 && isSearchingCase) searchCase(caseNumber);
      }
    },
    [isDisabled, onProceed, step, isSearchingCase, caseNumber]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  if (type === "external" && !showJoinCase) return <React.Fragment></React.Fragment>;

  const modalItem = [
    // 0
    {
      modalMain: (
        <SearchCaseAndShowDetails
          t={t}
          caseNumber={caseNumber}
          setCaseNumber={setCaseNumber}
          caseList={caseList}
          setCaseList={setCaseList}
          setIsSearchingCase={setIsSearchingCase}
          errors={errors}
          caseDetails={caseDetails}
          onSelect={onSelect}
          setCaseDetails={setCaseDetails}
          complainantList={complainantList}
          respondentList={respondentList}
          successScreenData={successScreenData}
        />
      ),
    },
    // 1
    {
      modalMain: (
        <AccessCodeValidation
          caseDetails={caseDetails}
          validationCode={validationCode}
          setValidationCode={setValidationCode}
          setIsDisabled={setIsDisabled}
          errors={errors}
          setErrors={setErrors}
          setIsVerified={setIsVerified}
        />
      ),
    },
    // 2
    {
      modalMain: (
        <SelectParty
          selectPartyData={selectPartyData}
          setSelectPartyData={setSelectPartyData}
          caseDetails={caseDetails}
          party={party}
          setParty={setParty}
          parties={parties}
          partyInPerson={partyInPerson}
          setPartyInPerson={setPartyInPerson}
          isLitigantJoined={isLitigantJoined}
          isAdvocateJoined={isAdvocateJoined}
          searchLitigantInRepresentives={searchLitigantInRepresentives}
          advocateId={advocateData?.id}
        />
      ),
    },
    // 3
    {
      modalMain: (
        <LitigantVerification
          t={t}
          label={"Verify Litigant Details"}
          closeModal={closeModal}
          party={party}
          setParty={setParty}
          goBack={() => setStep(step - 1)}
          onProceed={onProceed}
          alreadyJoinedMobileNumber={alreadyJoinedMobileNumber}
          setAlreadyJoinedMobileNumber={setAlreadyJoinedMobileNumber}
          isDisabled={isDisabled}
          setIsDisabled={setIsDisabled}
          selectPartyData={selectPartyData}
          isApiCalled={isApiCalled}
          poa={poa}
          userInfo={userInfo}
        />
      ),
    },
    // 4
    {
      modalMain: <JoinCasePayment type="join-case-flow" taskNumber={taskNumber} />,
    },
    // 5
    {
      modalMain: (
        <JoinCaseSuccess
          success={success}
          messageHeader={selectPartyData?.isReplaceAdvocate?.value === "YES" ? t("REPLACE_ADVOCATE_SUCCESS_MESSAGE") : messageHeader}
          caseDetails={caseDetails}
          closeModal={closeModal}
          refreshInbox={refreshInbox}
          successScreenData={successScreenData}
          isCaseViewDisabled={selectPartyData?.isReplaceAdvocate?.value === "YES" && !isAdvocateJoined}
          type={type}
          isBailBondRequired={bailBondRequired}
        />
      ),
    },
    // 6
    {
      modalMain: (
        <POAInfo
          t={t}
          poaJoinedParties={poaJoinedParties}
          onProceed={onProceed}
          closeModal={closeModal}
          label={"Poa Joining"}
          isApiCalled={isApiCalled}
          isDisabled={isDisabled}
          setIsDisabled={setIsDisabled}
          goBack={() => {
            setFormData({});
            setStep(step - 3);
          }}
          setFormData={setFormData}
          formdata={formdata}
        />
      ),
    },
  ];

  const getCaseHeaderLabel = (step, type, t) => {
    const stepLabels = {
      3: "VERIFY_LITIGANT_DETAILS",
      4: "PAY_TO_JOIN_CASE",
    };

    if (stepLabels[step]) {
      return t(stepLabels[step]);
    }

    if (type === "external") {
      return t("CS_CASE_MANAGE_CASE_ACCESS");
    }

    return t("SEARCH_NEW_CASE");
  };

  return (
    <div>
      {type !== "external" && (
        <Button
          variation={"secondary"}
          className={"secondary-button-selector"}
          label={t("SEARCH_NEW_CASE")}
          labelClassName={"secondary-label-selector"}
          onButtonClick={() => setShow(true)}
        />
      )}

      {show && (
        <Modal
          headerBarEnd={<CloseBtn onClick={closeModal} />}
          actionCancelLabel={
            step === 1
              ? t("DOWNLOAD_CASE_FILE")
              : (step === 2 && type === "external") || step === 3 || step === 4 || step === 6
              ? undefined
              : ((step === 0 && caseDetails?.cnrNumber) || step !== 0) && t(JoinHomeLocalisation.JOIN_CASE_BACK_TEXT)
          }
          actionCustomLabel={step === 1 ? t(JoinHomeLocalisation.JOIN_CASE_BACK_TEXT) : ""}
          actionCancelOnSubmit={() => {
            if (step === 0 && caseDetails?.cnrNumber) {
              setCaseDetails({});
            } else if (step === 1) {
              handleDownloadPDF();
            } else if (step === 2) {
              setValidationCode("");
              setIsVerified(false);
              setIsDisabled(true);
              if (selectPartyData?.userType?.value === "Litigant") {
                if (!isLitigantJoined) {
                  setSelectPartyData((selectPartyData) => ({
                    ...selectPartyData,
                    partyInvolve: {},
                    isPoaRightsClaiming: {},
                    affidavit: {},
                  }));
                  setPartyInPerson({});
                  setParty({});
                } else {
                  setSelectPartyData((selectPartyData) => ({
                    ...selectPartyData,
                    affidavit: {},
                  }));
                  setPartyInPerson({});
                }
              } else {
                if (!isAdvocateJoined) {
                  setSelectPartyData((selectPartyData) => ({
                    ...selectPartyData,
                    partyInvolve: {},
                    isReplaceAdvocate: {},
                    affidavit: {},
                    approver: {},
                    reasonForReplacement: "",
                    advocateToReplaceList: [],
                  }));
                  setParty([]);
                } else {
                  setSelectPartyData((selectPartyData) => ({
                    ...selectPartyData,
                    isReplaceAdvocate: {},
                    affidavit: {},
                    approver: {},
                    reasonForReplacement: "",
                    advocateToReplaceList: [],
                  }));
                  setParty([]);
                }
              }
              setStep(step - 1);
            } else setStep(step - 1);
            if (step !== 2) setIsDisabled(false);
          }}
          actionCustomLabelSubmit={() => {
            if (step === 1) {
              setStep(step - 1);
              setIsDisabled(false);
              setValidationCode("");
              setErrors({
                ...errors,
                validationCode: undefined,
              });
            }
          }}
          actionSaveLabel={
            step === 4
              ? t("CS_PAY_ONLINE")
              : step === 0 && !caseDetails.filingNumber
              ? t("ES_COMMON_SEARCH")
              : step === 1
              ? !isVerified
                ? t("CS_VERIFY")
                : t("JOIN_A_CASE")
              : t("PROCEED_TEXT")
          }
          actionSaveOnSubmit={onProceed}
          formId="modal-action"
          headerBarMain={<Heading label={getCaseHeaderLabel(step, type, t)} />}
          className={`join-a-case-modal${success ? " case-join-success" : ""}${step === 4 ? " join-case-modal-payment" : ""}`}
          isDisabled={isDisabled || isApiCalled}
          isBackButtonDisabled={step === 1 && !isVerified}
          popupStyles={{ width: "fit-content", userSelect: "none" }}
          customActionStyle={{ background: "#fff", boxShadow: "none", border: "1px solid #007e7e" }}
          customActionTextStyle={{ color: "#007e7e" }}
          hideModalActionbar={step === 3 || step === 6 ? true : false}
          popupModuleMianClassName={success ? "success-main" : ""}
        >
          {isApiCalled && (
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
          {step >= 0 && modalItem[step]?.modalMain}
        </Modal>
      )}
      {showErrorToast && (
        <Toast
          error={!isAttendeeAdded}
          label={t(isAttendeeAdded ? "You have confirmed your attendance for summon!" : "You have already confirmed your attendance for the summon!")}
          isDleteBtn={true}
          onClose={closeToast}
        />
      )}
      {showConfirmModal && (
        <Modal
          headerBarEnd={
            <CloseBtn
              onClick={() => {
                setShowConfirmModal(false);
                setIsApiCalled(false);
              }}
              isMobileView={true}
            />
          }
          actionCancelOnSubmit={() => {
            setShowConfirmModal(false);
            setIsApiCalled(false);
          }}
          actionSaveLabel={t("CS_COMMON_CONFIRM")}
          actionCancelLabel={t("BACK")}
          actionSaveOnSubmit={async () => await onPipConfirm()}
          formId="modal-action"
          headerBarMain={<Heading label={t("CONFIRM_REPLACE_ADVOCATE")} />}
          submitTextClassName={"verification-button-text-modal"}
          className={"verify-mobile-modal"}
          isDisabled={isPipApiCalled}
        >
          <div className="verify-mobile-modal-main">{t("CONFIRM_REPLACE_ADVOCATE_PIP_MESSAGE")}</div>
        </Modal>
      )}
    </div>
  );
};

export default JoinCaseHome;
