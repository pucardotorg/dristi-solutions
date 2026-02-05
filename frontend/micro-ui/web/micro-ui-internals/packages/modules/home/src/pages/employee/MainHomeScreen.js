import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import HomeSidebar from "../../components/HomeSidebar";
import HomeHearingsTab from "./HomeHearingsTab";
import { pendingTaskConfig } from "../../configs/PendingTaskConfig";
import { HomeService, Urls } from "../../hooks/services";
import { useHistory } from "react-router-dom";
import { Loader, Toast, InboxSearchComposer } from "@egovernments/digit-ui-react-components";
import { useLocation } from "react-router-dom/cjs/react-router-dom.min";
import BulkBailBondSignView from "./BulkBailBondSignView";
import BailBondModal from "./BailBondModal";
import BulkWitnessDepositionView from "./BulkWitnessDepositionView";
import BulkMarkAsEvidenceView from "./BulkMarkAsEvidenceView";
import NewBulkRescheduleTab from "./NewBulkRescheduleTab";
import BulkESignView from "./BulkESignView";
import BulkSignADiaryView from "./BulkSignADiaryView";
import RegisterUsersHomeTab from "./RegisterUsersHomeTab";
import OfflinePaymentsHomeTab from "./OfflinePaymentsHomeTab";
import { scrutinyPendingTaskConfig } from "../../configs/ScrutinyPendingTaskConfig";
import ReviewSummonsNoticeAndWarrant from "@egovernments/digit-ui-module-orders/src/pages/employee/ReviewSummonsNoticeAndWarrant";
import HomeScheduleHearing from "./HomeScheduleHearing";
import DocumentModal from "@egovernments/digit-ui-module-orders/src/components/DocumentModal";
import { DRISTIService } from "@egovernments/digit-ui-module-dristi/src/services";
import { createOrUpdateTask, filterValidAddresses, getSuffixByBusinessCode } from "../../utils";
import useCaseDetailSearchService from "@egovernments/digit-ui-module-dristi/src/hooks/dristi/useCaseDetailSearchService";
import { getFormattedName } from "@egovernments/digit-ui-module-orders/src/utils";
import BulkSignDigitalizationView from "./BulkSignDigitalizationView";
import TemplateOrConfigurationPage from "./TemplateOrConfigurationPage";

const sectionsParentStyle = {
  height: "50%",
  display: "flex",
  flexDirection: "column",
  gridTemplateColumns: "20% 1fr",
  gap: "1rem",
};

const formDataKeyMap = {
  NOTICE: "noticeOrder",
  SUMMONS: "SummonsOrder",
};

const displayPartyType = {
  complainant: "COMPLAINANT_ATTENDEE",
  respondent: "RESPONDENT_ATTENDEE",
  witness: "WITNESS_ATTENDEE",
  advocate: "ADVOCATE_ATTENDEE",
};

const MainHomeScreen = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation();
  const homeFilteredData = location?.state?.homeFilteredData;
  const initialActiveTab = sessionStorage.getItem("homeActiveTab") || location?.state?.homeActiveTab || "TOTAL_HEARINGS_TAB";
  const [homeActiveTab] = useState(initialActiveTab);
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const [activeTab, setActiveTab] = useState(homeActiveTab);
  const [updateCounter, setUpdateCounter] = useState(0);
  const [hearingCount, setHearingCount] = useState(0);
  const [config, setConfig] = useState(structuredClone(pendingTaskConfig));
  const [scrutinyConfig, setScrutinyConfig] = useState(structuredClone(scrutinyPendingTaskConfig[0]));
  const [tabData, setTabData] = useState(null);
  const [scrutinyDueCount, setScrutinyDueCount] = useState(0);

  const [activeTabTitle, setActiveTabTitle] = useState(homeActiveTab);
  const [pendingTaskCount, setPendingTaskCount] = useState({
    REGISTER_USERS: 0,
    OFFLINE_PAYMENTS: 0,
    SCRUTINISE_CASES: 0,
    REGISTRATION: 0,
    RESCHEDULE_REQUEST: 0,
    REVIEW_PROCESS: 0,
    // VIEW_APPLICATION: 0,
    // SCHEDULE_HEARING: 0,
    BAIL_BOND_STATUS: 0,
    NOTICE_SUMMONS_MANAGEMENT: 0,
    RESCHEDULE_APPLICATIONS: 0,
    DELAY_CONDONATION: 0,
    OTHERS: 0,
  });
  const [stepper, setStepper] = useState(0);
  const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
  const [loader, setLoader] = useState(false);
  const [showEndHearingModal, setShowEndHearingModal] = useState({ isNextHearingDrafted: false, openEndHearingModal: false, currentHearing: {} });
  const [toastMsg, setToastMsg] = useState(null);
  const [showBailBondModal, setShowBailBondModal] = useState(false);
  const [selectedBailBond, setSelectedBailBond] = useState(null);
  const roles = useMemo(() => userInfo?.roles, [userInfo]);
  const assignedRoles = useMemo(() => roles?.map((role) => role?.code), [roles]);
  const isEpostUser = useMemo(() => roles?.some((role) => role?.code === "POST_MANAGER"), [roles]);
  const [courierServicePendingTask, setCourierServicePendingTask] = useState(null);
  const [courierOrderDetails, setCourierOrderDetails] = useState({});
  const [active, setActive] = useState(false);
  const [orderLoader, setOrderLoader] = useState(false);
  const CourierService = useMemo(() => Digit.ComponentRegistryService.getComponent("CourierService"), []);
  const [isProcessLoader, setIsProcessLoader] = useState(false);
  const courtId = localStorage.getItem("courtId");

  const hasViewRegisterUserAccess = useMemo(() => assignedRoles?.includes("ADVOCATE_APPROVER"), [assignedRoles]);
  const hasViewCollectOfflinePaymentsAccess = useMemo(() => assignedRoles?.includes("PAYMENT_COLLECTOR"), [assignedRoles]);
  const hasViewScrutinyCasesAccess = useMemo(() => assignedRoles?.includes("VIEW_SCRUTINY_CASES"), [assignedRoles]);
  const hasViewRegisterCasesAccess = useMemo(() => assignedRoles?.includes("VIEW_REGISTER_CASES"), [assignedRoles]);
  const hasViewReissueProcessAccess = useMemo(() => assignedRoles?.includes("VIEW_REISSUE_PROCESS"), [assignedRoles]);
  const hasViewReviewBailBondAccess = useMemo(() => assignedRoles?.includes("VIEW_REVIEW_BAIL_BOND"), [assignedRoles]);
  const hasViewDelayCondonationAccess = useMemo(() => assignedRoles?.includes("VIEW_DELAY_CONDONATION_APPLICATION"), [assignedRoles]);
  const hasViewReschedulApplicationAccess = useMemo(() => assignedRoles?.includes("VIEW_RESCHEDULE_APPLICATION"), [assignedRoles]);
  const hasViewOthers = useMemo(() => assignedRoles?.includes("VIEW_OTHERS_APPLICATION"), [assignedRoles]);
  const hasCaseReviewerAccess = useMemo(() => assignedRoles?.includes("CASE_REVIEWER"), [assignedRoles]);
  const hasViewProcessManagementAccess = useMemo(() => assignedRoles?.includes("VIEW_PROCESS_MANAGEMENT"), [assignedRoles]);
  const hasViewReschedulingRequestAccess = useMemo(() => assignedRoles?.includes("VIEW_RESCHEDULING_REQUESTS"), [assignedRoles]);

  const today = new Date();

  const todayStr = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split("T")[0];

  const [filters, setFilters] = useState(
    homeFilteredData || {
      date: todayStr,
      status: "",
      purpose: "",
      caseQuery: "",
    }
  );
  const userType = useMemo(() => {
    if (!userInfo) return "employee";
    return userInfo?.type === "CITIZEN" ? "citizen" : "employee";
  }, [userInfo]);

  useEffect(() => {
    if (isEpostUser || userType === "citizen") {
      history.push(`/${window?.contextPath}/${userType}/home/home-pending-task`);
    } else if (location?.state?.registerUsersTab) {
      setActiveTab("REGISTER_USERS");
    } else if (location?.state?.offlinePaymentsTab) {
      setActiveTab("OFFLINE_PAYMENTS");
    } else if (location?.state?.homeActiveTab === "CS_HOME_ORDERS") {
      setActiveTab("CS_HOME_ORDERS");
    }
    // sessionStorage.removeItem("homeActiveTab");
  }, [userType, history, isEpostUser, location]);

  useEffect(() => {
    setUpdateCounter((prev) => prev + 1);
  }, [config]);

  const { data: applicationTypeData } = Digit.Hooks.useCustomMDMS(Digit.ULBService.getStateId(), "Application", [{ name: "ApplicationType" }], {
    select: (data) => {
      return data?.["Application"]?.ApplicationType || [];
    },
  });

  const applicationTypeOptions = useMemo(() => {
    if (!applicationTypeData) return [];

    return applicationTypeData
      .filter((item) => !["RE_SCHEDULE", "DELAY_CONDONATION"].includes(item.type))
      .map((item) => {
        const i18nKey = `APPLICATION_TYPE_${item.type}`;
        return {
          ...item,
          name: i18nKey,
          label: t(i18nKey),
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [applicationTypeData, t]);

  // useEffect(() => {
  //   if (activeTab !== homeActiveTab) {
  //     history.replace(location.pathname, {
  //       ...location.state,
  //       homeActiveTab: activeTab,
  //     });
  //   }
  // }, [activeTab, history, location.pathname, location.state, homeActiveTab]);

  const modifiedConfig = useMemo(() => {
    return { ...config };
  }, [config]);

  const getTodayRange = () => {
    const currentDate = new Date();
    const fromDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0, 0).getTime();
    const toDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59, 999).getTime();
    return { fromDate, toDate };
  };
  const showToast = (type, message, duration = 5000) => {
    setToastMsg({ key: type, action: message });
    setTimeout(() => {
      setToastMsg(null);
    }, duration);
  };
  const fetchHearingCount = async (filters, activeTab) => {
    if (filters && activeTab === "TOTAL_HEARINGS_TAB" && filters.date) {
      try {
        let fromDate, toDate;
        if (filters.date) {
          const dateObj = new Date(filters.date);
          fromDate = new Date(dateObj.setHours(0, 0, 0, 0)).getTime();
          toDate = new Date(dateObj.setHours(23, 59, 59, 999)).getTime();
        } else {
        }
        const payload = {
          inbox: {
            processSearchCriteria: {
              businessService: ["hearing-default"],
              moduleName: "Hearing Service",
              tenantId: Digit.ULBService.getCurrentTenantId(),
            },
            moduleSearchCriteria: {
              tenantId: tenantId,
              courtId: localStorage.getItem("courtId"),
              ...(fromDate && toDate ? { fromDate, toDate } : {}),
            },
            tenantId: tenantId,
            limit: 300,
            offset: 0,
          },
        };
        if (filters?.status?.code) payload.inbox.moduleSearchCriteria.status = filters?.status?.code;
        if (filters?.purpose) payload.inbox.moduleSearchCriteria.hearingType = filters.purpose?.code;
        if (filters?.caseQuery) payload.inbox.moduleSearchCriteria.searchableFields = filters.caseQuery;

        const res = await HomeService.InboxSearch(payload, { tenantId: Digit.ULBService.getCurrentTenantId() });
        setHearingCount(res?.totalCount || 0);
      } catch (err) {
        showToast("error", t("ISSUE_IN_FETCHING"), 5000);
        console.error(err);
      }
    } else {
      const { fromDate, toDate } = getTodayRange();
      try {
        const payload = {
          inbox: {
            processSearchCriteria: {
              businessService: ["hearing-default"],
              moduleName: "Hearing Service",
              tenantId: tenantId,
            },
            moduleSearchCriteria: {
              tenantId: tenantId,
              courtId: localStorage.getItem("courtId"),
              ...(fromDate && toDate ? { fromDate, toDate } : {}),
            },
            tenantId: tenantId,
            limit: 300,
            offset: 0,
          },
        };
        const res = await HomeService.InboxSearch(payload, { tenantId: tenantId });
        setHearingCount(res?.totalCount || 0);
        // if (!filters) {
        setFilters({
          date: todayStr,
          status: "",
          purpose: "",
          caseQuery: "",
        });
        // }
      } catch (err) {
        showToast("error", t("ISSUE_IN_FETCHING"), 5000);
        console.error(err);
      }
    }
  };

  const fetchPendingTaskCounts = async () => {
    const { toDate } = getTodayRange();
    try {
      setLoader(true);
      const payload = {
        SearchCriteria: {
          moduleName: "Pending Tasks Service",
          tenantId: tenantId,
          moduleSearchCriteria: {
            screenType: ["home", "applicationCompositeOrder"],
            isCompleted: false,
            courtId: localStorage.getItem("courtId"),
            assignedRole: assignedRoles,
          },
          limit: 10,
          offset: 0,
          searchReviewProcess: {
            date: toDate,
            isOnlyCountRequired: true,
            actionCategory: "Review Process",
          },
          searchViewApplication: {
            date: toDate,
            isOnlyCountRequired: true,
            actionCategory: "View Application",
          },
          searchScheduleHearing: {
            date: toDate,
            isOnlyCountRequired: true,
            actionCategory: "Schedule Hearing",
          },
          searchRegisterCases: {
            date: null,
            isOnlyCountRequired: true,
            actionCategory: "Register cases",
          },
          searchReschedulingRequestApplications: {
            date: null,
            isOnlyCountRequired: true,
            actionCategory: "Rescheduling Request",
          },
          searchNoticeAndSummons: {
            date: null,
            isOnlyCountRequired: true,
            actionCategory: "Notice and Summons Management",
          },
          searchBailBonds: {
            date: toDate,
            isOnlyCountRequired: true,
            actionCategory: "Bail Bond",
          },
          searchScrutinyCases: {
            date: null,
            isOnlyCountRequired: true,
            actionCategory: "Scrutinise cases",
            status: ["UNDER_SCRUTINY"],
          },
          searchRescheduleHearingsApplication: {
            date: null,
            isOnlyCountRequired: true,
            actionCategory: "Reschedule Applications",
          },
          searchDelayCondonationApplication: {
            date: null,
            isOnlyCountRequired: true,
            actionCategory: "Delay Condonation",
          },
          searchOtherApplications: {
            date: null,
            isOnlyCountRequired: true,
            actionCategory: "Others",
          },
          searchRegisterUsers: {
            date: null,
            isOnlyCountRequired: true,
          },
          searchOfflinePayments: {
            date: null,
            isOnlyCountRequired: true,
          },
        },
      };
      let res = await HomeService.pendingTaskSearch(payload, { tenantId: tenantId });
      const reviwCount = res?.reviewProcessData?.totalCount || 0;
      const registerCount = res?.registerCasesData?.totalCount || 0;
      const bailBondStatusCount = res?.bailBondData?.totalCount || 0;
      const scrutinyCasesCount = res?.scrutinyCasesData?.count || 0;
      const rescheduleHearingsApplicationCount = res?.rescheduleHearingsData?.totalCount || 0;
      const delayCondonationApplicationCount = res?.delayCondonationApplicationData?.totalCount || 0;
      const otherApplicationsCount = res?.otherApplicationsData?.totalCount || 0;
      const registerUsersCount = res?.registerUsersData?.count || 0;
      const offlinePaymentsCount = res?.offlinePaymentsData?.count || 0;
      const noticeAndSummonsCount = res?.noticeAndSummonsData?.count || 0;
      const rescheduleHearingRequestCount = res?.reschedulingRequestData?.totalCount || 0;

      setPendingTaskCount({
        REGISTER_USERS: registerUsersCount,
        OFFLINE_PAYMENTS: offlinePaymentsCount,
        SCRUTINISE_CASES: scrutinyCasesCount,
        REGISTRATION: registerCount,
        RESCHEDULE_REQUEST: rescheduleHearingRequestCount,
        REVIEW_PROCESS: reviwCount,
        BAIL_BOND_STATUS: bailBondStatusCount,
        NOTICE_SUMMONS_MANAGEMENT: noticeAndSummonsCount,
        RESCHEDULE_APPLICATIONS: rescheduleHearingsApplicationCount,
        DELAY_CONDONATION: delayCondonationApplicationCount,
        OTHERS: otherApplicationsCount,
      });
    } catch (err) {
      showToast("error", t("ISSUE_IN_FETCHING"), 5000);
      console.error(err);
    } finally {
      setLoader(false);
    }
  };

  const {
    data: taskManagementData,
    isLoading: isTaskManagementLoading,
    refetch: refetchTaskManagement,
  } = Digit.Hooks.dristi.useSearchTaskMangementService(
    {
      criteria: {
        filingNumber: courierServicePendingTask?.filingNumber,
        orderNumber: courierServicePendingTask?.referenceId?.split("_").pop(),
        ...(courierServicePendingTask?.partyType && {
          partyType: courierServicePendingTask?.partyType,
        }),
        ...(courierServicePendingTask?.orderItemId && {
          orderItemId: courierServicePendingTask?.orderItemId,
        }),
        tenantId: tenantId,
      },
    },
    {},
    `taskManagement-${courierServicePendingTask?.filingNumber}`,
    Boolean(courierServicePendingTask?.filingNumber)
  );

  const taskManagementList = useMemo(() => {
    return taskManagementData?.taskManagementRecords;
  }, [taskManagementData]);

  const { data: caseData, isLoading: isCaseLoading } = useCaseDetailSearchService(
    {
      criteria: {
        filingNumber: courierServicePendingTask?.filingNumber,
        tenantId: tenantId,
        caseId: courierServicePendingTask?.caseId || "",
      },
    },
    {},
    `case-${courierServicePendingTask?.filingNumber}`,
    courierServicePendingTask?.filingNumber,
    Boolean(courierServicePendingTask?.filingNumber)
  );

  const caseDetails = useMemo(() => caseData?.cases || {}, [caseData]);

  const getOrderDetail = useCallback(
    async (orderNumber) => {
      setOrderLoader(true);
      // Add courtId to criteria if it exists
      const orderData = await HomeService.customApiService(Urls.orderSearch, {
        criteria: {
          filingNumber: courierServicePendingTask?.filingNumber,
          tenantId,
          orderNumber,
          ...(courtId && { courtId }),
        },
        tenantId,
      });
      setOrderLoader(false);
      return orderData?.list?.[0] || {};
    },
    [courtId, courierServicePendingTask?.filingNumber, tenantId]
  );

  const { data: paymentTypeData, isLoading: isPaymentTypeLoading } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    "payment",
    [{ name: "paymentType" }],
    {
      select: (data) => {
        return data?.payment?.paymentType || [];
      },
    }
  );

  const suffix = useMemo(() => getSuffixByBusinessCode(paymentTypeData, "task-management-payment"), [paymentTypeData]);

  // Fetch order details when courier service pending task is set
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (
        Object?.keys(courierOrderDetails)?.length === 0 &&
        courierServicePendingTask &&
        Object?.keys(courierServicePendingTask)?.length > 0 &&
        caseDetails &&
        Object?.keys(caseDetails)?.length > 0 &&
        Array?.isArray(taskManagementList)
      ) {
        try {
          const orderNumber = courierServicePendingTask?.referenceId?.split("_").pop();
          const uniqueIdsList = courierServicePendingTask?.partyUniqueIds;

          if (!orderNumber) return;

          const order = await getOrderDetail(orderNumber);
          if (!order) return;

          let orderDetails = order;

          if (order?.orderCategory === "COMPOSITE") {
            const orderItem = order?.compositeItems?.find((item) => item?.id === courierServicePendingTask?.orderItemId);
            orderDetails = {
              ...order,
              additionalDetails: orderItem?.orderSchema?.additionalDetails,
              orderType: orderItem?.orderType,
              orderDetails: orderItem?.orderSchema?.orderDetails,
              orderItemId: orderItem?.id,
            };
          }

          const formDataKey = formDataKeyMap[orderDetails?.orderType];
          const orderType = orderDetails?.orderType;

          let parties = orderDetails?.additionalDetails?.formdata?.[formDataKey]?.party || [];
          if (Array?.isArray(uniqueIdsList) && uniqueIdsList?.length > 0) {
            parties = parties?.filter((party) => {
              return uniqueIdsList?.some((uid) => {
                const uniqueIdValues = Object?.entries(uid)
                  ?.filter(([key]) => key?.startsWith("uniqueId"))
                  ?.map(([_, value]) => value);
                return uid?.partyType === party?.data?.partyType && uniqueIdValues?.includes(party?.data?.uniqueId || party?.uniqueId);
              });
            });
          }
          const updatedParties =
            parties?.map((party) => {
              const taskManagement = taskManagementList?.find((task) => task?.taskType === orderType);

              const partyDetails = taskManagement?.partyDetails?.find((lit) => {
                if (party?.data?.partyType === "Respondent") {
                  return party?.uniqueId === lit?.respondentDetails?.uniqueId;
                } else {
                  return party?.data?.uniqueId === lit?.witnessDetails?.uniqueId;
                }
              });

              let caseAddressDetails = [];

              if (party?.data?.partyType === "Witness") {
                const witness = caseDetails?.witnessDetails?.find((w) => w?.uniqueId === party?.data?.uniqueId);
                caseAddressDetails = witness?.addressDetails || [];
              } else if (party?.data?.partyType === "Respondent") {
                const respondent = caseDetails?.additionalDetails?.respondentDetails?.formdata?.find(
                  (r) => r?.uniqueId === (party?.data?.uniqueId || party?.uniqueId)
                );
                caseAddressDetails = respondent?.data?.addressDetails || [];
              }

              const existingAddresses = party?.data?.addressDetails || [];
              const mergedFromCase = [
                ...existingAddresses,
                ...caseAddressDetails?.filter((newAddr) => !existingAddresses?.some((old) => old?.id === newAddr?.id)),
              ];

              if (!taskManagement || !partyDetails) {
                return {
                  ...party,
                  data: {
                    ...party.data,
                    addressDetails: filterValidAddresses(mergedFromCase)?.map((addr) => ({
                      ...addr,
                      checked: true,
                    })),
                  },
                };
              }

              const addressDetailsFromItem = partyDetails?.witnessDetails?.addressDetails || partyDetails?.respondentDetails?.addressDetails || [];
              const addressDetailsFromParty = partyDetails?.addresses || [];

              const mergedAddressDetails = (() => {
                const result = [];

                addressDetailsFromItem?.forEach((addr) => {
                  const match = addressDetailsFromParty?.find((p) => p?.id === addr?.id);
                  result?.push({
                    ...addr,
                    checked: !!match,
                  });
                });

                addressDetailsFromParty?.forEach((partyAddr) => {
                  const existsInItem = addressDetailsFromItem?.some((addr) => addr?.id === partyAddr?.id);
                  if (!existsInItem) {
                    result?.push({
                      ...partyAddr,
                      checked: true,
                    });
                  }
                });

                caseAddressDetails?.forEach((caseAddr) => {
                  const exists = result?.some((r) => r?.id === caseAddr?.id);
                  if (!exists) {
                    result.push({
                      ...caseAddr,
                      checked: false,
                    });
                  }
                });

                return result;
              })();

              let noticeCourierService = [];
              let summonsCourierService = [];

              if (orderType === "SUMMONS") {
                summonsCourierService = partyDetails?.deliveryChannels;
              } else {
                noticeCourierService = partyDetails?.deliveryChannels;
              }

              return {
                ...party,
                data: {
                  ...party.data,
                  addressDetails: filterValidAddresses(mergedAddressDetails),
                },
                summonsCourierService,
                noticeCourierService,
              };
            }) || [];
          orderDetails.additionalDetails.formdata[formDataKey].party = updatedParties;
          setCourierOrderDetails(orderDetails);
        } catch (error) {
          console.error("Error fetching order details:", error);
        }
      }
    };

    fetchOrderDetails();
  }, [courierOrderDetails, courierServicePendingTask, getOrderDetail, taskManagementList, tenantId, caseDetails]);

  const handleProcessCourierOnSubmit = useCallback(
    async (courierData, isLast) => {
      const orderType = courierOrderDetails?.orderType;
      const formDataKey = formDataKeyMap[orderType];
      const formData = courierOrderDetails?.additionalDetails?.formdata?.[formDataKey]?.party;

      const existingTask = taskManagementList?.find((item) => item?.taskType === orderType);
      setIsProcessLoader(true);
      try {
        await createOrUpdateTask({
          type: orderType,
          existingTask: existingTask,
          courierData: courierData,
          formData: formData,
          filingNumber: courierOrderDetails?.filingNumber,
          tenantId,
          isLast,
        });
        await refetchTaskManagement();
        if (isLast) {
          setCourierServicePendingTask(null);
          setCourierOrderDetails({});
          setTimeout(() => {
            history.replace(`/${window?.contextPath}/employee/home/home-screen`, { homeActiveTab: "NOTICE_SUMMONS_MANAGEMENT" });
          }, 2000);
        }
        return { continue: true };
      } catch (error) {
        console.error("Error creating or updating task:", error);
        showToast("error", t("SOMETHING_WENT_WRONG"), 5000);
        return { continue: false };
      } finally {
        setIsProcessLoader(false);
      }
    },
    [courierOrderDetails, taskManagementList, tenantId, refetchTaskManagement, history, t]
  );

  const handleCourierServiceChange = useCallback((value, type, index) => {
    setCourierOrderDetails((prevOrderDetails) => {
      const updatedOrderDetails = { ...prevOrderDetails };
      const formDataKey = formDataKeyMap[updatedOrderDetails?.orderType];

      if (updatedOrderDetails?.additionalDetails?.formdata?.[formDataKey]?.party?.[index]) {
        const updatedParties = [...updatedOrderDetails.additionalDetails.formdata[formDataKey].party];
        const updatedParty = { ...updatedParties[index] };
        updatedParty[type === "notice" ? "noticeCourierService" : "summonsCourierService"] = value;
        updatedParties[index] = updatedParty;
        updatedOrderDetails.additionalDetails.formdata[formDataKey].party = updatedParties;
      }

      return updatedOrderDetails;
    });
  }, []);

  const handleAddressSelection = useCallback((addressId, isSelected, index) => {
    setCourierOrderDetails((prevOrderDetails) => {
      const updatedOrderDetails = { ...prevOrderDetails };
      const formDataKey = formDataKeyMap[updatedOrderDetails?.orderType];

      if (updatedOrderDetails?.additionalDetails?.formdata?.[formDataKey]?.party?.[index]) {
        const updatedParties = [...updatedOrderDetails?.additionalDetails?.formdata[formDataKey]?.party];

        const updatedParty = { ...updatedParties[index] };

        const currentAddressDetails = updatedParty?.data?.addressDetails || [];

        const updatedAddressDetails = currentAddressDetails?.map((addr) => {
          if (addr?.id === addressId) {
            return { ...addr, checked: isSelected };
          }
          return addr;
        });

        updatedParty.data.addressDetails = updatedAddressDetails;

        if (updatedAddressDetails?.every((addr) => !addr?.checked)) {
          updatedParty.noticeCourierService = [];
          updatedParty.summonsCourierService = [];
        }

        updatedParties[index] = updatedParty;

        updatedOrderDetails.additionalDetails.formdata[formDataKey].party = updatedParties;
      }

      return updatedOrderDetails;
    });
  }, []);

  const handleAddAddress = async (newAddress, accusedData) => {
    const addressPayload = {
      tenantId,
      caseId: courierServicePendingTask?.caseId,
      filingNumber: courierOrderDetails?.filingNumber,
      partyAddresses: [
        { addresses: [newAddress], partyType: accusedData?.partyType === "Respondent" ? "Accused" : "Witness", uniqueId: accusedData?.uniqueId },
      ],
    };
    const response = await DRISTIService.addAddress(addressPayload, {});

    const partyResponse = response?.partyAddressList?.[0];
    if (!partyResponse) return;

    const { uniqueId, addresses = [] } = partyResponse;
    const newAddr = addresses[0];
    if (!newAddr) return;

    const enrichedAddress = {
      id: newAddr?.id,
      addressDetails: newAddr,
      checked: true,
    };

    setCourierOrderDetails((prevOrderDetails) => {
      const updatedOrderDetails = { ...prevOrderDetails };
      const formDataKey = formDataKeyMap[updatedOrderDetails?.orderType];

      const parties = updatedOrderDetails?.additionalDetails?.formdata?.[formDataKey]?.party || [];
      const partyIndex = parties?.findIndex((p) => (p?.data?.uniqueId || p?.uniqueId) === uniqueId);

      if (partyIndex > -1) {
        const updatedParties = [...parties];
        const updatedParty = { ...updatedParties[partyIndex] };

        const currentAddresses = updatedParty?.data?.addressDetails || [];
        updatedParty.data.addressDetails = [...currentAddresses, enrichedAddress];
        updatedParties[partyIndex] = updatedParty;

        updatedOrderDetails.additionalDetails.formdata[formDataKey].party = updatedParties;
      }

      return updatedOrderDetails;
    });
  };

  const courierServiceSteps = useMemo(() => {
    const parties = courierOrderDetails?.additionalDetails?.formdata?.[formDataKeyMap[courierOrderDetails?.orderType]]?.party || [];
    const courierServiceSteps =
      parties?.map((item, i) => {
        const isLast = i === parties.length - 1;

        const courierData = {
          index: i,
          firstName: item?.data?.firstName || "",
          middleName: item?.data?.middleName || "",
          lastName: item?.data?.lastName || "",
          witnessDesignation: item?.data?.witnessDesignation || "",
          noticeCourierService: item?.noticeCourierService || [],
          summonsCourierService: item?.summonsCourierService || [],
          addressDetails: item?.data?.addressDetails || [],
          uniqueId: item?.uniqueId || item?.data?.uniqueId || "",
          partyType: item?.data?.partyType,
          orderItemId: courierOrderDetails?.orderItemId,
          orderNumber: courierOrderDetails?.orderNumber,
          courtId: courierOrderDetails?.courtId,
          witnessPartyType: courierServicePendingTask?.partyType,
        };

        const partyTypeLabel = courierData?.partyType ? `(${t(displayPartyType[courierData?.partyType.toLowerCase()])})` : "";
        const fullName = getFormattedName(
          courierData?.firstName,
          courierData?.middleName,
          courierData?.lastName,
          courierData?.witnessDesignation,
          partyTypeLabel
        );
        const orderType = courierOrderDetails?.orderType;

        return {
          type: "modal",
          className: "process-courier-service",
          async: true,
          hideCancel: i === 0,
          actionSaveLabel: isLast ? t("CS_COURIER_CONFIRM") : t("CS_COURIER_NEXT"),
          actionCancelLabel: t("CS_COURIER_GO_BACK"),
          heading: { label: `${t("CS_TAKE_STEPS")} - ${t(courierOrderDetails?.orderType)} for ${fullName}` },
          modalBody: (
            <CourierService
              t={t}
              isLoading={isTaskManagementLoading || isProcessLoader || isCaseLoading}
              processCourierData={courierData}
              handleCourierServiceChange={(value, type) => handleCourierServiceChange(value, type, i)}
              handleAddressSelection={(addressId, isSelected) => handleAddressSelection(addressId, isSelected, i)}
              summonsActive={active}
              setSummonsActive={setActive}
              noticeActive={active}
              setNoticeActive={setActive}
              orderType={orderType}
              handleAddAddress={handleAddAddress}
            />
          ),
          actionSaveOnSubmit: async () => {
            return await handleProcessCourierOnSubmit(courierData, isLast);
          },
          isDisabled:
            isTaskManagementLoading ||
            isCaseLoading ||
            isProcessLoader ||
            (orderType === "SUMMONS" ? courierData?.summonsCourierService?.length === 0 : courierData?.noticeCourierService?.length === 0),
        };
      }) || [];
    return courierServiceSteps;
  }, [
    courierOrderDetails,
    handleAddressSelection,
    handleCourierServiceChange,
    handleAddAddress,
    t,
    active,
    isProcessLoader,
    isTaskManagementLoading,
    isCaseLoading,
    tenantId,
    suffix,
    taskManagementList,
  ]);

  // Courier service modal configuration
  const courierServiceConfig = useMemo(() => {
    return {
      handleClose: () => {
        setCourierServicePendingTask(null);
        setCourierOrderDetails({});
      },
      isStepperModal: true,
      steps: [...courierServiceSteps],
    };
  }, [courierServiceSteps]);

  useEffect(() => {
    if (userType === "employee") {
      fetchPendingTaskCounts();
      fetchHearingCount(filters, activeTab);
    }
  }, [userType]);

  const options = {};
  if (hasViewRegisterUserAccess) {
    options.REGISTER_USERS = { name: "HOME_REGISTER_USERS" };
  }
  if (hasViewScrutinyCasesAccess) {
    options.SCRUTINISE_CASES = { name: "HOME_SCRUTINISE_CASES" };
  }
  if (hasViewRegisterCasesAccess) {
    options.REGISTRATION = { name: "HOME_REGISTER_CASES" };
  }
  if (hasViewReissueProcessAccess) {
    options.REVIEW_PROCESS = { name: "HOME_REISSUE_PROCESS" };
  }
  if (hasViewReviewBailBondAccess) {
    options.BAIL_BOND_STATUS = { name: "HOME_BAIL_BONDS_STATUS" };
  }
  if (hasViewProcessManagementAccess) {
    options.NOTICE_SUMMONS_MANAGEMENT = { name: "HOME_NOTICE_SUMMONS_MANAGEMENT" };
  }
  if (hasViewCollectOfflinePaymentsAccess) {
    options.OFFLINE_PAYMENTS = { name: "HOME_OFFLINE_PAYMENTS" };
  }

  // VIEW_APPLICATION: {
  //   name: "View Applications",
  // },
  // SCHEDULE_HEARING: {
  //   name: "Schedule Hearing",
  // },

  const applicationOptions = {};
  if (hasViewReschedulingRequestAccess) {
    applicationOptions.RESCHEDULE_REQUEST = { name: "HOME_RESCHEDULE_REQUEST" };
  }
  if (hasViewReschedulApplicationAccess) {
    applicationOptions.RESCHEDULE_APPLICATIONS = { name: "HOME_RESCHEDULE_APPLICATIONS" };
  }
  if (hasViewDelayCondonationAccess) {
    applicationOptions.DELAY_CONDONATION = { name: "HOME_DELAY_CONDONATION_APPLICATIONS" };
  }
  if (hasViewOthers) {
    applicationOptions.OTHERS = { name: "HOME_OTHER_APPLICATIONS" };
  }

  useEffect(() => {
    let updatedConfig = structuredClone(pendingTaskConfig);
    const openBailBondModal = (row) => {
      setShowBailBondModal(true);
      setSelectedBailBond(row);
    };

    if (["REGISTRATION", "NOTICE_SUMMONS_MANAGEMENT", "RESCHEDULE_REQUEST"]?.includes(activeTab)) {
      updatedConfig.sections.search.uiConfig.fields = [
        {
          label: "CS_CASE_NAME_ADVOCATE",
          type: "text",
          key: "caseSearchText",
          isMandatory: false,
          disable: false,
          populators: {
            name: "caseSearchText",
            error: "BR_PATTERN_ERR_MSG",
            validation: {
              pattern: {},
              minlength: 2,
            },
          },
        },
      ];
    }

    if (["REGISTRATION"].includes(activeTab)) {
      updatedConfig.sections.searchResult.uiConfig.columns.push({
        label: "CS_DAYS_REGISTRATION",
        jsonPath: "createdTime",
        additionalCustomization: true,
      });
    }

    if (["RESCHEDULE_APPLICATIONS", "DELAY_CONDONATION", "OTHERS"].includes(activeTab)) {
      updatedConfig.sections.search.uiConfig.fields = [
        {
          label: "STAGE",
          isMandatory: false,
          key: "stage",
          type: "dropdown",
          populators: {
            name: "stage",
            optionsKey: "code",
            mdmsConfig: {
              masterName: "SubStage",
              moduleName: "case",
              select: "(data) => {return data['case'].SubStage?.map((item) => {return item}).sort((a, b) => a.code.localeCompare(b.code));}",
            },
          },
        },
        {
          label: "CS_CASE_NAME_NUMBER_ADVOCATE",
          type: "text",
          key: "caseSearchText",
          isMandatory: false,
          disable: false,
          populators: {
            name: "caseSearchText",
            error: "BR_PATTERN_ERR_MSG",
            validation: {
              pattern: {},
              minlength: 2,
            },
          },
        },
      ];
    }

    if (activeTab === "OTHERS") {
      updatedConfig.sections.search.uiConfig.fields.push({
        label: "APPLICATION_TYPE",
        isMandatory: false,
        key: "referenceEntityType",
        type: "dropdown",
        populators: {
          name: "referenceEntityType",
          optionsKey: "name",
          options: applicationTypeOptions || [],
        },
      });
    }

    updatedConfig = {
      ...updatedConfig,
      sections: {
        ...updatedConfig.sections,
        searchResult: {
          ...updatedConfig.sections.searchResult,
          uiConfig: {
            ...updatedConfig.sections.searchResult.uiConfig,
            columns: updatedConfig?.sections?.searchResult?.uiConfig?.columns
              ?.map((column) => {
                return column?.label === "PENDING_CASE_NAME"
                  ? {
                      ...column,
                      clickFunc:
                        activeTab === "BAIL_BOND_STATUS"
                          ? openBailBondModal
                          : activeTab === "NOTICE_SUMMONS_MANAGEMENT"
                          ? setCourierServicePendingTask
                          : null,
                    }
                  : column;
              })
              ?.filter((column) => {
                if (activeTab !== "OTHERS" && column?.label === "APPLICATION_TYPE") return false;
                if (activeTab === "REGISTRATION") {
                  if (column?.label === "STAGE") return false;
                }
                if (activeTab === "NOTICE_SUMMONS_MANAGEMENT") {
                  if (column?.label === "STAGE") return false;
                  if (column?.label === "CS_PROCESS_TYPE") return true;
                }
                if (activeTab !== "NOTICE_SUMMONS_MANAGEMENT" && column?.label === "CS_PROCESS_TYPE") return false;
                return true;
              }),
          },
        },
      },
      additionalDetails: {
        setCount: setPendingTaskCount,
        activeTab: activeTab,
        setShowBailBondModal: setShowBailBondModal,
        setSelectedBailBond: setSelectedBailBond,
      },
    };
    setConfig(updatedConfig);
  }, [activeTab, applicationTypeOptions]);

  const getTotalCountForTab = useCallback(
    async function (tabConfig) {
      const updatedTabData = await Promise.all(
        tabConfig?.map(async (configItem, index) => {
          const response = await HomeService.customApiService(configItem?.apiDetails?.serviceName, {
            SearchCriteria: {
              moduleName: "Pending Tasks Service",
              tenantId: tenantId,
              moduleSearchCriteria: {
                screenType: ["home", "applicationCompositeOrder"],
                isCompleted: false,
                courtId: localStorage.getItem("courtId"),
                assignedRole: assignedRoles,
              },
              searchScrutinyCases: {
                date: null,
                isOnlyCountRequired: true,
                actionCategory: "Scrutinise cases",
                status: configItem?.apiDetails?.requestBody?.SearchCriteria?.searchScrutinyCases?.status,
              },
              limit: 10,
              offset: 0,
            },
          });
          const totalCount = response?.scrutinyCasesData?.count;
          if (index === 0) {
            setScrutinyDueCount(totalCount || 0);
          }
          return {
            key: index,
            label: totalCount ? `${t(configItem.label)} (${totalCount})` : `${t(configItem.label)} (0)`,
            active: index === 0 ? true : false,
          };
        }) || []
      );
      setTabData(updatedTabData);
    },
    [tenantId, assignedRoles, t]
  );

  useEffect(() => {
    userType === "employee" && getTotalCountForTab(scrutinyPendingTaskConfig);
  }, [scrutinyPendingTaskConfig, userType]);

  const handleTabChange = (title, label) => {
    if (title !== activeTabTitle) {
      if (activeTabTitle === "TOTAL_HEARINGS_TAB") {
        fetchHearingCount();
      } else {
        fetchPendingTaskCounts();
      }
    }
    setActiveTab(label || title);
    setActiveTabTitle(title);
    sessionStorage.removeItem("diaryDateFilter");
    sessionStorage.removeItem("adiaryStepper");
    sessionStorage.removeItem("adiarypdf");
  };

  const onInternalTabChange = (n) => {
    setTabData((prev) => prev.map((i, c) => ({ ...i, active: c === n ? true : false })));
    setScrutinyConfig(scrutinyPendingTaskConfig?.[n]);
  };

  const inboxSearchComposer = useMemo(
    () => (
      <InboxSearchComposer key={`${activeTab}-${updateCounter}`} customStyle={sectionsParentStyle} configs={modifiedConfig}></InboxSearchComposer>
    ),
    [activeTab, updateCounter, modifiedConfig]
  );

  const scrutinyInboxSearchComposer = useMemo(
    () =>
      tabData ? (
        <InboxSearchComposer
          key={`${activeTab}-${scrutinyConfig?.label}`}
          customStyle={sectionsParentStyle}
          configs={{
            ...scrutinyConfig,
            additionalDetails: {
              setCount: setPendingTaskCount,
              activeTab: activeTab,
              hasCaseReviewerAccess: hasCaseReviewerAccess,
            },
          }}
          showTab={true}
          tabData={tabData}
          onTabChange={onInternalTabChange}
        ></InboxSearchComposer>
      ) : (
        <Loader />
      ),
    [tabData, activeTab, scrutinyConfig, hasCaseReviewerAccess]
  );

  return (
    <React.Fragment>
      {" "}
      {(loader || ((isTaskManagementLoading || isCaseLoading || orderLoader) && courierServiceSteps?.length === 0) || isPaymentTypeLoading) && (
        <div
          style={{
            width: "100vw",
            height: "100vh",
            zIndex: "10001",
            position: "fixed",
            right: "0",
            display: "flex",
            top: "0",
            background: "rgb(234 234 245 / 50%)",
            alignItems: "center",
            justifyContent: "center",
          }}
          className="submit-loader"
        >
          <Loader />
        </div>
      )}
      <div className="main-home-screen">
        <HomeSidebar
          t={t}
          onTabChange={handleTabChange}
          activeTab={activeTab}
          options={options}
          isOptionsLoading={false}
          applicationOptions={applicationOptions}
          hearingCount={hearingCount}
          pendingTaskCount={{ ...pendingTaskCount, SCRUTINISE_CASES: scrutinyDueCount }}
          showToast={showToast}
        />
        {activeTab === "TEMPLATE_OR_CONFIGURATION" ? (
          <div className="home-bulk-sign">
            <TemplateOrConfigurationPage />
          </div>
        ) : activeTab === "TOTAL_HEARINGS_TAB" ? (
          <div className="home-bulk-reschedule">
            <HomeHearingsTab
              t={t}
              setHearingCount={setHearingCount}
              setLoader={setLoader}
              setShowEndHearingModal={setShowEndHearingModal}
              showEndHearingModal={showEndHearingModal}
              setFilters={setFilters}
              filters={filters}
              showToast={showToast}
              hearingCount={hearingCount}
            />
          </div>
        ) : activeTab === "CS_HOME_SCHEDULE_HEARING" ? (
          <div className="home-bulk-sign">
            <HomeScheduleHearing />
          </div>
        ) : activeTab === "CS_HOME_BULK_RESCHEDULE" ? (
          <div className="home-bulk-reschedule">
            <NewBulkRescheduleTab stepper={stepper} setStepper={setStepper} selectedSlot={[]} />
          </div>
        ) : activeTab === "BULK_BAIL_BOND_SIGN" ? (
          <div className="home-bulk-sign">
            <BulkBailBondSignView showToast={showToast} />
          </div>
        ) : activeTab === "REGISTER_USERS" ? (
          <div className="home-bulk-sign">
            <RegisterUsersHomeTab />
          </div>
        ) : activeTab === "OFFLINE_PAYMENTS" ? (
          <div className="home-bulk-sign">
            <OfflinePaymentsHomeTab />
          </div>
        ) : activeTab === "CS_HOME_PROCESS" ? (
          <div className="home-bulk-sign">
            <ReviewSummonsNoticeAndWarrant />
          </div>
        ) : activeTab === "CS_HOME_A_DAIRY" ? (
          <div className="home-bulk-sign">
            <BulkSignADiaryView showToast={showToast} />
          </div>
        ) : activeTab === "BULK_EVIDENCE_SIGN" ? (
          <div className="home-bulk-sign">
            <BulkMarkAsEvidenceView showToast={showToast} />
          </div>
        ) : activeTab === "BULK_WITNESS_DEPOSITION_SIGN" ? (
          <div className="home-bulk-sign">
            <BulkWitnessDepositionView showToast={showToast} />
          </div>
        ) : activeTab === "CS_HOME_ORDERS" ? (
          <div className="home-bulk-sign">
            <BulkESignView />
          </div>
        ) : activeTab === "CS_HOME_SIGN_FORMS" ? (
          <div className="home-bulk-sign">
            <BulkSignDigitalizationView />
          </div>
        ) : (
          <div className={`bulk-esign-order-view`}>
            <div className="header">{t(options[activeTab]?.name || applicationOptions[activeTab]?.name)}</div>
            <div className="inbox-search-wrapper">{activeTab === "SCRUTINISE_CASES" ? scrutinyInboxSearchComposer : inboxSearchComposer}</div>
          </div>
        )}
        {showBailBondModal && (
          <BailBondModal
            t={t}
            showToast={showToast}
            setShowBailModal={setShowBailBondModal}
            row={selectedBailBond}
            setUpdateCounter={setUpdateCounter}
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
        {courierServicePendingTask && Object?.keys(courierServicePendingTask)?.length > 0 && courierServiceSteps?.length > 0 && (
          <DocumentModal config={courierServiceConfig} disableCancel={isCaseLoading || isTaskManagementLoading || isProcessLoader} />
        )}
      </div>
    </React.Fragment>
  );
};

export default MainHomeScreen;
