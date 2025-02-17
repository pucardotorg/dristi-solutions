import { Button, CloseSvg, Toast } from "@egovernments/digit-ui-react-components";
import React, { useCallback, useEffect, useState } from "react";
import { DRISTIService } from "../../../../dristi/src/services";
import { useTranslation } from "react-i18next";
import { getFullName, registerIndividualWithNameAndMobileNumber, searchIndividualUserWithUuid, submitJoinCase } from "../../utils/joinCaseUtils";
import { Urls } from "@egovernments/digit-ui-module-dristi/src/hooks";
import { Urls as hearingUrls } from "../../../../hearings/src/hooks/services/Urls";
import SearchCaseAndShowDetails from "./joinCaseComponent/SearchCaseAndShowDetails";
import AccessCodeValidation from "./joinCaseComponent/AccessCodeValidation";
import useDownloadCasePdf from "@egovernments/digit-ui-module-dristi/src/hooks/dristi/useDownloadCasePdf";
import SelectParty from "./joinCaseComponent/SelectParty";
import JoinCasePayment from "./joinCaseComponent/JoinCasePayment";
import usePaymentProcess from "../../../../home/src/hooks/usePaymentProcess";
import JoinCaseSuccess from "./joinCaseComponent/JoinCaseSuccess";
import LitigantVerification from "./joinCaseComponent/LitigantVerification";

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
  WARNING: "WARNING",
  FOR_THE_SELECTED: "FOR_THE_SELECTED",
  ALREADY_AN_ADVOCATE: "ALREADY_AN_ADVOCATE",
  PLEASE_CHOOSE_PROCEED: "PLEASE_CHOOSE_PROCEED",
  PRIMARY_ADVOCATE: "PRIMARY_ADVOCATE",
  SUPPORTING_ADVOCATE: "SUPPORTING_ADVOCATE",
  REPRESENT_SELF: "REPRESENT_SELF",
  YES: "YES",
  NO_HAVE_ADVOCATE: "NO_HAVE_ADVOCATE",
  SUBMISSION_NECESSARY: "SUBMISSION_NECESSARY",
  FILL_FORM_VAKALATNAMA: "FILL_FORM_VAKALATNAMA",
  PARTY_PARTIES: "PARTY_PARTIES",
  AFFIDAVIT: "AFFIDAVIT",
  TYPE_AFFIDAVIT_CONTENT: "TYPE_AFFIDAVIT_CONTENT",
  ENTER_CODE_JOIN_CASE: "ENTER_CODE_JOIN_CASE",
  JOIN_CASE_SUCCESS: "JOIN_CASE_SUCCESS",
  BACK_HOME: "BACK_HOME",
  CONFIRM_ATTENDANCE: "CONFIRM_ATTENDANCE",
  JOINING_THIS_CASE_AS: "JOINING_THIS_CASE_AS",
  SKIP_LATER: "SKIP_LATER",
  INVALID_ACCESS_CODE_MESSAGE: "INVALID_ACCESS_CODE_MESSAGE",
  AFFIDAVIT_MINIMUM_CHAR_MESSAGE: "AFFIDAVIT_MINIMUM_CHAR_MESSAGE",
  FILLING_NUMBER_FORMATE_TEXT: `FILLING_NUMBER_FORMATE_TEXT`,
  FILLING_NUMBER_FORMATE_TEXT_VALUE: "FILLING_NUMBER_FORMATE_TEXT_VALUE",
  INVALID_CASE_INFO_TEXT: "INVALID_CASE_INFO_TEXT",
  NYAYA_MITRA_TEXT: "NYAYA_MITRA_TEXT",
  FOR_SUPPORT_TEXT: "FOR_SUPPORT_TEXT",
  COMPLAINANTS_TEXT: "COMPLAINANTS_TEXT",
  RESPONDENTS_TEXT: "RESPONDENTS_TEXT",
  WHICH_PARTY_AFFILIATED: "WHICH_PARTY_AFFILIATED",
  ADD_ADVOCATE_LATER: "ADD_ADVOCATE_LATER",
  PARTY_IN_PERSON_TEXT: "PARTY_IN_PERSON_TEXT",
  PRIMARY_ADD_SUPPORTING_ADVOCATE: "PRIMARY_ADD_SUPPORTING_ADVOCATE",
  CONTACT_PRIMARTY_ADVOCATE: "CONTACT_PRIMARTY_ADVOCATE",
  REPRESENT_SELF_PARTY: "REPRESENT_SELF_PARTY",
  NO_OBJECTION_UPLOAD_TEXT: "NO_OBJECTION_UPLOAD_TEXT",
  COURT_ORDER_UPLOAD_TEXT: "COURT_ORDER_UPLOAD_TEXT",
  ALREADY_PART_OF_CASE: "ALREADY_PART_OF_CASE",
  CASE_NOT_ADMITTED_TEXT: "CASE_NOT_ADMITTED_TEXT",
  JOIN_CASE_BACK_TEXT: "JOIN_CASE_BACK_TEXT",
  ABOVE_SELECTED_PARTY: "ABOVE_SELECTED_PARTY",
  ALREADY_JOINED_CASE: "ALREADY_JOINED_CASE",
  COURT_COMPLEX_TEXT: "COURT_COMPLEX_TEXT",
  CASE_NUMBER: "CASE_NUMBER",
  ALREADY_REPRESENTING: "ALREADY_REPRESENTING",
  CANT_REPRESENT_BOTH_PARTY: "CANT_REPRESENT_BOTH_PARTY",
  VIEW_CASE_FILE: "VIEW_CASE_FILE",
};

const JoinCaseHome = ({ refreshInbox, setShowSubmitResponseModal, setResponsePendingTask }) => {
  const { t } = useTranslation();
  const todayDate = new Date().getTime();

  const { downloadPdf } = useDownloadCasePdf();

  const Modal = window?.Digit?.ComponentRegistryService?.getComponent("Modal");
  const tenantId = Digit.ULBService.getCurrentTenantId();

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
    affidavit: {},
  });
  const [successScreenData, setSuccessScreenData] = useState({
    complainantList: [],
    complainantAdvocateList: [],
    respondentList: [],
    respondentAdvocateList: [],
  });

  const [party, setParty] = useState({});
  const [validationCode, setValidationCode] = useState("");
  const [isDisabled, setIsDisabled] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [messageHeader, setMessageHeader] = useState(t(JoinHomeLocalisation.JOIN_CASE_SUCCESS));

  const [advocateId, setAdvocateId] = useState("");
  const [advocateData, setAdvocateData] = useState({});
  const [individual, setIndividual] = useState({});
  const [individualId, setIndividualId] = useState("");
  const [individualAddress, setIndividualAddress] = useState({});
  const [name, setName] = useState({});
  const [isSignedAdvocate, setIsSignedAdvocate] = useState(false);
  const [isSignedParty, setIsSignedParty] = useState(false);
  const [complainantList, setComplainantList] = useState([]);
  const [respondentList, setRespondentList] = useState([]);
  const [individualDoc, setIndividualDoc] = useState([]);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [isAttendeeAdded, setIsAttendeeAdded] = useState(false);
  const [isLitigantJoined, setIsLitigantJoined] = useState(false);
  const [isAdvocateJoined, setIsAdvocateJoined] = useState(false);
  const [alreadyJoinedMobileNumber, setAlreadyJoinedMobileNumber] = useState([]);

  const [nextHearing, setNextHearing] = useState("");

  const [isVerified, setIsVerified] = useState(false);

  const userInfo = JSON.parse(window.localStorage.getItem("user-info"));

  const { fetchBill, openPaymentPortal, paymentLoader, showPaymentModal, setShowPaymentModal, billPaymentStatus } = usePaymentProcess({
    tenantId,
    consumerCode: caseDetails?.filingNumber,
    service: "join-case-payment",
    path: "path",
    caseDetails,
    totalAmount: "2",
    scenario: "join-case",
  });

  const closeToast = () => {
    setShowErrorToast(false);
    setIsAttendeeAdded(false);
  };

  useEffect(() => {
    let timer;
    if (showErrorToast) {
      timer = setTimeout(() => {
        closeToast();
      }, 2000);
    }
    return () => clearTimeout(timer);
  }, [showErrorToast]);

  const { mutateAsync: updateAttendees } = Digit.Hooks.useCustomAPIMutationHook({
    url: hearingUrls.hearing.hearingUpdateTranscript,
    params: { applicationNumber: "", cnrNumber: "" },
    body: { tenantId, hearingType: "", status: "" },
    config: {
      mutationKey: "addAttendee",
    },
  });

  const searchCase = async (caseNumber) => {
    if (caseNumber && !caseDetails?.filingNumber) {
      try {
        const response = await DRISTIService.searchCaseService(
          {
            criteria: [
              {
                filingNumber: caseNumber,
              },
            ],
            flow: "flow_jac",
            tenantId,
          },
          {}
        );
        setCaseList(response?.criteria[0]?.responseList?.slice(0, 5));
        if (response?.criteria[0]?.responseList?.length === 0) {
          setErrors({
            ...errors,
            caseNumber: {
              type: "not-admitted",
              message: "NO_CASE_FOUND",
            },
          });
        }
      } catch (error) {
        console.error("error :>> ", error);
      }
    }
    setIsSearchingCase(false);
  };

  const { data: filingTypeData, isLoading: isFilingTypeLoading } = Digit.Hooks.dristi.useGetStatuteSection("common-masters", [
    { name: "FilingType" },
  ]);

  function findNextHearings(objectsList) {
    const now = new Date();
    now?.setHours(0, 0, 0, 0);
    const futureStartTimes = objectsList.filter((obj) => obj.startTime >= now);
    futureStartTimes.sort((a, b) => a.startTime - b.startTime);
    return futureStartTimes.length > 0 ? futureStartTimes[0] : null;
  }

  const getNextHearingFromCaseId = async (caseId) => {
    try {
      const response = await Digit.HearingService.searchHearings(
        {
          criteria: {
            tenantId: Digit.ULBService.getCurrentTenantId(),
            filingNumber: caseId,
          },
        },
        {}
      );
      setNextHearing(findNextHearings(response?.HearingList));
    } catch (error) {
      console.error("error :>> ", error);
    }
  };

  const searchLitigantInRepresentives = useCallback((representatives, individualId) => {
    const representativesList = representatives?.filter((data) =>
      data?.representing?.find((rep) => rep?.individualId === individualId && rep?.isActive === true)
    );
    let representing;
    if (representativesList?.length > 0)
      representing = representativesList?.[0]?.representing?.find((rep) => rep?.individualId === individualId && rep?.isActive === true);

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

  const getUserUUID = async (individualId) => {
    const individualData = await window?.Digit.DRISTIService.searchIndividualUser(
      {
        Individual: {
          individualId: individualId,
        },
      },
      { tenantId, limit: 1000, offset: 0 }
    );
    return individualData;
  };

  useEffect(() => {
    if (step === 0 && caseNumber) {
      setErrors({
        ...errors,
        caseNumber: undefined,
      });
      setIsDisabled(false);
    }
    if (step === 2) {
      if (
        selectPartyData?.userType &&
        selectPartyData?.userType?.value === "Litigant" &&
        selectPartyData?.partyInvolve?.value &&
        party &&
        partyInPerson?.value &&
        ((partyInPerson?.value === "YES" && selectPartyData?.affidavit?.affidavitData) ||
          (partyInPerson?.value === "NO" && !Boolean(party?.individualId)))
      ) {
        setIsDisabled(false);
      } else if (
        selectPartyData?.userType &&
        selectPartyData?.userType?.value === "Advocate" &&
        selectPartyData?.partyInvolve?.value &&
        party?.length > 0 &&
        selectPartyData?.isReplaceAdvocate?.value &&
        ((selectPartyData?.isReplaceAdvocate?.value === "YES" && selectPartyData?.affidavit?.affidavitData) ||
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
  ]);

  const fetchBasicUserInfo = async () => {
    const individualData = await searchIndividualUserWithUuid(userInfo?.uuid, tenantId);

    setIndividualId(individualData?.Individual?.[0]?.individualId);
    setIndividual(individualData?.Individual?.[0]);
    setName(individualData?.Individual?.[0]?.name);
    const addressLine1 = individualData?.Individual?.[0]?.address[0]?.addressLine1 || "";
    const addressLine2 = individualData?.Individual?.[0]?.address[0]?.addressLine2 || "";
    const buildingName = individualData?.Individual?.[0]?.address[0]?.buildingName || "";
    const street = individualData?.Individual?.[0]?.address[0]?.street || "";
    const city = individualData?.Individual?.[0]?.address[0]?.city || "";
    const pincode = individualData?.Individual?.[0]?.address[0]?.pincode || "";
    const latitude = individualData?.Individual?.[0]?.address[0]?.latitude || "";
    const longitude = individualData?.Individual?.[0]?.address[0]?.longitude || "";
    const doorNo = individualData?.Individual?.[0]?.address[0]?.doorNo || "";
    const address = `${doorNo ? doorNo + "," : ""} ${buildingName ? buildingName + "," : ""} ${street}`.trim();
    const identifierIdDetails = JSON.parse(
      individualData?.Individual?.[0]?.additionalFields?.fields?.find((obj) => obj.key === "identifierIdDetails")?.value || "{}"
    );
    const idType = individualData?.Individual?.[0]?.identifiers[0]?.identifierType || "";
    setIndividualDoc(
      identifierIdDetails?.fileStoreId
        ? [{ fileName: `${idType} Card`, fileStore: identifierIdDetails?.fileStoreId, documentName: identifierIdDetails?.filename }]
        : null
    );
    setIndividualAddress({
      pincode: pincode,
      district: addressLine2,
      city: city,
      state: addressLine1,
      coordinates: {
        longitude: longitude,
        latitude: latitude,
      },
      locality: address,
    });
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
  };

  useEffect(() => {
    fetchBasicUserInfo();
    setIsSearchingCase(false);
  }, [show]);

  const paymentCalculation = [
    { key: "Amount Due", value: 600, currency: "Rs" },
    { key: "Court Fees", value: 400, currency: "Rs" },
    { key: "Advocate Fees", value: 1000, currency: "Rs" },
    { key: "Total Fees", value: 2000, currency: "Rs", isTotalFee: true },
  ];

  const closeModal = () => {
    setAlreadyJoinedMobileNumber([]);
    setSelectPartyData({
      userType: { label: "", value: "" },
      partyInvolve: { label: "", value: "" },
      isReplaceAdvocate: { label: "", value: "" },
      affidavit: {},
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
    setIsSignedAdvocate(false);
    setIsSignedParty(false);
    setAdvocateDetailForm({});
    setComplainantList([]);
    setRespondentList([]);
    setCaseList([]);
    setIsLitigantJoined(false);
    setSuccess(false);
  };

  const onSelect = (option) => {
    if (
      [
        "PENDING_RESPONSE",
        "PENDING_ADMISSION_HEARING",
        "ADMISSION_HEARING_SCHEDULED",
        "PENDING_NOTICE",
        "CASE_ADMITTED",
        "PENDING_ADMISSION",
      ].includes(option?.status)
    ) {
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

  const getComplainantList = async (formdata) => {
    const complainantList = await Promise.all(
      formdata?.map(async (data, index) => {
        try {
          const response = await getUserUUID(data?.individualId);

          const { representatives } = searchLitigantInRepresentives(caseDetails?.representatives, data?.individualId);
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

          const { givenName = "", otherNames = "", familyName = "" } = response?.Individual?.[0]?.name || {};
          const fullName = getFullName(" ", givenName, otherNames, familyName);

          return {
            ...data?.data,
            label: `${fullName} ${t(JoinHomeLocalisation.COMPLAINANT_BRACK)}`,
            fullName,
            partyType: index === 0 ? "complainant.primary" : "complainant.additional",
            isComplainant: true,
            individualId: data?.individualId,
            uuid: response?.Individual?.[0]?.userUuid || "",
            firstName: givenName,
            middleName: otherNames,
            lastName: familyName,
            phoneNumberVerification: {
              isUserVerified: true,
              mobileNumber: response?.Individual?.[0]?.mobileNumber,
              individualDetails: {
                individualId: data?.individualId,
                userUuid: response?.Individual?.[0]?.userUuid,
              },
            },
            isDisabled: isAdvocateRepresenting && representatives?.length === 1,
          };
        } catch (error) {
          console.error(error);
        }
      })
    );
    setSuccessScreenData((successScreenData) => ({
      ...successScreenData,
      complainantList: complainantList?.map((complainant) => complainant?.fullName),
    }));
    setComplainantList(complainantList);
  };

  const getRespondentList = async (formdata) => {
    const respondentList = await Promise.all(
      formdata?.map(async (data, index) => {
        try {
          let response;
          let firstName = "",
            middleName = "",
            lastName = "",
            fullName = "";

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

          if (individualId) {
            response = await getUserUUID(individualId);
          }

          if (response?.Individual?.[0]?.name) {
            ({ givenName: firstName = "", otherNames: middleName = "", familyName: lastName = "" } = response.Individual[0].name);
          } else {
            ({ respondentFirstName: firstName = "", respondentMiddleName: middleName = "", respondentLastName: lastName = "" } = data?.data || {});
          }

          fullName = getFullName(" ", firstName, middleName, lastName);

          return {
            ...data?.data,
            label: `${fullName} ${t(JoinHomeLocalisation.RESPONDENT_BRACK)}`,
            fullName,
            index,
            partyType: index === 0 ? "respondent.primary" : "respondent.additional",
            isRespondent: true,
            individualId,
            uuid: response?.Individual?.[0]?.userUuid || "",
            firstName,
            middleName,
            lastName,
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
            isDisabled: isAdvocateRepresenting && representatives?.length === 1,
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

  const formatFullName = (name) => {
    return [name?.givenName, name?.otherNames, name?.familyName].filter(Boolean).join(" ");
  };

  useEffect(() => {
    setParties([...complainantList, ...respondentList].map((data, index) => ({ ...data, key: index })));
  }, [complainantList, respondentList]);

  useEffect(() => {
    if (caseDetails?.caseCategory && selectPartyData?.userType?.value) {
      getNextHearingFromCaseId(caseDetails?.filingNumber);
      setSuccessScreenData((successScreenData) => ({
        ...successScreenData,
        complainantAdvocateList: caseDetails?.representatives
          ?.filter((represent) => represent?.representing?.[0]?.partyType?.includes("complainant"))
          ?.map((represent) => represent?.additionalDetails?.advocateName),
        respondentAdvocateList: caseDetails?.representatives
          ?.filter((represent) => represent?.representing?.[0]?.partyType?.includes("respondent"))
          ?.map((represent) => represent?.additionalDetails?.advocateName),
      }));
      getComplainantList(
        caseDetails?.litigants
          ?.filter((litigant) => litigant?.partyType?.includes("complainant"))
          ?.map((litigant) => ({ individualId: litigant?.individualId }))
      );
      getRespondentList(caseDetails?.additionalDetails?.respondentDetails?.formdata);
    }
  }, [caseDetails, t, selectPartyData?.userType.value]);

  useEffect(() => {
    if (setResponsePendingTask)
      setResponsePendingTask({
        actionName: "Pending Response",
        caseTitle: caseDetails?.caseTitle,
        filingNumber: caseDetails?.filingNumber,
        cnrNumber: caseDetails?.cnrNumber,
        caseId: caseDetails?.id,
        individualId: selectedParty?.individualId,
        isCompleted: false,
        status: "PENDING_RESPONSE",
      });
  }, [
    caseDetails?.caseTitle,
    caseDetails?.cnrNumber,
    caseDetails?.filingNumber,
    caseDetails?.id,
    selectedParty?.individualId,
    setResponsePendingTask,
  ]);

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

  const handleMakePayment = async () => {
    try {
      // const bill = await fetchBill(applicationDetails?.applicationNumber + `_${suffix}`, tenantId, entityType);

      const bill = [
        {
          id: "3b24b861-d7dd-4954-bde5-baa5e4d80b48",
          userId: null,
          mobileNumber: null,
          payerName: null,
          payerAddress: null,
          payerEmail: null,
          status: "ACTIVE",
          totalAmount: 2,
          businessService: "application-voluntary-submission",
          billNumber: "BILLNO-application-voluntary-submission-003573",
          billDate: 1737549216523,
          consumerCode: "KL-000196-2025-AP1_APPL_FILING",
          additionalDetails: null,
          billDetails: [
            {
              id: "422e4b8d-e6da-4639-9184-8626d8a88830",
              tenantId: "kl",
              demandId: "e3fdf313-8f1e-4f4a-aab3-ab0e05d97988",
              billId: "3b24b861-d7dd-4954-bde5-baa5e4d80b48",
              expiryDate: 1737590399522,
              amount: 2,
              amountPaid: null,
              fromPeriod: 1680287400000,
              toPeriod: 1901145600000,
              additionalDetails: {
                payer: "Sanjeev dev new",
                cnrNumber: "KLKM520000712025",
                filingNumber: "KL-000196-2025",
                payerMobileNo: "6393644430",
              },
              billAccountDetails: [
                {
                  id: "58767901-03fd-49d4-9fe4-d1f1c596c798",
                  tenantId: "kl",
                  billDetailId: "422e4b8d-e6da-4639-9184-8626d8a88830",
                  demandDetailId: "32b29dfc-6d81-4e95-b3d7-ac1cf497738f",
                  order: 0,
                  amount: 2,
                  adjustedAmount: 0,
                  taxHeadCode: "APPLICATION_VOLUNTARY_SUBMISSION_ADVANCE_CARRY_FORWARD",
                  additionalDetails: null,
                  auditDetails: null,
                },
              ],
            },
          ],
          tenantId: "kl",
          fileStoreId: null,
          auditDetails: {
            createdBy: "a5a3aa50-2f7f-4f85-919b-4bfb3f8971cf",
            lastModifiedBy: "a5a3aa50-2f7f-4f85-919b-4bfb3f8971cf",
            createdTime: 1737549216523,
            lastModifiedTime: 1737549216523,
          },
        },
      ];
      if (bill?.length) {
        const billPaymentStatus = await openPaymentPortal({ bill });
        // setPaymentStatus(billPaymentStatus);
        // await applicationRefetch();
        console.log(billPaymentStatus);
        if (billPaymentStatus === true) {
          setSuccess(true);
          setStep(4);
          // setMakePaymentLabel(false);
          // setShowSuccessModal(true);
          // createPendingTask({ name: t("MAKE_PAYMENT_SUBMISSION"), status: "MAKE_PAYMENT_SUBMISSION", isCompleted: true });
        } else {
          setSuccess(true);
          setStep(4);
          // setMakePaymentLabel(true);
          // setShowPaymentModal(false);
          // setShowSuccessModal(true);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const registerLitigants = async (data) => {
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
  };

  const getAdvocatesDetails = (advocateDetails, updatedParty, isReplaceAdvocate) => {
    const { givenName, otherNames, familyName } = individual?.name;

    const identifierIdDetails = JSON.parse(individual?.additionalFields?.fields?.find((obj) => obj.key === "identifierIdDetails")?.value || "{}");
    const idType = individual?.identifiers[0]?.identifierType || "";

    let modifiedAdvocateDetailsFormData = structuredClone(advocateDetails?.formdata)?.map((formdataItem) => {
      const matchedUser = updatedParty.find(
        (res) =>
          formdataItem?.data?.multipleAdvocatesAndPip?.boxComplainant?.individualId === res.phoneNumberVerification?.individualDetails?.individualId
      );

      return matchedUser
        ? {
            ...formdataItem,
            data: {
              ...formdataItem?.data,
              multipleAdvocatesAndPip: {
                ...formdataItem?.data?.multipleAdvocatesAndPip,
                multipleAdvocateNameDetails: [
                  ...formdataItem?.data?.multipleAdvocatesAndPip?.multipleAdvocateNameDetails?.filter((obj) => Object.keys(obj).length > 0),
                  {
                    advocateBarRegNumberWithName: {
                      barRegistrationNumber: advocateData?.barRegistrationNumber,
                      advocateName: getFullName(" ", givenName, otherNames, familyName),
                      advocateId: advocateData?.id,
                      barRegistrationNumberOriginal: advocateData?.barRegistrationNumber,
                      advocateUuid: individual?.userUuid,
                      individualId: individual?.individualId,
                    },
                    advocateNameDetails: {
                      firstName: givenName,
                      middleName: otherNames || "",
                      lastName: familyName || "",
                      advocateMobileNumber: individual?.mobileNumber,
                      advocateIdProof: [
                        {
                          name: idType,
                          fileStore: identifierIdDetails?.fileStoreId,
                          documentName: identifierIdDetails?.filename,
                          fileName: `${idType} Card`,
                        },
                      ],
                    },
                  },
                ],
                isComplainantPip: {
                  code: "NO",
                  isEnabled: true,
                  name: "NO",
                },
                pipAffidavitFileUpload: { document: [] },
                ...(isReplaceAdvocate?.value === "YES"
                  ? {
                      vakalatnamaFileUpload: {
                        document: [
                          {
                            documentType: party?.uploadedVakalatnama?.documentType,
                            fileStore: party?.uploadedVakalatnama?.fileStore,
                            documentName: party?.uploadedVakalatnama?.documentName,
                            fileName: party?.uploadedVakalatnama?.fileName,
                          },
                        ],
                      },
                    }
                  : {
                      vakalatnamaFileUpload: {
                        document: [
                          ...(formdataItem?.data?.multipleAdvocatesAndPip?.vakalatnamaFileUpload?.document || []),
                          {
                            documentType: party?.uploadedVakalatnama?.documentType,
                            fileStore: party?.uploadedVakalatnama?.fileStore,
                            documentName: party?.uploadedVakalatnama?.documentName,
                            fileName: party?.uploadedVakalatnama?.fileName,
                          },
                        ],
                      },
                    }),
              },
            },
          }
        : formdataItem;
    });
    return {
      ...advocateDetails,
      formdata: modifiedAdvocateDetailsFormData,
    };
  };

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
            const [res, err] = await submitJoinCase({
              caseFilingNumber: caseDetails?.filingNumber,
              tenantId: tenantId,
              accessCode: validationCode,
            });
            if (res) {
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
            console.log("error :>> ", error);
          }
        } else {
          setStep(step + 1);
        }
      } else if (step === 2) {
        if (
          selectPartyData?.userType &&
          selectPartyData?.userType?.value === "Litigant" &&
          selectPartyData?.partyInvolve?.value &&
          party &&
          partyInPerson?.value
        ) {
          const { isFound, representing } = searchLitigantInRepresentives(caseDetails?.representatives, individualId);
          if (isLitigantJoined && partyInPerson?.value === "NO") {
            setMessageHeader(t("ALREADY_PART_OF_CASE"));
            setSuccess(true);
            setStep(step + 3);
          } else if (isLitigantJoined && partyInPerson?.value === "YES" && !isFound) {
            setMessageHeader(t("YOU_ALREADY_PARTY_IN_PERSON"));
            setSuccess(true);
            setStep(step + 3);
          } else if (isLitigantJoined && partyInPerson?.value === "YES" && isFound) {
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
              const litigantPipPayload = {
                additionalDetails: {
                  ...caseDetails?.additionalDetails,
                  ...(party?.isComplainant && {
                    advocateDetails: {
                      ...caseDetails?.additionalDetails?.advocateDetails,
                      formdata: caseDetails?.additionalDetails?.advocateDetails?.formdata?.map((litigant) => {
                        if (litigant?.data?.multipleAdvocatesAndPip?.boxComplainant?.individualId === representing?.individualId) {
                          return {
                            ...litigant,
                            data: {
                              ...litigant?.data,
                              multipleAdvocatesAndPip: {
                                ...litigant?.data?.multipleAdvocatesAndPip,
                                isComplainantPip: {
                                  code: "YES",
                                  isEnabled: true,
                                  name: "Yes",
                                },
                                multipleAdvocateNameDetails: [],
                                pipAffidavitFileUpload: affidavitUpload,
                                vakalatnamaFileUpload: { document: [] },
                              },
                            },
                          };
                        } else return litigant;
                      }),
                    },
                  }),
                },
                caseFilingNumber: caseDetails?.filingNumber,
                tenantId: tenantId,
                accessCode: validationCode,
                caseId: caseDetails?.id,
                isLitigantPIP: true,
                litigant: [
                  {
                    ...caseDetails?.litigants?.find((litigant) => litigant?.individualId === representing?.individualId),
                    documents: [
                      {
                        documentType: affidavitUpload?.document?.[0]?.documentType,
                        fileStore: affidavitUpload?.document?.[0]?.fileStore,
                        additionalDetails: { documentName: "UPLOAD_PIP_AFFIDAVIT" },
                      },
                    ],
                  },
                ],
              };
              const [res, err] = await submitJoinCase(litigantPipPayload, {});
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

                // updating hearing attendees silently
                if (nextHearing) {
                  const updatedHearing = structuredClone(nextHearing);
                  updatedHearing.attendees = updatedHearing.attendees || [];

                  const { isFound, representatives } = searchLitigantInRepresentives(caseDetails?.representatives, party?.individualId);

                  const updatedRepresentatives = representatives?.map(async (representative) => {
                    let individualData;
                    try {
                      individualData = await searchIndividualUserWithUuid(representative?.additionalDetails?.uuid, tenantId);
                    } catch (error) {
                      console.error("error :>> ", error);
                    }
                    return {
                      ...representative,
                      individualId: individualData?.Individual?.[0]?.individualId,
                    };
                  });

                  if (isFound && representatives?.length) {
                    updatedHearing.attendees = updatedHearing.attendees?.filter((attendee) => {
                      const temp = updatedRepresentatives?.find((representative) => representative?.individualId === attendee?.individualId);
                      if (temp && temp?.representing?.length === 1) return false;
                      return true;
                    });
                  }

                  try {
                    await updateAttendees({ body: { hearing: updatedHearing } });
                  } catch (error) {
                    console.error("Error updating attendees:", error);
                  }
                }

                setMessageHeader(t("YOU_ARE_NOW_PARTY_IN_PERSON"));
                setSuccess(true);
                setStep(step + 3);
              }
            } catch (error) {
              console.error("error :>> ", error);
            }
          } else if (!isLitigantJoined && !Boolean(party?.individualId)) {
            try {
              setMessageHeader(t("JOIN_CASE_SUCCESS"));
              const { givenName, otherNames, familyName } = individual?.name;
              const respondentDetails = {
                ...caseDetails?.additionalDetails?.respondentDetails,
                formdata: [
                  ...caseDetails?.additionalDetails?.respondentDetails?.formdata?.map((data, index) => {
                    if (index === party?.index) {
                      return {
                        ...data,
                        data: {
                          ...data?.data,
                          respondentFirstName: name?.givenName,
                          respondentMiddleName: name?.otherNames,
                          respondentLastName: name?.familyName,
                          addressDetails: [
                            {
                              ...data?.data?.addressDetails?.[0],
                              addressDetails: {
                                ...data?.data?.addressDetails?.[0]?.addressDetails,
                                ...individualAddress,
                              },
                            },
                          ],
                          respondentVerification: {
                            individualDetails: {
                              individualId: individualId,
                              document: individualDoc,
                            },
                          },
                        },
                      };
                    }
                    return data;
                  }),
                ],
              };

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

              const litigantJoinPyaload = {
                additionalDetails: {
                  ...caseDetails?.additionalDetails,
                  respondentDetails,
                },
                caseFilingNumber: caseDetails?.filingNumber,
                tenantId: tenantId,
                accessCode: validationCode,
                caseId: caseDetails?.id,
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
                      documents: [
                        {
                          documentType: affidavitUpload?.document?.[0]?.documentType,
                          fileStore: affidavitUpload?.document?.[0]?.fileStore,
                          additionalDetails: { documentName: "UPLOAD_PIP_AFFIDAVIT" },
                        },
                      ],
                    }),
                  },
                ],
              };
              const [res, err] = await submitJoinCase(litigantJoinPyaload, {});
              if (res) {
                setSuccessScreenData((successScreenData) => ({
                  ...successScreenData,
                  respondentList: respondentDetails?.formdata?.map((respondent) => {
                    const { respondentFirstName, respondentMiddleName, respondentLastName } = respondent?.data;
                    return getFullName(" ", respondentFirstName, respondentMiddleName, respondentLastName);
                  }),
                }));

                if (nextHearing) {
                  const updatedHearing = structuredClone(nextHearing);
                  updatedHearing.attendees = updatedHearing.attendees || [];

                  if (individual?.individualId) {
                    updatedHearing.attendees.push({
                      name: formatFullName(name) || "",
                      individualId: individual.individualId,
                      type: "Advocate",
                    });
                  }

                  try {
                    await updateAttendees({ body: { hearing: updatedHearing } });
                  } catch (error) {
                    console.error("Error updating attendees:", error);
                  }
                }

                setRespondentList(
                  respondentList?.map((respondent) => {
                    if (respondent?.index === selectedParty?.index) {
                      const fullName = formatFullName(name);

                      return {
                        ...respondent,
                        fullName: fullName,
                      };
                    } else {
                      return respondent;
                    }
                  })
                );
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
          }
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
            (selectPartyData?.isReplaceAdvocate?.value === "YES" && selectPartyData?.affidavit?.affidavitData) ||
            selectPartyData?.isReplaceAdvocate?.value === "NO"
          ) {
            setIsDisabled(true);
            setStep(step + 1);
          }
        }
      } else if (step === 3 && !isDisabled) {
        const party = litigants;
        const updatedParty = await registerLitigants(party);
        if (selectPartyData?.isReplaceAdvocate?.value === "NO") {
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
                })),
            ];

            const { givenName, otherNames, familyName } = individual?.name;
            const documentToUploadApiCall = updatedParty?.map((user) =>
              onDocumentUpload(user?.vakalatnama?.document?.[0], user?.vakalatnama?.document?.name, tenantId).then((uploadedData) => ({
                ...user,
                uploadedVakalatnama: {
                  documentType: uploadedData.fileType || document?.documentType,
                  fileStore: uploadedData.file?.files?.[0]?.fileStoreId || document?.fileStore,
                  documentName: `Vakalatnama (${getFullName(" ", user?.firstName, user?.middleName, user?.lastName)})`,
                  fileName: `Vakalatnama (${getFullName(" ", user?.firstName, user?.middleName, user?.lastName)})`,
                },
              }))
            );

            const documentUploadResult = await Promise.all(documentToUploadApiCall);

            const representingData = [
              ...documentUploadResult?.map((party) => ({
                additionalDetails: {
                  uuid: party?.uuid,
                  fullName: party?.fullName,
                },
                caseId: caseDetails?.id,
                tenantId: tenantId,
                individualId: party?.individualId,
                partyType: party?.isComplainant ? "complainant.primary" : "respondent.primary",
                documents: [
                  {
                    documentType: party?.uploadedVakalatnama?.documentType,
                    fileStore: party?.uploadedVakalatnama?.fileStore,
                    additionalDetails: { documentName: "VAKALATNAMA" },
                  },
                ],
              })),
            ];
            const respondentDetails = getRespondentDetails(caseDetails?.additionalDetails?.respondentDetails, updatedParty);
            const joinAdvocatePayload = {
              additionalDetails: {
                ...caseDetails?.additionalDetails,
                ...(selectPartyData?.partyInvolve?.value !== "RESPONDENTS" && {
                  advocateDetails: getAdvocatesDetails(
                    caseDetails?.additionalDetails?.advocateDetails,
                    documentUploadResult,
                    selectPartyData?.isReplaceAdvocate
                  ),
                }),
                ...(selectPartyData?.partyInvolve?.value === "RESPONDENTS" && {
                  respondentDetails,
                }),
              },
              caseFilingNumber: caseDetails?.filingNumber,
              tenantId: tenantId,
              accessCode: validationCode,
              ...(selectPartyData?.partyInvolve?.value === "RESPONDENTS" && {
                litigant: litigantData,
              }),
              representative: {
                tenantId: tenantId,
                advocateId: advocateId,
                caseId: caseDetails?.id,
                representing: representingData,
                additionalDetails: {
                  advocateName: getFullName(" ", givenName, otherNames, familyName),
                  uuid: individual?.userUuid,
                },
              },
            };
            const [res, err] = await submitJoinCase(joinAdvocatePayload);

            if (res) {
              if (documentUploadResult?.[0]?.isComplainant) {
                setSuccessScreenData((successScreenData) => ({
                  ...successScreenData,
                  complainantAdvocateList: [...successScreenData?.complainantAdvocateList, getFullName(" ", givenName, otherNames, familyName)],
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
              // updating hearing attendees silently
              if (nextHearing) {
                const updatedHearing = structuredClone(nextHearing);
                updatedHearing.attendees = updatedHearing.attendees || [];

                const isAdvocateJoinedHearing = updatedHearing.attendees.some((attendee) => attendee.individualId === individual?.individualId);

                if (!isAdvocateJoinedHearing && individual?.individualId) {
                  updatedHearing.attendees.push({
                    name: formatFullName(name) || "",
                    individualId: individual.individualId,
                    type: "Advocate",
                  });
                }

                if (litigantData?.length) {
                  litigantData.forEach((litigant) => {
                    const isLitigantPresent = updatedHearing.attendees.some((attendee) => attendee.individualId === litigant?.individualId);

                    if (!isLitigantPresent && litigant?.individualId) {
                      updatedHearing.attendees.push({
                        name: litigant?.additionalDetails?.fullName || "",
                        individualId: litigant.individualId,
                        type: documentUploadResult?.[0]?.isComplainant ? "complainant" : "respondent",
                      });
                    }
                  });
                }

                try {
                  await updateAttendees({ body: { hearing: updatedHearing } });
                } catch (error) {
                  console.error("Error updating attendees:", error);
                }
              }

              // creating new pending task for submit response
              if (
                ["PENDING_RESPONSE", "PENDING_ADMISSION", "CASE_ADMITTED"].includes(caseDetails?.status) &&
                documentUploadResult?.[0]?.isRespondent
              ) {
                const pendingResponseTaskCreate = updatedParty?.map((user) =>
                  DRISTIService.customApiService(Urls.dristi.pendingTask, {
                    pendingTask: {
                      name: "Pending Response",
                      entityType: "case-default",
                      referenceId: `MANUAL_${caseDetails?.filingNumber}_${user?.uuid}_${individual?.uuid}`,
                      status: "PENDING_RESPONSE",
                      assignedTo: [{ uuid: user?.uuid }, { uuid: userInfo?.uuid }],
                      assignedRole: ["CASE_RESPONDER"],
                      cnrNumber: caseDetails?.cnrNumber,
                      filingNumber: caseDetails?.filingNumber,
                      isCompleted: false,
                      stateSla: todayDate + 20 * 24 * 60 * 60 * 1000,
                      additionalDetails: { individualId: user?.individualId, caseId: caseDetails?.id },
                      tenantId,
                    },
                  })
                );
                try {
                  await Promise.all(pendingResponseTaskCreate);
                } catch (err) {
                  console.error("err :>> ", err);
                }
              }
              setStep(step + 2);
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
        } else {
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
                })),
            ];

            const { givenName, otherNames, familyName } = individual?.name;
            const documentToUploadApiCall = updatedParty?.map((user) =>
              onDocumentUpload(user?.vakalatnama?.document?.[0], user?.vakalatnama?.document?.name, tenantId).then((uploadedData) => ({
                ...user,
                uploadedVakalatnama: {
                  documentType: uploadedData.fileType || document?.documentType,
                  fileStore: uploadedData.file?.files?.[0]?.fileStoreId || document?.fileStore,
                  documentName: `Vakalatnama (${getFullName(" ", user?.firstName, user?.middleName, user?.lastName)})`,
                  fileName: `Vakalatnama (${getFullName(" ", user?.firstName, user?.middleName, user?.lastName)})`,
                },
              }))
            );

            const documentUploadResult = await Promise.all(documentToUploadApiCall);

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

            const representingData = [
              ...documentUploadResult?.map((party) => {
                const { isFound } = searchLitigantInRepresentives(caseDetails?.representatives, party?.individualId);
                return {
                  additionalDetails: {
                    uuid: party?.uuid,
                    fullName: party?.fullName,
                  },
                  caseId: caseDetails?.id,
                  tenantId: tenantId,
                  individualId: party?.individualId,
                  partyType: party?.isComplainant ? "complainant.primary" : "respondent.primary",
                  isAdvocateReplacing: isFound,
                  documents: [
                    {
                      documentType: party?.uploadedVakalatnama?.documentType,
                      fileStore: party?.uploadedVakalatnama?.fileStore,
                      additionalDetails: { documentName: "VAKALATNAMA" },
                    },
                  ],
                };
              }),
            ];
            const respondentDetails = getRespondentDetails(caseDetails?.additionalDetails?.respondentDetails, updatedParty);
            const joinAdvocatePayloadWithReplace = {
              additionalDetails: {
                ...caseDetails?.additionalDetails,
                ...(selectPartyData?.partyInvolve?.value !== "RESPONDENTS" && {
                  advocateDetails: getAdvocatesDetails(caseDetails?.additionalDetails?.advocateDetails, documentUploadResult),
                }),
                ...(selectPartyData?.partyInvolve?.value === "RESPONDENTS" && {
                  respondentDetails,
                }),
              },
              caseFilingNumber: caseDetails?.filingNumber,
              tenantId: tenantId,
              accessCode: validationCode,
              ...(selectPartyData?.partyInvolve?.value === "RESPONDENTS" && {
                litigant: litigantData,
              }),
              representative: {
                tenantId: tenantId,
                advocateId: advocateData?.id,
                caseId: caseDetails?.id,
                representing: representingData,
                additionalDetails: {
                  advocateName: getFullName(" ", givenName, otherNames, familyName),
                  uuid: individual?.userUuid,
                },
                documents: [
                  {
                    documentType: affidavitUpload?.document?.[0]?.documentType,
                    fileStore: affidavitUpload?.document?.[0]?.fileStore,
                    additionalDetails: { documentName: "NOC/JUDGE_ORDER" },
                  },
                ],
              },
            };
            const [res, err] = await submitJoinCase(joinAdvocatePayloadWithReplace);

            if (res) {
              let advocateList = caseDetails?.representatives
                ?.filter((represent) =>
                  represent?.representing?.[0]?.partyType?.includes(documentUploadResult?.[0]?.isComplainant ? "complainant" : "respondent")
                )
                ?.filter((representative) => {
                  if (representative?.advocateId === advocateData?.id) return true;

                  const filterData = representative?.representing?.filter(
                    (represent) => representingData?.find((temp) => temp?.individualId === represent?.individualId)?.isAdvocateReplacing
                  );
                  if (filterData?.length === representative?.representing?.length) return false;
                  return true;
                });
              const isCurrentAdvocatePresent = advocateList?.some((adv) => adv?.advocateId === advocateData?.id);
              if (!isCurrentAdvocatePresent) {
                advocateList = [...advocateList?.map((adv) => adv?.additionalDetails?.fullName), getFullName(" ", givenName, otherNames, familyName)];
              }

              if (documentUploadResult?.[0]?.isComplainant) {
                setSuccessScreenData((successScreenData) => ({
                  ...successScreenData,
                  complainantAdvocateList: advocateList,
                }));
              } else {
                setSuccessScreenData((successScreenData) => ({
                  ...successScreenData,
                  respondentList: respondentDetails?.formdata?.map((respondent) => {
                    const { respondentFirstName, respondentMiddleName, respondentLastName } = respondent?.data;
                    return getFullName(" ", respondentFirstName, respondentMiddleName, respondentLastName);
                  }),
                  respondentAdvocateList: advocateList,
                }));
              }
              // updating hearing attendees silently
              if (nextHearing) {
                const updatedHearing = structuredClone(nextHearing);
                updatedHearing.attendees = updatedHearing.attendees || [];

                const isAdvocateJoinedHearing = updatedHearing.attendees.some((attendee) => attendee.individualId === individual?.individualId);

                if (!isAdvocateJoinedHearing && individual?.individualId) {
                  updatedHearing.attendees.push({
                    name: formatFullName(name) || "",
                    individualId: individual.individualId,
                    type: "Advocate",
                  });
                }

                if (litigantData?.length) {
                  litigantData.forEach((litigant) => {
                    const isLitigantPresent = updatedHearing.attendees.some((attendee) => attendee.individualId === litigant?.individualId);

                    if (!isLitigantPresent && litigant?.individualId) {
                      updatedHearing.attendees.push({
                        name: litigant?.additionalDetails?.fullName || "",
                        individualId: litigant.individualId,
                        type: documentUploadResult?.[0]?.isComplainant ? "complainant" : "respondent",
                      });
                    }
                  });
                }

                try {
                  await updateAttendees({ body: { hearing: updatedHearing } });
                } catch (error) {
                  console.error("Error updating attendees:", error);
                }
              }

              // remove all pending task of replaced adovcate
              const removeData = representingData
                ?.filter((data) => data?.isAdvocateReplacing)
                ?.map((data) => {
                  const { representatives, representing } = searchLitigantInRepresentives(caseDetails?.representatives, data?.individualId);
                  return { representatives, representing };
                });
              if (removeData?.length > 0) {
                const removePendingTaskOfReplacedAdvocate = removeData?.map((data) =>
                  DRISTIService.customApiService(Urls.dristi.pendingTask, {
                    pendingTask: {
                      name: "Pending Response",
                      entityType: "case-default",
                      referenceId: `MANUAL_${caseDetails?.filingNumber}_${data?.representing?.additionalDetails?.uuid}_${data?.representatives?.additionalDetails?.uuid}`,
                      status: "PENDING_RESPONSE",
                      assignedTo: [{ uuid: data?.representing?.additionalDetails?.uuid }, { uuid: userInfo?.uuid }],
                      assignedRole: ["CASE_RESPONDER"],
                      cnrNumber: caseDetails?.cnrNumber,
                      filingNumber: caseDetails?.filingNumber,
                      isCompleted: true,
                      stateSla: todayDate + 20 * 24 * 60 * 60 * 1000,
                      additionalDetails: { individualId, caseId: caseDetails?.id },
                      tenantId,
                    },
                  })
                );

                try {
                  await Promise.all(removePendingTaskOfReplacedAdvocate);
                } catch (error) {
                  console.error("error :>> ", error);
                }
              }

              // creating new pending task for submit response
              if (
                ["PENDING_RESPONSE", "PENDING_ADMISSION", "CASE_ADMITTED"].includes(caseDetails?.status) &&
                documentUploadResult?.[0]?.isRespondent
              ) {
                const pendingResponseTaskCreate = updatedParty?.map((user) =>
                  DRISTIService.customApiService(Urls.dristi.pendingTask, {
                    pendingTask: {
                      name: "Pending Response",
                      entityType: "case-default",
                      referenceId: `MANUAL_${caseDetails?.filingNumber}_${user?.uuid}_${individual?.uuid}`,
                      status: "PENDING_RESPONSE",
                      assignedTo: [{ uuid: user?.uuid }, { uuid: userInfo?.uuid }],
                      assignedRole: ["CASE_RESPONDER"],
                      cnrNumber: caseDetails?.cnrNumber,
                      filingNumber: caseDetails?.filingNumber,
                      isCompleted: false,
                      stateSla: todayDate + 20 * 24 * 60 * 60 * 1000,
                      additionalDetails: { individualId: user?.individualId, caseId: caseDetails?.id },
                      tenantId,
                    },
                  })
                );
                try {
                  await Promise.all(pendingResponseTaskCreate);
                } catch (err) {
                  console.error("err :>> ", err);
                }
              }
              setStep(step + 2);
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
      } else if (step === 4) {
        await handleMakePayment();
      }
    },
    [
      step,
      validationCode,
      caseDetails?.cnrNumber,
      caseDetails?.litigants,
      caseDetails?.filingNumber,
      caseDetails?.representatives,
      caseDetails?.additionalDetails,
      caseDetails?.id,
      caseDetails?.status,
      selectPartyData?.userType,
      selectPartyData?.partyInvolve?.value,
      selectPartyData?.isReplaceAdvocate?.value,
      selectPartyData?.affidavit?.affidavitData,
      individualId,
      caseNumber,
      isVerified,
      tenantId,
      errors,
      party,
      partyInPerson?.value,
      searchLitigantInRepresentives,
      isLitigantJoined,
      t,
      name,
      userInfo?.uuid,
      individualAddress,
      individualDoc,
      respondentList,
      selectedParty?.index,
      individual?.name,
      individual?.userUuid,
      individual.individualId,
      individual?.uuid,
      advocateId,
      nextHearing,
      updateAttendees,
      advocateData?.id,
      handleMakePayment,
      isDisabled,
    ]
  );

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter") {
        if (!isDisabled && step !== 3) onProceed();
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
        />
      ),
    },
    // 4
    {
      modalMain: <JoinCasePayment t={t} paymentCalculation={paymentCalculation} totalAmount="9876465" />,
    },
    // 5
    {
      modalMain: (
        <JoinCaseSuccess
          success={success}
          messageHeader={messageHeader}
          caseDetails={caseDetails}
          closeModal={closeModal}
          refreshInbox={refreshInbox}
          successScreenData={successScreenData}
        />
      ),
    },
  ];

  return (
    <div>
      <Button
        variation={"secondary"}
        className={"secondary-button-selector"}
        label={t("SEARCH_NEW_CASE")}
        labelClassName={"secondary-label-selector"}
        onButtonClick={() => setShow(true)}
      />
      {show && (
        <Modal
          headerBarEnd={<CloseBtn onClick={closeModal} />}
          actionCancelLabel={
            step === 1
              ? t("DOWNLOAD_CASE_FILE")
              : step === 3 || step === 4
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
                  }));
                  setParty([]);
                } else {
                  setSelectPartyData((selectPartyData) => ({
                    ...selectPartyData,
                    isReplaceAdvocate: {},
                    affidavit: {},
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
          headerBarMain={<Heading label={step === 3 ? t("VERIFY_LITIGANT_DETAILS") : step === 4 ? t("PAY_TO_JOIN_CASE") : t("SEARCH_NEW_CASE")} />}
          className={`join-a-case-modal ${success && "case-join-success"}`}
          isDisabled={isDisabled}
          isBackButtonDisabled={step === 1 && !isVerified}
          popupStyles={{ width: "fit-content", userSelect: "none" }}
          customActionStyle={{ background: "#fff", boxShadow: "none", border: "1px solid #007e7e" }}
          customActionTextStyle={{ color: "#007e7e" }}
          hideModalActionbar={step === 3 ? true : false}
          popupModuleMianClassName={success ? "success-main" : ""}
        >
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
    </div>
  );
};

export default JoinCaseHome;
