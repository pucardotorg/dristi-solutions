import React, { useMemo, useState } from "react";
import { LabelFieldPair, CardLabel, TextInput, Dropdown, CardLabelError, RadioButtons, Button } from "@egovernments/digit-ui-react-components";
import SelectCustomNote from "./SelectCustomNote";
import CustomErrorTooltip from "./CustomErrorTooltip";
import { useToast } from "./Toast/useToast";

const GeoLocationComponent = ({ t, config, locationFormData, onGeoLocationSelect }) => {
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(false);

  const { data: policeStationData } = Digit.Hooks.useCustomMDMS(Digit.ULBService.getStateId(), "case", [{ name: "PoliceStation" }]);
  const resetFieldsConfig = {
    jurisdictionKnown: {
      YES: ["latitude", "longitude"],
      NO: ["policeStation"],
    },
  };

  const getResetFields = React.useMemo(
    () => (key, value) => {
      const fieldsToReset = resetFieldsConfig[key]?.[value?.code] || [];
      return fieldsToReset.reduce((acc, field) => {
        acc[field] = null;
        return acc;
      }, {});
    },
    []
  );

  const setValue = (key, value) => {
    const resetFields = getResetFields(key, value);

    onGeoLocationSelect(config.key, {
      ...locationFormData?.[config.key],
      ...resetFields,
      [key]: value,
    });
  };

  const getPoliceStationByLocation = async (lat, long) => {
    setIsLoading(true);
    try {
      const individualData = await window?.Digit.DRISTIService.getLocationBasedJurisdiction(
        {
          location: {
            latitude: lat,
            longitude: long,
          },
        },
        { tenantId }
      );

      if (
        individualData?.locationBasedJurisdiction?.nearest_police_station === null ||
        individualData?.locationBasedJurisdiction?.nearest_police_station === undefined
      ) {
        setIsLoading(false);
        toast.error(t("GEOLOCATION_ERROR"), 5000);
      } else {
        toast.success(t("GEOLOCATION_SUCCESS"), 5000);
      }

      let option = {
        code: individualData?.locationBasedJurisdiction?.nearest_police_station?.police_station_code,
        name: individualData?.locationBasedJurisdiction?.nearest_police_station?.police_station,
      };
      setValue("policeStation", option);
      return individualData;
    } catch (error) {
      toast.error(t("GEOLOCATION_ERROR"));
    }
  };

  const validationPattern = {
    longitude: /^-?(180|1[0-7][0-9]|[0-9]?[0-9](.d+)?)$/,
    latitude: /^-?(90|[0-8]?[0-9](.d+)?)$/,
  };

  const validateCoordinate = (value, validation) => {
    if (value && validation?.patternType && !value.match(validationPattern[validation.patternType])) {
      return (
        <CardLabelError className="coordinate-error">
          <span className="error-text">{t(validation?.errorMessage || "CORE_COMMON_INVALID")}</span>
        </CardLabelError>
      );
    }
    return null;
  };

  const isValidCoordinate = (latitude, longitude) => {
    const isLatValid = !isNaN(latitude) && latitude >= -90 && latitude <= 90;
    const isLonValid = !isNaN(longitude) && longitude >= -180 && longitude <= 180;
    return isLatValid && isLonValid;
  };

  const locationButtonDisable = useMemo(() => {
    const locationData = locationFormData?.[config.key];
    const jurisdictionKnown = locationData?.jurisdictionKnown?.code === "YES";
    const latitude = parseFloat(locationData?.latitude);
    const longitude = parseFloat(locationData?.longitude);

    return jurisdictionKnown ? true : !isValidCoordinate(latitude, longitude);
  }, [config.key, locationFormData]);

  return (
    <div className="geo-location-component">
      <div className="police-station-juridiction">
        <CardLabel>{t(config?.juridictionRadioButton?.label)}</CardLabel>
        <RadioButtons
          additionalWrapperClass="radio-group"
          options={config?.juridictionRadioButton?.options}
          optionsKey="name"
          selectedOption={locationFormData?.[config.key]?.["jurisdictionKnown"] || { code: "YES", name: "ES_COMMON_YES" }}
          onSelect={(value) => setValue("jurisdictionKnown", value)}
        />
      </div>

      {locationFormData?.[config.key]?.["jurisdictionKnown"]?.code === "NO" && (
        <SelectCustomNote
          config={{
            populators: {
              inputs: [
                {
                  infoHeader: "CS_PLEASE_COMMON_NOTE",
                  infoText: "GEOLOCATION_INFO",
                  infoTooltipMessage: "GEOLOCATION_INFO_TOOLTIP",
                  type: "InfoComponent",
                },
              ],
            },
          }}
          t={t}
        />
      )}

      <div className="geolocation-header">
        <b>{t("GEOLOCATION_TITLE")}</b> <span>{t("CS_IS_OPTIONAL")}</span>
      </div>

      <div className="coordinate-container">
        <div className="lat-long">
          <LabelFieldPair>
            <CardLabel>{t(config?.latitudeInput?.label)}</CardLabel>
            <TextInput
              type={"number"}
              value={locationFormData?.[config.key]?.["latitude"] || ""}
              disabled={
                locationFormData?.[config.key]?.["jurisdictionKnown"]?.code
                  ? locationFormData?.[config.key]?.["jurisdictionKnown"]?.code === "YES"
                  : true
              }
              onChange={(e) => {
                setIsLoading(false);
                setValue("latitude", e.target.value);
              }}
              {...config?.latitudeInput?.validation}
            />
            {/* Validation Error Message */}
            {validateCoordinate(locationFormData?.[config.key]?.["latitude"], config?.latitudeInput?.validation)}
          </LabelFieldPair>

          <LabelFieldPair>
            <CardLabel>{t(config?.longitudeInput?.label)}</CardLabel>
            <TextInput
              type={"number"}
              value={locationFormData?.[config.key]?.["longitude"] || ""}
              disabled={
                locationFormData?.[config.key]?.["jurisdictionKnown"]?.code
                  ? locationFormData?.[config.key]?.["jurisdictionKnown"]?.code === "YES"
                  : true
              }
              onChange={(e) => {
                setIsLoading(false);
                setValue("longitude", e.target.value);
              }}
              {...config?.longitudeInput?.validation}
            />

            {/* Validation Error Message */}
            {validateCoordinate(locationFormData?.[config.key]?.["longitude"], config?.longitudeInput?.validation)}
          </LabelFieldPair>
        </div>
        <Button
          className={"custom-button-policeStation"}
          label={t(config?.policeStationDropdown?.label)}
          isDisabled={locationButtonDisable || isLoading}
          onButtonClick={() => {
            var lat = locationFormData?.[config.key]?.["latitude"];
            var long = locationFormData?.[config.key]?.["longitude"];

            getPoliceStationByLocation(lat, long);
          }}
        />
      </div>

      <LabelFieldPair>
        <CardLabel>
          {
            <div className="police-station-label">
              {t(config?.policeStationDropdown?.header)}
              <CustomErrorTooltip message={t("POLICE_STATION_HEADER_TOOLTIP")} showTooltip={"visible"} icon />
            </div>
          }
        </CardLabel>
        <Dropdown
          className={"police-station-dropdown"}
          label={t(config?.policeStationDropdown?.label)}
          name={config?.policeStationDropdown?.name}
          select={(selectedOption) => {
            setValue("policeStation", selectedOption);
          }}
          selected={locationFormData?.[config.key]?.["policeStation"]}
          option={policeStationData?.case?.PoliceStation}
          optionKey={"name"}
          type="dropdown"
          disable={locationFormData?.[config.key]?.["jurisdictionKnown"]?.code === "NO"}
          style={{ width: "100%", maxWidth: "100%" }}
        />
      </LabelFieldPair>
    </div>
  );
};

export default GeoLocationComponent;
