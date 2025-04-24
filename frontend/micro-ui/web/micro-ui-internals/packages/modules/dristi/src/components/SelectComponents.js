import { CardLabel, CardLabelError, LabelFieldPair, TextInput, RadioButtons } from "@egovernments/digit-ui-react-components";
import Axios from "axios";
import React, { useMemo, useState } from "react";
import LocationSearch from "./LocationSearch";
import { generateUUID, formatAddress } from "../Utils";
import SelectCustomNote from "./SelectCustomNote";
import { Controller } from "react-hook-form";

const getLocation = (places, code) => {
  let location = null;
  location = places?.address_components?.find((place) => {
    return place.types.includes(code);
  })?.long_name;
  return location ? location : null;
};

const SelectComponents = ({ t, config, onSelect, formData = {}, errors, formState, control, watch, register }) => {
  const configKey = `${config.key}-select`;
  // const configKey = config.key;
  const [coordinateData, setCoordinateData] = useState({ callbackFunc: () => {} });

  const { isLoading: isTypeOfAddressData, data: typeOfAddressData } = Digit.Hooks.useCustomMDMS(
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

  const { inputs, uuid } = useMemo(() => {
    const defaultInputs = [
      {
        label: "CS_LOCATION",
        type: "LocationSearch",
        name: [],
      },
    ];
    const finalInputs = config?.populators?.inputs ? [...config.populators.inputs] : defaultInputs;
    const typeOfAddressField = finalInputs.find((input) => input.name === "typeOfAddress");
    if (typeOfAddressField) {
      typeOfAddressField.options = typeOfAddressData;
    }

    return {
      inputs: finalInputs,
      uuid: generateUUID(),
    };
  }, [config?.populators?.inputs, typeOfAddressData]);

  const getLatLngByPincode = async (pincode) => {
    const key = window?.globalConfigs?.getConfig("GMAPS_API_KEY");
    const response = await Axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${pincode}&key=${key}`);
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
            throw new Error("Invalid Pincode");
          } else {
            const [location] = res.data.results;
            onSelect(configKey, {
              ...formData[configKey],
              [input]: value,
              state: getLocation(location, "administrative_area_level_1") || "",
              district: getLocation(location, "administrative_area_level_3") || "",
              city: getLocation(location, "locality") || "",
              locality: (() => {
                const plusCode = getLocation(location, "plus_code");
                const neighborhood = getLocation(location, "neighborhood");
                const sublocality_level_1 = getLocation(location, "sublocality_level_1");
                const sublocality_level_2 = getLocation(location, "sublocality_level_2");
                return [plusCode, neighborhood, sublocality_level_1, sublocality_level_2]
                  .reduce((result, current) => {
                    if (current) {
                      result.push(current);
                    }
                    return result;
                  }, [])
                  .join(", ");
              })(),
              coordinates: { latitude: location.geometry.location.lat, longitude: location.geometry.location.lng },
            });
            onSelect(
              config.key,
              {
                ...formData[config.key],
                [input]: value,
                state: getLocation(location, "administrative_area_level_1") || "",
                district: getLocation(location, "administrative_area_level_3") || "",
                city: getLocation(location, "locality") || "",
                locality: (() => {
                  const plusCode = getLocation(location, "plus_code");
                  const neighborhood = getLocation(location, "neighborhood");
                  const sublocality_level_1 = getLocation(location, "sublocality_level_1");
                  const sublocality_level_2 = getLocation(location, "sublocality_level_2");
                  return [plusCode, neighborhood, sublocality_level_1, sublocality_level_2]
                    .reduce((result, current) => {
                      if (current) {
                        result.push(current);
                      }
                      return result;
                    }, [])
                    .join(", ");
                })(),
                coordinates: { latitude: location.geometry.location.lat, longitude: location.geometry.location.lng },
              },
              { shouldValidate: true }
            );
            coordinateData.callbackFunc({ lat: location.geometry.location.lat, lng: location.geometry.location.lng });
          }
        })
        .catch((err) => {
          onSelect(
            configKey,
            {
              ...formData[configKey],
              ...["state", "district", "city", "locality", "coordinates", "pincode"].reduce((res, curr) => {
                res[curr] = "";
                if (curr === "pincode") {
                  res[curr] = value;
                }
                return res;
              }, {}),
            },
            { shouldValidate: true }
          );
        });
      return;
    } else if (input === "pincode" && autoFill === true) {
      ["state", "district", "city", "locality", "coordinates"].forEach((key) => {
        onSelect(`${configKey}.${key}`, "");
      });
      onSelect(`${configKey}.${"pincode"}`, value);
      return;
    }
    if (Array.isArray(input)) {
      if (!config?.isUserVerified) {
        onSelect(
          config.key,
          {
            ...formData[config.key],
            ...input.reduce((res, curr) => {
              res[curr] = value[curr];
              return res;
            }, {}),
          },
          { shouldValidate: true }
        );
      }
      if (!config?.isUserVerified) {
        onSelect(
          configKey,
          {
            ...formData[configKey],
            ...input.reduce((res, curr) => {
              res[curr] = value[curr];
              return res;
            }, {}),
          },
          { shouldValidate: true }
        );
      }
    } else {
      onSelect(`${configKey}.${input}`, value, { shouldValidate: true });
      onSelect(config.key, { ...formData?.[config.key], [input]: value }, { shouldValidate: true });
      if (config?.key === "poaAddressDetails") {
        onSelect("poaVerification", {
          ...formData?.["poaVerification"],
          individualDetails: {
            ...formData?.["poaVerification"]?.individualDetails,
            "poaAddressDetails-select": { ...formData?.["poaAddressDetails-select"], [input]: value },
            poaAddressDetails: {
              ...formData?.["poaAddressDetails"],
              [input]: value,
              coordinates: formData?.["poaAddressDetails"]?.coordinates ? formData["poaAddressDetails"].coordinates : { longitude: "", latitude: "" },
            },
          },
          isUserVerified: true,
        });
      } else {
        onSelect("complainantVerification", {
          ...formData?.["complainantVerification"],
          individualDetails: {
            ...formData?.["complainantVerification"]?.individualDetails,
            "addressDetails-select": { ...formData?.["addressDetails-select"], [input]: value },
            addressDetails: {
              ...formData?.["addressDetails"],
              [input]: value,
              coordinates: formData?.["addressDetails"]?.coordinates ? formData["addressDetails"].coordinates : { longitude: "", latitude: "" },
            },
          },
          isUserVerified: true,
        });
      }
    }
  }

  const checkIfValidated = (currentValue, input) => {
    const isEmpty = /^\s*$/.test(currentValue);
    return isEmpty || !currentValue.match(window?.Digit.Utils.getPattern(input.validation.patternType) || input.validation.pattern);
  };
  return (
    <div>
      {config?.notes && <SelectCustomNote t={t} config={config?.notes} onClick={() => {}} />}
      {inputs?.map((input, index) => {
        let currentValue = (formData && formData[configKey] && formData[configKey][input.name]) || "";
        let isFirstRender = true;
        return (
          <React.Fragment key={index}>
            {errors[input.name] && <CardLabelError>{t(input.error)}</CardLabelError>}
            <LabelFieldPair>
              <CardLabel className="card-label-smaller">
                {t(input.label)}
                <span style={{ color: "rgb(119, 120, 123)" }}>{input?.showOptional && ` ${t("CS_IS_OPTIONAL")}`}</span>
              </CardLabel>
              <div className={`field ${input.inputFieldClassName}`}>
                {input?.type === "LocationSearch" ? (
                  <LocationSearch
                    locationStyle={{ maxWidth: "100%" }}
                    position={formData?.[config.key]?.coordinates || {}}
                    setCoordinateData={setCoordinateData}
                    disable={input?.isDisabled || config?.disable}
                    index={config?.uuid}
                    onChange={(pincode, location, coordinates = {}) => {
                      setValue(
                        {
                          pincode: formData && isFirstRender && formData[configKey] ? formData[configKey]["pincode"] : pincode || "",
                          state:
                            formData && isFirstRender && formData[configKey]
                              ? formData[configKey]["state"]
                              : getLocation(location, "administrative_area_level_1") || "",
                          district:
                            formData && isFirstRender && formData[configKey]
                              ? formData[configKey]["district"]
                              : getLocation(location, "administrative_area_level_3") || "",
                          city:
                            formData && isFirstRender && formData[configKey] ? formData[configKey]["city"] : getLocation(location, "locality") || "",
                          locality:
                            isFirstRender && formData[configKey]
                              ? formData[configKey]["locality"]
                              : (() => {
                                  const plusCode = getLocation(location, "plus_code");
                                  const neighborhood = getLocation(location, "neighborhood");
                                  const sublocality_level_1 = getLocation(location, "sublocality_level_1");
                                  const sublocality_level_2 = getLocation(location, "sublocality_level_2");
                                  return [plusCode, neighborhood, sublocality_level_1, sublocality_level_2]
                                    .reduce((result, current) => {
                                      if (current) {
                                        result.push(current);
                                      }
                                      return result;
                                    }, [])
                                    .join(", ");
                                })(),
                          coordinates,
                          buildingName: formData && isFirstRender && formData[config.key] ? formData[configKey]["buildingName"] : "",
                          doorNo: formData && isFirstRender && formData[config.key] ? formData[configKey]["doorNo"] : "",
                        },
                        input.name
                      );
                      isFirstRender = false;
                    }}
                  />
                ) : input?.type === "Radio" ? (
                  <RadioButtons
                    style={{
                      display: "flex",
                      justifyContent: "flex-start",
                      gap: "3rem",
                      ...input.styles,
                    }}
                    selectedOption={formData?.[config?.key]?.[input?.name]}
                    options={input?.options}
                    optionsKey={"code"}
                    innerStyles={{ justifyContent: "start" }}
                    onSelect={(value) => {
                      setValue(value, input?.name);
                    }}
                    disabled={input?.disable || config?.disable}
                  />
                ) : (
                  <React.Fragment>
                    <Controller
                      control={control}
                      name={`${configKey}.${input.name}`}
                      rules={{
                        required: input.isMandatory,
                        ...input.validation,
                      }}
                      render={({ field }) => (
                        <TextInput
                          className="field desktop-w-full"
                          {...field}
                          value={watch(`${configKey}.${input.name}`)}
                          onChange={(e) => {
                            let value = e.target.value;
                            if (input?.isFormatRequired) {
                              value = formatAddress(value);
                            }
                            setValue(value, input.name, input?.autoFill);
                          }}
                          disable={input.isDisabled || config?.disable}
                        />
                      )}
                    />
                  </React.Fragment>
                )}
                {currentValue && currentValue.length > 0 && input.validation && checkIfValidated(currentValue, input) && (
                  <CardLabelError style={{ width: "100%", marginTop: "-15px", fontSize: "16px", marginBottom: "12px", color: "#FF0000" }}>
                    <span style={{ color: "#FF0000" }}> {t(input.validation?.errMsg || "CORE_COMMON_INVALID")}</span>
                  </CardLabelError>
                )}
                {errors[input?.name] && (
                  <CardLabelError>
                    <span style={{ color: "#ff0000" }}>{t(errors[input?.name]?.message)}</span>
                  </CardLabelError>
                )}
              </div>
            </LabelFieldPair>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default SelectComponents;
