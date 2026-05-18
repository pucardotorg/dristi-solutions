import { ArrowDown } from "@egovernments/digit-ui-react-components";
import PropTypes from "prop-types";
import React, { useEffect, useMemo, useState } from "react";
import useGetAllAdvocates from "../hooks/dristi/useGetAllAdvocates";
import { removeInvalidNameParts } from "../Utils";

function getReassignPointerEvents(isCaseReAssigned, propertyKey) {
  if (!isCaseReAssigned || typeof isCaseReAssigned !== "object") return "auto";
  return Object.hasOwn(isCaseReAssigned, propertyKey) ? "auto" : "none";
}

const SearchableDropdown = ({ t, isCaseReAssigned, selectedAdvocatesList, value, onChange, disabled }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [loader, setLoader] = useState(false);
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const stateId = globalThis.Digit?.ULBService?.getStateId?.();

  const { data: filteredAdvocatesData, refetch: fetchSearchedData } = useGetAllAdvocates(
    { tenantId: stateId, criteria: { barRegistrationNumber: debouncedSearchTerm } },
    {
      status: "ACTIVE",
      tenantId: stateId,
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

  const safeSelectedList = selectedAdvocatesList ?? [];

  const finalAdvocatesBarRegAndNameList = filteredAdvocatesBarRegAndNameList?.filter(
    (advocate) =>
      !safeSelectedList.some(
        (selected) =>
          selected?.advocateBarRegNumberWithName?.barRegistrationNumberOriginal === advocate.barRegistrationNumberOriginal
      )
  );

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

  const containerPointer = getReassignPointerEvents(isCaseReAssigned, "numberOfAdvocates");
  const togglePointer = disabled ? "none" : getReassignPointerEvents(isCaseReAssigned, "numberOfAdvocates");

  const renderAdvocateListBody = () => {
    if (loader) {
      return (
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
      );
    }
    if (finalAdvocatesBarRegAndNameList?.length === 0) {
      return (
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
      );
    }
    return finalAdvocatesBarRegAndNameList.map((role) => (
      <li
        key={role.advocateId}
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "0",
          cursor: "pointer",
          backgroundColor: value?.advocateId === role.advocateId ? "#e6e6e6" : "white",
          borderBottom: "1px solid #ccc",
        }}
      >
        <button
          type="button"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            padding: "10px",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            font: "inherit",
            textAlign: "left",
          }}
          onClick={() => handleSelectOption(role)}
        >
          <span style={{ fontWeight: "bold" }}>{role.barRegistrationNumberOriginal}</span>
          <span style={{ color: "#555" }}>{role.advocateName}</span>
        </button>
      </li>
    ));
  };

  return (
    <div
      className="dropdown-container"
      style={{
        position: "relative",
        width: "100%",
        marginBottom: "20px",
        pointerEvents: containerPointer,
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
      <button
        type="button"
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
          cursor: disabled ? "not-allowed" : "pointer",
          zIndex: 10,
          pointerEvents: togglePointer,
          background: "none",
          border: "none",
          padding: 0,
          lineHeight: 0,
        }}
        aria-label="Toggle dropdown"
      >
        <ArrowDown />
      </button>
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
          {renderAdvocateListBody()}
        </ul>
      )}
    </div>
  );
};

SearchableDropdown.propTypes = {
  t: PropTypes.func.isRequired,
  isCaseReAssigned: PropTypes.object,
  selectedAdvocatesList: PropTypes.array,
  value: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default SearchableDropdown;
