import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { Loader } from "@egovernments/digit-ui-react-components";
import { userTypeOptions } from "../registration/config";
import { ManageOfficeDeleteIcon, ManageOfficeCloseIcon, ManageOfficeLeaveIcon, ProvideCaseAccessArrowIcon } from "../../../icons/svgIndex";
import CustomToast from "../../../components/CustomToast";

const ManageOffice = () => {
  const { t } = useTranslation();
  const history = useHistory();
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
  const userType = useMemo(() => individualData?.Individual?.[0]?.additionalFields?.fields?.find((obj) => obj?.key === "userType")?.value, [
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
    return userTypeOptions?.find((item) => item?.code === userType) || {};
  }, [userType]);

  const advocateSearchResult = useMemo(() => {
    return advocateData?.[`${userTypeDetail?.apiDetails?.requestKey}s`];
  }, [advocateData, userTypeDetail?.apiDetails?.requestKey]);

  // Get the logged-in advocate's ID from responseList for officeAdvocateUserUuid
  const officeAdvocateUserUuid = useMemo(() => {
    return userInfo?.uuid;
  }, [userInfo?.uuid]);

  // Get the logged-in advocate's name from additionalDetails.username for officeAdvocateName
  const officeAdvocateName = useMemo(() => {
    const advocateResult = advocateSearchResult?.[0]?.responseList?.[0] || advocateSearchResult?.[0];
    return advocateResult?.additionalDetails?.username;
  }, [advocateSearchResult]);

  // Fetch office members using the hook
  const {
    data: officeMembersData,
    isLoading: isLoadingMembers,
    isFetching: isFetchingMembers,
    refetch: refetchMembers,
  } = window?.Digit?.Hooks?.dristi?.useSearchOfficeMember(
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
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState(null);
  const [showToast, setShowToast] = useState(null);

  // "Advocates I'm working for" tab: fetch by memberId + tenantId (logged-in user as member)
  const {
    data: advocatesWorkingForData,
    isLoading: isLoadingAdvocatesWorkingFor,
    isFetching: isFetchingAdvocatesWorkingFor,
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
    { id: "myAdvocatesClerks", label: t("MY_ADVOCATES_CLERKS") },
    { id: "advocatesWorkingFor", label: t("ADVOCATES_WORKING_FOR") },
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

      if (individualResponse?.Individual && individualResponse?.Individual?.length > 0) {
        const individual = individualResponse?.Individual?.[0];
        // Validation: prevent adding self as a member
        if (individual?.userUuid && individual?.userUuid === officeAdvocateUserUuid) {
          setSearchError(t("YOU_CANNOT_ADD_YOURSELF"));
          setSearchResult(null);
          return;
        }
        // Get userType from searched individual (same as HomeView: individualData.Individual[0].additionalFields.fields)
        const memberUserType = individual?.additionalFields?.fields?.find((obj) => obj?.key === "userType")?.value;

        // Per userType, use same URL pattern as HomeView: ADVOCATE -> /advocate/v1/_search, else -> /advocate/clerk/v1/_search
        const searchUrl = memberUserType === "ADVOCATE" ? "/advocate/v1/_search" : "/advocate/clerk/v1/_search";

        const typeResponse = await window?.Digit?.DRISTIService?.searchAdvocateClerk(
          searchUrl,
          {
            criteria: [{ individualId: individual?.individualId }],
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
            { criteria: [{ individualId: individual?.individualId }], tenantId: tenantId },
            { tenantId: tenantId, limit: 10, offset: 0 }
          );
          const clerkList = clerkRes?.clerks;
          firstRecord = clerkList?.[0]?.responseList?.[0] || clerkList?.[0];
          if (firstRecord) {
            designation = "Clerk";
          } else {
            const advRes = await window?.Digit?.DRISTIService?.searchAdvocateClerk(
              "/advocate/v1/_search",
              { criteria: [{ individualId: individual?.individualId }], tenantId: tenantId },
              { tenantId: tenantId, limit: 10, offset: 0 }
            );
            const advList = advRes?.advocates;
            firstRecord = advList?.[0]?.responseList?.[0] || advList?.[0];
            if (firstRecord) designation = "Advocate";
          }
        }

        const clerkData = designation === "Clerk" ? firstRecord : null;
        const advocateData = designation === "Advocate" ? firstRecord : null;

        const name = individual?.name?.givenName
          ? `${individual?.name?.givenName}${individual?.name?.familyName ? " " + individual?.name?.familyName : ""}`
          : "N/A";

        // Validation: do not allow adding if this mobile number is already a member of the office
        const normalizeMobile = (val) => (val || "").replace(/\D/g, "");
        const searchedMobile = normalizeMobile(countryCode) + normalizeMobile(mobileNumber);
        const isAlreadyMember = (officeMembers || []).some((m) => {
          const existing = normalizeMobile(m?.memberMobileNumber);
          return (
            existing === searchedMobile ||
            (existing?.length >= 10 && searchedMobile?.length >= 10 && existing?.slice(-10) === searchedMobile?.slice(-10))
          );
        });
        if (isAlreadyMember) {
          setSearchError(t("MEMBER_ALREADY_EXISTS"));
          setSearchResult(null);
        } else if (!clerkData && !advocateData) {
          // Validation: only Advocates or Clerks can be added as members
          setSearchError(t("ONLY_ADVOCATE_OR_CLERK_ALLOWED"));
          setSearchResult(null);
        } else {
          setSearchResult({
            name: name,
            designation: firstRecord ? designation : "Individual",
            mobileNumber: `${countryCode} ${mobileNumber?.slice(0, 5)} ${mobileNumber?.slice(5)}`,
            email: individual?.email || "-",
            individualId: individual?.userUuid,
            clerkData: clerkData,
            advocateData: advocateData,
          });
        }
      } else {
        setSearchError(t("NO_MEMBER_FOUND"));
      }
    } catch (error) {
      console.error("Error searching for member:", error);
      setSearchError(t("SEARCH_ERROR"));
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirmAddMember = async () => {
    if (!searchResult || !officeAdvocateUserUuid) {
      setShowToast({ label: t("ADVOCATE_ID_NOT_FOUND"), error: true });
      return;
    }

    // Map designation to memberType
    const memberTypeMap = {
      Clerk: "ADVOCATE_CLERK",
      Advocate: "ADVOCATE",
      Individual: "INDIVIDUAL",
    };
    // Get memberId from responseList: id from clerk/advocate search (same as senior's API spec)
    const memberId =
      searchResult?.designation === "Clerk"
        ? searchResult?.clerkData?.id
        : searchResult?.designation === "Advocate"
        ? searchResult?.advocateData?.id
        : null;

    if (!memberId) {
      setShowToast({ label: t("MEMBER_ID_NOT_FOUND"), error: true });
      return;
    }

    const officeAdvocateId = advocateSearchResult?.[0]?.responseList?.[0]?.id || advocateSearchResult?.[0]?.id;

    setShowAddMemberModal(false);
    history.push(`/${window?.contextPath}/citizen/dristi/home/manage-office/manage-member`, {
      member: {
        memberName: searchResult?.name,
        memberType: memberTypeMap[searchResult?.designation] || "ADVOCATE_CLERK",
        memberMobileNumber: mobileNumber,
        memberEmail: searchResult?.email,
        memberId: memberId,
        memberUserUuid: searchResult?.individualId,
        officeAdvocateId: officeAdvocateId,
        officeAdvocateName: officeAdvocateName,
        accessType: "ALL_CASES",
        allowCaseCreate: true,
        addNewCasesAutomatically: true,
      },
      advocateInfo: {
        officeAdvocateUserUuid: officeAdvocateUserUuid,
        advocateId: officeAdvocateId,
      },
      isNewMember: true,
    });
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

  // Show loader both on initial load and on refetch when switching tabs
  const isLoadingDisplay =
    activeTab === "advocatesWorkingFor" ? isLoadingAdvocatesWorkingFor || isFetchingAdvocatesWorkingFor : isLoadingMembers || isFetchingMembers;

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    if (tabId === "myAdvocatesClerks" && refetchMembers) {
      refetchMembers();
    } else if (tabId === "advocatesWorkingFor" && refetchAdvocatesWorkingFor) {
      refetchAdvocatesWorkingFor();
    }
  };

  const handleDeleteClick = (member) => {
    setMemberToRemove(member);
    setShowRemoveMemberModal(true);
  };

  const formatMobileForDisplay = (rawNumber) => {
    if (!rawNumber) return "-";
    const digits = String(rawNumber).replace(/\D/g, "");
    if (!digits) return "-";
    const last10 = digits.slice(-10);
    if (last10.length !== 10) return rawNumber;
    const first5 = last10.slice(0, 5);
    const last5 = last10.slice(5);
    return `+91 ${first5} ${last5}`;
  };

  const handleCloseRemoveModal = () => {
    setShowRemoveMemberModal(false);
    setMemberToRemove(null);
  };

  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove || !officeAdvocateUserUuid) {
      setShowToast({ label: t("REMOVE_MEMBER_ERROR"), error: true });
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
            officeAdvocateId: memberToRemove?.officeAdvocateId != null ? memberToRemove?.officeAdvocateId : memberToRemove?.advocateId,
            memberType: memberToRemove?.memberType != null && memberToRemove?.memberType !== "" ? memberToRemove?.memberType : "ADVOCATE_CLERK",
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
        setShowToast({
          label: isLeavingOfficeTab ? t("LEFT_OFFICE_SUCCESSFULLY") : t("MEMBER_REMOVED_SUCCESS"),
          error: false,
        });
      }
    } catch (error) {
      console.error("Error removing member:", error);
      const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
      setShowToast({ label: t("REMOVE_MEMBER_ERROR"), error: true, errorId });
    } finally {
      setIsRemovingMember(false);
      setShowRemoveMemberModal(false);
      setMemberToRemove(null);
    }
  };

  return (
    <div className="manage-office-page">
      <h1 className="manage-office-title">{t("MANAGE_OFFICE")}</h1>
      <div className="manage-office-tabs-wrapper">
        <div className="manage-office-tabs">
          {tabs?.map((tab) => (
            <button
              key={tab?.id}
              onClick={() => handleTabClick(tab?.id)}
              className={`manage-office-tab${activeTab === tab?.id ? " manage-office-tab--active" : ""}`}
            >
              {tab?.label}
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
              {t("ADD_NEW_MEMBER")}
            </button>
          </div>
        )}

        {/* Members List or Empty State */}
        {isLoadingDisplay ? (
          <div className="manage-office-loader">
            <Loader />
          </div>
        ) : displayMembers?.length > 0 ? (
          <div className="manage-office-table-wrapper">
            {/* Table Header: 4 columns for Advocates I'm working for, 5 for My Advocates/Clerks */}
            <div className={`manage-office-table-header${activeTab === "advocatesWorkingFor" ? " manage-office-table-header--working-for" : ""}`}>
              <span>{activeTab === "advocatesWorkingFor" ? t("ADVOCATE") : t("NAME")}</span>
              <span>{t("MOBILE_NUMBER")}</span>
              {activeTab !== "advocatesWorkingFor" && <span>{t("DESIGNATION")}</span>}
              <span>{t("ACCESS_TYPE")}</span>
              <span>{t("ACTION")}</span>
            </div>
            {/* Table Rows */}
            {displayMembers?.map((member) => (
              <div
                key={member.id || member.memberId}
                className={`manage-office-table-row${activeTab === "advocatesWorkingFor" ? " manage-office-table-row--working-for" : ""}`}
              >
                <span
                  className={activeTab === "advocatesWorkingFor" ? "manage-office-name" : "manage-office-name manage-office-name--clickable"}
                  role={activeTab === "myAdvocatesClerks" ? "button" : undefined}
                  onClick={
                    activeTab === "myAdvocatesClerks"
                      ? () =>
                          history.push(`/${window?.contextPath}/citizen/dristi/home/manage-office/manage-member`, {
                            member,
                            advocateInfo: {
                              officeAdvocateUserUuid: officeAdvocateUserUuid,
                              advocateId:
                                advocateSearchResult?.[0]?.responseList?.[0]?.id ||
                                advocateSearchResult?.[0]?.id ||
                                member?.officeAdvocateId ||
                                member?.advocateId,
                            },
                          })
                      : undefined
                  }
                >
                  {activeTab === "advocatesWorkingFor" ? member?.officeAdvocateName || member?.memberName : member?.memberName}
                </span>
                <span>
                  {activeTab === "advocatesWorkingFor"
                    ? formatMobileForDisplay(member?.advocateOfficeMobileNumber)
                    : formatMobileForDisplay(member?.memberMobileNumber)}
                </span>
                {activeTab !== "advocatesWorkingFor" && (
                  <span>
                    {member?.memberType === "ADVOCATE_CLERK"
                      ? ((l) => l.charAt(0).toUpperCase() + l.slice(1).toLowerCase())(t("CLERK"))
                      : member?.memberType === "ADVOCATE"
                      ? t("ASSISTANT_ADVOCATE")
                      : member?.memberType}
                  </span>
                )}
                <span>
                  <span className="manage-office-access-pill">{member?.accessType === "ALL_CASES" ? t("ALL_CASES") : t("SPECIFIC_CASES")}</span>
                </span>
                <span className={`manage-office-actions${activeTab === "advocatesWorkingFor" ? " manage-office-actions--compact" : ""}`}>
                  {activeTab === "myAdvocatesClerks" && (
                    <button
                      type="button"
                      className="manage-office-manage-btn"
                      onClick={() =>
                        history.push(`/${window?.contextPath}/citizen/dristi/home/manage-office/manage-member`, {
                          member,
                          advocateInfo: {
                            officeAdvocateUserUuid: officeAdvocateUserUuid,
                            advocateId:
                              advocateSearchResult?.[0]?.responseList?.[0]?.id ||
                              advocateSearchResult?.[0]?.id ||
                              member?.officeAdvocateId ||
                              member?.advocateId,
                          },
                        })
                      }
                    >
                      {t("MANAGE")}
                    </button>
                  )}
                  {activeTab === "advocatesWorkingFor" ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(member)}
                      className="manage-office-leave-icon-btn"
                      aria-label={t("LEAVE_OFFICE")}
                    >
                      <ManageOfficeLeaveIcon />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(member)}
                      className="manage-office-delete-btn"
                      aria-label={t("REMOVE_FROM_OFFICE")}
                    >
                      <ManageOfficeDeleteIcon />
                    </button>
                  )}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="manage-office-empty">
            {activeTab === "advocatesWorkingFor" ? (
              <React.Fragment>
                <p className="manage-office-empty__title">{t("NO_DATA_TO_DISPLAY")}</p>
                <p className="manage-office-empty__title">{t("NOT_WORKING_FOR_ANY_ADVOCATES")}</p>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <p className="manage-office-empty__title">{t("NO_DATA_TO_DISPLAY")}</p>
                <p className="manage-office-empty__subtitle">{t("PLEASE_ADD_MEMBER")}</p>
              </React.Fragment>
            )}
          </div>
        )}
      </div>
      {showAddMemberModal && (
        <div className="manage-office-modal-overlay" onClick={handleCloseModal}>
          <div className={`manage-office-modal ${searchResult ? "manage-office-modal--compact" : ""}`} onClick={(e) => e.stopPropagation()}>
            <div className="manage-office-modal__header">
              <h2 className="manage-office-modal__title">{t("ADD_MEMBER")}</h2>
              <button onClick={handleCloseModal} className="manage-office-modal__close">
                <ManageOfficeCloseIcon />
              </button>
            </div>

            {isSearching ? (
              <div className="manage-office-modal-loader">
                <Loader />
              </div>
            ) : (
              <React.Fragment>
                <div className="manage-office-modal__body">
                  {searchResult ? (
                    <div className="manage-office-search-card">
                      <div className="manage-office-search-card__row">
                        <p className="manage-office-search-card__label">{t("NAME")}</p>
                        <p className="manage-office-search-card__value">{searchResult?.name}</p>
                      </div>
                      <div className="manage-office-search-card__row">
                        <p className="manage-office-search-card__label">{t("DESIGNATION")}</p>
                        <p className="manage-office-search-card__value">
                          {searchResult?.designation === "Clerk"
                            ? ((l) => l.charAt(0).toUpperCase() + l.slice(1).toLowerCase())(t("CLERK"))
                            : searchResult?.designation === "Advocate"
                            ? t("ASSISTANT_ADVOCATE")
                            : searchResult?.designation}
                        </p>
                      </div>
                      <div className="manage-office-search-card__row">
                        <p className="manage-office-search-card__label">{t("MOBILE_NUMBER")}</p>
                        <p className="manage-office-search-card__value">{searchResult?.mobileNumber}</p>
                      </div>
                      <div className="manage-office-search-card__row">
                        <p className="manage-office-search-card__label">{t("EMAIL")}</p>
                        <p className="manage-office-search-card__value">{searchResult?.email}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="manage-office-search-field">
                      <label className="manage-office-search-field__label">{t("MOBILE_NUMBER_OF_MEMBER")}</label>
                      <div className="manage-office-search-field__control">
                        <select
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          className="manage-office-search-field__country"
                          disabled
                        >
                          <option value="+91">+91</option>
                        </select>
                        <input
                          type="tel"
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
                          placeholder={t("ENTER_HERE")}
                          maxLength={10}
                          className="manage-office-search-field__input"
                        />
                      </div>
                      {searchError && <div className="manage-office-search-field__error">{searchError}</div>}
                    </div>
                  )}
                </div>

                <div className="manage-office-modal__footer">
                  <button onClick={handleGoBack} className="manage-office-btn manage-office-btn--secondary">
                    {t("GO_BACK")}
                  </button>
                  {searchResult ? (
                    <button onClick={handleConfirmAddMember} className="manage-office-btn manage-office-btn--primary">
                      <span style={{ marginRight: "8px" }}>{t("PROVIDE_CASE_ACCESS")}</span>
                      <ProvideCaseAccessArrowIcon />
                    </button>
                  ) : (
                    <button
                      onClick={handleSearch}
                      disabled={!mobileNumber || mobileNumber?.length < 10}
                      className={`manage-office-btn manage-office-btn--primary${
                        !mobileNumber || mobileNumber?.length < 10 ? " manage-office-btn--disabled" : ""
                      }`}
                    >
                      {t("SEARCH")}
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
              <h2 className="manage-office-modal__title">{activeTab === "advocatesWorkingFor" ? t("LEAVE_OFFICE") : t("REMOVE_MEMBER")}</h2>
              <button onClick={handleCloseRemoveModal} className="manage-office-modal__close">
                <ManageOfficeCloseIcon />
              </button>
            </div>

            {isRemovingMember ? (
              <div className="manage-office-modal-loader">
                <Loader />
              </div>
            ) : (
              <React.Fragment>
                <p className="manage-office-remove-text">
                  {activeTab === "advocatesWorkingFor" ? t("CONFIRM_LEAVE_ADVOCATE_OFFICE") : t("CONFIRM_REMOVE_MEMBER_MESSAGE")}
                </p>
                <div className="manage-office-modal__footer">
                  <button onClick={handleCloseRemoveModal} className="manage-office-btn manage-office-btn--secondary">
                    {t("CANCEL")}
                  </button>
                  <button onClick={handleConfirmRemoveMember} className="manage-office-btn manage-office-btn--danger">
                    {activeTab === "advocatesWorkingFor" ? t("LEAVE_OFFICE") : t("REMOVE_MEMBER")}
                  </button>
                </div>
              </React.Fragment>
            )}
          </div>
        </div>
      )}
      {/* Toast Notification: auto-close after 5s, close button to dismiss manually */}
      {showToast && (
        <CustomToast
          error={showToast?.error}
          label={showToast?.label}
          errorId={showToast?.errorId}
          onClose={() => setShowToast(null)}
          duration={showToast?.errorId ? 7000 : 5000}
        />
      )}
    </div>
  );
};

export default ManageOffice;
