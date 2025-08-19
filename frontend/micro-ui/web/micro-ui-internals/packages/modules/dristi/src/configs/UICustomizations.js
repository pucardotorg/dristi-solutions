import { ArrowDirection } from "@egovernments/digit-ui-react-components";
import React from "react";
import { Link } from "react-router-dom";
import { Evidence } from "../components/Evidence";
import { OrderName } from "../components/OrderName";
import { OwnerColumn } from "../components/OwnerColumn";
import { RenderInstance } from "../components/RenderInstance";
import OverlayDropdown from "../components/OverlayDropdown";
import CustomChip from "../components/CustomChip";
import ActionEdit from "../components/ActionEdit";
import ReactTooltip from "react-tooltip";
import { getDate, modifiedEvidenceNumber, removeInvalidNameParts } from "../Utils";
import { HearingWorkflowState } from "@egovernments/digit-ui-module-orders/src/utils/hearingWorkflow";
import { constructFullName } from "@egovernments/digit-ui-module-orders/src/utils";
import { getAdvocates } from "../pages/citizen/FileCase/EfilingValidationUtils";
import { OrderWorkflowState } from "../Utils/orderWorkflow";
import { getFullName } from "../../../cases/src/utils/joinCaseUtils";
import BailBondModal from "../../../home/src/pages/employee/BailBondModal";

const businessServiceMap = {
  "muster roll": "MR",
};

const inboxModuleNameMap = {
  "muster-roll-approval": "muster-roll-service",
};

const userRoles = Digit.UserService.getUser()?.info?.roles.map((role) => role.code);

const partyTypes = {
  "complainant.primary": "COMPLAINANT",
  "complainant.additional": "COMPLAINANT",
  "respondent.primary": "ACCUSED",
  "respondent.additional": "ACCUSED",
  "poa.regular": "POA_HOLDER",
};

export const advocateJoinStatus = {
  PENDING: "PENDING",
  PARTIALLY_PENDING: "PARTIALLY_PENDING",
  JOINED: "JOINED",
};

const getCaseNumber = (billDetails = {}) => {
  const isValid = (val) => val && !["null", "undefined", ""].includes(val?.toString()?.trim());

  const { courtCaseNumber, cmpNumber, caseTitleFilingNumber } = billDetails;

  const filingNumber = caseTitleFilingNumber?.split(",")?.[1]?.trim();

  if (isValid(courtCaseNumber)) return courtCaseNumber;
  if (isValid(cmpNumber)) return cmpNumber;
  if (isValid(filingNumber)) return filingNumber;

  return "";
};

export const UICustomizations = {
  businessServiceMap,
  updatePayload: (applicationDetails, data, action, businessService) => {
    if (businessService === businessServiceMap.estimate) {
      const workflow = {
        comment: data?.comments,
        documents: data?.documents?.map((document) => {
          return {
            documentType: action?.action + " DOC",
            fileName: document?.[1]?.file?.name,
            fileStoreId: document?.[1]?.fileStoreId?.fileStoreId,
            documentUid: document?.[1]?.fileStoreId?.fileStoreId,
            tenantId: document?.[1]?.fileStoreId?.tenantId,
          };
        }),
        assignees: data?.assignees?.uuid ? [data?.assignees?.uuid] : null,
        action: action?.action,
      };
      //filtering out the data
      Object.keys(workflow).forEach((key, index) => {
        if (!workflow[key] || workflow[key]?.length === 0) delete workflow[key];
      });

      return {
        estimate: applicationDetails,
        workflow,
      };
    }
    if (businessService === businessServiceMap.contract) {
      const workflow = {
        comment: data?.comments,
        documents: data?.documents?.map((document) => {
          return {
            documentType: action?.action + " DOC",
            fileName: document?.[1]?.file?.name,
            fileStoreId: document?.[1]?.fileStoreId?.fileStoreId,
            documentUid: document?.[1]?.fileStoreId?.fileStoreId,
            tenantId: document?.[1]?.fileStoreId?.tenantId,
          };
        }),
        assignees: data?.assignees?.uuid ? [data?.assignees?.uuid] : null,
        action: action?.action,
      };
      //filtering out the data
      Object.keys(workflow).forEach((key, index) => {
        if (!workflow[key] || workflow[key]?.length === 0) delete workflow[key];
      });

      return {
        contract: applicationDetails,
        workflow,
      };
    }
    if (businessService === businessServiceMap?.["muster roll"]) {
      const workflow = {
        comment: data?.comments,
        documents: data?.documents?.map((document) => {
          return {
            documentType: action?.action + " DOC",
            fileName: document?.[1]?.file?.name,
            fileStoreId: document?.[1]?.fileStoreId?.fileStoreId,
            documentUid: document?.[1]?.fileStoreId?.fileStoreId,
            tenantId: document?.[1]?.fileStoreId?.tenantId,
          };
        }),
        assignees: data?.assignees?.uuid ? [data?.assignees?.uuid] : null,
        action: action?.action,
      };
      //filtering out the data
      Object.keys(workflow).forEach((key, index) => {
        if (!workflow[key] || workflow[key]?.length === 0) delete workflow[key];
      });

      return {
        musterRoll: applicationDetails,
        workflow,
      };
    }
    if (businessService === businessServiceMap?.["works.purchase"]) {
      const workflow = {
        comment: data?.comments,
        documents: data?.documents?.map((document) => {
          return {
            documentType: action?.action + " DOC",
            fileName: document?.[1]?.file?.name,
            fileStoreId: document?.[1]?.fileStoreId?.fileStoreId,
            documentUid: document?.[1]?.fileStoreId?.fileStoreId,
            tenantId: document?.[1]?.fileStoreId?.tenantId,
          };
        }),
        assignees: data?.assignees?.uuid ? [data?.assignees?.uuid] : null,
        action: action?.action,
      };
      //filtering out the data
      Object.keys(workflow).forEach((key, index) => {
        if (!workflow[key] || workflow[key]?.length === 0) delete workflow[key];
      });

      const additionalFieldsToSet = {
        projectId: applicationDetails.additionalDetails.projectId,
        invoiceDate: applicationDetails.billDate,
        invoiceNumber: applicationDetails.referenceId.split("_")?.[1],
        contractNumber: applicationDetails.referenceId.split("_")?.[0],
        documents: applicationDetails.additionalDetails.documents,
      };
      return {
        bill: { ...applicationDetails, ...additionalFieldsToSet },
        workflow,
      };
    }
  },
  enableModalSubmit: (businessService, action, setModalSubmit, data) => {
    if (businessService === businessServiceMap?.["muster roll"] && action?.action === "APPROVE") {
      setModalSubmit(data?.acceptTerms);
    }
  },
  getBusinessService: (moduleCode) => {
    if (moduleCode?.includes("estimate")) {
      return businessServiceMap?.estimate;
    } else if (moduleCode?.includes("contract")) {
      return businessServiceMap?.contract;
    } else if (moduleCode?.includes("muster roll")) {
      return businessServiceMap?.["muster roll"];
    } else if (moduleCode?.includes("works.purchase")) {
      return businessServiceMap?.["works.purchase"];
    } else if (moduleCode?.includes("works.wages")) {
      return businessServiceMap?.["works.wages"];
    } else if (moduleCode?.includes("works.supervision")) {
      return businessServiceMap?.["works.supervision"];
    } else {
      return businessServiceMap;
    }
  },
  getInboxModuleName: (moduleCode) => {
    if (moduleCode?.includes("estimate")) {
      return inboxModuleNameMap?.estimate;
    } else if (moduleCode?.includes("contract")) {
      return inboxModuleNameMap?.contracts;
    } else if (moduleCode?.includes("attendence")) {
      return inboxModuleNameMap?.attendencemgmt;
    } else {
      return inboxModuleNameMap;
    }
  },
  getAdvocateNameUsingBarRegistrationNumber: {
    getNames: () => {
      return {
        url: "/advocate/v1/status/_search",
        params: { status: "ACTIVE", tenantId: window?.Digit.ULBService.getStateId(), offset: 0, limit: 1000 },
        body: {
          tenantId: window?.Digit.ULBService.getStateId(),
        },
        config: {
          select: (data) => {
            return data.advocates.map((adv) => {
              return {
                icon: (
                  <span className="icon" style={{ display: "flex", justifyContent: "space-between" }}>
                    <span className="icon">{adv?.barRegistrationNumber}</span>
                    <span className="icon" style={{ justifyContent: "end" }}>
                      {removeInvalidNameParts(adv?.additionalDetails?.username)}
                    </span>
                  </span>
                ),
                barRegistrationNumber: `${adv?.barRegistrationNumber} (${removeInvalidNameParts(adv?.additionalDetails?.username)})`,
                advocateName: removeInvalidNameParts(adv?.additionalDetails?.username),
                advocateId: adv?.id,
                barRegistrationNumberOriginal: adv?.barRegistrationNumber,
                advocateUuid: adv?.auditDetails?.createdBy,
                individualId: adv?.individualId,
              };
            });
          },
        },
      };
    },
  },
  getAdvocateNameUsingBarRegistrationNumberJoinCase: {
    getNames: (props) => {
      const removeOptions = props?.removeOptions ? props?.removeOptions : [];
      const removeOptionsKey = props?.removeOptionsKey || "";
      return {
        url: "/advocate/v1/status/_search",
        params: { status: "ACTIVE", tenantId: window?.Digit.ULBService.getStateId(), offset: 0, limit: 1000 },
        body: {
          tenantId: window?.Digit.ULBService.getStateId(),
        },
        config: {
          select: (data) => {
            return data.advocates
              .filter((adv) => !removeOptions?.includes(adv?.[removeOptionsKey]))
              .map((adv) => {
                return {
                  icon: (
                    <span className="icon" style={{ display: "flex", justifyContent: "space-between" }}>
                      <span className="icon">{adv?.barRegistrationNumber}</span>
                      <span className="icon" style={{ justifyContent: "end" }}>
                        {removeInvalidNameParts(adv?.additionalDetails?.username)}
                      </span>
                    </span>
                  ),
                  barRegistrationNumber: `${adv?.barRegistrationNumber}`,
                  advocateName: removeInvalidNameParts(adv?.additionalDetails?.username),
                  advocateId: adv?.id,
                  barRegistrationNumberOriginal: adv?.barRegistrationNumber,
                  data: adv,
                };
              });
          },
        },
      };
    },
  },
  registrationRequestsConfig: {
    customValidationCheck: (data) => {
      return !data?.applicationNumber_WILDCARD.trim() ? { label: "Please enter a valid application Number", error: true } : false;
    },
    preProcess: (requestCriteria, additionalDetails) => {
      // We need to change tenantId "processSearchCriteria" here
      const moduleSearchCriteria = {
        ...requestCriteria?.body?.inbox?.moduleSearchCriteria,
        ...requestCriteria?.state?.searchForm,
        tenantId: window?.Digit.ULBService.getStateId(),
      };
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
  scrutinyInboxConfig: {
    preProcess: (requestCriteria, additionalDetails) => {
      // We need to change tenantId "processSearchCriteria" here
      const criteria = [
        {
          ...requestCriteria?.body?.criteria[0],
          ...requestCriteria?.state?.searchForm,
          tenantId: window?.Digit.ULBService.getStateId(),
          pagination: {
            limit: requestCriteria?.body?.inbox?.limit,
            offSet: requestCriteria?.body?.inbox?.offset,
          },
        },
      ];
      if (additionalDetails in criteria[0] && !criteria[0][additionalDetails]) {
        criteria.splice(0, 1, {
          ...requestCriteria?.body?.criteria[0],
          ...requestCriteria?.state?.searchForm,
          [additionalDetails]: "",
          tenantId: window?.Digit.ULBService.getStateId(),
          pagination: {
            limit: requestCriteria?.body?.inbox?.limit,
            offSet: requestCriteria?.body?.inbox?.offset,
          },
        });
      }
      return {
        ...requestCriteria,
        body: {
          ...requestCriteria?.body,
          criteria,
          tenantId: window?.Digit.ULBService.getStateId(),
          config: {
            ...requestCriteria?.config,
            select: (data) => {
              return { ...data, totalCount: data?.criteria?.[0]?.pagination?.totalCount };
            },
          },
        },
      };
    },
    MobileDetailsOnClick: (row, tenantId) => {
      let link;
      Object.keys(row).map((key) => {
        if (key === "Case ID") link = ``;
      });
      return link;
    },
    additionalCustomizations: (row, key, column, value, t, searchResult) => {
      switch (key) {
        case "Stage":
          return <span>{t("UNDER_SCRUTINY")}</span>;
        case "Case Type":
          return <span>NIA S138</span>;
        case "Days Since Filing":
          const today = new Date();
          const formattedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const datearr = value.split("-");
          const filedAt = new Date(datearr[2], datearr[1] - 1, datearr[0]);
          const formattedFiledAt = new Date(filedAt.getFullYear(), filedAt.getMonth(), filedAt.getDate());
          const diffInTime = formattedToday.getTime() - formattedFiledAt.getTime();
          const diffInDays = Math.ceil(diffInTime / (1000 * 3600 * 24));
          return <span>{diffInDays}</span>;
        default:
          return t("ES_COMMON_NA");
      }
    },
  },
  paymentInboxConfig: {
    preProcess: (requestCriteria, additionalDetails) => {
      // We need to change tenantId "processSearchCriteria" here
      const tenantId = window?.Digit.ULBService.getStateId();
      const moduleSearchCriteria = {
        billStatus: requestCriteria?.body?.inbox?.moduleSearchCriteria?.billStatus,
        ...(requestCriteria?.state?.searchForm?.caseTitleFilingNumber && {
          caseTitleFilingNumber: requestCriteria?.state?.searchForm?.caseTitleFilingNumber,
        }),
        ...(requestCriteria?.state?.searchForm?.sortOrder && { sortOrder: requestCriteria?.state?.searchForm?.sortOrder }),
        ...(requestCriteria?.state?.searchForm?.caseType && { caseType: requestCriteria?.state?.searchForm?.caseType }),
        ...(requestCriteria?.state?.searchForm?.paymentType && { paymentType: requestCriteria?.state?.searchForm?.paymentType }),
        tenantId: tenantId,
      };

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
              tenantId: tenantId,
            },
            limit: requestCriteria?.state?.tableForm?.limit,
            offset: requestCriteria?.state?.tableForm?.offset,
            tenantId: tenantId,
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
        if (key === "Case ID") link = ``;
      });
      return link;
    },
    additionalCustomizations: (row, key, column, value, t, searchResult) => {
      const caseId = row?.businessObject?.billDetails?.caseId;
      const filingNumber = row?.businessObject?.billDetails?.filingNumber;
      const cmpNumber = row?.businessObject?.billDetails?.cmpNumber;
      const courtCaseNumber = row?.businessObject?.billDetails?.courtCaseNumber;
      const caseTitle = row?.businessObject?.billDetails?.caseTitleFilingNumber.split(",")[0].trim();
      const consumerCode = row?.businessObject?.billDetails?.consumerCode;
      const service = row?.businessObject?.billDetails?.service;
      const billStatus = row?.businessObject?.billDetails?.billStatus;
      const paymentType = row?.businessObject?.billDetails?.paymentType;
      const courtId = row?.businessObject?.billDetails?.courtId;
      switch (key) {
        case "CASE_NAME_ID":
          return billStatus === "ACTIVE" ? (
            <span className="link">
              <Link
                to={`/${window?.contextPath}/employee/dristi/pending-payment-inbox/pending-payment-details?caseId=${caseId}&caseTitle=${caseTitle}&filingNumber=${filingNumber}&cmpNumber=${cmpNumber}&courtCaseNumber=${courtCaseNumber}&businessService=${service}&consumerCode=${consumerCode}&paymentType=${paymentType}&courtId=${courtId}`}
              >
                {String(`${caseTitle}, ${getCaseNumber(row?.businessObject?.billDetails)}` || t("ES_COMMON_NA"))}
              </Link>
            </span>
          ) : (
            billStatus === "PAID" && <span>{String(`${caseTitle}, ${getCaseNumber(row?.businessObject?.billDetails)}` || t("ES_COMMON_NA"))}</span>
          );
        case "AMOUNT_DUE":
          return <span>{`Rs. ${value}/-`}</span>;
        case "ACTION":
          return billStatus === "ACTIVE" ? (
            <span className="action-link">
              <Link
                style={{ display: "flex", alignItem: "center", color: "#9E400A" }}
                to={`/${window?.contextPath}/employee/dristi/pending-payment-inbox/pending-payment-details?caseId=${caseId}&caseTitle=${caseTitle}&filingNumber=${filingNumber}&cmpNumber=${cmpNumber}&courtCaseNumber=${courtCaseNumber}&businessService=${service}&consumerCode=${consumerCode}&paymentType=${paymentType}&courtId=${courtId}`}
              >
                {" "}
                <span style={{ display: "flex", alignItem: "center", textDecoration: "underline", color: "#9E400A" }}>
                  {t("CS_RECORD_PAYMENT")}
                </span>{" "}
                <ArrowDirection styles={{ height: "20px", width: "20px", fill: "#9E400A" }} />
              </Link>
            </span>
          ) : (
            billStatus === "PAID" && (
              <span
                style={{
                  padding: "5px 10px",
                  borderRadius: "15px",
                  display: "inline-block",
                  fontSize: "0.9rem",
                  textAlign: "center",
                  backgroundColor: "rgb(228, 242, 228)",
                  color: "rgb(0, 112, 60)",
                }}
              >
                {String(t("CS_AMOUNT_PAID") || t("ES_COMMON_NA"))}
              </span>
            )
          );
        case "PAYMENT_GENERATED_DATE":
        case "PAYMENT_COMPLETED_DATE":
          return getDate(value);
        default:
          return t("ES_COMMON_NA");
      }
    },
  },
  orderInboxConfig: {
    preProcess: (requestCriteria, additionalDetails) => {
      const tenantId = window?.Digit.ULBService.getStateId();
      const userRoles = Digit.UserService.getUser()?.info?.roles.map((role) => role.code);
      const moduleSearchCriteria = {
        status: [
          OrderWorkflowState.DRAFT_IN_PROGRESS,
          OrderWorkflowState.PENDING_BULK_E_SIGN,
          OrderWorkflowState.PUBLISHED,
          OrderWorkflowState.ABATED,
          OrderWorkflowState.PENDING_E_SIGN,
        ],
        ...(Object.keys(requestCriteria?.state?.searchForm?.type || {})?.length && {
          type: requestCriteria?.state?.searchForm?.type?.type,
        }),
        ...(Object.keys(requestCriteria?.state?.searchForm?.parties || {})?.length > 0 && {
          partyName: requestCriteria?.state?.searchForm?.parties?.code,
        }),
        ...(userRoles.includes("CITIZEN")
          ? Object.keys(requestCriteria?.state?.searchForm?.status || {})?.length > 0 &&
            requestCriteria?.state?.searchForm?.status?.code != "PUBLISHED"
            ? { status: "EMPTY" }
            : { status: "PUBLISHED" }
          : Object.keys(requestCriteria?.state?.searchForm?.status || {})?.length > 0 && {
              status: requestCriteria?.state?.searchForm?.status?.code,
            }),
        ...(requestCriteria?.state?.searchForm?.id && {
          id: requestCriteria?.state?.searchForm?.id,
        }),
        ...(requestCriteria?.body?.inbox?.moduleSearchCriteria?.caseNumbers && {
          caseNumbers: requestCriteria?.body?.inbox?.moduleSearchCriteria?.caseNumbers,
        }),
        ...(requestCriteria?.body?.inbox?.moduleSearchCriteria?.filingNumbers && {
          filingNumbers: requestCriteria?.body?.inbox?.moduleSearchCriteria?.filingNumbers,
        }),
        ...(requestCriteria?.body?.inbox?.moduleSearchCriteria?.tenantId && {
          tenantId: requestCriteria?.body?.inbox?.moduleSearchCriteria?.tenantId,
        }),
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
        case "PARTIES":
          if (value === null || value === undefined || value === "undefined" || value === "null") {
            return null;
          }
          return (
            <div>
              {value?.length > 2 && (
                <ReactTooltip id={`hearing-list`}>{value?.map((party) => party?.partyName || party?.name).join(", ")}</ReactTooltip>
              )}
              <span data-tip data-for={`hearing-list`}>{`${value
                ?.slice(0, 2)
                ?.map((party) => party?.partyName || party?.name)
                ?.join(", ")}${value?.length > 2 ? `+${value?.length - 2}` : ""}`}</span>
            </div>
          );
        case "STATUS":
          return (
            <CustomChip
              text={t(value)}
              shade={
                value === OrderWorkflowState.PUBLISHED
                  ? "green"
                  : value === OrderWorkflowState.DELETED
                  ? "red"
                  : value === OrderWorkflowState.DRAFT_IN_PROGRESS
                  ? "grey"
                  : "orange"
              }
            />
          );
        case "DATE_ISSUED":
        case "DATE_ADDED":
          const date = new Date(value);
          const day = date.getDate().toString().padStart(2, "0");
          const month = (date.getMonth() + 1).toString().padStart(2, "0");
          const year = date.getFullYear();
          const formattedDate = `${day}-${month}-${year}`;
          return <span>{value && value !== "0" ? formattedDate : ""}</span>;
        case "ORDER_TITLE":
          return <OrderName rowData={row} colData={column} value={value} />;
        default:
          break;
      }
    },
  },
  litigantInboxConfig: {
    preProcess: (requestCriteria, additionalDetails) => {
      // We need to change tenantId "processSearchCriteria" here
      const tenantId = window?.Digit.ULBService.getStateId();
      const criteria = [
        {
          ...requestCriteria?.body?.criteria[0],
          ...requestCriteria?.state?.searchForm,
          tenantId,
          ...additionalDetails,
          pagination: {
            limit: requestCriteria?.body?.inbox?.limit,
            offSet: requestCriteria?.body?.inbox?.offset,
          },
        },
      ];
      if (additionalDetails?.searchKey in criteria[0] && !criteria[0][additionalDetails?.searchKey]) {
        criteria.splice(0, 1, {
          ...requestCriteria?.body?.criteria[0],
          ...requestCriteria?.state?.searchForm,
          [additionalDetails.searchKey]: "",
          ...additionalDetails,
          tenantId,
          pagination: {
            limit: requestCriteria?.body?.inbox?.limit,
            offSet: requestCriteria?.body?.inbox?.offset,
          },
        });
      }
      return {
        ...requestCriteria,
        body: {
          ...requestCriteria?.body,
          criteria,
          tenantId,
        },
        config: {
          ...requestCriteria?.config,
          select: (data) => {
            return { ...data, totalCount: data?.criteria?.[0]?.pagination?.totalCount };
          },
        },
      };
    },
    additionalCustomizations: (row, key, column, value, t, searchResult) => {
      switch (key) {
        case "Case Type":
          return <span>NIA S138</span>;
        case "Stage":
          return t(row?.status);
        default:
          return t("ES_COMMON_NA");
      }
    },
  },
  judgeInboxConfig: {
    preProcess: (requestCriteria, additionalDetails) => {
      const tenantId = window?.Digit.ULBService.getStateId();
      // We need to change tenantId "processSearchCriteria" here
      const criteria = {
        ...requestCriteria?.body?.criteria,
        ...requestCriteria?.state?.searchForm,
        tenantId,
        pagination: {
          limit: requestCriteria?.body?.inbox?.limit,
          offSet: requestCriteria?.body?.inbox?.offset,
        },
      };

      return {
        ...requestCriteria,
        body: {
          ...requestCriteria?.body,
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
      switch (key) {
        case "Case Type":
          return <span>NIA S138</span>;
        case "Stage":
          return t(row?.status);
        default:
          return t("ES_COMMON_NA");
      }
    },
  },
  SearchIndividualConfig: {
    preProcess: (requestCriteria, additionalDetails) => {
      const filterList = Object.keys(requestCriteria.state.searchForm)
        .map((key) => {
          if (requestCriteria.state.searchForm[key]?.type) {
            return { [key]: requestCriteria.state.searchForm[key]?.type };
          } else if (requestCriteria.state.searchForm[key]?.value) {
            return { [key]: requestCriteria.state.searchForm[key]?.value };
          } else if (typeof requestCriteria.state.searchForm[key] === "string") {
            return { [key]: requestCriteria.state.searchForm[key] };
          }
        })
        ?.filter((filter) => filter)
        .reduce(
          (fieldObj, item) => ({
            ...fieldObj,
            ...item,
          }),
          {}
        );
      const tenantId = window?.Digit.ULBService.getStateId();
      const userRoles = Digit.UserService.getUser()?.info?.roles.map((role) => role.code);
      const status = !filterList?.status || filterList?.status === "PUBLISHED" ? "PUBLISHED" : "EMPTY";
      return {
        ...requestCriteria,
        body: {
          ...requestCriteria.body,
          criteria: {
            ...requestCriteria.body.criteria,
            ...filterList,
            status: userRoles.includes("CITIZEN") && requestCriteria.url.split("/").includes("order") ? status : filterList?.status,
          },
          tenantId,
          pagination: {
            limit: requestCriteria?.state?.tableForm?.limit,
            offSet: requestCriteria?.state?.tableForm?.offset,
          },
        },
        config: {
          ...requestCriteria.config,
          select: (data) => {
            // if (requestCriteria.url.split("/").includes("order")) {
            return userRoles.includes("CITIZEN") && requestCriteria.url.split("/").includes("order")
              ? { ...data, list: data.list?.filter((order) => order.status !== "DRAFT_IN_PROGRESS") }
              : userRoles.includes("JUDGE_ROLE") && requestCriteria.url.split("/").includes("application")
              ? {
                  ...data,
                  applicationList: data.applicationList?.filter((application) => !["PENDINGESIGN", "PENDINGPAYMENT"].includes(application.status)),
                }
              : data;
            // }
          },
        },
      };
    },
    additionalCustomizations: (row, key, column, value, t) => {
      const showDocument =
        userRoles?.includes("APPLICATION_APPROVER") || userRoles?.includes("DEPOSITION_ESIGN") || row.workflow?.action !== "PENDINGREVIEW";
      switch (key) {
        case "DOCUMENT_TEXT":
          return showDocument ? <OwnerColumn rowData={row} colData={column} t={t} /> : "";
        case "FILE":
          return showDocument ? <Evidence userRoles={userRoles} rowData={row} colData={column} t={t} /> : "";
        case "DATE_ADDED":
        case "DATE_ISSUED":
        case "DATE":
          const date = new Date(value);
          const day = date.getDate().toString().padStart(2, "0");
          const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Month is zero-based
          const year = date.getFullYear();
          const formattedDate = `${day}-${month}-${year}`;
          return <span>{value && value !== "0" ? formattedDate : ""}</span>;
        case "PARTIES":
          if (value === null || value === undefined || value === "undefined" || value === "null") {
            return null;
          }
          return (
            <div>
              {value?.length > 2 && (
                <ReactTooltip id={`hearing-list`}>{value?.map((party) => party?.partyName || party?.name).join(", ")}</ReactTooltip>
              )}
              <span data-tip data-for={`hearing-list`}>{`${value
                ?.slice(0, 2)
                ?.map((party) => party?.partyName || party?.name)
                ?.join(", ")}${value?.length > 2 ? `+${value?.length - 2}` : ""}`}</span>
            </div>
          );
        case "ORDER_TYPE":
          return <OrderName rowData={row} colData={column} value={value} />;
        case "SUBMISSION_TYPE":
          return <OwnerColumn rowData={row} colData={column} t={t} value={value} showAsHeading={true} />;
        case "DOCUMENT_TYPE":
          return <Evidence userRoles={userRoles} rowData={row} colData={column} t={t} value={value} showAsHeading={true} />;
        case "HEARING_TYPE":
        case "SOURCE":
        case "STATUS":
          //Need to change the shade as per the value
          return <CustomChip text={t(value)} shade={value === "PUBLISHED" ? "green" : "orange"} />;
        case "OWNER":
          return value ? removeInvalidNameParts(value) : "-";
        case "SUBMISSION_ID":
          return value ? value : "-";
        case "CS_ACTIONS":
          return (
            <OverlayDropdown style={{ position: "relative" }} column={column} row={row} master="commonUiConfig" module="SearchIndividualConfig" />
          );
        default:
          break;
      }
    },
    dropDownItems: (row, configs) => {
      const formatDate = (date) => {
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      };
      const OrderWorkflowAction = Digit.ComponentRegistryService.getComponent("OrderWorkflowActionEnum") || {};
      const ordersService = Digit.ComponentRegistryService.getComponent("OrdersService") || {};
      const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
      const date = new Date(row.startTime);
      const future = row.startTime > Date.now();
      const showActions = configs && configs.hasOwnProperty("showMakeSubmission") ? configs.showMakeSubmission : true;
      if (row.status === "SCHEDULED" && userInfo.roles.map((role) => role.code).includes("JUDGE_ROLE")) {
        return [
          {
            label: "Reschedule hearing",
            id: "reschedule",
            action: (history) => {
              const requestBody = {
                order: {
                  createdDate: null,
                  tenantId: row.tenantId,
                  hearingNumber: row?.hearingId,
                  filingNumber: row.filingNumber[0],
                  cnrNumber: row.cnrNumbers[0],
                  statuteSection: {
                    tenantId: row.tenantId,
                  },
                  orderTitle: "INITIATING_RESCHEDULING_OF_HEARING_DATE",
                  orderCategory: "INTERMEDIATE",
                  orderType: "INITIATING_RESCHEDULING_OF_HEARING_DATE",
                  status: "",
                  isActive: true,
                  workflow: {
                    action: OrderWorkflowAction.SAVE_DRAFT,
                    comments: "Creating order",
                    assignes: null,
                    rating: null,
                    documents: [{}],
                  },
                  documents: [],
                  additionalDetails: {
                    formdata: {
                      orderType: {
                        type: "INITIATING_RESCHEDULING_OF_HEARING_DATE",
                        isactive: true,
                        code: "INITIATING_RESCHEDULING_OF_HEARING_DATE",
                        name: "ORDER_TYPE_INITIATING_RESCHEDULING_OF_HEARING_DATE",
                      },
                      originalHearingDate: `${date.getFullYear()}-${date.getMonth() < 9 ? `0${date.getMonth() + 1}` : date.getMonth() + 1}-${
                        date.getDate() < 10 ? `0${date.getDate()}` : date.getDate()
                      }`,
                    },
                  },
                },
              };
              ordersService
                .createOrder(requestBody, { tenantId: Digit.ULBService.getCurrentTenantId() })
                .then((res) => {
                  history.push(
                    `/${window.contextPath}/employee/orders/generate-orders?filingNumber=${row.filingNumber[0]}&orderNumber=${res.order.orderNumber}`,
                    {
                      caseId: row.caseId,
                      tab: "Orders",
                    }
                  );
                })
                .catch((err) => {});
            },
          },
          {
            label: "View transcript",
            id: "view_transcript",
            hide: true,
            action: (history) => {
              alert("Not Yet Implemented");
            },
          },
          {
            label: "View witness deposition",
            id: "view_witness",
            hide: true,
            action: (history) => {
              alert("Not Yet Implemented");
            },
          },
          {
            label: "View pending task",
            id: "view_pending_tasks",
            hide: true,
            action: (history) => {
              alert("Not Yet Implemented");
            },
          },
        ];
      }
      if (row.status === "SCHEDULED" && userInfo?.type === "CITIZEN") {
        return [
          {
            label: "Request for Reschedule hearing",
            id: "reschedule",
            hide: !showActions,
            action: (history) => {
              history.push(
                `/${window?.contextPath}/citizen/submissions/submissions-create?filingNumber=${row.filingNumber[0]}&hearingId=${row.hearingId}&applicationType=RE_SCHEDULE`
              );
            },
          },
          {
            label: "Request for Checkout Request",
            id: "reschedule",
            hide: !showActions,
            action: (history) => {
              history.push(
                `/${window?.contextPath}/citizen/submissions/submissions-create?filingNumber=${row.filingNumber[0]}&hearingId=${row.hearingId}&applicationType=CHECKOUT_REQUEST`
              );
            },
          },
          {
            label: "View transcript",
            id: "view_transcript",
            hide: true,
            action: (history) => {
              alert("Not Yet Implemented");
            },
          },
          {
            label: "View witness deposition",
            id: "view_witness",
            hide: true,
            action: (history) => {
              alert("Not Yet Implemented");
            },
          },
          {
            label: "View pending task",
            id: "view_pending_tasks",
            hide: true,
            action: (history) => {
              alert("Not Yet Implemented");
            },
          },
        ];
      }

      if (![HearingWorkflowState?.SCHEDULED, HearingWorkflowState?.ABATED, HearingWorkflowState?.OPTOUT].includes(row.status)) {
        return [
          {
            label: "View transcript",
            id: "view_transcript",
            hide: false,
            disabled: false,
            action: (history, column, row) => {
              column.clickFunc(row);
            },
          },
          {
            label: "View witness deposition",
            id: "view_witness",
            hide: false,
            disabled: true,
            action: (history) => {
              alert("Not Yet Implemented");
            },
          },
          {
            label: "View pending task",
            id: "view_pending_tasks",
            hide: true,
            disabled: true,
            action: (history) => {
              alert("Not Yet Implemented");
            },
          },
        ];
      }

      return [
        {
          label: "View transcript",
          id: "view_transcript",
          hide: false,
          disabled: true,
          action: (history) => {
            alert("Not Yet Implemented");
          },
        },
        {
          label: "View witness deposition",
          id: "view_witness",
          hide: false,
          disabled: true,
          action: (history) => {
            alert("Not Yet Implemented");
          },
        },
        {
          label: "View pending task",
          id: "view_pending_tasks",
          hide: true,
          disabled: true,
          action: (history) => {
            alert("Not Yet Implemented");
          },
        },
      ];
    },
  },
  HistoryConfig: {
    preProcess: (requestCriteria, additionalDetails) => {
      return {
        ...requestCriteria,
        config: {
          ...requestCriteria.config,
          select: (data) => {
            const userRoles = Digit.UserService.getUser()?.info?.roles.map((role) => role.code);
            if (data.caseFiles.length) {
              const applicationHistory = data.caseFiles[0]?.applications.map((application) => {
                return {
                  instance: `APPLICATION_TYPE_${application.applicationType}`,
                  date: application.auditDetails.createdTime,
                  status: application.status,
                };
              });
              const evidenceHistory = data.caseFiles[0]?.evidence.map((evidence) => {
                return {
                  instance: evidence.artifactType,
                  date: evidence.auditdetails.createdTime,
                  status: evidence.status,
                };
              });
              const hearingHistory = data.caseFiles[0]?.hearings.map((hearing) => {
                return { instance: `HEARING_TYPE_${hearing.hearingType}`, stage: [], date: hearing.startTime, status: hearing.status };
              });
              const orderHistory = userRoles.includes("CITIZEN")
                ? data.caseFiles[0]?.orders
                    ?.filter((order) => order.order.status !== "DRAFT_IN_PROGRESS")
                    .map((order) => {
                      return {
                        instance: order.order.orderTitle,
                        stage: [],
                        date: order.order.auditDetails.createdTime,
                        status: order.order.status,
                      };
                    })
                : data.caseFiles[0]?.orders.map((order) => {
                    return {
                      instance: order.order.orderTitle,
                      stage: [],
                      date: order.order.auditDetails.createdTime,
                      status: order.order.status,
                    };
                  });
              const historyList = [...hearingHistory, ...applicationHistory, ...orderHistory, ...evidenceHistory];
              return { ...data, history: historyList };
            } else {
              return { ...data, history: [] };
            }
          },
        },
      };
    },
    additionalCustomizations: (row, key, column, value, t) => {
      switch (key) {
        case "Instance":
          return <RenderInstance value={value} t={t} />;
        case "Date":
          const date = new Date(value);
          const day = date.getDate().toString().padStart(2, "0");
          const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Month is zero-based
          const year = date.getFullYear();
          const formattedDate = `${day}-${month}-${year}`;
          return <span>{formattedDate}</span>;
        case "Status":
          return t(value);
        default:
          break;
      }
    },
  },
  FilingsConfig: {
    preProcess: (requestCriteria, additionalDetails) => {
      const filterList = Object.keys(requestCriteria.state.searchForm)
        .map((key) => {
          if (requestCriteria.state.searchForm[key]?.type) {
            return { [key]: requestCriteria.state.searchForm[key]?.type };
          } else if (requestCriteria.state.searchForm[key]?.value) {
            return { [key]: requestCriteria.state.searchForm[key]?.value };
          } else if (typeof requestCriteria.state.searchForm[key] === "string") {
            return { [key]: requestCriteria.state.searchForm[key] };
          }
        })
        ?.filter((filter) => filter)
        .reduce(
          (fieldObj, item) => ({
            ...fieldObj,
            ...item,
          }),
          {}
        );
      const tenantId = window?.Digit.ULBService.getStateId();
      const userRoles = Digit.UserService.getUser()?.info?.roles.map((role) => role.code);
      const status = !filterList?.status || filterList?.status === "PUBLISHED" ? "PUBLISHED" : "EMPTY";
      return {
        ...requestCriteria,
        body: {
          ...requestCriteria.body,
          criteria: {
            ...requestCriteria.body.criteria,
            ...filterList,
            status: userRoles.includes("CITIZEN") && requestCriteria.url.split("/").includes("order") ? status : filterList?.status,
          },
          tenantId,
          pagination: {
            limit: requestCriteria?.state?.tableForm?.limit,
            offSet: requestCriteria?.state?.tableForm?.offset,
          },
        },
        config: {
          ...requestCriteria.config,
          select: (data) => {
            return {
              ...data,
              TotalCount: data?.TotalCount ? data?.TotalCount : data?.pagination?.totalCount,
            };
            // }
          },
        },
      };
    },
    additionalCustomizations: (row, key, column, value, t) => {
      const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
      const isEmployee = userInfo?.type !== "CITIZEN";
      switch (key) {
        case "FILING_NAME":
          const showValue = row?.additionalDetails?.formdata?.documentTitle
            ? row?.additionalDetails?.formdata?.documentTitle
            : row?.artifactType === "WITNESS_DEPOSITION"
            ? `${t(value)} (${row?.tag})`
            : value;
          return <Evidence userRoles={userRoles} rowData={row} colData={column} t={t} value={showValue} showAsHeading={true} />;
        case "TYPE":
          return t(row?.filingType) || "";
        case "FILE":
          return <Evidence userRoles={userRoles} rowData={row} colData={column} t={t} />;
        case "STATUS":
          //Need to change the shade as per the value
          return row?.isVoid ? (
            <div
              style={{
                padding: "5px 10px",
                fontFamily: "Roboto",
                fontSize: "14px",
                fontWeight: 400,
                lineHeight: "16.41px",
                color: "#231F20",
              }}
            >
              {t("VOID")}
            </div>
          ) : row?.status ? (
            <CustomChip text={t(row?.status)} shade={"green"} />
          ) : (
            ""
          );
        case "OWNER":
          return removeInvalidNameParts(value);
        case "REPRESENTATIVES":
          return t(value) || "";
        case "CS_ACTIONS":
          return <OverlayDropdown style={{ position: "relative" }} column={column} row={row} master="commonUiConfig" module="FilingsConfig" />;
        case "EVIDENCE_NUMBER":
          return (row?.isEvidence || isEmployee) && modifiedEvidenceNumber(value, row?.filingNumber);
        case "EVIDENCE_STATUS":
          return row?.evidenceMarkedStatus && (row?.evidenceMarkedStatus === "COMPLETED" || isEmployee) ? (
            <CustomChip
              text={row?.evidenceMarkedStatus === "COMPLETED" ? t("SIGNED") : t(row?.evidenceMarkedStatus) || ""}
              shade={row?.evidenceMarkedStatus === "COMPLETED" ? "green" : "grey"}
            />
          ) : (
            ""
          );
        default:
          return "N/A";
      }
    },
    dropDownItems: (row, column) => {
      const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
      // row.status === "Submitted" &&
      return [
        ...((userInfo.roles.map((role) => role.code).includes("JUDGE_ROLE") ||
          userInfo.roles.map((role) => role.code).includes("COURT_ROOM_MANAGER")) &&
        !row?.isVoid &&
        row?.filingType === "DIRECT"
          ? [
              {
                label: "MARK_AS_VOID",
                id: "mark_as_void",
                hide: false,
                disabled: row?.status !== "SUBMITTED",
                action: column.clickFunc,
              },
            ]
          : []),
        ...(userInfo.roles.map((role) => role.code).includes("EMPLOYEE") &&
        row?.artifactType !== "WITNESS_DEPOSITION" &&
        !row?.isVoid &&
        !(row?.status !== "SUBMITTED" && row?.filingType === "DIRECT")
          ? row?.evidenceMarkedStatus !== null || row.isEvidence
            ? [
                {
                  label: "VIEW_MARK_AS_EVIDENCE",
                  id: "view_mark_as_evidence",
                  hide: false,
                  disabled: false,
                  action: column.clickFunc,
                },
              ]
            : [
                {
                  label: "MARK_AS_EVIDENCE",
                  id: "mark_as_evidence",
                  hide: false,
                  disabled: false,
                  action: column.clickFunc,
                },
              ]
          : []),
        // ...(userInfo.roles.map((role) => role.code).includes("JUDGE_ROLE") && row.isEvidence
        //   ? [
        //       {
        //         label: "UNMARK_AS_EVIDENCE",
        //         id: "unmark_as_evidence",
        //         hide: false,
        //         disabled: false,
        //         action: column.clickFunc,
        //       },
        //     ]
        //   : []),
        ...(row?.isVoid && row?.filingType === "DIRECT"
          ? [
              {
                label: "VIEW_REASON_FOR_VOIDING",
                id: "view_reason_for_voiding",
                hide: false,
                disabled: false,
                action: column.clickFunc,
              },
            ]
          : []),

        {
          label: "DOWNLOAD_FILING",
          id: "download_filing",
          hide: false,
          disabled: row?.status !== "SUBMITTED" && row?.filingType === "DIRECT",
          action: column.clickFunc,
        },
      ];
    },
  },
  PartiesConfig: {
    preProcess: (requestCriteria, additionalDetails) => {
      const { limit, offset } = requestCriteria.state?.tableForm || {};
      return {
        ...requestCriteria,
        config: {
          ...requestCriteria.config,
          select: (data) => {
            const allLitigantAdvocatesMapping = getAdvocates(data.criteria[0].responseList[0]);
            const userInfo = Digit.UserService.getUser()?.info;
            const editorUuid = userInfo?.uuid;

            // Either an advocate who is representing any "complainant" or any "PIP complainant" ->> only these
            // 2 type can edit details of any complainant/accused from actions in parties tab.
            const checkIfEditable = () => {
              for (let key in allLitigantAdvocatesMapping) {
                if (allLitigantAdvocatesMapping?.[key]?.some((uuid) => uuid === editorUuid)) {
                  const litigantObj = data.criteria[0].responseList[0]?.litigants?.find((lit) => lit?.additionalDetails?.uuid === key);
                  if (litigantObj && ["complainant.primary", "complainant.additional"].includes(litigantObj.partyType)) {
                    return true;
                  }
                }
              }
              return false;
            };

            // To check if editor is an advocate or PIP compplainant.
            const checkIfAdvocateIsEditor = () => {
              const representatives = data?.criteria?.[0]?.responseList?.[0]?.representatives;
              return Boolean(representatives?.some((rep) => rep?.additionalDetails?.uuid === editorUuid));
            };

            const isEditable = checkIfEditable();
            const isAdvocateEditor = checkIfAdvocateIsEditor();
            const unjoinedAccused =
              data.criteria[0].responseList[0]?.additionalDetails?.respondentDetails?.formdata
                ?.filter((data) => !data?.data?.respondentVerification?.individualDetails?.individualId)
                ?.map((itemData) => {
                  const fullName = constructFullName(
                    itemData?.data?.respondentFirstName,
                    itemData?.data?.respondentMiddleName,
                    itemData?.data?.respondentLastName
                  );
                  return {
                    code: fullName,
                    name: fullName,
                    uniqueId: itemData?.uniqueId,
                    isJoined: false,
                    partyType: "unJoinedAccused",
                    caseId: data?.criteria[0]?.responseList[0]?.id,
                    isEditable,
                    ...(isEditable && { isAdvocateEditor }),
                  };
                }) || [];
            const litigants = data.criteria[0].responseList[0].litigants?.length > 0 ? data.criteria[0].responseList[0].litigants : [];
            const finalLitigantsData = litigants.map((litigant) => {
              return {
                ...litigant,
                name: removeInvalidNameParts(litigant.additionalDetails?.fullName),
                isEditable,
                ...(isEditable && { isAdvocateEditor }),
              };
            });

            const poaHolders = data.criteria[0].responseList[0].poaHolders?.length > 0 ? data.criteria[0].responseList[0].poaHolders : [];
            const finalPoaHoldersData = poaHolders?.map((poaHolder) => {
              const representing = poaHolder?.representingLitigants?.map((rep) => {
                return {
                  ...litigants?.find((litigant) => litigant?.individualId === rep?.individualId),
                  ...rep,
                };
              });
              return {
                ...poaHolder,
                representingLitigants: representing,
                representingList: representing?.map((rep) => rep?.additionalDetails?.fullName)?.join(", "),
                partyType: poaHolder?.poaType,
                status: "JOINED",
                isEditable: false,
              };
            });

            // pendingAdvocateRequests includes list of advocates with pending and partially pending status.
            const pendingAdvocateRequests = data?.criteria?.[0]?.responseList?.[0]?.pendingAdvocateRequests || [];
            // representatives has list of advocates with joined and partially pending status.
            const representatives = data?.criteria?.[0].responseList?.[0]?.representatives || [];

            const getAdvocateJoinStatus = (rep) => {
              for (let i = 0; i < pendingAdvocateRequests?.length; i++) {
                if (pendingAdvocateRequests?.[i]?.advocateId === rep?.advocateId) {
                  return advocateJoinStatus?.PARTIALLY_PENDING;
                }
              }
              return advocateJoinStatus?.JOINED;
            };

            // List of advocates who have joined the case or partially pending status.
            // Note: advocates whose joining status is partially pending has technically joined the case and
            // have same rights as an advocate with joined status, thats why it is also present in case representatives list.
            const joinedAndPartiallyJoinedAdvocates = representatives.map((rep) => {
              const status = getAdvocateJoinStatus(rep);
              return {
                ...rep,
                name: rep.additionalDetails?.advocateName,
                partyType: `ADVOCATE`,
                representingList: rep.representing?.map((client) => removeInvalidNameParts(client?.additionalDetails?.fullName))?.join(", "),
                isEditable: false,
                status,
              };
            });

            // List of advocates with joining status as pending.
            // These advocates won't be present in case representatives list, will be in pendingAdvocateRequests list.
            const joinStatusPendingAdvocates = pendingAdvocateRequests
              ?.filter((adv) => adv?.status === advocateJoinStatus?.PENDING)
              ?.map((rep) => {
                const { firstName = "", middleName = "", lastName = "" } = rep?.individualDetails || {};
                const fullName = getFullName(" ", firstName, middleName, lastName);
                return {
                  ...rep,
                  name: fullName,
                  partyType: `ADVOCATE`,
                  representingList: [],
                  isEditable: false,
                  status: advocateJoinStatus?.PENDING,
                };
              });

            const witnessDetails =
              data?.criteria[0]?.responseList[0]?.additionalDetails?.witnessDetails?.formdata?.map((itemData) => {
                const fullName = constructFullName(itemData?.data?.firstName, itemData?.data?.middleName, itemData?.data?.lastName);
                return {
                  code: fullName,
                  name: fullName,
                  uniqueId: itemData?.uniqueId,
                  isJoined: false,
                  associatedWith: itemData?.data?.ownerType || "COMPLAINANT",
                  partyType: "witness",
                  caseId: data?.criteria[0]?.responseList[0]?.id,
                  isEditable: false,
                  auditDetails: itemData?.data?.createdTime
                    ? { createdTime: itemData?.data?.createdTime }
                    : data?.criteria[0]?.responseList[0]?.auditDetails,
                };
              }) || [];

            const allParties = [
              ...finalLitigantsData,
              ...unjoinedAccused,
              ...joinedAndPartiallyJoinedAdvocates,
              ...joinStatusPendingAdvocates,
              ...finalPoaHoldersData,
              ...witnessDetails,
            ];
            const paginatedParties = allParties.slice(offset, offset + limit);
            return {
              ...data,
              criteria: {
                ...data.criteria[0],
                responseList: {
                  ...data.criteria[0].responseList[0],
                  parties: paginatedParties,
                },
              },
              totalCount: allParties?.length,
            };
          },
        },
      };
    },
    additionalCustomizations: (row, key, column, value, t) => {
      switch (key) {
        case "PARTY_NAME":
          return removeInvalidNameParts(value) || "";

        case "ASSOCIATED_WITH":
          const associatedWith =
            row?.partyType === "ADVOCATE" || ["poa.regular"]?.includes(row?.partyType)
              ? row?.representingList
              : row?.partyType === "witness"
              ? t(row?.associatedWith)
              : "";
          return associatedWith || "";
        case "STATUS":
          const caseJoinStatus = ["respondent.primary", "respondent.additional"].includes(row?.partyType)
            ? t("JOINED")
            : row?.partyType === "unJoinedAccused"
            ? t("NOT_JOINED")
            : ["complainant.primary", "complainant.additional"].includes(row?.partyType)
            ? t("JOINED")
            : ["ADVOCATE"].includes(row?.partyType)
            ? t(row?.status)
            : ["poa.regular"].includes(row?.partyType)
            ? t("JOINED")
            : "";

          return caseJoinStatus ? <span style={{ backgroundColor: "#E8E8E8", padding: "6px", borderRadius: "14px" }}>{caseJoinStatus}</span> : null;

        case "DATE_ADDED":
          const date = new Date(value);
          const day = date.getDate().toString().padStart(2, "0");
          const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Month is zero-based
          const year = date.getFullYear();
          const formattedDate = value ? `${day}-${month}-${year}` : "";
          return <span>{formattedDate}</span>;
        case "PARTY_TYPE":
          const partyType = value === "ADVOCATE" ? `${t("ADVOCATE")}` : partyTypes[value] ? t(partyTypes[value]) : t(value);
          return partyType === "unJoinedAccused" ? "Accused" : partyType === "witness" ? t("WITNESS") : partyType;
        case "ACTIONS":
          return row?.isEditable ? (
            <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center" }}>
              <OverlayDropdown
                styles={{
                  width: "40px",
                  height: "40px",
                  rotate: "90deg",
                  border: "1px solid #0A5757",
                }}
                textStyle={{
                  color: "#0A5757",
                }}
                column={column}
                row={row}
                master="commonUiConfig"
                module="PartiesConfig"
              />
            </div>
          ) : null;
        default:
          break;
      }
    },
    dropDownItems: (row) => {
      const userInfo = Digit.UserService.getUser()?.info;
      const userType = userInfo?.type === "CITIZEN" ? "citizen" : "employee";
      const searchParams = new URLSearchParams();
      const type = ["complainant.primary", "complainant.additional"].includes(row?.partyType) ? "complainantDetails" : "respondentDetails";
      const uniqueId = ["complainant.primary", "complainant.additional"].includes(row?.partyType)
        ? row?.individualId
        : row?.partyType === "unJoinedAccused"
        ? row?.uniqueId
        : row?.individualId;
      const caseId = row?.caseId;
      const isAdvocate = row?.isAdvocateEditor;
      const editorUuid = userInfo?.uuid;

      return [
        {
          label: "EDIT_DETAILS",
          id: "edit_details",
          action: (history) => {
            sessionStorage.setItem("viewCaseParams", window.location.search);
            sessionStorage.setItem("editProfileAccess", "true");
            searchParams.set("type", type);
            searchParams.set("uniqueId", uniqueId);
            searchParams.set("caseId", caseId);
            searchParams.set("editorUuid", editorUuid);
            searchParams.set("isAdvocate", isAdvocate);
            sessionStorage.setItem("caseId", caseId);
            history.push(`/${window.contextPath}/${userType}/dristi/home/view-case/edit-profile?${searchParams.toString()}`);
          },
        },
      ];
    },
  },
  HomeHearingConfig: {
    preProcess: (requestCriteria, additionalDetails) => {
      const updatedCriteria = {
        processSearchCriteria: {
          businessService: ["hearing-default"],
          moduleName: "Hearing Service",
          tenantId: requestCriteria?.params?.tenantId || "kl",
        },
        moduleSearchCriteria: {
          fromDate: new Date(requestCriteria?.state?.searchForm?.date + "T00:00:00").getTime(),
          toDate: new Date(requestCriteria?.state?.searchForm?.date + "T23:59:59.999").getTime(),
          tenantId: requestCriteria?.params?.tenantId || "kl",
          ...(requestCriteria?.state?.searchForm?.status && { status: requestCriteria?.state?.searchForm?.status?.value }),
        },
        tenantId: requestCriteria?.params?.tenantId || "kl",
        limit: requestCriteria?.state?.tableForm?.limit || 10,
        offset: requestCriteria?.state?.tableForm?.offset || 0,
      };

      return {
        ...requestCriteria,
        body: {
          inbox: updatedCriteria,
        },
        config: {
          ...requestCriteria.config,
          select: (data) => {
            if (!data || !data.items) {
              console.error("Data or items is null or undefined");
              return [];
            }
            try {
              additionalDetails?.setCount(data?.totalCount || (Array.isArray(data) ? data.length : 0));
              const updatedItems = data.items.map((item, index) => {
                return {
                  ...item,
                  index,
                };
              });
              return {
                ...data,
                items: updatedItems,
              };
            } catch (error) {
              console.error("Error processing data:", error);
              return data;
            }
          },
        },
      };
    },

    additionalCustomizations: (row, key, column, value, t, searchResult) => {
      switch (key) {
        // case "ADVOCATES":
        //   if (value === null || value === undefined || value === "undefined" || value === "null") {
        //     return null;
        //   }
        //   return (
        //     <div>
        //       {value?.length > 2 && (
        //         <ReactTooltip id={`hearing-list`}>{value?.map((party) => party?.partyName || party?.name).join(", ")}</ReactTooltip>
        //       )}
        //       <span data-tip data-for={`hearing-list`}>{`${value
        //         ?.slice(0, 2)
        //         ?.map((party) => party?.partyName || party?.name)
        //         ?.join(", ")}${value?.length > 2 ? `+${value?.length - 2}` : ""}`}</span>
        //     </div>
        //   );
        case "STATUS":
          return <CustomChip text={t(value)} shade={value === "PUBLISHED" ? "green" : "orange"} />;
        case "CS_ACTIONS":
          return (
            <span>
              <div
                style={{
                  position: "absolute",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  width: 40,
                  height: 0,
                  marginRight: 10,
                }}
              >
                <div style={{ cursor: "pointer" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <ActionEdit column={column} row={row} master="commonUiConfig" module="HomeHearingConfig" />{" "}
                  </svg>
                </div>
              </div>
              <div style={{ position: "absolute", display: "flex", justifyContent: "center", alignItems: "center", width: 40, height: 0 }}>
                <div style={{ cursor: "pointer" }}>
                  <svg width="4" height="16" viewBox="0 0 4 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <OverlayDropdown style={{ position: "relative" }} column={column} row={row} master="commonUiConfig" module="HomeHearingConfig" />{" "}
                  </svg>
                </div>
              </div>
            </span>
          );
        case "S.NO":
          return row?.index ? row?.index + 1 : 1;
        case "CASE_NAME":
          return (
            <Link
              to={`/${window?.contextPath}/ui/employee/dristi/home/view-case?caseId=${row?.businessObject?.hearingDetails?.caseUuid}&filingNumber=${row?.businessObject?.hearingDetails?.filingNumber}&tab=Overview`}
            >
              {value ? value : "-"}
            </Link>
          );
        default:
          return value ? value : "-";
      }
    },
    dropDownItems: (row, configs) => {
      const OrderWorkflowAction = Digit.ComponentRegistryService.getComponent("OrderWorkflowActionEnum") || {};
      const ordersService = Digit.ComponentRegistryService.getComponent("OrdersService") || {};
      const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
      const date = new Date(row.startTime);
      const future = row.startTime > Date.now();
      const showActions = configs && configs.hasOwnProperty("showMakeSubmission") ? configs.showMakeSubmission : true;
      if (row?.businessObject?.hearingDetails?.status === "SCHEDULED" && userInfo.roles.map((role) => role.code).includes("JUDGE_ROLE")) {
        return [
          {
            label: "Start hearing",
            id: "reschedule",
            action: (history) => {
              const requestBody = {
                order: {
                  createdDate: null,
                  tenantId: row.tenantId,
                  hearingNumber: row?.hearingId,
                  filingNumber: row.filingNumber[0],
                  cnrNumber: row.cnrNumbers[0],
                  statuteSection: {
                    tenantId: row.tenantId,
                  },
                  orderTitle: "INITIATING_RESCHEDULING_OF_HEARING_DATE",
                  orderCategory: "INTERMEDIATE",
                  orderType: "INITIATING_RESCHEDULING_OF_HEARING_DATE",
                  status: "",
                  isActive: true,
                  workflow: {
                    action: OrderWorkflowAction.SAVE_DRAFT,
                    comments: "Creating order",
                    assignes: null,
                    rating: null,
                    documents: [{}],
                  },
                  documents: [],
                  additionalDetails: {
                    formdata: {
                      orderType: {
                        type: "INITIATING_RESCHEDULING_OF_HEARING_DATE",
                        isactive: true,
                        code: "INITIATING_RESCHEDULING_OF_HEARING_DATE",
                        name: "ORDER_TYPE_INITIATING_RESCHEDULING_OF_HEARING_DATE",
                      },
                      originalHearingDate: `${date.getFullYear()}-${date.getMonth() < 9 ? `0${date.getMonth() + 1}` : date.getMonth() + 1}-${
                        date.getDate() < 10 ? `0${date.getDate()}` : date.getDate()
                      }`,
                    },
                  },
                },
              };
              ordersService
                .createOrder(requestBody, { tenantId: Digit.ULBService.getCurrentTenantId() })
                .then((res) => {
                  history.push(
                    `/${window.contextPath}/employee/orders/generate-orders?filingNumber=${row.filingNumber[0]}&orderNumber=${res.order.orderNumber}`,
                    {
                      caseId: row.caseId,
                      tab: "Orders",
                    }
                  );
                })
                .catch((err) => {});
            },
          },
          {
            label: "Mark as Passed Over",
            id: "reschedule",
            action: (history) => {
              const requestBody = {
                order: {
                  createdDate: null,
                  tenantId: row.tenantId,
                  hearingNumber: row?.hearingId,
                  filingNumber: row.filingNumber[0],
                  cnrNumber: row.cnrNumbers[0],
                  statuteSection: {
                    tenantId: row.tenantId,
                  },
                  orderTitle: "INITIATING_RESCHEDULING_OF_HEARING_DATE",
                  orderCategory: "INTERMEDIATE",
                  orderType: "INITIATING_RESCHEDULING_OF_HEARING_DATE",
                  status: "",
                  isActive: true,
                  workflow: {
                    action: OrderWorkflowAction.SAVE_DRAFT,
                    comments: "Creating order",
                    assignes: null,
                    rating: null,
                    documents: [{}],
                  },
                  documents: [],
                  additionalDetails: {
                    formdata: {
                      orderType: {
                        type: "INITIATING_RESCHEDULING_OF_HEARING_DATE",
                        isactive: true,
                        code: "INITIATING_RESCHEDULING_OF_HEARING_DATE",
                        name: "ORDER_TYPE_INITIATING_RESCHEDULING_OF_HEARING_DATE",
                      },
                      originalHearingDate: `${date.getFullYear()}-${date.getMonth() < 9 ? `0${date.getMonth() + 1}` : date.getMonth() + 1}-${
                        date.getDate() < 10 ? `0${date.getDate()}` : date.getDate()
                      }`,
                    },
                  },
                },
              };
              ordersService
                .createOrder(requestBody, { tenantId: Digit.ULBService.getCurrentTenantId() })
                .then((res) => {
                  history.push(
                    `/${window.contextPath}/employee/orders/generate-orders?filingNumber=${row.filingNumber[0]}&orderNumber=${res.order.orderNumber}`,
                    {
                      caseId: row.caseId,
                      tab: "Orders",
                    }
                  );
                })
                .catch((err) => {});
            },
          },
        ];
      } else if (row?.businessObject?.hearingDetails?.status === "IN_PROGRESS" && userInfo.roles.map((role) => role.code).includes("JUDGE_ROLE")) {
        return [
          {
            label: "End hearing",
            id: "reschedule",
            action: (history) => {
              const requestBody = {
                order: {
                  createdDate: null,
                  tenantId: row.tenantId,
                  hearingNumber: row?.hearingId,
                  filingNumber: row.filingNumber[0],
                  cnrNumber: row.cnrNumbers[0],
                  statuteSection: {
                    tenantId: row.tenantId,
                  },
                  orderTitle: "INITIATING_RESCHEDULING_OF_HEARING_DATE",
                  orderCategory: "INTERMEDIATE",
                  orderType: "INITIATING_RESCHEDULING_OF_HEARING_DATE",
                  status: "",
                  isActive: true,
                  workflow: {
                    action: OrderWorkflowAction.SAVE_DRAFT,
                    comments: "Creating order",
                    assignes: null,
                    rating: null,
                    documents: [{}],
                  },
                  documents: [],
                  additionalDetails: {
                    formdata: {
                      orderType: {
                        type: "INITIATING_RESCHEDULING_OF_HEARING_DATE",
                        isactive: true,
                        code: "INITIATING_RESCHEDULING_OF_HEARING_DATE",
                        name: "ORDER_TYPE_INITIATING_RESCHEDULING_OF_HEARING_DATE",
                      },
                      originalHearingDate: `${date.getFullYear()}-${date.getMonth() < 9 ? `0${date.getMonth() + 1}` : date.getMonth() + 1}-${
                        date.getDate() < 10 ? `0${date.getDate()}` : date.getDate()
                      }`,
                    },
                  },
                },
              };
              ordersService
                .createOrder(requestBody, { tenantId: Digit.ULBService.getCurrentTenantId() })
                .then((res) => {
                  history.push(
                    `/${window.contextPath}/employee/orders/generate-orders?filingNumber=${row.filingNumber[0]}&orderNumber=${res.order.orderNumber}`,
                    {
                      caseId: row.caseId,
                      tab: "Orders",
                    }
                  );
                })
                .catch((err) => {});
            },
          },
          {
            label: "Mark as Passed Over",
            id: "reschedule",
            action: (history) => {
              const requestBody = {
                order: {
                  createdDate: null,
                  tenantId: row.tenantId,
                  hearingNumber: row?.hearingId,
                  filingNumber: row.filingNumber[0],
                  cnrNumber: row.cnrNumbers[0],
                  statuteSection: {
                    tenantId: row.tenantId,
                  },
                  orderTitle: "INITIATING_RESCHEDULING_OF_HEARING_DATE",
                  orderCategory: "INTERMEDIATE",
                  orderType: "INITIATING_RESCHEDULING_OF_HEARING_DATE",
                  status: "",
                  isActive: true,
                  workflow: {
                    action: OrderWorkflowAction.SAVE_DRAFT,
                    comments: "Creating order",
                    assignes: null,
                    rating: null,
                    documents: [{}],
                  },
                  documents: [],
                  additionalDetails: {
                    formdata: {
                      orderType: {
                        type: "INITIATING_RESCHEDULING_OF_HEARING_DATE",
                        isactive: true,
                        code: "INITIATING_RESCHEDULING_OF_HEARING_DATE",
                        name: "ORDER_TYPE_INITIATING_RESCHEDULING_OF_HEARING_DATE",
                      },
                      originalHearingDate: `${date.getFullYear()}-${date.getMonth() < 9 ? `0${date.getMonth() + 1}` : date.getMonth() + 1}-${
                        date.getDate() < 10 ? `0${date.getDate()}` : date.getDate()
                      }`,
                    },
                  },
                },
              };
              ordersService
                .createOrder(requestBody, { tenantId: Digit.ULBService.getCurrentTenantId() })
                .then((res) => {
                  history.push(
                    `/${window.contextPath}/employee/orders/generate-orders?filingNumber=${row.filingNumber[0]}&orderNumber=${res.order.orderNumber}`,
                    {
                      caseId: row.caseId,
                      tab: "Orders",
                    }
                  );
                })
                .catch((err) => {});
            },
          },
        ];
      }
    },
  },
  HomePendingConfig: {
    preProcess: (requestCriteria, additionalDetails) => {
      const tenantId = window?.Digit.ULBService.getStateId();
      const userRoles = Digit.UserService.getUser()?.info?.roles.map((role) => role?.code);
      const currentDateInMs = new Date().setHours(23, 59, 59, 999);
      const selectedDateInMs = new Date(requestCriteria?.state?.searchForm?.date).setHours(23, 59, 59, 999);
      const activeTab = additionalDetails?.activeTab;
      return {
        ...requestCriteria,
        body: {
          // ...requestCriteria.body,
          SearchCriteria: {
            ...requestCriteria.body.SearchCriteria,
            moduleSearchCriteria: {
              ...requestCriteria?.body?.SearchCriteria?.moduleSearchCriteria,
              ...(requestCriteria?.state?.searchForm?.stage && { substage: requestCriteria?.state?.searchForm?.stage?.code }),
              courtId: localStorage.getItem("courtId"),
            },
            searchReviewProcess: {
              date: activeTab === "REVIEW_PROCESS" ? selectedDateInMs : currentDateInMs,
              isOnlyCountRequired: activeTab === "REVIEW_PROCESS" ? false : true,
              actionCategory: "Review Process",
              ...(activeTab === "REVIEW_PROCESS" &&
                requestCriteria?.state?.searchForm?.caseSearchText && {
                  searchableFields: requestCriteria?.state?.searchForm?.caseSearchText,
                }),
            },
            searchViewApplication: {
              date: activeTab === "VIEW_APPLICATION" ? selectedDateInMs : currentDateInMs,
              isOnlyCountRequired: activeTab === "VIEW_APPLICATION" ? false : true,
              actionCategory: "View Application",
              ...(activeTab === "VIEW_APPLICATION" &&
                requestCriteria?.state?.searchForm?.caseSearchText && {
                  searchableFields: requestCriteria?.state?.searchForm?.caseSearchText,
                }),
            },
            searchScheduleHearing: {
              date: activeTab === "SCHEDULE_HEARING" ? selectedDateInMs : currentDateInMs,
              isOnlyCountRequired: activeTab === "SCHEDULE_HEARING" ? false : true,
              actionCategory: "Schedule Hearing",
              ...(activeTab === "SCHEDULE_HEARING" &&
                requestCriteria?.state?.searchForm?.caseSearchText && {
                  searchableFields: requestCriteria?.state?.searchForm?.caseSearchText,
                }),
            },
            searchRegisterCases: {
              date: null,
              isOnlyCountRequired: activeTab === "REGISTRATION" ? false : true,
              actionCategory: "Register cases",
              ...(activeTab === "REGISTRATION" &&
                requestCriteria?.state?.searchForm?.caseSearchText && {
                  searchableFields: requestCriteria?.state?.searchForm?.caseSearchText,
                }),
            },
            searchBailBonds: {
              date: activeTab === "BAIL_BOND_STATUS" ? selectedDateInMs : currentDateInMs,
              isOnlyCountRequired: activeTab === "BAIL_BOND_STATUS" ? false : true,
              actionCategory: "Bail Bond",
              ...(activeTab === "BAIL_BOND_STATUS" &&
                requestCriteria?.state?.searchForm?.caseSearchText && {
                  searchableFields: requestCriteria?.state?.searchForm?.caseSearchText,
                }),
            },
            limit: requestCriteria?.state?.tableForm?.limit || 10,
            offset: requestCriteria?.state?.tableForm?.offset || 0,
          },
        },
        config: {
          ...requestCriteria.config,
          select: (data) => {
            const reviwCount = data?.reviewProcessData?.count || 0;
            const applicationCount = data?.viewApplicationData?.count || 0;
            const scheduleCount = data?.scheduleHearingData?.count || 0;
            const registerCount = data?.registerCasesData?.count || 0;
            const bailBondStatusCount = data?.bailBondData?.count || 0;

            // setPendingTaskCount();
            additionalDetails?.setCount({
              REGISTRATION: registerCount,
              REVIEW_PROCESS: reviwCount,
              VIEW_APPLICATION: applicationCount,
              SCHEDULE_HEARING: scheduleCount,
              BAIL_BOND_STATUS: bailBondStatusCount,
            });
            const processFields = (fields) => {
              const result = fields?.reduce((acc, curr) => {
                const key = curr?.key;
                if (key.includes("advocateDetails")) {
                  const subKey = key.replace("advocateDetails.", "");
                  if (subKey.includes("[")) {
                    const arrayKey = subKey.replace(/\[.*?\]/g, "");
                    if (!acc.advocateDetails) acc.advocateDetails = {};
                    if (!acc.advocateDetails[arrayKey]) acc.advocateDetails[arrayKey] = [];
                    acc.advocateDetails[arrayKey].push(curr.value);
                  } else {
                    if (!acc.advocateDetails) acc.advocateDetails = {};
                    acc.advocateDetails[subKey] = curr.value;
                  }
                } else {
                  acc[key] = curr.value;
                }
                return acc;
              }, {});

              return {
                caseTitle: result?.caseTitle,
                caseNumber: result?.caseNumber,
                substage: result?.substage,
                filingNumber: result?.filingNumber,
                caseId: result?.caseId,
                advocateDetails: result?.advocateDetails,
                tab: activeTab,
              };
            };
            if (activeTab === "REVIEW_PROCESS") {
              return {
                TotalCount: data?.reviewProcessData?.count,
                data: data?.reviewProcessData?.data?.map((item) => processFields(item.fields)) || [],
              };
            } else if (activeTab === "VIEW_APPLICATION") {
              return {
                TotalCount: data?.viewApplicationData?.count,
                data: data?.viewApplicationData?.data?.map((item) => processFields(item.fields)),
              };
            } else if (activeTab === "SCHEDULE_HEARING")
              return {
                TotalCount: data?.scheduleHearingData?.count,
                data: data?.scheduleHearingData?.data?.map((item) => processFields(item.fields)),
              };
            else if (activeTab === "BAIL_BOND_STATUS") {
              return {
                TotalCount: data?.bailBondData?.count,
                data: data?.bailBondData?.data?.map((item) => processFields(item.fields)),
              };
            } else
              return {
                TotalCount: data?.registerCasesData?.count,
                data: data?.registerCasesData?.data?.map((item) => processFields(item.fields)) || [],
              };
          },
        },
      };
    },
    additionalCustomizations: (row, key, column, value, t, additionalDetails) => {
      switch (key) {
        case "PENDING_CASE_NAME": {
          return row?.tab === "REGISTRATION" ? (
            <Link
              style={{ color: "black", textDecoration: "underline" }}
              to={{
                pathname: `/${window?.contextPath}/employee/dristi/admission`,
                search: `?caseId=${row?.caseId}&filingNumber=${row?.filingNumber}&tab=Overview`,
                state: { homeActiveTab: row?.tab },
              }}
            >
              {value ? value : "-"}
            </Link>
          ) : row?.tab === "BAIL_BOND_STATUS" ? (
            <OrderName rowData={row} colData={column} value={value} />
          ) : (
            // <BailBondModal style={{ position: "relative" }} column={column} row={row} master="commonUiConfig" module="SearchIndividualConfig" />
            <Link
              style={{ color: "black", textDecoration: "underline" }}
              to={{
                pathname: `/${window?.contextPath}/employee/dristi/home/view-case`,
                search: `?caseId=${row?.caseId}&filingNumber=${row?.filingNumber}&tab=Overview&fromHome=true`,
                state: { homeActiveTab: row?.tab },
              }}
            >
              {value ? value : "-"}
            </Link>
          );
        }
        case "ADVOCATES":
          if (value === null || value === undefined || value === "undefined" || value === "null") {
            return null;
          }
          return (
            <div>
              <p data-tip data-for={`hearing-list`}>
                {row?.advocateDetails?.complainant?.length > 0 &&
                  `${row?.advocateDetails?.complainant?.[0]}(C)${
                    row?.advocateDetails?.complainant?.length === 2
                      ? " + 1 Other"
                      : row?.advocateDetails?.complainant?.length > 2
                      ? ` + ${row?.advocateDetails?.complainant?.length - 1} others`
                      : ""
                  }`}
              </p>
              <p data-tip data-for={`hearing-list`}>
                {row?.advocateDetails?.accused?.length > 0 &&
                  `${row?.advocateDetails?.accused?.[0]}(A)${
                    row?.advocateDetails?.accused?.length === 2
                      ? " + 1 Other"
                      : row?.advocateDetails?.accused?.length > 2
                      ? ` + ${row?.advocateDetails?.accused?.length - 1} others`
                      : ""
                  }`}
              </p>
            </div>
          );
        case "STAGE":
          return t(value);
        default:
          return value ? value : "-";
      }
    },
  },

  BailBondConfig: {
    preProcess: (requestCriteria, additionalDetails) => {
      const tenantId = window?.Digit.ULBService.getStateId();
      const userRoles = Digit.UserService.getUser()?.info?.roles.map((role) => role?.code);
      const currentDateInMs = new Date().setHours(23, 59, 59, 999);
      const selectedDateInMs = new Date(requestCriteria?.state?.searchForm?.date).setHours(23, 59, 59, 999);
      const isCitizen = userRoles?.includes("CITIZEN");

      const limit = requestCriteria?.state?.tableForm?.limit || 10;
      const offSet = requestCriteria?.state?.tableForm?.offset || 0;
      const bailId = requestCriteria?.state?.searchForm?.bailId;
      return {
        ...requestCriteria,
        body: {
          ...requestCriteria?.body,
          tenantId: tenantId,
          criteria: {
            ...requestCriteria?.body?.criteria,
            ...(bailId && { bailId }),
            ...(isCitizen ? {} : { status: ["PENDING_REVIEW", "COMPLETED", "VOID"] }),
            fuzzySearch: true,
          },
          pagination: {
            sortBy: "bailCreatedTime",
            order: "desc",
            limit: limit,
            offSet: offSet,
          },
        },
        config: {
          ...requestCriteria?.config,
          select: (data) => {
            return { ...data, totalCount: data?.pagination?.totalCount };
          },
        },
      };
    },

    additionalCustomizations: (row, key, column, value, t, additionalDetails) => {
      switch (key) {
        case "BAIL_TYPE":
          return <Evidence userRoles={userRoles} rowData={row} colData={column} t={t} value={value} showAsHeading={true} isBail={true} />;
        case "STAGE":
          return t(value);
        case "STATUS":
          return <CustomChip text={t(value)} shade={value === "COMPLETED" ? "green" : "orange"} />;
        case "BAIL_ID":
          return value;
        default:
          return value ? value : "-";
      }
    },
  },
  patternValidation: (key) => {
    switch (key) {
      case "contact":
        return /^[6-9]\d{9}$/;
      case "email":
        return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      case "userName":
        return /^[^{0-9}^\$\"<>?\\\\~!@#$%^()+={}\[\]*,/_:;“”‘’]{1,50}$/i;
      case "address":
        return /^[^\$\"<>?\\\\~`!@$%^()={}\[\]*:;“”‘’]{2,256}$/i;
      case "nonNumericString":
        return /^[^0-9]{1,}$/i;
      default:
        return;
    }
  },
  maxDateValidation: (key) => {
    switch (key) {
      case "date":
        return new Date().toISOString().split("T")[0];
      default:
        return;
    }
  },
  DristiCaseUtils: {
    getAllCaseRepresentativesUUID: (caseData) => {
      let representatives = {};
      let list = [];
      caseData?.litigants?.forEach((litigant) => {
        list = caseData?.representatives
          ?.filter((item) => {
            return item?.representing?.some((lit) => lit?.individualId === litigant?.individualId) && item?.additionalDetails?.uuid;
          })
          .map((item) => item?.additionalDetails?.uuid);
        if (list?.length > 0) {
          representatives[litigant?.additionalDetails?.uuid] = list;
        } else {
          representatives[litigant?.additionalDetails?.uuid] = [litigant?.additionalDetails?.uuid];
        }
      });
      return representatives;
    },
  },
};
