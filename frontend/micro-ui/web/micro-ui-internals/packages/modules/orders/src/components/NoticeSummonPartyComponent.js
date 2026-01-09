import React, { useEffect, useMemo, useState } from "react";
import useSearchCaseService from "../../../dristi/src/hooks/dristi/useSearchCaseService";
import { Button, Loader } from "@egovernments/digit-ui-react-components";
import _ from "lodash";
import { getFormattedName } from "../utils";
import AddWitnessModal from "@egovernments/digit-ui-module-hearings/src/pages/employee/AddWitnessModal";
import { Toast } from "@egovernments/digit-ui-components";
import { CustomMultiSelectDropdown } from "@egovernments/digit-ui-module-dristi/src/components/CustomMultiSelectDropdown";

const displayPartyType = {
  complainant: "COMPLAINANT_ATTENDEE",
  respondent: "RESPONDENT_ATTENDEE",
  witness: "WITNESS_ATTENDEE",
  advocate: "ADVOCATE_ATTENDEE",
};

const NoticeSummonPartyComponent = ({ t, config, formData, onSelect, clearErrors }) => {
  const urlParams = new URLSearchParams(window.location.search);
  const filingNumber = urlParams.get("filingNumber");
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const inputs = useMemo(() => config?.populators?.inputs || [], [config?.populators?.inputs]);
  const [userList, setUserList] = useState([]);
  const courtId = localStorage.getItem("courtId");
  const [showErrorToast, setShowErrorToast] = useState(null);
  const [dropdownActive, setDropdownActive] = useState(false);
  const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);

  const { isLoading, data: caseData, isFetching, refetch } = useSearchCaseService(
    {
      criteria: [{ filingNumber: filingNumber, ...(courtId && { courtId }) }],
      tenantId,
    },
    {},
    `dristi-${filingNumber}`,
    filingNumber,
    Boolean(filingNumber && courtId)
  );
  const caseDetails = useMemo(
    () => ({
      ...caseData?.criteria?.[0]?.responseList?.[0],
    }),
    [caseData]
  );

  const mapAddressDetails = (addressDetails, isIndividualData = false) => {
    return addressDetails?.map((address) => ({
      locality: address?.addressDetails?.locality || address?.street || "",
      city: address?.addressDetails?.city || address?.city || "",
      district: address?.addressDetails?.district || address?.addressLine2 || "",
      pincode: address?.addressDetails?.pincode || address?.pincode || "",
      state: address?.addressDetails?.state || address?.state || "",
      address: isIndividualData ? undefined : address?.addressDetails,
      id: address?.id,
      ...(address?.geoLocationDetails && { geoLocationDetails: address.geoLocationDetails }),
    }));
  };

  const closeToast = () => {
    setShowErrorToast(null);
  };

  useEffect(() => {
    if (showErrorToast) {
      const timer = setTimeout(() => {
        setShowErrorToast(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showErrorToast]);

  useEffect(() => {
    const fetchUsers = async () => {
      let users = [];
      if (caseDetails?.additionalDetails) {
        const respondentData = caseDetails?.additionalDetails?.respondentDetails?.formdata || [];
        const witnessData = caseDetails?.witnessDetails || [];

        const updatedRespondentData = respondentData.map((item, index) => ({
          ...item,
          data: {
            ...item?.data,
            firstName: item?.data?.respondentFirstName || "",
            lastName: item?.data?.respondentLastName || "",
            middleName: item?.data?.respondentMiddleName || "",
            respondentFirstName: item?.data?.respondentFirstName || "",
            respondentMiddleName: item?.data?.respondentMiddleName || "",
            respondentLastName: item?.data?.respondentLastName || "",
            address: mapAddressDetails(item?.data?.addressDetails),
            partyType: "Respondent",
            phone_numbers: item?.data?.phonenumbers?.mobileNumber || [],
            email: item?.data?.emails?.emailId || [],
            uuid: item?.data?.uuid,
            partyIndex: `Respondent_${index}`,
            uniqueId: item?.uniqueId,
          },
        }));
        const updatedWitnessData = witnessData.map((item, index) => ({
          data: {
            ...item,
            firstName: item?.firstName,
            lastName: item?.lastName,
            witnessDesignation: item?.witnessDesignation,
            address: mapAddressDetails(item?.addressDetails),
            partyType: "Witness",
            phone_numbers: item?.phonenumbers?.mobileNumber || [],
            email: item?.emails?.emailId || [],
            uuid: item?.uuid,
            partyIndex: `Witness_${index}`,
            ownerType: item?.ownerType,
          },
        }));
        users = [...updatedRespondentData, ...updatedWitnessData];
      }
      setUserList(users);
    };

    fetchUsers();
  }, [caseDetails, tenantId]);

  const handleDropdownChange = (selectedOption) => {
    clearErrors(config?.key);
    if (Array.isArray(selectedOption)) {
      onSelect(config.key, { ...formData[config.key], party: selectedOption?.map((item) => item.value) });
    } else {
      const isEqual = _.isEqual(selectedOption.value.data, formData?.[config.key]?.party?.data);
      if (!isEqual) {
        onSelect(config.key, { ...formData[config.key], party: selectedOption.value });
      }
    }
  };

  const partyOptions = useMemo(() => {
    return userList?.map((user) => {
      const { firstName, middleName, lastName, partyType, witnessDesignation } = user?.data || {};
      const isWitness = partyType?.toLowerCase() === "witness";

      const partyTypeLabel = partyType ? `(${t(displayPartyType[partyType.toLowerCase()])})` : "";

      let label = "";
      if (isWitness) {
        label = getFormattedName(firstName, middleName, lastName, witnessDesignation, partyTypeLabel);
      } else {
        label = getFormattedName(firstName, middleName, lastName, null, partyTypeLabel);
      }

      return { label, code: user?.data?.uniqueId, value: user };
    });
  }, [t, userList]);

  const selectedParty = useMemo(() => {
    const partyField = formData?.[config.key]?.party;
    if (!partyField) return null;

    const partyList = Array.isArray(partyField) ? partyField : [partyField];

    const formattedParties = partyList.map((partyObj) => {
      const partyData = partyObj?.data || {};
      const { firstName = "", middleName = "", lastName = "", partyType, witnessDesignation = "" } = partyData;
      const partyTypeLabel = partyType ? `(${t(displayPartyType[partyType.toLowerCase()])})` : "";
      const label = getFormattedName(firstName, middleName, lastName, witnessDesignation, partyTypeLabel);
      return {
        label,
        code: partyObj?.data?.uniqueId,
        value: partyObj,
      };
    });

    return Array.isArray(partyField) ? formattedParties : formattedParties[0];
  }, [config, formData, t]);

  const handleAddParty = (e) => {
    e?.stopPropagation();
    e?.preventDefault();
    setIsPartyModalOpen(!isPartyModalOpen);
  };

  if (isLoading || isFetching) {
    return <Loader />;
  }

  return (
    <div className="summons-order-component">
      {inputs.map((input, index) => (
        <div key={index}>
          {input.type === "dropdown" && input?.allowMultiSelect && (
            <div>
              <CustomMultiSelectDropdown
                t={t}
                displayKey="label"
                optionsKey="label"
                filterKey="code"
                options={partyOptions}
                selected={selectedParty}
                onSelect={handleDropdownChange}
                active={dropdownActive}
                setActive={setDropdownActive}
              />
              {input?.addWitness && (
                <Button
                  onButtonClick={handleAddParty}
                  className="add-party-btn"
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    WebkitBoxShadow: "none",
                    boxShadow: "none",
                    height: "auto",
                  }}
                  textStyles={{
                    marginTop: "8px",
                    fontFamily: "Roboto",
                    fontSize: "16px",
                    fontWeight: 700,
                    lineHeight: "18.75px",
                    textAlign: "center",
                    color: "#007E7E",
                  }}
                  label={t("+ Add new witness")}
                />
              )}
            </div>
          )}
        </div>
      ))}
      {isPartyModalOpen && (
        <AddWitnessModal
          tenantId={tenantId}
          onCancel={handleAddParty}
          caseDetails={caseDetails}
          isEmployee={true}
          onAddSuccess={() => {
            handleAddParty();
            refetch();
          }}
          showToast={setShowErrorToast}
        ></AddWitnessModal>
      )}
      {showErrorToast && <Toast error={showErrorToast?.error} label={showErrorToast?.message} isDleteBtn={true} onClose={closeToast} />}
    </div>
  );
};

export default NoticeSummonPartyComponent;
