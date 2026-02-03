import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, CloseSvg, InboxSearchComposer } from "@egovernments/digit-ui-react-components";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom/cjs/react-router-dom.min";
import { formatDate } from "../../utils";
import useSearchOrdersService from "@egovernments/digit-ui-module-orders/src/hooks/orders/useSearchOrdersService";
import { summonsConfig } from "../../configs/SummonsNWarrantConfig";
import ReviewNoticeModal from "@egovernments/digit-ui-module-orders/src/components/ReviewNoticeModal";
import { getFormattedName } from "@egovernments/digit-ui-module-orders/src/utils";

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

const formDataKeyMap = {
  NOTICE: "noticeOrder",
  SUMMONS: "SummonsOrder",
  WARRANT: "warrantFor",
  PROCLAMATION: "proclamationFor",
  ATTACHMENT: "attachmentFor",
};

const ModalHeading = ({ label }) => {
  return (
    <h1 className="modal-heading" style={{ padding: 8 }}>
      <span className="heading-m">{label}</span>
    </h1>
  );
};

function removeAccusedSuffix(partyName) {
  return partyName?.replace(/\s*\((Accused|witness)\)$/, "");
}

function groupOrdersByParty(filteredOrders) {
  const accusedWiseOrdersMap = new Map();

  let policeOtherData = [];
  let remaingData = [];

  filteredOrders?.forEach((order) => {
    const addressee = order?.additionalDetails?.formdata?.processTemplate?.addressee;

    if (order?.orderType === "MISCELLANEOUS_PROCESS" && (addressee === "POLICE" || addressee === "OTHER")) {
      policeOtherData.push(order);
    } else {
      remaingData.push(order);
    }
  });

  policeOtherData?.forEach((order) => {
    const uniqueId = (order?.orderDetails?.processTemplate?.addressee|| "")?.toLowerCase();
    const addresseeType = uniqueId?.charAt(0).toUpperCase() + uniqueId?.slice(1);
    if (!accusedWiseOrdersMap?.has(uniqueId)) {
      accusedWiseOrdersMap?.set(uniqueId, { partyType: addresseeType, partyName: addresseeType, uniqueId, ordersList: [], order });
    }

    accusedWiseOrdersMap?.get(uniqueId)?.ordersList?.push(order);
  });

  remaingData?.forEach((order) => {
    let parties = [];
    if (order?.orderType === "MISCELLANEOUS_PROCESS") {
      const addressee = order?.additionalDetails?.formdata?.processTemplate?.addressee;
    
      if (["COMPLAINANT", "RESPONDENT"].includes(addressee) || addressee?.startsWith("COM") || addressee?.startsWith("RES")) {
        parties =
          order?.additionalDetails?.formdata?.selectAddresee?.map((p) => ({
            data: p,
          })) || [];
      }
    } else {
      const party = order?.additionalDetails?.formdata?.[formDataKeyMap[order?.orderType]]?.party;
      parties = Array.isArray(party) ? party : party ? [party] : [];
    }

    if (!Array?.isArray(parties) || parties?.length === 0) return;

    parties.forEach((party) => {
      const uniqueId = party?.data?.uniqueId || party?.data?.uuid;
      if (!uniqueId) return;

      const partyName = getFormattedName(
        party?.data?.firstName || party?.data?.respondentFirstName,
        party?.data?.middleName || party?.data?.respondentMiddleName,
        party?.data?.lastName || party?.data?.respondentLastName,
        party?.data?.witnessDesignation,
        null
      );

      let rawType = (party?.data?.partyType || "").toLowerCase();
      let partyType = "Other";

      if (rawType === "respondent" || rawType === "accused") {
        partyType = "Accused";
      } else if (rawType === "witness") {
        partyType = "Witness";
      } else if (rawType === "complainant") {
        partyType = "Complainant";
      } else {
        partyType = rawType.charAt(0).toUpperCase() + rawType.slice(1);
      }

      if (!accusedWiseOrdersMap?.has(uniqueId)) {
        accusedWiseOrdersMap?.set(uniqueId, { partyType, partyName, uniqueId, ordersList: [], order });
      }

      accusedWiseOrdersMap?.get(uniqueId)?.ordersList?.push(order);
    });
  });
  const accusedWiseOrdersList = Array.from(accusedWiseOrdersMap.values());

  const priority = { Accused: 1, Witness: 2, Complainant: 3, POLICE: 4, OTHER: 5 };

  accusedWiseOrdersList.sort((a, b) => {
    const scoreA = priority[a.partyType] || 99;
    const scoreB = priority[b.partyType] || 99;
    return scoreA - scoreB;
  });

  accusedWiseOrdersList.forEach((party) => {
    party.ordersList.sort((a, b) => b.auditDetails.createdTime - a.auditDetails.createdTime);
  });

  return accusedWiseOrdersList;
}

const NoticeProcessModal = ({
  handleClose,
  filingNumber,
  currentHearingId,
  caseDetails,
  showModal = true,
  ordersDataFromParent = null,
  hearingsDataFromParent = null,
}) => {
  const history = useHistory();
  const { t } = useTranslation();
  const { state } = useLocation();
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
  const [orderList, setOrderList] = useState([]);
  const [activeIndex, setActiveIndex] = useState({ partyIndex: 0, orderIndex: 0 });
  const [hasPendingTasks, setHasPendingTasks] = useState(true);
  const [partyUniqueId, setPartyUniqueId] = useState("");
  const [partyType, setPartyType] = useState(null);

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
    Boolean(filingNumber && caseCourtId && !hearingsDataFromParent)
  );

  const hearingDetails = useMemo(() => {
    if (!hearingsData?.HearingList || !hearingsDataFromParent?.HearingList) return [];
    const hearingDetails = hearingsDataFromParent || hearingsData;

    if (currentHearingId) {
      const matched = hearingDetails.HearingList.find((hearing) => hearing.hearingId === currentHearingId);
      return matched ? matched : [];
    }

    return [];
  }, [hearingsData, currentHearingId, hearingsDataFromParent]);

  const { caseId, cnrNumber } = useMemo(() => ({ cnrNumber: caseDetails?.cnrNumber || "", caseId: caseDetails?.id }), [caseDetails]);

  const handleCloseModal = () => {
    if (handleClose) {
      handleClose();
    } else history.goBack();
  };

  const { data: ordersFetchedData } = useSearchOrdersService(
    { criteria: { tenantId: tenantId, filingNumber, status: "PUBLISHED", ...(caseCourtId && { courtId: caseCourtId }) } },
    { tenantId },
    filingNumber,
    Boolean(filingNumber && caseCourtId && !ordersDataFromParent)
  );

  const ordersData = useMemo(() => ordersDataFromParent || ordersFetchedData, [ordersDataFromParent, ordersFetchedData]);

  const orderListFiltered = useMemo(() => {
    if (!ordersData?.list) return [];

    const filteredOrders = ordersData?.list?.flatMap((order) => {
      if (order?.orderCategory === "COMPOSITE") {
        return order?.compositeItems
          ?.filter((item) => ["NOTICE", "SUMMONS", "WARRANT", "PROCLAMATION", "ATTACHMENT", "MISCELLANEOUS_PROCESS"].includes(item?.orderType))
          ?.map((item) => ({
            ...order,
            orderType: item?.orderType,
            additionalDetails: item?.orderSchema?.additionalDetails,
            orderDetails: item?.orderSchema?.orderDetails,
            itemId: item?.id,
          }));
      } else {
        return ["NOTICE", "SUMMONS", "WARRANT", "PROCLAMATION", "ATTACHMENT", "MISCELLANEOUS_PROCESS"].includes(order?.orderType) ? [order] : [];
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
        const titleCaseType = type
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(" ");
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

  useEffect(() => {
    setOrderList(orderListFiltered?.[0]?.ordersList || []);
    setOrderNumber(orderListFiltered?.[0]?.ordersList?.[0]?.orderNumber);
    setOrderType(orderListFiltered?.[0]?.ordersList?.[0]?.orderType);
    setOrderId(orderListFiltered?.[0]?.ordersList?.[0]?.id);
    setItemId(orderListFiltered?.[0]?.ordersList?.[0]?.itemId);
    setPartyUniqueId(orderListFiltered?.[0]?.uniqueId);
    setPartyType(orderListFiltered?.[0]?.partyType);
  }, [orderListFiltered]);

  const [currentHearingNumber, setCurrentHearingNumber] = useState(hearingDetails?.hearingId);

  useEffect(() => {
    if (hearingDetails?.hearingId && !currentHearingNumber) {
      setCurrentHearingNumber(hearingDetails.hearingId);
    }
  }, [hearingDetails?.hearingId, currentHearingNumber]);

  const hearingCriteria = useMemo(
    () => ({
      tenantId,
      filingNumber,
      ...(currentHearingNumber && { hearingId: currentHearingNumber }),
      ...(caseCourtId && { courtId: caseCourtId }),
    }),
    [tenantId, filingNumber, caseCourtId, currentHearingNumber]
  );

  const { data: hearingByNumber } = Digit.Hooks.hearings.useGetHearings(
    {
      criteria: hearingCriteria,
    },
    { applicationNumber: "", cnrNumber: "" },
    `${currentHearingNumber}`,
    Boolean(filingNumber && caseCourtId)
  );

  const paymentStatusText = useMemo(() => {
    const status = hearingByNumber?.HearingList?.[0]?.status;
    return ["ABANDONED", "COMPLETED"].includes(status) ? "PAYMENT_EXPIRED_TEXT" : "PAYMENT_PENDING_TEXT";
  }, [hearingByNumber]);

  const paymentStatusSubText = useMemo(() => {
    const status = hearingByNumber?.HearingList?.[0]?.status;
    return ["ABANDONED", "COMPLETED"].includes(status) ? "PAYMENT_EXPIRED_SUB_TEXT" : "PAYMENT_PENDING_SUB_TEXT";
  }, [hearingByNumber]);

  const config = useMemo(() => {
    if (!taskCnrNumber && !cnrNumber) return undefined;
    debugger;
    return summonsConfig({
      filingNumber,
      orderNumber,
      orderId,
      orderType,
      taskCnrNumber: taskCnrNumber || cnrNumber,
      itemId,
      partyUniqueId,
      partyType,
    });
  }, [filingNumber, orderNumber, orderId, orderType, taskCnrNumber, cnrNumber, itemId, partyUniqueId]);

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
              setPartyType(item?.partyType);
              setPartyUniqueId(item?.uniqueId);
              setTimeout(() => {
                setOrderLoading((prev) => !prev);
              }, 0);
              setCurrentHearingNumber(item?.ordersList?.[0]?.scheduledHearingNumber);
              setHasPendingTasks(true);
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
                  setCurrentHearingNumber(item?.scheduledHearingNumber);
                  setHasPendingTasks(true);
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
                  <span>{formatDate(new Date(hearingByNumber?.HearingList?.[0]?.startTime), "DD-MM-YYYY")}</span>
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
          {hasPendingTasks === false ? (
            <div
              style={{
                background: "#F9E6E6",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                padding: "24px 0",
              }}
            >
              <span style={{ fontSize: "20px", fontWeight: "700", marginBottom: "6px" }}>{t(paymentStatusText)}</span>
              <span style={{ fontSize: "16px", fontWeight: "400" }}>{t(paymentStatusSubText)}</span>
            </div>
          ) : (
            orderNumber &&
            !orderLoading &&
            config && (
              <InboxSearchComposer
                configs={{
                  ...config,
                  additionalDetails: {
                    ...config?.additionalDetails,
                    setHasTasks: setHasPendingTasks,
                  },
                }}
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
            )
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
