import {
  Button,
  CardLabel,
  CardLabelError,
  CheckSvg,
  CloseSvg,
  Dropdown,
  FormComposerV2,
  LabelFieldPair,
  RadioButtons,
  TextInput,
  Toast,
} from "@egovernments/digit-ui-react-components";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { InfoCard } from "@egovernments/digit-ui-components";
import { DRISTIService } from "../../../../dristi/src/services";
import { AdvocateIcon, RightArrow } from "../../../../dristi/src/icons/svgIndex";
import isEqual from "lodash/isEqual";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { formatDate } from "../../utils";
import RegisterRespondentForm from "./RegisterRespondentForm";
import DocumentModal from "../../../../orders/src/components/DocumentModal";
import OtpComponent from "../../components/OtpComponent";
import UploadIdType from "@egovernments/digit-ui-module-dristi/src/pages/citizen/registration/UploadIdType";
import { uploadIdConfig } from "@egovernments/digit-ui-module-dristi/src/pages/citizen/FileCase/Config/resgisterRespondentConfig";
import CustomStepperSuccess from "../../../../orders/src/components/CustomStepperSuccess";
import {
  createRespondentIndividualUser,
  getFullName,
  searchIndividualUserWithUuid,
  selectMobileNumber,
  selectOtp,
  submitJoinCase,
} from "../../utils/joinCaseUtils";
import { Urls } from "@egovernments/digit-ui-module-dristi/src/hooks";
import { getAdvocates } from "@egovernments/digit-ui-module-dristi/src/pages/citizen/FileCase/EfilingValidationUtils";
import { Urls as hearingUrls } from "../../../../hearings/src/hooks/services/Urls";
import { getFilingType } from "@egovernments/digit-ui-module-dristi/src/Utils";
import SearchCaseAndShowDetails from "./joinCaseComponent/SearchCaseAndShowDetails";
import AccessCodeValidation from "./joinCaseComponent/AccessCodeValidation";
import useDownloadCasePdf from "@egovernments/digit-ui-module-dristi/src/hooks/dristi/useDownloadCasePdf";

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
  ENTER_CASE_NUMBER: "ENTER_CASE_NUMBER",
  INVALID_CASE_FILING_NUMBER: "INVALID_CASE_FILING_NUMBER",
  CONFIRM_JOIN_CASE: "CONFIRM_JOIN_CASE",
  PLEASE_NOTE: "PLEASE_NOTE",
  SIX_DIGIT_CODE_INFO: "SIX_DIGIT_CODE_INFO",
  ADVOCATE_OPT: "ADVOCATE_OPT",
  LITIGANT_OPT: "LITIGANT_OPT",
  PLEASE_CHOOSE_PARTY: "PLEASE_CHOOSE_PARTY",
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

const advocateVakalatnamaAndNocConfig = [
  {
    body: [
      {
        type: "component",
        component: "SelectCustomDragDrop",
        key: "nocFileUpload",
        isMandatory: true,
        withoutLabel: true,
        populators: {
          inputs: [
            {
              name: "document",
              documentHeader: "NO_OBJECTION_UPLOAD_TEXT",
              infoTooltipMessage: "NO_OBJECTION_UPLOAD_TEXT",
              type: "DragDropComponent",
              uploadGuidelines: "UPLOAD_DOC_50",
              maxFileSize: 50,
              maxFileErrorMessage: "CS_FILE_LIMIT_50_MB",
              fileTypes: ["JPG", "PDF", "PNG", "JPEG"],
              isMultipleUpload: false,
            },
          ],
        },
      },
    ],
  },
  {
    body: [
      {
        type: "component",
        component: "SelectCustomDragDrop",
        key: "advocateCourtOrder",
        isMandatory: true,
        withoutLabel: true,
        populators: {
          inputs: [
            {
              name: "document",
              documentHeader: "COURT_ORDER_UPLOAD_TEXT",
              infoTooltipMessage: "COURT_ORDER_UPLOAD_TEXT",
              type: "DragDropComponent",
              uploadGuidelines: "UPLOAD_DOC_50",
              maxFileSize: 50,
              maxFileErrorMessage: "CS_FILE_LIMIT_50_MB",
              fileTypes: ["JPG", "PDF", "PNG", "JPEG"],
              isMultipleUpload: false,
            },
          ],
        },
      },
    ],
  },
];

const advocateVakalatnamaConfig = [
  {
    body: [
      {
        type: "component",
        component: "SelectCustomDragDrop",
        key: "adcVakalatnamaFileUpload",
        isMandatory: true,
        withoutLabel: true,
        populators: {
          inputs: [
            {
              name: "document",
              documentHeader: "UPLOAD_VAKALATNAMA",
              infoTooltipMessage: "UPLOAD_VAKALATNAMA",
              type: "DragDropComponent",
              uploadGuidelines: "UPLOAD_DOC_50",
              maxFileSize: 50,
              maxFileErrorMessage: "CS_FILE_LIMIT_50_MB",
              fileTypes: ["JPG", "PDF", "PNG", "JPEG"],
              isMultipleUpload: false,
            },
          ],
        },
      },
    ],
  },
];

const JoinCaseHome = ({ refreshInbox, setShowSubmitResponseModal, setResponsePendingTask }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const todayDate = new Date().getTime();

  const { downloadPdf } = useDownloadCasePdf();

  const Modal = window?.Digit?.ComponentRegistryService?.getComponent("Modal");
  const CustomCaseInfoDiv = window?.Digit?.ComponentRegistryService?.getComponent("CustomCaseInfoDiv");
  const DocViewerWrapper = window?.Digit?.ComponentRegistryService?.getComponent("DocViewerWrapper");
  const CustomErrorTooltip = window?.Digit?.ComponentRegistryService?.getComponent("CustomErrorTooltip");
  const CustomButton = window?.Digit?.ComponentRegistryService?.getComponent("CustomButton");
  const tenantId = Digit.ULBService.getCurrentTenantId();

  const [show, setShow] = useState(false);
  const [showEditRespondentDetailsModal, setShowEditRespondentDetailsModal] = useState(false);
  const [showConfirmSummonModal, setShowConfirmSummonModal] = useState(false);

  const [step, setStep] = useState(0);
  const [caseNumber, setCaseNumber] = useState("");
  const [caseDetails, setCaseDetails] = useState({});
  const [userType, setUserType] = useState({ label: "", value: "" });
  const [partyInvolve, setPartyInvolve] = useState({ label: "", value: "" });
  const [barRegNumber, setBarRegNumber] = useState("");
  const [barDetails, setBarDetails] = useState([]);
  const [selectedParty, setSelectedParty] = useState({});
  const [roleOfNewAdvocate, setRoleOfNewAdvocate] = useState({ label: "", value: "" });
  const [parties, setParties] = useState([]);
  const [advocateDetailForm, setAdvocateDetailForm] = useState({});
  const [replaceAdvocateDocuments, setReplaceAdvocateDocuments] = useState({});
  const [primaryAdvocateDetail, setPrimaryAdvocateDetail] = useState([]);
  const [isSearchingCase, setIsSearchingCase] = useState(false);
  const [caseList, setCaseList] = useState([]);

  const [party, setParty] = useState("");
  const [validationCode, setValidationCode] = useState("");
  const [isDisabled, setIsDisabled] = useState(false);
  const [errors, setErrors] = useState({});
  const [caseInfo, setCaseInfo] = useState([]);
  const [success, setSuccess] = useState(false);
  const [messageHeader, setMessageHeader] = useState(t(JoinHomeLocalisation.JOIN_CASE_SUCCESS));

  const [advocateId, setAdvocateId] = useState("");
  const [userUUID, setUserUUID] = useState("");
  const [adovacteVakalatnama, setAdovacteVakalatnama] = useState({});
  const [individualId, setIndividualId] = useState("");
  const [individualAddress, setIndividualAddress] = useState({});
  const [name, setName] = useState({});
  const [isSignedAdvocate, setIsSignedAdvocate] = useState(false);
  const [isSignedParty, setIsSignedParty] = useState(false);
  const [complainantList, setComplainantList] = useState([]);
  const [respondentList, setRespondentList] = useState([]);
  const [individualDoc, setIndividualDoc] = useState([]);
  const [advocateName, setAdvocateName] = useState("");
  const [accusedRegisterFormData, setAccusedRegisterFormData] = useState({});
  const [accusedRegisterFormDataError, setAccusedRegisterFormDataError] = useState({});
  const [isAccusedRegistered, setIsAccusedRegistered] = useState(false);
  const [otp, setOtp] = useState("");
  const [accusedIdVerificationDocument, setAccusedIdVerificationDocument] = useState();
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [isAttendeeAdded, setIsAttendeeAdded] = useState(false);

  const [registerId, setRegisterId] = useState({});

  const [nextHearing, setNextHearing] = useState("");

  const [isVerified, setIsVerified] = useState(false);

  const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
  const userInfoType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo]);
  const isCitizen = useMemo(() => userInfo?.type === "CITIZEN", [userInfo]);
  const token = window.localStorage.getItem("token");
  const isUserLoggedIn = Boolean(token);

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

  const filingType = useMemo(() => getFilingType(filingTypeData?.FilingType, "CaseFiling"), [filingTypeData?.FilingType]);

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

  const isAttendingHearing = useMemo(() => {
    if (individualId && nextHearing?.attendees) return nextHearing?.attendees?.some((attendee) => attendee?.individualId === individualId);
    return false;
  }, [individualId, nextHearing]);

  const searchLitigantInRepresentives = useCallback(() => {
    const representative = caseDetails?.representatives?.find((data) =>
      data?.representing?.find((rep) => rep?.individualId === selectedParty?.individualId && rep?.isActive === true)
    );
    let representing;
    if (representative)
      representing = representative?.representing?.find((rep) => rep?.individualId === selectedParty?.individualId && rep?.isActive === true);

    if (representative && representing) {
      return { isFound: true, representative: representative, representing: representing };
    } else return { isFound: false, representative: undefined, representing: undefined };
  }, [caseDetails?.representatives, selectedParty?.individualId]);

  const allAdvocates = useMemo(() => getAdvocates(caseDetails), [caseDetails]);
  const onBehalfOfuuid = useMemo(() => Object.keys(allAdvocates)?.find((key) => allAdvocates[key].includes(userInfo?.uuid)), [
    allAdvocates,
    userInfo?.uuid,
  ]);
  const onBehalfOfLitigent = useMemo(() => caseDetails?.litigants?.find((item) => item?.additionalDetails?.uuid === onBehalfOfuuid), [
    caseDetails,
    onBehalfOfuuid,
  ]);
  const sourceType = useMemo(
    () => (onBehalfOfLitigent?.partyType?.toLowerCase()?.includes("complainant") ? "COMPLAINANT" : !isCitizen ? "COURT" : "ACCUSED"),
    [onBehalfOfLitigent, isCitizen]
  );

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
    setUserUUID(individualData?.Individual?.[0]?.userUuid);
    return individualData;
  };

  useEffect(() => {
    if (step === 0 && !caseNumber) {
      setErrors({
        ...errors,
        caseNumber: undefined,
      });
    }
    if (step === 2) {
      if (
        userType &&
        userType?.value === "Litigant" &&
        partyInvolve?.value
        // &&  selectedParty?.label && !selectedParty?.individualId
      ) {
        setIsDisabled(false);
      } else if (userType && userType?.value === "Advocate" && selectedParty?.label) {
        const { isFound: advIsFound, representative, partyType } = searchAdvocateInRepresentives(advocateId);
        const { isFound } = searchLitigantInRepresentives();
        if (
          (isFound && roleOfNewAdvocate?.value) ||
          (!isFound && selectedParty?.partyType?.includes(partyType)) ||
          (advIsFound &&
            representative?.representing?.some((represent) => represent?.individualId === selectedParty?.individualId) &&
            selectedParty?.partyType?.includes(partyType)) ||
          (!advIsFound && ((isFound && roleOfNewAdvocate?.value) || !isFound))
        ) {
          setIsDisabled(false);
        } else {
          setIsDisabled(true);
        }
        getUserUUID(selectedParty?.individualId);
      } else {
        setIsDisabled(true);
      }
    } else if (step === 4) {
      if (isSignedAdvocate && isSignedParty) {
        setIsDisabled(false);
      } else setIsDisabled(true);
    }

    if (step !== 8) {
      setSuccess(false);
    }
  }, [
    step,
    userType,
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
  ]);

  const fetchBasicUserInfo = async () => {
    const individualData = await searchIndividualUserWithUuid(userInfo?.uuid, tenantId);

    setIndividualId(individualData?.Individual?.[0]?.individualId);
    setName(individualData?.Individual?.[0]?.name);
    const addressLine1 = individualData?.Individual?.[0]?.address[0]?.addressLine1 || "Telangana";
    const addressLine2 = individualData?.Individual?.[0]?.address[0]?.addressLine2 || "Rangareddy";
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
      setBarRegNumber(advocateResponse?.advocates[0]?.responseList[0]?.barRegistrationNumber);
      setAdvocateId(advocateResponse?.advocates[0]?.responseList[0]?.id);
      setAdvocateName(advocateResponse?.advocates[0]?.responseList[0]?.additionalDetails?.username);
      setUserType({ label: t(JoinHomeLocalisation.ADVOCATE_OPT), value: "Advocate" });
      setAdvocateDetailForm(advocateResponse?.advocates[0]?.responseList[0]);
    } else {
      setUserType({ label: t(JoinHomeLocalisation.LITIGANT_OPT), value: "Litigant" });
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

  const respondentNameEFiling = useMemo(() => {
    const { respondentFirstName, respondentMiddleName, respondentLastName } =
      caseDetails?.additionalDetails?.respondentDetails?.formdata?.[0]?.data || {};
    return [respondentFirstName, respondentMiddleName, respondentLastName]?.filter(Boolean)?.join(" ");
  }, [caseDetails]);

  const accusedName = useMemo(() => {
    if (respondentList.length > 0) {
      return respondentList?.map((respondent) => respondent?.fullName).join(", ");
    }
    return respondentNameEFiling;
  }, [respondentList, respondentNameEFiling]);

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
        />
      ),
    },
    // 1
    {
      modalMain: (
        <AccessCodeValidation
          t={t}
          caseDetails={caseDetails}
          validationCode={validationCode}
          setValidationCode={setValidationCode}
          setIsDisabled={setIsDisabled}
          errors={errors}
          setErrors={setErrors}
        />
      ),
    },
    // 2
    {
      modalMain: (
        <div className="select-user-join-case">
          <LabelFieldPair className="case-label-field-pair">
            <CardLabel className="case-input-label">{`${t(JoinHomeLocalisation.JOINING_THIS_CASE_AS)}`}</CardLabel>
            <RadioButtons
              selectedOption={userType}
              onSelect={(value) => {
                setUserType(value);
                setSelectedParty({});
                setRoleOfNewAdvocate("");
              }}
              disabled={true}
              optionsKey={"label"}
              options={[
                { label: t(JoinHomeLocalisation.ADVOCATE_OPT), value: "Advocate" },
                { label: t(JoinHomeLocalisation.LITIGANT_OPT), value: "Litigant" },
              ]}
            />
          </LabelFieldPair>
          {userType?.value !== "" && (
            <React.Fragment>
              <hr className="horizontal-line" />
              <LabelFieldPair className="case-label-field-pair">
                <CardLabel className="case-input-label">
                  {userType?.value === "Litigant" ? t(JoinHomeLocalisation.WHICH_PARTY_AFFILIATED) : `${t(JoinHomeLocalisation.PLEASE_CHOOSE_PARTY)}`}
                </CardLabel>
                <RadioButtons
                  selectedOption={selectedParty ? parties[selectedParty?.key] : selectedParty}
                  onSelect={(value) => {
                    setSelectedParty({
                      ...value,
                      respondentType: {
                        code: value?.respondentType?.code,
                        name: value?.respondentType?.name,
                      },
                    });
                    setRoleOfNewAdvocate("");
                  }}
                  optionsKey={"label"}
                  options={parties}
                />
              </LabelFieldPair>
            </React.Fragment>
          )}
          {selectedParty?.label &&
            (() => {
              const { isFound, representative } = searchLitigantInRepresentives(caseDetails);
              if (isFound && representative.advocateId === advocateId) return true;
              else return false;
            })() &&
            userType?.value === "Advocate" && (
              <React.Fragment>
                <hr className="horizontal-line" />
                <InfoCard
                  variant={"default"}
                  label={t("ES_COMMON_INFO")}
                  additionalElements={[
                    <p>
                      {t(JoinHomeLocalisation.ALREADY_REPRESENTING)} <span style={{ fontWeight: "bold" }}>{selectedParty?.label}</span>{" "}
                    </p>,
                  ]}
                  inline
                  textStyle={{}}
                  className={`custom-info-card`}
                />
              </React.Fragment>
            )}
          {selectedParty?.label &&
            (() => {
              const { isFound, representative } = searchLitigantInRepresentives(caseDetails);
              const { isFound: advIsFound, partyType } = searchAdvocateInRepresentives(advocateId);
              if (
                isFound &&
                representative.advocateId !== advocateId &&
                ((advIsFound && selectedParty?.partyType?.includes(partyType)) || !advIsFound)
              )
                return true;
              else return false;
            })() &&
            userType?.value === "Advocate" && (
              <React.Fragment>
                <hr className="horizontal-line" />
                <InfoCard
                  variant={"warning"}
                  label={t(JoinHomeLocalisation.WARNING)}
                  additionalElements={[
                    <p>
                      {t(JoinHomeLocalisation.FOR_THE_SELECTED)} <span style={{ fontWeight: "bold" }}>{selectedParty?.label}</span>{" "}
                      {t(JoinHomeLocalisation.ALREADY_AN_ADVOCATE)}
                    </p>,
                  ]}
                  inline
                  textStyle={{}}
                  className={`custom-info-card warning`}
                />

                <LabelFieldPair className="case-label-field-pair">
                  <CardLabel className="case-input-label">{`${t(JoinHomeLocalisation.PLEASE_CHOOSE_PROCEED)}`}</CardLabel>
                  <RadioButtons
                    selectedOption={roleOfNewAdvocate}
                    onSelect={(value) => {
                      setRoleOfNewAdvocate(value);
                    }}
                    optionsKey={"label"}
                    options={[
                      { label: t(JoinHomeLocalisation.PRIMARY_ADVOCATE), value: "PRIMARY_ADVOCATE" },
                      { label: t(JoinHomeLocalisation.SUPPORTING_ADVOCATE), value: "SUPPORTING_ADVOCATE" },
                    ]}
                  />
                </LabelFieldPair>
              </React.Fragment>
            )}
          {selectedParty?.label &&
            (() => {
              const { isFound } = searchLitigantInRepresentives(caseDetails);
              const { isFound: advIsFound, partyType } = searchAdvocateInRepresentives(advocateId);
              if (
                (isFound && advIsFound && !selectedParty?.partyType?.includes(partyType)) ||
                (!isFound && advIsFound && !selectedParty?.partyType?.includes(partyType))
              )
                return true;
              else return false;
            })() &&
            userType?.value === "Advocate" && (
              <React.Fragment>
                <hr className="horizontal-line" />
                <InfoCard
                  variant={"warning"}
                  label={t(JoinHomeLocalisation.WARNING)}
                  additionalElements={[
                    <p>
                      {t(JoinHomeLocalisation.ALREADY_REPRESENTING)} {selectedParty?.isComplainant ? "respondent" : "complainant"}
                      {t(JoinHomeLocalisation.CANT_REPRESENT_BOTH_PARTY)}
                    </p>,
                  ]}
                  inline
                  textStyle={{}}
                  className={`custom-info-card warning`}
                />
              </React.Fragment>
            )}
          {selectedParty?.label && userType?.value === "Litigant" && selectedParty?.individualId && (
            <React.Fragment>
              <hr className="horizontal-line" />
              <InfoCard
                variant={"warning"}
                label={t(JoinHomeLocalisation.WARNING)}
                additionalElements={[
                  <p>
                    {t(JoinHomeLocalisation.ABOVE_SELECTED_PARTY)} <span style={{ fontWeight: "bold" }}>{`${selectedParty?.label}`}</span>{" "}
                    {t(JoinHomeLocalisation.ALREADY_JOINED_CASE)}
                  </p>,
                ]}
                inline
                textStyle={{}}
                className={`custom-info-card warning`}
              />
            </React.Fragment>
          )}
        </div>
      ),
    },
    // 2
    {
      modalMain: (
        <div className="general-details-vek">
          {roleOfNewAdvocate?.value === "SUPPORTING_ADVOCATE" ? (
            <React.Fragment>
              <InfoCard
                variant={"default"}
                label={t("Info")}
                additionalElements={{}}
                inline
                text={t(JoinHomeLocalisation.PRIMARY_ADD_SUPPORTING_ADVOCATE)}
                textStyle={{}}
                className={`custom-info-card`}
              />
              <div className="primary-advocate-details">
                <h3 className="contact-text">{t(JoinHomeLocalisation.CONTACT_PRIMARTY_ADVOCATE)}</h3>
                <CustomCaseInfoDiv t={t} data={primaryAdvocateDetail} />
              </div>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <InfoCard
                variant={"default"}
                label={userType?.value === "Litigant" ? t(JoinHomeLocalisation.PLEASE_NOTE) : t("INFO")}
                inline
                text={t(JoinHomeLocalisation.FILL_FORM_VAKALATNAMA)}
                textStyle={{}}
                className={`custom-info-card`}
              />

              <React.Fragment>
                <LabelFieldPair className="case-label-field-pair">
                  <CardLabel className="case-input-label">{`${t("CS_BAR_REGISTRATION")}`}</CardLabel>
                  <div style={{ width: "100%", maxWidth: "960px" }}>
                    <TextInput
                      // t={t}
                      style={{ width: "100%" }}
                      type={"text"}
                      name="barRegNumber"
                      value={barRegNumber}
                      onChange={(e) => {
                        setBarRegNumber(e.target.value);
                        setBarDetails([]);
                      }}
                      disable={userType?.value === "Litigant" ? false : true}
                    />
                    {errors?.barRegNumber && <CardLabelError> {t(errors?.barRegNumber?.message)} </CardLabelError>}
                    {}
                  </div>
                </LabelFieldPair>
                <CustomCaseInfoDiv t={t} data={barDetails} />
                {userType?.value === "Advocate" && (
                  <LabelFieldPair className="case-label-field-pair">
                    <CardLabel className="case-input-label">{`${t(JoinHomeLocalisation.PARTY_PARTIES)}`}</CardLabel>
                    <Dropdown
                      t={t}
                      option={parties}
                      selected={party}
                      optionKey={"fullName"}
                      select={(e) => setParty(e)}
                      freeze={true}
                      disable={true}
                    />
                  </LabelFieldPair>
                )}
              </React.Fragment>
            </React.Fragment>
          )}
        </div>
      ),
    },
    // 3
    {
      modalMain: (
        <div className="view-document-vak">
          <FormComposerV2
            key={2}
            config={advocateVakalatnamaConfig}
            onFormValueChange={(setValue, formData, formState, reset, setError, clearErrors, trigger, getValues) => {
              if (!isEqual(formData, adovacteVakalatnama)) {
                setAdovacteVakalatnama(formData);
              }
              if (formData?.adcVakalatnamaFileUpload) {
                setIsDisabled(false);
              } else setIsDisabled(true);
            }}
            defaultValues={adovacteVakalatnama}
            cardStyle={{ minWidth: "100%" }}
            secondaryLabel={t("CS_SAVE_DRAFT")}
            className={`noc-court-order-upload-form`}
            noBreakLine
          />
          {adovacteVakalatnama && adovacteVakalatnama?.adcVakalatnamaFileUpload?.document && (
            <DocViewerWrapper
              key={adovacteVakalatnama?.adcVakalatnamaFileUpload?.document?.[0]?.File?.name}
              selectedDocs={adovacteVakalatnama?.adcVakalatnamaFileUpload?.document}
              tenantId={tenantId}
              docWidth="100%"
              docHeight="calc(100% - 84px)"
              showDownloadOption={false}
            />
          )}
        </div>
      ),
    },
    // 4
    {
      modalMain: (
        <div className="e-sign-page">
          <InfoCard
            variant={"default"}
            label={t(JoinHomeLocalisation.PLEASE_NOTE)}
            additionalElements={{}}
            inline
            text={"This vakalatnama will formally be added to the case after all relevant parties have added their signatures."}
            textStyle={{}}
            className={`custom-info-card`}
          />
          <div className="select-signature-main">
            <div className="select-signature-header">
              <h1 className="signature-label">{"1. Advocate Signature"}</h1>
            </div>
            <div className="select-signature-list">
              <div className="signature-body">
                <div className="icon-and-title">
                  <AdvocateIcon />
                  <h3 className="signature-title">{advocateDetailForm?.additionalDetails?.username}</h3>
                </div>
                {isSignedAdvocate && <span className="signed">{t("SIGNED")}</span>}
                {!isSignedAdvocate && (
                  <div className="signed-button-group">
                    <CustomButton
                      label={"E-Sign"}
                      onButtonClick={() => {
                        setIsDisabled(false);
                        setIsSignedAdvocate(true);
                      }}
                      className={"aadhar-sign-in"}
                      labelClassName={"aadhar-sign-in"}
                    ></CustomButton>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="select-signature-main" key={"advocate"}>
            <div className="select-signature-header">
              <h1 className="signature-label">{"2. Party Signature"}</h1>
            </div>
            <div className="select-signature-list" key={"party"}>
              <div className="signature-body">
                <div className="icon-and-title">
                  <AdvocateIcon />
                  <h3 className="signature-title">{selectedParty?.label}</h3>
                </div>
                {isSignedParty && <span className="signed">{t("SIGNED")}</span>}
                {!isSignedParty && (
                  <div className="signed-button-group">
                    <CustomButton
                      label={"E-Sign"}
                      onButtonClick={() => {
                        setIsSignedParty(true);
                      }}
                      className={"aadhar-sign-in"}
                      labelClassName={"aadhar-sign-in"}
                    ></CustomButton>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ),
    },
    // 5
    {
      modalMain: (
        <div className="payment-due-wrapper" style={{ display: "flex", flexDirection: "column" }}>
          <div className="payment-calculator-wrapper" style={{ display: "flex", flexDirection: "column" }}>
            {paymentCalculation.map((item) => (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderTop: item.isTotalFee && "1px solid #BBBBBD",
                  fontSize: item.isTotalFee && "16px",
                  fontWeight: item.isTotalFee && "700",
                  paddingTop: item.isTotalFee && "12px",
                }}
              >
                <span>{item.key}</span>
                <span>
                  {item.currency} {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    // 6
    {
      modalMain: (
        <div className="noc-court-order-upload">
          <FormComposerV2
            key={1}
            config={advocateVakalatnamaAndNocConfig}
            onFormValueChange={(setValue, formData, formState, reset, setError, clearErrors, trigger, getValues) => {
              if (!isEqual(formData, replaceAdvocateDocuments)) {
                setReplaceAdvocateDocuments(formData);
              }
              if (formData?.nocFileUpload && formData?.advocateCourtOrder) {
                setIsDisabled(false);
              } else setIsDisabled(true);
            }}
            defaultValues={replaceAdvocateDocuments}
            cardStyle={{ minWidth: "100%" }}
            secondaryLabel={t("CS_SAVE_DRAFT")}
            className={`noc-court-order-upload-form`}
            noBreakLine
          />
        </div>
      ),
    },

    // 8
    {
      modalMain: (
        <div className="join-a-case-success">
          <div className={`joining-message ${success ? "join-success" : "join-failed"}`}>
            <h3 className="message-header">{messageHeader}</h3>
            <div style={{ width: "48px", height: "48px" }}>
              <CheckSvg />
            </div>
          </div>
          {success && (
            <React.Fragment>
              <CustomCaseInfoDiv
                t={t}
                data={caseInfo}
                column={4}
                children={
                  <div className="complainants-respondents">
                    <div style={{ width: "50%" }}>
                      <h2 className="case-info-title">{t(JoinHomeLocalisation.COMPLAINANTS_TEXT)}</h2>
                      <div className="case-info-value">
                        <span>{complainantList?.map((complainant) => complainant?.fullName).join(", ")}</span>
                      </div>
                    </div>
                    <div style={{ width: "50%" }}>
                      <h2 className="case-info-title">{t(JoinHomeLocalisation.RESPONDENTS_TEXT)}</h2>
                      <div className="case-info-value">
                        <span>{accusedName}</span>
                      </div>
                    </div>
                  </div>
                }
              />
              <div className="action-button-success">
                <Button
                  className={"selector-button-border"}
                  label={t(JoinHomeLocalisation.BACK_HOME)}
                  onButtonClick={() => {
                    closeModal();
                    refreshInbox();
                  }}
                />
                <Button
                  className={"selector-button-primary"}
                  label={
                    caseDetails?.status === "PENDING_RESPONSE" && selectedParty?.isRespondent
                      ? t("SUBMIT_RESPONSE_TEXT")
                      : !isAttendingHearing && nextHearing && selectedParty?.isRespondent
                      ? t("CONFIRN_SUMMON_NOTICE_RECEIPT")
                      : t(JoinHomeLocalisation.VIEW_CASE_FILE)
                  }
                  onButtonClick={() => {
                    setShow(false);
                    if (caseDetails?.status === "PENDING_RESPONSE" && selectedParty?.isRespondent) {
                      if (setShowSubmitResponseModal) setShowSubmitResponseModal(true);
                    } else {
                      if (!isAttendingHearing && nextHearing && selectedParty?.isRespondent) {
                        closeModal();
                        setShowConfirmSummonModal(true);
                      } else
                        history.push(
                          `/${window?.contextPath}/${userInfoType}/dristi/home/view-case?caseId=${caseDetails?.id}&filingNumber=${caseDetails?.filingNumber}&tab=Overview`
                        );
                    }
                  }}
                >
                  <RightArrow />
                </Button>
              </div>
            </React.Fragment>
          )}
        </div>
      ),
    },
  ];

  const onDocumentUpload = async (fileData, filename, tenantId) => {
    if (fileData?.fileStore) return fileData;
    const fileUploadRes = await window?.Digit.UploadServices.Filestorage("DRISTI", fileData, tenantId);
    return { file: fileUploadRes?.data, fileType: fileData.type, filename };
  };

  const createShorthand = (fullname) => {
    const words = fullname?.split(" ");
    const firstChars = words?.map((word) => word?.charAt(0));
    const shorthand = firstChars?.join("");
    return shorthand;
  };
  const getUserFullName = (individual, formDataNames = {}) => {
    if (individual) {
      const { givenName, otherNames, familyName } = individual?.name || {};
      return [givenName, otherNames, familyName].filter(Boolean).join(" ");
    } else {
      const { respondentFirstName, respondentMiddleName, respondentLastName } = formDataNames || {};
      return [respondentFirstName, respondentMiddleName, respondentLastName].filter(Boolean).join(" ");
    }
  };

  const getComplainantList = async (formdata) => {
    const complainantList = await Promise.all(
      formdata?.map(async (data, index) => {
        try {
          const response = await getUserUUID(data?.individualId);

          const fullName = getUserFullName(response?.Individual?.[0]);

          return {
            ...data?.data,
            label: `${fullName} ${t(JoinHomeLocalisation.COMPLAINANT_BRACK)}`,
            fullName: fullName,
            partyType: index === 0 ? "complainant.primary" : "complainant.additional",
            isComplainant: true,
            individualId: data?.individualId,
            uuid: response?.Individual?.[0]?.userUuid,
          };
        } catch (error) {
          console.error(error);
        }
      })
    );
    setComplainantList(complainantList);
  };

  const getRespondentList = async (formdata) => {
    const respondentList = await Promise.all(
      formdata?.map(async (data, index) => {
        try {
          let response = undefined;
          let fullName = "";
          if (data?.data?.respondentVerification?.individualDetails?.individualId) {
            response = await getUserUUID(data?.data?.respondentVerification?.individualDetails?.individualId);
          }
          if (response) {
            fullName = getUserFullName(response?.Individual?.[0]);
          } else {
            const { respondentFirstName, respondentMiddleName, respondentLastName } = data?.data || {};
            fullName = getUserFullName(null, { respondentFirstName, respondentMiddleName, respondentLastName });
          }
          return {
            ...data?.data,
            label: `${fullName} ${t(JoinHomeLocalisation.RESPONDENT_BRACK)}`,
            fullName: fullName,
            index: index,
            partyType: index === 0 ? "respondent.primary" : "respondent.additional",
            isRespondent: true,
            individualId: data?.data?.respondentVerification?.individualDetails?.individualId,
            uuid: response?.Individual?.[0]?.userUuid,
          };
        } catch (error) {
          console.error(error);
        }
      })
    );
    setRespondentList(respondentList?.map((data) => data));
  };

  const formatFullName = (name) => {
    return [name?.givenName, name?.otherNames, name?.familyName].filter(Boolean).join(" ");
  };

  const attendanceDetails = useMemo(() => {
    return [
      {
        key: "Attendance to the Hearing Date on",
        value: formatDate(new Date(nextHearing?.startTime)),
      },
      {
        key: "Responding as / for",
        value: formatFullName(name) || "",
      },
    ];
  }, [name, nextHearing]);

  useEffect(() => {
    setParties([...complainantList, ...respondentList].map((data, index) => ({ ...data, key: index })));
  }, [complainantList, respondentList, userType]);

  useEffect(() => {
    if (caseDetails?.caseCategory) {
      getNextHearingFromCaseId(caseDetails?.filingNumber);
      setCaseInfo([
        {
          key: "CASE_CATEGORY",
          value: caseDetails?.caseCategory,
        },
        {
          key: "CASE_TYPE",
          value: `${createShorthand(caseDetails?.statutesAndSections?.[0]?.sections?.[0])} S${
            caseDetails?.statutesAndSections?.[0]?.subsections?.[0]
          }`,
        },
        {
          key: "SUBMITTED_ON",
          value: formatDate(new Date(caseDetails?.filingDate)),
        },
        {
          key: "CASE_STAGE",
          value: caseDetails?.stage,
        },
      ]);
      getComplainantList(
        caseDetails?.litigants
          ?.filter((litigant) => litigant?.partyType.includes("complainant"))
          ?.map((litigant) => ({ individualId: litigant?.individualId }))
      );
      getRespondentList(caseDetails?.additionalDetails?.respondentDetails?.formdata);
    }
  }, [caseDetails, t, userType?.value]);

  useEffect(() => {
    setAccusedRegisterFormData({
      ...selectedParty,
      ...(selectedParty?.phonenumbers?.mobileNumber?.[0] && { mobileNumber: selectedParty?.phonenumbers?.mobileNumber?.[0] }),
    });
  }, [selectedParty]);

  useEffect(() => {
    setBarDetails([
      {
        key: "CASE_NUMBER",
        value: caseDetails?.filingNumber,
      },
      {
        key: JoinHomeLocalisation.COURT_COMPLEX_TEXT,
        value: caseDetails?.courtId ? t(`COMMON_MASTERS_COURT_R00M_${caseDetails?.courtId}`) : "",
      },
      {
        key: JoinHomeLocalisation.ADVOCATE_OPT,
        value: advocateName,
      },
    ]);
  }, [caseDetails, advocateName, t]);

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

  const closeModal = () => {
    setCaseNumber("");
    setCaseDetails({});
    setUserType({});
    setSelectedParty({});
    setRoleOfNewAdvocate("");
    setBarRegNumber("");
    setBarDetails([]);
    setValidationCode("");
    setErrors({});
    setCaseInfo([]);
    setStep(0);
    setShow(false);
    setIsSignedAdvocate(false);
    setIsSignedParty(false);
    setAdvocateDetailForm({});
    setReplaceAdvocateDocuments({});
    setAdovacteVakalatnama({});
    setComplainantList([]);
    setRespondentList([]);
    setCaseList([]);
  };

  const onProceed = useCallback(async () => {
    if (step === 0) {
      if (caseDetails?.cnrNumber) {
        if (userType?.value === "Litigant") {
          const isFound = caseDetails?.litigants?.find((item) => item.individualId === individualId);
          if (isFound !== undefined) {
            setSelectedParty({ isRespondent: isFound?.partyType?.includes("respondent") });
            setMessageHeader(t(JoinHomeLocalisation.ALREADY_PART_OF_CASE));
            setSuccess(true);
            setStep(8);
          } else {
            setStep(step + 1);
          }
        } else {
          setStep(step + 1);
        }
        setIsDisabled(true);
      } else {
        searchCase(caseNumber);
      }
    } else if (step === 1 && validationCode.length === 6) {
      if (!isVerified) {
        const [res, err] = await submitJoinCase({
          caseFilingNumber: caseDetails?.filingNumber,
          tenantId: tenantId,
          accessCode: validationCode,
        });
        if (res) {
          setIsVerified(true);
        } else {
          setErrors({
            ...errors,
            validationCode: {
              message: JoinHomeLocalisation.INVALID_ACCESS_CODE_MESSAGE,
            },
          });
        }
      } else {
        setStep(step + 1);
      }
    } else if (step === 2) {
      if (
        userType &&
        userType?.value === "Litigant" &&
        partyInvolve?.value
        // && selectedParty?.label
      ) {
        setBarRegNumber("");
        setIsDisabled(true);
        setStep(step + 6);
        setBarDetails([]);
        setErrors({
          ...errors,
          barRegNumber: undefined,
        });
      } else if (userType && userType?.value === "Advocate") {
        const { isFound: advIsFound, representative } = searchAdvocateInRepresentives(advocateId);

        if (selectedParty?.individualId) {
          setParty(selectedParty);
          if (advIsFound && representative?.representing?.some((represent) => represent?.individualId === selectedParty?.individualId)) {
            setStep(8);
            setMessageHeader(`${t(JoinHomeLocalisation.ALREADY_REPRESENTING)} ${selectedParty?.fullName}`);
            setSuccess(true);
          } else if (roleOfNewAdvocate?.value !== "SUPPORTING_ADVOCATE") {
            const { isFound, representative } = searchLitigantInRepresentives();
            if (isFound && representative?.advocateId === advocateId) {
              setStep(8);
              setMessageHeader(t(""));
              setSuccess(true);
            } else setStep(step + 1);
          } else {
            const { representative } = searchLitigantInRepresentives();
            const advocateResponse = await DRISTIService.searchIndividualAdvocate(
              {
                criteria: [
                  {
                    id: representative?.advocateId,
                  },
                ],
                tenantId,
              },
              {}
            );

            const individualData = await window?.Digit.DRISTIService.searchIndividualUser(
              {
                Individual: {
                  individualId: advocateResponse?.advocates[0]?.responseList[0]?.individualId,
                },
              },
              { tenantId, limit: 1000, offset: 0 },
              "",
              userInfo?.uuid && isUserLoggedIn
            );
            setPrimaryAdvocateDetail([
              {
                key: "Name",
                value: representative?.additionalDetails?.advocateName || "",
              },
              {
                key: "Bar Council Id",
                value: advocateResponse?.advocates[0]?.responseList[0]?.barRegistrationNumber || "",
              },
              {
                key: "Email",
                value: individualData.Individual[0]?.email || "Email Not Available",
              },
            ]);
            setStep(step + 1);
          }
        } else if (selectedParty?.fullName) {
          setShow(false);
          setShowEditRespondentDetailsModal(true);
        }
      }
    } else if (step === 2) {
      if (roleOfNewAdvocate?.value === "SUPPORTING_ADVOCATE") {
        closeModal();
        return;
      } else {
        setIsDisabled(false);
        setStep(step + 1);
      }
    } else if (step === 3) {
      setIsDisabled(true);
      if (searchLitigantInRepresentives().isFound) setStep(step + 3);
      else setStep(step + 4);
    } else if (step === 4) {
      setStep(step + 1);
      setIsDisabled(false);
    } else if (step === 5) {
      if (roleOfNewAdvocate?.value === "PRIMARY_ADVOCATE") {
        setStep(step + 1);
      } else {
        setStep(step + 2);
      }
      setIsDisabled(true);
    } else if (step === 6) {
      setStep(step + 1);
      setIsDisabled(true);
    } else if (step === 7 && validationCode.length === 6) {
      setIsDisabled(true);
      if (userType?.value === "Advocate") {
        const { representative } = searchLitigantInRepresentives();
        if (representative !== undefined) {
          const nocDocument = await Promise.all(
            replaceAdvocateDocuments?.nocFileUpload?.document?.map(async (document) => {
              if (document) {
                const uploadedData = await onDocumentUpload(document, document.name, tenantId);
                return {
                  documentType: uploadedData.fileType || document?.documentType,
                  fileStore: uploadedData.file?.files?.[0]?.fileStoreId || document?.fileStore,
                  documentName: uploadedData.filename || document?.documentName,
                  fileName: `NOC (${formatFullName(name)})`,
                  individualId,
                };
              }
            }) || []
          );
          const courOrderDocument = await Promise.all(
            replaceAdvocateDocuments?.advocateCourtOrder?.document?.map(async (document) => {
              if (document) {
                const uploadedData = await onDocumentUpload(document, document.name, tenantId);
                return {
                  documentType: uploadedData.fileType || document?.documentType,
                  fileStore: uploadedData.file?.files?.[0]?.fileStoreId || document?.fileStore,
                  documentName: uploadedData.filename || document?.documentName,
                  fileName: `Court Order (${formatFullName(name)})`,
                  individualId,
                };
              }
            }) || []
          );
          const vakalatnamaDocument = await Promise.all(
            adovacteVakalatnama?.adcVakalatnamaFileUpload?.document?.map(async (document) => {
              if (document) {
                const uploadedData = await onDocumentUpload(document, document.name, tenantId);
                return {
                  documentType: uploadedData.fileType || document?.documentType,
                  fileStore: uploadedData.file?.files?.[0]?.fileStoreId || document?.fileStore,
                  documentName: uploadedData.filename || document?.documentName,
                  fileName: `Vakalatnama (${formatFullName(name)})`,
                  individualId,
                };
              }
            }) || []
          );
          const documentList = [...nocDocument, ...courOrderDocument, ...vakalatnamaDocument];
          await Promise.all(
            documentList
              ?.filter((data) => data)
              ?.map(async (data) => {
                await DRISTIService.createEvidence({
                  artifact: {
                    artifactType: "DOCUMENTARY",
                    sourceType: sourceType,
                    sourceID: individualId,
                    caseId: caseDetails?.id,
                    filingNumber: caseDetails?.filingNumber,
                    cnrNumber: caseDetails?.cnrNumber,
                    tenantId,
                    comments: [],
                    file: {
                      documentType: data?.fileType || data?.documentType,
                      fileStore: data?.fileStore,
                      fileName: data?.fileName,
                      documentName: data?.documentName,
                    },
                    filingType: filingType,
                    workflow: {
                      action: "TYPE DEPOSITION",
                      documents: [
                        {
                          documentType: data?.documentType,
                          fileName: data?.fileName,
                          documentName: data?.documentName,
                          fileStoreId: data?.fileStore,
                        },
                      ],
                    },
                  },
                });
              })
          );

          const [res, err] = await submitJoinCase({
            additionalDetails: {
              ...caseDetails?.additionalDetails,
              advocateDetails: (() => {
                const advocateFormdataCopy = structuredClone(caseDetails?.additionalDetails?.advocateDetails?.formdata);
                const idx = advocateFormdataCopy?.findIndex((adv) => adv?.data?.advocateId === representative?.advocateId);
                if (idx !== -1)
                  advocateFormdataCopy[idx] = {
                    data: {
                      advocateId: advocateDetailForm?.id,
                      advocateName: advocateDetailForm?.additionalDetails?.username,
                      barRegistrationNumber: advocateDetailForm?.barRegistrationNumber,
                      vakalatnamaFileUpload: vakalatnamaDocument?.length > 0 && vakalatnamaDocument,
                      nocFileUpload: nocDocument?.length > 0 && nocDocument,
                      courtOrderFileUpload: courOrderDocument?.length > 0 && courOrderDocument,
                      isAdvocateRepresenting: {
                        code: "YES",
                        name: "Yes",
                        showForm: true,
                        isEnabled: true,
                      },
                      advocateBarRegNumberWithName: [
                        {
                          modified: true,
                          advocateId: advocateDetailForm?.id,
                          advocateName: advocateDetailForm?.additionalDetails?.username,
                          barRegistrationNumber: advocateDetailForm?.barRegistrationNumber,
                          barRegistrationNumberOriginal: advocateDetailForm?.barRegistrationNumber,
                        },
                      ],
                      barRegistrationNumberOriginal: advocateDetailForm?.barRegistrationNumber,
                    },
                  };
                return {
                  ...caseDetails?.additionalDetails?.advocateDetails,
                  formdata: advocateFormdataCopy,
                };
              })(),
            },
            caseFilingNumber: caseNumber,
            tenantId: tenantId,
            accessCode: validationCode,
            representative: {
              tenantId: tenantId,
              advocateId: advocateId,
              id: representative?.id,
              caseId: caseDetails?.id,
              representing: [
                {
                  additionalDetails: {
                    uuid: userUUID,
                    fullName: selectedParty?.fullName,
                  },
                  caseId: caseDetails?.id,
                  tenantId: tenantId,
                  individualId: selectedParty?.individualId || null,
                  partyType: selectedParty?.isComplainant ? "complainant.primary" : "respondent.primary",
                },
              ],
              additionalDetails: {
                advocateName: advocateDetailForm?.additionalDetails?.username,
                uuid: userInfo?.uuid,
                document: {
                  vakalatnamaFileUpload: vakalatnamaDocument?.length > 0 && vakalatnamaDocument,
                  nocFileUpload: nocDocument?.length > 0 && nocDocument,
                  courtOrderFileUpload: courOrderDocument?.length > 0 && courOrderDocument,
                },
              },
            },
          });
          if (res) {
            if (caseDetails?.status === "PENDING_RESPONSE" && selectedParty?.isRespondent) {
              // closing old pending task
              try {
                await DRISTIService.customApiService(Urls.dristi.pendingTask, {
                  pendingTask: {
                    name: "Pending Response",
                    entityType: "case-default",
                    referenceId: `MANUAL_${caseDetails?.filingNumber}`,
                    status: "PENDING_RESPONSE",
                    assignedTo: [{ uuid: selectedParty?.uuid }, { uuid: representative?.additionalDetails?.uuid }],
                    assignedRole: ["CASE_RESPONDER"],
                    cnrNumber: caseDetails?.cnrNumber,
                    filingNumber: caseDetails?.filingNumber,
                    isCompleted: true,
                    stateSla: todayDate + 20 * 24 * 60 * 60 * 1000,
                    additionalDetails: { individualId, caseId: caseDetails?.id },
                    tenantId,
                  },
                });
              } catch (err) {
                console.error("err :>> ", err);
              }

              // creating new pending task
              try {
                await DRISTIService.customApiService(Urls.dristi.pendingTask, {
                  pendingTask: {
                    name: "Pending Response",
                    entityType: "case-default",
                    referenceId: `MANUAL_${caseDetails?.filingNumber}`,
                    status: "PENDING_RESPONSE",
                    assignedTo: [{ uuid: selectedParty?.uuid }, { uuid: userInfo?.uuid }],
                    assignedRole: ["CASE_RESPONDER"],
                    cnrNumber: caseDetails?.cnrNumber,
                    filingNumber: caseDetails?.filingNumber,
                    isCompleted: false,
                    stateSla: todayDate + 20 * 24 * 60 * 60 * 1000,
                    additionalDetails: { individualId, caseId: caseDetails?.id },
                    tenantId,
                  },
                });
              } catch (err) {
                console.error("err :>> ", err);
              }
            }
            try {
              const individualData = await searchIndividualUserWithUuid(representative?.additionalDetails?.uuid, tenantId);

              // updating hearing attendees silently
              const updatedHearing = structuredClone(nextHearing);
              updatedHearing.attendees = updatedHearing.attendees || [];
              // removing old advocate
              updatedHearing.attendees = updatedHearing.attendees.filter(
                (attendee) => attendee?.individualId !== individualData?.Individual?.[0]?.individualId
              );
              // adding new advocate
              if (selectedParty?.isComplainant) {
                updatedHearing.attendees.push({
                  name: formatFullName(name) || "",
                  individualId: individualId,
                  type: "Complainant",
                });
              }
              try {
                await updateAttendees({ body: { hearing: updatedHearing } });
              } catch (error) {
                console.error("error :>> ", error);
              }
            } catch (err) {
              console.error("err :>> ", err);
            }

            setStep(step + 1);
            setSuccess(true);
          } else {
            setErrors({
              ...errors,
              validationCode: {
                message: JoinHomeLocalisation.INVALID_ACCESS_CODE_MESSAGE,
              },
            });
          }
        } else {
          const isLitigantJoinedCase = caseDetails?.litigants?.find((litigant) => litigant?.individualId === selectedParty?.individualId);

          const vakalatnamaDocument = await Promise.all(
            adovacteVakalatnama?.adcVakalatnamaFileUpload?.document?.map(async (document) => {
              if (document) {
                const uploadedData = await onDocumentUpload(document, document.name, tenantId);
                return {
                  documentType: uploadedData.fileType || document?.documentType,
                  fileStore: uploadedData.file?.files?.[0]?.fileStoreId || document?.fileStore,
                  documentName: uploadedData.filename || document?.documentName,
                  fileName: `Vakalatnama (${formatFullName(name)})`,
                  individualId,
                };
              }
            }) || []
          );
          await Promise.all(
            vakalatnamaDocument
              ?.filter((data) => data)
              ?.map(async (data) => {
                await DRISTIService.createEvidence({
                  artifact: {
                    artifactType: "DOCUMENTARY",
                    sourceType: sourceType,
                    sourceID: individualId,
                    caseId: caseDetails?.id,
                    filingNumber: caseDetails?.filingNumber,
                    cnrNumber: caseDetails?.cnrNumber,
                    tenantId,
                    comments: [],
                    file: {
                      documentType: data?.fileType || data?.documentType,
                      fileStore: data?.fileStore,
                      fileName: data?.fileName,
                      documentName: data?.documentName,
                    },
                    filingType: filingType,
                    workflow: {
                      action: "TYPE DEPOSITION",
                      documents: [
                        {
                          documentType: data?.documentType,
                          fileName: data?.fileName,
                          documentName: data?.documentName,
                          fileStoreId: data?.fileStore,
                        },
                      ],
                    },
                  },
                });
              })
          );
          const [res, err] = await submitJoinCase({
            additionalDetails: caseDetails?.additionalDetails,
            caseFilingNumber: caseNumber,
            tenantId: tenantId,
            accessCode: validationCode,
            ...(!isLitigantJoinedCase && {
              litigant: {
                additionalDetails: {
                  fullName: selectedParty?.fullName,
                  uuid: selectedParty?.uuid,
                },
                tenantId: tenantId,
                individualId: selectedParty?.individualId,
                partyCategory: "INDIVIDUAL",
                partyType: selectedParty?.partyType,
              },
            }),
            representative: {
              tenantId: tenantId,
              advocateId: advocateId,
              caseId: caseDetails?.id,
              representing: [
                {
                  additionalDetails: {
                    uuid: userUUID,
                    fullName: selectedParty?.fullName,
                  },
                  caseId: caseDetails?.id,
                  tenantId: tenantId,
                  individualId: selectedParty?.individualId || null,
                  partyType: selectedParty?.isComplainant ? "complainant.primary" : "respondent.primary",
                },
              ],
              additionalDetails: {
                advocateName: advocateDetailForm?.additionalDetails?.username,
                uuid: userInfo?.uuid,
                document: {
                  vakalatnamaFileUpload: vakalatnamaDocument?.length > 0 && vakalatnamaDocument,
                },
              },
            },
          });
          if (res) {
            // creating new pending task for submit response
            if (caseDetails?.status === "PENDING_RESPONSE" && selectedParty?.isRespondent) {
              try {
                await DRISTIService.customApiService(Urls.dristi.pendingTask, {
                  pendingTask: {
                    name: "Pending Response",
                    entityType: "case-default",
                    referenceId: `MANUAL_${caseDetails?.filingNumber}`,
                    status: "PENDING_RESPONSE",
                    assignedTo: [{ uuid: selectedParty?.uuid }, { uuid: userInfo?.uuid }],
                    assignedRole: ["CASE_RESPONDER"],
                    cnrNumber: caseDetails?.cnrNumber,
                    filingNumber: caseDetails?.filingNumber,
                    isCompleted: false,
                    stateSla: todayDate + 20 * 24 * 60 * 60 * 1000,
                    additionalDetails: { individualId, caseId: caseDetails?.id },
                    tenantId,
                  },
                });
              } catch (err) {
                console.error("err :>> ", err);
              }
            }
            try {
              if (selectedParty?.isComplainant) {
                await onConfirmAttendee("Complainant");
              }
            } catch (err) {
              console.error("err :>> ", err);
            }
            setStep(step + 1);
            setSuccess(true);
          } else {
            setErrors({
              ...errors,
              validationCode: {
                message: JoinHomeLocalisation.INVALID_ACCESS_CODE_MESSAGE,
              },
            });
          }
        }
      } else {
        const [res, err] = await submitJoinCase(
          {
            additionalDetails: {
              ...caseDetails?.additionalDetails,
              respondentDetails: {
                ...caseDetails?.additionalDetails?.respondentDetails,
                formdata: [
                  ...caseDetails?.additionalDetails?.respondentDetails?.formdata?.map((data, index) => {
                    if (index === selectedParty?.index) {
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
              },
            },
            caseFilingNumber: caseNumber,
            tenantId: tenantId,
            accessCode: validationCode,
            caseId: caseDetails?.id,
            litigant: {
              additionalDetails: {
                fullName: getFullName(" ", name?.givenName, name?.otherNames, name?.familyName),
                uuid: userInfo?.uuid,
              },
              caseId: caseDetails?.id,
              tenantId: tenantId,
              individualId: individualId,
              partyCategory: "INDIVIDUAL",
              partyType: selectedParty?.partyType,
            },
          },
          {}
        );
        if (res) {
          if (caseDetails?.status === "PENDING_RESPONSE") {
            try {
              await DRISTIService.customApiService(Urls.dristi.pendingTask, {
                pendingTask: {
                  name: "Pending Response",
                  entityType: "case-default",
                  referenceId: `MANUAL_${caseDetails?.filingNumber}`,
                  status: "PENDING_RESPONSE",
                  assignedTo: [{ uuid: userInfo?.uuid }],
                  assignedRole: ["CASE_RESPONDER"],
                  cnrNumber: caseDetails?.cnrNumber,
                  filingNumber: caseDetails?.filingNumber,
                  isCompleted: false,
                  stateSla: todayDate + 20 * 24 * 60 * 60 * 1000,
                  additionalDetails: { individualId, caseId: caseDetails?.id },
                  tenantId,
                },
              });
            } catch (err) {
              console.error("err :>> ", err);
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
          setStep(step + 1);
          setSuccess(true);
        } else {
          setErrors({
            ...errors,
            validationCode: {
              message: JoinHomeLocalisation.INVALID_ACCESS_CODE_MESSAGE,
            },
          });
        }
      }
      setIsDisabled(false);
    }
  }, [
    adovacteVakalatnama?.adcVakalatnamaFileUpload?.document,
    advocateDetailForm?.additionalDetails?.username,
    advocateDetailForm?.barRegistrationNumber,
    advocateDetailForm?.id,
    advocateId,
    caseDetails?.additionalDetails,
    caseDetails?.cnrNumber,
    caseDetails?.filingNumber,
    caseDetails?.id,
    caseDetails?.litigants,
    caseDetails?.status,
    caseNumber,
    errors,
    individualAddress,
    individualDoc,
    individualId,
    isUserLoggedIn,
    name,
    replaceAdvocateDocuments?.advocateCourtOrder?.document,
    replaceAdvocateDocuments?.nocFileUpload?.document,
    respondentList,
    roleOfNewAdvocate?.value,
    searchAdvocateInRepresentives,
    searchLitigantInRepresentives,
    selectedParty,
    sourceType,
    step,
    t,
    tenantId,
    todayDate,
    userInfo?.uuid,
    userType,
    userUUID,
    validationCode,
  ]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter") {
        if (!isDisabled) onProceed();
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

  const onOtpChange = (value) => {
    setOtp(value);
  };

  const onResendOtp = async () => {
    await selectMobileNumber(accusedRegisterFormData?.mobileNumber, tenantId);
  };

  const [userData, setUserData] = useState({});

  const registerRespondentFormAction = useCallback(async () => {
    const regex = /^[6-9]\d{9}$/;
    let tempValue = {};
    for (const key in accusedRegisterFormData) {
      switch (key) {
        case "mobileNumber":
          if (!regex.test(accusedRegisterFormData?.mobileNumber)) {
            tempValue = { ...tempValue, mobileNumber: { message: "Incorrect Mobile Number" } };
          }
          break;
        default:
          break;
      }
    }
    if (Object.keys(tempValue).length > 0) {
      setAccusedRegisterFormDataError({
        ...accusedRegisterFormDataError,
        ...tempValue,
      });
      return { continue: false };
    }
    const { response, isRegistered } = await selectMobileNumber(accusedRegisterFormData?.mobileNumber, tenantId);
    setIsAccusedRegistered(isRegistered);
    return { continue: response ? true : false };
  }, [accusedRegisterFormData, accusedRegisterFormDataError, tenantId]);

  const otpVerificationAction = useCallback(async () => {
    const data = await selectOtp(isAccusedRegistered, accusedRegisterFormData?.mobileNumber, otp, tenantId);
    setUserData({ ...userData, ...data });
    return { continue: data ? true : false };
  }, [accusedRegisterFormData?.mobileNumber, isAccusedRegistered, otp, tenantId, userData]);

  const updateRespondentDetails = useCallback(
    async (data, documentData) => {
      const response = await createRespondentIndividualUser(data, documentData, tenantId);
      const identifierIdDetails = JSON.parse(
        response?.Individual?.additionalFields?.fields?.find((obj) => obj.key === "identifierIdDetails")?.value || "{}"
      );
      const idType = response?.Individual?.identifiers[0]?.identifierType || "";
      const copyIndividualDoc = identifierIdDetails?.fileStoreId
        ? [{ fileName: `${idType} Card`, fileStore: identifierIdDetails?.fileStoreId, documentName: identifierIdDetails?.filename }]
        : null;

      const additionalDetails = {
        ...caseDetails?.additionalDetails,
        respondentDetails: {
          ...caseDetails?.additionalDetails?.respondentDetails,
          formdata: [
            ...caseDetails?.additionalDetails?.respondentDetails?.formdata?.map((data, index) => {
              if (index === selectedParty?.index) {
                return {
                  ...data,
                  data: {
                    ...data?.data,
                    respondentFirstName: response?.Individual?.name?.givenName,
                    respondentMiddleName: response?.Individual?.name?.otherNames,
                    respondentLastName: response?.Individual?.name?.familyName,
                    addressDetails: response?.Individual?.address,
                    respondentVerification: {
                      individualDetails: {
                        individualId: response?.Individual?.individualId,
                        document: copyIndividualDoc,
                      },
                    },
                  },
                };
              }
              return data;
            }),
          ],
        },
      };

      if (response) {
        setCaseDetails({
          ...caseDetails,
          additionalDetails: additionalDetails,
        });
        const fullName = getUserFullName(response?.Individual);
        setSelectedParty({
          ...selectedParty,
          fullName: fullName,
          label: `${fullName} ${t(JoinHomeLocalisation.RESPONDENT_BRACK)}`,
          respondentFirstName: response?.Individual?.name?.givenName,
          respondentMiddleName: response?.Individual?.name?.otherNames,
          respondentLastName: response?.Individual?.name?.familyName,
          addressDetails: response?.Individual?.address,
          respondentVerification: {
            individualDetails: {
              individualId: response?.Individual?.individualId,
              document: copyIndividualDoc,
            },
          },
          individualId: response?.Individual?.individualId,
          uuid: response?.Individual?.userUuid,
        });
      }
      return { continue: response ? true : false };
    },
    [caseDetails, selectedParty, t, tenantId]
  );

  const onConfirmAttendee = async (type) => {
    const updatedHearing = structuredClone(nextHearing);
    updatedHearing.attendees = updatedHearing.attendees || [];
    if (updatedHearing?.attendees?.some((attendee) => attendee?.individualId === individualId)) {
      setShowErrorToast(true);
      setIsAttendeeAdded(false);
      return {
        continue: true,
      };
    } else {
      updatedHearing.attendees.push({
        name: formatFullName(name) || "",
        individualId: individualId,
        type,
      });
      try {
        const response = await updateAttendees({ body: { hearing: updatedHearing } });
        if (response) {
          setShowErrorToast(true);
          setIsAttendeeAdded(true);
          return {
            continue: true,
          };
        } else {
          setShowErrorToast(true);
          setIsAttendeeAdded(false);
          return { continue: false };
        }
      } catch (error) {
        console.error("error :>> ", error);
      }
    }
  };

  const handleRegisterRespondentModalClose = () => {
    setShow(true);
    setShowEditRespondentDetailsModal(false);
    setAccusedRegisterFormData({});
    setOtp("");
    let tempSelectedParty = parties?.find((party) => party?.key === selectedParty?.key);
    tempSelectedParty = {
      ...tempSelectedParty,
      respondentType: {
        code: tempSelectedParty?.respondentType?.code,
        name: tempSelectedParty?.respondentType?.name,
      },
    };
    setSelectedParty(tempSelectedParty);
  };

  const registerRespondentConfig = useMemo(() => {
    return {
      handleClose: () => handleRegisterRespondentModalClose(),
      heading: { label: "" },
      actionSaveLabel: "",
      isStepperModal: true,
      actionSaveOnSubmit: () => {},
      steps: [
        {
          type: "document",
          heading: { label: t("EDIT_RESPONDENT") },
          modalBody: (
            <RegisterRespondentForm
              accusedRegisterFormData={accusedRegisterFormData}
              setAccusedRegisterFormData={setAccusedRegisterFormData}
              error={accusedRegisterFormDataError}
            />
          ),
          actionSaveOnSubmit: async () => {
            return await registerRespondentFormAction();
          },
          async: true,
          actionSaveLabel: t("VERIFY_WITH_OTP"),
          actionCancelLabel: t("BACK"),
          actionCancelOnSubmit: () => {
            handleRegisterRespondentModalClose();
          },
          isDisabled:
            accusedRegisterFormData?.respondentType &&
            accusedRegisterFormData?.mobileNumber &&
            accusedRegisterFormData?.respondentFirstName &&
            accusedRegisterFormData?.addressDetails?.[0]?.addressDetails?.city &&
            accusedRegisterFormData?.addressDetails?.[0]?.addressDetails?.district &&
            accusedRegisterFormData?.addressDetails?.[0]?.addressDetails?.locality &&
            accusedRegisterFormData?.addressDetails?.[0]?.addressDetails?.pincode &&
            accusedRegisterFormData?.addressDetails?.[0]?.addressDetails?.state &&
            ((accusedRegisterFormData?.respondentType?.code === "REPRESENTATIVE" && accusedRegisterFormData?.respondentCompanyName) ||
              (accusedRegisterFormData?.respondentType?.code !== "REPRESENTATIVE" && !accusedRegisterFormData?.respondentCompanyName))
              ? false
              : true,
        },
        {
          heading: { label: t("VERIFY_WITH_OTP_HEADER") },
          actionSaveLabel: t("VERIFY_BUTTON_TEXT"),
          actionCancelLabel: t("BACK"),
          modalBody: (
            <OtpComponent
              t={t}
              length={6}
              onOtpChange={onOtpChange}
              otp={otp}
              size={6}
              otpEnterTime={25}
              onResend={onResendOtp}
              mobileNumber={accusedRegisterFormData?.phoneNumber}
            />
          ),
          actionSaveOnSubmit: async () => {
            return await otpVerificationAction();
          },
          actionCancelOnSubmit: () => {
            setOtp("");
          },
          isDisabled: otp?.length === 6 ? false : true,
        },
        !isAccusedRegistered && {
          heading: { label: t("ID_VERIFICATION_HEADER") },
          actionSaveLabel: t("REGISTER_RESPONDENT"),
          actionCancelLabel: t("BACK"),
          modalBody: (
            <UploadIdType
              config={uploadIdConfig}
              isAdvocateUploading={true}
              onFormValueChange={(setValue, formData) => {
                const documentData = {
                  fileStore: formData?.SelectUserTypeComponent?.ID_Proof?.[0]?.[1]?.fileStoreId?.fileStoreId,
                  documentType: formData?.SelectUserTypeComponent?.ID_Proof?.[0]?.[1]?.file?.type,
                  identifierType: formData?.SelectUserTypeComponent?.selectIdType?.type,
                  additionalDetails: {
                    fileName: formData?.SelectUserTypeComponent?.ID_Proof?.[0]?.[1]?.file?.name,
                    fileType: "respondent-response",
                  },
                };
                if (!isEqual(documentData, registerId)) setRegisterId(documentData);

                if (!isEqual(accusedIdVerificationDocument, formData)) setAccusedIdVerificationDocument(formData);
              }}
            />
          ),
          actionSaveOnSubmit: async () => {
            const data = {
              firstName: accusedRegisterFormData?.respondentFirstName,
              middleName: accusedRegisterFormData?.respondentMiddleName,
              lastName: accusedRegisterFormData?.respondentLastName,
              userDetails: {
                mobileNumber: userData?.info?.mobileNumber,
                username: userData?.info?.userName,
                userUuid: userData?.info?.uuid,
                userId: userData?.info?.id,
                roles: [
                  {
                    code: "CITIZEN",
                    name: "Citizen",
                    tenantId: tenantId,
                  },
                  ...[
                    "CASE_CREATOR",
                    "CASE_EDITOR",
                    "CASE_VIEWER",
                    "EVIDENCE_CREATOR",
                    "EVIDENCE_VIEWER",
                    "EVIDENCE_EDITOR",
                    "APPLICATION_CREATOR",
                    "APPLICATION_VIEWER",
                    "HEARING_VIEWER",
                    "ORDER_VIEWER",
                    "SUBMISSION_CREATOR",
                    "SUBMISSION_RESPONDER",
                    "SUBMISSION_DELETE",
                    "TASK_VIEWER",
                    "PENDING_TASK_CREATOR",
                    "ADVOCATE_VIEWER",
                    "CASE_RESPONDER",
                    "HEARING_ACCEPTOR",
                  ]?.map((role) => ({
                    code: role,
                    name: role,
                    tenantId: tenantId,
                  })),
                ],
                type: userData?.info?.type,
              },
              addressDetails: [
                ...accusedRegisterFormData?.addressDetails?.map((address) => {
                  return {
                    ...address,
                    tenantId: tenantId,
                    type: "PERMANENT",
                  };
                }),
              ],
            };
            const documentData = {
              fileStoreId: accusedIdVerificationDocument?.SelectUserTypeComponent?.ID_Proof?.[0]?.[1]?.fileStoreId?.fileStoreId,
              fileName: accusedIdVerificationDocument?.SelectUserTypeComponent?.ID_Proof?.[0]?.[1]?.file?.name,
              fileType: accusedIdVerificationDocument?.SelectUserTypeComponent?.ID_Proof?.[0]?.[1]?.file?.type,
              identifierType: accusedIdVerificationDocument?.SelectUserTypeComponent?.selectIdType?.type,
            };
            return await updateRespondentDetails(data, documentData);
          },
          actionCancelType: "JUMP",
          jumpValue: 2,
          async: true,
          actionCancelOnSubmit: () => {
            setOtp("");
          },
          isDisabled: registerId?.fileStore && Boolean(accusedIdVerificationDocument?.SelectUserTypeComponent?.selectIdType?.type) ? false : true,
        },
        {
          type: "success",
          hideSubmit: true,
          modalBody: (
            <CustomStepperSuccess
              successMessage={isAccusedRegistered ? "ACCUSED_MOBILE_REGISTERED" : "RESPONDENT_DETAILS_VERIFIED"}
              bannerSubText={"EDIT_REQUEST_FROM_COMPLAINANT"}
              submitButtonAction={() => {
                setOtp("");
                setAccusedRegisterFormData({});
                setShowEditRespondentDetailsModal(false);
                if (isAccusedRegistered) closeModal();
                else setShow(true);
              }}
              submitButtonText={"NEXT"}
              t={t}
            />
          ),
        },
      ].filter(Boolean),
    };
  }, [
    accusedRegisterFormData,
    accusedRegisterFormDataError,
    otp,
    isAccusedRegistered,
    registerId,
    accusedIdVerificationDocument,
    registerRespondentFormAction,
    otpVerificationAction,
    userData?.info?.mobileNumber,
    userData?.info?.userName,
    userData?.info?.uuid,
    userData?.info?.id,
    userData?.info?.type,
    tenantId,
    updateRespondentDetails,
  ]);

  const confirmSummonConfig = useMemo(() => {
    return {
      handleClose: () => {
        setShowConfirmSummonModal(false);
      },
      heading: { label: "" },
      actionSaveLabel: "",
      isStepperModal: true,
      actionSaveOnSubmit: () => {},
      steps: [
        {
          heading: { label: "Confirm your attendance to the hearing" },
          actionSaveLabel: "Yes",
          actionCancelLabel: "No",
          modalBody: <CustomCaseInfoDiv t={t} data={attendanceDetails} column={2} />,
          actionSaveOnSubmit: async () => {
            const resp = await onConfirmAttendee("Respondent");
            if (resp.continue) setShowConfirmSummonModal(false);
          },
          actionCancelOnSubmit: () => setShowConfirmSummonModal(false),
        },
      ].filter(Boolean),
    };
  }, [attendanceDetails, t]);

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
              : ((step === 0 && caseDetails?.cnrNumber) || step !== 0) && t(JoinHomeLocalisation.JOIN_CASE_BACK_TEXT)
          }
          actionCustomLabel={step === 1 ? t(JoinHomeLocalisation.JOIN_CASE_BACK_TEXT) : ""}
          actionCancelOnSubmit={() => {
            if (step === 0 && caseDetails?.cnrNumber) {
              setCaseDetails({});
            } else if (step === 1) {
              handleDownloadPDF();
            } else if (step === 6) {
              setStep(step - 3);
            } else if (step === 7) {
              if (userType?.value === "Litigant") setStep(step - 6);
              else {
                if (roleOfNewAdvocate?.value === "PRIMARY_ADVOCATE") setStep(step - 1);
                else setStep(step - 4);
              }
              setValidationCode("");
              setErrors({
                ...errors,
                validationCode: undefined,
              });
            } else if (step === 3 && userType?.value === "Advocate") {
              setStep(step - 1);
            } else setStep(step - 1);
            setIsDisabled(false);
          }}
          actionCustomLabelSubmit={() => {
            if (step === 1) {
              setStep(step - 1);
              setIsDisabled(false);
              setValidationCode("");
              setIsVerified(false);
            }
          }}
          actionSaveLabel={
            step === 2 && roleOfNewAdvocate?.value === "SUPPORTING_ADVOCATE"
              ? t("GOT_IT_TEXT")
              : // : step === 3
              // ? "E-Sign"
              step === 4
              ? "Done"
              : step === 5
              ? "Make Payment"
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
          headerBarMain={<Heading label={step === 4 ? "E-Sign" : step === 5 ? "Payment" : t("SEARCH_NEW_CASE")} />}
          className={`join-a-case-modal ${success && "case-join-success"}`}
          isDisabled={isDisabled}
          isBackButtonDisabled={step === 1 && !isVerified}
          popupStyles={{ width: "fit-content", userSelect: "none" }}
          customActionStyle={{ background: "#fff", boxShadow: "none", border: "1px solid #007e7e" }}
          customActionTextStyle={{ color: "#007e7e" }}
        >
          {step >= 0 && modalItem[step]?.modalMain}
          {(step === 4 || step === 5) && (
            <Button
              className={"skip-button"}
              label={t(JoinHomeLocalisation.SKIP_LATER)}
              onButtonClick={() => {
                if (userType?.value === "Litigant") {
                  setStep(7);
                  setBarRegNumber("");
                  setAdvocateDetailForm({});
                } else {
                  if (roleOfNewAdvocate?.value) {
                    setStep(6);
                    if (step === 4) {
                      setIsSignedAdvocate(false);
                      setIsSignedParty(false);
                    } else if (step === 5) {
                    }
                  } else {
                    setStep(7);
                  }
                }
              }}
            />
          )}
        </Modal>
      )}
      {showEditRespondentDetailsModal && <DocumentModal config={registerRespondentConfig} documentStyle={{ zIndex: "1000" }} />}
      {showConfirmSummonModal && <DocumentModal config={confirmSummonConfig} />}
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
