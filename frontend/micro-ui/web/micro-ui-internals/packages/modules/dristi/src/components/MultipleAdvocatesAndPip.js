import { Loader, UploadIcon } from "@egovernments/digit-ui-react-components";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { ReactComponent as CrossIcon } from "../images/cross.svg";
import { CustomAddIcon, FileUploadIcon } from "../icons/svgIndex";

import Button from "./Button";
import { getAuthorizedUuid } from "../Utils";
import { userTypeOptions } from "../pages/citizen/registration/config";
import useSearchCaseService from "../hooks/dristi/useSearchCaseService";
import { CustomDeleteIcon } from "../icons/svgIndex";
import isEqual from "lodash/isEqual";
import CustomErrorTooltip from "./CustomErrorTooltip";
import RenderFileCard from "./RenderFileCard";
import { FileUploader } from "react-drag-drop-files";
import { useToast } from "./Toast/useToast";
import { FSOErrorIcon } from "../icons/svgIndex";
import { CaseWorkflowState } from "../Utils/caseWorkflow";
import SearchableDropdown from "./SearchableDropdown";
import { AdvocateDataContext } from "@egovernments/digit-ui-module-core";

function ScrutinyInfoAdvocate({ message, t }) {
  return (
    <div style={{ backgroundColor: "#fce8e8", marginBottom: 8, padding: 6, borderRadius: 5 }}>
      <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", gap: "10px", marginBottom: 8 }}>
        <FSOErrorIcon />
        <div style={{ fontWeight: 700 }}>{t("CS_FSO_MARKED_ERROR")}</div>
      </div>
      {t(message)}
    </div>
  );
}

function splitNamesPartiallyFromFullName(fullName) {
  const nameParts = fullName?.trim()?.split(/\s+/);

  let firstName = "";
  let middleName = "";
  let lastName = "";

  const numParts = nameParts?.length;

  if (numParts === 1) {
    firstName = nameParts?.[0];
  } else if (numParts === 2) {
    firstName = nameParts?.[0];
    lastName = nameParts?.[1];
  } else if (numParts >= 3) {
    firstName = nameParts?.[0];
    lastName = nameParts?.[numParts - 1];
    middleName = nameParts?.slice(1, numParts - 1)?.join(" ");
  }

  return {
    firstName: firstName,
    middleName: middleName,
    lastName: lastName ? lastName : "",
  };
}

const DragDropJSX = ({ t, currentValue, error }) => {
  return (
    <React.Fragment>
      <div className={`drag-drop-container-desktop${error ? " alert-error-border" : ""}`}>
        <UploadIcon />
        <p className="drag-drop-text">
          {t("WBH_DRAG_DROP")} <text className="browse-text">{t("WBH_BULK_BROWSE_FILES")}</text>
        </p>
      </div>
      <div className="drag-drop-container-mobile">
        <div className={`file-count-class ${currentValue && currentValue.length > 0 ? "uploaded" : ""}`}>
          <h3>{currentValue && currentValue.length > 0 ? `${currentValue.length} File uploaded` : "No file selected"} </h3>
        </div>
        <div className="button-class">
          <div>
            <FileUploadIcon />
          </div>
          <h3>{t("CS_COMMON_CHOOSE_FILE")}</h3>
        </div>
      </div>
      {error && <span className="alert-error">{t(error.msg || error.message || "CORE_REQUIRED_FIELD_ERROR")}</span>}
    </React.Fragment>
  );
};

function MultipleAdvocatesAndPip({ t, config, onSelect, formData, errors, setError, clearErrors }) {
  const token = window.localStorage.getItem("token");
  const isUserLoggedIn = Boolean(token);
  const moduleCode = "DRISTI";
  const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
  const userUuid = userInfo?.uuid;
  const authorizedUuid = getAuthorizedUuid(userUuid);
  const tenantId = window.localStorage.getItem("tenant-id");
  const urlParams = new URLSearchParams(window.location.search);
  const caseId = urlParams.get("caseId");
  const [isApproved, setIsApproved] = useState(false);
  const toast = useToast();
  const { AdvocateData } = useContext(AdvocateDataContext);
  const selectedSeniorAdvocate = AdvocateData;
  const { id: selectedAdvocateId, advocateName, uuid: selectedAdvocateUuid } = selectedSeniorAdvocate || {};

  const [advocateAndPipData, setAdvocateAndPipData] = useState(
    formData?.[config?.key]
      ? formData?.[config?.key]
      : {
          boxComplainant: {
            firstName: "",
            middleName: "",
            lastName: "",
            individualId: "",
            mobileNumber: "",
            index: 0,
          },
          numberOfAdvocates: 0,
          isComplainantPip: {
            code: "NO",
            name: "No",
            isEnabled: true,
          },
          multipleAdvocateNameDetails: [],
          showVakalatNamaUpload: true,
          showAffidavit: false,
          vakalatnamaFileUpload: null,
          pipAffidavitFileUpload: null,
        }
  );

  useEffect(() => {
    if (formData?.multipleAdvocatesAndPip && !isEqual(advocateAndPipData, formData?.multipleAdvocatesAndPip)) {
      setAdvocateAndPipData(formData?.multipleAdvocatesAndPip);
    }
  }, [formData, advocateAndPipData, onSelect, config?.key]);

  const radioInput = useMemo(() => {
    const radioInput = config?.populators?.inputs?.find((input) => input?.type === "radioInput");
    if (radioInput) {
      return radioInput;
    } else
      return {
        type: "radioInput",
        label: "CS_IF_COMPLAINANT_IS_PIP",
        name: "isComplainantPip",
        options: [
          {
            code: "YES",
            name: "Yes",
            isEnabled: true,
          },
          {
            code: "NO",
            name: "No",
            isEnabled: true,
          },
        ],
      };
  }, [config?.populators?.inputs]);

  const inputs = useMemo(() => {
    const nameInputs = config?.populators?.inputs?.filter((input) => input?.type === "textInput" && input?.name !== "numberOfAdvocates");
    if (nameInputs?.length > 0) {
      return nameInputs;
    } else
      return [
        {
          type: "textInput",
          label: "FIRST_NAME",
          name: "firstName",
        },
        {
          type: "textInput",
          label: "MIDDLE_NAME_OPTIONAL",
          name: "middleName",
        },
        {
          type: "textInput",
          label: "LAST_NAME",
          name: "lastName",
        },
      ];
  }, [config?.populators?.inputs]);

  const numberOfAdvocatesInput = useMemo(() => {
    const numberOfAdvocatesInput = config?.populators?.inputs?.find((input) => input?.name === "numberOfAdvocates");
    if (numberOfAdvocatesInput) {
      return numberOfAdvocatesInput;
    } else
      return {
        type: "textInput",
        label: "CS_NUMBER_OF_ADVOCATES",
        name: "numberOfAdvocates",
      };
  }, [config?.populators?.inputs]);

  const noteInput = useMemo(() => {
    const noteInput = config?.populators?.inputs?.find((input) => input?.type === "InfoComponent");
    if (noteInput) {
      return noteInput;
    } else
      return {
        infoHeader: "CS_PLEASE_NOTE",
        infoText: "AFFIDAVIT_NECESSARY_FOR_PIP",
        infoTooltipMessage: "ADVOCATE_DETAIL_NOTE",
        type: "InfoComponent",
      };
  }, [config?.populators?.inputs]);

  const fileInputs = useMemo(() => {
    const fileInputs = config?.populators?.inputs?.filter((input) => input?.type === "DragDropComponent");
    if (fileInputs?.length > 0) {
      return fileInputs;
    } else
      return [
        {
          fileKey: "vakalatnamaFileUpload",
          type: "DragDropComponent",
          name: "document",
          isDocDependentOn: "multipleAdvocatesAndPip",
          isDocDependentKey: "showVakalatNamaUpload",
          documentHeader: "UPLOAD_VAKALATNAMA",
          infoTooltipMessage: "UPLOAD_VAKALATNAMA",
          uploadGuidelines: "UPLOAD_DOC_10",
          maxFileSize: 10,
          maxFileErrorMessage: "CS_FILE_LIMIT_10_MB",
          fileTypes: ["JPG", "PDF", "PNG"],
          isMultipleUpload: true,
          downloadTemplateText: "VAKALATNAMA_TEMPLATE_TEXT",
          downloadTemplateLink:
            "https://oncourts.kerala.gov.in/minio-filestore/v1/files/id?tenantId=kl&fileStoreId=eb7407fb-5642-40d9-9f06-31e4895c75b0",
        },
        {
          fileKey: "pipAffidavitFileUpload",
          type: "DragDropComponent",
          name: "document",
          isDocDependentOn: "multipleAdvocatesAndPip",
          isDocDependentKey: "showAffidavit",
          documentHeader: "UPLOAD_AFFIDAVIT",
          uploadGuidelines: "UPLOAD_DOC_10",
          maxFileSize: 10,
          maxFileErrorMessage: "CS_FILE_LIMIT_10_MB",
          fileTypes: ["JPG", "PDF", "PNG"],
          isMultipleUpload: true,
        },
      ];
  }, [config?.populators?.inputs]);

  const { data: caseData, refetch: refetchCaseData, isCaseLoading } = useSearchCaseService(
    {
      criteria: [
        {
          caseId: caseId,
          defaultFields: false,
        },
      ],
      tenantId,
    },
    {},
    `dristi-${caseId}`,
    caseId,
    Boolean(caseId)
  );

  const caseDetails = useMemo(
    () => ({
      ...caseData?.criteria?.[0]?.responseList?.[0],
    }),
    [caseData]
  );

  const litigants = useMemo(() => {
    return caseDetails?.litigants
      ?.filter((litigant) => litigant.partyType.includes("complainant"))
      ?.map((litigant) => ({
        ...litigant,
        poaHolder: caseDetails?.poaHolders?.find((poaHolder) =>
          poaHolder?.representingLitigants?.some((complainant) => complainant?.individualId === litigant?.individualId)
        ),
      }));
  }, [caseDetails]);

  const isCaseReAssigned = useMemo(() => {
    const caseStatus = caseDetails?.status;
    if (caseStatus === CaseWorkflowState.CASE_REASSIGNED) {
      if (caseDetails?.additionalDetails?.judge?.comment) {
        return { vakalatnamaFileUpload: true, pipAffidavitFileUpload: true, numberOfAdvocates: true };
      }
      let errorMssg = {};
      const curentFormIndex = advocateAndPipData?.boxComplainant?.index;
      const currentFormErrorObject =
        caseDetails?.additionalDetails?.scrutiny?.data?.additionalDetails?.advocateDetails?.form?.[curentFormIndex] || {};
      if (Object.keys(currentFormErrorObject)?.length > 0) {
        if (
          currentFormErrorObject?.hasOwnProperty("multipleAdvocatesAndPip.vakalatnamaFileUpload.document") &&
          currentFormErrorObject?.["multipleAdvocatesAndPip.vakalatnamaFileUpload.document"]?.FSOError
        ) {
          errorMssg = {
            ...errorMssg,
            vakalatnamaFileUpload: true,
            vakalatnamaFileUploadMessage: currentFormErrorObject?.["multipleAdvocatesAndPip.vakalatnamaFileUpload.document"]?.FSOError || "",
          };
        }
        if (
          currentFormErrorObject?.hasOwnProperty("multipleAdvocatesAndPip.pipAffidavitFileUpload.document") &&
          currentFormErrorObject?.["multipleAdvocatesAndPip.pipAffidavitFileUpload.document"]?.FSOError
        ) {
          errorMssg = {
            ...errorMssg,
            pipAffidavitFileUpload: true,
            pipAffidavitFileUploadMessage: currentFormErrorObject?.["multipleAdvocatesAndPip.pipAffidavitFileUpload.document"]?.FSOError || "",
          };
        }
        if (
          currentFormErrorObject?.hasOwnProperty("multipleAdvocatesAndPip.numberOfAdvocates") &&
          currentFormErrorObject?.["multipleAdvocatesAndPip.numberOfAdvocates"]?.FSOError
        ) {
          errorMssg = {
            ...errorMssg,
            numberOfAdvocates: true,
            numberOfAdvocatesMessage: currentFormErrorObject?.["multipleAdvocatesAndPip.numberOfAdvocates"]?.FSOError || "",
          };
        }

        if (Object.keys(errorMssg)?.length > 0) {
          return errorMssg;
        } else return { reassigned: true };
      } else return { reassigned: true };
    }
    return false;
  }, [caseDetails, advocateAndPipData]);

  const { data, isLoading, refetch } = window?.Digit.Hooks.dristi.useGetIndividualUser(
    {
      Individual: {
        userUuid: selectedAdvocateUuid ? [selectedAdvocateUuid] : [userInfo?.uuid], //If clerk/junior adv is filing case, details of respective office advocate should be fetched.
      },
    },
    { tenantId, limit: 1000, offset: 0 },
    `${moduleCode}-${userInfo?.uuid}-${selectedAdvocateUuid || ""}`,
    "HOME",
    userInfo?.uuid && isUserLoggedIn
  );

  const individualId = useMemo(() => data?.Individual?.[0]?.individualId, [data?.Individual]);
  const userType = useMemo(() => data?.Individual?.[0]?.additionalFields?.fields?.find((obj) => obj.key === "userType")?.value, [data?.Individual]);

  const { data: searchData, isLoading: isSearchLoading } = window?.Digit.Hooks.dristi.useGetAdvocateClerk(
    {
      criteria: [{ individualId }],
      tenantId,
    },
    { tenantId },
    moduleCode,
    Boolean(isUserLoggedIn && individualId && userType === "ADVOCATE"),
    "/advocate/v1/_search"
  );

  const userTypeDetail = useMemo(() => {
    return userTypeOptions.find((item) => item?.code === userType) || {};
  }, [userType]);

  const searchResult = useMemo(() => {
    return userType === "ADVOCATE" && searchData?.[`${userTypeDetail?.apiDetails?.requestKey}s`]?.[0]?.responseList;
  }, [searchData, userTypeDetail?.apiDetails?.requestKey, userType]);

  const isApprovalPending = useMemo(() => {
    return (
      userType === "ADVOCATE" &&
      Array.isArray(searchResult) &&
      searchResult?.length > 0 &&
      searchResult?.[0]?.isActive === false &&
      searchResult?.[0]?.status !== "INACTIVE"
    );
  }, [searchResult, userType]);

  useEffect(() => {
    const isPending = isApprovalPending;
    setIsApproved(!isPending);
  }, []);

  const fetchIndividualInfo = async (individualId) => {
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

  const { data: selectedIndividual, isLoading: isInidividualLoading } = window?.Digit.Hooks.dristi.useGetIndividualUser(
    {
      Individual: {
        individualId: individualId,
      },
    },
    { tenantId, limit: 1000, offset: 0 },
    moduleCode,
    `getindividual-${individualId}`,
    individualId
  );

  useEffect(() => {
    if (
      (userType === "ADVOCATE" &&
        advocateAndPipData?.multipleAdvocateNameDetails?.[0]?.advocateBarRegNumberWithName?.individualId !== individualId &&
        advocateAndPipData?.boxComplainant?.index === 0 &&
        advocateAndPipData?.boxComplainant?.individualId) ||
      (advocateAndPipData?.multipleAdvocateNameDetails?.[0]?.advocateBarRegNumberWithName?.individualId === individualId &&
        advocateAndPipData?.boxComplainant?.index === 0 &&
        advocateAndPipData?.boxComplainant?.individualId &&
        selectedIndividual &&
        advocateAndPipData?.multipleAdvocateNameDetails?.[0]?.advocateNameDetails?.advocateMobileNumber !==
          selectedIndividual?.Individual?.[0]?.mobileNumber)
    ) {
      const advData = advocateAndPipData?.multipleAdvocateNameDetails;
      if (isApproved && searchResult) {
        const barRegNum = searchResult[0]?.barRegistrationNumber;
        const userName = searchResult[0]?.additionalDetails?.username;
        const advocateId = searchResult[0]?.id;
        const advocateUuid = searchResult[0]?.auditDetails?.createdBy;
        const individualId = searchResult[0]?.individualId;
        const advocateBarRegNumberWithName = {
          barRegistrationNumber: `${barRegNum} (${userName})`,
          advocateName: userName,
          isDisable: true,
          barRegistrationNumberOriginal: barRegNum,
          advocateId,
          advocateUuid,
          individualId,
        };

        const idType = selectedIndividual?.Individual?.[0]?.identifiers[0]?.identifierType || "";
        const identifierIdDetails = JSON.parse(
          selectedIndividual?.Individual?.[0]?.additionalFields?.fields?.find((obj) => obj.key === "identifierIdDetails")?.value || "{}"
        );

        const advocateNameDetails = {
          firstName: splitNamesPartiallyFromFullName(userName)?.firstName,
          middleName: splitNamesPartiallyFromFullName(userName)?.middleName,
          lastName: splitNamesPartiallyFromFullName(userName)?.lastName,
          advocateMobileNumber: selectedIndividual?.Individual?.[0]?.mobileNumber || "",
          advocateIdProof: identifierIdDetails?.fileStoreId
            ? [
                {
                  name: idType,
                  fileStore: identifierIdDetails?.fileStoreId,
                  documentName: identifierIdDetails?.filename,
                  fileName: "ID Proof",
                },
              ]
            : null,
        };
        let newData = structuredClone(advocateAndPipData);
        if (advData?.length === 0 || Object.keys(advData?.[0] || {})?.length === 0) {
          const updatedData = [{ advocateBarRegNumberWithName, advocateNameDetails }];
          newData = { ...advocateAndPipData, multipleAdvocateNameDetails: updatedData, showVakalatNamaUpload: true, showAffidavit: false };
        } else if (
          advData?.length === 1 &&
          advData?.[0]?.advocateBarRegNumberWithName?.individualId &&
          advData?.[0]?.advocateBarRegNumberWithName?.individualId === individualId &&
          advData?.[0]?.advocateNameDetails?.advocateMobileNumber !== selectedIndividual?.Individual?.[0]?.mobileNumber
        ) {
          const updatedData = [{ advocateBarRegNumberWithName, advocateNameDetails }];
          newData = { ...advocateAndPipData, multipleAdvocateNameDetails: updatedData, showVakalatNamaUpload: true, showAffidavit: false };
        } else if (
          advData?.length > 0 &&
          advData?.[0]?.advocateBarRegNumberWithName?.individualId &&
          advData?.[0]?.advocateBarRegNumberWithName?.individualId !== individualId &&
          (userType === "ADVOCATE" ? authorizedUuid === userUuid : true) &&
          caseDetails?.status === CaseWorkflowState.DRAFT_IN_PROGRESS // Append filing advocate automatically only while  in filing stage, not thereafter (like case reassigned stage)
        ) {
          const firstAdvocate = { advocateBarRegNumberWithName, advocateNameDetails };
          const updatedData = [firstAdvocate, ...advData];
          newData = { ...advocateAndPipData, multipleAdvocateNameDetails: updatedData, showVakalatNamaUpload: true, showAffidavit: false };
        }
        if (!isEqual(advocateAndPipData, newData)) {
          setAdvocateAndPipData(newData);
          onSelect(config.key, newData);
        }
      }
    }
  }, [
    isApproved,
    onSelect,
    searchResult,
    selectedIndividual,
    userType,
    config?.key,
    individualId,
    formData,
    advocateAndPipData,
    caseDetails?.status,
    authorizedUuid,
    userUuid,
  ]);

  const handleInputChange = async (index, field, value) => {
    const updatedData = structuredClone(advocateAndPipData?.multipleAdvocateNameDetails);

    if (field === "advocateBarRegNumberWithName") {
      if (!value) {
        // Reset index data if value is null
        updatedData[index] = {
          advocateBarRegNumberWithName: {},
          advocateNameDetails: {},
        };
      } else {
        const advocateFullname = value?.advocateName || "";
        updatedData[index].advocateBarRegNumberWithName = value;
        const advIndividualId = value?.individualId || null;
        const advocateIndvidualData = await fetchIndividualInfo(advIndividualId);
        const identifierIdDetails = JSON.parse(
          advocateIndvidualData?.Individual?.[0]?.additionalFields?.fields?.find((obj) => obj.key === "identifierIdDetails")?.value || "{}"
        );
        const idType = advocateIndvidualData?.Individual?.[0]?.identifiers[0]?.identifierType || "";

        updatedData[index].advocateNameDetails = {
          firstName: splitNamesPartiallyFromFullName(advocateFullname)?.firstName,
          middleName: splitNamesPartiallyFromFullName(advocateFullname)?.middleName,
          lastName: splitNamesPartiallyFromFullName(advocateFullname)?.lastName,
          advocateMobileNumber: advocateIndvidualData?.Individual?.[0]?.mobileNumber || "",
          advocateIdProof: identifierIdDetails?.fileStoreId
            ? [
                {
                  name: idType,
                  fileStore: identifierIdDetails?.fileStoreId,
                  documentName: identifierIdDetails?.filename,
                  fileName: "ID Proof",
                },
              ]
            : null,
        };
      }
    }

    const newData = { ...advocateAndPipData, multipleAdvocateNameDetails: updatedData };
    setAdvocateAndPipData(newData);
    onSelect(config.key, newData);
  };

  const handleAddAdvocate = () => {
    // If there are no advoate details present currently, only add advocate button is present and no upload vakalatnama
    if (
      !advocateAndPipData?.multipleAdvocateNameDetails ||
      (advocateAndPipData?.multipleAdvocateNameDetails?.length === 1 && Object.keys(advocateAndPipData?.multipleAdvocateNameDetails[0]).length === 0)
    ) {
      const multipleAdvocateNameDetails = [
        {
          advocateBarRegNumberWithName: {},
          advocateNameDetails: {},
        },
      ];
      const newData = { ...advocateAndPipData, multipleAdvocateNameDetails, showVakalatNamaUpload: true, showAffidavit: false };
      setAdvocateAndPipData(newData);
      onSelect(config.key, newData);
    } else {
      const multipleAdvocateNameDetails = [
        ...advocateAndPipData?.multipleAdvocateNameDetails,
        {
          advocateBarRegNumberWithName: {},
          advocateNameDetails: {},
        },
      ];
      const neData = { ...advocateAndPipData, multipleAdvocateNameDetails };
      setAdvocateAndPipData(neData);
      onSelect(config.key, neData);
    }
  };

  const handleDeleteAdvocate = (index) => {
    if (advocateAndPipData?.multipleAdvocateNameDetails?.length === 1) {
      const newData = { ...advocateAndPipData, multipleAdvocateNameDetails: [{}], showVakalatNamaUpload: false };
      setAdvocateAndPipData(newData);
      onSelect(config.key, newData);
    } else {
      const newAdvData = advocateAndPipData?.multipleAdvocateNameDetails.filter((_, i) => i !== index);
      const newData = { ...advocateAndPipData, multipleAdvocateNameDetails: newAdvData };
      setAdvocateAndPipData(newData);
      onSelect(config.key, newData);
    }
  };

  const handleRadioChange = (value) => {
    const isComplainantPip = {
      code: value,
      name: value === "YES" ? "Yes" : "No",
      isEnabled: true,
    };

    const newData = {
      ...advocateAndPipData,
      isComplainantPip,
      multipleAdvocateNameDetails: value === "YES" ? [{}] : advocateAndPipData?.multipleAdvocateNameDetails,
      showVakalatNamaUpload:
        value === "YES"
          ? false
          : Array.isArray(advocateAndPipData?.multipleAdvocateNameDetails) &&
            Object.keys(advocateAndPipData?.multipleAdvocateNameDetails?.[0])?.length !== 0,
      showAffidavit: value === "YES" ? true : false,
      vakalatnamaFileUpload: value === "YES" ? null : advocateAndPipData?.vakalatnamaFileUpload,
      pipAffidavitFileUpload: value === "NO" ? null : advocateAndPipData?.pipAffidavitFileUpload,
    };
    setAdvocateAndPipData(newData);
    onSelect(config.key, newData);
  };

  const fileValidator = (file, input) => {
    if (file?.fileStore) return null;
    const maxFileSize = input?.maxFileSize * 1024 * 1024;
    return file?.size > maxFileSize ? `${t("CS_YOUR_FILE_EXCEEDED_THE")} ${input?.maxFileSize}${t("CS_COMMON_LIMIT_MB")}` : null;
  };

  const handleChange = (file, input, index = Infinity) => {
    let currentValue = (advocateAndPipData && advocateAndPipData[input.fileKey] && advocateAndPipData[input.fileKey][input.name]) || [];

    const maxFileSize = input?.maxFileSize * 1024 * 1024;
    if (file?.size > maxFileSize) {
      setError(config.key, { message: `${t("CS_YOUR_FILE_EXCEEDED_THE")} ${input?.maxFileSize}${t("CS_COMMON_LIMIT_MB")}` });
      return;
    } else if (clearErrors) {
      clearErrors(config.key);
    }

    currentValue.splice(index, 1, file);
    currentValue = currentValue.map((item) => {
      if (item?.name) {
        const fileNameParts = item?.name.split(".");
        const extension = fileNameParts.pop().toLowerCase();
        const fileNameWithoutExtension = fileNameParts.join(".");
        return new File([item], `${fileNameWithoutExtension}.${extension}`, {
          type: item?.type,
          lastModified: item?.lastModified,
        });
      } else {
        return item;
      }
    });

    const fileKey = input?.fileKey;
    const name = input?.name;

    const newData = { ...advocateAndPipData, [input?.fileKey]: { [input?.name]: currentValue } };
    onSelect(config?.key, newData);
    setAdvocateAndPipData(newData);
  };

  const handleDeleteFile = (input, index) => {
    let currentValue = (advocateAndPipData && advocateAndPipData[input.fileKey] && advocateAndPipData[input.fileKey][input.name]) || [];

    currentValue.splice(index, 1); // check- TODO: handle clear file error
    const newData = { ...advocateAndPipData, [input?.fileKey]: { [input?.name]: currentValue } };
    onSelect(config?.key, newData);
    setAdvocateAndPipData(newData);
  };

  const disableRadio = useMemo(() => {
    return Boolean(
      (userType === "ADVOCATE" && advocateAndPipData?.boxComplainant?.index === 0 && advocateAndPipData?.boxComplainant?.individualId) ||
        litigants?.find((litigant) => litigant?.individualId === advocateAndPipData?.boxComplainant?.individualId)?.poaHolder
    );
  }, [userType, advocateAndPipData, litigants]);

  if (isCaseLoading) {
    return <Loader></Loader>;
  }

  return (
    <div className="main-div">
      <div
        className="box-complainant-details-div"
        style={{
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
          marginBottom: "20px",
          height: "25px",
          gap: "10px",
        }}
      >
        <span style={{ fontSize: "16px", fontWeight: 700 }}>Complainant {advocateAndPipData?.boxComplainant?.index + 1 || 1}</span>
        <span style={{ fontSize: "16px" }}>{advocateAndPipData?.boxComplainant?.firstName || ""}</span>
      </div>
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-start",
          gap: "30px",
          marginBottom: advocateAndPipData?.showVakalatNamaUpload ? "10px" : "0px",
          pointerEvents: !isCaseReAssigned ? "auto" : "none",
        }}
        className="radio-div"
      >
        {/* Question Text */}
        <div
          style={{
            fontSize: "16px",
            color: "#0A0A0A",
            marginBottom: "16px",
            fontWeight: 700,
          }}
        >
          {t(radioInput?.label)}
        </div>

        {/* Radio Options */}
        <div
          style={{
            display: "flex",
            gap: "16px",
          }}
        >
          {radioInput?.options.map((option) => {
            const isChecked = advocateAndPipData?.isComplainantPip?.code === option?.code;
            return (
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <input
                  type="radio"
                  name="isPip"
                  value={option?.code}
                  disabled={disableRadio}
                  onChange={() => handleRadioChange(option?.code)}
                  checked={isChecked}
                  style={{
                    width: "24px",
                    height: "24px",
                    border: `1px solid ${disableRadio ? (isChecked ? "#E6E6E6" : "#3D3C3C") : "var(--Primary-Pucar-Teal, #007E7E)"}`,
                    borderRadius: "50%",
                    background: isChecked ? (disableRadio ? "#E6E6E6" : "var(--Primary-Pucar-Teal, #007E7E)") : "transparent",
                    appearance: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    cursor: disableRadio ? "auto" : "pointer",
                    boxShadow: advocateAndPipData?.isComplainantPip?.code === option?.code ? "inset 0 0 0 5px white" : "none",
                    transition: "all 0.3s ease",
                  }}
                />
                <span
                  style={{
                    fontSize: "16px",
                    color: "#333",
                    cursor: "auto",
                  }}
                >
                  {option?.name}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {advocateAndPipData?.showVakalatNamaUpload && (
        <div style={{ color: "#0A0A0A", fontWeight: 700, fontSize: "16px", marginBottom: "15px" }}>{t(config?.labelHeading)}</div>
      )}
      {!advocateAndPipData?.showAffidavit && (
        <React.Fragment>
          {isCaseReAssigned && isCaseReAssigned.hasOwnProperty("numberOfAdvocates") && isCaseReAssigned?.numberOfAdvocatesMessage && (
            <ScrutinyInfoAdvocate message={isCaseReAssigned?.numberOfAdvocatesMessage} t={t}></ScrutinyInfoAdvocate>
          )}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "30px",
              pointerEvents: isCaseReAssigned ? (isCaseReAssigned.hasOwnProperty("numberOfAdvocates") ? "auto" : "none") : "auto",
            }}
          >
            <div
              style={{
                fontSize: "16px",
                color: "#0A0A0A",
                marginBottom: "16px",
                fontWeight: 700,
              }}
            >
              {t(numberOfAdvocatesInput?.label)}
            </div>

            <div style={{ textAlign: "left", marginBottom: "20px" }}>
              <input
                type="text"
                value={advocateAndPipData?.numberOfAdvocates || ""}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, ""); // Allow only numbers
                  const numberOfAdvocates = value ? parseInt(value, 10) : 0;
                  const newData = { ...advocateAndPipData, numberOfAdvocates };
                  setAdvocateAndPipData(newData);
                  onSelect(config.key, newData);
                }}
                style={{
                  padding: "10px",
                  fontSize: "16px",
                  border: "1px solid #3D3C3C",
                  borderRadius: "0px",
                }}
              />
            </div>
          </div>
          <div
            className="advocate-details-div"
            style={{ pointerEvents: isCaseReAssigned ? (isCaseReAssigned.hasOwnProperty("numberOfAdvocates") ? "auto" : "none") : "auto" }}
          >
            {Array.isArray(advocateAndPipData?.multipleAdvocateNameDetails) &&
              Object.keys(advocateAndPipData?.multipleAdvocateNameDetails?.[0] || {})?.length !== 0 &&
              advocateAndPipData?.multipleAdvocateNameDetails.map((data, index) => {
                return (
                  <div
                    key={index}
                    style={{
                      marginBottom: "0px",
                      padding: "0px",
                      borderRadius: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "0px",
                      }}
                    >
                      <h1 style={{ fontSize: "18px", fontWeight: "bold" }}>Advocate {index + 1}</h1>
                      {!(
                        advocateAndPipData?.boxComplainant?.index === 0 &&
                        advocateAndPipData?.multipleAdvocateNameDetails?.[index]?.advocateBarRegNumberWithName?.individualId === individualId
                      ) && (
                        <span
                          onClick={() => handleDeleteAdvocate(index)}
                          style={{
                            cursor: "pointer",
                            color: "red",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <CustomDeleteIcon />
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "left", gap: "0px" }}>
                      <h1 style={{ fontSize: "14px" }}> {t("BAR_REGISTRATON")}</h1>
                      <SearchableDropdown
                        t={t}
                        isCaseReAssigned={isCaseReAssigned}
                        selectedAdvocatesList={advocateAndPipData?.multipleAdvocateNameDetails}
                        value={data?.advocateBarRegNumberWithName}
                        onChange={(value) => handleInputChange(index, "advocateBarRegNumberWithName", value)}
                        disabled={data?.advocateBarRegNumberWithName?.individualId === individualId}
                      />

                      {data?.advocateBarRegNumberWithName?.barRegistrationNumberOriginal &&
                        inputs.map((input, i) => {
                          return (
                            <div style={{ width: "100%", textAlign: "left", marginBottom: "20px" }}>
                              <label
                                style={{
                                  fontSize: "14px",
                                  display: "block",
                                  marginBottom: "5px",
                                }}
                              >
                                {t(input.label)}
                              </label>
                              <input
                                type="text"
                                value={data?.advocateNameDetails?.[input.name] || ""}
                                //   onChange={(e) => handleInputChange(index, input.name, e.target.value)}
                                style={{
                                  width: "100%",
                                  padding: "10px",
                                  fontSize: "16px",
                                  border: "1px solid #3D3C3C",
                                  borderRadius: "0px",
                                }}
                                disabled={true}
                              />
                            </div>
                          );
                        })}
                    </div>
                  </div>
                );
              })}
            {
              <div>
                <CustomAddIcon />
                <Button
                  className="add-location-btn"
                  label={t("ADD_ADVOCATE")}
                  style={{
                    display: "inline-block",
                    margin: "0 0 20px 0",
                    fontSize: "16px",
                    background: "none",
                    border: "none",
                    textDecoration: "none",
                    cursor: "pointer",
                  }}
                  onButtonClick={handleAddAdvocate}
                />
              </div>
            }
            {advocateAndPipData?.multipleAdvocateNameDetails &&
              advocateAndPipData?.multipleAdvocateNameDetails.length > 0 &&
              !advocateAndPipData?.multipleAdvocateNameDetails.every((item) => Object.keys(item).length === 0) && (
                <div className="custom-note-main-div advocate-document-info" style={{ marginBottom: "24px" }}>
                  <div className="custom-note-heading-div">
                    <CustomErrorTooltip message={t("ADVOCATE_DETAIL_INFO_TOOLTIP")} showTooltip={true} />
                    <h2>{t(noteInput?.infoHeader)}</h2>
                  </div>
                  <div className="custom-note-info-div">
                    <p>{`${t("ADVOCATE_DETAIL_INFO_TOOLTIP")} `}</p>
                  </div>
                </div>
              )}
          </div>
        </React.Fragment>
      )}
      {advocateAndPipData?.showAffidavit && (
        <div className="custom-note-main-div advocate-document-info" style={{ marginBottom: "24px" }}>
          <div className="custom-note-heading-div">
            <CustomErrorTooltip
              message={t(noteInput?.infoTooltipMessage)}
              showTooltip={Boolean(noteInput?.infoTooltipMessage) || noteInput?.showTooltip}
            />
            <h2>{t(noteInput?.infoHeader)}</h2>
          </div>
          <div className="custom-note-info-div">{<p>{`${t(noteInput?.infoText)} `}</p>}</div>
        </div>
      )}
      <div className="fileUpload-div">
        {fileInputs.map((input) => {
          let currentValue = (advocateAndPipData && advocateAndPipData[input.fileKey] && advocateAndPipData[input.fileKey][input.name]) || [];
          let fileErrors = currentValue.map((file) => fileValidator(file, input)); // check file validation
          const showFileUploader = currentValue.length ? input?.isMultipleUpload : true;
          const showDocument =
            input?.isDocDependentOn && input?.isDocDependentKey
              ? formData?.[input?.isDocDependentOn]?.[input?.isDocDependentKey]
              : !input?.hideDocument;
          const message =
            input?.fileKey === "vakalatnamaFileUpload"
              ? isCaseReAssigned?.vakalatnamaFileUploadMessage
              : input?.fileKey === "pipAffidavitFileUpload"
              ? isCaseReAssigned?.pipAffidavitFileUploadMessage
              : "";
          return (
            <div style={{ pointerEvents: isCaseReAssigned ? (isCaseReAssigned.hasOwnProperty(input?.fileKey) ? "auto" : "none") : "auto" }}>
              {showDocument && (
                <div className="drag-drop-visible-main">
                  <div className="drag-drop-heading-main">
                    {
                      <div className="drag-drop-heading" style={{ marginLeft: 0 }}>
                        <h1 className="card-label custom-document-header" style={input?.documentHeaderStyle}>
                          {t(input?.documentHeader)}
                        </h1>

                        {input?.isOptional && <span style={{ color: "#77787B" }}>&nbsp;{`${t(input?.isOptional)}`}</span>}
                        <CustomErrorTooltip message={t(input?.infoTooltipMessage)} showTooltip={Boolean(input?.infoTooltipMessage)} icon />
                      </div>
                    }
                    {input.documentSubText && <p className="custom-document-sub-header">{t(input.documentSubText)}</p>}
                  </div>

                  {isCaseReAssigned && isCaseReAssigned.hasOwnProperty(input?.fileKey) && message && (
                    <ScrutinyInfoAdvocate message={message} t={t}></ScrutinyInfoAdvocate>
                  )}
                  {currentValue.map((file, index) => (
                    <RenderFileCard
                      key={`${input?.name}${index}`}
                      index={index}
                      fileData={file}
                      handleChange={handleChange}
                      handleDeleteFile={handleDeleteFile}
                      t={t}
                      uploadErrorInfo={fileErrors[index]}
                      input={input}
                    />
                  ))}

                  <div className={`file-uploader-div-main ${showFileUploader ? "show-file-uploader" : ""}`}>
                    <FileUploader
                      disabled={input?.disable}
                      handleChange={(data) => {
                        handleChange(data, input);
                      }}
                      name="file"
                      types={
                        input?.fileTypes.includes("JPG") && !input?.fileTypes.includes("JPEG")
                          ? [...input?.fileTypes, "JPEG"]
                          : input?.fileTypes.includes("JPEG") && !input?.fileTypes.includes("JPG")
                          ? [...input?.fileTypes, "JPG"]
                          : input?.fileTypes
                      }
                      children={
                        <DragDropJSX
                          t={t}
                          currentValue={currentValue}
                          error={errors?.[config.key]} //check- TODO: handleError
                        />
                      }
                      key={input?.fileKey}
                      onTypeError={() => {
                        toast.error(t("CS_INVALID_FILE_TYPE"));
                      }}
                    />
                    <div className="upload-guidelines-div">
                      {input?.fileTypes && input?.maxFileSize ? (
                        <p>
                          {`${t("CS_COMMON_CHOOSE_FILE")} ${
                            input?.fileTypes.length > 1
                              ? `${input?.fileTypes
                                  .slice(0, -1)
                                  .map((type) => `.${type.toLowerCase()}`)
                                  .join(", ")} ${t("CS_COMMON_OR")} .${input?.fileTypes[input?.fileTypes.length - 1].toLowerCase()}`
                              : `.${input?.fileTypes[0].toLowerCase()}`
                          }. ${t("CS_MAX_UPLOAD")} ${input.maxFileSize}MB`}
                        </p>
                      ) : (
                        <p>{input.uploadGuidelines}</p>
                      )}
                    </div>
                  </div>
                  {input.downloadTemplateText && input.downloadTemplateLink && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "20px" }}>
                      {input?.downloadTemplateText && t(input?.downloadTemplateText)}
                      {input?.downloadTemplateLink && (
                        <a
                          href={input?.downloadTemplateLink}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: "flex",
                            color: "#9E400A",
                            textDecoration: "none",
                            width: 250,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {t("CS__DOWNLOAD_TEMPLATE")}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MultipleAdvocatesAndPip;
