import { Button } from "@egovernments/digit-ui-react-components";
import React from "react";
import OverlayDropdown from "../components/HearingOverlayDropdown";
import { hearingService } from "../hooks/services";
import { HearingWorkflowState } from "@egovernments/digit-ui-module-orders/src/utils/hearingWorkflow";
import { formatNoticeDeliveryDate } from "@egovernments/digit-ui-module-home/src/utils";
import CustomChip from "@egovernments/digit-ui-module-dristi/src/components/CustomChip";

function normalizeData(input) {
  try {
    return typeof input === "string" ? JSON.parse(input) : input;
  } catch (error) {
    console.error("Failed to parse input", error);
    return null;
  }
}

export const UICustomizations = {
  PreHearingsConfig: {
    preProcess: (requestCriteria, additionalDetails) => {
      const courtId = requestCriteria?.body?.courtId;
      const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
      const updatedCriteria = {
        processSearchCriteria: {
          businessService: ["hearing-default"],
          moduleName: "Hearing Service",
          tenantId: requestCriteria?.params?.tenantId,
        },
        moduleSearchCriteria: {
          fromDate: requestCriteria?.params.fromDate,
          toDate: requestCriteria?.params.toDate,
          tenantId: requestCriteria?.params?.tenantId,
          ...(courtId && { courtId }),
          ...(userInfo?.type === "CITIZEN" && { searchableFields: additionalDetails?.attendeeIndividualId }),
        },
        tenantId: requestCriteria?.params?.tenantId,
        limit: requestCriteria?.state?.tableForm?.limit || 10,
        offset: requestCriteria?.state?.tableForm?.offset || 0,
      };

      return {
        ...requestCriteria,
        body: {
          inbox: updatedCriteria,
        },
      };
    },
    additionalCustomizations: (row, key, column, value, t, searchResult) => {
      const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
      const userType = userInfo?.type === "CITIZEN" ? "citizen" : "employee";
      const courtId = localStorage.getItem("courtId");
      const searchParams = new URLSearchParams();
      const showAction =
        userInfo?.roles.map((role) => role.code).includes("HEARING_EDITOR") || row.hearing.status === HearingWorkflowState?.INPROGRESS;
      searchParams.set("hearingId", row.hearingId);
      switch (key) {
        case "Actions":
          return (
            <div style={{ display: "flex", justifyContent: "flex-end  ", alignItems: "center" }}>
              {row.hearing.status === "SCHEDULED" && userInfo?.roles.map((role) => role.code).includes("HEARING_EDITOR") && (
                <Button
                  variation={"secondary"}
                  label={t(`START_HEARING`)}
                  onButtonClick={() => {
                    hearingService
                      .searchHearings(
                        {
                          criteria: {
                            hearingId: row?.hearingId,
                            tenantId: row?.tenantId,
                            ...(courtId && userType === "employee" && { courtId }),
                          },
                        },
                        { tenantId: row?.tenantId }
                      )
                      .then((response) => {
                        hearingService.startHearing({ hearing: response?.HearingList?.[0] }).then(() => {
                          window.location = `/${window.contextPath}/${userType}/dristi/home/view-case?caseId=${row.caseId}&filingNumber=${row.filingNumber}&tab=Overview`;
                        });
                      });
                  }}
                  style={{ marginRight: "1rem" }}
                  textStyles={{
                    fontFamily: "Roboto",
                    fontSize: "16px",
                    fontWeight: 700,
                    lineHeight: "18.75px",
                    textAlign: "center",
                  }}
                />
              )}
              {row.hearing.status === "SCHEDULED" && !userInfo.roles.map((role) => role.code).includes("HEARING_EDITOR") && (
                <span style={{ color: "#007E7E" }}>{t("HEARING_AWAITING_START")}</span>
              )}
              {row.hearing.status === HearingWorkflowState?.INPROGRESS && userInfo.roles.map((role) => role.code).includes("HEARING_EDITOR") && (
                <Button
                  variation={"secondary"}
                  label={t("JOIN_HEARING")}
                  onButtonClick={() => {
                    const path = `/${window.contextPath}/${userType}/dristi/home/view-case?caseId=${row.caseId}&filingNumber=${row.filingNumber}&tab=Overview`;
                    window.location = path;
                  }}
                  style={{ marginRight: "1rem" }}
                  textStyles={{
                    fontFamily: "Roboto",
                    fontSize: "16px",
                    fontWeight: 700,
                    lineHeight: "18.75px",
                    textAlign: "center",
                  }}
                />
              )}
              {showAction && (
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
                  module="PreHearingsConfig"
                />
              )}
            </div>
          );
        case "CS_STAGE":
          return t(value);
        default:
          return t("ES_COMMON_NA");
      }
    },
    dropDownItems: (row) => {
      const OrderWorkflowAction = Digit.ComponentRegistryService.getComponent("OrderWorkflowActionEnum") || {};
      const ordersService = Digit.ComponentRegistryService.getComponent("OrdersService") || {};
      const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
      const userType = userInfo?.type === "CITIZEN" ? "citizen" : "employee";
      const searchParams = new URLSearchParams();
      const future = row.hearing.startTime > Date.now();
      if (userInfo?.roles.map((role) => role.code).includes("EMPLOYEE")) {
        if (future) {
          return [
            {
              label: "View Case",
              id: "view_case",
              action: (history) => {
                searchParams.set("caseId", row.caseId);
                searchParams.set("filingNumber", row.filingNumber);
                window.open(`/${window.contextPath}/${userType}/dristi/home/view-case?${searchParams.toString()}`, "_blank");
              },
            },
            {
              label: "Reschedule hearing",
              id: "reschedule",
              action: (history, column) => {
                column.openRescheduleDialog(row);
              },
            },
          ];
        }
        return [
          {
            label: "View Case",
            id: "view_case",
            action: (history) => {
              searchParams.set("caseId", row.caseId);
              searchParams.set("filingNumber", row.filingNumber);
              window.open(`/${window.contextPath}/${userType}/dristi/home/view-case?${searchParams.toString()}`, "_blank");
            },
          },
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
      }

      if (userInfo?.roles.map((role) => role.code).includes("CITIZEN")) {
        if (future) {
          return [
            {
              label: "View Case",
              id: "view_case",
              action: (history) => {
                searchParams.set("caseId", row.caseId);
                searchParams.set("filingNumber", row.filingNumber);

                history.push({ pathname: `/${window.contextPath}/${userType}/dristi/home/view-case`, search: searchParams.toString() });
              },
            },
            {
              label: "Request for Reschedule",
              id: "reschedule",
              action: (history) => {
                searchParams.set("hearingId", row.hearingId);
                searchParams.set("applicationType", "RE_SCHEDULE");
                searchParams.set("filingNumber", row.filingNumber);
                history.push({ pathname: `/${window.contextPath}/${userType}/submissions/submissions-create`, search: searchParams.toString() });
              },
            },
          ];
        }
        return [
          {
            label: "View Case",
            id: "view_case",
            action: (history) => {
              searchParams.set("caseId", row.caseId);
              searchParams.set("filingNumber", row.filingNumber);

              history.push({ pathname: `/${window.contextPath}/${userType}/dristi/home/view-case`, search: searchParams.toString() });
            },
          },
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
      }
      return [];
    },
  },
  summonWarrantConfig: {
    preProcess: (requestCriteria, additionalDetails) => {
      // We need to change tenantId "processSearchCriteria" here
      const tenantId = window?.Digit.ULBService.getStateId();

      return {
        ...requestCriteria,
        config: {
          ...requestCriteria?.config,
          select: (data) => {
            const generateAddress = ({
              pincode = "",
              district = "",
              city = "",
              state = "",
              coordinates = { longitude: "", latitude: "" },
              locality = "",
              address = "",
            }) => {
              if (address && typeof address === "string") {
                return address;
              } else if (address && typeof address === "object") {
                const { pincode = "", district = "", city = "", state = "", locality = "" } = address;
                return `${locality} ${district} ${city} ${state} ${pincode ? ` - ${pincode}` : ""}`.trim();
              } else return `${locality} ${district} ${city} ${state} ${pincode ? ` - ${pincode}` : ""}`.trim();
            };
            const taskData = data?.list
              ?.filter(
                (data) =>
                  data?.filingNumber === additionalDetails?.filingNumber &&
                  data?.orderId === additionalDetails?.orderId &&
                  (!additionalDetails?.itemId || data?.additionalDetails?.itemId === additionalDetails?.itemId)
              )
              ?.map((data) => {
                let taskDetail = structuredClone(data?.taskDetails);
                taskDetail = normalizeData(taskDetail);
                const channelDetailsEnum = {
                  SMS: "phone",
                  Email: "email",
                  EMAIL: "email",
                  Post: "address",
                  EPOST: "address",
                  Police: "address",
                  POLICE: "address",
                  RPAD: "address",
                };
                function mapStatus(status, taskType) {
                  const mapping = {
                    ISSUE_WARRANT: {
                      PROCLAMATION: "ISSUE_PROCLAMATION",
                      ATTACHMENT: "ISSUE_ATTACHMENT",
                    },
                    WARRANT_SENT: {
                      PROCLAMATION: "PROCLAMATION_SENT",
                      ATTACHMENT: "ATTACHMENT_SENT",
                    },
                  };
                  return mapping[status]?.[taskType] || status; // fallback to original
                }
                let chanelDeatils = "";
                if (data?.taskType === "MISCELLANEOUS_PROCESS") {
                  const type = taskDetail?.miscellaneuosDetails?.addressee;
                  switch (type) {
                    case "POLICE":
                      const policeDetails = taskDetail?.policeDetails;
                      chanelDeatils = `${policeDetails?.name}, ${policeDetails?.district}`;
                      break;
                    case "OTHER":
                      const othersDetails = taskDetail?.others;
                      chanelDeatils = `${othersDetails?.name}`;
                      break;
                    default:
                      chanelDeatils = "-";
                      break;
                  }
                } else {
                  const data =
                    taskDetail?.respondentDetails?.[channelDetailsEnum?.[taskDetail?.deliveryChannels?.channelName]] ||
                    taskDetail?.witnessDetails?.[channelDetailsEnum?.[taskDetail?.deliveryChannels?.channelName]];
                  chanelDeatils = typeof data === "object" ? generateAddress({ ...data }) : data;
                }

                return {
                  deliveryChannel: taskDetail?.deliveryChannels?.channelName,
                  channelDetails: chanelDeatils,
                  status: mapStatus(data?.status, data?.taskType),
                  remarks: taskDetail?.remarks?.remark,
                  statusChangeDate: taskDetail?.deliveryChannels?.statusChangeDate,
                  taskType: data?.taskType,
                  documents: data?.documents,
                  feePaidDate: taskDetail?.deliveryChannels?.feePaidDate,
                };
              });
            if (typeof additionalDetails?.setHasTasks === "function") {
              additionalDetails.setHasTasks(taskData.length > 0);
            }

            return { list: taskData || [] };
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
      switch (key) {
        case "Status":
          return (
            <CustomChip
              text={t(value)}
              shade={
                value === "DELIVERED"
                  ? "green"
                  : value === "UNDELIVERED" || value === "PAYMENT_EXPIRED"
                  ? "red"
                  : value === "pending" || value === "PAYMENT_PENDING"
                  ? "grey"
                  : "orange"
              }
            />
          );
        // return t(value);
        case "DELIEVRY_DATE":
          return formatNoticeDeliveryDate(value) || "N/A";
        case "PROCESS_FEE_PAID_ON":
          return value || "-";
        case "Delivery Channels":
          return value === "EPOST" ? t("CS_POST") : t(value);
        default:
          return t("ES_COMMON_NA");
      }
    },
  },
};
