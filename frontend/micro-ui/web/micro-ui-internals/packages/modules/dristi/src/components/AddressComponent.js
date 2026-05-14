import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { CardLabel, TextInput, CardLabelError } from "@egovernments/digit-ui-react-components";
import LocationSearch from "./LocationSearch";
import { ReactComponent as SmallInfoIcon } from "../images/smallInfoIcon.svg";
import axiosInstance from "@egovernments/digit-ui-module-core/src/Utils/axiosInstance";
import { sanitizeData } from "../Utils";

const getLocation = (places, code) => {
  let location = null;
  location = places?.address_components?.find((place) => {
    return place.types.includes(code);
  })?.long_name;
  return location ?? null;
};

const formatLocalityFromGooglePlace = (location) => {
  if (!location) {
    return "";
  }
  const plusCode = getLocation(location, "plus_code");
  const neighborhood = getLocation(location, "neighborhood");
  const sublocalityLevel1 = getLocation(location, "sublocality_level_1");
  const sublocalityLevel2 = getLocation(location, "sublocality_level_2");
  return [plusCode, neighborhood, sublocalityLevel1, sublocalityLevel2].filter(Boolean).join(", ");
};

const clearedAddressExceptPincode = (value, fields) =>
  fields.reduce((res, curr) => {
    res[curr] = "";
    if (curr === "pincode") {
      res[curr] = value;
    }
    return res;
  }, {});

const ADDRESS_RESET_FIELDS = ["state", "district", "city", "locality", "coordinates", "pincode"];

const AddressComponent = ({ t, config, onSelect, formData = {}, errors }) => {
  const inputs = useMemo(
    () =>
      config?.populators?.inputs || [
        {
          label: "CS_LOCATION",
          type: "LocationSearch",
          name: [],
        },
      ],
    [config?.populators?.inputs]
  );
  const [coordinateData, setCoordinateData] = useState({ callbackFunc: () => {} });

  const getLatLngByPincode = async (pincode) => {
    const key = window?.globalConfigs?.getConfig("GMAPS_API_KEY");
    const response = await axiosInstance.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${pincode}&key=${key}`);
    return response;
  };
  function setValue(value, input, autoFill) {
    if (input === "pincode" && value?.length === 6 && autoFill === true) {
      getLatLngByPincode(value)
        .then((res) => {
          if (
            (res.data.results && res.data.results?.length === 0) ||
            (res.data.status === "OK" && getLocation(res.data.results[0], "country") !== "India")
          ) {
            onSelect(config.key, {
              ...formData[config.key],
              ...clearedAddressExceptPincode(value, ADDRESS_RESET_FIELDS),
            });
          } else {
            const [location] = res.data.results;
            onSelect(config.key, {
              ...formData[config.key],
              [input]: value,
              state: getLocation(location, "administrative_area_level_1") || "",
              district: getLocation(location, "administrative_area_level_3") || "",
              city: getLocation(location, "locality") || "",
              locality: formatLocalityFromGooglePlace(location),
              coordinates: { latitude: location.geometry.location.lat, longitude: location.geometry.location.lng },
            });
            coordinateData.callbackFunc({ lat: location.geometry.location.lat, lng: location.geometry.location.lng });
          }
        })
        .catch(() => {
          onSelect(config.key, {
            ...formData[config.key],
            ...clearedAddressExceptPincode(value, ADDRESS_RESET_FIELDS),
          });
        });
      return;
    } else if (input === "pincode" && autoFill === true) {
      onSelect(config.key, {
        ...formData[config.key],
        ...clearedAddressExceptPincode(value, ADDRESS_RESET_FIELDS),
      });
      return;
    }
    if (Array.isArray(input)) {
      onSelect(config.key, {
        ...formData[config.key],
        ...input.reduce((res, curr) => {
          res[curr] = value[curr];
          return res;
        }, {}),
      });
    } else {
      // Sanitize specific address fields before saving
      if (input === "state" || input === "district" || input === "city") {
        value = value.replace(/[^A-Za-z\s]/g, "");
      } else if (input === "pincode") {
        value = value.replace(/\D/g, "");
      }

      if (typeof value === "string" && value.startsWith(" ")) {
        value = "";
      }

      onSelect(config.key, { ...formData[config.key], [input]: value });
    }
  }

  return (
    <div style={config?.populators?.customStyle}>
      {inputs
        .filter((input) => input.type === "LocationSearch")
        .map((input) => {
          let isFirstRender = true;
          const locationSearchKey =
            typeof input.name === "string" || typeof input.name === "number"
              ? `loc-${input.name}`
              : `loc-${input.type}-${JSON.stringify(input.name)}`;

          return (
            <div className="field" key={locationSearchKey} style={{ alignContent: "center" }}>
              <LocationSearch
                locationStyle={{ maxWidth: "900px" }}
                position={formData?.[config.key]?.coordinates || {}}
                setCoordinateData={setCoordinateData}
                onChange={(pincode, location, coordinates = {}) => {
                  setValue(
                    {
                      pincode: formData && isFirstRender && formData[config.key] ? formData[config.key]["pincode"] : pincode || "",
                      state:
                        formData && isFirstRender && formData[config.key]
                          ? formData[config.key]["state"]
                          : getLocation(location, "administrative_area_level_1") || "",
                      district:
                        formData && isFirstRender && formData[config.key]
                          ? formData[config.key]["district"]
                          : getLocation(location, "administrative_area_level_3") || "",
                      city:
                        formData && isFirstRender && formData[config.key] ? formData[config.key]["city"] : getLocation(location, "locality") || "",
                      locality:
                        isFirstRender && formData?.[config.key]
                          ? formData[config.key]["locality"]
                          : formatLocalityFromGooglePlace(location),
                      coordinates,
                      buildingName: formData && isFirstRender && formData[config.key] ? formData[config.key]["buildingName"] : "",
                      doorNo: formData && isFirstRender && formData[config.key] ? formData[config.key]["doorNo"] : "",
                    },
                    input.name
                  );
                  isFirstRender = false;
                }}
              />
              <div className="user-address-map-info">
                <SmallInfoIcon></SmallInfoIcon>
                <span>{t("MOVE_PIN_ON_MAP_MESSAGE")}</span>
              </div>
            </div>
          );
        })}

      <div className="address-card-input">
        {inputs
          .filter((input) => input.type !== "LocationSearch")
          .map((input) => {
            let currentValue = formData?.[config.key]?.[input.name] || "";
            return (
              <React.Fragment key={input.name}>
                {errors[input.name] && <CardLabelError>{t(input.error)}</CardLabelError>}
                <div className="field">
                  <CardLabel className="card-label-smaller">{t(input.label)}</CardLabel>
                  <TextInput
                    className="field desktop-w-full"
                    key={input.name}
                    value={formData?.[config.key]?.[input.name]}
                    onChange={(e) => {
                      const newValue = sanitizeData(e.target.value);
                      setValue(newValue, input.name, input?.autoFill);
                    }}
                    disable={input.isDisabled}
                    defaultValue={undefined}
                    {...input.validation}
                  />
                  {currentValue &&
                    currentValue.length > 0 &&
                    input.validation &&
                    !currentValue.match(window?.Digit.Utils.getPattern(input.validation.patternType) || input.validation.pattern) && (
                      <CardLabelError>{t(input.validation?.errMsg || "CORE_COMMON_INVALID")}</CardLabelError>
                    )}
                </div>
              </React.Fragment>
            );
          })}
      </div>
    </div>
  );
};

const addressInputPopulatorPropType = PropTypes.shape({
  type: PropTypes.string,
  name: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
  label: PropTypes.string,
  error: PropTypes.string,
  autoFill: PropTypes.bool,
  isDisabled: PropTypes.bool,
  validation: PropTypes.object,
});

const addressFieldConfigPropType = PropTypes.shape({
  key: PropTypes.string,
  populators: PropTypes.shape({
    inputs: PropTypes.arrayOf(addressInputPopulatorPropType),
    customStyle: PropTypes.object,
  }),
});

AddressComponent.propTypes = {
  t: PropTypes.func.isRequired,
  config: addressFieldConfigPropType.isRequired,
  onSelect: PropTypes.func.isRequired,
  formData: PropTypes.object,
  errors: PropTypes.object,
};

export default AddressComponent;
