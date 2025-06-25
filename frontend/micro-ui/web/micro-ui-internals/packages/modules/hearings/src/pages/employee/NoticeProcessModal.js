import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, CloseSvg, Button, InboxSearchComposer } from "@egovernments/digit-ui-react-components";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom/cjs/react-router-dom.min";
import { formatDate } from "../../utils";
import { hearingService } from "../../hooks/services";
import { Urls } from "../../hooks/services/Urls";
import useSearchOrdersService from "@egovernments/digit-ui-module-orders/src/hooks/orders/useSearchOrdersService";
import { summonsConfig } from "../../configs/SummonsNWarrantConfig";
import ReviewNoticeModal from "@egovernments/digit-ui-module-orders/src/components/ReviewNoticeModal";

const modalPopup = {
  height: "72%",
  minHeight: "40rem",
  width: "80%",
  minWidth: "40rem",
  position: "absolute",
  bottom: "50%",
  right: "50%",
  transform: "translate(50%, 50%)",
  borderRadius: "0.3rem",
  display: "inline-block",
  // height: "calc(100% - 64px)"
};

const actionButtonStyle = {
  position: "fixed",
  marginBottom: "0px",
  bottom: "0px",
  right: "21px",
  width: "calc(100% - 21px)",
  backgroundColor: "white",
  paddingBottom: "14px",
};

const headingStyle = {
  fontFamily: "Roboto",
  fontSize: "16px",
  fontWeight: 700,
  lineHeight: "18.75px",
  textAlign: "center",
};

const ModalHeading = ({ label }) => {
  return (
    <h1 className="modal-heading" style={{ padding: 8 }}>
      <span className="heading-m">{label}</span>
    </h1>
  );
};

const CloseButton = (props) => {
  return (
    <div onClick={props?.onClick} className="header-bar-end">
      <CloseSvg />
    </div>
  );
};

function groupOrdersByParty(filteredOrders) {
  const accusedWiseOrdersMap = new Map();

  filteredOrders.forEach((order) => {
    const party = order.orderDetails?.parties?.[0];
    if (!party) return;

    let partyName = party.partyName.trim();
    let partyType = party.partyType.toLowerCase();
    if (partyType === "respondent") {
      partyType = "Accused";
    }
    if (partyType === "witness") {
      partyType = "Witness";
    }

    if (!accusedWiseOrdersMap.has(partyName)) {
      accusedWiseOrdersMap.set(partyName, { partyType, partyName, ordersList: [] });
    }

    accusedWiseOrdersMap.get(partyName).ordersList.push(order);
  });

  const accusedWiseOrdersList = Array.from(accusedWiseOrdersMap.values());

  // Sort first by partyType: "respondent", then "witness"
  accusedWiseOrdersList.sort((a, b) => {
    if (a.partyType === "Accused" && b.partyType !== "Accused") return -1;
    if (a.partyType !== "Accused" && b.partyType === "Accused") return 1;
    return 0;
  });

  accusedWiseOrdersList.forEach((party) => {
    party.ordersList.sort((a, b) => b.auditDetails.createdTime - a.auditDetails.createdTime);
  });

  return accusedWiseOrdersList;
}

const NoticeProcessModal = ({ handleClose, filingNumber, currentHearingId, caseDetails, showModal = true }) => {
  const history = useHistory();
  const { t } = useTranslation();
  const { state } = useLocation();
  const partyIndex = state?.state?.params?.partyIndex;
  const taskCnrNumber = state?.state?.params?.taskCnrNumber;
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const [orderNumber, setOrderNumber] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [orderType, setOrderType] = useState(null);
  const [itemId, setItemId] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const userType = Digit.UserService.getType();
  const [showNoticeModal, setshowNoticeModal] = useState(false);
  const [rowData, setRowData] = useState({});

  const caseCourtId = useMemo(() => caseDetails?.courtId, [caseDetails]);

  const { data: hearingsData } = Digit.Hooks.hearings.useGetHearings(
    {
      hearing: { tenantId },
      criteria: {
        tenantID: tenantId,
        filingNumber: filingNumber,
        ...(caseCourtId && { courtId: caseCourtId }),
      },
    },
    { applicationNumber: "", cnrNumber: "" },
    filingNumber,
    Boolean(filingNumber && caseCourtId)
  );

  const hearingDetails = useMemo(() => {
    if (!hearingsData?.HearingList) return [];

    if (currentHearingId) {
      const matched = hearingsData.HearingList.find((hearing) => hearing.hearingId === currentHearingId);
      return matched ? matched : [];
    }

    return [];
  }, [hearingsData, currentHearingId]);

  const { caseId, cnrNumber, caseTitle } = useMemo(
    () => ({ cnrNumber: caseDetails?.cnrNumber || "", caseId: caseDetails?.id, caseTitle: caseDetails?.caseTitle }),
    [caseDetails]
  );

  const handleCloseModal = () => {
    if (handleClose) {
      handleClose();
    } else history.goBack();
  };

  const handleNavigate = () => {
    const contextPath = window?.contextPath || "";
    history.push(
      `/${contextPath}/employee/home/home-pending-task/reissue-summons-modal?caseId=${caseId}&caseTitle=${caseTitle}&filingNumber=${filingNumber}&hearingId=${currentHearingId}&cnrNumber=${cnrNumber}&orderType=${orderType}`
    );
  };

  const { data: ordersData } = useSearchOrdersService(
    { criteria: { tenantId: tenantId, filingNumber, status: "PUBLISHED", ...(caseCourtId && { courtId: caseCourtId }) } },
    { tenantId },
    filingNumber,
    Boolean(filingNumber && caseCourtId)
  );

  const [orderList, setOrderList] = useState([]);

  const orderListFiltered = useMemo(() => {
    if (!ordersData?.list) return [];

    const filteredOrders = ordersData?.list?.flatMap((order) => {
      if (order?.orderCategory === "COMPOSITE") {
        return order?.compositeItems
          ?.filter((item) => ["NOTICE", "SUMMONS", "WARRANT"].includes(item?.orderType))
          ?.map((item) => ({
            ...order,
            orderType: item?.orderType,
            additionalDetails: item?.orderSchema?.additionalDetails,
            orderDetails: item?.orderSchema?.orderDetails,
            itemId: item?.id,
          }));
      } else {
        return ["NOTICE", "SUMMONS", "WARRANT"].includes(order?.orderType) ? [order] : [];
      }
    });

    const sortedOrders = [...filteredOrders]?.sort((a, b) => new Date(b?.createdDate) - new Date(a?.createdDate));

    const groupedByParty = groupOrdersByParty(sortedOrders);

    const updatedGrouped = groupedByParty?.map((partyGroup) => {
      const typeCounters = {};

      partyGroup?.ordersList?.forEach((order) => {
        const type = order?.orderType;
        if (!typeCounters[type]) typeCounters[type] = 0;
        typeCounters[type]++;
      });

      const updatedOrdersList = partyGroup?.ordersList?.map((order) => {
        const type = order?.orderType;
        const round = typeCounters[type]--;
        const titleCaseType = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();

        return {
          ...order,
          displayTitle: `${titleCaseType} - R${round}`,
        };
      });

      return {
        ...partyGroup,
        ordersList: updatedOrdersList,
      };
    });

    return updatedGrouped;
  }, [ordersData]);

  const [activeIndex, setActiveIndex] = useState({ partyIndex: 0, orderIndex: 0 });

  useEffect(() => {
    setOrderList(orderListFiltered?.[0]?.ordersList || []);
    setOrderNumber(orderListFiltered?.[0]?.ordersList?.[0]?.orderNumber);
    setOrderType(orderListFiltered?.[0]?.ordersList?.[0]?.orderType);
    setOrderId(orderListFiltered?.[0]?.ordersList?.[0]?.id);
    setItemId(orderListFiltered?.[0]?.ordersList?.[0]?.itemId);
  }, [orderListFiltered]);

  const config = useMemo(() => {
    if (!taskCnrNumber && !cnrNumber) return undefined;

    return summonsConfig({
      filingNumber,
      orderNumber,
      orderId,
      orderType,
      taskCnrNumber: taskCnrNumber || cnrNumber,
      itemId,
    });
  }, [filingNumber, orderNumber, orderId, orderType, taskCnrNumber, cnrNumber, itemId]);

  const getOrderPartyData = (orderType, orderList) => {
    return orderList?.find((item) => orderType === item?.orderType)?.orderDetails?.parties;
  };

  const { data: tasksData, isLoading: isTaskLoading } = Digit.Hooks.hearings.useGetTaskList(
    {
      criteria: {
        tenantId: tenantId,
        cnrNumber: taskCnrNumber || cnrNumber,
      },
    },
    {},
    filingNumber,
    Boolean(filingNumber)
  );

  const isButtonVisible = useMemo(() => {
    if (!tasksData || !orderId) return false;

    const filteredTasks = tasksData?.list?.filter((task) => task?.orderId === orderId);

    return filteredTasks?.some((task) => task?.status === "UNDELIVERED" || task?.status === "NOT_EXECUTED");
  }, [orderId, tasksData]);

  const CloseButton = (props) => {
    return (
      <div onClick={props?.onClick} className="header-bar-end">
        <CloseSvg />
      </div>
    );
  };

  const handleCloseNoticeModal = useCallback(() => {
    setshowNoticeModal(false);
  }, []);

  const caseInfo = useMemo(() => {
    return (
      <div className="case-info" style={{ height: "auto" }}>
        <div className="case-info-column" style={{ justifyContent: "flex-start", gap: "10px" }}>
          <div className="case-info-row" style={{ display: "flex", flexDirection: "row", gap: "20px" }}>
            <span style={{ minWidth: "40%" }}>{t("CASE_NAME_ID")}</span>
            <span>
              {caseDetails?.caseTitle}, {filingNumber}
            </span>
          </div>
          <div className="case-info-row" style={{ display: "flex", flexDirection: "row", gap: "20px" }}>
            <span style={{ minWidth: "40%" }}>{t("CS_NEXT_HEARING")}</span>
            <span>{currentHearingId ? formatDate(new Date(hearingDetails?.startTime), "DD-MM-YYYY") : t("No Hearing Schedueled")}</span>
          </div>
        </div>
        <div style={{ marginLeft: "10px" }}>
          <a
            href={`/${window?.contextPath}/${userType}/dristi/home/view-case?caseId=${caseId}&filingNumber=${filingNumber}&tab=Overview`}
            className="case-info-link"
            style={{ color: "black" }}
          >
            {t("View Case")}
          </a>
        </div>
      </div>
    );
  }, [t, caseDetails?.caseTitle, filingNumber, currentHearingId, hearingDetails?.startTime, userType, caseId]);

  function removeAccusedSuffix(partyName) {
    return partyName.replace(/\s*\(Accused\)$/, "");
  }

  const modalContent = (
    <div className="summon-modal" style={{ width: "100%" }}>
      {!showModal && (
        <h1 className="heading-m" style={{ margin: 0 }}>
          {t("PROCESS_SUMMARY")}
        </h1>
      )}
      <div className="rounds-of-delivery" style={{ cursor: "pointer", margin: "24px 0px" }}>
        {orderListFiltered.map((item, index) => (
          <div
            key={index}
            onClick={() => {
              setActiveIndex({ partyIndex: index, orderIndex: 0 });
              setOrderLoading(true);
              setOrderList(item?.ordersList);
              setOrderNumber(item?.ordersList?.[0]?.orderNumber);
              setOrderType(item?.ordersList?.[0]?.orderType);
              setOrderId(item?.ordersList?.[0]?.id);
              setItemId(item?.ordersList?.[0]?.itemId);
              setTimeout(() => {
                setOrderLoading((prev) => !prev);
              }, 0);
            }}
            className={`round-item ${index === activeIndex?.partyIndex ? "active" : ""}`}
            style={{
              fontWeight: index === activeIndex?.partyIndex ? "700" : "400",
              margin: 0,
              paddingRight: index === orderListFiltered?.length - 1 ? "0px" : "16px",
              paddingBottom: 0,
              paddingLeft: "0px",
              borderBottom: "1px solid #6F767E",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                gap: "8px",
                paddingBottom: "1rem",
                borderBottom: index === activeIndex?.partyIndex ? "3px solid #0A5757" : "",
              }}
            >
              <span style={{ color: index === activeIndex?.partyIndex ? "#0A5757" : "#6F767E" }}>
                {item?.partyType} {item?.partyType === "Accused" && index + 1}
              </span>
              <span style={{ color: index === activeIndex?.partyIndex ? "#0A5757" : "#6F767E" }}>{`(${removeAccusedSuffix(item?.partyName)})`}</span>
            </div>
          </div>
        ))}
      </div>
      {orderListFiltered?.length === 0 && <h1 style={{ marginLeft: "15px" }}>{t("NO_PROCESS_DONE_YET")}</h1>}
      {showModal && caseInfo}
      {orderListFiltered?.length > 0 && (
        <React.Fragment>
          {/* <h1 className="heading-m">{t("ROUND_OF_DELIEVERY")}</h1> */}
          <div className="rounds-of-delivery" style={{ cursor: "pointer", margin: "24px 0px" }}>
            {orderList.map((item, index) => (
              <div
                key={index}
                onClick={() => {
                  setActiveIndex({ ...activeIndex, orderIndex: index });
                  setOrderLoading(true);
                  setOrderNumber(item?.orderNumber);
                  setOrderType(item?.orderType);
                  setOrderId(item?.id);
                  setItemId(item?.itemId);
                  setTimeout(() => {
                    setOrderLoading((prev) => !prev);
                  }, 0);
                }}
                className={`round-item ${index === activeIndex?.orderIndex ? "active" : ""}`}
                style={{
                  gap: "4px",
                  fontWeight: "400",
                  height: "40px",
                  paddingTop: "12px",
                  paddingRight: "16px",
                  paddingBottom: "12px",
                  paddingLeft: "16px",
                  borderWidth: "1px",
                  borderRadius: "4px",
                  backgroundColor: index === activeIndex?.orderIndex ? "#59A9A91A" : "white",
                  borderColor: index === activeIndex?.orderIndex ? "#007E7E" : "#B5B5B5",
                  marginRight: "18px",
                  color: "black",
                }}
              >
                <div style={{ display: "flex", flexDirection: "row", alignItems: "center", width: "auto", whiteSpace: "nowrap" }}>
                  <span>{item?.displayTitle || `${orderList?.length - index} (${item?.orderType})`}</span>
                </div>
              </div>
            ))}
          </div>

          {orderList?.[activeIndex?.orderIndex] && (
            <div className="case-info" style={{ height: "auto", padding: "16px 12px", fontSize: "16px", margin: "24px 0px", width: "100%" }}>
              <div className="case-info-column" style={{ justifyContent: "flex-start", gap: "10px", flexDirection: "row" }}>
                <div className="case-info-row" style={{ display: "flex", flexDirection: "row", gap: "8px" }}>
                  <span style={{ fontWeight: "700", color: "black", fontSize: "16px" }}>{t("ORDER_ISSUED_ON")}:</span>
                  <span>{formatDate(new Date(orderList[activeIndex.orderIndex]?.createdDate), "DD-MM-YYYY")}</span>
                </div>
                <hr className="vertical-line" />
                <div className="case-info-row" style={{ display: "flex", flexDirection: "row", gap: "8px" }}>
                  <span style={{ fontWeight: "700", color: "black", fontSize: "16px" }}>{t("HEARING_DATE")}:</span>
                  <span>{formatDate(new Date(orderList[activeIndex.orderIndex]?.orderDetails?.hearingDate), "DD-MM-YYYY")}</span>
                </div>
              </div>
              <div style={{ marginLeft: "10px" }}>
                <a
                  href={`/${window?.contextPath}/${userType}/dristi/home/view-case?caseId=${caseId}&filingNumber=${filingNumber}&tab=Orders`}
                  className="case-info-link"
                  style={{ color: "#0A7E7E", fontWeight: "600" }}
                >
                  {t("View Order")}
                </a>
              </div>
            </div>
          )}

          {orderNumber && !orderLoading && config && (
            <InboxSearchComposer
              configs={config}
              defaultValues={filingNumber}
              additionalConfig={{
                resultsTable: {
                  onClickRow: (props) => {
                    if (["DELIVERED", "UNDELIVERED", "EXECUTED", "NOT_EXECUTED", "OTHER"].includes(props?.original?.status)) {
                      setRowData(props?.original);
                      setshowNoticeModal(true);
                      return;
                    }
                  },
                },
              }}
            />
          )}
          {isButtonVisible && currentHearingId && userType === "employee" && (
            <div className="action-buttons" style={{ ...(showModal ? actionButtonStyle : {}) }}>
              <Button
                label={t(`Re-Issue ${orderType === "SUMMONS" ? "Summon" : orderType === "NOTICE" ? "Notice" : "Warrant"}`)}
                onButtonClick={() => {
                  handleNavigate();
                }}
                className="action-button"
                style={{
                  boxShadow: "none",
                  padding: "16px 24px",
                }}
                textStyles={headingStyle}
              />
            </div>
          )}
        </React.Fragment>
      )}
    </div>
  );

  return (
    <React.Fragment>
      {showModal ? (
        <Modal
          isOpen={true}
          headerBarEnd={<CloseButton onClick={handleCloseModal} />}
          popupStyles={modalPopup}
          popupModuleActionBarStyles={{ display: "none" }}
          formId="modal-action"
          headerBarMain={<ModalHeading label={t("NOTICE_PROCESS_STATUS")} />}
          popupModuleMianStyles={{
            height: "calc(100% - 90px)",
            overFlowY: "auto",
            overflowX: "hidden",
          }}
        >
          {modalContent}
        </Modal>
      ) : (
        <div>{modalContent}</div>
      )}

      {showNoticeModal && <ReviewNoticeModal rowData={rowData} handleCloseNoticeModal={handleCloseNoticeModal} t={t} />}
    </React.Fragment>
  );
};

export default NoticeProcessModal;
