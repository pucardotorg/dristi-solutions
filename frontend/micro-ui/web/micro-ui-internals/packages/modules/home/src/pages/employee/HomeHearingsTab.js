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
import useGetHearingLink from "@egovernments/digit-ui-module-hearings/src/hooks/hearings/useGetHearingLink";

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

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_36_7167)">
      <path
        d="M11.625 10.5H11.0325L10.8225 10.2975C11.5575 9.4425 12 8.3325 12 7.125C12 4.4325 9.8175 2.25 7.125 2.25C4.4325 2.25 2.25 4.4325 2.25 7.125C2.25 9.8175 4.4325 12 7.125 12C8.3325 12 9.4425 11.5575 10.2975 10.8225L10.5 11.0325V11.625L14.25 15.3675L15.3675 14.25L11.625 10.5ZM7.125 10.5C5.2575 10.5 3.75 8.9925 3.75 7.125C3.75 5.2575 5.2575 3.75 7.125 3.75C8.9925 3.75 10.5 5.2575 10.5 7.125C10.5 8.9925 8.9925 10.5 7.125 10.5Z"
        fill="#505A5F"
      />
    </g>
    <defs>
      <clipPath id="clip0_36_7167">
        <rect width="18" height="18" fill="white" />
      </clipPath>
    </defs>
  </svg>
);
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
              tenantId: Digit.ULBService.getCurrentTenantId(),
            },
            moduleSearchCriteria: {
              tenantId: Digit.ULBService.getCurrentTenantId(),
              courtId: localStorage.getItem("courtId"),
              ...(fromDate && toDate ? { fromDate, toDate } : {}),
            },
            tenantId: Digit.ULBService.getCurrentTenantId(),
            limit,
            offset,
          },
        };
        if (filters?.status?.code) payload.inbox.moduleSearchCriteria.status = filters?.status?.code;
        if (filters?.purpose) payload.inbox.moduleSearchCriteria.hearingType = filters.purpose?.code;
        if (filters?.caseQuery) payload.inbox.moduleSearchCriteria.searchableFields = filters.caseQuery;

        const res = await HomeService.InboxSearch(payload, { tenantId: Digit.ULBService.getCurrentTenantId() });
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

const today = new Date();
const todayStr = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split("T")[0];

const HomeHearingsTab = ({
  t,
  showEndHearingModal,
  setShowEndHearingModal,
  setHearingCount = () => {},
  setLoader = () => {},
  setFilters = () => {},
  filters,
  showToast = () => {},
}) => {
  const history = useHistory();

  const { data: tableData, loading, error, fetchInbox } = useInboxSearch();
  const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
  const roles = useMemo(() => userInfo?.roles, [userInfo]);

  const isJudge = useMemo(() => roles?.some((role) => role?.code === "JUDGE_ROLE"), [roles]);
  const isBenchClerk = useMemo(() => roles?.some((role) => role?.code === "BENCH_CLERK"), [roles]);
  const isTypist = useMemo(() => roles?.some((role) => role?.code === "TYPIST_ROLE"), [roles]);

  const userType = useMemo(() => {
    if (!userInfo) return "employee";
    return userInfo?.type === "CITIZEN" ? "citizen" : "employee";
  }, [userInfo]);
  const [passOver, setPassOver] = useState(false);
  //   const [showEndHearingModal, setShowEndHearingModal] = useState({ isNextHearingDrafted: false, openEndHearingModal: false, currentHearing: {} });
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

  const { data: hearingTypeOptions, isLoading: isOptionsLoading } = Digit.Hooks.useCustomMDMS(
    stateId,
    "Hearing",
    [{ name: "HearingType" }, { name: "HearingStatus" }],
    {
      select: (data) => {
        return data || [];
      },
    }
  );
  const statusOptions = useMemo(() => {
    return (
      hearingTypeOptions?.Hearing?.HearingStatus?.map((status) => ({
        id: status?.id,
        code: status?.code,
        name: status?.code !== "IN_PROGRESS" ? status?.code : "ON_GOING_HEARING",
      }))?.sort((a, b) => a.id - b.id) || []
    );
  }, [hearingTypeOptions]);

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
      <g clip-path="url(#clip0_36_7213)">
        <path d="M17 19.22H5V7H12V5H5C3.9 5 3 5.9 3 7V19C3 20.1 3.9 21 5 21H17C18.1 21 19 20.1 19 19V12H17V19.22Z" fill="#007E7E" />
        <path d="M19 2H17V5H14C14.01 5.01 14 7 14 7H17V9.99C17.01 10 19 9.99 19 9.99V7H22V5H19V2Z" fill="#007E7E" />
        <path d="M15 9H7V11H15V9Z" fill="#007E7E" />
        <path d="M7 12V14H15V12H12H7Z" fill="#007E7E" />
        <path d="M15 15H7V17H15V15Z" fill="#007E7E" />
      </g>
      <defs>
        <clipPath id="clip0_36_7213">
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );

  const nextHearing = useCallback(
    (currentHearing) => {
      if (tableData?.length === 0) {
        setLoader(false);
        history.push(`/${window?.contextPath}/employee/home/home-screen`, { homeFilteredData: filters });
      } else {
        const validData = tableData?.filter((item) =>
          ["SCHEDULED", "PASSED_OVER", "IN_PROGRESS"]?.includes(item?.businessObject?.hearingDetails?.status)
        );
        const index = validData?.findIndex((item) => item?.businessObject?.hearingDetails?.hearingNumber === currentHearing?.hearingNumber);
        if (index === -1 || validData?.length === 1) {
          setLoader(false);
          showToast("error", t("NO_MORE_HEARINGS_TO_START"), 5000);
          return;
        } else {
          const row = validData[(index + 1) % validData?.length];
          if (["SCHEDULED", "PASSED_OVER"].includes(row?.businessObject?.hearingDetails?.status)) {
            hearingService
              ?.searchHearings(
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
                if (Array.isArray(response?.HearingList) && response?.HearingList?.length > 0) {
                  if (response?.HearingList[0]?.status === "SCHEDULED" || response?.HearingList[0]?.status === "PASSED_OVER") {
                    hearingService?.startHearing({ hearing: response?.HearingList?.[0] }).then((res) => {
                      if (isJudge || isTypist) {
                        window.location = `/${window.contextPath}/${userType}/dristi/home/view-case?caseId=${row?.businessObject?.hearingDetails?.caseUuid}&filingNumber=${row?.businessObject?.hearingDetails?.filingNumber}&tab=Overview`;
                      } else {
                        setTimeout(() => {
                          setLoader(false);
                          if (res?.hearing?.status === "IN_PROGRESS") fetchInbox(filters, setHearingCount);
                        }, 100);
                      }
                    });
                  } else {
                    setLoader(false);
                    showToast("error", t("NEXT_HEARING_ALREADY_STARTED"), 5000);
                  }
                } else {
                  setLoader(false);
                  showToast("error", t("ISSUE_IN_NEXT_START_HEARING"), 5000);
                }
              })
              .catch((error) => {
                setLoader(false);
                showToast("error", t("ISSUE_IN_NEXT_START_HEARING"), 5000);
                console.error("Error starting hearing", error);
              });
          } else {
            if (isJudge || isTypist) {
              history.push(
                `/${window?.contextPath}/employee/dristi/home/view-case?caseId=${row?.businessObject?.hearingDetails?.caseUuid}&filingNumber=${row?.businessObject?.hearingDetails?.filingNumber}&tab=Overview&fromHome=true`,
                { homeFilteredData: filters }
              );
            } else {
              setTimeout(() => {
                setLoader(false);
                fetchInbox(filters, setHearingCount);
              }, 100);
            }
          }
        }
      }
    },
    [tableData, history, userType, t]
  );

  const handleEditClick = useCallback(
    async (row) => {
      const hearingDetails = row?.businessObject?.hearingDetails;

      if (isJudge || isTypist) {
        if (hearingDetails?.status === "SCHEDULED" || hearingDetails?.status === "PASSED_OVER") {
          history.push(
            `/${window?.contextPath}/employee/dristi/home/view-case?caseId=${hearingDetails?.caseUuid}&filingNumber=${hearingDetails?.filingNumber}&tab=Overview&fromHome=true`,
            { homeFilteredData: filters }
          );
        } else {
          history.push(
            `/${window?.contextPath}/employee/dristi/home/view-case?caseId=${hearingDetails?.caseUuid}&filingNumber=${hearingDetails?.filingNumber}&tab=Overview&fromHome=true`,
            { openOrder: true, homeFilteredData: filters }
          );
        }
        return;
      } else if (isBenchClerk) {
        if (["SCHEDULED", "PASSED_OVER"].includes(hearingDetails?.status)) {
          try {
            setLoader(true);
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
                  if (response?.HearingList[0].status === "SCHEDULED" || response?.HearingList[0].status === "PASSED_OVER") {
                    hearingService?.startHearing({ hearing: response?.HearingList?.[0] }).then((res) => {
                      setTimeout(() => {
                        setLoader(false);
                        if (res?.hearing?.status === "IN_PROGRESS") fetchInbox(filters, setHearingCount);
                      }, 100);
                    });
                  } else {
                    setLoader(false);
                    showToast("error", t("HEARING_STATUS_ALREADY_CHANGED"), 5000);
                  }
                } else {
                  setLoader(false);
                  showToast("error", t("ISSUE_IN_START_HEARING"), 5000);
                }
              });
            return;
          } catch (e) {
            console.log(e);
            setLoader(false);
            showToast("error", t("ISSUE_IN_START_HEARING"), 5000);
          }
        } else if (isBenchClerk && ["IN_PROGRESS"].includes(hearingDetails?.status)) {
          //for bench clerk action he will have end hearing instead of edit icon
          try {
            setLoader(true);
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
              setLoader(false);
            } else {
              setShowEndHearingModal({ isNextHearingDrafted: false, openEndHearingModal: true, currentHearing: {} });
              setLoader(false);
            }
          } catch (e) {
            console.log(e);
            setLoader(false);
            showToast("error", t("ISSUE_IN_UPDATE_HEARING"), 5000);
          }
        }
      }
    },
    [history, isBenchClerk, isJudge, isTypist, t]
  );

  const tableRows = useMemo(() => {
    if (!Array.isArray(tableData)) return null;
    const getActionItems = async (row) => {
      let dropDownitems = [];
      const hearingDetails = row?.businessObject?.hearingDetails;
      if ((isJudge || isTypist) && (hearingDetails?.status === "SCHEDULED" || hearingDetails?.status === "PASSED_OVER")) {
        dropDownitems.push({
          label: "Start Hearing",
          id: "start_hearing",
          action: () => {
            try {
              setLoader(true);
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
                    if (response?.HearingList?.[0]?.status === "SCHEDULED" || response?.HearingList?.[0]?.status === "PASSED_OVER") {
                      hearingService?.startHearing({ hearing: response?.HearingList?.[0] }).then((res) => {
                        history.push(
                          `/${window?.contextPath}/employee/dristi/home/view-case?caseId=${hearingDetails?.caseUuid}&filingNumber=${hearingDetails?.filingNumber}&tab=Overview`,
                          { homeFilteredData: filters }
                        );
                        setLoader(false);
                      });
                    } else {
                      setLoader(false);
                      showToast("error", t("HEARING_ALREADY_STARTED"), 5000);
                    }
                  } else {
                    setLoader(false);
                    showToast("error", t("ISSUE_IN_START_HEARING"), 5000);
                  }
                });
            } catch (e) {
              console.log(e);
              setLoader(false);
              showToast("error", t("ISSUE_IN_START_HEARING"), 5000);
            }
          },
        });
      }
      if ((isJudge || isTypist) && hearingDetails?.status === "IN_PROGRESS") {
        dropDownitems.push({
          label: "End Hearing",
          id: "end_hearing",
          action: async () => {
            try {
              setLoader(true);
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
                setLoader(false);
              } else {
                setShowEndHearingModal({ isNextHearingDrafted: false, openEndHearingModal: true, currentHearing: {} });
                setLoader(false);
              }
            } catch (e) {
              console.log(e);
              setLoader(false);
              showToast("error", t("ISSUE_IN_END_HEARING"), 5000);
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
              let orderResponse = null;
              setLoader(true);
              if (hearingDetails?.status !== "SCHEDULED") {
                orderResponse = await ordersService.searchOrder(
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
              }
              if (
                hearingDetails?.status === "SCHEDULED" ||
                (orderResponse?.list?.length > 0 &&
                  orderResponse?.list?.find((order) => order?.additionalDetails?.refHearingId === hearingDetails?.hearingNumber))
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
                      if (response?.HearingList?.[0]?.status === "SCHEDULED" || response?.HearingList?.[0]?.status === "IN_PROGRESS") {
                        hearingService
                          ?.updateHearings(
                            {
                              tenantId: Digit.ULBService.getCurrentTenantId(),
                              hearing: { ...response?.HearingList?.[0], workflow: { action: "PASS_OVER" } },
                              hearingType: "",
                              status: "",
                            },
                            { applicationNumber: "", cnrNumber: "" }
                          )
                          .then((res) => {
                            setTimeout(() => {
                              setLoader(false);
                              if (res?.hearing?.status === "PASSED_OVER") fetchInbox(filters, setHearingCount);
                            }, 100);
                          });
                      } else {
                        setLoader(false);
                        showToast("error", t("HEARING_STATUS_ALREADY_CHANGED"), 5000);
                      }
                    } else {
                      setLoader(false);
                      showToast("error", t("ISSUE_IN_PASS_OVER"), 5000);
                    }
                  });
              } else {
                setLoader(false);
                setShowEndHearingModal({ isNextHearingDrafted: false, openEndHearingModal: true, currentHearing: {} });
              }
            } catch (e) {
              console.log(e);
              showToast("error", t("ISSUE_IN_PASS_OVER"), 5000);
            } finally {
              setLoader(false);
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
              to={{
                pathname: `/${window?.contextPath}/employee/dristi/home/view-case`,
                search: `?caseId=${hearingDetails?.caseUuid}&filingNumber=${hearingDetails?.filingNumber}&tab=Overview&fromHome=true`,
                state: { homeFilteredData: filters },
              }}
            >
              <span className="case-link">{hearingDetails?.caseTitle || "-"}</span>
            </Link>
          </td>
          <td>{hearingDetails?.caseNumber || "-"}</td>
          <td style={{ whiteSpace: "pre-line", padding: "12px 0px" }}>
            <div>
              <p data-tip data-for={`hearing-list`}>
                {hearingDetails?.advocate?.complainant?.length > 0 &&
                  `${hearingDetails?.advocate?.complainant?.[0]}(C)${
                    hearingDetails?.advocate?.complainant?.length === 2
                      ? " + 1 Other"
                      : hearingDetails?.advocate?.complainant?.length > 2
                      ? ` + ${hearingDetails?.advocate?.complainant?.length - 1} others`
                      : ""
                  }`}
              </p>
              <p data-tip data-for={`hearing-list`}>
                {hearingDetails?.advocate?.accused?.length > 0 &&
                  `${hearingDetails?.advocate?.accused?.[0]}(A)${
                    hearingDetails?.advocate?.accused?.length === 2
                      ? " + 1 Other"
                      : hearingDetails?.advocate?.accused?.length > 2
                      ? ` + ${hearingDetails?.advocate?.accused?.length - 1} others`
                      : ""
                  }`}
              </p>
            </div>
          </td>
          <td style={{ maxWidth: "150px" }}>{t(hearingDetails?.hearingType) || "-"}</td>
          <td>
            <span className={`status-badge ${statusClass(hearingDetails?.status)}`}>
              {hearingDetails?.status === "IN_PROGRESS" ? t("ONGOING") : t(hearingDetails?.status) || "-"}
            </span>
          </td>
          <td
            style={{
              textAlign: "center",
              position: "relative",
              display: "table-cell",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "space-around" }}>
              <div style={{ width: "50%" }}>
                {["IN_PROGRESS"].includes(hearingDetails?.status) && (
                  <div
                    style={{
                      position: "relative",
                      cursor: "pointer",
                      maxWidth: "80px",
                      display: "flex",
                      justifyContent: "start",
                    }}
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
                {["SCHEDULED", "PASSED_OVER"].includes(hearingDetails?.status) && isBenchClerk && (
                  <div
                    style={{ position: "relative", cursor: "pointer", display: "flex", justifyContent: "start", maxWidth: "80px" }}
                    onClick={() => {
                      handleEditClick(row);
                    }}
                    className="edit-icon"
                  >
                    {hearingDetails?.status === "PASSED_OVER" || hearingDetails?.status === "SCHEDULED" ? (
                      <span style={{ color: "green", fontWeight: "700", cursor: "pointer" }}>{t("START_HEARING")}</span>
                    ) : (
                      <span style={{ color: "red", fontWeight: "700", cursor: "pointer" }}>{t("END_HEARING")}</span>
                    )}
                  </div>
                )}
              </div>
              <div style={{ width: "50%" }}>
                {["SCHEDULED", "IN_PROGRESS", "PASSED_OVER"].includes(hearingDetails?.status) && (
                  <AsyncOverlayDropdown
                    style={{ position: "relative" }}
                    textStyle={{ textAlign: "start" }}
                    row={row}
                    getDropdownItems={getActionItems}
                    position="relative"
                  />
                )}
              </div>
            </div>
          </td>
        </tr>
      );
    });
  }, [history, t, tableData, handleEditClick]);

  const { data: hearingLink } = useGetHearingLink();

  return (
    <div className="full-height-container">
      <style>{`
        .home-input input {
          margin-bottom: 0px !important;
          border: 1px solid black;
         font-family: 'Roboto';
        }

        .full-height-container {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 260px);
          padding-bottom: 10px;
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
          padding: 0px 18px 0px 18px;
          flex-shrink: 0;
        }
          .search-bar{
           display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 1px 4px rgba(44,62,80,0.06);
          margin-bottom: 8px;
          justify-content: end;
          padding: 0px 18px;
          flex-shrink: 0;
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
          gap: 24px;
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

      
  
      


        .main-table-card {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(44,62,80,0.07);
          padding: 0px 18px 18px 18px;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
        }

        .table-scroll {
          flex: 1;
          overflow: auto;
          min-height: 0;
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
          text-align: left;
        }

        .custom-table-row td {
          padding: 12px 8px;
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
          color: #0A0A0A;
          text-decoration: underline;
          font-weight: 500;
        }

        .status-badge {
          display: inline-block;
          padding: 2px 14px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 500;
        }

        .status-completed {
          background: #E8E8E8;
          color: #3D3C3C;
        }

        .status-ongoing {
          background: #FFF8E1;
          color: #574406;
        }

        .status-passed {
          background: #FFF6E8;
          color: #9E400A;
        }

        .status-passed-over {
          background: #FFF6E8;
          color: #9E400A;
        }

        .status-scheduled {
          background: #E5E4F2;
          color: #28264B;
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

        .jk-dropdown-unique {
          max-height: 300px;
          overflow-y: auto;
        }

        .date-arrow-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .date-arrow-btn {
          background: transparent;
          border: none;
          color: #007E7E;
          font-size: 18px;
          font-weight: bold;
          border-radius: 4px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
          padding: 0;
        }

        .date-arrow-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .date-arrow-btn:hover:not(:disabled) {
          background: #f5f5f5;
        }
             .filter-fields .select-wrap {
  width: 160px !important;
}
          #jk-dropdown-unique{
      max-height: 300px;
    overflow-y: auto;
      }

      .filter-actions .home-search-btn{
        font-weight: 700;
        padding: 8px 24px;
        border: 1px solid #77787B;
        font-size: 14px;
        background: white;
        height: 40px;
      }

     .filter-actions .home-clear-btn{
     border: 0;
    background: white;
      color: #222222
      }
      .filter-actions .home-input input {
      border:0;
      }

      .filter-actions .search-input{
      display: flex;
    align-items: center;
    border: 1px solid #77787B;
    padding: 0 8px;
    height: 40px;
}
    .filter-actions   .home-input {
    border: 0px;
    outline: none; 
  }

 .filter-actions  .home-input:focus {
    border: 0px;
  }
    @media screen and (max-width: 1330px) {
  .filter-actions .home-input {
    width: 90px;
  }
    .filter-bar .filter-actions{
    gap: 8px
    }
}
`}</style>
      <div className="filter-bar">
        <div className="filter-fields">
          <LabelFieldPair className={`case-label-field-pair `} style={{ marginTop: "1px" }}>
            {/* <CardLabel className="case-input-label"></CardLabel> */}
            <Dropdown
              t={t}
              placeholder={`${t("STATUS")}`}
              option={statusOptions ? statusOptions : []}
              selected={filters?.status}
              optionKey={"name"}
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
            {/* <CardLabel className="case-input-label">{`${t("PURPOSE")}`}</CardLabel> */}
            <Dropdown
              t={t}
              placeholder={`${t("PURPOSE")}`}
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
            {/* <CardLabel className="case-input-label" style={{ paddingLeft: "30px" }}>{`${t("Date")}`}</CardLabel> */}
            <div className="date-arrow-group">
              {/* <button
                type="button"
                className="date-arrow-btn"
                aria-label="Previous Day"
                onClick={() => {
                  const prevDate = new Date(filters?.date);
                  prevDate.setDate(prevDate.getDate() - 1);
                  setFilters((prev) => ({ ...prev, date: prevDate.toISOString().slice(0, 10) }));
                }}
                disabled={loading}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 19L8 12L15 5" stroke="#000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button> */}
              <TextInput
                className="home-input"
                key={"status"}
                type={"date"}
                value={filters?.date}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, date: e.target.value }));
                }}
                style={{ minWidth: 120, textAlign: "center" }}
                // disabled={loading}
              />
              {/* <button
                type="button"
                className="date-arrow-btn"
                aria-label="Next Day"
                onClick={() => {
                  const nextDate = new Date(filters?.date);
                  nextDate.setDate(nextDate.getDate() + 1);
                  setFilters((prev) => ({ ...prev, date: nextDate.toISOString().slice(0, 10) }));
                }}
                disabled={loading}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 5L16 12L9 19" stroke="#000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button> */}
            </div>
          </LabelFieldPair>
        </div>
        <div className="filter-actions">
          <div className={`case-label-field-pair search-input`}>
            <input
              className="home-input"
              placeholder="Search here..."
              type="text"
              value={filters?.caseQuery}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, caseQuery: e.target.value }));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) {
                  fetchInbox(filters, setHearingCount);
                }
              }}
            />
            <span
              style={{ cursor: "pointer" }}
              onClick={() => {
                if (!loading) {
                  fetchInbox(filters, setHearingCount);
                }
              }}
            >
              <SearchIcon />
            </span>
          </div>
          <button className="home-search-btn" onClick={handleSearch} disabled={loading}>
            {t("ES_COMMON_SEARCH")}
          </button>
          <button className="home-clear-btn" onClick={handleClear} disabled={loading}>
            {t("CLEAR")}
          </button>
          <button
            className="digit-button-tertiary large"
            type="button"
            onClick={() => {
              window.open(hearingLink, "_blank");
            }}
            style={{
              backgroundColor: "#007E7E",
              height: "40px",
              padding: "8px 24px",
            }}
          >
            <span
              className="digit-button-label"
              style={{
                fontSize: "14px",
                fontWeight: 700,
                fontFamily: "Roboto",
                color: "#FFFFFF",
              }}
            >
              {t("JOIN_VC")}
            </span>
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
                <th className="advocate-header">{t("CS_COMMON_ADVOCATES")} </th>
                <th>{t("PURPOSE")}</th>
                <th>{t("STATUS")}</th>
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
                setPassOver(false);
              }}
            />
          }
          actionSaveLabel={t(passOver ? "CS_CASE_PASS_OVER_START_NEXT_HEARING" : "CS_CASE_END_START_NEXT_HEARING")}
          hideModalActionbar={!showEndHearingModal.isNextHearingDrafted}
          actionSaveOnSubmit={async () => {
            try {
              setLoader(true);
              hearingService
                ?.searchHearings(
                  {
                    criteria: {
                      hearingId: showEndHearingModal?.currentHearing?.hearingNumber,
                      tenantId: showEndHearingModal?.currentHearing?.tenantId,
                    },
                  },
                  { tenantId: showEndHearingModal?.currentHearing?.tenantId }
                )
                .then((response) => {
                  if (Array.isArray(response?.HearingList) && response?.HearingList?.length > 0) {
                    if (response?.HearingList?.[0]?.status === "IN_PROGRESS") {
                      hearingService
                        ?.updateHearings(
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
                    } else {
                      setLoader(false);
                      setShowEndHearingModal({ ...showEndHearingModal, isNextHearingDrafted: false, openEndHearingModal: false });
                      showToast("error", t("HEARING_STATUS_ALREADY_CHANGED"), 5000);
                    }
                  } else {
                    setLoader(false);
                    setShowEndHearingModal({ ...showEndHearingModal, isNextHearingDrafted: false, openEndHearingModal: false });
                    showToast("error", t("ISSUE_IN_HEARING_UPDATE"), 5000);
                  }
                });
            } catch (e) {
              setLoader(false);
              showToast("error", t("ISSUE_IN_HEARING_UPDATE"), 5000);
            } finally {
              setPassOver(false);
            }
          }}
          actionCustomLabelSubmit={async () => {
            try {
              setLoader(true);
              hearingService
                ?.searchHearings(
                  {
                    criteria: {
                      hearingId: showEndHearingModal?.currentHearing?.hearingNumber,
                      tenantId: showEndHearingModal?.currentHearing?.tenantId,
                    },
                  },
                  { tenantId: showEndHearingModal?.currentHearing?.tenantId }
                )
                .then((response) => {
                  if (Array.isArray(response?.HearingList) && response?.HearingList?.length > 0) {
                    if (response?.HearingList?.[0]?.status === "IN_PROGRESS") {
                      hearingService
                        ?.updateHearings(
                          {
                            tenantId: Digit.ULBService.getCurrentTenantId(),
                            hearing: { ...response?.HearingList?.[0], workflow: { action: passOver ? "PASS_OVER" : "CLOSE" } },
                            hearingType: "",
                            status: "",
                          },
                          { applicationNumber: "", cnrNumber: "" }
                        )
                        .then((res) => {
                          setTimeout(() => {
                            setLoader(false);
                            setShowEndHearingModal({ ...showEndHearingModal, isNextHearingDrafted: false, openEndHearingModal: false });
                            if (res?.hearing?.status === "PASSED_OVER" || res?.hearing?.status === "COMPLETED") fetchInbox(filters, setHearingCount);
                          }, 100);
                        });
                    } else {
                      setLoader(false);
                      showToast("error", t("HEARING_STATUS_ALREADY_CHANGED"), 5000);
                      setShowEndHearingModal({ ...showEndHearingModal, isNextHearingDrafted: false, openEndHearingModal: false });
                    }
                  } else {
                    setLoader(false);
                    showToast("error", t("ISSUE_IN_HEARING_UPDATE"), 5000);
                    setShowEndHearingModal({ ...showEndHearingModal, isNextHearingDrafted: false, openEndHearingModal: false });
                  }
                });
            } catch (e) {
              setLoader(false);
              showToast("error", t("ISSUE_IN_HEARING_UPDATE"), 5000);
              setShowEndHearingModal({ ...showEndHearingModal, isNextHearingDrafted: false, openEndHearingModal: false });
            } finally {
              setPassOver(false);
            }
          }}
          actionCancelOnSubmit={() => {
            setShowEndHearingModal({ ...showEndHearingModal, isNextHearingDrafted: false, openEndHearingModal: false });
            setPassOver(false);
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
    </div>
  );
};

export default HomeHearingsTab;
