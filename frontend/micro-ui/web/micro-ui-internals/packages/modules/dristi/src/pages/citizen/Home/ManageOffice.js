import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Loader, TextInput, Toast } from "@egovernments/digit-ui-react-components";
import { userTypeOptions } from "../registration/config";

const DeleteIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.5 5H4.16667H17.5" stroke="#D4351C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path
      d="M6.66667 5V3.33333C6.66667 2.89131 6.84226 2.46738 7.15482 2.15482C7.46738 1.84226 7.89131 1.66667 8.33333 1.66667H11.6667C12.1087 1.66667 12.5326 1.84226 12.8452 2.15482C13.1577 2.46738 13.3333 2.89131 13.3333 3.33333V5M15.8333 5V16.6667C15.8333 17.1087 15.6577 17.5326 15.3452 17.8452C15.0326 18.1577 14.6087 18.3333 14.1667 18.3333H5.83333C5.39131 18.3333 4.96738 18.1577 4.65482 17.8452C4.34226 17.5326 4.16667 17.1087 4.16667 16.6667V5H15.8333Z"
      stroke="#D4351C"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ManageOffice = () => {
  const { t } = useTranslation();
  const tenantId = window?.Digit?.ULBService?.getCurrentTenantId();
  const userInfo = window?.Digit?.UserService?.getUser()?.info;

  // Get individual data for logged-in user
  const { data: individualData } = window?.Digit?.Hooks?.dristi?.useGetIndividualUser(
    {
      Individual: {
        userUuid: [userInfo?.uuid],
      },
    },
    { tenantId, limit: 1000, offset: 0 },
    "DRISTI",
    "",
    userInfo?.uuid
  );

  const individualId = useMemo(() => individualData?.Individual?.[0]?.individualId, [individualData?.Individual]);
  const userType = useMemo(() => individualData?.Individual?.[0]?.additionalFields?.fields?.find((obj) => obj.key === "userType")?.value, [
    individualData?.Individual,
  ]);

  // Get advocate data for the logged-in advocate
  const { data: advocateData } = window?.Digit?.Hooks?.dristi?.useGetAdvocateClerk(
    {
      criteria: [{ individualId }],
      tenantId,
    },
    {},
    individualId,
    userType === "ADVOCATE",
    "/advocate/v1/_search"
  );

  const userTypeDetail = useMemo(() => {
    return userTypeOptions.find((item) => item.code === userType) || {};
  }, [userType]);

  const advocateSearchResult = useMemo(() => {
    return advocateData?.[`${userTypeDetail?.apiDetails?.requestKey}s`];
  }, [advocateData, userTypeDetail?.apiDetails?.requestKey]);

  // Get the logged-in advocate's ID from responseList for officeAdvocateUserUuid
  const officeAdvocateUserUuid = useMemo(() => {
    return userInfo?.uuid;
  }, []);

  // Get the logged-in advocate's name from additionalDetails.username for officeAdvocateName
  const officeAdvocateName = useMemo(() => {
    const advocateResult = advocateSearchResult?.[0]?.responseList?.[0] || advocateSearchResult?.[0];
    return advocateResult?.additionalDetails?.username;
  }, [advocateSearchResult]);

  // Fetch office members using the hook
  const { data: officeMembersData, isLoading: isLoadingMembers, refetch: refetchMembers } = window?.Digit?.Hooks?.dristi?.useSearchOfficeMember(
    {
      searchCriteria: {
        officeAdvocateUserUuid: officeAdvocateUserUuid,
        tenantId: tenantId,
      },
    },
    { tenantId },
    officeAdvocateUserUuid,
    Boolean(officeAdvocateUserUuid && tenantId)
  );

  // Extract members from the API response
  const officeMembers = useMemo(() => {
    return officeMembersData?.members || [];
  }, [officeMembersData]);

  const [activeTab, setActiveTab] = useState("myAdvocatesClerks");
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState(null);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [toast, setToast] = useState(null);

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
        // Get userType from searched individual (same as HomeView: individualData.Individual[0].additionalFields.fields)
        const memberUserType = individual?.additionalFields?.fields?.find((obj) => obj.key === "userType")?.value;
        // Per userType, use same URL pattern as HomeView: ADVOCATE -> /advocate/v1/_search, else -> /advocate/clerk/v1/_search
        const searchUrl = memberUserType === "ADVOCATE" ? "/advocate/v1/_search" : "/advocate/clerk/v1/_search";

        const typeResponse = await window?.Digit?.DRISTIService?.searchAdvocateClerk(
          searchUrl,
          {
            criteria: [{ individualId: individual.individualId }],
            tenantId: tenantId,
          },
          { tenantId: tenantId, limit: 10, offset: 0 }
        );

        // Response key matches userType: "advocates" for ADVOCATE, "clerks" for ADVOCATE_CLERK (same as HomeView searchData[requestKey + 's'])
        const responseKey = memberUserType === "ADVOCATE" ? "advocates" : "clerks";
        const typeList = typeResponse?.[responseKey];
        let firstRecord = typeList?.[0]?.responseList?.[0] || typeList?.[0];
        let designation = memberUserType === "ADVOCATE" ? "Advocate" : memberUserType === "ADVOCATE_CLERK" ? "Clerk" : "Individual";

        // If no userType or no result from first search, try the other type (e.g. individual has no userType in additionalFields)
        if (!firstRecord && !memberUserType) {
          const clerkRes = await window?.Digit?.DRISTIService?.searchAdvocateClerk(
            "/advocate/clerk/v1/_search",
            { criteria: [{ individualId: individual.individualId }], tenantId: tenantId },
            { tenantId: tenantId, limit: 10, offset: 0 }
          );
          const clerkList = clerkRes?.clerks;
          firstRecord = clerkList?.[0]?.responseList?.[0] || clerkList?.[0];
          if (firstRecord) {
            designation = "Clerk";
          } else {
            const advRes = await window?.Digit?.DRISTIService?.searchAdvocateClerk(
              "/advocate/v1/_search",
              { criteria: [{ individualId: individual.individualId }], tenantId: tenantId },
              { tenantId: tenantId, limit: 10, offset: 0 }
            );
            const advList = advRes?.advocates;
            firstRecord = advList?.[0]?.responseList?.[0] || advList?.[0];
            if (firstRecord) designation = "Advocate";
          }
        }

        const clerkData = designation === "Clerk" ? firstRecord : null;
        const advocateData = designation === "Advocate" ? firstRecord : null;

        const name = individual.name?.givenName
          ? `${individual.name.givenName}${individual.name.familyName ? " " + individual.name.familyName : ""}`
          : "N/A";

        setSearchResult({
          name: name,
          designation: firstRecord ? designation : "Individual",
          mobileNumber: `${countryCode} ${mobileNumber.slice(0, 5)} ${mobileNumber.slice(5)}`,
          email: individual.email || "N/A",
          individualId: individual.userUuid,
          clerkData: clerkData,
          advocateData: advocateData,
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

  const handleConfirmAddMember = async () => {
    if (!searchResult || !officeAdvocateUserUuid) {
      setToast({ label: t("ADVOCATE_ID_NOT_FOUND") || "Advocate ID not found. Please try again.", type: "error" });
      return;
    }

    setIsAddingMember(true);
    try {
      // Map designation to memberType
      const memberTypeMap = {
        Clerk: "ADVOCATE_CLERK",
        Advocate: "ADVOCATE",
        Individual: "INDIVIDUAL",
      };
      // Get memberId from responseList: id from clerk/advocate search (same as senior's API spec)
      const memberId =
        searchResult.designation === "Clerk"
          ? searchResult.clerkData?.id
          : searchResult.designation === "Advocate"
          ? searchResult.advocateData?.id
          : null;

      if (!memberId) {
        setToast({ label: t("MEMBER_ID_NOT_FOUND") || "Member ID not found. Please try again.", type: "error" });
        setIsAddingMember(false);
        return;
      }

      const officeAdvocateId = advocateSearchResult?.[0]?.responseList?.[0]?.id || advocateSearchResult?.[0]?.id;
      const response = await window?.Digit?.DRISTIService?.addOfficeMember(
        {
          addMember: {
            tenantId: tenantId,
            officeAdvocateId: officeAdvocateId,
            officeAdvocateName: officeAdvocateName,
            memberType: memberTypeMap[searchResult.designation] || "ADVOCATE_CLERK",
            memberId: memberId,
            memberName: searchResult.name,
            memberMobileNumber: mobileNumber,
            accessType: "ALL_CASES",
            allowCaseCreate: true,
            addNewCasesAutomatically: true,
          },
        },
        { tenantId }
      );

      if (response) {
        // Refetch members to get updated list from API
        refetchMembers();
        setToast({ label: t("MEMBER_ADDED_SUCCESS") || "Member added successfully", type: "success" });
      }
    } catch (error) {
      console.error("Error adding member:", error);
      setToast({ label: t("MEMBER_ADD_ERROR") || "Failed to add member. Please try again.", type: "error" });
    } finally {
      setIsAddingMember(false);
      setShowConfirmModal(false);
      setSearchResult(null);
      setMobileNumber("");
    }
  };

  const handleClearSearch = () => {
    setMemberSearchQuery("");
  };

  const handleMemberSearch = () => {
    // Filter is applied automatically via filteredMembers
    console.log("Searching for:", memberSearchQuery);
  };

  const filteredMembers = useMemo(() => {
    return officeMembers.filter((member) => (member.memberName || "").toLowerCase().includes(memberSearchQuery.toLowerCase()));
  }, [officeMembers, memberSearchQuery]);

  const handleCloseConfirmModal = () => {
    setShowConfirmModal(false);
    setSearchResult(null);
    setMobileNumber("");
  };

  const handleDeleteClick = (member) => {
    setMemberToRemove(member);
    setShowRemoveMemberModal(true);
  };

  const handleCloseRemoveModal = () => {
    setShowRemoveMemberModal(false);
    setMemberToRemove(null);
  };

  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove || !officeAdvocateUserUuid) {
      setToast({ label: t("REMOVE_MEMBER_ERROR") || "Failed to remove member. Please try again.", type: "error" });
      return;
    }
    setIsRemovingMember(true);
    try {
      const response = await window?.Digit?.DRISTIService?.leaveOffice(
        {
          leaveOffice: {
            id: memberToRemove.id,
            tenantId: tenantId,
            officeAdvocateId: advocateSearchResult?.[0]?.responseList?.[0]?.id,
            memberType: memberToRemove.memberType,
            memberId: memberToRemove.memberId,
          },
        },
        { tenantId }
      );

      if (response) {
        refetchMembers();
        setToast({ label: t("MEMBER_REMOVED_SUCCESS") || "Member removed successfully", type: "success" });
      }
    } catch (error) {
      console.error("Error removing member:", error);
      setToast({ label: t("REMOVE_MEMBER_ERROR") || "Failed to remove member. Please try again.", type: "error" });
    } finally {
      setIsRemovingMember(false);
      setShowRemoveMemberModal(false);
      setMemberToRemove(null);
    }
  };

  return (
    <div style={{ padding: "30px 48px", minHeight: "100vh" }}>
      <h1 style={{ fontSize: "32px", fontWeight: "700", marginBottom: "32px", color: "#231F20" }}>{t("MANAGE_OFFICE") || "Manage Office"}</h1>
      <p style={{ fontSize: "16px", color: "#3D3C3C" }}>{t("SELECT_OFFICE_TO_MANAGE") || "Select the office you want to manage"}</p>

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
          border: "1px solid #D6D5D4",
          padding: "24px",
          minHeight: "400px",
          borderLeft: "none",
          borderRight: "none",
        }}
      >
        {/* Add New Member Row */}
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: "24px" }}>
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
            <span style={{ fontSize: "18px" }}>+</span>
            {t("ADD_NEW_MEMBER") || "Add New Member"}
          </button>
        </div>

        {/* Members List or Empty State */}
        {isLoadingMembers ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "60px 20px",
            }}
          >
            <Loader />
          </div>
        ) : filteredMembers.length > 0 ? (
          <div>
            {/* Table Header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.5fr 1.5fr 1fr 1fr 1.5fr",
                padding: "16px 24px",
                borderBottom: "1px solid #D6D5D4",
                fontWeight: "600",
                fontSize: "14px",
                color: "#3D3C3C",
              }}
            >
              <span>{t("NAME") || "Name"}</span>
              <span>{t("MOBILE_NUMBER") || "Mobile Number"}</span>
              <span>{t("DESIGNATION") || "Designation"}</span>
              <span>{t("ACCESS_TYPE") || "Access Type"}</span>
              <span>{t("ACTION") || "Action"}</span>
            </div>
            {/* Table Rows */}
            {filteredMembers.map((member) => (
              <div
                key={member.id || member.memberId}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.5fr 1.5fr 1fr 1fr 1.5fr",
                  padding: "16px 24px",
                  borderBottom: "1px solid #D6D5D4",
                  fontSize: "14px",
                  color: "#231F20",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    color: "#007E7E",
                    textDecoration: "underline",
                    cursor: "pointer",
                  }}
                >
                  {member.memberName}
                </span>
                <span>{member.memberMobileNumber}</span>
                <span>{member.memberType === "ADVOCATE_CLERK" ? "Clerk" : member.memberType === "ADVOCATE" ? "Advocate" : member.memberType}</span>
                <span>
                  <span
                    style={{
                      backgroundColor: "#E8E8E8",
                      padding: "4px 12px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "500",
                    }}
                  >
                    {member.accessType === "ALL_CASES" ? t("ALL_CASES") || "All Cases" : member.accessType}
                  </span>
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <button
                    style={{
                      padding: "8px 24px",
                      backgroundColor: "#FFFFFF",
                      color: "#007E7E",
                      border: "1px solid #007E7E",
                      borderRadius: "4px",
                      fontSize: "14px",
                      fontWeight: "500",
                      cursor: "pointer",
                    }}
                  >
                    {t("MANAGE") || "Manage"}
                  </button>
                  <button
                    onClick={() => handleDeleteClick(member)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px",
                    }}
                  >
                    <DeleteIcon />
                  </button>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "60px 20px",
            }}
          >
            <p style={{ fontSize: "18px", fontWeight: "700", color: "#231F20", marginBottom: "8px" }}>
              {t("NO_DATA_TO_DISPLAY") || "No data to display."}
            </p>
            <p style={{ fontSize: "16px", color: "#77787B" }}>{t("PLEASE_ADD_MEMBER") || "Please add member"}</p>
          </div>
        )}
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
            <div
              style={{
                display: "flex",
                padding: "0 0 16px 0",
                justifyContent: "space-between",
                borderBottom: "1px solid #D6D5D4",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#231F20", margin: 0 }}>{t("ADD_MEMBER") || "Add Member"}</h2>
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
                  <p style={{ fontSize: "14px", color: "#77787B", marginBottom: "4px" }}>{t("NAME") || "Name"}</p>
                  <p style={{ fontSize: "16px", fontWeight: "500", color: "#231F20", margin: 0 }}>{searchResult.name}</p>
                </div>
                <div style={{ flex: 1, padding: "8px", borderRight: "1px solid #D6D5D4" }}>
                  <p style={{ fontSize: "14px", color: "#77787B", marginBottom: "4px" }}>{t("DESIGNATION") || "Designation"}</p>
                  <p style={{ fontSize: "16px", fontWeight: "500", color: "#231F20", margin: 0 }}>{searchResult.designation}</p>
                </div>
                <div style={{ flex: 1, padding: "8px", borderRight: "1px solid #D6D5D4" }}>
                  <p style={{ fontSize: "14px", color: "#77787B", marginBottom: "4px" }}>{t("MOBILE_NUMBER") || "Mobile number"}</p>
                  <p style={{ fontSize: "16px", fontWeight: "500", color: "#231F20", margin: 0 }}>{searchResult.mobileNumber}</p>
                </div>
                <div style={{ flex: 1, padding: "8px" }}>
                  <p style={{ fontSize: "14px", color: "#77787B", marginBottom: "4px" }}>{t("EMAIL") || "Email"}</p>
                  <p style={{ fontSize: "16px", fontWeight: "500", color: "#231F20", margin: 0 }}>{searchResult.email}</p>
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
                {searchError && <div style={{ marginTop: "12px", color: "#D4351C", fontSize: "14px" }}>{searchError}</div>}
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
                  disabled={isSearching}
                  style={{
                    padding: "12px 24px",
                    width: "120px",
                    height: "44px",
                    boxSizing: "border-box",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: !mobileNumber || mobileNumber.length < 10 || isSearching ? "#D6D5D4" : "#007E7E",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "16px",
                    fontWeight: "500",
                  }}
                >
                  {isSearching ? (
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", transform: "scale(0.45)" }}>
                      <Loader />
                    </span>
                  ) : (
                    t("SEARCH") || "Search"
                  )}
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
            <div
              style={{
                display: "flex",
                padding: "0 0 16px 0",
                justifyContent: "space-between",
                borderBottom: "1px solid #D6D5D4",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#231F20", margin: 0 }}>{t("ADD_MEMBER") || "Add Member"}</h2>
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
                disabled={isAddingMember}
                style={{
                  padding: "12px 24px",
                  width: "120px",
                  height: "44px",
                  boxSizing: "border-box",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isAddingMember ? "#D6D5D4" : "#007E7E",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "16px",
                  fontWeight: "500",
                  cursor: isAddingMember ? "not-allowed" : "pointer",
                }}
              >
                {isAddingMember ? (
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", transform: "scale(0.45)" }}>
                    <Loader />
                  </span>
                ) : (
                  t("CONFIRM") || "Confirm"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Member Confirmation Modal */}
      {showRemoveMemberModal && (
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
          onClick={handleCloseRemoveModal}
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
            <div
              style={{
                display: "flex",
                padding: "0 0 16px 0",
                justifyContent: "space-between",
                borderBottom: "1px solid #D6D5D4",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#231F20", margin: 0 }}>{t("REMOVE_MEMBER") || "Remove Member"}</h2>
              <button
                onClick={handleCloseRemoveModal}
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
              {t("CONFIRM_REMOVE_MEMBER_MESSAGE") || "Are you sure you want to remove this member from your office?"}
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "16px" }}>
              <button
                onClick={handleCloseRemoveModal}
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
                {t("CANCEL") || "Cancel"}
              </button>
              <button
                onClick={handleConfirmRemoveMember}
                disabled={isRemovingMember}
                style={{
                  padding: "12px 24px",
                  width: "160px",
                  height: "44px",
                  boxSizing: "border-box",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  whiteSpace: "nowrap",
                  backgroundColor: isRemovingMember ? "#D6D5D4" : "#D4351C",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "16px",
                  fontWeight: "500",
                  cursor: isRemovingMember ? "not-allowed" : "pointer",
                }}
              >
                {isRemovingMember ? (
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", transform: "scale(0.45)" }}>
                    <Loader />
                  </span>
                ) : (
                  t("REMOVE_MEMBER") || "Remove Member"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && <Toast label={toast.label} onClose={() => setToast(null)} error={toast.type === "error"} style={{ maxWidth: "400px" }} />}
    </div>
  );
};

export default ManageOffice;
