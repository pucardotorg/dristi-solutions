import React, { useMemo, useState, useCallback, useEffect } from "react";
import { HomeService } from "../../hooks/services";
import { Link } from "react-router-dom";
import { Dropdown, TextInput, LabelFieldPair, CardLabel } from "@egovernments/digit-ui-react-components";
import AsyncOverlayDropdown from "@egovernments/digit-ui-module-dristi/src/components/AsyncOverlayDropdown";
import { hearingService } from "@egovernments/digit-ui-module-hearings/src/hooks/services";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { CloseSvg, CheckBox } from "@egovernments/digit-ui-react-components";
import { ordersService } from "@egovernments/digit-ui-module-orders/src/hooks/services";
import { OrderWorkflowState } from "@egovernments/digit-ui-module-orders/src/utils/orderWorkflow";

const Heading = (props) => {
  return <h1 className="heading-m">{props.label}</h1>;
};

const CloseBtn = (props) => {
  return (
    <div
      onClick={props?.onClick}
      style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        paddingRight: "20px",
        cursor: "pointer",
        ...(props?.backgroundColor && { backgroundColor: props.backgroundColor }),
      }}
    >
      <CloseSvg />
    </div>
  );
};
function useInboxSearch({ limit = 300, offset = 0 } = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInbox = useCallback(
    async (filters, setHearingCount) => {
      setLoading(true);
      setError(null);
      try {
        let fromDate, toDate;
        if (filters.date) {
          const dateObj = new Date(filters.date);
          fromDate = new Date(dateObj.setHours(0, 0, 0, 0)).getTime();
          toDate = new Date(dateObj.setHours(23, 59, 59, 999)).getTime();
        }
        const payload = {
          inbox: {
            processSearchCriteria: {
              businessService: ["hearing-default"],
              moduleName: "Hearing Service",
              tenantId: "kl",
            },
            moduleSearchCriteria: {
              tenantId: "kl",
              ...(fromDate && toDate ? { fromDate, toDate } : {}),
            },
            tenantId: "kl",
            limit,
            offset,
          },
        };
        if (filters?.status?.code) payload.inbox.moduleSearchCriteria.status = filters?.status?.code;
        if (filters?.purpose) payload.inbox.moduleSearchCriteria.hearingType = filters.purpose?.code;
        if (filters?.caseQuery) payload.inbox.moduleSearchCriteria.searchableFields = filters.caseQuery;

        const res = await HomeService.InboxSearch(payload, { tenantId: "kl" });
        setData(res?.items || []);
        setHearingCount(res?.totalCount || 0);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [limit, offset]
  );

  return { data, loading, error, fetchInbox };
}

const todayStr = new Date().toISOString().slice(0, 10);

const HomeHearingsTab = ({ t, setHearingCount = () => {} }) => {
  const [filters, setFilters] = useState({
    date: todayStr,
    status: "",
    purpose: "",
    caseQuery: "",
  });
  const history = useHistory();

  const { data: tableData, loading, error, fetchInbox } = useInboxSearch();
  const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
  const name = userInfo?.name;
  const roles = useMemo(() => userInfo?.roles, [userInfo]);

  const isJudge = useMemo(() => roles?.some((role) => role?.code === "JUDGE_ROLE"), [roles]);
  const isBenchClerk = useMemo(() => roles?.some((role) => role?.code === "BENCH_CLERK"), [roles]);

  const userType = Digit.UserService.getType();
  const [passOver, setPassOver] = useState(false);
  const [showEndHearingModal, setShowEndHearingModal] = useState({ isNextHearingDrafted: false, openEndHearingModal: false, currentHearing: {} });
  const Modal = window?.Digit?.ComponentRegistryService?.getComponent("Modal");

  const handleClear = useCallback(() => {
    const cleared = { date: todayStr, status: "", purpose: "", caseQuery: "" };
    setFilters(cleared);
    fetchInbox(cleared, setHearingCount);
  }, [fetchInbox, setHearingCount]);

  const handleSearch = useCallback(() => {
    fetchInbox(filters, setHearingCount);
  }, [fetchInbox, filters, setHearingCount]);

  useEffect(() => {
    fetchInbox(filters, setHearingCount);
  }, []);

  const stateId = React.useMemo(() => Digit.ULBService.getStateId(), []);

  const { data: hearingTypeOptions, isLoading: isOptionsLoading } = Digit.Hooks.useCustomMDMS(stateId, "Hearing", [{ name: "HearingType" }], {
    select: (data) => {
      return data || [];
    },
  });
  // need to fetch from mdms
  const statusOptions = [
    { code: "SCHEDULED", name: "Scheduled" },
    { code: "IN_PROGRESS", name: "Ongoing" },
    { code: "PASSED_OVER", name: "Passed Over" },
    { code: "COMPLETED", name: "Completed" },
    { code: "ABATED", name: "Abandoned" },
    // {code : "OPT_OUT" ,name : "Opt out"}
  ];

  const statusClass = (status) => {
    if (!status) return "status-default";
    if (status === "COMPLETED") return "status-completed";
    if (status === "IN_PROGRESS") return "status-ongoing";
    if (status === "SCHEDULED") return "status-scheduled";
    if (status === "ABATED") return "status-abated";
    if (status === "OPT_OUT") return "status-completed";
    if (status === "PASSED_OVER") return "status-passed-over";
    return "status-default";
  };

  const EditIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clip-path="url(#clip0_5427_18191)">
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M18.2246 0.198856C18.2942 0.129011 18.377 0.0735972 18.4681 0.0357875C18.5592 -0.00202217 18.6569 -0.0214844 18.7556 -0.0214844C18.8542 -0.0214844 18.9519 -0.00202217 19.043 0.0357875C19.1341 0.0735972 19.2169 0.129011 19.2866 0.198856L23.7866 4.69886C23.8564 4.76852 23.9118 4.85129 23.9496 4.94241C23.9874 5.03352 24.0069 5.13121 24.0069 5.22986C24.0069 5.32851 23.9874 5.42619 23.9496 5.51731C23.9118 5.60842 23.8564 5.69119 23.7866 5.76086L8.78657 20.7609C8.71459 20.8323 8.62886 20.8885 8.53457 20.9259L1.03457 23.9259C0.898273 23.9804 0.748962 23.9938 0.605148 23.9643C0.461333 23.9348 0.329339 23.8637 0.22553 23.7599C0.12172 23.6561 0.0506596 23.5241 0.0211584 23.3803C-0.00834277 23.2365 0.00501248 23.0872 0.0595685 22.9509L3.05957 15.4509C3.09696 15.3566 3.15309 15.2708 3.22457 15.1989L18.2246 0.198856ZM16.8161 3.72986L20.2556 7.16936L22.1951 5.22986L18.7556 1.79036L16.8161 3.72986ZM19.1951 8.22986L15.7556 4.79036L6.00557 14.5404V14.9799H6.75557C6.95448 14.9799 7.14525 15.0589 7.2859 15.1995C7.42655 15.3402 7.50557 15.5309 7.50557 15.7299V16.4799H8.25557C8.45448 16.4799 8.64525 16.5589 8.7859 16.6995C8.92655 16.8402 9.00557 17.0309 9.00557 17.2299V17.9799H9.44507L19.1951 8.22986ZM4.55357 15.9924L4.39457 16.1514L2.10257 21.8829L7.83407 19.5909L7.99307 19.4319C7.85 19.3784 7.72666 19.2825 7.63954 19.1571C7.55242 19.0316 7.50568 18.8826 7.50557 18.7299V17.9799H6.75557C6.55666 17.9799 6.36589 17.9008 6.22524 17.7602C6.08459 17.6195 6.00557 17.4288 6.00557 17.2299V16.4799H5.25557C5.10284 16.4797 4.95378 16.433 4.82833 16.3459C4.70289 16.2588 4.60702 16.1354 4.55357 15.9924Z"
          fill="#00703C"
        />
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M18.2246 0.198856C18.2942 0.129011 18.377 0.0735972 18.4681 0.0357875C18.5592 -0.00202217 18.6569 -0.0214844 18.7556 -0.0214844C18.8542 -0.0214844 18.9519 -0.00202217 19.043 0.0357875C19.1341 0.0735972 19.2169 0.129011 19.2866 0.198856L23.7866 4.69886C23.8564 4.76852 23.9118 4.85129 23.9496 4.94241C23.9874 5.03352 24.0069 5.13121 24.0069 5.22986C24.0069 5.32851 23.9874 5.42619 23.9496 5.51731C23.9118 5.60842 23.8564 5.69119 23.7866 5.76086L8.78657 20.7609C8.71459 20.8323 8.62886 20.8885 8.53457 20.9259L1.03457 23.9259C0.898273 23.9804 0.748962 23.9938 0.605148 23.9643C0.461333 23.9348 0.329339 23.8637 0.22553 23.7599C0.12172 23.6561 0.0506596 23.5241 0.0211584 23.3803C-0.00834277 23.2365 0.00501248 23.0872 0.0595685 22.9509L3.05957 15.4509C3.09696 15.3566 3.15309 15.2708 3.22457 15.1989L18.2246 0.198856ZM16.8161 3.72986L20.2556 7.16936L22.1951 5.22986L18.7556 1.79036L16.8161 3.72986ZM19.1951 8.22986L15.7556 4.79036L6.00557 14.5404V14.9799H6.75557C6.95448 14.9799 7.14525 15.0589 7.2859 15.1995C7.42655 15.3402 7.50557 15.5309 7.50557 15.7299V16.4799H8.25557C8.45448 16.4799 8.64525 16.5589 8.7859 16.6995C8.92655 16.8402 9.00557 17.0309 9.00557 17.2299V17.9799H9.44507L19.1951 8.22986ZM4.55357 15.9924L4.39457 16.1514L2.10257 21.8829L7.83407 19.5909L7.99307 19.4319C7.85 19.3784 7.72666 19.2825 7.63954 19.1571C7.55242 19.0316 7.50568 18.8826 7.50557 18.7299V17.9799H6.75557C6.55666 17.9799 6.36589 17.9008 6.22524 17.7602C6.08459 17.6195 6.00557 17.4288 6.00557 17.2299V16.4799H5.25557C5.10284 16.4797 4.95378 16.433 4.82833 16.3459C4.70289 16.2588 4.60702 16.1354 4.55357 15.9924Z"
          fill="#00703C"
        />
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M18.2246 0.198856C18.2942 0.129011 18.377 0.0735972 18.4681 0.0357875C18.5592 -0.00202217 18.6569 -0.0214844 18.7556 -0.0214844C18.8542 -0.0214844 18.9519 -0.00202217 19.043 0.0357875C19.1341 0.0735972 19.2169 0.129011 19.2866 0.198856L23.7866 4.69886C23.8564 4.76852 23.9118 4.85129 23.9496 4.94241C23.9874 5.03352 24.0069 5.13121 24.0069 5.22986C24.0069 5.32851 23.9874 5.42619 23.9496 5.51731C23.9118 5.60842 23.8564 5.69119 23.7866 5.76086L8.78657 20.7609C8.71459 20.8323 8.62886 20.8885 8.53457 20.9259L1.03457 23.9259C0.898273 23.9804 0.748962 23.9938 0.605148 23.9643C0.461333 23.9348 0.329339 23.8637 0.22553 23.7599C0.12172 23.6561 0.0506596 23.5241 0.0211584 23.3803C-0.00834277 23.2365 0.00501248 23.0872 0.0595685 22.9509L3.05957 15.4509C3.09696 15.3566 3.15309 15.2708 3.22457 15.1989L18.2246 0.198856ZM16.8161 3.72986L20.2556 7.16936L22.1951 5.22986L18.7556 1.79036L16.8161 3.72986ZM19.1951 8.22986L15.7556 4.79036L6.00557 14.5404V14.9799H6.75557C6.95448 14.9799 7.14525 15.0589 7.2859 15.1995C7.42655 15.3402 7.50557 15.5309 7.50557 15.7299V16.4799H8.25557C8.45448 16.4799 8.64525 16.5589 8.7859 16.6995C8.92655 16.8402 9.00557 17.0309 9.00557 17.2299V17.9799H9.44507L19.1951 8.22986ZM4.55357 15.9924L4.39457 16.1514L2.10257 21.8829L7.83407 19.5909L7.99307 19.4319C7.85 19.3784 7.72666 19.2825 7.63954 19.1571C7.55242 19.0316 7.50568 18.8826 7.50557 18.7299V17.9799H6.75557C6.55666 17.9799 6.36589 17.9008 6.22524 17.7602C6.08459 17.6195 6.00557 17.4288 6.00557 17.2299V16.4799H5.25557C5.10284 16.4797 4.95378 16.433 4.82833 16.3459C4.70289 16.2588 4.60702 16.1354 4.55357 15.9924Z"
          fill="#00703C"
        />
      </g>
      <defs>
        <clipPath id="clip0_5427_18191">
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );

  const nextHearing = useCallback(
    (currentHearing) => {
      if (tableData?.length === 0) {
        history.push(`/${window?.contextPath}/employee/home/home-screen`);
      } else {
        const validData = tableData?.filter((item) =>
          ["SCHEDULED", "PASSED_OVER", "IN_PROGRESS"]?.includes(item?.businessObject?.hearingDetails?.status)
        );
        const index = validData?.findIndex((item) => item?.businessObject?.hearingDetails?.hearingNumber === currentHearing?.hearingId);
        if (index === -1 || validData?.length === 1) {
          // history.push(`/${window?.contextPath}/employee/home/home-screen`);
          return;
        } else {
          const row = validData[(index + 1) % validData?.length];
          if (["SCHEDULED", "PASSED_OVER"].includes(row?.businessObject?.hearingDetails?.status)) {
            hearingService
              .searchHearings(
                {
                  criteria: {
                    hearingId: row?.businessObject?.hearingDetails?.hearingNumber,
                    tenantId: row?.businessObject?.hearingDetails?.tenantId,
                    ...(row?.businessObject?.hearingDetails?.courtId &&
                      userType === "employee" && { courtId: row?.businessObject?.hearingDetails?.courtId }),
                  },
                },
                { tenantId: row?.businessObject?.hearingDetails?.tenantId }
              )
              .then((response) => {
                hearingService.startHearing({ hearing: response?.HearingList?.[0] }).then(() => {
                  window.location = `/${window.contextPath}/${userType}/dristi/home/view-case?caseId=${row?.businessObject?.hearingDetails?.caseUuid}&filingNumber=${row?.businessObject?.hearingDetails?.filingNumber}&tab=Overview`;
                });
              })
              .catch((error) => {
                console.error("Error starting hearing", error);
                history.push(`/${window?.contextPath}/employee/home/home-screen`);
              });
          } else {
            history.push(
              `/${window?.contextPath}/employee/dristi/home/view-case?caseId=${row?.businessObject?.hearingDetails?.caseUuid}&filingNumber=${row?.businessObject?.hearingDetails?.filingNumber}&tab=Overview`
            );
          }
        }
      }
    },
    [history, userType, tableData]
  );

  const handleEditClick = useCallback(
    async (row) => {
      const hearingDetails = row?.businessObject?.hearingDetails;
      if (["SCHEDULED", "PASSED_OVER"].includes(hearingDetails?.status)) {
        try {
          hearingService
            ?.searchHearings(
              {
                criteria: {
                  hearingId: hearingDetails?.hearingNumber,
                  tenantId: hearingDetails?.tenantId,
                },
              },
              { tenantId: hearingDetails?.tenantId }
            )
            .then((response) => {
              if (Array.isArray(response?.HearingList) && response?.HearingList?.length > 0) {
                hearingService.startHearing({ hearing: response?.HearingList?.[0] }).then(() => {
                  if (isBenchClerk) {
                    history.push(
                      `/${window?.contextPath}/employee/dristi/home/view-case?caseId=${hearingDetails?.caseUuid}&filingNumber=${hearingDetails?.filingNumber}&tab=Overview`
                    );
                  } else
                    history.push(
                      `/${window?.contextPath}/employee/dristi/home/view-case?caseId=${hearingDetails?.caseUuid}&filingNumber=${hearingDetails?.filingNumber}&tab=Overview`,
                      { openOrder: true }
                    );
                });
              }
            });
        } catch (e) {
          console.log(e);
        }
      }
      if (!isBenchClerk && ["IN_PROGRESS"].includes(hearingDetails?.status)) {
        history.push(
          `/${window?.contextPath}/employee/dristi/home/view-case?caseId=${hearingDetails?.caseUuid}&filingNumber=${hearingDetails?.filingNumber}&tab=Overview`,
          { openOrder: true }
        );
      } else if (isBenchClerk && ["IN_PROGRESS"].includes(hearingDetails?.status)) {
        try {
          const orderResponse = await ordersService.searchOrder(
            {
              tenantId: hearingDetails?.tenantId,
              criteria: {
                tenantID: hearingDetails?.tenantId,
                filingNumber: hearingDetails?.filingNumber,
                orderType: "SCHEDULING_NEXT_HEARING",
                status: OrderWorkflowState.DRAFT_IN_PROGRESS,
                ...(hearingDetails?.courtId && { courtId: hearingDetails?.courtId }),
              },
            },
            { tenantId: hearingDetails?.tenantId }
          );
          if (
            orderResponse?.list?.length > 0 &&
            orderResponse?.list?.find((order) => order?.additionalDetails?.refHearingId === hearingDetails?.hearingNumber)
          ) {
            setShowEndHearingModal({ isNextHearingDrafted: true, openEndHearingModal: true, currentHearing: hearingDetails });
          } else {
            setShowEndHearingModal({ isNextHearingDrafted: false, openEndHearingModal: true, currentHearing: {} });
          }
        } catch (e) {
          console.log(e);
        }
      }
    },
    [history]
  );

  const tableRows = useMemo(() => {
    if (!Array.isArray(tableData)) return null;
    const getActionItems = async (row) => {
      const searchParams = new URLSearchParams();
      let dropDownitems = [];
      const hearingDetails = row?.businessObject?.hearingDetails;
      if (!isBenchClerk && (hearingDetails?.status === "SCHEDULED" || hearingDetails?.status === "PASSED_OVER")) {
        dropDownitems.push({
          label: "Start Hearing",
          id: "start_hearing",
          action: () => {
            try {
              hearingService
                ?.searchHearings(
                  {
                    criteria: {
                      hearingId: hearingDetails?.hearingNumber,
                      tenantId: hearingDetails?.tenantId,
                    },
                  },
                  { tenantId: hearingDetails?.tenantId }
                )
                .then((response) => {
                  if (Array.isArray(response?.HearingList) && response?.HearingList?.length > 0) {
                    hearingService.startHearing({ hearing: response?.HearingList?.[0] }).then(() => {
                      history.push(
                        `/${window?.contextPath}/employee/dristi/home/view-case?caseId=${hearingDetails?.caseUuid}&filingNumber=${hearingDetails?.filingNumber}&tab=Overview`
                      );
                    });
                  }
                });
            } catch (e) {
              console.log(e);
            }
          },
        });
      }
      if (!isBenchClerk && hearingDetails?.status === "IN_PROGRESS") {
        dropDownitems.push({
          label: "End Hearing",
          id: "end_hearing",
          action: async () => {
            try {
              const orderResponse = await ordersService.searchOrder(
                {
                  tenantId: hearingDetails?.tenantId,
                  criteria: {
                    tenantID: hearingDetails?.tenantId,
                    filingNumber: hearingDetails?.filingNumber,
                    orderType: "SCHEDULING_NEXT_HEARING",
                    status: OrderWorkflowState.DRAFT_IN_PROGRESS,
                    ...(hearingDetails?.courtId && { courtId: hearingDetails?.courtId }),
                  },
                },
                { tenantId: hearingDetails?.tenantId }
              );
              if (
                orderResponse?.list?.length > 0 &&
                orderResponse?.list?.find((order) => order?.additionalDetails?.refHearingId === hearingDetails?.hearingNumber)
              ) {
                setShowEndHearingModal({ isNextHearingDrafted: true, openEndHearingModal: true, currentHearing: hearingDetails });
              } else {
                setShowEndHearingModal({ isNextHearingDrafted: false, openEndHearingModal: true, currentHearing: {} });
              }
            } catch (e) {
              console.log(e);
            }
          },
        });
      }

      if (hearingDetails?.status === "SCHEDULED" || hearingDetails?.status === "IN_PROGRESS") {
        dropDownitems.push({
          label: "Mark as Passed Over",
          id: "pass_over",
          action: async () => {
            try {
              const orderResponse = await ordersService.searchOrder(
                {
                  tenantId: hearingDetails?.tenantId,
                  criteria: {
                    tenantID: hearingDetails?.tenantId,
                    filingNumber: hearingDetails?.filingNumber,
                    orderType: "SCHEDULING_NEXT_HEARING",
                    status: OrderWorkflowState.DRAFT_IN_PROGRESS,
                    ...(hearingDetails?.courtId && { courtId: hearingDetails?.courtId }),
                  },
                },
                { tenantId: hearingDetails?.tenantId }
              );
              if (
                orderResponse?.list?.length > 0 &&
                orderResponse?.list?.find((order) => order?.additionalDetails?.refHearingId === hearingDetails?.hearingNumber)
              ) {
                setShowEndHearingModal({ isNextHearingDrafted: true, openEndHearingModal: false, currentHearing: hearingDetails });

                hearingService
                  ?.searchHearings(
                    {
                      criteria: {
                        hearingId: hearingDetails?.hearingNumber,
                        tenantId: hearingDetails?.tenantId,
                      },
                    },
                    { tenantId: hearingDetails?.tenantId }
                  )
                  .then((response) => {
                    if (Array.isArray(response?.HearingList) && response?.HearingList?.length > 0) {
                      hearingService.updateHearings(
                        {
                          tenantId: Digit.ULBService.getCurrentTenantId(),
                          hearing: { ...response?.HearingList?.[0], workflow: { action: "PASS_OVER" } },
                          hearingType: "",
                          status: "",
                        },
                        { applicationNumber: "", cnrNumber: "" }
                      );
                    }
                  });
              } else {
                setShowEndHearingModal({ isNextHearingDrafted: false, openEndHearingModal: true, currentHearing: {} });
              }
            } catch (e) {
              console.log(e);
            }
          },
        });
      }

      return dropDownitems;
    };

    return tableData.map((row, idx) => {
      const hearingDetails = row?.businessObject?.hearingDetails;
      return (
        <tr key={row?.id || idx} className="custom-table-row">
          <td>{idx + 1}</td>
          <td>
            <Link
              to={`/${window?.contextPath}/employee/dristi/home/view-case?caseId=${hearingDetails?.caseUuid}&filingNumber=${hearingDetails?.filingNumber}&tab=Overview`}
            >
              <span className="case-link">{hearingDetails?.caseTitle || "-"}</span>
            </Link>
          </td>
          <td>{hearingDetails?.caseNumber || "-"}</td>
          <td style={{ whiteSpace: "pre-line" }}>
            <div>
              <p data-tip data-for={`hearing-list`}>
                {hearingDetails?.advocate?.complainant?.length > 0 &&
                  `${hearingDetails?.advocate?.complainant?.[0]}(C)${
                    hearingDetails?.advocate?.complainant?.length === 2
                      ? " + 1 Other"
                      : hearingDetails?.advocates?.complainant?.length > 2
                      ? ` + ${hearingDetails?.advocates?.complainant?.length - 1} others`
                      : ""
                  }`}
              </p>
              <p data-tip data-for={`hearing-list`}>
                {hearingDetails?.advocate?.accused?.length > 0 &&
                  `${hearingDetails?.advocate?.accused?.[0]}(A)${
                    hearingDetails?.advocate?.accused?.length === 2
                      ? " + 1 Other"
                      : hearingDetails?.advocates?.accused?.length > 2
                      ? ` + ${hearingDetails?.advocates?.accused?.length - 1} others`
                      : ""
                  }`}
              </p>
            </div>
          </td>
          <td>
            <span className={`status-badge ${statusClass(hearingDetails?.status)}`}>
              {hearingDetails?.status === "IN_PROGRESS" ? t("ONGOING") : t(hearingDetails?.status) || "-"}
            </span>
          </td>
          <td>{t(hearingDetails?.hearingType) || "-"}</td>
          <td
            style={{
              textAlign: "center",
              position: "relative",
              display: "table-cell",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "space-around" }}>
              {["SCHEDULED", "IN_PROGRESS", "PASSED_OVER"].includes(hearingDetails?.status) && (
                <div
                  style={{ position: "relative", cursor: "pointer", justifyContent: "space-around", maxWidth: "80px" }}
                  onClick={() => {
                    handleEditClick(row);
                  }}
                  className="edit-icon"
                >
                  {isBenchClerk ? (
                    hearingDetails?.status === "PASSED_OVER" || hearingDetails?.status === "SCHEDULED" ? (
                      <span style={{ color: "green", fontWeight: "700", cursor: "pointer" }}>{t("START_HEARING")}</span>
                    ) : (
                      <span style={{ color: "red", fontWeight: "700", cursor: "pointer" }}>{t("END_HEARING")}</span>
                    )
                  ) : (
                    <EditIcon />
                  )}
                </div>
              )}
              {["SCHEDULED", "IN_PROGRESS", "PASSED_OVER"].includes(hearingDetails?.status) && (
                <AsyncOverlayDropdown style={{ position: "relative" }} row={row} getDropdownItems={getActionItems} position="relative" />
              )}
            </div>
          </td>
        </tr>
      );
    });
  }, [history, t, tableData, handleEditClick]);

  return (
    <React.Fragment>
      <style>{`
      .home-input input {
        margin-bottom: 0px !important;
        border: 1px solid black;
      }
      .main-table-card {
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(44,62,80,0.07);
        padding: 0px 18px 18px 18px;
        position: relative;
        overflow: hidden;
      }
      .filter-bar {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: center;
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 1px 4px rgba(44,62,80,0.06);
        padding: 16px 18px;
        margin-bottom: 8px;
        justify-content: space-between;
      }
      .filter-bar .filter-fields {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        flex: 1 1 300px;
        min-width: 0;
      }
      .filter-bar .filter-actions {
        display: flex;
        flex-direction: row;
        gap: 8px;
        align-items: center;
        margin-left: 12px;
      }
      @media (max-width: 900px) {
        .filter-bar {
          flex-direction: column;
          align-items: stretch;
        }
        .filter-bar .filter-fields {
          width: 100%;
        }
        .filter-bar .filter-actions {
          margin-left: 0;
          margin-top: 12px;
          justify-content: flex-start;
        }
      }
      .filter-bar button.search-btn {
        background: #007E7E;
        color: #fff;
        font-size: 16px;
        font-weight: 700;
        font-family: Roboto, sans-serif;
        line-height: 24px;
        border-radius: 0px;
        border: none;
        padding: 8px 24px;
        margin: 0;
        box-shadow: 0 2px 4px rgba(0,0,0,0.04);
        transition: background 0.2s;
        min-width: 210px;
        cursor: pointer;
      }
      .filter-bar button.search-btn:hover {
        background: #159392;
      }
      .filter-bar .clear-btn {
        background: #fff;
        color: #007E7E;
        border: none !important;
        cursor: pointer;
        padding: 8px 18px;
        font-size: 16px;
        font-weight: 500;
        margin-right: 4px;
        transition: background 0.2s, color 0.2s;
      }
      .filter-bar .clear-btn:hover {
        background: #E4F2E4;
        color: #007E7E;
      }
      .main-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        position: relative;
      }
      .main-table th {
        font-weight: 600;
        font-size: 15px;
        background: #fff;
        padding: 12px 8px;
        border-bottom: 2px solid #e8e8e8;
        position: relative;
        box-shadow: 0 2px 2px -1px rgba(0, 0, 0, 0.1);
        text-align: left;
      }
      .custom-table-row td {
        border-bottom: 1px solid #e8e8e8;
        font-size: 15px;
        background: #fff;
        text-align: left;
      }
      .custom-table-row:hover {
        background: #f6fafd;
      }
      .case-link {
        cursor: pointer;
        color:#0A0A0A;
        text-decoration: underline;
        font-weight: 500;
      }
      .status-badge {
        display: inline-block;
        padding: 2px 14px;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 500;
      }
      .status-completed {
        background: #E8E8E8;
        color: #3D3C3C;
      }
      .status-ongoing {
       background: #E4F2E4;
        color: #00703C;
      }
      .status-passed {
        background: #FFF6E8;
        color: #9E400A;
      }
        .status-passed-over{
        background: #FFF6E8;
        color: #9E400A;}
      .status-scheduled {
       background: #E4F2E4;
        color: #00703C;
      }
      .status-abated {
       background: #E8E8E8;
        color: #3D3C3C;
      }
      .status-default {
        background: #f5f5f5;
        color: #333;
      }      
      .advocate-header {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .advocate-header .info-icon {
        font-size: 15px;
        color: #888;
        cursor: pointer;
      }

.main-table-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(44,62,80,0.07);
  padding: 0px 18px 18px 18px;
  position: relative;
  overflow: hidden;
}

.table-scroll {
  max-height: 420px;
  overflow: auto;
  height: calc(100vh - 361px);
}

.main-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  position: relative;
}

.main-table thead {
  position: sticky;
  top: 0;
  z-index: 10;
}

.main-table th {
  font-weight: 600;
  font-size: 15px;
  background: #fff;
  padding: 12px 8px;
  border-bottom: 2px solid #e8e8e8;
  position: relative;
  box-shadow: 0 2px 2px -1px rgba(0, 0, 0, 0.1);
}

.custom-table-row td {
  padding: 0px 8px;
  border-bottom: 1px solid #e8e8e8;
  font-size: 15px;
  background: #fff;
}

.custom-table-row:hover {
  background: #f6fafd;
}


.table-container {
  position: relative;
  max-height: 420px;
  overflow-y: auto;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
}

.table-container .main-table {
  margin: 0;
}

.table-container .main-table thead th {
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 5;
}

        .jk-dropdown-unique{
         max-height: 300px;
          overflow-y: auto;}


      `}</style>
      <div className="filter-bar">
        <div className="filter-fields">
          <LabelFieldPair className={`case-label-field-pair `}>
            <CardLabel className="case-input-label">{`${t("Date")}`}</CardLabel>
            <TextInput
              className="home-input"
              key={"status"}
              type={"date"}
              value={filters?.date}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, date: e.target.value }));
              }}
            />
          </LabelFieldPair>
          <LabelFieldPair className={`case-label-field-pair `} style={{ marginTop: "1px" }}>
            <CardLabel className="case-input-label">{`${t("STATUS")}`}</CardLabel>
            <Dropdown
              t={t}
              option={statusOptions ? statusOptions : []}
              selected={filters?.status}
              optionKey={"code"}
              select={(e) => {
                setFilters((prev) => ({ ...prev, status: e }));
              }}
              topbarOptionsClassName={"top-bar-option"}
              style={{
                marginBottom: "1px",
                width: "220px",
              }}
            />
          </LabelFieldPair>
          <LabelFieldPair className={`case-label-field-pair `}>
            <CardLabel className="case-input-label">{`${t("PURPOSE")}`}</CardLabel>
            <Dropdown
              t={t}
              option={hearingTypeOptions?.Hearing?.HearingType ? hearingTypeOptions?.Hearing?.HearingType : []}
              selected={filters?.purpose}
              optionKey={"code"}
              select={(e) => {
                setFilters((prev) => ({ ...prev, purpose: e }));
              }}
              topbarOptionsClassName={"top-bar-option"}
              style={{
                marginBottom: "1px",
                width: "220px",
              }}
            />
          </LabelFieldPair>
          <LabelFieldPair className={`case-label-field-pair `}>
            <CardLabel className="case-input-label">{`${t("CASE_NAME")}`}</CardLabel>
            <TextInput
              className="home-input"
              key={"caseQuery"}
              type={"text"}
              value={filters?.caseQuery}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, caseQuery: e.target.value }));
              }}
            />
          </LabelFieldPair>
        </div>
        <div className="filter-actions">
          <span className="clear-btn" onClick={handleClear}>
            {t("ES_COMMON_CLEAR_SEARCH")}
          </span>
          <button className="search-btn" onClick={handleSearch}>
            {t("ES_COMMON_SEARCH")}
          </button>
        </div>
      </div>
      <div className="main-table-card">
        <div className="table-scroll">
          <table className="main-table">
            <thead>
              <tr>
                <th style={{ width: "10px" }}>S.No.</th>
                <th>{t("CS_CASE_NAME")}</th>
                <th>{t("CS_CASE_NUMBER_HOME")}</th>
                <th className="advocate-header">
                  {t("CS_COMMON_ADVOCATES")}{" "}
                  <span className="info-icon" title="Advocate details">
                    &#9432;
                  </span>
                </th>
                <th>{t("STATUS")}</th>
                <th>{t("PURPOSE")}</th>
                <th>{t("ACTIONS")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 24 }}>
                    {t("LOADING")}
                  </td>
                </tr>
              ) : tableRows && tableRows.length > 0 ? (
                tableRows
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 24 }}>
                    {t("NO_HEARING_DATA_FOUND")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {showEndHearingModal.openEndHearingModal && (
        <Modal
          headerBarMain={<Heading label={t("CS_CASE_CONFIRM_END_HEARING")} />}
          headerBarEnd={
            <CloseBtn
              onClick={() => {
                setShowEndHearingModal({ ...showEndHearingModal, isNextHearingDrafted: false, openEndHearingModal: false });
              }}
            />
          }
          actionSaveLabel={t(passOver ? "CS_CASE_PASS_OVER_START_NEXT_HEARING" : "CS_CASE_END_START_NEXT_HEARING")}
          hideModalActionbar={!showEndHearingModal.isNextHearingDrafted}
          actionSaveOnSubmit={async () => {
            //need to get hearing data
            hearingService
              .searchHearings(
                {
                  criteria: {
                    hearingId: showEndHearingModal?.currentHearing?.hearingId,
                    tenantId: showEndHearingModal?.currentHearing?.tenantId,
                  },
                },
                { tenantId: showEndHearingModal?.currentHearing?.tenantId }
              )
              .then((response) => {
                if (Array.isArray(response?.HearingList) && response?.HearingList?.length > 0) {
                  hearingService
                    .updateHearings(
                      {
                        tenantId: Digit.ULBService.getCurrentTenantId(),
                        hearing: { ...response?.HearingList?.[0], workflow: { action: passOver ? "PASS_OVER" : "CLOSE" } },
                        hearingType: "",
                        status: "",
                      },
                      { applicationNumber: "", cnrNumber: "" }
                    )
                    .then(() => {
                      setShowEndHearingModal({ ...showEndHearingModal, isNextHearingDrafted: false, openEndHearingModal: false });
                      nextHearing(showEndHearingModal?.currentHearing);
                    });
                }
              });
          }}
          actionCustomLabelSubmit={async () => {
            hearingService
              .searchHearings(
                {
                  criteria: {
                    hearingId: showEndHearingModal?.currentHearing?.hearingId,
                    tenantId: showEndHearingModal?.currentHearing?.tenantId,
                  },
                },
                { tenantId: showEndHearingModal?.currentHearing?.tenantId }
              )
              .then((response) => {
                if (Array.isArray(response?.HearingList) && response?.HearingList?.length > 0) {
                  hearingService
                    .updateHearings(
                      {
                        tenantId: Digit.ULBService.getCurrentTenantId(),
                        hearing: { ...response?.HearingList?.[0], workflow: { action: passOver ? "PASS_OVER" : "CLOSE" } },
                        hearingType: "",
                        status: "",
                      },
                      { applicationNumber: "", cnrNumber: "" }
                    )
                    .then(() => {
                      setShowEndHearingModal({ ...showEndHearingModal, isNextHearingDrafted: false, openEndHearingModal: false });
                    });
                }
              });
          }}
          actionCancelOnSubmit={() => {
            setShowEndHearingModal({ ...showEndHearingModal, isNextHearingDrafted: false, openEndHearingModal: false });
          }}
          actionCancelLabel={t("CS_COMMON_CANCEL")}
          actionCustomLabel={t(passOver ? "CS_CASE_PASS_OVER_HEARING" : "CS_CASE_END_HEARING")}
          customActionClassName={"end-and-view-causelist-button"}
          submitClassName={"end-and-view-causelist-submit-button"}
          className={"confirm-end-hearing-modal"}
        >
          <div style={{ margin: "16px 0px" }}>
            {!showEndHearingModal.isNextHearingDrafted ? (
              <p>{t("CS_CASE_AN_ORDER_BOTD_FIRST")}</p>
            ) : (
              <CheckBox
                onChange={(e) => {
                  setPassOver(e.target.checked);
                }}
                label={`${t("CS_CASE_PASS_OVER")}: ${t("CS_CASE_PASS_OVER_HEARING_TEXT")}`}
                checked={passOver}
                disable={false}
              />
            )}
          </div>
        </Modal>
      )}
    </React.Fragment>
  );
};

export default HomeHearingsTab;
