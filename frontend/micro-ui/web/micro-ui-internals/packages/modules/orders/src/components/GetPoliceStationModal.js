import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Modal, CloseSvg, TextInput, CardLabel, Dropdown } from "@egovernments/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { useToast } from "@egovernments/digit-ui-module-dristi/src/components/Toast/useToast";
import SelectCustomNote from "@egovernments/digit-ui-module-dristi/src/components/SelectCustomNote";
import { InfoIcon } from "@egovernments/digit-ui-module-dristi/src/icons/svgIndex";

const customNoteConfig = {
  populators: {
    inputs: [
      {
        infoHeader: "CS_COMMON_NOTE",
        infoText: "POLICE_STATION_LOCATION_INFO",
        showTooltip: true,
      },
    ],
  },
};

const GetPoliceStationModal = ({ isOpen = false, onClose, onPoliceStationSelect, address }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const [isLoading, setIsLoading] = useState(false);
  const [coordinates, setCoordinates] = useState({ latitude: "", longitude: "" });
  const [policeStation, setPoliceStation] = useState(null);
  const [policeStationOptions, setPoliceStationOptions] = useState([]);
  const [errors, setErrors] = useState({ latitude: "", longitude: "" });
  const [policeStationError, setPoliceStationError] = useState("");

  // Clear error after timeout
  useEffect(() => {
    let timeoutId;
    if (policeStationError) {
      timeoutId = setTimeout(() => {
        setPoliceStationError("");
      }, 3000);
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [policeStationError]);

  const validateCoordinate = useCallback(
    (value, type) => {
      if (!value || value === "") {
        return { isValid: false, error: t("PLEASE_ENTER_VALUE") };
      }

      const numericValue = parseFloat(value);
      if (isNaN(numericValue)) {
        return { isValid: false, error: t("PLEASE_ENTER_VALID_NUMBER") };
      }

      if (type === "latitude") {
        if (numericValue < -90 || numericValue > 90) {
          return { isValid: false, error: t("LATITUDE_RANGE_ERROR") };
        }
      }

      if (type === "longitude") {
        if (numericValue < -180 || numericValue > 180) {
          return { isValid: false, error: t("LONGITUDE_RANGE_ERROR") };
        }
      }

      return { isValid: true, error: "" };
    },
    [t]
  );

  // Check if there are any validation errors
  const hasValidationErrors = useMemo(() => {
    const latValidation = validateCoordinate(coordinates.latitude, "latitude");
    const longValidation = validateCoordinate(coordinates.longitude, "longitude");
    return !latValidation.isValid || !longValidation.isValid;
  }, [coordinates.latitude, coordinates.longitude, validateCoordinate]);

  const handleInputChange = (e, type) => {
    const value = e.target.value;

    // Allow empty value or numbers with up to 6 decimal places
    if (value === "" || /^-?\d*\.?\d{0,6}$/.test(value)) {
      setCoordinates((prev) => ({ ...prev, [type]: value }));

      // Validate and set error
      const validation = validateCoordinate(value, type);
      setErrors((prev) => ({ ...prev, [type]: validation.error }));
    }
  };

  const getPoliceStationByLocation = async () => {
    // Validate both coordinates
    const latValidation = validateCoordinate(coordinates.latitude, "latitude");
    const longValidation = validateCoordinate(coordinates.longitude, "longitude");

    setErrors({
      latitude: latValidation.error,
      longitude: longValidation.error,
    });

    if (!latValidation.isValid || !longValidation.isValid) {
      return;
    }

    setIsLoading(true);
    setPoliceStationError("");
    try {
      const response = await window?.Digit.DRISTIService.getLocationBasedJurisdiction(
        {
          location: {
            latitude: parseFloat(coordinates.latitude),
            longitude: parseFloat(coordinates.longitude),
          },
        },
        { tenantId }
      );
      const nearestPoliceStation = response?.locationBasedJurisdiction?.nearest_police_station;

      if (!nearestPoliceStation) {
        setPoliceStationError(t("NO_POLICE_STATION_FOUND_FOR_THESE_COORDINATES"));
        setPoliceStation(null);
        setPoliceStationOptions([]);
        return;
      }

      const data = {
        code: nearestPoliceStation.police_station_code,
        name: nearestPoliceStation.police_station,
      };

      setPoliceStation(data);
      setPoliceStationOptions([data]);
      toast.success(t("POLICE_STATION_FOUND"));
    } catch (error) {
      console.error("Error fetching police station:", error);
      setPoliceStationError(t("ERROR_FETCHING_POLICE_STATION"));
      setPoliceStation(null);
      setPoliceStationOptions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!policeStation) {
      setPoliceStationError(t("PLEASE_GET_POLICE_STATION_FIRST"));
      return;
    }
    onPoliceStationSelect(policeStation);
    onClose();
  };

  return (
    <Modal
      headerBarMain={<h1 className="heading-m">{t("FIND_POLICE_STATION")}</h1>}
      headerBarEnd={<CloseBtn onClick={onClose} />}
      actionCancelLabel={t("CS_COMMON_CANCEL")}
      actionCancelOnSubmit={onClose}
      actionSaveLabel={t("SAVE")}
      actionSaveOnSubmit={handleSave}
      isDisabled={isLoading || hasValidationErrors || !policeStation}
      formId="modal-action"
      popupStyles={{}}
      isOpen={isOpen}
      popmoduleClassName={"get-police-station-modal"}
    >
      <div style={{ padding: "24px 0px" }}>
        <div style={{ marginBottom: "24px" }}>
          <div
            style={{
              padding: "16px",
              background: "#F7F5F3",
              borderRadius: "4px",
              fontSize: "16px",
              color: "#0B0C0C",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>{t("ADDRESS")}</span>
            <span> {address}</span>
          </div>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <SelectCustomNote t={t} config={customNoteConfig}></SelectCustomNote>
        </div>

        <div style={{ display: "flex", gap: "24px", marginBottom: "24px", alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <CardLabel style={{ paddingBottom: "5px" }}>{t("LATITUDE")}</CardLabel>
            <TextInput
              type="text"
              value={coordinates.latitude}
              onChange={(e) => handleInputChange(e, "latitude")}
              style={{ width: "100%", height: "40px" }}
              disable={isLoading}
              error={errors.latitude}
            />
            {errors.latitude && <div style={{ color: "#d4351c", fontSize: "14px", marginTop: "4px" }}>{errors.latitude}</div>}
          </div>
          <div style={{ flex: 1 }}>
            <CardLabel style={{ paddingBottom: "5px" }}>{t("LONGITUDE")}</CardLabel>
            <TextInput
              type="text"
              value={coordinates.longitude}
              onChange={(e) => handleInputChange(e, "longitude")}
              style={{ width: "100%", height: "40px" }}
              disable={isLoading}
              error={errors.longitude}
            />
            {errors.longitude && <div style={{ color: "#d4351c", fontSize: "14px", marginTop: "4px" }}>{errors.longitude}</div>}
          </div>
          <div style={{ flex: 1, marginTop: "4px" }}>
            <button
              onClick={getPoliceStationByLocation}
              disabled={isLoading || hasValidationErrors}
              style={{
                background: "white",
                height: "40px",
                border: "1px solid #007E7E",
                color: "#007E7E",
                padding: "8px 24px",
                cursor: hasValidationErrors || isLoading ? "not-allowed" : "pointer",
                fontSize: "16px",
                fontWeight: "700",
                marginTop: "18px",
              }}
            >
              {t("GET_POLICE_STATION")}
            </button>
          </div>
        </div>

        {policeStationError && <div style={{ color: "#d4351c", fontSize: "14px", marginBottom: "24px" }}>{policeStationError}</div>}

        <div>
          <div style={{ display: "flex", flexDirection: "row", gap: "10px", alignItems: "end", marginBottom: "10px" }}>
            <span>{t("POLICE_STATION")}</span>
            <InfoIcon />
          </div>
          <TextInput
            type="text"
            value={policeStation?.name}
            style={{ height: "40px", background: "#D9D9D9" }}
            textInputStyle={{ maxWidth: "100%" }}
            disable={true}
          />
        </div>
      </div>
    </Modal>
  );
};

const CloseBtn = (props) => (
  <div className="icon-bg-secondary" onClick={props.onClick} style={{ cursor: "pointer", padding: "8px", background: "none" }}>
    <CloseSvg />
  </div>
);

export default GetPoliceStationModal;
