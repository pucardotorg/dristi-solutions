import React, { useMemo, useState } from "react";
import { LabelFieldPair, CardLabel, TextInput, Dropdown, CardLabelError, RadioButtons, Button } from "@egovernments/digit-ui-react-components";
import SelectCustomNote from "./SelectCustomNote";
import CustomErrorTooltip from "./CustomErrorTooltip";
import { useToast } from "./Toast/useToast";

const GeoLocationComponent = ({ t, config, locationFormData, onGeoLocationSelect, disable }) => {
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(false);

  const { data: policeStationData } = Digit.Hooks.useCustomMDMS(Digit.ULBService.getStateId(), "case", [{ name: "PoliceStation" }]);
  const sortedPoliceStations = useMemo(() => {
    const stations = policeStationData?.case?.PoliceStation || [];
    return [...stations].sort((a, b) => {
      const nameA = (a?.name || "").toUpperCase();
      const nameB = (b?.name || "").toUpperCase();
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      return 0;
    });
  }, [policeStationData]);
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

      const data = {
        code: individualData?.locationBasedJurisdiction?.nearest_police_station?.police_station_code,
        name: individualData?.locationBasedJurisdiction?.nearest_police_station?.police_station,
      };
      setValue("policeStation", data);

      if (
        individualData?.locationBasedJurisdiction?.nearest_police_station === null ||
        individualData?.locationBasedJurisdiction?.nearest_police_station === undefined
      ) {
        toast.error(t("GEOLOCATION_ERROR"), 5000);
      } else {
        toast.success(t("GEOLOCATION_SUCCESS"), 5000);
      }

      return individualData;
    } catch (error) {
      toast.error(t("GEOLOCATION_ERROR"));
    } finally {
      setIsLoading(false);
    }
  };

  const validateCoordinate = (value, validation) => {
    if (!value) return null;

    const numericValue = parseFloat(value);
    if (
      (validation?.lowerBound !== undefined && numericValue < validation.lowerBound) ||
      (validation?.upperBound !== undefined && numericValue > validation.upperBound)
    ) {
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
          additionalWrapperClass={"radio-group"}
          options={config?.juridictionRadioButton?.options}
          optionsKey="name"
          selectedOption={locationFormData?.[config.key]?.["jurisdictionKnown"] || config?.juridictionRadioButton?.defaultValue}
          onSelect={(value) => setValue("jurisdictionKnown", value)}
          disabled={disable}
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
        <b>{t("GEOLOCATION_TITLE")}</b> <span style={{ color: "#77787B" }}>{`(${t("CAPITAL_OPTIONAL")})`}</span>
      </div>

      <div className="coordinate-container">
        <div className="lat-long">
          <LabelFieldPair>
            <CardLabel>{t(config?.latitudeInput?.label)}</CardLabel>
            <TextInput
              className={"latlong-input"}
              type={"number"}
              value={locationFormData?.[config.key]?.["latitude"] || ""}
              disabled={
                disable ||
                (locationFormData?.[config.key]?.["jurisdictionKnown"]?.code
                  ? locationFormData?.[config.key]?.["jurisdictionKnown"]?.code === "YES"
                  : true)
              }
              onChange={(e) => {
                setIsLoading(false);
                let temp = e.target.value?.split(".");
                if (temp[1] && temp[1].length > config?.latitudeInput?.validation?.precision) {
                  temp[1] = temp[1].slice(0, config?.latitudeInput?.validation?.precision);
                  e.target.value = temp.join(".");
                }
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
              className={"latlong-input"}
              value={locationFormData?.[config.key]?.["longitude"] || ""}
              disabled={
                disable ||
                (locationFormData?.[config.key]?.["jurisdictionKnown"]?.code
                  ? locationFormData?.[config.key]?.["jurisdictionKnown"]?.code === "YES"
                  : true)
              }
              onChange={(e) => {
                setIsLoading(false);
                let temp = e.target.value?.split(".");
                if (temp[1] && temp[1].length > config?.longitudeInput?.validation?.precision) {
                  temp[1] = temp[1].slice(0, config?.longitudeInput?.validation?.precision);
                  e.target.value = temp.join(".");
                }
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
          isDisabled={disable || locationButtonDisable || isLoading}
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
              {
                <React.Fragment>
                  {t(config?.policeStationDropdown?.header)} <span style={{ opacity: 0.5 }}>{t("IS_OPTIONAL")}</span>
                </React.Fragment>
              }
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
          option={sortedPoliceStations}
          optionKey={"name"}
          type="dropdown"
          disable={disable || locationFormData?.[config.key]?.["jurisdictionKnown"]?.code === "NO"}
        />
      </LabelFieldPair>
    </div>
  );
};

export default GeoLocationComponent;
