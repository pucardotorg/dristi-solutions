import { useTranslation } from "react-i18next";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useHistory } from "react-router-dom";
import { Button, InboxSearchComposer } from "@egovernments/digit-ui-react-components";
import { rolesToConfigMapping, userTypeOptions } from "../../configs/HomeConfig";
import UpcomingHearings from "../../components/UpComingHearing";
import { Loader, Toast } from "@egovernments/digit-ui-react-components";
import TasksComponent from "../../components/TaskComponent";
import { useLocation } from "react-router-dom/cjs/react-router-dom.min";
import { HomeService, Urls } from "../../hooks/services";
import LitigantHomePage from "./LitigantHomePage";
import { TabLitigantSearchConfig } from "../../configs/LitigantHomeConfig";
import ReviewCard from "../../components/ReviewCard";
import { InboxIcon, DocumentIcon } from "../../../homeIcon";
import { Link } from "react-router-dom";
import useSearchOrdersNotificationService from "@egovernments/digit-ui-module-orders/src/hooks/orders/useSearchOrdersNotificationService";
import { OrderWorkflowState } from "@egovernments/digit-ui-module-orders/src/utils/orderWorkflow";
import OrderIssueBulkSuccesModal from "@egovernments/digit-ui-module-orders/src/pageComponents/OrderIssueBulkSuccesModal";
import isEqual from "lodash/isEqual";
import { DRISTIService } from "@egovernments/digit-ui-module-dristi/src/services";
import useSearchCaseService from "@egovernments/digit-ui-module-dristi/src/hooks/dristi/useSearchCaseService";

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

  const bulkSignSuccess = history.location?.state?.bulkSignSuccess;
  const [issueBulkSuccessData, setIssueBulkSuccessData] = useState({
    show: false,
    bulkSignOrderListLength: null,
  });
  const userInfo = useMemo(() => Digit?.UserService?.getUser()?.info, [Digit.UserService]);
  const roles = useMemo(() => userInfo?.roles, [userInfo]);
  const isJudge = useMemo(() => roles?.some((role) => role?.code === "JUDGE_ROLE"), [roles]);
  const showReviewSummonsWarrantNotice = useMemo(() => roles?.some((role) => role?.code === "TASK_EDITOR"), [roles]);
  const isNyayMitra = roles.some((role) => role.code === "NYAY_MITRA_ROLE");
  const tenantId = useMemo(() => window?.Digit.ULBService.getCurrentTenantId(), []);
  const userInfoType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo]);
  const [toastMsg, setToastMsg] = useState(null);

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
        },
      },
    },
    { tenantId },
    OrderWorkflowState.PENDING_BULK_E_SIGN,
    Boolean(isJudge)
  );

  const refreshInbox = () => {
    setCallRefetch(!callRefetch);
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
    return searchResult?.[0]?.id;
  }, [searchResult]);

  const additionalDetails = useMemo(() => {
    return {
      ...(advocateId
        ? {
            searchKey: "filingNumber",
            defaultFields: true,
            advocateId: advocateId,
          }
        : individualId
        ? {
            searchKey: "filingNumber",
            defaultFields: true,
            litigantId: individualId,
          }
        : {}),
    };
  }, [advocateId, individualId]);

  useEffect(() => {
    setDefaultValues(defaultSearchValues);
  }, []);

  useEffect(() => {
    state && state.taskType && setTaskType(state.taskType);
    if (bulkSignSuccess) {
      setIssueBulkSuccessData(bulkSignSuccess);
    }
  }, [state, bulkSignSuccess]);

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
      return (
        rolesToConfigMapping?.find((item) =>
          item.roles?.reduce((res, curr) => {
            if (!res) return res;
            res = roles.some((role) => role.code === curr);
            return res;
          }, true)
        ) || (userInfoType === "citizen" ? TabLitigantSearchConfig : null)
      );
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

  const { data: citizenCaseData, isLoading: isCitizenCaseDataLoading } = useSearchCaseService(
    {
      criteria: [
        {
          ...(citizenId ? (advocateId ? { advocateId } : { litigantId: individualId }) : {}),
          courtId: window?.globalConfigs?.getConfig("COURT_ID") || "KLKM52",
          pagination: { offSet: 0, limit: 1 },
        },
      ],
      tenantId,
    },
    {},
    `dristi-${citizenId}`,
    "",
    Boolean(citizenId),
    true,
    6 * 1000
  );

  // This is to check if the citizen has been associated with a case yet.
  const isCitizenReferredInAnyCase = useMemo(() => {
    return citizenCaseData?.criteria?.[0]?.responseList?.[0];
  }, [citizenCaseData]);

  useEffect(() => {
    const isAnyLoading = isLoading || isFetching || isSearchLoading || isOutcomeLoading || isCitizenCaseDataLoading;
    if (!isAnyLoading && tabConfigs && rowClickData && rolesToConfigMappingData && userInfoType) {
      setOnRowClickData(rowClickData);
      if (tabConfigs && !isEqual(tabConfigs, tabConfig)) {
        setConfig(tabConfigs?.TabSearchConfig?.[0]);
        setTabConfig(tabConfigs);
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
  ]);

  const onTabChange = (n) => {
    setTabData((prev) => prev.map((i, c) => ({ ...i, active: c === n ? true : false })));
    setConfig(tabConfig?.TabSearchConfig?.[n]);
  };

  const handleNavigate = () => {
    const contextPath = window?.contextPath || "";
    history.push(`/${contextPath}/${userInfoType}/hearings/`);
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
        return `/${contextPath}/${userType}/dristi/home/file-case/sign-complaint?filingNumber=${filingNumber}`;
      default:
        return `${baseUrl}?${params}&tab=Overview`;
    }
  };

  const handleScrutinyAndLock = async (filingNumber) => {
    const isScrutiny = roles.some((role) => role.code === "CASE_REVIEWER");
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
      ];
      if (statusArray.includes(row?.original?.status)) {
        history.push(getRedirectUrl(row?.original?.status, row?.original?.id, row?.original?.filingNumber));
      }
    }
  };

  if (isUserLoggedIn && !individualId && userInfoType === "citizen") {
    history.push(`/${window?.contextPath}/${userInfoType}/dristi/landing-page`);
  }

  if (isNyayMitra) {
    history.push(`/${window?.contextPath}/employee`);
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

  if (isLoading || isFetching || isSearchLoading || isOrdersLoading || isOutcomeLoading || isCitizenCaseDataLoading) {
    return <Loader />;
  }
  const showToast = (type, message, duration = 5000) => {
    setToastMsg({ key: type, action: message });
    setTimeout(() => {
      setToastMsg(null);
    }, duration);
  };
  return (
    <div className="home-view-hearing-container">
      {individualId && userType && userInfoType === "citizen" && !isCitizenReferredInAnyCase ? (
        <LitigantHomePage isApprovalPending={isApprovalPending} />
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
              {isJudge && (
                <div className="hearingCard" style={{ backgroundColor: "white", justifyContent: "flex-start" }}>
                  <Link to={`/${window.contextPath}/employee/home/dashboard`} style={linkStyle}>
                    {t("OPEN_DASHBOARD")}
                  </Link>
                  <Link to={`/${window.contextPath}/employee/home/dashboard?select=2`} style={linkStyle}>
                    {t("OPEN_REPORTS")}
                  </Link>
                  <Link to={`/${window.contextPath}/employee/home/dashboard/adiary`} style={linkStyle}>
                    {t("OPEN_A_DIARY")}
                  </Link>
                </div>
              )}
              {showReviewSummonsWarrantNotice && <ReviewCard data={data} userInfoType={userInfoType} />}
            </div>
            <div className="content-wrapper">
              <div className="header-class">
                <div className="header">{t("CS_YOUR_CASE")}</div>
                {individualId && userType && userInfoType === "citizen" && (
                  <div className="button-field" style={{ width: "50%" }}>
                    <React.Fragment>
                      <JoinCaseHome refreshInbox={refreshInbox} />
                      <Button
                        className={"tertiary-button-selector"}
                        label={t("FILE_A_CASE")}
                        labelClassName={"tertiary-label-selector"}
                        onButtonClick={() => {
                          history.push(`/${window?.contextPath}/citizen/dristi/home/file-case`);
                        }}
                      />
                    </React.Fragment>
                  </div>
                )}
              </div>
              <div className="inbox-search-wrapper pucar-home home-view">
                {config ? (
                  <InboxSearchComposer
                    key={`InboxSearchComposer-${callRefetch}`}
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
          />
        </div>
      )}
      {issueBulkSuccessData.show && (
        <OrderIssueBulkSuccesModal
          t={t}
          history={history}
          bulkSignOrderListLength={issueBulkSuccessData.bulkSignOrderListLength}
          setIssueBulkSuccessData={setIssueBulkSuccessData}
        />
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
    </div>
  );
};
export default HomeView;
