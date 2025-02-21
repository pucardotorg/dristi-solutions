import React from "react";
import { LabelFieldPair, CardLabel, TextInput, Dropdown, CardLabelError, RadioButtons, Button } from "@egovernments/digit-ui-react-components";
import SelectCustomNote from "./SelectCustomNote";
import CustomErrorTooltip from "./CustomErrorTooltip";
import { useToast } from "./Toast/useToast";

const GeoLocationComponent = ({ t, config, locationFormData, onGeoLocationSelect }) => {
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const inputs = config?.populators?.inputs;
  const toast = useToast();
  const { data: policeStationData } = Digit.Hooks.useCustomMDMS(Digit.ULBService.getStateId(), "case", [{ name: "PoliceStation" }], {
    select: (data) => {
      return data;
    },
  });
  const setValue = (key, value) => {
    const resetFields = ["latitude", "longitude", "policeStation"].reduce((acc, field) => {
      if (
        (key === "jurisdictionKnown" && value?.name === "Yes" && (field === "latitude" || field === "longitude")) ||
        (key === "jurisdictionKnown" && value?.name === "No" && field === "policeStation")
      ) {
        acc[field] = null;
      }
      return acc;
    }, {});

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
        toast.error("Error: Something went wrong, please try again later, or check the entered values");
      } else {
        toast.success("Success: Jurisdiction data found.");
      }

      let option = {
        code: individualData?.locationBasedJurisdiction?.nearest_police_station?.police_station_code,
        name: individualData?.locationBasedJurisdiction?.nearest_police_station?.police_station,
      };
      setValue("policeStation", option);
      return individualData;
    } catch (error) {
      console.log("error", error);
      toast.error("Error: Something went wrong, please try again later, or check the entered values");
    }
  };
  return (
    <div className="geo-location-component">
      <div className="police-station-juridiction">
        <CardLabel>{t("Do you know which police station's jurisdiction this address belongs to?")}</CardLabel>
        <RadioButtons
          additionalWrapperClass="radio-group"
          options={inputs[0].options}
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
                  infoText: "You can use an online map software to get latitude and longitude of an address.",
                  infoTooltipMessage: "NEW_PARTY_NOTE",
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
            <CardLabel>{t(inputs[1].label)}</CardLabel>
            <TextInput
              type={"number"}
              value={locationFormData?.[config.key]?.["latitude"] || ""}
              disabled={
                locationFormData?.[config.key]?.["jurisdictionKnown"]?.name
                  ? locationFormData?.[config.key]?.["jurisdictionKnown"]?.name === "Yes"
                  : true
              }
              onChange={(e) => setValue("latitude", e.target.value)}
              {...config?.populators?.inputs[1]?.validation}
            />
            {/* Validation Error Message */}
            {(() => {
              let currentValue = locationFormData?.[config.key]?.["latitude"] || "";
              let validation = config?.populators?.inputs[1]?.validation;

              if (currentValue && validation?.pattern && !currentValue.match(validation.pattern)) {
                return (
                  <CardLabelError style={{ width: "100%", marginTop: "-15px", fontSize: "16px", marginBottom: "12px", color: "#FF0000" }}>
                    <span style={{ color: "#FF0000" }}>{t(validation?.errMsg || "CORE_COMMON_INVALID")}</span>
                  </CardLabelError>
                );
              }
            })()}
          </LabelFieldPair>

          <LabelFieldPair>
            <CardLabel>{t(inputs[2].label)}</CardLabel>
            <TextInput
              type={"number"}
              value={locationFormData?.[config.key]?.["longitude"] || ""}
              disabled={
                locationFormData?.[config.key]?.["jurisdictionKnown"]?.name
                  ? locationFormData?.[config.key]?.["jurisdictionKnown"]?.name === "Yes"
                  : true
              }
              onChange={(e) => setValue("longitude", e.target.value)}
              {...config?.populators?.inputs[2]?.validation}
            />

            {/* Validation Error Message */}
            {(() => {
              let currentValue = locationFormData?.[config.key]?.["longitude"] || "";
              let validation = config?.populators?.inputs[2]?.validation;

              if (currentValue && validation?.pattern && !currentValue.match(validation.pattern)) {
                return (
                  <CardLabelError style={{ wiCustomNotedth: "100%", marginTop: "-15px", fontSize: "16px", marginBottom: "12px", color: "#FF0000" }}>
                    <span style={{ color: "#FF0000" }}>{t(validation?.errMsg || "CORE_COMMON_INVALID")}</span>
                  </CardLabelError>
                );
              }
            })()}
          </LabelFieldPair>
        </div>
        <Button
          className={"custom-button-policeStation"}
          label={t("Get Police Station")}
          isDisabled={
            locationFormData?.[config.key]?.["jurisdictionKnown"]?.name ? locationFormData?.[config.key]?.["jurisdictionKnown"]?.name === "Yes" : true
          }
          onButtonClick={() => {
            var lat = locationFormData?.[config.key]?.["latitude"];
            var long = locationFormData?.[config.key]?.["longitude"];

            console.log(getPoliceStationByLocation(lat, long));
          }}
        />
      </div>

      <LabelFieldPair>
        <CardLabel>
          {
            <div className="police-station-label">
              {t("Police Stations (Optional)")}
              <CustomErrorTooltip
                message={"Enter the police station whose jurisdiction this address falls under. Summons will be sent via this police station."}
                showTooltip={"visible"}
                icon
              />
            </div>
          }
        </CardLabel>
        <Dropdown
          className={"police-station-dropdown"}
          label="Select police station"
          name="police station"
          select={(selectedOption) => {
            console.log("selectedOption", selectedOption);
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
