import { Dropdown } from "@egovernments/digit-ui-react-components";
import React, { useState, useMemo } from "react";
import Axios from "axios";
import { Urls } from "@egovernments/digit-ui-module-dristi/src/hooks";

const CourtIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 15V5h16v10H0zm8-4.5c1.5 0 2.5-1 2.5-2.5H5.5c0 1.5 1 2.5 2.5 2.5zM8 1L0 3.5V4h16V3.5L8 1z" fill="#0A0A0A" />
  </svg>
);

const setEmployeeDetail = (userObject, token) => {
  let locale = JSON.parse(sessionStorage.getItem("Digit.locale"))?.value || Digit.Utils.getDefaultLanguage();
  localStorage.setItem("Employee.tenant-id", userObject?.tenantId);
  localStorage.setItem("tenant-id", userObject?.tenantId);
  localStorage.setItem("citizen.userRequestObject", JSON.stringify(userObject));
  localStorage.setItem("locale", locale);
  localStorage.setItem("Employee.locale", locale);
  localStorage.setItem("token", token);
  localStorage.setItem("Employee.token", token);
  localStorage.setItem("user-info", JSON.stringify(userObject));
  localStorage.setItem("Employee.user-info", JSON.stringify(userObject));
};

const ChangeCourt = ({ dropdown = false, ...props }) => {
  const userType = Digit?.UserService?.getType() || "CITIZEN";
  const isEmployee = userType !== "CITIZEN";
  const token = localStorage.getItem("token");

  const { data: courtRoomsData, isLoading: isCourtRoomsDataLoading } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    "common-masters",
    [{ name: "Court_Rooms" }],
    {
      select: (data) => data?.["common-masters"]?.Court_Rooms || [],
    }
  );

  const courtOptions = useMemo(() => {
    const userAccessibleCourtRooms = JSON.parse(localStorage.getItem("accessibleCourtRooms")) || [];

    return (
      courtRoomsData
        ?.filter((room) => userAccessibleCourtRooms.includes(room.code))
        ?.map((room) => ({
          code: room.code,
          name: room.name,
        })) || []
    );
  }, [courtRoomsData]);

  const defaultCourtCode = courtOptions?.[0]?.code || "";
  const initialCourtId = sessionStorage.getItem("courtId") || defaultCourtCode;
  const [selectedCourtCode, setSelectedCourtCode] = useState(initialCourtId);

  const handleCourtSelection = async (court) => {
    if (selectedCourtCode !== court.code) {
      try {
        sessionStorage.setItem("courtId", court.code);
        setSelectedCourtCode(court.code);
        const userInfoResponse = await Axios.post(
          Urls.dristi.userDetailsSearch,
          {
            RequestInfo: {
              authToken: token?.access_token,
              msgId: `${Date.now()}|${Digit.StoreData.getCurrentLanguage()}`,
              apiId: "Rainmaker",
            },
          },
          {
            headers: {
              courtId: court.code,
              Authorization: "Basic ZWdvdi11c2VyLWNsaWVudDo=",
              "Content-Type": "application/json",
            },
            params: {
              access_token: token,
            },
          }
        );
        const updatedUserInfo = userInfoResponse?.data || {};
        setEmployeeDetail(updatedUserInfo, token);
        // localStorage.setItem("courtId", court?.code); // user can use duplicate Tab
        sessionStorage.setItem("courtId", court?.code);
        const exisiterUserData = Digit.UserService.getUser();
        const newUserData = {
          ...exisiterUserData,
          info: updatedUserInfo
        }
        Digit.UserService.setUser(newUserData);
        const homePath = isEmployee ? `/${window?.contextPath}/employee/home/home-screen` : `/${window?.contextPath}/citizen/dristi`;

        window.location.href = homePath;
      } catch (error) {
        console.error(error);
      }
    }
  };
  

  const selectedCourt = courtOptions?.find((court) => court?.code === selectedCourtCode) || { code: "", name: "Select Court" };

  if (dropdown) {
    return (
      <div className="court-selector" style={props.style}>
        <Dropdown
          option={courtOptions}
          selected={selectedCourt}
          optionKey="name"
          select={handleCourtSelection}
          freeze={true}
          customSelector={
            <div className={`court-selector-label ${props?.dropdownClassName || ""}`} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span style={{ display: "flex", alignItems: "center" }}>
                <CourtIcon />
              </span>
              <span>{selectedCourt.name}</span>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="court-list-selector">
      <h4>Select Court</h4>
      <div className="court-options">
        {courtOptions.map((court) => (
          <div
            key={court.code}
            className={`court-option ${court.code === selectedCourtCode ? "selected" : ""}`}
            onClick={() => handleCourtSelection(court)}
          >
            {court.name}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChangeCourt;
