import React, { useState } from "react";
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

  const validateCoordinate = (value, type) => {
    const numericValue = parseFloat(value);
    if (type === "latitude" && (numericValue < -90 || numericValue > 90)) {
      return false;
    }
    if (type === "longitude" && (numericValue < -180 || numericValue > 180)) {
      return false;
    }
    return true;
  };

  const handleInputChange = (e, type) => {
    const value = e.target.value;
    let temp = value?.split(".");
    if (temp[1] && temp[1].length > 6) {
      temp[1] = temp[1].slice(0, 6);
      e.target.value = temp.join(".");
    }
    setCoordinates((prev) => ({ ...prev, [type]: e.target.value }));
  };

  const getPoliceStationByLocation = async () => {
    if (!coordinates.latitude || !coordinates.longitude) {
      toast.error(t("PLEASE_ENTER_BOTH_COORDINATES"));
      return;
    }

    if (!validateCoordinate(coordinates.latitude, "latitude") || !validateCoordinate(coordinates.longitude, "longitude")) {
      toast.error(t("INVALID_COORDINATES"));
      return;
    }

    setIsLoading(true);
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
        toast.error(t("NO_POLICE_STATION_FOUND"));
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
      toast.error(t("ERROR_FETCHING_POLICE_STATION"));
      setPoliceStation(null);
      setPoliceStationOptions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!policeStation) {
      toast.error(t("PLEASE_GET_POLICE_STATION_FIRST"));
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
      isDisabled={isLoading}
      formId="modal-action"
      popupStyles={{ width: "480px" }}
      isOpen={isOpen}
      popmoduleClassName={"get-police-station-modal"}
    >
      <div style={{ padding: "24px" }}>
        <div style={{ marginBottom: "24px" }}>
          <CardLabel>{t("ADDRESS")}</CardLabel>
          <div
            style={{
              padding: "16px",
              background: "#FAFAFA",
              borderRadius: "4px",
              fontSize: "16px",
              color: "#0B0C0C",
            }}
          >
            {address}
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

        <div style={{ display: "flex", gap: "24px", marginBottom: "24px" }}>
          <div style={{ flex: 1 }}>
            <CardLabel>{t("LATITUDE")}</CardLabel>
            <TextInput
              type="number"
              value={coordinates.latitude}
              onChange={(e) => handleInputChange(e, "latitude")}
              style={{ width: "100%" }}
              disabled={isLoading}
            />
          </div>
          <div style={{ flex: 1 }}>
            <CardLabel>{t("LONGITUDE")}</CardLabel>
            <TextInput
              type="number"
              value={coordinates.longitude}
              onChange={(e) => handleInputChange(e, "longitude")}
              style={{ width: "100%" }}
              disabled={isLoading}
            />
          </div>
        </div>

        <button
          onClick={getPoliceStationByLocation}
          disabled={isLoading}
          style={{
            background: "white",
            border: "1px solid #1DB4AE",
            color: "#1DB4AE",
            padding: "8px 24px",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
            marginBottom: "24px",
          }}
        >
          {t("GET_POLICE_STATION")}
        </button>

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
