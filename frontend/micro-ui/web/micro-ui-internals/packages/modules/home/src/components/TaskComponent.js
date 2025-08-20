import React, { useCallback, useEffect, useMemo, useState } from "react";
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

export const CaseWorkflowAction = {
  SAVE_DRAFT: "SAVE_DRAFT",
  ESIGN: "E-SIGN",
  ABANDON: "ABANDON",
};
const dayInMillisecond = 1000 * 3600 * 24;

const TasksComponent = ({
  taskType,
  setTaskType,
  caseType,
  setCaseType,
  isLitigant,
  uuid,
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
  const tenantId = useMemo(() => Digit.ULBService.getCurrentTenantId(), []);
  const history = useHistory();
  const { t } = useTranslation();
  const roles = useMemo(() => Digit.UserService.getUser()?.info?.roles?.map((role) => role?.code) || [], []);
  const isCourtRoomManager = roles.includes("COURT_ROOM_MANAGER");
  const taskTypeCode = useMemo(() => taskType?.code, [taskType]);
  const [searchCaseLoading, setSearchCaseLoading] = useState(false);
  const userInfo = Digit.UserService.getUser()?.info;
  const todayDate = useMemo(() => new Date().getTime(), []);
  const [totalPendingTask, setTotalPendingTask] = useState(0);
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo?.type]);
  const isJudgeOrBenchClerk = userInfo?.roles?.some((role) => role.code === "JUDGE_ROLE" || role.code === "BENCH_CLERK" || role.code === "COURT_ROOM_MANAGER");
  const isScrutiny = userInfo?.roles?.some((role) => role.code === "CASE_REVIEWER");
  const [showSubmitResponseModal, setShowSubmitResponseModal] = useState(false);
  const [responsePendingTask, setResponsePendingTask] = useState({});
  const [responseDoc, setResponseDoc] = useState({});
  const [isResponseApiCalled, setIsResponseApiCalled] = useState(false);
  const courtId = localStorage.getItem("courtId");
  const [{ joinCaseConfirmModal, joinCasePaymentModal, data }, setPendingTaskActionModals] = useState({
    joinCaseConfirmModal: false,
    joinCasePaymentModal: false,
    data: {},
  });

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

  const { data: pendingTaskDetails = [], isLoading, refetch } = useGetPendingTask({
    data: {
      SearchCriteria: {
        tenantId,
        moduleName: "Pending Tasks Service",
        moduleSearchCriteria: {
          isCompleted: false,
          ...(isLitigant && { assignedTo: uuid }),
          ...(!isLitigant && { assignedRole: [...roles] }),
          ...(inCase && { filingNumber: filingNumber }),
          screenType: isDiary ? ["Adiary"] : isApplicationCompositeOrder ? ["applicationCompositeOrder"] : ["home", "applicationCompositeOrder"],
          ...(!isLitigant && courtId && !isScrutiny && { courtId }),
        },
        limit: 10000,
        offset: 0,
      },
    },
    params: { tenantId },
    key: `${filingNumber}-${isDiary}-${isApplicationCompositeOrder}-${isScrutiny}-${courtId}`,
    config: { enabled: Boolean(tenantId) },
  });

  const pendingTaskActionDetails = useMemo(() => {
    if (!totalPendingTask) {
      setTotalPendingTask(pendingTaskDetails?.data?.length);
    }
    return isLoading ? [] : pendingTaskDetails?.data || [];
  }, [totalPendingTask, isLoading, pendingTaskDetails?.data]);

  const listOfFilingNumber = useMemo(
    () =>
      [...new Set(pendingTaskActionDetails?.map((data) => data?.fields?.find((field) => field.key === "filingNumber")?.value))]?.map((data) => ({
        filingNumber: data || "",
      })),
    [pendingTaskActionDetails]
  );

  const listOfActionName = useMemo(
    () => new Set(pendingTaskActionDetails?.map((data) => data?.fields?.find((field) => field.key === "name")?.value)),
    [pendingTaskActionDetails]
  );

  const filteredOptions = useMemo(() => {
    return options?.filter((item) => listOfActionName.has(item?.code)) || [];
  }, [listOfActionName, options]);

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

  const handleReviewSubmission = useCallback(
    async ({ filingNumber, caseId, referenceId, isOpenInNewTab }) => {
      const getDate = (value) => {
        const date = new Date(value);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Month is zero-based
        const year = date.getFullYear();
        const formattedDate = `${day}-${month}-${year}`;
        return formattedDate;
      };
      const applicationDetails = await getApplicationDetail(referenceId);
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
        history.push(`/${window.contextPath}/${userType}/dristi/home/view-case?caseId=${caseId}&filingNumber=${filingNumber}&tab=Submissions`, {
          applicationDocObj: docObj,
          compositeOrderObj: compositeOrderObj,
        });
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
              assignedRole: ["JUDGE_ROLE"],
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
        history.push(`/${window.contextPath}/employee/orders/generate-orders?filingNumber=${filingNumber}&orderNumber=${res.order.orderNumber}`);
      } catch (error) {}
    },
    [history, tenantId]
  );

  const pendingTasks = useMemo(() => {
    if (isLoading || isOptionsLoading || pendingTaskActionDetails?.length === 0) return [];
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

      const updateReferenceId = referenceId.split("_").pop();
      const defaultObj = {
        referenceId: updateReferenceId,
        id: caseId,
        cnrNumber,
        filingNumber,
        caseTitle,
        ...(applicationType && { applicationType }),
      };
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
      if (actionName === "order for scheduling next hearing") {
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

      if(applicationType === "APPLICATION_TO_CHANGE_POWER_OF_ATTORNEY_DETAILS"){
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
        },
        isCustomFunction,
        referenceId,
        screenType,
      };
    });

    const filteredTasks = tasks.filter((task) => {
      if (isCourtRoomManager) {
        // TODO: For court room manager,show only summons pending task, have to confirm which are those and include here.

        return task?.entityType === "bail bond" ? true : false;
      } else return true;
    });
    if (taskType?.code)
      return filteredTasks?.filter((task) => taskType?.keyword?.some((key) => task?.actionName?.toLowerCase()?.includes(key?.toLowerCase())));
    else return filteredTasks;
  }, [
    handleCreateOrder,
    handleReviewOrder,
    handleReviewSubmission,
    isCourtRoomManager,
    isLoading,
    isOptionsLoading,
    pendingTaskActionDetails,
    taskType?.code,
    taskType?.keyword,
    taskTypeCode,
    todayDate,
    userType,
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
              assignedTo: [{ uuid: userInfo?.uuid }],
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
    [responsePendingTask, tenantId, userInfo?.uuid]
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

  const customStyles = `
  .digit-dropdown-select-wrap .digit-dropdown-options-card span {
    height:unset !important;
  }`;
  return !tableView ? (
    <div className="tasks-component">
      <React.Fragment>
        <h2>{!isLitigant ? t("YOUR_TASK") : t("ALL_PENDING_TASK_TEXT")}</h2>
        {isJudgeOrBenchClerk && pendingSignOrderList && (
          <Button
            label={`${t("BULK_SIGN")} ${pendingSignOrderList?.totalCount} ${t("BULK_PENDING_ORDERS")}`}
            textStyles={{ margin: "0px", fontSize: "16px", fontWeight: 700, textAlign: "center" }}
            style={{ padding: "18px", width: "fit-content", boxShadow: "none" }}
            onButtonClick={() => history.push(`/${window?.contextPath}/${userType}/home/bulk-esign-order`)}
            isDisabled={pendingSignOrderList?.totalCount === 0}
          />
        )}
        {isLoading || isOptionsLoading ? (
          <Loader />
        ) : totalPendingTask !== undefined && totalPendingTask > 0 ? (
          <React.Fragment>
            {!hideFilters && (
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
                  />
                </LabelFieldPair>
                <LabelFieldPair>
                  <CardLabel style={{ fontSize: "16px" }} className={"card-label"}>
                    {t("CS_TASK_TYPE")}
                  </CardLabel>
                  <Dropdown
                    t={t}
                    option={options}
                    optionKey={"name"}
                    selected={taskType}
                    select={(value) => {
                      setTaskType(value);
                    }}
                    placeholder={t("CS_TASK_TYPE")}
                  />
                </LabelFieldPair>
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
            {!isLitigant ? t("NO_TASK_TEXT") : t("NO_PENDING_TASK_TEXT")}
          </div>
        )}
      </React.Fragment>

      {showSubmitResponseModal && <DocumentModal config={sumbitResponseConfig} />}
      {joinCaseConfirmModal && <DocumentModal config={joinCaseConfirmConfig} />}
      {joinCasePaymentModal && <DocumentModal config={joinCasePaymentConfig} />}
    </div>
  ) : (
    <div className="tasks-component-table-view">
      {isLoading || isOptionsLoading ? (
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
                      tableView={true}
                    />
                  </Card>
                </div>
              )}
            </React.Fragment>
          )}
          {showSubmitResponseModal && <DocumentModal config={sumbitResponseConfig} />}
          {joinCaseConfirmModal && <DocumentModal config={joinCaseConfirmConfig} />}
          {joinCasePaymentModal && <DocumentModal config={joinCasePaymentConfig} />}
        </React.Fragment>
      ) : (
        <React.Fragment></React.Fragment>
      )}
    </div>
  );
};
export default React.memo(TasksComponent);
