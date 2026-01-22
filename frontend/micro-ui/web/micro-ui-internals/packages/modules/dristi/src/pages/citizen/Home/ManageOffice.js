import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6L18 18" stroke="#3D3C3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ManageOffice = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const [activeTab, setActiveTab] = useState("myAdvocatesClerks");
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+91");

  const tabs = [
    { id: "myAdvocatesClerks", label: t("MY_ADVOCATES_CLERKS") || "My Advocates/Clerks" },
    { id: "advocatesWorkingFor", label: t("ADVOCATES_WORKING_FOR") || "Advocates I'm working for" },
  ];

  const handleAddNewMember = () => {
    setShowAddMemberModal(true);
  };

  const handleCloseModal = () => {
    setShowAddMemberModal(false);
    setMobileNumber("");
  };

  const handleSearch = () => {
    // TODO: Implement search functionality
    console.log("Searching for member with number:", countryCode + mobileNumber);
  };

  return (
    <div className="manage-office-container" style={{ padding: "30px 48px", backgroundColor: "#FAFAFA", minHeight: "100vh" }}>
      {/* Header */}
      <h1 style={{ fontSize: "32px", fontWeight: "700", marginBottom: "8px", color: "#231F20" }}>
        {t("MANAGE_OFFICE") || "Manage Office"}
      </h1>
      <p style={{ fontSize: "16px", color: "#3D3C3C", marginBottom: "24px" }}>
        {t("SELECT_OFFICE_TO_MANAGE") || "Select the office you want to manage"}
      </p>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid #D6D5D4", marginBottom: "24px" }}>
        <div style={{ display: "flex", gap: "32px" }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "12px 0",
                fontSize: "16px",
                fontWeight: activeTab === tab.id ? "700" : "400",
                color: activeTab === tab.id ? "#007E7E" : "#77787B",
                backgroundColor: "transparent",
                border: "none",
                borderBottom: activeTab === tab.id ? "2px solid #007E7E" : "2px solid transparent",
                cursor: "pointer",
                marginBottom: "-1px",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "4px",
          border: "1px solid #D6D5D4",
          padding: "24px",
          minHeight: "400px",
        }}
      >
        {/* Add New Member Button */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "24px" }}>
          <button
            onClick={handleAddNewMember}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 24px",
              backgroundColor: "#007E7E",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "4px",
              fontSize: "16px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            {t("ADD_NEW_MEMBER") || "Add New Member"}
          </button>
        </div>

        {/* Empty State */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px 20px",
            borderTop: "1px solid #D6D5D4",
            borderBottom: "1px solid #D6D5D4",
          }}
        >
          <p style={{ fontSize: "18px", fontWeight: "700", color: "#231F20", marginBottom: "8px" }}>
            {t("NO_DATA_TO_DISPLAY") || "No data to display."}
          </p>
          <p style={{ fontSize: "16px", color: "#77787B" }}>
            {t("PLEASE_ADD_MEMBER") || "Please add member"}
          </p>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={handleCloseModal}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "4px",
              padding: "24px",
              width: "100%",
              maxWidth: "500px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#231F20", margin: 0 }}>
                {t("ADD_MEMBER") || "Add Member"}
              </h2>
              <button
                onClick={handleCloseModal}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                <CloseIcon />
              </button>
            </div>

            {/* Mobile Number Input */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "16px", fontWeight: "400", color: "#231F20", marginBottom: "8px" }}>
                {t("MOBILE_NUMBER_OF_MEMBER") || "Mobile Number of Member"}
              </label>
              <div style={{ display: "flex", border: "1px solid #D6D5D4", borderRadius: "4px", overflow: "hidden" }}>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  style={{
                    padding: "12px",
                    border: "none",
                    borderRight: "1px solid #D6D5D4",
                    backgroundColor: "#FFFFFF",
                    fontSize: "16px",
                    color: "#231F20",
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  <option value="+91">+91</option>
                  <option value="+1">+1</option>
                  <option value="+44">+44</option>
                </select>
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
                  placeholder={t("ENTER_HERE") || "Enter here"}
                  maxLength={10}
                  style={{
                    flex: 1,
                    padding: "12px",
                    border: "none",
                    fontSize: "16px",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "16px" }}>
              <button
                onClick={handleCloseModal}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#FFFFFF",
                  color: "#231F20",
                  border: "1px solid #D6D5D4",
                  borderRadius: "4px",
                  fontSize: "16px",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                {t("GO_BACK") || "Go Back"}
              </button>
              <button
                onClick={handleSearch}
                disabled={!mobileNumber || mobileNumber.length < 10}
                style={{
                  padding: "12px 24px",
                  backgroundColor: !mobileNumber || mobileNumber.length < 10 ? "#D6D5D4" : "#007E7E",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "16px",
                  fontWeight: "500",
                  cursor: !mobileNumber || mobileNumber.length < 10 ? "not-allowed" : "pointer",
                }}
              >
                {t("SEARCH") || "Search"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageOffice;
