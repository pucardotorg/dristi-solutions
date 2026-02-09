import React, { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Loader, Toast } from "@egovernments/digit-ui-react-components";
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

  // Extract members from the API response (My Advocates/Clerks tab)
  const officeMembers = useMemo(() => {
    return officeMembersData?.members || [];
  }, [officeMembersData]);

  const [activeTab, setActiveTab] = useState("myAdvocatesClerks");
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
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

  // Auto-close toast after 5 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  // "Advocates I'm working for" tab: fetch by memberId + tenantId (logged-in user as member)
  const {
    data: advocatesWorkingForData,
    isLoading: isLoadingAdvocatesWorkingFor,
    refetch: refetchAdvocatesWorkingFor,
  } = window?.Digit?.Hooks?.dristi?.useSearchOfficeMember(
    {
      searchCriteria: {
        memberUserUuid: officeAdvocateUserUuid,
        tenantId: tenantId,
      },
    },
    { tenantId },
    `advocatesWorkingFor_${officeAdvocateUserUuid}_${tenantId}`,
    activeTab === "advocatesWorkingFor" && Boolean(officeAdvocateUserUuid && tenantId)
  );
  const advocatesWorkingForMembers = useMemo(() => advocatesWorkingForData?.members || [], [advocatesWorkingForData]);

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

        // Validation: do not allow adding if this mobile number is already a member of the office
        const normalizeMobile = (val) => (val || "").replace(/\D/g, "");
        const searchedMobile = normalizeMobile(countryCode) + normalizeMobile(mobileNumber);
        const isAlreadyMember = (officeMembers || []).some((m) => {
          const existing = normalizeMobile(m.memberMobileNumber);
          return (
            existing === searchedMobile || (existing.length >= 10 && searchedMobile.length >= 10 && existing.slice(-10) === searchedMobile.slice(-10))
          );
        });
        if (isAlreadyMember) {
          setSearchError(t("MEMBER_ALREADY_EXISTS") || "This mobile number is already added as a member.");
          setSearchResult(null);
        } else {
          setSearchResult({
            name: name,
            designation: firstRecord ? designation : "Individual",
            mobileNumber: `${countryCode} ${mobileNumber.slice(0, 5)} ${mobileNumber.slice(5)}`,
            email: individual.email || "N/A",
            individualId: individual.userUuid,
            clerkData: clerkData,
            advocateData: advocateData,
          });
        }
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
      setShowAddMemberModal(false);
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
    return officeMembers;
  }, [officeMembers]);

  // Data and loading per tab: My Advocates/Clerks vs Advocates I'm working for
  const displayMembers = useMemo(() => (activeTab === "advocatesWorkingFor" ? advocatesWorkingForMembers : filteredMembers), [
    activeTab,
    advocatesWorkingForMembers,
    filteredMembers,
  ]);
  const isLoadingDisplay = activeTab === "advocatesWorkingFor" ? isLoadingAdvocatesWorkingFor : isLoadingMembers;

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
    const isLeavingOfficeTab = activeTab === "advocatesWorkingFor";
    setIsRemovingMember(true);
    try {
      // On "Advocates I'm working for" we leave the selected advocate's office: use row's officeAdvocateId and fields.
      // On "My Advocates/Clerks" the office is the logged-in advocate, so officeAdvocateId comes from advocateSearchResult.
      const leavePayload = isLeavingOfficeTab
        ? {
            id: memberToRemove?.id,
            tenantId: tenantId,
            officeAdvocateId: memberToRemove?.officeAdvocateId != null ? memberToRemove.officeAdvocateId : memberToRemove?.advocateId,
            memberType: memberToRemove?.memberType != null && memberToRemove.memberType !== "" ? memberToRemove.memberType : "ADVOCATE_CLERK",
            memberId: memberToRemove?.memberId,
            memberUserUuid: memberToRemove?.memberUserUuid,
            officeAdvocateUserUuid: memberToRemove?.officeAdvocateUserUuid,
          }
        : {
            id: memberToRemove?.id,
            tenantId: tenantId,
            officeAdvocateId: advocateSearchResult?.[0]?.responseList?.[0]?.id,
            memberType: memberToRemove?.memberType,
            memberId: memberToRemove?.memberId,
            memberUserUuid: memberToRemove?.memberUserUuid,
            officeAdvocateUserUuid: memberToRemove?.officeAdvocateUserUuid,
          };

      const response = await window?.Digit?.DRISTIService?.leaveOffice({ leaveOffice: leavePayload }, { tenantId });

      if (response) {
        refetchMembers();
        if (isLeavingOfficeTab && refetchAdvocatesWorkingFor) refetchAdvocatesWorkingFor();
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
    <div className="manage-office-page">
      <h1 className="manage-office-title">{t("MANAGE_OFFICE") || "Manage Office"}</h1>

      <div className="manage-office-tabs-wrapper">
        <div className="manage-office-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`manage-office-tab${activeTab === tab.id ? " manage-office-tab--active" : ""}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="manage-office-card">
        {/* Top row: only "Add New Member" on My Advocates/Clerks; no search row on Advocates I'm working for */}
        {activeTab === "myAdvocatesClerks" && (
          <div className="manage-office-toprow">
            <button onClick={handleAddNewMember} className="manage-office-add-member-btn">
              <span className="manage-office-add-member-btn__icon">+</span>
              {t("ADD_NEW_MEMBER") || "Add New Member"}
            </button>
          </div>
        )}

        {/* Members List or Empty State */}
        {isLoadingDisplay ? (
          <div className="manage-office-loader">
            <Loader />
          </div>
        ) : displayMembers.length > 0 ? (
          <div>
            {/* Table Header: 4 columns for Advocates I'm working for, 5 for My Advocates/Clerks */}
            <div className={`manage-office-table-header${activeTab === "advocatesWorkingFor" ? " manage-office-table-header--working-for" : ""}`}>
              <span>{activeTab === "advocatesWorkingFor" ? t("ADVOCATE") || "Advocate" : t("NAME") || "Name"}</span>
              <span>{t("MOBILE_NUMBER") || "Mobile Number"}</span>
              {activeTab !== "advocatesWorkingFor" && <span>{t("DESIGNATION") || "Designation"}</span>}
              <span>{t("ACCESS_TYPE") || "Access Type"}</span>
              <span>{t("ACTION") || "Action"}</span>
            </div>
            {/* Table Rows */}
            {displayMembers.map((member) => (
              <div
                key={member.id || member.memberId}
                className={`manage-office-table-row${activeTab === "advocatesWorkingFor" ? " manage-office-table-row--working-for" : ""}`}
              >
                <span className={activeTab === "advocatesWorkingFor" ? "manage-office-name" : "manage-office-name manage-office-name--clickable"}>
                  {activeTab === "advocatesWorkingFor" ? member.officeAdvocateName || member.memberName : member.memberName}
                </span>
                <span>{member.memberMobileNumber || member.officeAdvocateMobileNumber}</span>
                {activeTab !== "advocatesWorkingFor" && (
                  <span>{member.memberType === "ADVOCATE_CLERK" ? "Clerk" : member.memberType === "ADVOCATE" ? "Advocate" : member.memberType}</span>
                )}
                <span>
                  <span className="manage-office-access-pill">
                    {member.accessType === "ALL_CASES" ? t("ALL_CASES") || "All Cases" : t("SPECIFIC_CASES") || "Specific Cases"}
                  </span>
                </span>
                <span className={`manage-office-actions${activeTab === "advocatesWorkingFor" ? " manage-office-actions--compact" : ""}`}>
                  <button onClick={() => handleDeleteClick(member)} className="manage-office-delete-btn">
                    <DeleteIcon />
                  </button>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="manage-office-empty">
            {activeTab === "advocatesWorkingFor" ? (
              <React.Fragment>
                <p className="manage-office-empty__title">{t("NO_DATA_TO_DISPLAY") || "No data to display."}</p>
                <p className="manage-office-empty__title">{t("NOT_WORKING_FOR_ANY_ADVOCATES") || "You are not working for any advocates."}</p>
              </React.Fragment>
            ) : (
              <>
                <p className="manage-office-empty__title">{t("NO_DATA_TO_DISPLAY") || "No data to display."}</p>
                <p className="manage-office-empty__subtitle">{t("PLEASE_ADD_MEMBER") || "Please add member"}</p>
              </>
            )}
          </div>
        )}
      </div>

      {showAddMemberModal && (
        <div className="manage-office-modal-overlay" onClick={handleCloseModal}>
          <div className={`manage-office-modal ${searchResult ? "manage-office-modal--wide" : ""}`} onClick={(e) => e.stopPropagation()}>
            <div className="manage-office-modal__header">
              <h2 className="manage-office-modal__title">{t("ADD_MEMBER") || "Add Member"}</h2>
              <button onClick={handleCloseModal} className="manage-office-modal__close">
                ×
              </button>
            </div>

            {isSearching || isAddingMember ? (
              <div className="manage-office-modal-loader">
                <Loader />
              </div>
            ) : (
              <React.Fragment>
                {searchResult ? (
                  <div className="manage-office-search-card">
                    <div className="manage-office-search-card__col">
                      <p className="manage-office-search-card__label">{t("NAME") || "Name"}</p>
                      <p className="manage-office-search-card__value">{searchResult.name}</p>
                    </div>
                    <div className="manage-office-search-card__col">
                      <p className="manage-office-search-card__label">{t("DESIGNATION") || "Designation"}</p>
                      <p className="manage-office-search-card__value">{searchResult.designation}</p>
                    </div>
                    <div className="manage-office-search-card__col">
                      <p className="manage-office-search-card__label">{t("MOBILE_NUMBER") || "Mobile number"}</p>
                      <p className="manage-office-search-card__value">{searchResult.mobileNumber}</p>
                    </div>
                    <div className="manage-office-search-card__col">
                      <p className="manage-office-search-card__label">{t("EMAIL") || "Email"}</p>
                      <p className="manage-office-search-card__value">{searchResult.email}</p>
                    </div>
                  </div>
                ) : (
                  <div className="manage-office-search-field">
                    <label className="manage-office-search-field__label">{t("MOBILE_NUMBER_OF_MEMBER") || "Mobile Number of Member"}</label>
                    <div className="manage-office-search-field__control">
                      <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className="manage-office-search-field__country">
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
                        className="manage-office-search-field__input"
                      />
                    </div>
                    {searchError && <div className="manage-office-search-field__error">{searchError}</div>}
                  </div>
                )}

                <div className="manage-office-modal__footer">
                  <button onClick={handleGoBack} className="manage-office-btn manage-office-btn--secondary">
                    {t("GO_BACK") || "Go Back"}
                  </button>
                  {searchResult ? (
                    <button onClick={handleConfirmAddMember} className="manage-office-btn manage-office-btn--primary">
                      {t("ADD_MEMBER") || "Add Member"}
                    </button>
                  ) : (
                    <button
                      onClick={handleSearch}
                      disabled={!mobileNumber || mobileNumber.length < 10}
                      className={`manage-office-btn manage-office-btn--primary${
                        !mobileNumber || mobileNumber.length < 10 ? " manage-office-btn--disabled" : ""
                      }`}
                    >
                      {t("SEARCH") || "Search"}
                    </button>
                  )}
                </div>
              </React.Fragment>
            )}
          </div>
        </div>
      )}

      {/* Remove Member Confirmation Modal */}
      {showRemoveMemberModal && (
        <div className="manage-office-modal-overlay" onClick={handleCloseRemoveModal}>
          <div className="manage-office-modal" onClick={(e) => e.stopPropagation()}>
            <div className="manage-office-modal__header">
              <h2 className="manage-office-modal__title">{t("REMOVE_MEMBER") || "Remove Member"}</h2>
              <button onClick={handleCloseRemoveModal} className="manage-office-modal__close">
                ×
              </button>
            </div>

            {isRemovingMember ? (
              <div className="manage-office-modal-loader">
                <Loader />
              </div>
            ) : (
              <React.Fragment>
                <p className="manage-office-remove-text">
                  {activeTab === "advocatesWorkingFor"
                    ? t("CONFIRM_LEAVE_ADVOCATE_OFFICE") || "Are you sure you want to leave this advocate's office?"
                    : t("CONFIRM_REMOVE_MEMBER_MESSAGE") || "Are you sure you want to remove this member from your office?"}
                </p>

                <div className="manage-office-modal__footer">
                  <button onClick={handleCloseRemoveModal} className="manage-office-btn manage-office-btn--secondary">
                    {t("CANCEL") || "Cancel"}
                  </button>
                  <button onClick={handleConfirmRemoveMember} className="manage-office-btn manage-office-btn--danger">
                    {t("REMOVE_MEMBER") || "Remove Member"}
                  </button>
                </div>
              </React.Fragment>
            )}
          </div>
        </div>
      )}

      {/* Toast Notification: auto-close after 5s, close button to dismiss manually */}
      {toast && <Toast label={toast.label} onClose={() => setToast(null)} error={toast.type === "error"} isDleteBtn={true} />}
    </div>
  );
};

export default ManageOffice;
