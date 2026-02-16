import { ArrowDown } from "@egovernments/digit-ui-react-components";
import React, { useEffect, useMemo, useState } from "react";
import { getAuthorizedUuid, removeInvalidNameParts } from "../Utils";

const SearchableDropdown = ({ t, isCaseReAssigned, selectedAdvocatesList, value, onChange, disabled }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [loader, setLoader] = useState(false);
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
  const userUuid = userInfo?.uuid;
  const authorizedUuid = getAuthorizedUuid(userUuid);

  const { data: filteredAdvocatesData, refetch: fetchSearchedData } = Digit?.Hooks?.dristi?.useGetAllAdvocates(
    { tenantId: window?.Digit.ULBService.getStateId(), criteria: { barRegistrationNumber: debouncedSearchTerm } },
    {
      status: "ACTIVE",
      tenantId: window?.Digit.ULBService.getStateId(),
      offset: 0,
      limit: 100,
    }
  );

  const filteredAdvocatesList = useMemo(() => {
    return filteredAdvocatesData?.advocates || [];
  }, [filteredAdvocatesData]);

  const filteredAdvocatesBarRegAndNameList = useMemo(() => {
    return filteredAdvocatesList.map((adv) => {
      return {
        barRegistrationNumber: `${adv?.barRegistrationNumber} (${removeInvalidNameParts(adv?.additionalDetails?.username)})`,
        advocateName: removeInvalidNameParts(adv?.additionalDetails?.username),
        advocateId: adv?.id,
        barRegistrationNumberOriginal: adv?.barRegistrationNumber,
        advocateUuid: adv?.auditDetails?.createdBy,
        individualId: adv?.individualId,
      };
    });
  }, [filteredAdvocatesList]);

  const finalAdvocatesBarRegAndNameList = filteredAdvocatesBarRegAndNameList
    ?.filter(
      (advocate) =>
        !selectedAdvocatesList.some(
          (selected) => selected.advocateBarRegNumberWithName.barRegistrationNumberOriginal === advocate.barRegistrationNumberOriginal
        )
    )
    ?.filter((advocate) => {
      const { advocateUuid } = advocate;
      if (authorizedUuid !== userUuid && userUuid === advocateUuid) {
        // if junior adv is filing on behalf of senior, his own name should not be visible in dropdown
        return false;
      }
      return true;
    });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 1000);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    const _filteredAdvocateData = async () => {
      setLoader(true);
      await fetchSearchedData();
      setLoader(false);
    };
    _filteredAdvocateData();
  }, [debouncedSearchTerm, fetchSearchedData]);

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

  // reset the onChnage value when search term is empty
  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    if (e.target.value === "") {
      onChange(null);
    }
  };

  return (
    <div
      className="dropdown-container"
      style={{
        position: "relative",
        width: "100%",
        marginBottom: "20px",
        pointerEvents: isCaseReAssigned ? (isCaseReAssigned.hasOwnProperty("numberOfAdvocates") ? "auto" : "none") : "auto",
      }}
    >
      <input
        type="text"
        placeholder={t("ADVOCATE_PLACEHOLDER")}
        value={searchTerm || value?.barRegistrationNumberOriginal || ""}
        onFocus={() => {
          setDropdownVisible(true);
          if (!searchTerm) {
            setSearchTerm("");
          }
        }}
        onChange={handleInputChange}
        style={{
          width: "100%",
          padding: "10px",
          fontSize: "16px",
          marginBottom: "30px",
          boxSizing: "border-box",
          border: "1px solid rgb(61, 60, 60)",
          borderRadius: "0px",
        }}
        disabled={disabled}
      />
      <div
        onClick={(e) => {
          e.stopPropagation();
          setDropdownVisible((prev) => !prev);
        }}
        disabled={disabled}
        style={{
          position: "absolute",
          right: "10px",
          top: "50%",
          transform: "translateY(-50%)",
          fontSize: "14px",
          color: "black",
          cursor: "pointer",
          zIndex: 10,
          pointerEvents: disabled || isCaseReAssigned ? (isCaseReAssigned.hasOwnProperty("numberOfAdvocates") ? "auto" : "none") : "auto",
        }}
      >
        <ArrowDown />
      </div>
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
          {loader ? (
            <li
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px",
                cursor: "pointer",
                backgroundColor: "white",
                borderBottom: "1px solid #ccc",
              }}
            >
              <span style={{ fontWeight: "bold" }}>{t("LOADING")}</span>
            </li>
          ) : finalAdvocatesBarRegAndNameList?.length === 0 ? (
            <li
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px",
                cursor: "pointer",
                backgroundColor: "white",
                borderBottom: "1px solid #ccc",
              }}
            >
              <span style={{ fontWeight: "bold" }}>{t("NO_DATA_FOUND")}</span>
            </li>
          ) : (
            finalAdvocatesBarRegAndNameList?.map((role) => (
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
            ))
          )}
        </ul>
      )}
    </div>
  );
};
export default SearchableDropdown;
