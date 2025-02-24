import React from "react";
import { LabelFieldPair, CardLabel, TextInput, Dropdown, CardLabelError, RadioButtons, Button } from "@egovernments/digit-ui-react-components";
import SelectCustomNote from "./SelectCustomNote";
import CustomErrorTooltip from "./CustomErrorTooltip";
import { useToast } from "./Toast/useToast";

const GeoLocationComponent = ({ t, config, locationFormData, onGeoLocationSelect }) => {
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const toast = useToast();
  const { data: policeStationData } = Digit.Hooks.useCustomMDMS(Digit.ULBService.getStateId(), "case", [{ name: "PoliceStation" }], {
    select: (data) => {
      return data;
    },
  });
  const resetFieldsConfig = {
    jurisdictionKnown: {
      Yes: ["latitude", "longitude"],
      No: ["policeStation"],
    },
  };

  const getResetFields = React.useMemo(
    () => (key, value) => {
      const fieldsToReset = resetFieldsConfig[key]?.[value?.name] || [];
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
        toast.error(t("GEOLOCATION_ERROR"));
      } else {
        toast.success(t("GEOLOCATION_SUCCESS"));
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

  const validateCoordinate = (value, validation) => {
    if (value && validation?.pattern && !value.match(validation.pattern)) {
      return (
        <CardLabelError style={{ width: "100%", marginTop: "-15px", fontSize: "16px", marginBottom: "12px", color: "#FF0000" }}>
          <span style={{ color: "#FF0000" }}>{t(validation?.errMsg || "CORE_COMMON_INVALID")}</span>
        </CardLabelError>
      );
    }
    return null;
  };

  return (
    <div className="geo-location-component">
      <div className="police-station-juridiction">
        <CardLabel>{t(config?.juridictionRadioButton?.label)}</CardLabel>
        <RadioButtons
          additionalWrapperClass="radio-group"
          options={config?.juridictionRadioButton?.options}
          optionsKey="name"
          selectedOption={locationFormData?.[config.key]?.["jurisdictionKnown"] || { code: "yes", name: "Yes" }}
          onSelect={(value) => setValue("jurisdictionKnown", value)}
        />
      </div>

      {locationFormData?.[config.key]?.["jurisdictionKnown"]?.name === "No" && (
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
        <b>GeoLocation</b> <span>(Optional)</span>
      </div>

      <div className="coordinate-container">
        <div className="lat-long">
          <LabelFieldPair>
            <CardLabel>{t(config?.latitudeInput?.label)}</CardLabel>
            <TextInput
              type={"number"}
              value={locationFormData?.[config.key]?.["latitude"] || ""}
              disabled={
                locationFormData?.[config.key]?.["jurisdictionKnown"]?.name
                  ? locationFormData?.[config.key]?.["jurisdictionKnown"]?.name === "Yes"
                  : true
              }
              onChange={(e) => setValue("latitude", e.target.value)}
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
                locationFormData?.[config.key]?.["jurisdictionKnown"]?.name
                  ? locationFormData?.[config.key]?.["jurisdictionKnown"]?.name === "Yes"
                  : true
              }
              onChange={(e) => setValue("longitude", e.target.value)}
              {...config?.longitudeInput?.validation}
            />

            {/* Validation Error Message */}
            {validateCoordinate(locationFormData?.[config.key]?.["longitude"], config?.longitudeInput?.validation)}
          </LabelFieldPair>
        </div>
        <Button
          className={"custom-button-policeStation"}
          label={t(config?.policeStationDropdown?.label)}
          isDisabled={
            locationFormData?.[config.key]?.["jurisdictionKnown"]?.name ? locationFormData?.[config.key]?.["jurisdictionKnown"]?.name === "Yes" : true
          }
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
          disable={locationFormData?.[config.key]?.["jurisdictionKnown"]?.name === "No"}
          style={{ width: "100%", maxWidth: "100%" }}
        />
      </LabelFieldPair>
    </div>
  );
};

export default GeoLocationComponent;
