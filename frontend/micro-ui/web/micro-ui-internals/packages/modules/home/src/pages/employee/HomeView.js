import { useTranslation } from "react-i18next";
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useHistory } from "react-router-dom";
import { Button, InboxSearchComposer } from "@egovernments/digit-ui-react-components";
import { rolesToConfigMapping, userTypeOptions, getUnifiedEmployeeConfig, getOnRowClickConfig, litigantConfig } from "../../configs/HomeConfig";
import UpcomingHearings from "../../components/UpComingHearing";
import { Loader, Toast } from "@egovernments/digit-ui-react-components";
import TasksComponent from "../../components/TaskComponent";
import { useLocation } from "react-router-dom/cjs/react-router-dom.min";
import { HomeService } from "../../hooks/services";
import LitigantHomePage from "./LitigantHomePage";
import ReviewCard from "../../components/ReviewCard";
import { InboxIcon } from "../../../homeIcon";
import { Link } from "react-router-dom";
import useSearchOrdersNotificationService from "@egovernments/digit-ui-module-orders/src/hooks/orders/useSearchOrdersNotificationService";
import { OrderWorkflowState } from "@egovernments/digit-ui-module-orders/src/utils/orderWorkflow";
import isEqual from "lodash/isEqual";
import { DRISTIService } from "@egovernments/digit-ui-module-dristi/src/services";
import useSearchCaseListService from "@egovernments/digit-ui-module-dristi/src/hooks/dristi/useSearchCaseListService";
import { BreadCrumb } from "@egovernments/digit-ui-react-components";
import SelectAdvocateModal from "./SelectAdvocateModal";
import { Dropdown } from "@egovernments/digit-ui-components";
import { ADVOCATE_OFFICE_MAPPING_KEY, extractedSeniorAdvocates } from "../../utils";

const defaultSearchValues = {
  caseSearchText: "",
  caseType: "NIA S138",
};

const linkStyle = {
  color: "black",
  backgroundColor: "#ECF3FD",
  fontWeight: 500,
  textDecoration: "none",
  padding: 12,
  borderRadius: "8px",
  display: "inline-block",
};
const bredCrumbStyle = { maxWidth: "min-content" };

const ProjectBreadCrumb = ({ location, t }) => {
  const userInfo = window?.Digit?.UserService?.getUser()?.info;
  let userType = "employee";
  if (userInfo) {
    userType = userInfo?.type === "CITIZEN" ? "citizen" : "employee";
  }
  const roles = useMemo(() => userInfo?.roles, [userInfo]);
  const isEpostUser = useMemo(() => roles?.some((role) => role?.code === "POST_MANAGER"), [roles]);

  let homePath = `/${window?.contextPath}/${userType}/home/home-pending-task`;
  if (!isEpostUser && userType === "employee") homePath = `/${window?.contextPath}/${userType}/home/home-screen`;
  const crumbs = [
    {
      path: homePath,
      content: t("ES_COMMON_HOME"),
      show: true,
      isLast: false,
    },
    {
      path: `/${window?.contextPath}/employee/home/home-pending-task`,
      content: t("OPEN_ALL_CASES"),
      show: true,
      isLast: false,
    },
  ];
  return <BreadCrumb crumbs={crumbs} spanStyle={bredCrumbStyle} />;
};

const HomeView = () => {
  const history = useHistory();
  const location = useLocation();
  const { state } = location;
  const { t } = useTranslation();
  const Digit = window.Digit || {};
  const token = window.localStorage.getItem("token");
  const isUserLoggedIn = Boolean(token);
  const [defaultValues, setDefaultValues] = useState(defaultSearchValues);

  const [tabData, setTabData] = useState(null);
  const [callRefetch, setCallRefetch] = useState(false);
  const [tabConfig, setTabConfig] = useState(null);
  const [onRowClickData, setOnRowClickData] = useState({ url: "", params: [] });
  const [taskType, setTaskType] = useState(state?.taskType || {});
  const [caseType, setCaseType] = useState(state?.caseType || {});
  const [showSelectAdvocateModal, setShowSelectAdvocateModal] = useState(false);
  const [selectedSeniorAdvocate, setSelectedSeniorAdvocate] = useState({});
  const citizenDataLoadingRef = useRef(null);
  const initialCountFetchRef = useRef(false);

  const userInfo = useMemo(() => Digit?.UserService?.getUser()?.info, [Digit.UserService]);
  const roles = useMemo(() => userInfo?.roles, [userInfo]);
  const isScrutiny = roles?.some((role) => role.code === "CASE_REVIEWER");
  const hasViewSignOrderAccess = useMemo(() => roles?.some((role) => role.code === "VIEW_SIGN_ORDERS"), [roles]);
  const viewDashBoards = useMemo(() => roles?.some((role) => role?.code === "VIEW_DASHBOARDS"), [roles]); // to show Dashboards, Reports tabs.
  const viewADiary = useMemo(() => roles?.some((role) => role?.code === "DIARY_VIEWER"), [roles]); // to show A-Diary tab.
  const hasViewAllCasesAccess = useMemo(() => roles?.some((role) => role?.code === "VIEW_ALL_CASES"), [roles]);

  const showReviewSummonsWarrantNotice = useMemo(() => roles?.some((role) => role?.code === "TASK_EDITOR"), [roles]);
  const tenantId = useMemo(() => window?.Digit.ULBService.getCurrentTenantId(), []);
  const userInfoType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo]);
  const [toastMsg, setToastMsg] = useState(null);
  const courtId = localStorage.getItem("courtId");

  const [config, setConfig] = useState(null);
  const { data: individualData, isLoading, isFetching } = window?.Digit.Hooks.dristi.useGetIndividualUser(
    {
      Individual: {
        userUuid: [userInfo?.uuid],
      },
    },
    { tenantId, limit: 1000, offset: 0 },
    "Home",
    userInfo?.uuid || "",
    Boolean(userInfo?.uuid && isUserLoggedIn),
    6 * 1000
  );
  const individualId = useMemo(() => individualData?.Individual?.[0]?.individualId, [individualData]);

  const isLitigantPartialRegistered = useMemo(() => {
    if (userInfoType !== "citizen") return false;

    if (!individualData?.Individual || individualData.Individual.length === 0) return false;

    if (individualData?.Individual[0]?.userDetails?.roles?.some((role) => role?.code === "ADVOCATE_ROLE")) return false;

    const address = individualData.Individual[0]?.address;
    return !address || (Array.isArray(address) && address.length === 0);
  }, [individualData?.Individual, userInfoType]);

  if (isLitigantPartialRegistered) {
    history.push(`/${window?.contextPath}/citizen/dristi/home/registration/user-name`);
  }

  const userType = useMemo(() => individualData?.Individual?.[0]?.additionalFields?.fields?.find((obj) => obj.key === "userType")?.value, [
    individualData?.Individual,
  ]);
  const { data: searchData, isLoading: isSearchLoading } = Digit?.Hooks?.dristi?.useGetAdvocateClerk(
    {
      criteria: [{ individualId }],
      tenantId,
    },
    { tenantId },
    individualId,
    Boolean(isUserLoggedIn && individualId && userType !== "LITIGANT"),
    userType === "ADVOCATE" ? "/advocate/v1/_search" : "/advocate/clerk/v1/_search"
  );

  const { data: ordersNotificationData, isLoading: isOrdersLoading } = useSearchOrdersNotificationService(
    {
      inbox: {
        processSearchCriteria: {
          businessService: ["notification"],
          moduleName: "Transformer service",
        },
        limit: 1,
        offset: 0,
        tenantId: tenantId,
        moduleSearchCriteria: {
          entityType: "Order",
          tenantId: tenantId,
          status: OrderWorkflowState.PENDING_BULK_E_SIGN,
          ...(courtId && { courtId }),
        },
      },
    },
    { tenantId },
    OrderWorkflowState.PENDING_BULK_E_SIGN,
    Boolean(hasViewSignOrderAccess && courtId)
  );

  const refreshInbox = () => {
    setCallRefetch(!callRefetch);
  };

  const refreshInboxAfterSelectedAdvocateChange = () => {
    setCallRefetch(!callRefetch);
    getTotalCountForTab(tabConfigs);
  };

  const userTypeDetail = useMemo(() => {
    return userTypeOptions.find((item) => item.code === userType) || {};
  }, [userType]);

  const searchResult = useMemo(() => {
    return searchData?.[`${userTypeDetail?.apiDetails?.requestKey}s`]?.[0]?.responseList;
  }, [searchData, userTypeDetail?.apiDetails?.requestKey]);

  const isApprovalPending = useMemo(() => {
    return (
      userType !== "LITIGANT" &&
      Array.isArray(searchResult) &&
      searchResult?.length > 0 &&
      searchResult?.[0]?.isActive === false &&
      searchResult?.[0]?.status !== "INACTIVE"
    );
  }, [searchResult, userType]);

  const advocateId = useMemo(() => {
    return userType === "ADVOCATE" ? searchResult?.[0]?.id : null;
  }, [searchResult, userType]);

  const advClerkId = useMemo(() => {
    return userType === "ADVOCATE_CLERK" ? searchResult?.[0]?.id : null;
  }, [searchResult, userType]);

  const searchCriteria = useMemo(() => {
    return userType === "ADVOCATE" ? { memberId: advocateId } : userType === "ADVOCATE_CLERK" ? { memberId: advClerkId } : {};
  }, [advocateId, advClerkId, userType]);

  const { data: officeMembersData, isLoading: isLoadingMembers, refetch: refetchMembers } = window?.Digit?.Hooks?.dristi?.useSearchOfficeMember(
    {
      searchCriteria: {
        ...searchCriteria,
        tenantId: tenantId,
      },
    },
    { tenantId },
    searchCriteria,
    Boolean((advocateId || advClerkId) && tenantId)
  );

  const seniorAdvocates = useMemo(() => {
    if (isLoadingMembers) return [];
    if (userType === "ADVOCATE" && advocateId) {
      const selfDetails = [{ id: advocateId, value: advocateId, advocateName: userInfo?.name, uuid: userInfo?.uuid }];
      if (officeMembersData?.members?.length > 0) {
        const seniorAdvocatesList = Array.isArray(officeMembersData?.members) ? extractedSeniorAdvocates(officeMembersData) || [] : [];
        const totalList = [...selfDetails, ...seniorAdvocatesList];
        return [...(totalList || [])].sort((a, b) => a?.advocateName?.localeCompare(b?.advocateName));
      } else return selfDetails;
    } else if (userType === "ADVOCATE_CLERK" && advClerkId) {
      if (officeMembersData?.members?.length > 0) {
        const seniorAdvocatesList = Array.isArray(officeMembersData?.members) ? extractedSeniorAdvocates(officeMembersData) || [] : [];
        return [...(seniorAdvocatesList || [])].sort((a, b) => a?.advocateName?.localeCompare(b?.advocateName));
      } else return [];
    }
    return [];
  }, [advocateId, advClerkId, officeMembersData, isLoadingMembers, userType, userInfo?.name, userInfo?.uuid]);

  const unAssociatedClerk = useMemo(() => {
    // seniorAdvocates length zero means the logged in clerk is not associated with any advocate yet.
    if (userType === "ADVOCATE_CLERK" && seniorAdvocates?.length === 0) {
      return true;
    }
    return false;
  }, [userType, seniorAdvocates?.length]);

  const handleDropdownChange = (selectedAdvocateOption) => {
    const selectedValue = selectedAdvocateOption?.value;
    if (!selectedValue) return;

    const matchingAdvocate = seniorAdvocates.find((opt) => opt?.value === selectedValue);
    if (!matchingAdvocate) return;

    const { id, uuid, value, advocateName } = matchingAdvocate;
    setSelectedSeniorAdvocate((prev) => {
      if (prev?.id === id && prev?.uuid === uuid) return prev;
      return {
        advocateName,
        value,
        id,
        uuid,
      };
    });
    refreshInbox();
  };

  useEffect(() => {
    selectedSeniorAdvocate?.id && refreshInboxAfterSelectedAdvocateChange(); // TODO: add logic to remove duplicate calls initially(after changing advocate, duplication is not happening)
    const matchingAdvocate = seniorAdvocates.find((opt) => opt?.id === selectedSeniorAdvocate?.id);

    if (!matchingAdvocate) return;

    const { id, uuid, value, advocateName } = matchingAdvocate;

    const nextMapping = {
      loggedInMemberId: advocateId || advClerkId,
      officeAdvocateId: id,
      officeAdvocateUuid: uuid,
    };

    const prevMapping = localStorage.getItem(ADVOCATE_OFFICE_MAPPING_KEY);
    const nextMappingStr = JSON.stringify(nextMapping);

    if (prevMapping !== nextMappingStr) {
      localStorage.setItem(ADVOCATE_OFFICE_MAPPING_KEY, nextMappingStr);
    }
  }, [selectedSeniorAdvocate?.id]);

  useEffect(() => {
    if (!seniorAdvocates?.length) return;
    if (seniorAdvocates?.length > 0) {
      const savedSeniorAdvocate = JSON.parse(localStorage.getItem("advocateOfficeMapping"));
      if (savedSeniorAdvocate) {
        const matchingAdvocate = seniorAdvocates.find((opt) => opt?.id === savedSeniorAdvocate?.officeAdvocateId);
        if (!matchingAdvocate) return;

        const { id, uuid, value, advocateName } = matchingAdvocate;
        setSelectedSeniorAdvocate({
          advocateName,
          value,
          id,
          uuid,
        });
      } else {
        setSelectedSeniorAdvocate((prev) => {
          if (prev?.id === seniorAdvocates?.[0]?.id) return prev;
          else {
            if (userType === "ADVOCATE" && advocateId) {
              return seniorAdvocates.find((opt) => opt?.id === advocateId);
            }
            return seniorAdvocates?.[0];
          }
        });
      }
    }
  }, [seniorAdvocates, userType, advocateId]);

  const additionalDetails = useMemo(() => {
    if (!userInfoType) return null;
    if (userInfoType === "citizen" && !userType) return null;
    if ((userType === "ADVOCATE" && !advocateId) || (userType === "ADVOCATE_CLERK" && !advClerkId)) return null;
    if (((userType === "ADVOCATE" && advocateId) || (userType === "ADVOCATE_CLERK" && advClerkId)) && !selectedSeniorAdvocate?.id) return null;
    return {
      ...(advClerkId
        ? {
            searchKey: "filingNumber",
            defaultFields: true,
            officeAdvocateId: selectedSeniorAdvocate?.id, // TODO: handle for jr adv and senr adv
            memberId: advClerkId,
            ...(courtId && !isScrutiny && { courtId }),
          }
        : advocateId
        ? {
            searchKey: "filingNumber",
            defaultFields: true,
            ...(advocateId === selectedSeniorAdvocate?.id
              ? { advocateId }
              : {
                  officeAdvocateId: selectedSeniorAdvocate?.id,
                  memberId: advocateId,
                }),
            ...(courtId && !isScrutiny && { courtId }),
          }
        : individualId
        ? {
            searchKey: "filingNumber",
            defaultFields: true,
            litigantId: individualId,
            ...(courtId && !isScrutiny && { courtId }),
          }
        : { ...(courtId && !isScrutiny && { courtId }) }),
    };
  }, [advocateId, advClerkId, individualId, courtId, isScrutiny, selectedSeniorAdvocate, userType, userInfoType]);

  useEffect(() => {
    setDefaultValues(defaultSearchValues);
  }, []);

  useEffect(() => {
    state && state.taskType && setTaskType(state.taskType);
  }, [state]);

  const { isLoading: isOutcomeLoading, data: outcomeTypeData } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    "case",
    [{ name: "OutcomeType" }],
    {
      select: (data) => {
        return (data?.case?.OutcomeType || []).flatMap((item) => {
          return item?.judgementList?.length > 0 ? item.judgementList : [item?.outcome];
        });
      },
    }
  );

  const rolesToConfigMappingData = useMemo(() => {
    if (state?.role && rolesToConfigMapping?.find((item) => item[state.role])) {
      return rolesToConfigMapping?.find((item) => item[state.role]);
    } else {
      // For employees, use unified config approach
      if (userInfoType === "employee") {
        const unifiedConfig = getUnifiedEmployeeConfig(roles);
        const onRowClickRoute = getOnRowClickConfig(roles);

        return {
          config: unifiedConfig,
          onRowClickRoute: onRowClickRoute,
          isEmployee: true,
        };
      } else if (userInfoType === "citizen") {
        return litigantConfig;
      } else return null;
    }
  }, [state?.role, roles, userInfoType]);

  const tabConfigs = useMemo(() => rolesToConfigMappingData.config, [rolesToConfigMappingData]);
  const rowClickData = useMemo(() => rolesToConfigMappingData.onRowClickRoute, [rolesToConfigMappingData]);

  const getTotalCountForTab = useCallback(
    async function (tabConfig) {
      const updatedTabData = await Promise.all(
        tabConfig?.TabSearchConfig?.map(async (configItem, index) => {
          const response = await HomeService.customApiService(configItem?.apiDetails?.serviceName, {
            tenantId,
            criteria: {
              ...configItem?.apiDetails?.requestBody?.criteria,
              ...defaultSearchValues,
              ...additionalDetails,
              ...(configItem?.apiDetails?.requestBody?.criteria?.outcome && {
                outcome: outcomeTypeData,
              }),
              pagination: { offSet: 0, limit: 1 },
            },
          });
          const totalCount = response?.pagination?.totalCount;
          return {
            key: index,
            label: totalCount ? `${t(configItem.label)} (${totalCount})` : `${t(configItem.label)} (0)`,
            active: index === 0 ? true : false,
          };
        }) || []
      );
      setTabData(updatedTabData);
    },
    [additionalDetails, outcomeTypeData, tenantId, t]
  );

  const citizenId = useMemo(() => {
    if (userInfoType === "citizen" && !isSearchLoading) {
      return advocateId ? advocateId : individualId;
    } else return null;
  }, [userInfoType, advocateId, individualId, isSearchLoading]);

  const casefetchCriteriaForCitizen = useMemo(() => {
    if (!citizenId) return false;
    if (citizenId) {
      if (!userType) return false;
      if (userType === "LITIGANT") {
        if (individualId) return true;
        return false;
      }
      if ((userType === "ADVOCATE" && !advocateId) || (userType === "ADVOCATE_CLERK" && !advClerkId)) return false;
      if ((userType === "ADVOCATE" && advocateId) || (userType === "ADVOCATE_CLERK" && advClerkId)) {
        if (selectedSeniorAdvocate?.id) {
          return true;
        }
      }
      return false;
    }
    return false;
  }, [citizenId, userType, advocateId, advClerkId, selectedSeniorAdvocate?.id, individualId]);

  const { data: citizenCaseData, isLoading: isCitizenCaseDataLoading } = useSearchCaseListService(
    {
      criteria: {
        ...(citizenId
          ? advocateId
            ? advocateId === selectedSeniorAdvocate?.id
              ? { advocateId }
              : {
                  officeAdvocateId: selectedSeniorAdvocate?.id,
                  memberId: advocateId,
                }
            : advClerkId
            ? {
                officeAdvocateId: selectedSeniorAdvocate?.id,
                memberId: advClerkId,
              }
            : { litigantId: individualId }
          : {}),
        pagination: { offSet: 0, limit: 1 },
        tenantId,
      },
      tenantId,
    },
    {},
    `dristi-${casefetchCriteriaForCitizen}`,
    "",
    Boolean(casefetchCriteriaForCitizen),
    true,
    6 * 1000
  );

  // This is to check if the citizen has been associated with a case yet.
  const isCitizenReferredInAnyCase = useMemo(() => {
    return citizenCaseData?.caseList?.[0];
  }, [citizenCaseData]);

  useEffect(() => {
    if (citizenCaseData) {
      citizenDataLoadingRef.current = true;
    }
  }, [citizenCaseData]);

  useEffect(() => {
    const isAnyLoading = isLoading || isFetching || isSearchLoading || isOutcomeLoading || isCitizenCaseDataLoading || !additionalDetails;
    if (!isAnyLoading && tabConfigs && rowClickData && rolesToConfigMappingData && userInfoType) {
      setOnRowClickData(rowClickData);
      if (tabConfigs && !isEqual(tabConfigs, tabConfig)) {
        setConfig(tabConfigs?.TabSearchConfig?.[0]);
        setTabConfig(tabConfigs);
        // initialCountFetchRef.current = true; // TODO: check logic to remove duplicate calls for citizen
        getTotalCountForTab(tabConfigs);
      }
    }
  }, [
    isLoading,
    isFetching,
    isSearchLoading,
    isOutcomeLoading,
    rowClickData,
    tabConfig,
    tabConfigs,
    getTotalCountForTab,
    rolesToConfigMappingData,
    isCitizenCaseDataLoading,
    userInfoType,
    additionalDetails,
    callRefetch,
  ]);

  const onTabChange = (n) => {
    setTabData((prev) => prev.map((i, c) => ({ ...i, active: c === n ? true : false })));
    setConfig(tabConfig?.TabSearchConfig?.[n]);
  };

  const handleNavigate = () => {
    const contextPath = window?.contextPath || "";
    history.push({
      pathname: `/${contextPath}/${userInfoType}/hearings`,
      state: { fromHome: true },
    });
  };

  const JoinCaseHome = Digit?.ComponentRegistryService?.getComponent("JoinCaseHome");

  const getRedirectUrl = (status, caseId, filingNumber) => {
    const contextPath = window?.contextPath;
    const userType = userInfoType;
    const baseUrl = `/${contextPath}/${userType}/dristi/home/view-case`;
    const params = `caseId=${caseId}&filingNumber=${filingNumber}`;

    switch (status) {
      case "UNDER_SCRUTINY":
        return userType === "employee" ? `/${contextPath}/${userType}/dristi/cases?${params}` : `${baseUrl}?${params}&tab=Complaint`;
      case "PENDING_REGISTRATION":
        return userType === "employee" ? `/${contextPath}/${userType}/dristi/admission?${params}` : `${baseUrl}?${params}&tab=Complaint`;
      case "PENDING_E-SIGN":
      case "PENDING_E-SIGN-2":
      case "PENDING_SIGN":
      case "PENDING_RE_E-SIGN":
      case "PENDING_RE_E-SIGN-2":
      case "PENDING_RE_SIGN":
        return `/${contextPath}/${userType}/dristi/home/file-case/sign-complaint?filingNumber=${filingNumber}&caseId=${caseId}`;
      default:
        return `${baseUrl}?${params}&tab=Overview`;
    }
  };

  const handleScrutinyAndLock = async (filingNumber) => {
    if (isScrutiny) {
      try {
        const response = await DRISTIService.getCaseLockStatus({}, { uniqueId: filingNumber, tenantId: tenantId });
        if (response?.Lock?.isLocked) {
          showToast("error", t("CASE_IS_ALREADY_LOCKED"), 5000);
          return false;
        } else {
          await DRISTIService.setCaseLock({ Lock: { uniqueId: filingNumber, tenantId: tenantId, lockType: "SCRUTINY" } }, {});

          return true;
        }
      } catch (error) {
        showToast("error", t("ISSUE_WITH_LOCK"), 5000);
        console.error(error);
        return false;
      }
    } else return true;
  };

  const onRowClick = async (row) => {
    if (userInfoType === "citizen" && row?.original?.advocateStatus === "PENDING") {
      return;
    }
    const searchParams = new URLSearchParams();
    if (
      onRowClickData?.urlDependentOn && onRowClickData?.urlDependentValue && Array.isArray(onRowClickData?.urlDependentValue)
        ? onRowClickData?.urlDependentValue.includes(row.original[onRowClickData?.urlDependentOn])
        : row.original[onRowClickData?.urlDependentOn] === onRowClickData?.urlDependentValue
    ) {
      onRowClickData.params.forEach((item) => {
        searchParams.set(item?.key, row.original[item?.value]);
      });

      const allowed = await handleScrutinyAndLock(row?.original?.filingNumber);

      if (!allowed) {
        return;
      }
      history.push(`/${window?.contextPath}/${userInfoType}${onRowClickData?.dependentUrl}?${searchParams.toString()}`);
    } else if (onRowClickData?.url) {
      onRowClickData.params.forEach((item) => {
        searchParams.set(item?.key, row.original[item?.value]);
      });
      history.push(`/${window?.contextPath}/${userInfoType}${onRowClickData?.url}?${searchParams.toString()}`);
    } else {
      const statusArray = [
        "PENDING_REGISTRATION",
        "CASE_ADMITTED",
        "PENDING_PAYMENT",
        "UNDER_SCRUTINY",
        "PENDING_ADMISSION",
        "PENDING_E-SIGN",
        "PENDING_E-SIGN-2",
        "PENDING_RE_E-SIGN",
        "PENDING_SIGN",
        "PENDING_RE_E-SIGN-2",
        "PENDING_RE_SIGN",
        "PENDING_ADMISSION_HEARING",
        "PENDING_NOTICE",
        "PENDING_RESPONSE",
        "UNDER_SCRUTINY",
        "CASE_DISMISSED",
        "RE_PENDING_PAYMENT",
      ];
      if (statusArray.includes(row?.original?.status)) {
        history.push(getRedirectUrl(row?.original?.status, row?.original?.id, row?.original?.filingNumber));
      }
    }
  };

  if (userInfoType === "employee" && !hasViewAllCasesAccess) {
    history.push(`/${window?.contextPath}/employee/home/home-screen`);
  }

  if (isUserLoggedIn && !individualId && userInfoType === "citizen") {
    history.push(`/${window?.contextPath}/${userInfoType}/dristi/landing-page`);
  }

  const data = [
    {
      logo: <InboxIcon />,
      title: t("REVIEW_SUMMON_NOTICE_WARRANTS_TEXT"),
      actionLink: "orders/Summons&Notice",
    },
    // {
    //   logo: <DocumentIcon />,
    //   title: t("VIEW_ISSUED_ORDERS"),
    //   actionLink: "",
    // },
  ];

  const canJoinCase = useMemo(() => {
    // iF user is advocate clerk then do not allow to join case(only for sprint 1st half, in 2nd half it is allowed)
    if (userType === "ADVOCATE_CLERK") {
      return false;
    }
    return true;
  }, [userType]);

  if (
    isLoading ||
    isFetching ||
    isSearchLoading ||
    isOrdersLoading ||
    isOutcomeLoading ||
    isCitizenCaseDataLoading ||
    isLoadingMembers ||
    citizenDataLoadingRef.current === false
  ) {
    return <Loader />;
  }
  const showToast = (type, message, duration = 5000) => {
    setToastMsg({ key: type, action: message });
    setTimeout(() => {
      setToastMsg(null);
    }, duration);
  };

  const handleConfirmAdvocate = (advocate) => {
    setShowSelectAdvocateModal(false);
    history.push(`/${window?.contextPath}/citizen/dristi/home/file-case`);
  };

  const handleClickFileCase = () => {
    if (userType === "LITIGANT") {
      history.push(`/${window?.contextPath}/citizen/dristi/home/file-case`);
    } else if (userType === "ADVOCATE") {
      if (advocateId === selectedSeniorAdvocate?.id) {
        // No need to show modal if selected adv is the logged in adv itself.
        history.push(`/${window?.contextPath}/citizen/dristi/home/file-case`);
      } else {
        setShowSelectAdvocateModal(true);
      }
    } else if (userType === "ADVOCATE_CLERK") {
      setShowSelectAdvocateModal(true);
    }
  };

  return (
    <React.Fragment>
      {<ProjectBreadCrumb location={window.location} t={t} />}
      <div className="home-view-hearing-container">
        {individualId && userType && userInfoType === "citizen" && !isCitizenReferredInAnyCase && userType === "LITIGANT" ? (
          <LitigantHomePage isApprovalPending={isApprovalPending} unAssociatedClerk={unAssociatedClerk} />
        ) : (
          <React.Fragment>
            <div
              className="left-side"
              style={{ width: individualId && userType && userInfoType === "citizen" && !isCitizenReferredInAnyCase ? "100vw" : "70vw" }}
            >
              <div className="home-header-wrapper">
                <UpcomingHearings
                  handleNavigate={handleNavigate}
                  individualData={individualData}
                  attendeeIndividualId={individualId}
                  userInfoType={userInfoType}
                  advocateId={advocateId}
                  t={t}
                />
                {(viewDashBoards || viewADiary) && (
                  <div className="hearingCard" style={{ backgroundColor: "white", justifyContent: "flex-start" }}>
                    {viewDashBoards && (
                      <React.Fragment>
                        <Link to={`/${window.contextPath}/employee/home/dashboard`} style={linkStyle}>
                          {t("OPEN_DASHBOARD")}
                        </Link>
                        <Link to={`/${window.contextPath}/employee/home/dashboard?select=2`} style={linkStyle}>
                          {t("OPEN_REPORTS")}
                        </Link>
                      </React.Fragment>
                    )}
                    {viewADiary && (
                      <span
                        onClick={() => {
                          history.push(`/${window?.contextPath}/employee/home/home-screen`, { homeActiveTab: "CS_HOME_A_DAIRY" });
                        }}
                        style={{ ...linkStyle, cursor: "pointer" }}
                      >
                        {t("OPEN_A_DIARY")}
                      </span>
                    )}
                  </div>
                )}
                {showReviewSummonsWarrantNotice && <ReviewCard data={data} userInfoType={userInfoType} />}
              </div>
              <div className="content-wrapper">
                {(userType === "ADVOCATE" || userType === "ADVOCATE_CLERK") && (
                  <div style={{ display: "flex", alignItems: "center", gap: "20px", marginTop: "10px", marginBottom: "35px" }}>
                    <span style={{ fontSize: "18px", fontWeight: "bold" }}>Select Advocate to View/File a Case :</span>
                    <div>
                      <Dropdown
                        t={t}
                        option={seniorAdvocates?.sort((a, b) => a?.advocateName?.localeCompare(b?.advocateName))}
                        optionKey={"advocateName"}
                        select={handleDropdownChange}
                        selected={selectedSeniorAdvocate}
                        style={{ width: "300px", height: "40px", fontSize: "16px", marginBottom: "0px" }}
                      />
                    </div>
                  </div>
                )}

                <div className="header-class">
                  {selectedSeniorAdvocate?.id ? (
                    <div className="header">{`Advocate ${t(selectedSeniorAdvocate?.advocateName || "")}`}</div>
                  ) : (
                    <div className="header">{t("CS_YOUR_CASE")}</div>
                  )}

                  {individualId && userType && userInfoType === "citizen" && (
                    <div className="button-field" style={{ width: "fit-content" }}>
                      <React.Fragment>
                        {canJoinCase && <JoinCaseHome refreshInbox={refreshInbox} />}
                        <Button
                          className={"tertiary-button-selector"}
                          label={t("FILE_A_CASE")}
                          labelClassName={"tertiary-label-selector"}
                          onButtonClick={handleClickFileCase}
                        />
                      </React.Fragment>
                    </div>
                  )}
                </div>
                <div className="inbox-search-wrapper pucar-home home-view">
                  {config && additionalDetails ? (
                    <InboxSearchComposer
                      key={`InboxSearchComposer-${callRefetch}-${additionalDetails}`}
                      configs={{
                        ...config,
                        ...{
                          additionalDetails: {
                            ...config?.additionalDetails,
                            ...additionalDetails,
                          },
                        },
                      }}
                      defaultValues={defaultValues}
                      showTab={true}
                      tabData={tabData}
                      onTabChange={onTabChange}
                      additionalConfig={{
                        resultsTable: {
                          onClickRow: onRowClick,
                        },
                      }}
                    />
                  ) : (
                    <Loader />
                  )}
                </div>
              </div>
            </div>
          </React.Fragment>
        )}
        {((individualId && userType && userInfoType === "citizen" && isCitizenReferredInAnyCase) || userInfoType === "employee") && (
          <div className="right-side" style={{ width: "30vw" }}>
            <TasksComponent
              taskType={taskType}
              setTaskType={setTaskType}
              caseType={caseType}
              setCaseType={setCaseType}
              isLitigant={Boolean(individualId && userType && userInfoType === "citizen")}
              uuid={userInfo?.uuid}
              userInfoType={userInfoType}
              pendingSignOrderList={ordersNotificationData}
              seniorAdvocates={seniorAdvocates}
            />
          </div>
        )}
        {toastMsg && (
          <Toast
            error={toastMsg.key === "error"}
            label={t(toastMsg.action)}
            onClose={() => setToastMsg(null)}
            isDleteBtn={true}
            style={{ maxWidth: "500px" }}
          />
        )}
        {showSelectAdvocateModal && (
          <SelectAdvocateModal
            t={t}
            setShowSelectAdvocateModal={setShowSelectAdvocateModal}
            confirmAdvocate={handleConfirmAdvocate}
            selectedSeniorAdvocate={selectedSeniorAdvocate}
          />
        )}
      </div>
    </React.Fragment>
  );
};
export default HomeView;
