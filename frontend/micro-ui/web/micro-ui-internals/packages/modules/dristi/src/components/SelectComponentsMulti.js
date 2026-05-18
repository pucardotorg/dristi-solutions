import isEqual from "lodash/isEqual";
import PropTypes from "prop-types";
import React, { useEffect, useMemo, useState } from "react";
import { generateUUID } from "../Utils";
import { ReactComponent as CrossIcon } from "../images/cross.svg";
import Button from "./Button";
import LocationComponent from "./LocationComponent";
import GeoLocationComponent from "./GeoLocationComponent";

/** Disallow digits and unsafe punctuation; curly quotes (U+201C–U+2019) forbidden; brackets via escapes S6535-friendly. */
const APPLICANT_NAME_FIELD_PATTERN =
  /^[^0-9$"'<>?\\~!@#%^()+={}\x5b\x5d*,/:;\u201c\u201d\u2018\u2019]{1,50}$/i;
const APPLICANT_ADDRESS_FIELD_PATTERN =
  /^[^"'<>?\\~`!@$%^()={}\x5b\x5d*:;\u201c\u201d\u2018\u2019]{2,256}$/i;

const witnessAddressConfig = {
  type: "component",
  key: "addressDetails",
  withoutLabel: true,
  populators: {
    inputs: [
      {
        label: "CS_TYPE_OF_ADDRESS",
        showOptional: true,
        type: "Radio",
        name: "typeOfAddress",
        options: [],
      },
      {
        label: "PINCODE",
        type: "text",
        name: "pincode",
        validation: {
          minlength: 6,
          maxlength: 6,
          patternType: "Pincode",
          pattern: "[0-9]+",
          max: "9999999",
          errMsg: "ADDRESS_PINCODE_INVALID",
          title: "",
        },
      },
      {
        label: "STATE",
        type: "text",
        name: "state",
        validation: {
          pattern: APPLICANT_NAME_FIELD_PATTERN,
          errMsg: "CORE_COMMON_APPLICANT_STATE_INVALID",
          patternType: "Name",
          title: "",
        },
      },
      {
        label: "DISTRICT",
        type: "text",
        name: "district",
        validation: {
          pattern: APPLICANT_NAME_FIELD_PATTERN,
          errMsg: "CORE_COMMON_APPLICANT_DISTRICT_INVALID",
          patternType: "Name",
          title: "",
        },
      },
      {
        label: "CITY/TOWN",
        type: "text",
        name: "city",
        validation: {
          patternType: "Name",
          errMsg: "CORE_COMMON_APPLICANT_CITY_INVALID",
        },
      },
      {
        label: "ADDRESS",
        type: "text",
        name: "locality",
        validation: {
          minlength: 2,
          maxlength: 256,
          pattern: APPLICANT_ADDRESS_FIELD_PATTERN,
          errMsg: "CORE_COMMON_APPLICANT_ADDRESS_INVALID",
        },
      },
    ],
    validation: {},
  },
};

const selectCompMultiConfig = {
  type: "component",
  key: "addressDetails",
  withoutLabel: true,
  populators: {
    inputs: [
      {
        infoHeader: "CS_COMMON_NOTE",
        infoText: "ACCUSED_ADDRESS_NOTE",
        infoTooltipMessage: "ACCUSED_ADDRESS_NOTE",
        type: "InfoComponent",
      },
      {
        label: "CS_TYPE_OF_ADDRESS",
        showOptional: true,
        type: "Radio",
        name: "typeOfAddress",
        options: [],
      },
      {
        label: "PINCODE",
        type: "text",
        name: "pincode",
        validation: {
          minlength: 6,
          maxlength: 6,
          patternType: "Pincode",
          pattern: "[0-9]+",
          max: "9999999",
          errMsg: "ADDRESS_PINCODE_INVALID",
          isRequired: true,
          title: "",
        },
        isMandatory: true,
      },
      {
        label: "STATE",
        type: "text",
        name: "state",
        validation: {
          isRequired: true,
          pattern: APPLICANT_NAME_FIELD_PATTERN,
          errMsg: "CORE_COMMON_APPLICANT_STATE_INVALID",
          patternType: "Name",
          title: "",
        },
        isMandatory: true,
      },
      {
        label: "DISTRICT",
        type: "text",
        name: "district",
        validation: {
          isRequired: true,
          pattern: APPLICANT_NAME_FIELD_PATTERN,
          errMsg: "CORE_COMMON_APPLICANT_DISTRICT_INVALID",
          patternType: "Name",
          title: "",
        },
        isMandatory: true,
      },
      {
        label: "CITY/TOWN",
        type: "text",
        name: "city",
        validation: {
          isRequired: true,
          patternType: "Name",
          errMsg: "CORE_COMMON_APPLICANT_CITY_INVALID",
        },
        isMandatory: true,
      },
      {
        label: "ADDRESS",
        type: "text",
        name: "locality",
        isFormatRequired: true,
        validation: {
          minlength: 2,
          maxlength: 256,
          pattern: APPLICANT_ADDRESS_FIELD_PATTERN,
          errMsg: "CORE_COMMON_APPLICANT_ADDRESS_INVALID",
        },
      },
    ],
    validation: {},
  },
};

const SelectComponentsMulti = ({ t, config, onSelect, formData, errors, setError, clearErrors }) => {
  const [locationData, setLocationData] = useState([formData?.[config?.key] ? formData?.[config?.key] : { id: generateUUID() }]);

  useEffect(() => {
    if (
      Array.isArray(formData?.[config?.key]) &&
      locationData?.length === 1 &&
      !locationData?.[0]?.addressDetails &&
      !isEqual(locationData, formData?.[config?.key])
    ) {
      setLocationData(formData?.[config?.key]);
    }
  }, [config?.key, formData, locationData]);

  const { data: typeOfAddressData } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    "case",
    [{ name: "TypeOfAddress" }],
    {
      cacheTime: 0,
      select: (data) => {
        return data?.case?.TypeOfAddress || [];
      },
    }
  );

  const modifiedSelectCompMultiConfig = useMemo(() => {
    const updatedConfig = { ...(config?.formType === "Witness" ? witnessAddressConfig : selectCompMultiConfig) };
    const typeOfAddressField = updatedConfig.populators.inputs.find((input) => input.name === "typeOfAddress");
    if (typeOfAddressField) {
      typeOfAddressField.options = typeOfAddressData;
    }
    return updatedConfig;
  }, [typeOfAddressData, config]);

  const addressLabel = useMemo(() => formData?.respondentType?.code, [formData?.respondentType]);

  const addressHeadingLabel = useMemo(() => {
    if (addressLabel === "INDIVIDUAL") return t("CS_RESPONDENT_ADDRESS_DETAIL");
    if (addressLabel === "REPRESENTATIVE") return t("CS_COMPANY_LOCATION");
    if (config?.formType === "Witness") return t("CS_COMMON_ADDRESS_WITNESS");
    return t("CS_COMMON_ADDRESS_DETAIL");
  }, [addressLabel, config?.formType, t]);

  const handleAdd = () => {
    setLocationData((locationData) => {
      const updatedLocationData = [...(locationData || []), { id: generateUUID() }];
      onSelect(config.key, updatedLocationData);
      return updatedLocationData;
    });
  };

  const handleDeleteLocation = (locationId) => {
    setLocationData((locationData) => {
      const currentFormData = locationData.filter((data) => data.id !== locationId);
      onSelect(config.key, currentFormData);
      return currentFormData;
    });
  };

  const handleChange = (key, value, locationId, field) => {
    setLocationData((locationData) => {
      const locationsCopy = structuredClone(locationData);
      const updatedLocations = locationsCopy.map((data) => (data.id === locationId ? { ...data, [field]: value } : data));

      onSelect(config?.key, updatedLocations);
      return updatedLocations;
    });
  };

  return (
    <div>
      {Array.isArray(locationData) &&
        locationData?.[0]?.id &&
        locationData.map((data, index) => (
          <div key={data.id}>
            <div style={{ display: "flex", gap: "4px", justifyContent: "space-between", alignItems: "center" }}>
              <b>
                <h1>{` ${addressHeadingLabel} ${index + 1}`}</h1>
              </b>
              {(config?.state === "DRAFT_IN_PROGRESS" ||
                index >= config?.addressLength ||
                config?.isJudgeSendBack ||
                config?.formType === "Witness") && (
                <button
                  type="button"
                  aria-label={t("CS_REMOVE")}
                  onClick={() => {
                    if (
                      !config?.disable &&
                      (config?.state === "DRAFT_IN_PROGRESS" ||
                        index >= config?.addressLength ||
                        config?.isJudgeSendBack ||
                        config?.formType === "Witness")
                    ) {
                      handleDeleteLocation(data.id);
                    }
                  }}
                  style={
                    locationData.length === 1
                      ? { display: "none", background: "none", border: "none", padding: 0, cursor: "pointer" }
                      : { background: "none", border: "none", padding: 0, cursor: "pointer" }
                  }
                >
                  <CrossIcon />
                </button>
              )}
            </div>
            <LocationComponent
              t={t}
              config={modifiedSelectCompMultiConfig}
              locationFormData={data}
              onLocationSelect={(key, value) => {
                handleChange(key, value, data.id, "addressDetails");
              }}
              errors={errors}
              setError={setError}
              clearErrors={clearErrors}
              mapIndex={data.id}
              disable={index < config?.addressLength ? true : config?.disable}
              isAutoFilledDisabled={true}
            ></LocationComponent>

            {config?.isPoliceStationComponent === true && (
              <GeoLocationComponent
                t={t}
                config={config.geoLocationConfig}
                locationFormData={data}
                onGeoLocationSelect={(key, value) => {
                  handleChange(key, value, data.id, "geoLocationDetails");
                }}
                errors={errors}
                setError={setError}
                clearErrors={clearErrors}
                mapIndex={data.id}
                disable={index < config?.addressLength ? true : config?.disable}
                isAutoFilledDisabled={true}
              ></GeoLocationComponent>
            )}
          </div>
        ))}
      {config?.removeAddLocationButton !== true && (
        <Button
          className={"add-location-btn"}
          label={t("ADD_LOCATION")}
          style={{ alignItems: "center", margin: "10px 0px" }}
          onButtonClick={() => {
            handleAdd();
          }}
        />
      )}
    </div>
  );
};

SelectComponentsMulti.propTypes = {
  clearErrors: PropTypes.func,
  config: PropTypes.shape({
    addressLength: PropTypes.number,
    disable: PropTypes.bool,
    formType: PropTypes.string,
    geoLocationConfig: PropTypes.object,
    isJudgeSendBack: PropTypes.bool,
    isPoliceStationComponent: PropTypes.bool,
    key: PropTypes.string.isRequired,
    removeAddLocationButton: PropTypes.bool,
    state: PropTypes.string,
  }).isRequired,
  errors: PropTypes.object,
  formData: PropTypes.object,
  onSelect: PropTypes.func.isRequired,
  setError: PropTypes.func,
  t: PropTypes.func.isRequired,
};

export default SelectComponentsMulti;
