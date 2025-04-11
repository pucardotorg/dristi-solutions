import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Modal, CloseSvg, TextInput, CardLabel, Dropdown } from "@egovernments/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { useToast } from "@egovernments/digit-ui-module-dristi/src/components/Toast/useToast";

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
        console.log("No police station found");
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
      actionCancelLabel={t("CANCEL")}
      actionCancelOnSubmit={onClose}
      actionSaveLabel={t("SAVE")}
      actionSaveOnSubmit={handleSave}
      isDisabled={isLoading || hasValidationErrors || !policeStation}
      formId="modal-action"
      popupStyles={{}}
      isOpen={isOpen}
      popmoduleClassName={"get-police-station-modal"}
    >
      <div style={{ padding: "24px" }}>
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

        <div
          className="info-banner"
          style={{
            background: "#F6F6FF",
            padding: "16px",
            marginBottom: "24px",
            borderRadius: "4px",
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
          }}
        >
          <div
            style={{
              color: "#0B0C0C",
              fontWeight: "bold",
              fontSize: "16px",
              marginRight: "8px",
            }}
          >
            {t("NOTE")}
          </div>
          <div style={{ color: "#505A5F", fontSize: "14px" }}>{t("POLICE_STATION_LOCATION_INFO")}</div>
        </div>

        <div style={{ display: "flex", gap: "24px", marginBottom: "24px", alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <CardLabel>{t("LATITUDE")}</CardLabel>
            <TextInput
              type="text"
              value={coordinates.latitude}
              onChange={(e) => handleInputChange(e, "latitude")}
              style={{ width: "100%" }}
              disable={isLoading}
              error={errors.latitude}
            />
            {errors.latitude && <div style={{ color: "#d4351c", fontSize: "14px", marginTop: "4px" }}>{errors.latitude}</div>}
          </div>
          <div style={{ flex: 1 }}>
            <CardLabel>{t("LONGITUDE")}</CardLabel>
            <TextInput
              type="text"
              value={coordinates.longitude}
              onChange={(e) => handleInputChange(e, "longitude")}
              style={{ width: "100%" }}
              disable={isLoading}
              error={errors.longitude}
            />
            {errors.longitude && <div style={{ color: "#d4351c", fontSize: "14px", marginTop: "4px" }}>{errors.longitude}</div>}
          </div>
          <div style={{ flex: 1 }}>
            <button
              onClick={getPoliceStationByLocation}
              disabled={isLoading || hasValidationErrors}
              style={{
                background: "white",
                border: "1px solid #1DB4AE",
                color: "#1DB4AE",
                padding: "8px 24px",
                borderRadius: "4px",
                cursor: hasValidationErrors || isLoading ? "not-allowed" : "pointer",
                fontSize: "14px",
                marginTop: "20px",
                opacity: hasValidationErrors || isLoading ? 0.5 : 1,
              }}
            >
              {t("GET_POLICE_STATION")}
            </button>
          </div>
        </div>

        {policeStationError && <div style={{ color: "#d4351c", fontSize: "14px", marginBottom: "24px" }}>{policeStationError}</div>}

        <div>
          <CardLabel>{t("POLICE_STATION")}</CardLabel>
          <Dropdown
            option={policeStationOptions}
            optionKey="name"
            selected={policeStation}
            select={setPoliceStation}
            t={t}
            placeholder={t("SELECT_POLICE_STATION")}
            className="police-station-dropdown"
            disable={policeStationOptions.length === 0}
          />
        </div>
      </div>
    </Modal>
  );
};

const CloseBtn = (props) => (
  <div className="icon-bg-secondary" onClick={props.onClick} style={{ cursor: "pointer", padding: "8px" }}>
    <CloseSvg />
  </div>
);

export default GetPoliceStationModal;
