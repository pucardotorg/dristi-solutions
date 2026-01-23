import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const ManageOffice = () => {
  const { t } = useTranslation();
  const tenantId = window?.Digit?.ULBService?.getCurrentTenantId();
  const [activeTab, setActiveTab] = useState("myAdvocatesClerks");
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState(null);

  const tabs = [
    { id: "myAdvocatesClerks", label: t("MY_ADVOCATES_CLERKS") || "My Advocates/Clerks" },
    { id: "advocatesWorkingFor", label: t("ADVOCATES_WORKING_FOR") || "Advocates I'm working for" },
  ];

  const handleAddNewMember = () => {
    setShowAddMemberModal(true);
    setSearchResult(null);
    setSearchError(null);
    setMobileNumber("");
  };

  const handleCloseModal = () => {
    setShowAddMemberModal(false);
    setMobileNumber("");
    setSearchResult(null);
    setSearchError(null);
  };

  const handleGoBack = () => {
    if (searchResult) {
      setSearchResult(null);
      setSearchError(null);
    } else {
      handleCloseModal();
    }
  };

  const handleSearch = async () => {
    setIsSearching(true);
    setSearchError(null);
    setSearchResult(null);

    try {
      const individualResponse = await window?.Digit?.DRISTIService?.searchIndividualUser(
        {
          Individual: {
            mobileNumber: mobileNumber,
          },
        },
        { tenantId: tenantId, limit: 10, offset: 0 }
      );

      if (individualResponse?.Individual && individualResponse.Individual.length > 0) {
        const individual = individualResponse.Individual[0];
        
        const clerkResponse = await window?.Digit?.DRISTIService?.searchAdvocateClerk(
          "/advocate/clerk/v1/_search",
          {
            criteria: [{ individualId: individual.individualId }],
            tenantId: tenantId,
          },
          { tenantId: tenantId, limit: 10, offset: 0 }
        );

        let designation = "Individual";
        let clerkData = null;

        if (clerkResponse?.clerks && clerkResponse.clerks.length > 0) {
          clerkData = clerkResponse.clerks[0]?.responseList?.[0] || clerkResponse.clerks[0];
          designation = "Clerk";
        } else {
          const advocateResponse = await window?.Digit?.DRISTIService?.searchIndividualAdvocate(
            {
              criteria: [{ individualId: individual.individualId }],
              tenantId: tenantId,
            },
            { tenantId: tenantId, limit: 10, offset: 0 }
          );

          if (advocateResponse?.advocates && advocateResponse.advocates.length > 0) {
            designation = "Advocate";
          }
        }

        const name = individual.name?.givenName 
          ? `${individual.name.givenName}${individual.name.familyName ? ' ' + individual.name.familyName : ''}`
          : "N/A";

        setSearchResult({
          name: name,
          designation: designation,
          mobileNumber: `${countryCode} ${mobileNumber.slice(0, 5)} ${mobileNumber.slice(5)}`,
          email: individual.email || "N/A",
          individualId: individual.individualId,
          clerkData: clerkData,
        });
      } else {
        setSearchError(t("NO_MEMBER_FOUND") || "No member found with this mobile number");
      }
    } catch (error) {
      console.error("Error searching for member:", error);
      setSearchError(t("SEARCH_ERROR") || "Error searching for member. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleVerifyDetails = () => {
    setShowAddMemberModal(false);
    setShowConfirmModal(true);
  };

  const handleConfirmGoBack = () => {
    setShowConfirmModal(false);
    setShowAddMemberModal(true);
  };

  const handleConfirmAddMember = () => {
    // TODO: Implement API call to add member to office
    console.log("Confirming add member:", searchResult);
    setShowConfirmModal(false);
    setSearchResult(null);
    setMobileNumber("");
  };

  const handleCloseConfirmModal = () => {
    setShowConfirmModal(false);
    setSearchResult(null);
    setMobileNumber("");
  };

  return (
    <div style={{ padding: "30px 48px", minHeight: "100vh" }}>
      <h1 style={{ fontSize: "32px", fontWeight: "700", marginBottom: "32px", color: "#231F20" }}>
        {t("MANAGE_OFFICE") || "Manage Office"}
      </h1>
      <p style={{ fontSize: "16px", color: "#3D3C3C" }}>
        {t("SELECT_OFFICE_TO_MANAGE") || "Select the office you want to manage"}
      </p>

      <div style={{ borderBottom: "1px solid #D6D5D4" }}>
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

      <div
        style={{
          backgroundColor: "#FFFFFF",
          // borderRadius: "0 0 8px 8px",
          border: "1px solid #D6D5D4",
          padding: "24px",
          minHeight: "400px",
          borderLeft: "none",
          borderRight: "none",
        }}
      >
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

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px 20px",
            // borderTop: "1px solid #D6D5D4",
            // borderBottom: "1px solid #D6D5D4",
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
              maxWidth: searchResult ? "700px" : "500px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", padding: "0 0 16px 0", justifyContent: "space-between", borderBottom: "1px solid #D6D5D4", alignItems: "center", marginBottom: "24px" }}>
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
                  fontSize: "24px",
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            {searchResult ? (
              <div
                style={{
                  display: "flex",
                  // border: "1px solid #D6D5D4",
                  backgroundColor: "#F7F5F3",
                  borderRadius: "16px",
                  marginBottom: "24px",
                  overflow: "hidden",
                  padding: "8px 0 8px 0",
                }}
              >
                <div style={{ flex: 1, padding: "8px", borderRight: "1px solid #D6D5D4" }}>
                  <p style={{ fontSize: "14px", color: "#77787B", marginBottom: "4px" }}>
                    {t("NAME") || "Name"}
                  </p>
                  <p style={{ fontSize: "16px", fontWeight: "500", color: "#231F20", margin: 0 }}>
                    {searchResult.name}
                  </p>
                </div>
                <div style={{ flex: 1, padding: "8px", borderRight: "1px solid #D6D5D4" }}>
                  <p style={{ fontSize: "14px", color: "#77787B", marginBottom: "4px" }}>
                    {t("DESIGNATION") || "Designation"}
                  </p>
                  <p style={{ fontSize: "16px", fontWeight: "500", color: "#231F20", margin: 0 }}>
                    {searchResult.designation}
                  </p>
                </div>
                <div style={{ flex: 1, padding: "8px", borderRight: "1px solid #D6D5D4" }}>
                  <p style={{ fontSize: "14px", color: "#77787B", marginBottom: "4px" }}>
                    {t("MOBILE_NUMBER") || "Mobile number"}
                  </p>
                  <p style={{ fontSize: "16px", fontWeight: "500", color: "#231F20", margin: 0 }}>
                    {searchResult.mobileNumber}
                  </p>
                </div>
                <div style={{ flex: 1, padding: "8px" }}>
                  <p style={{ fontSize: "14px", color: "#77787B", marginBottom: "4px" }}>
                    {t("EMAIL") || "Email"}
                  </p>
                  <p style={{ fontSize: "16px", fontWeight: "500", color: "#231F20", margin: 0 }}>
                    {searchResult.email}
                  </p>
                </div>
              </div>
            ) : (
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
                {searchError && (
                  <div style={{ marginTop: "12px", color: "#D4351C", fontSize: "14px" }}>
                    {searchError}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "16px" }}>
              <button
                onClick={handleGoBack}
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
              {searchResult ? (
                <button
                  onClick={handleVerifyDetails}
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
                  {t("VERIFY_DETAILS") || "Verify Details"}
                  <span>→</span>
                </button>
              ) : (
                <button
                  onClick={handleSearch}
                  disabled={!mobileNumber || mobileNumber.length < 10 || isSearching}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: !mobileNumber || mobileNumber.length < 10 || isSearching ? "#D6D5D4" : "#007E7E",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "16px",
                    fontWeight: "500",
                    cursor: !mobileNumber || mobileNumber.length < 10 || isSearching ? "not-allowed" : "pointer",
                  }}
                >
                  {isSearching ? (t("SEARCHING") || "Searching...") : (t("SEARCH") || "Search")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
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
          onClick={handleCloseConfirmModal}
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
            <div style={{ display: "flex", padding: "0 0 16px 0", justifyContent: "space-between", borderBottom: "1px solid #D6D5D4", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#231F20", margin: 0 }}>
                {t("ADD_MEMBER") || "Add Member"}
              </h2>
              <button
                onClick={handleCloseConfirmModal}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                  fontSize: "24px",
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            <p style={{ fontSize: "16px", color: "#3D3C3C", marginBottom: "24px" }}>
              {t("CONFIRM_ADD_MEMBER_MESSAGE") || "Are you sure you want to add this member to your office?"}
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "16px" }}>
              <button
                onClick={handleConfirmGoBack}
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
                onClick={handleConfirmAddMember}
                style={{
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
                {t("CONFIRM") || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageOffice;
