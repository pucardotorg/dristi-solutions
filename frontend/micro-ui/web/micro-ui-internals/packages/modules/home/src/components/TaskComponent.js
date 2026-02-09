import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CardLabel, Dropdown } from "@egovernments/digit-ui-components";
import { Button, LabelFieldPair, Card } from "@egovernments/digit-ui-react-components";
import { Loader } from "@egovernments/digit-ui-react-components";
import { useGetPendingTask } from "../hooks/useGetPendingTask";
import { useTranslation } from "react-i18next";
import PendingTaskAccordion from "./PendingTaskAccordion";
import { HomeService, Urls } from "../hooks/services";
import { caseTypes, selectTaskType } from "../configs/HomeConfig";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import CustomStepperSuccess from "@egovernments/digit-ui-module-orders/src/components/CustomStepperSuccess";
import UploadIdType from "@egovernments/digit-ui-module-dristi/src/pages/citizen/registration/UploadIdType";
import DocumentModal from "@egovernments/digit-ui-module-orders/src/components/DocumentModal";
import { uploadResponseDocumentConfig } from "@egovernments/digit-ui-module-dristi/src/pages/citizen/FileCase/Config/resgisterRespondentConfig";
import isEqual from "lodash/isEqual";
import { DRISTIService } from "@egovernments/digit-ui-module-dristi/src/services";
import { updateCaseDetails } from "../../../cases/src/utils/joinCaseUtils";
import AdvocateReplacementComponent from "./AdvocateReplacementComponent";
import { createOrUpdateTask, filterValidAddresses, getSuffixByBusinessCode } from "../utils";
import NoticeSummonPaymentModal from "./NoticeSummonPaymentModal";
import useCaseDetailSearchService from "@egovernments/digit-ui-module-dristi/src/hooks/dristi/useCaseDetailSearchService";
import { getFormattedName } from "@egovernments/digit-ui-module-orders/src/utils";
import { AdvocateDataContext } from "@egovernments/digit-ui-module-core";
import { getAuthorizedUuid } from "@egovernments/digit-ui-module-dristi/src/Utils";

export const CaseWorkflowAction = {
  SAVE_DRAFT: "SAVE_DRAFT",
  ESIGN: "E-SIGN",
  ABANDON: "ABANDON",
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

const dayInMillisecond = 1000 * 3600 * 24;

const LITIGANT_REVIEW_TASK_NAME = "Review Litigant Details Change";
const TasksComponent = ({
  taskType,
  setTaskType,
  caseType,
  setCaseType,
  filingNumber,
  inCase = false,
  hideFilters = false,
  isDiary = false,
  taskIncludes,
  isApplicationCompositeOrder = false,
  compositeOrderObj,
  pendingSignOrderList,
  tableView = false,
  needRefresh = false,
}) => {
  const JoinCasePayment = useMemo(() => Digit.ComponentRegistryService.getComponent("JoinCasePayment"), []);
  const CourierService = useMemo(() => Digit.ComponentRegistryService.getComponent("CourierService"), []);
  const tenantId = useMemo(() => Digit.ULBService.getCurrentTenantId(), []);
  const history = useHistory();
  const { t } = useTranslation();
  const roles = useMemo(() => Digit.UserService.getUser()?.info?.roles?.map((role) => role?.code) || [], []);
  const taskTypeCode = useMemo(() => taskType?.code, [taskType]);
  const [searchCaseLoading, setSearchCaseLoading] = useState(false);
  const userInfo = Digit.UserService.getUser()?.info;
  const userUuid = userInfo?.uuid; // use userUuid only if required explicitly, otherwise use only authorizedUuid.
  const authorizedUuid = getAuthorizedUuid(userUuid);
  const todayDate = useMemo(() => new Date().getTime(), []);
  const [totalPendingTask, setTotalPendingTask] = useState(0);
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo?.type]);
  const hasSignOrderAccess = userInfo?.roles?.some((role) => role.code === "ORDER_ESIGN");
  const hasProcessManagementEditorAccess = userInfo?.roles?.some((role) => role.code === "PROCESS_MANAGEMENT_EDITOR");
  const isScrutiny = userInfo?.roles?.some((role) => role.code === "CASE_REVIEWER");
  const [showSubmitResponseModal, setShowSubmitResponseModal] = useState(false);
  const [showCourierServiceModal, setShowCourierServiceModal] = useState(false);
  const [responsePendingTask, setResponsePendingTask] = useState({});
  const [courierServicePendingTask, setCourierServicePendingTask] = useState(null);
  const [courierOrderDetails, setCourierOrderDetails] = useState({});
  const [responseDoc, setResponseDoc] = useState({});
  const [isResponseApiCalled, setIsResponseApiCalled] = useState(false);
  const [active, setActive] = useState(false);
  const courtId = localStorage.getItem("courtId");
  const [isLoader, setIsLoader] = useState(false);
  const [hideCancelButton, setHideCancelButton] = useState(false);
  const [isPaymentCompleted, setIsPaymentCompleted] = useState(false);
  const { triggerSurvey, SurveyUI } = Digit.Hooks.dristi.useSurveyManager({ tenantId: tenantId });
  const isCitizen = useMemo(() => userInfo?.type === "CITIZEN", [userInfo]);
  const isLitigant = useMemo(() => {
    if (userInfo?.type !== "CITIZEN") return false;
    return !userInfo?.roles?.some((role) => role.code === "ADVOCATE_ROLE" || role.code === "ADVOCATE_CLERK_ROLE");
  }, [userInfo]);

  const [{ joinCaseConfirmModal, joinCasePaymentModal, data }, setPendingTaskActionModals] = useState({
    joinCaseConfirmModal: false,
    joinCasePaymentModal: false,
    data: {},
  });
  const { AdvocateData: selectedSeniorAdvocate } = useContext(AdvocateDataContext);

  const { data: options, isLoading: isOptionsLoading } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    "case",
    [{ name: "pendingTaskFilterText" }],
    {
      select: (data) => {
        return data?.case?.pendingTaskFilterText || [];
      },
    }
  );

  const litigantSearchCriteriaAdditional = useMemo(() => {
    if (!userType) return null;

    // Employee: no additional filters
    if (userType === "employee") return {};

    // Citizen litigant
    if (userType === "citizen" && isLitigant) {
      return userUuid ? { assignedTo: userUuid } : null;
    }

    // Advocate / office logic

    if (!userUuid) return null;
    if (!selectedSeniorAdvocate?.uuid) return null;
    if (selectedSeniorAdvocate.uuid === userUuid) {
      return { assignedTo: userUuid };
    }

    return {
      officeAdvocateUuid: selectedSeniorAdvocate.uuid,
      officeMemberUuid: userUuid,
    };
  }, [userType, isLitigant, userUuid, selectedSeniorAdvocate?.uuid]);

  const { data: pendingTaskDetails = [], isLoading, refetch, isFetching: isFetchingPendingTask } = useGetPendingTask({
    data: {
      SearchCriteria: {
        tenantId,
        moduleName: "Pending Tasks Service",
        moduleSearchCriteria: {
          isCompleted: false,
          ...(isCitizen && litigantSearchCriteriaAdditional && { ...litigantSearchCriteriaAdditional }),
          ...(!isCitizen && { assignedRole: [...roles] }),
          ...(inCase && { filingNumber: filingNumber }),
          screenType: isDiary ? ["Adiary"] : isApplicationCompositeOrder ? ["applicationCompositeOrder"] : ["home", "applicationCompositeOrder"],
          ...(!isCitizen && courtId && !isScrutiny && { courtId }),
        },
        limit: 10000,
        offset: 0,
      },
    },
    params: { tenantId },
    key: `${filingNumber}-${isDiary}-${isApplicationCompositeOrder}-${isScrutiny}-${courtId}`,
    config: { enabled: Boolean(tenantId) && Boolean(litigantSearchCriteriaAdditional) },
  });

  const pendingTaskActionDetails = useMemo(() => {
    if (!totalPendingTask) {
      setTotalPendingTask(pendingTaskDetails?.data?.length);
    }
    return isLoading ? [] : pendingTaskDetails?.data || [];
  }, [totalPendingTask, isLoading, pendingTaskDetails?.data]);

  // const listOfFilingNumber = useMemo(
  //   () =>
  //     [...new Set(pendingTaskActionDetails?.map((data) => data?.fields?.find((field) => field.key === "filingNumber")?.value))]?.map((data) => ({
  //       filingNumber: data || "",
  //     })),
  //   [pendingTaskActionDetails]
  // );

  // const listOfActionName = useMemo(
  //   () => new Set(pendingTaskActionDetails?.map((data) => data?.fields?.find((field) => field.key === "name")?.value)),
  //   [pendingTaskActionDetails]
  // );

  // const filteredOptions = useMemo(() => {
  //   return options?.filter((item) => listOfActionName.has(item?.code)) || [];
  // }, [listOfActionName, options]);

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

  useEffect(() => {
    refetch();
  }, [refetch, filingNumber, needRefresh]);

  const getApplicationDetail = useCallback(
    async (applicationNumber) => {
      setSearchCaseLoading(true);
      // Add courtId to criteria if it exists
      const applicationData = await HomeService.customApiService(Urls.applicationSearch, {
        criteria: {
          filingNumber,
          tenantId,
          applicationNumber,
          ...(courtId && { courtId }),
        },
        tenantId,
      });
      setSearchCaseLoading(false);
      return applicationData?.applicationList?.[0] || {};
    },
    [filingNumber, tenantId, courtId]
  );

  const getOrderDetail = useCallback(
    async (orderNumber) => {
      setSearchCaseLoading(true);
      // Add courtId to criteria if it exists
      const orderData = await HomeService.customApiService(Urls.orderSearch, {
        criteria: {
          filingNumber,
          tenantId,
          orderNumber,
          ...(courtId && { courtId }),
        },
        tenantId,
      });
      setSearchCaseLoading(false);
      return orderData?.list?.[0] || {};
    },
    [courtId, filingNumber, tenantId]
  );

  const handleReviewOrder = useCallback(
    async ({ filingNumber, caseId, referenceId, litigant, litigantIndId }) => {
      const orderDetails = await getOrderDetail(referenceId);
      history.push(`/${window.contextPath}/${userType}/dristi/home/view-case?caseId=${caseId}&filingNumber=${filingNumber}&tab=Orders`, {
        orderObj: { ...orderDetails, litigant, litigantIndId },
      });
    },
    [getOrderDetail, history, userType]
  );

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
          if (Array.isArray(uniqueIdsList) && uniqueIdsList.length > 0) {
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
  }, [courierServicePendingTask, getOrderDetail, taskManagementList, tenantId, caseDetails, courierOrderDetails]);

  const handleProcessCourierOnSubmit = async (courierData, isLast, hasProcessManagementEditorAccess) => {
    const orderType = courierOrderDetails?.orderType;
    const formDataKey = formDataKeyMap[orderType];
    const formData = courierOrderDetails?.additionalDetails?.formdata?.[formDataKey]?.party;

    const existingTask = taskManagementList?.find((item) => item?.taskType === orderType);
    setIsLoader(true);
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
      if (isLast && hasProcessManagementEditorAccess) {
        setShowCourierServiceModal(false);
        setCourierServicePendingTask(null);
        setCourierOrderDetails({});
        setTimeout(async () => {
          await refetch();
        }, 2000);
      }
      return { continue: true };
    } catch (error) {
      console.error("Error creating or updating task:", error);
      return { continue: false };
    } finally {
      setIsLoader(false);
    }
  };

  const handleReviewSubmission = useCallback(
    async ({ filingNumber, caseId, referenceId, isApplicationAccepted, isView, isOpenInNewTab }) => {
      const getDate = (value) => {
        const date = new Date(value);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Month is zero-based
        const year = date.getFullYear();
        const formattedDate = `${day}-${month}-${year}`;
        return formattedDate;
      };
      const applicationDetails = await getApplicationDetail(referenceId);
      if (applicationDetails?.applicationType === "CORRECTION_IN_COMPLAINANT_DETAILS") {
        const pendingTaskRefId = applicationDetails?.additionalDetails?.pendingTaskRefId;
        const dateOfApplication = applicationDetails?.additionalDetails?.dateOfApplication;
        const uniqueId = applicationDetails?.additionalDetails?.uniqueId;
        const refApplicationId = applicationDetails?.applicationNumber;

        history.push(
          `/${window.contextPath}/${userType}/dristi/home/view-case/review-litigant-details?caseId=${caseId}&referenceId=${pendingTaskRefId}&refApplicationId=${refApplicationId}`,
          {
            dateOfApplication,
            uniqueId,
          }
        );
        return;
      }
      const defaultObj = {
        status: applicationDetails?.status,
        details: {
          applicationType: applicationDetails?.applicationType,
          applicationSentOn: getDate(parseInt(applicationDetails?.auditDetails?.createdTime)),
          sender: applicationDetails?.owner,
          additionalDetails: applicationDetails?.additionalDetails,
          applicationId: applicationDetails?.id,
          auditDetails: applicationDetails?.auditDetails,
        },
        applicationContent: null,
        comments: applicationDetails?.comment ? applicationDetails?.comment : [],
        applicationList: applicationDetails,
      };

      const docObj = applicationDetails?.documents?.map((doc) => {
        return {
          status: applicationDetails?.status,
          details: {
            applicationType: applicationDetails?.applicationType,
            applicationSentOn: getDate(parseInt(applicationDetails?.auditDetails?.createdTime)),
            sender: applicationDetails?.additionalDetails?.owner,
            additionalDetails: applicationDetails?.additionalDetails,
            applicationId: applicationDetails?.id,
            auditDetails: applicationDetails?.auditDetails,
          },
          applicationContent: {
            tenantId: applicationDetails?.tenantId,
            fileStoreId: doc.fileStore,
            id: doc.id,
            documentType: doc.documentType,
            documentUid: doc.documentUid,
            additionalDetails: doc.additionalDetails,
          },
          comments: applicationDetails?.comment ? applicationDetails?.comment : [],
          applicationList: applicationDetails,
        };
      }) || [defaultObj];

      if (isOpenInNewTab) {
        const newTabUrl = `/${window.contextPath}/${userType}/dristi/home/view-case?caseId=${caseId}&filingNumber=${filingNumber}&applicationNumber=${applicationDetails?.applicationNumber}&tab=Submissions`;
        window.open(newTabUrl, "_blank", "noopener,noreferrer");
      } else if (isApplicationCompositeOrder) {
        if (isView) {
          history.push(`/${window.contextPath}/${userType}/dristi/home/view-case?caseId=${caseId}&filingNumber=${filingNumber}&tab=Submissions`, {
            applicationDocObj: docObj,
          });
        } else {
          history.replace(
            `/${window.contextPath}/${userType}/orders/generate-order?filingNumber=${filingNumber}&orderNumber=${compositeOrderObj?.orderNumber}`,
            {
              applicationDocObj: docObj,
              isApplicationAccepted: isApplicationAccepted,
            }
          );
        }
      } else {
        history.push(`/${window.contextPath}/${userType}/dristi/home/view-case?caseId=${caseId}&filingNumber=${filingNumber}&tab=Submissions`, {
          applicationDocObj: docObj,
        });
      }
    },
    [getApplicationDetail, history, userType, isApplicationCompositeOrder, compositeOrderObj]
  );

  const handleCreateOrder = useCallback(
    async ({ cnrNumber, filingNumber, orderType, referenceId, caseId, caseTitle, pendingTaskForDraft = true }) => {
      let reqBody = {
        order: {
          createdDate: null,
          tenantId,
          cnrNumber,
          filingNumber: filingNumber,
          statuteSection: {
            tenantId,
          },
          orderTitle: orderType,
          orderCategory: "INTERMEDIATE",
          orderType: orderType,
          status: "",
          isActive: true,
          workflow: {
            action: CaseWorkflowAction.SAVE_DRAFT,
            comments: "Creating order",
            assignes: null,
            rating: null,
            documents: [{}],
          },
          documents: [],
          additionalDetails: {
            formdata: {
              orderType: {
                code: orderType,
                type: orderType,
                name: `ORDER_TYPE_${orderType}`,
              },
              refApplicationId: referenceId,
            },
          },
        },
      };
      try {
        const res = await HomeService.customApiService(Urls.orderCreate, reqBody, { tenantId });
        pendingTaskForDraft &&
          HomeService.customApiService(Urls.pendingTask, {
            pendingTask: {
              name: t("ORDER_CREATED"),
              entityType: "order-default",
              referenceId: `MANUAL_${referenceId}`,
              status: "SAVE_DRAFT",
              assignedTo: [],
              assignedRole: ["PENDING_TASK_ORDER"],
              cnrNumber,
              filingNumber: filingNumber,
              caseId,
              caseTitle,
              isCompleted: true,
              stateSla: null,
              additionalDetails: {},
              tenantId,
            },
          });
        history.push(`/${window.contextPath}/employee/orders/generate-order?filingNumber=${filingNumber}&orderNumber=${res.order.orderNumber}`);
      } catch (error) {}
    },
    [t, history, tenantId]
  );

  const pendingTasks = useMemo(() => {
    if (isLoading || isFetchingPendingTask || isOptionsLoading || pendingTaskActionDetails?.length === 0) return [];
    const getCustomFunction = {
      handleCreateOrder,
      handleReviewSubmission,
      handleReviewOrder,
    };
    const tasks = pendingTaskActionDetails?.map((data) => {
      const filingNumber = data?.fields?.find((field) => field.key === "filingNumber")?.value || "";
      const cnrNumber = data?.fields?.find((field) => field.key === "cnrNumber")?.value || "";
      const caseId = data?.fields?.find((field) => field.key === "caseId")?.value || "";
      const caseTitle = data?.fields?.find((field) => field.key === "caseTitle")?.value || "";
      const status = data?.fields?.find((field) => field.key === "status")?.value;
      const dueInSec = data?.fields?.find((field) => field.key === "businessServiceSla")?.value;
      const stateSla = data?.fields?.find((field) => field.key === "stateSla")?.value;
      const isCompleted = data?.fields?.find((field) => field.key === "isCompleted")?.value;
      const actionName = data?.fields?.find((field) => field.key === "name")?.value;
      const referenceId = data?.fields?.find((field) => field.key === "referenceId")?.value;
      const entityType = data?.fields?.find((field) => field.key === "entityType")?.value;
      const individualId = data?.fields?.find((field) => field.key === "additionalDetails.individualId")?.value;
      const litigant = data?.fields?.find((field) => field.key === "additionalDetails.litigantUuid[0]")?.value;
      const litigantIndId = data?.fields?.find((field) => field.key === "additionalDetails.litigants[0]")?.value;
      const screenType = data?.fields?.find((field) => field.key === "screenType")?.value;
      const dateOfApplication = data?.fields?.find((field) => field.key === "additionalDetails.dateOfApplication")?.value;
      const uniqueId = data?.fields?.find((field) => field.key === "additionalDetails.uniqueId")?.value;
      const createdTime = data?.fields?.find((field) => field.key === "createdTime")?.value;
      const applicationType = data?.fields?.find((field) => field.key === "additionalDetails.applicationType")?.value;
      const bailBondId = data?.fields?.find((field) => field.key === "additionalDetails.bailBondId")?.value;
      const courtId = data?.fields?.find((field) => field.key === "courtId")?.value;

      const updateReferenceId = referenceId?.split("_").pop();
      const defaultObj = {
        referenceId: updateReferenceId,
        id: caseId,
        cnrNumber,
        filingNumber,
        caseTitle,
        ...(applicationType && { applicationType }),
        courtId,
      };
      const orderItemId = data?.fields?.find((field) => field?.key === "additionalDetails.orderItemId")?.value;
      const partyType = data?.fields?.find((field) => field?.key === "additionalDetails.partyType")?.value;
      const partyUniqueIdsMap = {};

      data?.fields?.forEach(({ key, value }) => {
        const match = key?.match(/^additionalDetails\.uniqueIds\[(\d+)\]\.(.+)$/);
        if (match) {
          const index = match[1];
          const property = match[2];
          partyUniqueIdsMap[index] = partyUniqueIdsMap[index] || {};
          partyUniqueIdsMap[index][property] = value;
        }
      });
      const pendingTaskActions = selectTaskType?.[entityType || taskTypeCode];
      const isCustomFunction = Boolean(pendingTaskActions?.[status]?.customFunction);
      const dayCount = stateSla
        ? Math.abs(Math.ceil((Number(stateSla) - todayDate) / dayInMillisecond))
        : dueInSec
        ? Math.abs(Math.ceil(dueInSec / dayInMillisecond))
        : null;
      let additionalDetails = pendingTaskActions?.[status]?.additionalDetailsKeys?.reduce((result, current) => {
        result[current] = data?.fields?.find((field) => field.key === `additionalDetails.${current}`)?.value;
        return result;
      }, {});
      if (actionName === "Schedule Next Hearing") {
        additionalDetails = {
          orderType: "SCHEDULE_OF_HEARING_DATE",
          caseTitle: caseTitle,
          pendingTaskForDraft: false,
        };
      }
      const searchParams = new URLSearchParams();
      pendingTaskActions?.[status]?.redirectDetails?.params?.forEach((item) => {
        searchParams.set(item?.key, item?.value ? defaultObj?.[item?.value] : item?.defaultValue);
      });

      if (applicationType === "APPLICATION_TO_CHANGE_POWER_OF_ATTORNEY_DETAILS") {
        searchParams.set("applicationType", applicationType);
      }
      const redirectUrl = isCustomFunction
        ? getCustomFunction[pendingTaskActions?.[status]?.customFunction]
        : `/${window?.contextPath}/${userType}${pendingTaskActions?.[status]?.redirectDetails?.url}?${searchParams.toString()}`;
      const due = dayCount > 1 ? `Due in ${dayCount} Days` : dayCount === 1 || dayCount === 0 ? `Due today` : `No Due Date`;
      return {
        actionName: actionName || pendingTaskActions?.[status]?.actionName,
        status,
        entityType,
        individualId,
        caseId,
        caseTitle,
        filingNumber: filingNumber,
        caseType: "NIA S138",
        stateSla,
        due: due,
        createdTime,
        dayCount: dayCount ? dayCount : dayCount === 0 ? 0 : Infinity,
        isCompleted,
        dueDateColor: due === "Due today" ? "#9E400A" : "",
        redirectUrl,
        orderItemId,
        partyType,
        bailBondId,
        ...(Object.keys(partyUniqueIdsMap).length > 0 ? { partyUniqueIds: Object.values(partyUniqueIdsMap) } : {}),
        params: {
          ...additionalDetails,
          cnrNumber,
          filingNumber,
          caseId,
          referenceId: updateReferenceId,
          litigant,
          litigantIndId,
          dateOfApplication,
          uniqueId,
          applicationType,
          actualReferenceId: referenceId,
        },
        isCustomFunction,
        referenceId,
        screenType,
      };
    });

    const filteredTasks = tasks.filter((task) => {
      const excludeForComposite = isApplicationCompositeOrder
        ? (task?.actionName || "").trim().toLowerCase() !== LITIGANT_REVIEW_TASK_NAME.toLowerCase()
        : true;
      return excludeForComposite;
    });
    if (taskType?.code)
      return filteredTasks?.filter((task) => taskType?.keyword?.some((key) => task?.actionName?.toLowerCase()?.includes(key?.toLowerCase())));
    else return filteredTasks;
  }, [
    handleCreateOrder,
    handleReviewOrder,
    handleReviewSubmission,
    isLoading,
    isFetchingPendingTask,
    isOptionsLoading,
    pendingTaskActionDetails,
    taskType?.code,
    taskType?.keyword,
    taskTypeCode,
    todayDate,
    userType,
    isApplicationCompositeOrder,
  ]);

  const submitResponse = useCallback(
    async (responseDoc) => {
      setIsResponseApiCalled(true);
      let newCase;
      const pendingTask = responsePendingTask;

      const caseResponse = await DRISTIService.searchCaseService(
        {
          criteria: [
            {
              filingNumber: pendingTask?.filingNumber,
              ...(pendingTask?.courtId && { courtId: pendingTask?.courtId }),
            },
          ],
          tenantId,
        },
        {}
      );

      if (caseResponse?.criteria[0]?.responseList?.length === 1) {
        newCase = caseResponse?.criteria[0]?.responseList[0];
      }

      if (newCase && pendingTask?.individualId && responseDoc.fileStore) {
        newCase = {
          ...newCase,
          litigants: newCase?.litigants?.map((data) => {
            if (data?.individualId === pendingTask?.individualId) {
              return {
                ...data,
                documents: [
                  {
                    ...responseDoc,
                    additionalDetails: {
                      fileName: `Response (${data?.additionalDetails?.fullName})`,
                      fileType: "respondent-response",
                    },
                  },
                ],
              };
            } else return data;
          }),
        };
      }
      let response;
      try {
        response = await updateCaseDetails(newCase, tenantId, "RESPOND");
      } catch (error) {
        console.error("error :>> ", error);
      }
      if (response) {
        try {
          await DRISTIService.customApiService(Urls.pendingTask, {
            pendingTask: {
              name: "Pending Response",
              entityType: "case-default",
              referenceId: pendingTask?.referenceId,
              status: "PENDING_RESPONSE",
              assignedTo: [{ uuid: authorizedUuid }],
              assignedRole: ["CASE_RESPONDER"],
              cnrNumber: pendingTask?.cnrNumber,
              filingNumber: pendingTask?.filingNumber,
              caseId: pendingTask?.caseId,
              caseTitle: pendingTask?.caseTitle,
              isCompleted: true,
              stateSla: null,
              additionalDetails: {},
              tenantId,
            },
          });
        } catch (err) {
          console.error("err :>> ", err);
        }
        setIsResponseApiCalled(false);
        return { continue: true };
      } else {
        setIsResponseApiCalled(false);
        return { continue: false };
      }
    },
    [responsePendingTask, tenantId, authorizedUuid]
  );

  const getCaseDetailsUrl = useCallback(
    (caseId, filingNumber) => `/${window?.contextPath}/${userType}/dristi/home/view-case?caseId=${caseId}&filingNumber=${filingNumber}&tab=Overview`,
    [userType]
  );

  const sumbitResponseConfig = useMemo(() => {
    return {
      handleClose: () => {
        setShowSubmitResponseModal(false);
      },
      heading: { label: "" },
      actionSaveLabel: "",
      isStepperModal: true,
      actionSaveOnSubmit: () => {},
      steps: [
        {
          heading: { label: "Submit Response" },
          actionSaveLabel: "Submit",
          modalBody: (
            <UploadIdType
              config={uploadResponseDocumentConfig}
              isAdvocateUploading={true}
              onFormValueChange={(setValue, formData) => {
                const documentData = {
                  fileStore: formData?.SelectUserTypeComponent?.ID_Proof?.[0]?.[1]?.fileStoreId?.fileStoreId,
                  documentType: formData?.SelectUserTypeComponent?.ID_Proof?.[0]?.[1]?.file?.type,
                  identifierType: formData?.SelectUserTypeComponent?.selectIdType?.type,
                  additionalDetails: {
                    fileName: formData?.SelectUserTypeComponent?.ID_Proof?.[0]?.[1]?.file?.name,
                    fileType: "respondent-response",
                  },
                };
                if (!isEqual(documentData, responseDoc)) setResponseDoc(documentData);
              }}
            />
          ),
          actionSaveOnSubmit: async () => {
            return await submitResponse(responseDoc);
          },
          async: true,
          isDisabled: (responseDoc?.fileStore ? false : true) || isResponseApiCalled,
          isBackButtonDisabled: isResponseApiCalled,
        },
        {
          type: "success",
          hideSubmit: true,
          modalBody: (
            <CustomStepperSuccess
              successMessage={"RESPONSE_SUCCESSFULLY"}
              submitButtonAction={async () => {
                const pendingTask = responsePendingTask;
                history.push(getCaseDetailsUrl(pendingTask?.caseId, pendingTask?.filingNumber));
                setShowSubmitResponseModal(false);
              }}
              submitButtonText={"VIEW_CASE_FILE"}
              closeButtonText={"BACK_HOME"}
              closeButtonAction={() => {
                setShowSubmitResponseModal(false);
              }}
              t={t}
            />
          ),
        },
      ].filter(Boolean),
    };
  }, [responseDoc, isResponseApiCalled, t, submitResponse, responsePendingTask, history, getCaseDetailsUrl]);

  const { pendingTaskDataInWeek, allOtherPendingTask } = useMemo(
    () => ({
      pendingTaskDataInWeek:
        [
          ...pendingTasks
            .filter((data) => data?.dayCount < 7 && !data?.isCompleted)
            .map((data) => data)
            .sort((data) => data?.dayCount),
        ] || [],
      allOtherPendingTask:
        pendingTasks
          .filter((data) => data?.dayCount >= 7 && !data?.isCompleted)
          .map((data) => data)
          .sort((data) => data?.dayCount) || [],
    }),
    [pendingTasks]
  );

  const taskIncludesPendingTasks = useMemo(() => pendingTasks?.filter((task) => taskIncludes?.includes(task?.actionName)), [
    pendingTasks,
    taskIncludes,
  ]);

  const joinCaseConfirmConfig = useMemo(() => {
    if (!data?.filingNumber || !data?.taskNumber) return null;
    return {
      handleClose: () => {
        setPendingTaskActionModals((pendingTaskActionModals) => {
          const data = pendingTaskActionModals?.data;
          delete data.filingNumber;
          delete data.taskNumber;
          return {
            ...pendingTaskActionModals,
            joinCaseConfirmModal: false,
            data: data,
          };
        });
      },
      heading: {
        label: t("ADVOCATE_REPLACEMENT_REQUEST"),
      },
      isStepperModal: false,
      modalBody: (
        <AdvocateReplacementComponent
          filingNumber={data?.filingNumber}
          taskNumber={data?.taskNumber}
          setPendingTaskActionModals={setPendingTaskActionModals}
          refetch={refetch}
        />
      ),
      type: "document",
      hideModalActionbar: true,
    };
  }, [t, data, refetch, setPendingTaskActionModals]);

  const joinCasePaymentConfig = useMemo(() => {
    if (!data?.filingNumber || !data?.taskNumber) return null;
    return {
      handleClose: () => {
        setPendingTaskActionModals((pendingTaskActionModals) => {
          const data = pendingTaskActionModals?.data;
          delete data.filingNumber;
          delete data.taskNumber;
          return {
            ...pendingTaskActionModals,
            joinCasePaymentModal: false,
            data: data,
          };
        });
      },
      heading: {
        label: t("PAY_TO_JOIN_CASE"),
      },
      isStepperModal: false,
      modalBody: <JoinCasePayment taskNumber={data?.taskNumber} setPendingTaskActionModals={setPendingTaskActionModals} refetch={refetch} />,
      hideModalActionbar: true,
    };
  }, [t, data, refetch, setPendingTaskActionModals]);

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
          actionSaveLabel: isLast && hasProcessManagementEditorAccess ? t("CS_COURIER_CONFIRM") : t("CS_COURIER_NEXT"),
          heading: { label: `${t("CS_TAKE_STEPS")} - ${t(courierOrderDetails?.orderType)} for ${fullName}` },
          modalBody: (
            <CourierService
              t={t}
              isLoading={isTaskManagementLoading || isLoader || isCaseLoading}
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
            return await handleProcessCourierOnSubmit(courierData, isLast, hasProcessManagementEditorAccess);
          },
          isDisabled:
            isTaskManagementLoading ||
            isCaseLoading ||
            isLoader ||
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
    isTaskManagementLoading,
    isCaseLoading,
    isLoader,
    hasProcessManagementEditorAccess,
  ]);

  // Courier service modal configuration
  const courierServiceConfig = useMemo(() => {
    return {
      handleClose: () => {
        if (isPaymentCompleted) {
          triggerSurvey("TASK_PAYMENT", () => {
            setShowCourierServiceModal(false);
            setHideCancelButton(false);
            setCourierServicePendingTask(null);
            setCourierOrderDetails({});
          });
        } else {
          setShowCourierServiceModal(false);
          setHideCancelButton(false);
          setCourierServicePendingTask(null);
          setCourierOrderDetails({});
        }
      },
      isStepperModal: true,
      actionSaveLabel: t("CS_COURIER_NEXT"),
      actionCancelLabel: t("CS_COURIER_GO_BACK"),
      steps: [
        ...courierServiceSteps,
        ...(!hasProcessManagementEditorAccess
          ? [
              {
                type: "payment",
                hideSubmit: true,
                isStatus: false,
                hideModalActionbar: hideCancelButton,
                heading: { label: t("CS_TASK_PENDING_PAYMENT") },
                className: "courier-payment",
                closeBtnStyle: { paddingRight: "0px" },
                modalBody: (
                  <NoticeSummonPaymentModal
                    suffix={suffix}
                    setHideCancelButton={setHideCancelButton}
                    formDataKey={formDataKeyMap[courierOrderDetails?.orderType]}
                    taskManagementList={taskManagementList}
                    courierOrderDetails={courierOrderDetails}
                    refetchPendingTasks={refetch}
                    setIsPaymentCompleted={setIsPaymentCompleted}
                  />
                ),
              },
            ]
          : []),
      ],
    };
  }, [courierServiceSteps, t, taskManagementList, courierOrderDetails, hideCancelButton, hasProcessManagementEditorAccess, refetch, suffix]);

  useEffect(() => {
    if (selectedSeniorAdvocate?.id && litigantSearchCriteriaAdditional) {
      refetch();
    }
  }, [selectedSeniorAdvocate?.id, litigantSearchCriteriaAdditional, refetch]);

  const customStyles = `
  .digit-dropdown-select-wrap .digit-dropdown-options-card span {
    height:unset !important;
  }`;

  if (isApplicationCompositeOrder) {
    if (pendingTasks?.length === 0) {
      return null;
    }

    return (
      <div className="task-section">
        <PendingTaskAccordion
          pendingTasks={pendingTasks}
          allPendingTasks={[...pendingTaskDataInWeek, ...allOtherPendingTask]}
          accordionHeader={"ALL_OTHER_TASKS"}
          t={t}
          totalCount={pendingTasks?.length}
          setShowSubmitResponseModal={setShowSubmitResponseModal}
          setResponsePendingTask={setResponsePendingTask}
          setPendingTaskActionModals={setPendingTaskActionModals}
          isApplicationCompositeOrder={isApplicationCompositeOrder}
          setShowCourierServiceModal={setShowCourierServiceModal}
          setCourierServicePendingTask={setCourierServicePendingTask}
        />
      </div>
    );
  }

  return !tableView ? (
    <div className="tasks-component">
      <React.Fragment>
        <h2>{!isCitizen ? t("YOUR_TASK") : t("ALL_PENDING_TASK_TEXT")}</h2>
        {hasSignOrderAccess && pendingSignOrderList && (
          <Button
            label={`${t("BULK_SIGN")} ${pendingSignOrderList?.totalCount} ${t("BULK_PENDING_ORDERS")}`}
            textStyles={{ margin: "0px", fontSize: "16px", fontWeight: 700, textAlign: "center" }}
            style={{ padding: "18px", width: "fit-content", boxShadow: "none" }}
            onButtonClick={() => history.push(`/${window?.contextPath}/${userType}/home/home-screen`, { homeActiveTab: "CS_HOME_ORDERS" })}
            isDisabled={pendingSignOrderList?.totalCount === 0}
          />
        )}
        {isLoading || isFetchingPendingTask || isOptionsLoading || isPaymentTypeLoading ? (
          <Loader />
        ) : totalPendingTask !== undefined && totalPendingTask > 0 ? (
          <React.Fragment>
            {!hideFilters && (
              <div>
                <div className="task-filters">
                  <style>{customStyles}</style>
                  <LabelFieldPair>
                    <CardLabel style={{ fontSize: "16px" }} className={"card-label"}>
                      {t("CASE_TYPE")}
                    </CardLabel>
                    <Dropdown
                      option={caseTypes}
                      selected={caseType}
                      optionKey={"name"}
                      select={(value) => {
                        setCaseType(value);
                      }}
                      placeholder={t("CS_CASE_TYPE")}
                      style={{ marginBottom: "0px" }}
                    />
                  </LabelFieldPair>
                  <LabelFieldPair>
                    <CardLabel style={{ fontSize: "16px" }} className={"card-label"}>
                      {t("CS_TASK_TYPE")}
                    </CardLabel>
                    <Dropdown
                      t={t}
                      option={options?.sort((a, b) => a?.name?.localeCompare(b?.name))}
                      optionKey={"name"}
                      selected={taskType}
                      select={(value) => {
                        setTaskType(value);
                      }}
                      placeholder={t("CS_TASK_TYPE")}
                      style={{ marginBottom: "0px" }}
                    />
                  </LabelFieldPair>
                </div>
              </div>
            )}

            <React.Fragment>
              {searchCaseLoading && <Loader />}
              {!searchCaseLoading && (
                <React.Fragment>
                  {taskIncludes?.length > 0 ? (
                    <div className="task-section">
                      <PendingTaskAccordion
                        pendingTasks={taskIncludesPendingTasks}
                        allPendingTasks={[...pendingTaskDataInWeek, ...allOtherPendingTask]}
                        accordionHeader={"Take_Action"}
                        t={t}
                        isHighlighted={true}
                        isAccordionOpen={true}
                        isOpenInNewTab={true}
                        setShowSubmitResponseModal={setShowSubmitResponseModal}
                        setResponsePendingTask={setResponsePendingTask}
                        setPendingTaskActionModals={setPendingTaskActionModals}
                        setShowCourierServiceModal={setShowCourierServiceModal}
                        setCourierServicePendingTask={setCourierServicePendingTask}
                      />
                    </div>
                  ) : (
                    <React.Fragment>
                      <div className="task-section">
                        <PendingTaskAccordion
                          pendingTasks={pendingTaskDataInWeek}
                          allPendingTasks={[...pendingTaskDataInWeek, ...allOtherPendingTask]}
                          accordionHeader={"COMPLETE_THIS_WEEK"}
                          t={t}
                          totalCount={pendingTaskDataInWeek?.length}
                          isHighlighted={true}
                          isAccordionOpen={true}
                          setShowSubmitResponseModal={setShowSubmitResponseModal}
                          setResponsePendingTask={setResponsePendingTask}
                          setPendingTaskActionModals={setPendingTaskActionModals}
                          setShowCourierServiceModal={setShowCourierServiceModal}
                          setCourierServicePendingTask={setCourierServicePendingTask}
                        />
                      </div>
                      <div className="task-section">
                        <PendingTaskAccordion
                          pendingTasks={allOtherPendingTask}
                          allPendingTasks={[...pendingTaskDataInWeek, ...allOtherPendingTask]}
                          accordionHeader={"ALL_OTHER_TASKS"}
                          t={t}
                          totalCount={allOtherPendingTask?.length}
                          setShowSubmitResponseModal={setShowSubmitResponseModal}
                          setResponsePendingTask={setResponsePendingTask}
                          setPendingTaskActionModals={setPendingTaskActionModals}
                          setShowCourierServiceModal={setShowCourierServiceModal}
                          setCourierServicePendingTask={setCourierServicePendingTask}
                        />
                      </div>
                    </React.Fragment>
                  )}
                  <div className="task-section"></div>
                </React.Fragment>
              )}
            </React.Fragment>
          </React.Fragment>
        ) : (
          <div
            style={{
              fontSize: "20px",
              fontStyle: "italic",
              lineHeight: "23.44px",
              fontWeight: "500",
              font: "Roboto",
              color: "#77787B",
            }}
          >
            {!isCitizen ? t("NO_TASK_TEXT") : t("NO_PENDING_TASK_TEXT")}
          </div>
        )}
      </React.Fragment>

      {showSubmitResponseModal && <DocumentModal config={sumbitResponseConfig} />}
      {showCourierServiceModal && courierServiceSteps?.length > 0 && <DocumentModal config={courierServiceConfig} />}
      {joinCaseConfirmModal && <DocumentModal config={joinCaseConfirmConfig} />}
      {joinCasePaymentModal && <DocumentModal config={joinCasePaymentConfig} />}
      {SurveyUI}
    </div>
  ) : (
    <div className="tasks-component-table-view">
      {isLoading || isFetchingPendingTask || isOptionsLoading ? (
        <Loader />
      ) : totalPendingTask !== undefined && totalPendingTask > 0 ? (
        <React.Fragment>
          {searchCaseLoading && <Loader />}
          {!searchCaseLoading && (
            <React.Fragment>
              {pendingTasks?.length > 0 && (
                <div>
                  <Card style={{ border: "solid 1px #E8E8E8", boxShadow: "none", webkitBoxShadow: "none", maxWidth: "100%" }}>
                    <PendingTaskAccordion
                      pendingTasks={[...pendingTaskDataInWeek, ...allOtherPendingTask]}
                      allPendingTasks={[...pendingTaskDataInWeek, ...allOtherPendingTask]}
                      accordionHeader={"ALL_OTHER_TASKS"}
                      t={t}
                      totalCount={allOtherPendingTask?.length}
                      setShowSubmitResponseModal={setShowSubmitResponseModal}
                      setResponsePendingTask={setResponsePendingTask}
                      setPendingTaskActionModals={setPendingTaskActionModals}
                      setShowCourierServiceModal={setShowCourierServiceModal}
                      setCourierServicePendingTask={setCourierServicePendingTask}
                      tableView={true}
                    />
                  </Card>
                </div>
              )}
            </React.Fragment>
          )}
          {showSubmitResponseModal && <DocumentModal config={sumbitResponseConfig} />}
          {showCourierServiceModal && courierServiceSteps?.length > 0 && (
            <DocumentModal config={courierServiceConfig} disableCancel={isCaseLoading || isTaskManagementLoading || isLoader} />
          )}
          {joinCaseConfirmModal && <DocumentModal config={joinCaseConfirmConfig} />}
          {joinCasePaymentModal && <DocumentModal config={joinCasePaymentConfig} />}
          {SurveyUI}
        </React.Fragment>
      ) : (
        <React.Fragment></React.Fragment>
      )}
    </div>
  );
};
export default React.memo(TasksComponent);
