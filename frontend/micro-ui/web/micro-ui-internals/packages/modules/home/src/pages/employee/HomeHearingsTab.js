import React, { useMemo, useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { Dropdown, TextInput, LabelFieldPair } from "@egovernments/digit-ui-react-components";
import AsyncOverlayDropdown from "@egovernments/digit-ui-module-dristi/src/components/AsyncOverlayDropdown";
import { hearingService } from "@egovernments/digit-ui-module-hearings/src/hooks/services";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { CloseSvg, CheckBox } from "@egovernments/digit-ui-react-components";
import { ordersService } from "@egovernments/digit-ui-module-orders/src/hooks/services";
import { OrderWorkflowState } from "@egovernments/digit-ui-module-orders/src/utils/orderWorkflow";
import useGetHearingLink from "@egovernments/digit-ui-module-hearings/src/hooks/hearings/useGetHearingLink";
import useInboxSearch from "../../hooks/useInboxSearch";
import { DRISTIService } from "@egovernments/digit-ui-module-dristi/src/services";
import { ConferenceIcon, DocumentSignedIcon, DocumentNotSignedIcon } from "@egovernments/digit-ui-module-dristi/src/icons/svgIndex";

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
  hearingCount,
}) => {
  const history = useHistory();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(30);
  const { data: tableData, loading, error, fetchInbox } = useInboxSearch({ limit: rowsPerPage, offset: page * rowsPerPage });
  const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
  const roles = useMemo(() => userInfo?.roles, [userInfo]);

  const userType = useMemo(() => {
    if (!userInfo) return "employee";
    return userInfo?.type === "CITIZEN" ? "citizen" : "employee";
  }, [userInfo]);

  const isEpostUser = useMemo(() => roles?.some((role) => role?.code === "POST_MANAGER"), [roles]);
  const hasHearingEditAccess = useMemo(() => roles?.some((role) => role?.code === "HEARING_APPROVER"), [roles]);
  const hasOrderCreateAccess = useMemo(() => roles?.some((role) => role?.code === "ORDER_CREATOR"), [roles]);
  const userRoles = Digit.UserService.getUser()?.info?.roles.map((role) => role.code);
  const isEmployee = useMemo(() => userType === "employee", [userType]);
  const hasHearingPriorityView = useMemo(() => roles?.some((role) => role?.code === "HEARING_PRIORITY_VIEW") && isEmployee, [roles, isEmployee]);
  let homePath = `/${window?.contextPath}/${userType}/home/home-pending-task`;
  const isCitizen = userRoles?.includes("CITIZEN");

  if (!isEpostUser && !isCitizen) homePath = `/${window?.contextPath}/${userType}/home/home-screen`;
  const [passOver, setPassOver] = useState(false);
  //   const [showEndHearingModal, setShowEndHearingModal] = useState({ isNextHearingDrafted: false, openEndHearingModal: false, currentHearing: {} });
  const Modal = window?.Digit?.ComponentRegistryService?.getComponent("Modal");

  const handleClear = useCallback(() => {
    const cleared = { date: todayStr, status: "", purpose: "", caseQuery: "" };
    setFilters(cleared);
    setPage(0);
    setRowsPerPage(30);
    fetchInbox(cleared, setHearingCount);
  }, [fetchInbox, setHearingCount]);

  const handleSearch = useCallback(() => {
    setPage(0);
    setRowsPerPage(30);
    fetchInbox(filters, setHearingCount);
  }, [fetchInbox, filters, setHearingCount]);

  useEffect(() => {
    fetchInbox(filters, setHearingCount);
  }, [page, rowsPerPage]);

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
      }))?.sort((a, b) => a.code.localeCompare(b.code)) || []
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
                      setTimeout(() => {
                        setLoader(false);
                        if (res?.hearing?.status === "IN_PROGRESS") fetchInbox(filters, setHearingCount);
                      }, 100);
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
            setTimeout(() => {
              setLoader(false);
              fetchInbox(filters, setHearingCount);
            }, 100);
          }
        }
      }
    },
    [tableData, history, userType, t]
  );

  const handleEditClick = useCallback(
    async (row) => {
      const hearingDetails = row?.businessObject?.hearingDetails;
      if (hasHearingPriorityView) {
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
                    fetchInbox(filters, setHearingCount);
                    showToast("error", t("HEARING_STATUS_ALREADY_CHANGED"), 5000);
                  }
                } else {
                  setLoader(false);
                  showToast("error", t("ISSUE_IN_START_HEARING"), 5000);
                }
              });
            return;
          } catch (e) {
            console.error(e);
            setLoader(false);
            showToast("error", t("ISSUE_IN_START_HEARING"), 5000);
          }
        } else if (["IN_PROGRESS"].includes(hearingDetails?.status)) {
          setShowEndHearingModal({ isNextHearingDrafted: false, openEndHearingModal: true, currentHearing: hearingDetails });
        }
      } else {
        if (hearingDetails?.status === "SCHEDULED" || hearingDetails?.status === "PASSED_OVER") {
          history.push(
            `/${window?.contextPath}/employee/dristi/home/view-case?caseId=${hearingDetails?.caseUuid}&filingNumber=${hearingDetails?.filingNumber}&tab=Overview&fromHome=true`,
            { homeFilteredData: filters }
          );
        } else {
          try {
            const response = await DRISTIService.getDraftOrder(
              {
                hearingDraftOrder: {
                  filingNumber: hearingDetails?.filingNumber,
                  tenantId: hearingDetails?.tenantId,
                  hearingNumber: hearingDetails?.hearingNumber,
                  hearingType: hearingDetails?.hearingType,
                },
              },
              {}
            );
            history.push(
              `/${window.contextPath}/employee/orders/generate-order?filingNumber=${hearingDetails?.filingNumber}&orderNumber=${response?.order?.orderNumber}`
            );
          } catch (error) {
            const errorCode = error?.response?.data?.Errors?.[0]?.code;
            const errorMsg = errorCode === "ORDER_ALREADY_PUBLISHED" ? t("ORDER_ALREADY_PUBLISHED") : t("CORE_SOMETHING_WENT_WRONG");
            showToast("error", errorMsg, 5000);
          }
        }
        return;
      }
    },
    [history, t, hasHearingPriorityView]
  );

  const tableRows = useMemo(() => {
    if (!Array.isArray(tableData)) return null;
    const getActionItems = async (row) => {
      if (!hasHearingEditAccess) {
        return [];
      }
      let dropDownitems = [];
      const hearingDetails = row?.businessObject?.hearingDetails;
      if (hearingDetails?.status === "SCHEDULED" || hearingDetails?.status === "PASSED_OVER") {
        if (!hasHearingPriorityView) {
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
                          // history.push(
                          //   `/${window?.contextPath}/employee/dristi/home/view-case?caseId=${hearingDetails?.caseUuid}&filingNumber=${hearingDetails?.filingNumber}&tab=Overview`,
                          //   { homeFilteredData: filters }
                          // );
                          setTimeout(() => {
                            if (res?.hearing?.status === "IN_PROGRESS") fetchInbox(filters, setHearingCount);
                            setLoader(false);
                          }, 100);
                        });
                      } else {
                        setLoader(false);
                        fetchInbox(filters, setHearingCount);
                        showToast("error", t("HEARING_ALREADY_STARTED"), 5000);
                      }
                    } else {
                      setLoader(false);
                      showToast("error", t("ISSUE_IN_START_HEARING"), 5000);
                    }
                  });
              } catch (e) {
                console.error(e);
                setLoader(false);
                showToast("error", t("ISSUE_IN_START_HEARING"), 5000);
              }
            },
          });
        }
      }
      if (hearingDetails?.status === "IN_PROGRESS") {
        if (!hasHearingPriorityView) {
          dropDownitems.push({
            label: "End Hearing",
            id: "end_hearing",
            action: async () => {
              setShowEndHearingModal({ isNextHearingDrafted: false, openEndHearingModal: true, currentHearing: hearingDetails });
            },
          });
        }
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
                setShowEndHearingModal({ isNextHearingDrafted: false, openEndHearingModal: true, currentHearing: hearingDetails });
                await hearingService
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
                        fetchInbox(filters, setHearingCount);
                        showToast("error", t("HEARING_STATUS_ALREADY_CHANGED"), 5000);
                      }
                    } else {
                      setLoader(false);
                      showToast("error", t("ISSUE_IN_PASS_OVER"), 5000);
                    }
                  });
              } else {
                const response = await hearingService.searchHearings(
                  {
                    criteria: {
                      hearingId: hearingDetails?.hearingNumber,
                      tenantId: hearingDetails?.tenantId,
                    },
                  },
                  { tenantId: hearingDetails?.tenantId }
                );
                if (Array.isArray(response?.HearingList) && response?.HearingList.length > 0) {
                  const currentHearing = response.HearingList[0];

                  await hearingService
                    ?.updateHearings(
                      {
                        tenantId: Digit.ULBService.getCurrentTenantId(),
                        hearing: { ...currentHearing, workflow: { action: "PASS_OVER" } },
                        hearingType: "",
                        status: "",
                      },
                      { applicationNumber: "", cnrNumber: "" }
                    )
                    .then((res) => {
                      setTimeout(() => {
                        setLoader(false);
                        if (res?.hearing?.status === "PASSED_OVER") {
                          fetchInbox(filters, setHearingCount);
                        }
                      }, 100);
                    })
                    .catch(() => {
                      setLoader(false);
                      showToast("error", t("ISSUE_IN_PASS_OVER"), 5000);
                    });
                }
              }
            } catch (e) {
              console.error(e);
              setLoader(false);
              showToast("error", t("ISSUE_IN_PASS_OVER"), 5000);
            } finally {
              // setLoader(false);
            }
          },
        });
      }

      return dropDownitems;
    };

    return tableData.map((row, idx) => {
      const hearingDetails = row?.businessObject?.hearingDetails;
      const offset = page * rowsPerPage;
      const orderStatus = hearingDetails?.orderStatus?.toLowerCase();
      return (
        <tr key={row?.id || idx} className="custom-table-row">
          <td>{hearingDetails?.serialNumber || offset + idx + 1}</td>
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
          <td style={{ whiteSpace: "pre-line", padding: "12px 8px" }}>
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
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "170px",
              }}
            >
              <span
                className={`status-badge ${statusClass(hearingDetails?.status)}`}
                style={{
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {hearingDetails?.status === "IN_PROGRESS" ? t("ONGOING") : t(hearingDetails?.status) || "-"}
              </span>
              <span
                title={
                  orderStatus === "signed"
                    ? t("ORDER_PUBLISHED")
                    : orderStatus === "pending_sign"
                    ? t("ORDER_PENDING_BULK_SIGN")
                    : orderStatus === "draft"
                    ? t("ORDER_DRAFT")
                    : orderStatus === "not_created"
                    ? t("ORDER_NOT_CREATED")
                    : t("ORDER_PENDING")
                }
                style={{
                  borderRadius: "50%",
                  padding: "10px",
                  background: orderStatus === "signed" ? "#F0FDF4" : orderStatus === "pending_sign" ? "#FEF3C7" : "#FEE2E2",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                {orderStatus === "signed" ? (
                  <DocumentSignedIcon />
                ) : (
                  <DocumentNotSignedIcon fill={orderStatus === "pending_sign" ? "#F7C600" : "#DC2626"} />
                )}
              </span>
            </div>
          </td>
          <td
            style={{
              textAlign: "left",
              position: "relative",
              display: "table-cell",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "flex-start" }}>
              {["IN_PROGRESS"].includes(hearingDetails?.status) && (
                <div
                  style={{ display: "flex", justifyContent: "flex-start", cursor: "pointer", maxWidth: "80px" }}
                  onClick={() => {
                    handleEditClick(row);
                  }}
                  className="edit-icon"
                >
                  {hasHearingPriorityView && hasHearingEditAccess ? (
                    <span style={{ color: "red", fontWeight: "700", cursor: "pointer" }}>{t("END_HEARING_HOME")}</span>
                  ) : hasOrderCreateAccess ? (
                    <EditIcon />
                  ) : null}
                </div>
              )}
              {["SCHEDULED", "PASSED_OVER"].includes(hearingDetails?.status) && hasHearingPriorityView && hasHearingEditAccess && (
                <div
                  style={{
                    position: "relative",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "flex-start",
                    maxWidth: "80px",
                  }}
                  onClick={() => {
                    handleEditClick(row);
                  }}
                  className="edit-icon"
                >
                  <span style={{ color: "green", fontWeight: "700", cursor: "pointer" }}>{t("START_HEARING_HOME")}</span>
                </div>
              )}

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
          </td>
        </tr>
      );
    });
  }, [history, t, tableData, handleEditClick, hasHearingEditAccess, hasOrderCreateAccess, hasHearingPriorityView]);

  const { data: hearingLink } = useGetHearingLink();

  if (isEpostUser) {
    history.push(homePath);
  }

  return (
    <div className="full-height-container">
      <div className="header">{t("ALL_HEARINGS")}</div>
      <div className="home-hearings-search">
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
                option={
                  hearingTypeOptions?.Hearing?.HearingType
                    ? hearingTypeOptions?.Hearing?.HearingType.sort((a, b) => {
                        const stringA = t(a?.code);
                        const stringB = t(b?.code);
                        return stringA.localeCompare(stringB);
                      })
                    : []
                }
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
                  style={{ minWidth: 100, textAlign: "center" }}
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
            <div className={`case-label-field-pair search-input`}>
              {/* <span
              className="search-icon-wrapper"
              onClick={() => {
                if (!loading) {
                  setPage(0);
                  setRowsPerPage(10);
                  fetchInbox(filters, setHearingCount);
                }
              }}
            >
              <SmallSearchIcon />
            </span> */}
              <input
                className="home-input"
                placeholder={t("SEARCH_CASE_NAME_OR_NUMBER")}
                type="text"
                style={{ width: "100%" }}
                value={filters?.caseQuery}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, caseQuery: e.target.value }));
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loading) {
                    setPage(0);
                    setRowsPerPage(10);
                    fetchInbox(filters, setHearingCount);
                  }
                }}
              />
            </div>
            <button className="home-search-btn" onClick={handleSearch} disabled={loading}>
              {t("ES_COMMON_SEARCH")}
            </button>
            <button className="home-clear-btn" onClick={handleClear} disabled={loading}>
              {t("CLEAR")}
            </button>
          </div>
          {
            <div className="filter-actions">
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
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <ConferenceIcon />
                  <span
                    className="digit-button-label"
                    style={{
                      fontSize: "16px",
                      fontWeight: 700,
                      fontFamily: "Roboto",
                      color: "#FFFFFF",
                    }}
                  >
                    {t("JOIN_VC")}
                  </span>
                </span>
              </button>
            </div>
          }
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
                <th>{t("CS_COMMON_ADVOCATES")} </th>
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
          <div className="table-pagination">
            <div className="pagination-info">
              <span style={{ color: "#505a5f" }}>Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setPage(0);
                }}
              >
                {[10, 20, 30, 40, 50].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ color: "#505a5f" }}>
                  {hearingCount === 0 ? "0 of 0" : `${page * rowsPerPage + 1}–${Math.min((page + 1) * rowsPerPage, hearingCount)} of ${hearingCount}`}
                </span>

                {page > 0 && (
                  <button
                    style={{
                      background: "transparent",
                      border: "none",
                      fontSize: "16px",
                      cursor: "pointer",
                      padding: 0,
                      margin: 0,
                      display: "flex",
                      alignItems: "center",
                    }}
                    onClick={() => setPage((prev) => prev - 1)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#505a5f" class="cp" width="18px" height="18px">
                      <path d="M0 0h24v24H0z" fill="none"></path>
                      <path d="M11.67 3.87L9.9 2.1 0 12l9.9 9.9 1.77-1.77L3.54 12z"></path>
                    </svg>
                  </button>
                )}

                {(page + 1) * rowsPerPage < hearingCount && (
                  <button
                    style={{
                      background: "transparent",
                      border: "none",
                      fontSize: "16px",
                      cursor: "pointer",
                      padding: 0,
                      margin: 0,
                      display: "flex",
                      alignItems: "center",
                    }}
                    onClick={() => setPage((prev) => prev + 1)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#505a5f" width="18px" height="18px">
                      <path d="M0 0h24v24H0z" fill="none" />
                      <path d="M5.88 4.12 13.76 12l-7.88 7.88L8 22l10-10L8 2z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
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
          actionSaveOnSubmit={async () => {
            try {
              setLoader(true);
              await hearingService
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
                      fetchInbox(filters, setHearingCount);
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
              await hearingService
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
                      fetchInbox(filters, setHearingCount);
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
            <CheckBox
              onChange={(e) => {
                setPassOver(e.target.checked);
              }}
              label={`${t("CS_CASE_PASS_OVER")}: ${t("CS_CASE_PASS_OVER_HEARING_TEXT")}`}
              checked={passOver}
              disable={false}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default HomeHearingsTab;
