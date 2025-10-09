import React from "react";
import { Link } from "react-router-dom";
import { formatDate } from "../../../cases/src/utils";
import { formatDateDDMMYYYY, formatNoticeDeliveryDate } from "../utils";
import { OrderName } from "@egovernments/digit-ui-module-dristi/src/components/OrderName";
import CustomChip from "@egovernments/digit-ui-module-dristi/src/components/CustomChip";
import OverlayDropdown from "@egovernments/digit-ui-module-dristi/src/components/OverlayDropdown";
import { OrderWorkflowState } from "@egovernments/digit-ui-module-dristi/src/Utils/orderWorkflow";
import { BulkCheckBox } from "@egovernments/digit-ui-module-dristi/src/components/BulkCheckbox";
import { AdvocateName } from "@egovernments/digit-ui-module-dristi/src/components/AdvocateName";
import { modifiedEvidenceNumber } from "@egovernments/digit-ui-module-dristi/src/Utils";
import { ADiaryRowClick } from "@egovernments/digit-ui-module-dristi/src/components/ADiaryRowClick";

const customColumnStyle = { whiteSpace: "nowrap" };

const handleTaskDetails = (taskDetails) => {
  try {
    // Check if taskDetails is a string
    if (typeof taskDetails === "string") {
      // First, remove escape characters like backslashes if present
      const cleanedDetails = taskDetails.replace(/\\n/g, "").replace(/\\/g, "");

      // Try parsing the cleaned string as JSON
      const parsed = JSON.parse(cleanedDetails);

      // If the parsed result is a string, try parsing it again
      if (typeof parsed === "string") {
        try {
          return JSON.parse(parsed);
        } catch (e) {
          return parsed;
        }
      }

      // Return the parsed object if it's already a valid JSON object
      return parsed;
    }

    // If taskDetails is not a string, return it as it is
    return taskDetails;
  } catch (error) {
    console.error("Failed to parse taskDetails:", error);
    return null;
  }
};

const handleNavigate = (path) => {
  const contextPath = window?.contextPath || "";

  window.location.href = `/${contextPath}${path}`;
};

export const UICustomizations = {
  EpostTrackingUiConfig: {
    preProcess: (requestCriteria, additionalDetails) => {
      const ePostTrackerSearchCriteria = {
        ...requestCriteria?.body?.ePostTrackerSearchCriteria,
        processNumber: requestCriteria?.state?.searchForm?.processNumber ? requestCriteria?.state?.searchForm?.processNumber : "",
        deliveryStatusList: requestCriteria?.state?.searchForm?.deliveryStatusList?.selected
          ? [requestCriteria?.state?.searchForm?.deliveryStatusList?.selected]
          : requestCriteria?.body?.ePostTrackerSearchCriteria.deliveryStatusList,
        pagination: {
          sortBy: requestCriteria?.state?.searchForm?.pagination?.sortBy
            ? requestCriteria?.state?.searchForm?.pagination?.sortBy
            : requestCriteria?.body?.ePostTrackerSearchCriteria?.pagination?.sortBy,
          orderBy: requestCriteria?.state?.searchForm?.pagination?.order
            ? requestCriteria?.state?.searchForm?.pagination?.order
            : requestCriteria?.body?.ePostTrackerSearchCriteria?.pagination?.orderBy,
        },
      };
      return {
        ...requestCriteria,
        body: {
          ...requestCriteria?.body,
          ePostTrackerSearchCriteria,
          processNumber: "",
          deliveryStatusList: {},
          pagination: {
            sortBy: "",
            order: "",
          },
        },
        config: {
          ...requestCriteria?.config,
        },
      };
    },
    additionalCustomizations: (row, key, column, value, t, searchResult) => {
      switch (key) {
        case "Delivery Status":
          return t(value);
        default:
          return t("ES_COMMON_NA");
      }
    },
  },
  SearchHearingsConfig: {
    customValidationCheck: (data) => {
      const { createdFrom, createdTo } = data;
      if ((createdFrom === "" && createdTo !== "") || (createdFrom !== "" && createdTo === ""))
        return { warning: true, label: "ES_COMMON_ENTER_DATE_RANGE" };

      return false;
    },
    preProcess: (data) => {
      return data;
    },
    additionalCustomizations: (row, key, column, value, t, searchResult) => {
      switch (key) {
        case "MASTERS_WAGESEEKER_ID":
          return (
            <span className="link">
              <Link to={`/${window.contextPath}/employee/masters/view-wageseeker?tenantId=${row?.tenantId}&individualId=${value}`}>
                {String(value ? (column.translate ? t(column.prefix ? `${column.prefix}${value}` : value) : value) : t("ES_COMMON_NA"))}
              </Link>
            </span>
          );

        case "MASTERS_SOCIAL_CATEGORY":
          return value ? <span style={customColumnStyle}>{String(t(`MASTERS_${value}`))}</span> : t("ES_COMMON_NA");

        case "CORE_COMMON_PROFILE_CITY":
          return value ? <span style={customColumnStyle}>{String(t(Digit.Utils.locale.getCityLocale(value)))}</span> : t("ES_COMMON_NA");

        case "MASTERS_WARD":
          return value ? (
            <span style={customColumnStyle}>{String(t(Digit.Utils.locale.getMohallaLocale(value, row?.tenantId)))}</span>
          ) : (
            t("ES_COMMON_NA")
          );

        case "MASTERS_LOCALITY":
          return value ? (
            <span style={customColumnStyle}>{String(t(Digit.Utils.locale.getMohallaLocale(value, row?.tenantId)))}</span>
          ) : (
            t("ES_COMMON_NA")
          );
        default:
          return t("ES_COMMON_NA");
      }
    },
    MobileDetailsOnClick: (row, tenantId) => {
      let link;
      Object.keys(row).map((key) => {
        if (key === "MASTERS_WAGESEEKER_ID")
          link = `/${window.contextPath}/employee/masters/view-wageseeker?tenantId=${tenantId}&wageseekerId=${row[key]}`;
      });
      return link;
    },
    additionalValidations: (type, data, keys) => {
      if (type === "date") {
        return data[keys.start] && data[keys.end] ? () => new Date(data[keys.start]).getTime() <= new Date(data[keys.end]).getTime() : true;
      }
    },
  },
  homeLitigantUiConfig: {
    customValidationCheck: (data) => {
      //checking both to and from date are present
      const { createdFrom, createdTo } = data;
      if ((createdFrom === "" && createdTo !== "") || (createdFrom !== "" && createdTo === ""))
        return { warning: true, label: "ES_COMMON_ENTER_DATE_RANGE" };
      else if (!data?.filingNumber?.trim() && !data?.caseType?.trim() && !data?.caseSearchText?.trim())
        return { label: "PlEASE_APPLY_FILTER_CASE_ID", error: true };
      return false;
    },
    preProcess: (requestCriteria, additionalDetails) => {
      // We need to change tenantId "processSearchCriteria" here
      const tenantId = window?.Digit.ULBService.getStateId();
      const { data: outcomeTypeData } = Digit.Hooks.useCustomMDMS(Digit.ULBService.getStateId(), "case", [{ name: "OutcomeType" }], {
        select: (data) => {
          return (data?.case?.OutcomeType || []).flatMap((item) => {
            return item?.judgementList?.length > 0 ? item.judgementList : [item?.outcome];
          });
        },
      });
      const criteria = {
        ...requestCriteria?.body?.criteria,
        ...requestCriteria?.state?.searchForm,
        tenantId,
        ...additionalDetails,
        ...("sortBy" in additionalDetails && {
          [additionalDetails.sortBy]: undefined,
          sortBy: undefined,
        }),
        ...(requestCriteria?.body?.criteria?.outcome && {
          outcome: outcomeTypeData,
        }),
        ...(requestCriteria?.state?.searchForm?.outcome && {
          outcome: [requestCriteria?.state?.searchForm?.outcome?.outcome],
        }),
        ...(requestCriteria?.state?.searchForm?.substage && {
          substage: requestCriteria?.state?.searchForm?.substage?.code,
        }),
        pagination: {
          limit: requestCriteria?.state?.tableForm?.limit,
          offSet: requestCriteria?.state?.tableForm?.offset,
          ...("sortBy" in additionalDetails && {
            ...requestCriteria?.state?.searchForm[additionalDetails.sortBy],
          }),
        },
      };
      return {
        ...requestCriteria,
        body: {
          ...requestCriteria?.body,
          ...(requestCriteria?.state?.searchForm?.substage && {
            substage: requestCriteria?.state?.searchForm?.substage?.code,
          }),
          criteria,
          tenantId,
        },
        config: {
          ...requestCriteria?.config,
          select: (data) => {
            return { ...data, totalCount: data?.pagination?.totalCount };
          },
        },
      };
    },
    additionalCustomizations: (row, key, column, value, t, searchResult) => {
      const today = new Date();
      const formattedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const caseId = (row?.isLPRCase ? row?.lprNumber : row?.courtCaseNumber) || row?.courtCaseNumber || row?.cmpNumber || row?.filingNumber;
      switch (key) {
        case "Draft Name":
        case "CS_CASE_NAME":
          return (
            <span className="case-name-on-hover">
              {row?.caseTitle ? (row?.caseTitle?.trim().endsWith("vs") ? `${row?.caseTitle} _______` : row?.caseTitle) : t("CASE_UNTITLED")}
            </span>
          );
        case "CASE_TYPE":
          return <span>NIA S138</span>;
        case "CS_OUTCOME":
          return t(value);
        case "CS_STAGE":
          return t(value);
        case "CS_FILING_DATE":
          return <span>{formatDate(new Date(value))}</span>;
        case "CS_CASE_NUMBER_HOME":
          return caseId;
        case "CS_LAST_EDITED":
          const createdAt = new Date(value);
          const formattedCreatedAt = new Date(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate());
          const differenceInTime = formattedToday.getTime() - formattedCreatedAt.getTime();
          const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
          return <span>{differenceInDays} Days ago</span>;
        default:
          return t("ES_COMMON_NA");
      }
    },
    MobileDetailsOnClick: (row, tenantId) => {
      let link;
      Object.keys(row).map((key) => {
        if (key === "MASTERS_WAGESEEKER_ID")
          link = `/${window.contextPath}/employee/masters/view-wageseeker?tenantId=${tenantId}&wageseekerId=${row[key]}`;
      });
      return link;
    },
    additionalValidations: (type, data, keys) => {
      if (type === "date") {
        return data[keys.start] && data[keys.end] ? () => new Date(data[keys.start]).getTime() <= new Date(data[keys.end]).getTime() : true;
      }
    },
  },
  homeFSOUiConfig: {
    customValidationCheck: (data) => {
      //checking both to and from date are present
      const { createdFrom, createdTo } = data;
      if ((createdFrom === "" && createdTo !== "") || (createdFrom !== "" && createdTo === ""))
        return { warning: true, label: "ES_COMMON_ENTER_DATE_RANGE" };
      return false;
    },
    preProcess: (requestCriteria, additionalDetails) => {
      // We need to change tenantId "processSearchCriteria" here
      const tenantId = window?.Digit.ULBService.getStateId();
      const criteria = {
        ...requestCriteria?.body?.criteria,
        ...requestCriteria?.state?.searchForm,
        ...(requestCriteria?.state?.searchForm?.substage && {
          substage: requestCriteria?.state?.searchForm?.substage?.code,
        }),
        tenantId,
        ...additionalDetails,
        ...("sortBy" in additionalDetails && {
          [additionalDetails.sortBy]: undefined,
          sortBy: undefined,
        }),
        pagination: {
          limit: requestCriteria?.state?.tableForm?.limit,
          offSet: requestCriteria?.state?.tableForm?.offset,
          ...("sortBy" in additionalDetails && {
            ...requestCriteria?.state?.searchForm[additionalDetails.sortBy],
          }),
        },
      };
      return {
        ...requestCriteria,
        body: {
          ...requestCriteria?.body,
          ...(requestCriteria?.state?.searchForm?.substage && {
            substage: requestCriteria?.state?.searchForm?.substage?.code,
          }),
          criteria,
          tenantId,
        },
        config: {
          ...requestCriteria?.config,
          select: (data) => {
            return { ...data, totalCount: data?.pagination?.totalCount };
          },
        },
      };
    },
    additionalCustomizations: (row, key, column, value, t, searchResult) => {
      const today = new Date();
      const formattedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const caseId = row?.courtCaseNumber || row?.cmpNumber || row?.filingNumber;
      switch (key) {
        case "CASE_TYPE":
          return <span>NIA S138</span>;
        case "CS_STAGE":
          return t(value);
        case "CS_SCRUTINY_STATUS":
          return t(row?.status === "UNDER_SCRUTINY" ? "IN_PROGRESS" : "NOT_STARTED");
        case "CS_CASE_NUMBER_HOME":
          return caseId;
        case "CS_DAYS_FILING":
          const createdAt = new Date(value);
          const formattedCreatedAt = new Date(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate());
          const differenceInTime = formattedToday.getTime() - formattedCreatedAt.getTime();
          const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
          return <span style={{ color: differenceInDays > 2 && "#9E400A", fontWeight: differenceInDays > 2 ? 500 : 400 }}>{differenceInDays}</span>;
        default:
          return t("ES_COMMON_NA");
      }
    },
    MobileDetailsOnClick: (row, tenantId) => {
      let link;
      Object.keys(row).map((key) => {
        if (key === "MASTERS_WAGESEEKER_ID")
          link = `/${window.contextPath}/employee/masters/view-wageseeker?tenantId=${tenantId}&wageseekerId=${row[key]}`;
      });
      return link;
    },
    additionalValidations: (type, data, keys) => {
      if (type === "date") {
        return data[keys.start] && data[keys.end] ? () => new Date(data[keys.start]).getTime() <= new Date(data[keys.end]).getTime() : true;
      }
    },
  },
  homeJudgeUIConfig: {
    customValidationCheck: (data) => {
      //checking both to and from date are present
      const { createdFrom, createdTo } = data;
      if ((createdFrom === "" && createdTo !== "") || (createdFrom !== "" && createdTo === ""))
        return { warning: true, label: "ES_COMMON_ENTER_DATE_RANGE" };
      return false;
    },
    preProcess: (requestCriteria, additionalDetails) => {
      const tenantId = window?.Digit.ULBService.getStateId();
      const { data: outcomeTypeData } = Digit.Hooks.useCustomMDMS(Digit.ULBService.getStateId(), "case", [{ name: "OutcomeType" }], {
        select: (data) => {
          return (data?.case?.OutcomeType || []).flatMap((item) => {
            return item?.judgementList?.length > 0 ? item.judgementList : [item?.outcome];
          });
        },
      });
      const criteria = {
        ...requestCriteria?.body?.criteria,
        ...requestCriteria?.state?.searchForm,
        tenantId,
        ...additionalDetails,
        ...("sortBy" in additionalDetails && {
          [additionalDetails.sortBy]: undefined,
          sortBy: undefined,
        }),
        ...(requestCriteria?.body?.criteria?.outcome && {
          outcome: outcomeTypeData,
        }),
        ...(requestCriteria?.state?.searchForm?.outcome && {
          outcome: [requestCriteria?.state?.searchForm?.outcome?.outcome],
        }),
        ...(requestCriteria?.state?.searchForm?.substage && {
          substage: requestCriteria?.state?.searchForm?.substage?.code,
        }),
        pagination: {
          limit: requestCriteria?.state?.tableForm?.limit,
          offSet: requestCriteria?.state?.tableForm?.offset,
          ...("sortBy" in additionalDetails && {
            ...requestCriteria?.state?.searchForm[additionalDetails.sortBy],
          }),
        },
      };
      return {
        ...requestCriteria,
        body: {
          ...requestCriteria?.body,
          ...(requestCriteria?.state?.searchForm?.substage && {
            substage: requestCriteria?.state?.searchForm?.substage?.code,
          }),
          criteria,
          tenantId,
        },
        config: {
          ...requestCriteria?.config,
          select: (data) => {
            return { ...data, totalCount: data?.pagination?.totalCount };
          },
        },
      };
    },
    additionalCustomizations: (row, key, column, value, t, searchResult) => {
      const today = new Date();
      const formattedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const caseId = (row?.isLPRCase ? row?.lprNumber : row?.courtCaseNumber) || row?.courtCaseNumber || row?.cmpNumber || row?.filingNumber;
      switch (key) {
        case "CASE_TYPE":
          return <span>NIA S138</span>;
        case "CS_FILING_DATE":
          return <span>{formatDate(new Date(value))}</span>;
        case "CD_OUTCOME":
          return t(value);
        case "CS_STAGE":
          return t(value);
        case "CS_SCRUTINY_STATUS":
          return t(row?.status === "UNDER_SCRUTINY" ? "IN_PROGRESS" : "NOT_STARTED");
        case "CS_CASE_NUMBER_HOME":
          return caseId;
        case "CS_DAYS_FILING":
          const createdAt = new Date(value);
          const formattedCreatedAt = new Date(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate());
          const differenceInTime = formattedToday.getTime() - formattedCreatedAt.getTime();
          const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
          return <span style={{ color: differenceInDays > 2 && "#9E400A", fontWeight: differenceInDays > 2 ? 500 : 400 }}>{differenceInDays}</span>;
        default:
          return t("ES_COMMON_NA");
      }
    },
    MobileDetailsOnClick: (row, tenantId) => {
      let link;
      Object.keys(row).map((key) => {
        if (key === "MASTERS_WAGESEEKER_ID")
          link = `/${window.contextPath}/employee/masters/view-wageseeker?tenantId=${tenantId}&wageseekerId=${row[key]}`;
      });
      return link;
    },
    additionalValidations: (type, data, keys) => {
      if (type === "date") {
        return data[keys.start] && data[keys.end] ? () => new Date(data[keys.start]).getTime() <= new Date(data[keys.end]).getTime() : true;
      }
    },
  },
  reviewSummonWarrantNotice: {
    preProcess: (requestCriteria, additionalDetails) => {
      let filterList = Object.keys(requestCriteria.state.searchForm)
        ?.map((key) => {
          if (key === "applicationStatus") return null;
          if (requestCriteria.state.searchForm[key]) return { [key]: requestCriteria.state.searchForm[key] };
        })
        ?.filter((filter) => filter)
        .reduce(
          (fieldObj, item) => ({
            ...fieldObj,
            ...item,
          }),
          {}
        );
      // Remove UI-only fields that should not be sent to backend as-is
      if (filterList?.channel) delete filterList.channel;
      if (filterList?.deliveryChannel) delete filterList.deliveryChannel;
      if (filterList?.hearingDate) delete filterList.hearingDate;
      if (filterList?.applicationStatus) delete filterList.applicationStatus;
      const tenantId = window?.Digit.ULBService.getStateId();
      const { data: sentData } = Digit.Hooks.useCustomMDMS(Digit.ULBService.getStateId(), "Order", [{ name: "SentStatus" }], {
        select: (data) => {
          return (data?.Order?.SentStatus || []).flatMap((item) => {
            return [item?.code];
          });
        },
      });
      let completeStatusData = requestCriteria.body?.criteria?.completeStatus || [];
      const isCompleteStatus = Boolean(Object.keys(filterList?.completeStatus || {}).length);
      const isIssueDate = Boolean(Object.keys(filterList?.sortCaseListByDate || {}).length);
      const courtId = requestCriteria?.body?.criteria?.courtId;

      const searchForm = requestCriteria?.state?.searchForm || {};
      const noticeType = searchForm?.noticeType?.code || searchForm?.noticeType?.name || null;
      const deliveryChanel = searchForm?.channel?.name === "EPOST" ? "POST" : searchForm?.channel?.name || null;
      const hearingDate = searchForm?.hearingDate ? new Date(`${searchForm.hearingDate}T05:30:00`).getTime() : null;
      const activeTabIndex = additionalDetails?.activeTabIndex || 0;
      const compStatus = searchForm?.compStatus?.code || "";
      if (Array.isArray(completeStatusData)) {
        completeStatusData = compStatus ? [compStatus] : completeStatusData;
      } else {
        completeStatusData = compStatus ? [compStatus] : sentData;
      }
      let resolvedApplicationStatus = "";
      if (activeTabIndex === 0) resolvedApplicationStatus = "SIGN_PENDING";
      else if (activeTabIndex === 1) resolvedApplicationStatus = "SIGNED";

      return {
        ...requestCriteria,
        body: {
          ...requestCriteria.body,
          criteria: {
            ...filterList,
            completeStatus: completeStatusData,
            orderType: filterList?.orderType && filterList?.orderType?.code !== "" ? [filterList?.orderType?.code] : [],
            ...(noticeType && { noticeType }),
            ...(deliveryChanel && { deliveryChanel }),
            ...(hearingDate !== null && { hearingDate }),
            ...(courtId && { courtId }),
            applicationStatus: resolvedApplicationStatus,
          },
          tenantId,
          pagination: {
            limit: requestCriteria?.state?.tableForm?.limit,
            offSet: requestCriteria?.state?.tableForm?.offset,
            ...(isIssueDate && filterList?.sortCaseListByDate),
            sortBy: "lastmodifiedtime",
            order: "desc",
          },
        },
        config: {
          ...requestCriteria?.config,
          select: (data) => {
            return { ...data, list: data?.list?.filter((order) => order.taskType) };
          },
        },
      };
    },
    additionalCustomizations: (row, key, column, value, t, searchResult) => {
      const taskDetails = handleTaskDetails(row?.taskDetails);
      const delieveryDate = formatNoticeDeliveryDate(taskDetails?.deliveryChannels?.statusChangeDate || row?.createdDate);
      const hearingDate = formatNoticeDeliveryDate(taskDetails?.caseDetails?.hearingDate);
      const caseId = (row?.isLPRCase ? row?.lprNumber : row?.courtCaseNumber) || row?.courtCaseNumber || row?.cmpNumber || row?.filingNumber;

      switch (key) {
        // case "CASE_NAME_ID":
        //   return `${row?.caseName}, ${caseId}`;
        case "STATUS":
          return t(value); // document status
        case "ISSUE_DATE":
          return `${formatDate(new Date(value))}`;
        case "PROCESS_TYPE":
          const processType = value?.toUpperCase?.();
          if (processType === "NOTICE") {
            const noticeType = row?.taskDetails?.noticeDetails?.noticeType || "NOTICE";
            return t(noticeType);
          }
          return t(value);
        case "DELIEVERY_CHANNEL":
          return taskDetails?.deliveryChannels?.channelName || "N/A";
        case "DELIEVRY_DATE":
          return delieveryDate || "-";
        case "HEARING_DATE":
          return hearingDate || "-";
        case "CASE_TITLE":
          return (
            <span
              style={{
                textDecoration: "underline",
                cursor: "pointer",
              }}
            >{`${row?.caseName}`}</span>
          );
        case "CS_CASE_NUMBER_HOME":
          return `${caseId}`;
        case "SENT_DATE":
          return taskDetails?.deliveryChannels?.statusChangeDate || "-";
        case "STATUS_UPDATE_DATE":
          return taskDetails?.deliveryChannels?.statusChangeDate || "-";
        case "SELECT":
          return <BulkCheckBox rowData={row} colData={column} isBailBond={true} defaultChecked={false} />;
        default:
          return t("ES_COMMON_NA");
      }
    },
  },

  bulkESignOrderConfig: {
    preProcess: (requestCriteria, additionalDetails) => {
      const tenantId = window?.Digit.ULBService.getStateId();
      const entityType = "Order";
      const caseTitle = requestCriteria?.state?.searchForm?.caseTitle;
      const status = requestCriteria?.state?.searchForm?.status;
      const startOfTheDay = requestCriteria?.state?.searchForm?.startOfTheDay;
      const courtId = requestCriteria?.body?.inbox?.moduleSearchCriteria?.courtId;

      const moduleSearchCriteria = {
        entityType,
        tenantId,
        ...(caseTitle && { caseTitle }),
        status: status?.type,
        ...(startOfTheDay && {
          startOfTheDay: new Date(startOfTheDay + "T00:00:00").getTime(),
          endOfTheDay: new Date(startOfTheDay + "T23:59:59.999").getTime(),
        }),
        ...(courtId && { courtId }),
      };

      return {
        ...requestCriteria,
        body: {
          ...requestCriteria?.body,
          inbox: {
            ...requestCriteria?.body?.inbox,
            limit: requestCriteria?.state?.tableForm?.limit,
            offset: requestCriteria?.state?.tableForm?.offset,
            tenantId: tenantId,
            moduleSearchCriteria: moduleSearchCriteria,
          },
        },
      };
    },
    additionalCustomizations: (row, key, column, value, t, searchResult) => {
      switch (key) {
        case "TITLE":
          return <OrderName rowData={row} colData={column} value={value} />;
        case "STATUS":
          return <CustomChip text={t(value)} shade={value === OrderWorkflowState.PENDING_BULK_E_SIGN && "orange"} />;
        case "DATE_ADDED":
          const date = new Date(value);
          const day = date.getDate().toString().padStart(2, "0");
          const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Month is zero-based
          const year = date.getFullYear();
          const formattedDate = `${day}-${month}-${year}`;
          return <span>{value && value !== "0" ? formattedDate : ""}</span>;
        case "SELECT":
          return <BulkCheckBox rowData={row} colData={column} isBailBond={true} />;
        case "CS_ACTIONS":
          return <OverlayDropdown position="relative" column={column} row={row} master="commonUiConfig" module="bulkESignOrderConfig" />;
        default:
          break;
      }
    },
    dropDownItems: (row, column, t) => {
      return [
        {
          label: t("DELETE_BULK_ORDER"),
          id: "delete_order",
          hide: false,
          disabled: false,
          action: (history, column, row, item) => {
            column?.clickFunc(row);
          },
        },
      ];
    },
  },

  bulkADiarySignConfig: {
    preProcess: (requestCriteria, additionalDetails) => {
      const date = new Date(requestCriteria?.state?.searchForm?.date + "T00:00:00").getTime();
      const fetchEntries = additionalDetails?.fetchEntries;
      const setDiaryEntries = additionalDetails?.setDiaryEntries;
      const courtId = localStorage.getItem("courtId");

      return {
        ...requestCriteria,
        body: {
          ...requestCriteria?.body,
          criteria: {
            ...requestCriteria?.body?.criteria,
            date,
            courtId,
          },
        },
        config: {
          ...requestCriteria.config,
          select: (data) => {
            fetchEntries(date);
            setDiaryEntries(data?.entries || []);

            return {
              ...data,
              totalCount: data?.pagination?.totalCount,
            };
          },
        },
      };
    },
    additionalCustomizations: (row, key, column, value, t, searchResult) => {
      switch (key) {
        case "CASE_NUMBER":
          return <span>{value || ""}</span>;

        case "PROCEEDINGS_OR_BUSINESS_OF_DAY":
          return <ADiaryRowClick rowData={row} colData={column} value={value} />;

        case "NEXT_HEARING_DATE":
          return <span>{value ? formatDateDDMMYYYY(value) : ""}</span>;
        default:
          return value || "";
      }
    },
  },

  registerUserHomeConfig: {
    customValidationCheck: (data) => {
      return !data?.applicationNumber_WILDCARD.trim() ? { label: "Please enter a valid application Number", error: true } : false;
    },
    preProcess: (requestCriteria, additionalDetails) => {
      const moduleSearchCriteria = {
        ...requestCriteria?.body?.inbox?.moduleSearchCriteria,
        ...requestCriteria?.state?.searchForm,
        tenantId: window?.Digit.ULBService.getStateId(),
      };
      delete moduleSearchCriteria.userType;
      if (additionalDetails in moduleSearchCriteria && !moduleSearchCriteria[additionalDetails]) {
        delete moduleSearchCriteria[additionalDetails];
      }
      return {
        ...requestCriteria,
        body: {
          ...requestCriteria?.body,
          inbox: {
            ...requestCriteria?.body?.inbox,
            moduleSearchCriteria: {
              ...moduleSearchCriteria,
            },
            processSearchCriteria: {
              ...requestCriteria?.body?.inbox?.processSearchCriteria,
              tenantId: window?.Digit.ULBService.getStateId(),
            },
            tenantId: window?.Digit.ULBService.getStateId(),
          },
        },
      };
    },
    additionalValidations: (type, data, keys) => {
      if (type === "date") {
        return data[keys.start] && data[keys.end] ? () => new Date(data[keys.start]).getTime() <= new Date(data[keys.end]).getTime() : true;
      }
    },
    MobileDetailsOnClick: (row, tenantId) => {
      let link;
      Object.keys(row).map((key) => {
        if (key === "APPLICATION_NO") link = ``;
      });
      return link;
    },
    additionalCustomizations: (row, key, column, value, t, searchResult) => {
      const usertype = row?.ProcessInstance?.businessService.includes("clerk") ? "clerk" : "advocate";
      const individualId = row?.businessObject?.individual?.individualId;
      const applicationNumber =
        row?.businessObject?.advocateDetails?.applicationNumber || row?.businessObject?.clerkDetails?.applicationNumber || row?.applicationNumber;

      const today = new Date();
      const formattedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      switch (key) {
        case "APPLICATION_NO":
          return (
            <span className="link">
              <Link
                to={`/${window?.contextPath}/employee/dristi/registration-requests/details?applicationNo=${value}&individualId=${individualId}&type=${usertype}`}
              >
                {String(value ? (column?.translate ? t(column?.prefix ? `${column?.prefix}${value}` : value) : value) : t("ES_COMMON_NA"))}
              </Link>
            </span>
          );
        case "ACTION":
          return (
            <Link
              to={`/${window?.contextPath}/employee/dristi/registration-requests/details?applicationNo=${applicationNumber}&individualId=${value}&type=${usertype}`}
            >
              <span className="action-link"> {t("CS_VERIFY")}</span>
            </Link>
          );
        case "USER_TYPE":
          return usertype === "clerk" ? t("ADVOCATE CLERK") : t("ADVOCATE");
        case "DATE_CREATED":
          const date = new Date(value);
          const day = date.getDate().toString().padStart(2, "0");
          const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Month is zero-based
          const year = date.getFullYear();
          const formattedDate = `${day}-${month}-${year}`;
          return <span>{formattedDate}</span>;
        case "DUE_SINCE_IN_DAYS":
          const createdAt = new Date(row?.businessObject?.auditDetails?.createdTime);
          const formattedCreatedAt = new Date(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate());
          const differenceInTime = formattedToday.getTime() - formattedCreatedAt.getTime();
          const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
          return <span>{differenceInDays}</span>;
        case "USER_NAME":
          const displayName = `${value?.givenName || ""} ${value?.otherNames || ""} ${value?.familyName || ""}`;
          return displayName;
        default:
          return t("ES_COMMON_NA");
      }
    },
  },

  bulkBailBondSignConfig: {
    preProcess: (requestCriteria, additionalDetails) => {
      const tenantId = window?.Digit.ULBService.getStateId();

      const effectiveSearchForm = requestCriteria?.state?.searchForm || {};
      const caseTitle = sessionStorage.getItem("bulkBailBondSignCaseTitle") || effectiveSearchForm?.caseTitle;
      const courtId = requestCriteria?.body?.inbox?.moduleSearchCriteria?.courtId;
      const setbulkBailBondSignList = additionalDetails?.setbulkBailBondSignList;
      const setBailBondPaginationData = additionalDetails?.setBailBondPaginationData;
      const setNeedConfigRefresh = additionalDetails?.setNeedConfigRefresh;
      const limit = parseInt(sessionStorage.getItem("bulkBailBondSignlimit")) || parseInt(requestCriteria?.state?.tableForm?.limit) || 10;
      const offset = parseInt(sessionStorage.getItem("bulkBailBondSignoffset")) || parseInt(requestCriteria?.state?.tableForm?.offset) || 0;

      const moduleSearchCriteria = {
        // entityType,
        tenantId,
        status: "PENDING_REVIEW",
        ...(caseTitle && { searchableFields: caseTitle }),
        ...(courtId && { courtId }),
      };
      const bulkBailBondSignCaseTitle = requestCriteria?.state?.searchForm && requestCriteria?.state?.searchForm?.caseTitle;

      return {
        ...requestCriteria,
        body: {
          ...requestCriteria?.body,
          inbox: {
            ...requestCriteria?.body?.inbox,
            limit: limit,
            offset: offset,
            tenantId: tenantId,
            moduleSearchCriteria: moduleSearchCriteria,
          },
        },
        config: {
          ...requestCriteria.config,
          select: (data) => {
            const bailBondItems = data?.items?.map((item) => {
              return {
                ...item,
                isSelected: true,
              };
            });
            sessionStorage.removeItem("bulkBailBondSignlimit");
            sessionStorage.removeItem("bulkBailBondSignoffset");
            if (sessionStorage.getItem("bulkBailBondSignCaseTitle")) {
              sessionStorage.removeItem("bulkBailBondSignCaseTitle"); //we are storing this for search inbox
              setNeedConfigRefresh((prev) => !prev);
            }

            if (setbulkBailBondSignList) setbulkBailBondSignList(bailBondItems);
            if (setBailBondPaginationData) setBailBondPaginationData({ limit: limit, offset: offset, caseTitle: bulkBailBondSignCaseTitle });

            return {
              ...data,
              items: bailBondItems,
            };
          },
        },
      };
    },

    additionalCustomizations: (row, key, column, value, t, searchResult) => {
      switch (key) {
        case "CASE_TITLE":
          return <OrderName rowData={row} colData={column} value={value} />;
        // return <BailBondSignModal rowData={row} colData={column} value={value} />;
        case "LITIGANT":
          return value || "";
        case "CS_CASE_NUMBER_HOME":
          return <span>{value || ""}</span>;
        case "SELECT":
          return <BulkCheckBox rowData={row} colData={column} isBailBond={true} />;
        default:
          return value || "";
      }
    },
  },

  bulkWitnessDepositionSignConfig: {
    preProcess: (requestCriteria, additionalDetails) => {
      const tenantId = window?.Digit.ULBService.getStateId();

      const effectiveSearchForm = requestCriteria?.state?.searchForm || {};
      const caseTitle = sessionStorage.getItem("bulkWitnessDepositionSignCaseTitle") || effectiveSearchForm?.caseTitle;
      const courtId = requestCriteria?.body?.inbox?.moduleSearchCriteria?.courtId;
      const setbulkWitnessDepositionSignList = additionalDetails?.setbulkWitnessDepositionSignList;
      const setWitnessDepositionPaginationData = additionalDetails?.setWitnessDepositionPaginationData;
      const setNeedConfigRefresh = additionalDetails?.setNeedConfigRefresh;
      const limit = parseInt(sessionStorage.getItem("bulkWitnessDepositionSignlimit")) || parseInt(requestCriteria?.state?.tableForm?.limit) || 10;
      const offset = parseInt(sessionStorage.getItem("bulkWitnessDepositionSignoffset")) || parseInt(requestCriteria?.state?.tableForm?.offset) || 0;

      const moduleSearchCriteria = {
        // entityType,
        tenantId,
        status: "PENDING_REVIEW",
        ...(caseTitle && { searchableFields: caseTitle }),
        ...(courtId && { courtId }),
      };
      const bulkWitnessDepositionSignCaseTitle = requestCriteria?.state?.searchForm && requestCriteria?.state?.searchForm?.caseTitle;

      return {
        ...requestCriteria,
        body: {
          ...requestCriteria?.body,
          inbox: {
            ...requestCriteria?.body?.inbox,
            limit: limit,
            offset: offset,
            tenantId: tenantId,
            moduleSearchCriteria: moduleSearchCriteria,
          },
        },
        config: {
          ...requestCriteria.config,
          select: (data) => {
            const witnessDepositionItems = data?.items?.map((item) => {
              return {
                ...item,
                isSelected: true,
              };
            });
            sessionStorage.removeItem("bulkWitnessDepositionSignlimit");
            sessionStorage.removeItem("bulkWitnessDepositionSignoffset");
            if (sessionStorage.getItem("bulkWitnessDepositionSignCaseTitle")) {
              sessionStorage.removeItem("bulkWitnessDepositionSignCaseTitle"); //we are storing this for search inbox
              setNeedConfigRefresh((prev) => !prev);
            }

            if (setbulkWitnessDepositionSignList) setbulkWitnessDepositionSignList(witnessDepositionItems);
            if (setWitnessDepositionPaginationData)
              setWitnessDepositionPaginationData({ limit: limit, offset: offset, caseTitle: bulkWitnessDepositionSignCaseTitle });

            return {
              ...data,
              items: witnessDepositionItems,
            };
          },
        },
      };
    },

    additionalCustomizations: (row, key, column, value, t, searchResult) => {
      switch (key) {
        case "CASE_TITLE":
          return <OrderName rowData={row} colData={column} value={value} />;
        case "CS_CASE_NUMBER_HOME":
          return <span>{value || ""}</span>;
        case "WITNESS_NAME":
          return <span>{value || ""}</span>;
        case "DATE_OF_DEPOSITION":
          return formatNoticeDeliveryDate(value);
        case "ADVOCATES":
          return <AdvocateName value={value} />;
        case "SELECT":
          return <BulkCheckBox rowData={row} colData={column} isBailBond={true} />;
        default:
          return value || "";
      }
    },
  },

  BulkMarkAsEvidenceConfig: {
    preProcess: (requestCriteria, additionalDetails) => {
      const tenantId = window?.Digit.ULBService.getStateId();
      const effectiveSearchForm = requestCriteria?.state?.searchForm || {};
      const caseTitle = sessionStorage.getItem("bulkMarkAsEvidenceCaseTitle") || effectiveSearchForm?.caseTitle;
      const courtId = requestCriteria?.body?.inbox?.moduleSearchCriteria?.courtId;
      const setMarkAsEvidenceSignList = additionalDetails?.setbulkEvidenceList;
      const setMarkAsEvidencePaginationData = additionalDetails?.setMarkAsEvidencePaginationData;
      const setNeedConfigRefresh = additionalDetails?.setNeedConfigRefresh;
      const limit = parseInt(sessionStorage.getItem("bulkMarkAsEvidenceLimit")) || parseInt(requestCriteria?.state?.tableForm?.limit) || 10;
      const offset = parseInt(sessionStorage.getItem("bulkMarkAsEvidenceOffset")) || parseInt(requestCriteria?.state?.tableForm?.offset) || 0;

      const moduleSearchCriteria = {
        tenantId,
        evidenceMarkedStatus: "PENDING_BULK_E-SIGN",
        ...(caseTitle && { searchableFields: caseTitle }),
        ...(courtId && { courtId }),
      };
      const bulkEvidenceCaseTitle = requestCriteria?.state?.searchForm && requestCriteria?.state?.searchForm?.caseTitle;

      return {
        ...requestCriteria,
        body: {
          ...requestCriteria?.body,
          inbox: {
            ...requestCriteria?.body?.inbox,
            limit: limit,
            offset: offset,
            tenantId: tenantId,
            moduleSearchCriteria: moduleSearchCriteria,
          },
        },
        config: {
          ...requestCriteria.config,
          select: (data) => {
            const markAsEvidenceItems = data?.items?.map((item) => {
              return {
                ...item,
                isSelected: true,
              };
            });
            sessionStorage.removeItem("bulkMarkAsEvidenceLimit");
            sessionStorage.removeItem("bulkMarkAsEvidenceOffset");
            if (sessionStorage.getItem("bulkMarkAsEvidenceCaseTitle")) {
              sessionStorage.removeItem("bulkMarkAsEvidenceCaseTitle"); //we are storing this for search inbox
              setNeedConfigRefresh((prev) => !prev);
            }

            if (setMarkAsEvidenceSignList) setMarkAsEvidenceSignList(markAsEvidenceItems);
            if (setMarkAsEvidencePaginationData) setMarkAsEvidencePaginationData({ limit: limit, offset: offset, caseTitle: bulkEvidenceCaseTitle });

            return {
              ...data,
              items: markAsEvidenceItems,
            };
          },
        },
      };
    },

    additionalCustomizations: (row, key, column, value, t, searchResult) => {
      switch (key) {
        case "CASE_TITLE":
          return <OrderName rowData={row} colData={column} value={value} />;
        case "DOCUMENT_HEADING":
          return row?.businessObject?.artifactDetails?.additionalDetails?.formdata?.documentTitle || t(value) || "";
        case "SELECT":
          return <BulkCheckBox rowData={row} colData={column} isBailBond={true} />;
        case "EVIDENCE_NUMBER":
          return modifiedEvidenceNumber(value, row?.businessObject?.artifactDetails?.filingNumber);
        default:
          return value || "";
      }
    },
  },
};
