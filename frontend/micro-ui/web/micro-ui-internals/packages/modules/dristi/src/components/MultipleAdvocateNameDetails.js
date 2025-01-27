import { Loader } from "@egovernments/digit-ui-react-components";
import React, { useEffect, useMemo, useState } from "react";
import { ReactComponent as CrossIcon } from "../images/cross.svg";
import Button from "./Button";
import { removeInvalidNameParts } from "../Utils";
import { userTypeOptions } from "../pages/citizen/registration/config";
import { isEqual } from "lodash";
import useSearchCaseService from "../hooks/dristi/useSearchCaseService";
import { CustomDeleteIcon } from "../icons/svgIndex";

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

function MultipleAdvocateNameDetails({ t, config, onSelect, formData, errors, setError, clearErrors }) {
  const token = window.localStorage.getItem("token");
  const isUserLoggedIn = Boolean(token);
  const moduleCode = "DRISTI";
  const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
  const tenantId = window.localStorage.getItem("tenant-id");
  const urlParams = new URLSearchParams(window.location.search);
  const caseId = urlParams.get("caseId");

  const inputs = useMemo(
    () =>
      config?.populators?.inputs || [
        {
          label: "",
          name: "",
        },
      ],
    [config?.populators?.inputs]
  );

  const [advocatesData, setAdvocatesData] = useState(
    formData?.[config?.key]
      ? formData?.[config?.key]
      : formData?.boxComplainant?.showVakalatNamaUpload
      ? [
          {
            advocateBarRegNumberWithName: {},
            advocateNameDetails: {},
          },
        ]
      : [{}]
  );

  useEffect(() => {
    const index = formData?.boxComplainant?.index;
    const caseAdvocatesData = caseDetails?.additionalDetails?.advocateDetails?.formdata?.[index]?.data?.MultipleAdvocateNameDetails;
    if (Array.isArray(caseAdvocatesData) && !isEqual(advocatesData, caseAdvocatesData)) {
      setAdvocatesData(caseAdvocatesData);
    }
  }, []);

  const [isApproved, setIsApproved] = useState(false);

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

  const { data: allAdvocatesData, isLoading: isAllAdvocateSearchLoading } = Digit?.Hooks?.dristi?.useGetAllAdvocates(
    { tenantId: window?.Digit.ULBService.getStateId() },
    {
      status: "ACTIVE",
      tenantId: window?.Digit.ULBService.getStateId(),
      offset: 0,
      limit: 1000,
    }
  );

  const allAdvocatesList = useMemo(() => {
    return allAdvocatesData?.advocates || [];
  }, [allAdvocatesData]);

  const allAdvocatesBarRegAndNameList = useMemo(() => {
    return allAdvocatesList.map((adv) => {
      return {
        barRegistrationNumber: `${adv?.barRegistrationNumber} (${removeInvalidNameParts(adv?.additionalDetails?.username)})`,
        advocateName: removeInvalidNameParts(adv?.additionalDetails?.username),
        advocateId: adv?.id,
        barRegistrationNumberOriginal: adv?.barRegistrationNumber,
        advocateUuid: adv?.auditDetails?.createdBy,
        individualId: adv?.individualId,
      };
    });
  }, [allAdvocatesList]);

  const { data, isLoading, refetch } = window?.Digit.Hooks.dristi.useGetIndividualUser(
    {
      Individual: {
        userUuid: [userInfo?.uuid],
      },
    },
    { tenantId, limit: 1000, offset: 0 },
    moduleCode,
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

  const selectedAdvindividualId = useMemo(() => {
    return formData?.MultipleAdvocateNameDetails?.[0]?.advocateBarRegNumberWithName?.individualId || null;
  }, [formData?.advocateBarRegNumberWithName]);

  const { data: selectedIndividual, isLoading: isInidividualLoading } = window?.Digit.Hooks.dristi.useGetIndividualUser(
    {
      Individual: {
        individualId: selectedAdvindividualId,
      },
    },
    { tenantId, limit: 1000, offset: 0 },
    moduleCode,
    `getindividual-${selectedAdvindividualId}`,
    selectedAdvindividualId
  );

  const getSelectedIndividual = async (selectedAdvindividualId) => {
    const { data: selectedIndividual, isLoading: isInidividualLoading } = window?.Digit.Hooks.dristi.useGetIndividualUser(
      {
        Individual: {
          individualId: selectedAdvindividualId,
        },
      },
      { tenantId, limit: 1000, offset: 0 },
      moduleCode,
      `getindividual-${selectedAdvindividualId}`,
      selectedAdvindividualId
    );
    return { selectedIndividual, isInidividualLoading };
  };

  const idType = selectedIndividual?.Individual?.[0]?.identifiers[0]?.identifierType || "";
  const identifierIdDetails = JSON.parse(
    selectedIndividual?.Individual?.[0]?.additionalFields?.fields?.find((obj) => obj.key === "identifierIdDetails")?.value || "{}"
  );

  useEffect(() => {
    if (formData?.boxComplainant?.showVakalatNamaUpload && formData?.boxComplainant?.index === 0 && !advocatesData?.advocateNameDetails?.firstName) {
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
        onSelect(config.key, [{ advocateBarRegNumberWithName, advocateNameDetails }]);
        setAdvocatesData([{ advocateBarRegNumberWithName, advocateNameDetails }]);
      }
      //   if (isApproved && !searchResult && selectedIndividual) {
      //     const advocateNameDetails = {
      //       ...formData?.advocateNameDetails,
      //       advocateMobileNumber: selectedIndividual?.Individual?.[0]?.mobileNumber || "",
      //       advocateIdProof: identifierIdDetails?.fileStoreId
      //         ? [
      //             {
      //               name: idType,
      //               fileStore: identifierIdDetails?.fileStoreId,
      //               documentName: identifierIdDetails?.filename,
      //               fileName: "ID Proof",
      //             },
      //           ]
      //         : null,
      //     };
      //     // check and change advocateBarRegNumberWithName: {} below
      //     onSelect(config.key, [{ advocateBarRegNumberWithName: {}, advocateNameDetails }]);
      //     setAdvocatesData([{ advocateBarRegNumberWithName: {}, advocateNameDetails }]);
      //   }
    }
  }, [isApproved, onSelect, searchResult, selectedIndividual]);

  const handleInputChange = async (index, field, value) => {
    const updatedData = structuredClone(advocatesData);
    if (field === "advocateBarRegNumberWithName") {
      const advocateFullname = value?.advocateName || "";
      updatedData[index].advocateBarRegNumberWithName = value;
      updatedData[index].advocateNameDetails = {
        firstName: splitNamesPartiallyFromFullName(advocateFullname)?.firstName,
        middleName: splitNamesPartiallyFromFullName(advocateFullname)?.middleName,
        lastName: splitNamesPartiallyFromFullName(advocateFullname)?.lastName,
        // advocateMobileNumber:
        // advocateIdProof:
      };
    } else updatedData[index][field] = value;
    setAdvocatesData(updatedData);
    onSelect(config.key, updatedData);
  };

  const handleAddAdvocate = () => {
    // This is the case where there are no advoate details present currently, only add advocate button is present.
    if (advocatesData?.length === 1 && Object.keys(advocatesData[0]).length === 0) {
      const newAdvData = [
        {
          advocateBarRegNumberWithName: {},
          advocateNameDetails: {},
        },
      ];
      setAdvocatesData(newAdvData);
      onSelect(config.key, newAdvData);
      onSelect("boxComplainant", { ...formData?.boxComplainant, showVakalatNamaUpload: true });
    } else {
      const newAdvData = [
        ...advocatesData,
        {
          advocateBarRegNumberWithName: {},
          advocateNameDetails: {},
        },
      ];
      setAdvocatesData(newAdvData);
      onSelect(config.key, newAdvData);
    }
  };

  const handleDeleteAdvocate = (index) => {
    if (advocatesData?.length === 1) {
      setAdvocatesData([{}]);
      onSelect(config.key, [{}]);
      onSelect("boxComplainant", { ...formData?.boxComplainant, showVakalatNamaUpload: false });
    } else {
      const newAdvData = advocatesData.filter((_, i) => i !== index);
      setAdvocatesData(newAdvData);
      onSelect(config.key, newAdvData);
    }
  };

  const SearchableDropdown = ({ value, onChange }) => {
    const [searchTerm, setSearchTerm] = useState(""); // Clear search term on initial load
    const [isDropdownVisible, setDropdownVisible] = useState(false);

    const filteredRoles = useMemo(() => {
      if (!searchTerm.trim()) {
        return allAdvocatesBarRegAndNameList; // Show all options if searchTerm is empty
      }
      return allAdvocatesBarRegAndNameList.filter(
        (role) =>
          role.advocateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          role.barRegistrationNumberOriginal.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }, [searchTerm, allAdvocatesBarRegAndNameList]);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (!event.target.closest(".dropdown-container")) {
          setDropdownVisible(false);
        }
      };

      document.addEventListener("click", handleClickOutside);

      return () => {
        document.removeEventListener("click", handleClickOutside);
      };
    }, []);

    const handleSelectOption = (role) => {
      onChange(role);
      setSearchTerm("");
      setDropdownVisible(false);
    };

    return (
      <div className="dropdown-container" style={{ position: "relative", width: "70%" }}>
        <input
          type="text"
          placeholder="Search Advocate"
          value={searchTerm || value?.barRegistrationNumberOriginal || ""}
          onFocus={() => {
            setDropdownVisible(true);
            if (!searchTerm) {
              setSearchTerm("");
            }
          }}
          onChange={(e) => {
            setSearchTerm(e.target.value);
          }}
          style={{
            width: "100%",
            padding: "10px",
            fontSize: "16px",
            marginBottom: "30px",
            boxSizing: "border-box",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        />
        {isDropdownVisible && (
          <ul
            style={{
              position: "absolute",
              top: "calc(100% + 5px)",
              left: 0,
              width: "100%",
              border: "1px solid #ccc",
              backgroundColor: "white",
              borderRadius: "4px",
              maxHeight: "150px",
              overflowY: "auto",
              zIndex: 1000,
              padding: "0",
              margin: "0",
              listStyle: "none",
            }}
          >
            {filteredRoles.map((role) => (
              <li
                key={role.advocateId}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px",
                  cursor: "pointer",
                  backgroundColor: value?.advocateId === role.advocateId ? "#e6e6e6" : "white",
                  borderBottom: "1px solid #ccc",
                }}
                onClick={() => handleSelectOption(role)}
              >
                <span style={{ fontWeight: "bold" }}>{role.barRegistrationNumberOriginal}</span>
                <span style={{ color: "#555" }}>{role.advocateName}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  if (isAllAdvocateSearchLoading) {
    return <Loader></Loader>;
  }

  return (
    <div>
      {Object.keys(advocatesData?.[0])?.length !== 0 &&
        advocatesData.map((data, index) => (
          <div
            key={index}
            style={{
              marginBottom: "40px",
              border: "1px solid #ccc",
              padding: "20px",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h1 style={{ fontSize: "18px", fontWeight: "bold" }}>Advocate {index + 1}</h1>
              {advocatesData?.[index]?.advocateBarRegNumberWithName?.individualId !== individualId && (
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

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "30px" }}>
              <h1 style={{ fontSize: "14px" }}> {t("BAR_REGISTRATON")}</h1>
              <SearchableDropdown
                value={data.advocateBarRegNumberWithName}
                onChange={(value) => handleInputChange(index, "advocateBarRegNumberWithName", value)}
              />

              {inputs.map((input, index) => {
                return (
                  <div style={{ width: "70%", textAlign: "left", marginBottom: "20px" }}>
                    <label
                      style={{
                        fontSize: "14px",
                        fontWeight: "bold",
                        display: "block",
                        marginBottom: "5px",
                      }}
                    >
                      {t(input.label)}
                    </label>
                    <input
                      type="text"
                      placeholder={t(input.label)}
                      value={data?.advocateNameDetails?.[input.name] || ""}
                      onChange={(e) => handleInputChange(index, input.name, e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px",
                        fontSize: "16px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      <Button
        className="add-location-btn"
        label={t("ADD_ADVOCATE")}
        style={{
          display: "inline-block",
          margin: "20px auto",
          fontSize: "16px",
          color: "blue",
          background: "none",
          border: "none",
          textDecoration: "underline",
          cursor: "pointer",
        }}
        onButtonClick={handleAddAdvocate}
      />
    </div>
  );
}

export default MultipleAdvocateNameDetails;
