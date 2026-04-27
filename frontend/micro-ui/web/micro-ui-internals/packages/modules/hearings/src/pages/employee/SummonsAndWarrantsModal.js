import React, { useState, useEffect, useMemo } from "react";
import { useHistory } from "react-router-dom";
import { Modal, CloseSvg, Button, InboxSearchComposer, Loader } from "@egovernments/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { summonsConfig } from "../../configs/SummonsNWarrantConfig";
import useSearchOrdersService from "../../../../orders/src/hooks/orders/useSearchOrdersService";
import { hearingService } from "../../hooks/services";
import { Urls } from "../../hooks/services/Urls";
import { useLocation } from "react-router-dom/cjs/react-router-dom.min";
import { DateUtils } from "@egovernments/digit-ui-module-dristi/src/Utils";
import { CaseWorkflowState } from "@egovernments/digit-ui-module-dristi/src/Utils/caseWorkflow";
import {
  ORDER_TYPES,
  ORDER_CATEGORIES,
  USER_TYPES,
  PARTY_TYPES,
  STATUS_TYPES,
  WORKFLOW_ACTIONS,
  ENTITY_TYPES,
  USER_ROLES,
} from "../../utils/constants";

const modalPopup = {
  height: "70%",
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
  paddingBottom: "16px",
};

const headingStyle = {
  fontFamily: "Roboto",
  fontSize: "16px",
  fontWeight: 700,
  lineHeight: "18.75px",
  textAlign: "center",
};

const ModalHeading = ({ label, orderList }) => {
  return (
    <h1 className="modal-heading" style={{ padding: 8 }}>
      <span className="heading-m">{label}</span>
      {orderList && orderList.length > 1 ? (
        <span className="heading-xs">Failed {orderList.length - 1} times</span>
      ) : (
        <span className="heading-xs">No previous failed attempts</span>
      )}{" "}
    </h1>
  );
};

function groupOrdersByParty(filteredOrders) {
  const accusedWiseOrdersMap = new Map();

  filteredOrders.forEach((order) => {
    const party = order.orderDetails?.parties?.[0];
    if (!party) return;

    let partyName = party.partyName.trim();
    let partyType = party.partyType.toLowerCase();
    if (partyType === PARTY_TYPES.RESPONDENT_LOWER) {
      partyType = PARTY_TYPES.ACCUSED;
    }
    if (partyType === PARTY_TYPES.WITNESS) {
      partyType = PARTY_TYPES.WITNESS_DISPLAY;
    }

    if (!accusedWiseOrdersMap.has(partyName)) {
      accusedWiseOrdersMap.set(partyName, { partyType, partyName, ordersList: [] });
    }

    accusedWiseOrdersMap.get(partyName).ordersList.push(order);
  });

  const accusedWiseOrdersList = Array.from(accusedWiseOrdersMap.values());

  // Sort first by partyType: "respondent", then "witness"
  accusedWiseOrdersList.sort((a, b) => {
    if (a.partyType === PARTY_TYPES.ACCUSED && b.partyType !== PARTY_TYPES.ACCUSED) return -1;
    if (a.partyType !== PARTY_TYPES.ACCUSED && b.partyType === PARTY_TYPES.ACCUSED) return 1;
    return 0;
  });

  accusedWiseOrdersList.forEach((party) => {
    party.ordersList.sort((a, b) => b.auditDetails.createdTime - a.auditDetails.createdTime);
  });

  return accusedWiseOrdersList;
}

const SummonsAndWarrantsModal = ({ handleClose }) => {
  const history = useHistory();
  const { t } = useTranslation();
  const { filingNumber, hearingId, taskOrderType } = Digit.Hooks.useQueryParams();
  const { state } = useLocation();
  const partyIndex = state?.state?.params?.partyIndex;
  const taskCnrNumber = state?.state?.params?.taskCnrNumber;
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const [orderNumber, setOrderNumber] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [orderType, setOrderType] = useState(null);
  const [itemId, setItemId] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const userType = Digit.UserService.getType();
  const courtId = localStorage.getItem("courtId");

  const { data: caseData } = Digit.Hooks.dristi.useSearchCaseService(
    {
      criteria: [
        {
          filingNumber: filingNumber,
          ...(courtId && userType === USER_TYPES.EMPLOYEE.toLocaleLowerCase() && { courtId }),
        },
      ],
      tenantId,
    },
    {},
    `dristi-${filingNumber}`,
    filingNumber,
    Boolean(filingNumber)
  );

  const caseDetails = useMemo(
    () => ({
      ...caseData?.criteria?.[0]?.responseList?.[0],
    }),
    [caseData]
  );

  const caseCourtId = useMemo(() => caseDetails?.courtId, [caseDetails]);
  const isCaseAdmitted = useMemo(() => caseDetails?.status === CaseWorkflowState.CASE_ADMITTED, [caseDetails]);

  const { caseId, cnrNumber, caseTitle } = useMemo(
    () => ({ cnrNumber: caseDetails.cnrNumber || "", caseId: caseDetails?.id, caseTitle: caseDetails?.caseTitle }),
    [caseDetails]
  );

  const { data: hearingsData } = Digit.Hooks.hearings.useGetHearings(
    {
      hearing: { tenantId },
      criteria: {
        tenantID: tenantId,
        filingNumber: filingNumber,
        hearingId: hearingId,
        ...(caseCourtId && { courtId: caseCourtId }),
      },
    },
    { applicationNumber: "", cnrNumber: "" },
    hearingId,
    Boolean(hearingId && caseCourtId)
  );

  const hearingDetails = useMemo(() => hearingsData?.HearingList?.[0], [hearingsData]);

  const handleCloseModal = () => {
    if (handleClose) {
      handleClose();
    } else history.goBack();
  };

  const handleIssueWarrant = async ({ cnrNumber, filingNumber, orderType, hearingId }) => {
    setIsActionLoading(true);
    let reqBody = {
      order: {
        createdDate: null,
        tenantId,
        cnrNumber,
        filingNumber: filingNumber,
        // hearingNumber: hearingId,
        statuteSection: {
          tenantId,
        },
        orderTitle: orderType,
        orderCategory: ORDER_CATEGORIES.INTERMEDIATE,
        orderType: orderType,
        status: "",
        isActive: true,
        workflow: {
          action: WORKFLOW_ACTIONS.SAVE_DRAFT,
          comments: "Creating order",
          assignes: null,
          rating: null,
          documents: [{}],
        },
        documents: [],
        additionalDetails: {
          hearingId: hearingId,
          formdata: {
            orderType: {
              code: orderType,
              type: orderType,
              name: `ORDER_TYPE_${orderType}`,
            },
            dateOfHearing: DateUtils.getFormattedDate(new Date(hearingDetails?.startTime), "YYYY-MM-DD"),
            warrantFor: respondentName,
          },
        },
      },
    };
    try {
      const res = await hearingService.customApiService(Urls.order.createOrder, reqBody, { tenantId });
      hearingService.customApiService(Urls.pendingTask, {
        pendingTask: {
          name: "Order Created",
          entityType: ENTITY_TYPES.ORDER_DEFAULT,
          referenceId: `MANUAL_${res.order.orderNumber}`,
          status: STATUS_TYPES.DRAFT_IN_PROGRESS,
          assignedTo: [],
          assignedRole: [USER_ROLES.PENDING_TASK_ORDER],
          cnrNumber: caseDetails?.cnrNumber,
          filingNumber: filingNumber,
          caseId: caseDetails?.id,
          caseTitle: caseDetails?.caseTitle,
          isCompleted: true,
          stateSla: null,
          additionalDetails: {},
          tenantId,
        },
      });
      history.push(`/${window.contextPath}/employee/orders/generate-order?filingNumber=${filingNumber}&orderNumber=${res.order.orderNumber}`);
    } catch (error) {
      console.error("Error issuing warrant:", error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const { data: ordersData } = useSearchOrdersService(
    { criteria: { tenantId: tenantId, filingNumber, status: STATUS_TYPES.PUBLISHED, ...(caseCourtId && { courtId: caseCourtId }) } },
    { tenantId },
    filingNumber,
    Boolean(filingNumber && caseCourtId)
  );

  const [orderList, setOrderList] = useState([]);

  const orderListFiltered = useMemo(() => {
    if (!ordersData?.list) return [];

    const filteredOrders = ordersData?.list?.flatMap((order) => {
      if (order?.orderCategory === ORDER_CATEGORIES.COMPOSITE) {
        return order?.compositeItems
          ?.filter(
            (item) =>
              (taskOrderType === ORDER_TYPES.NOTICE
                ? item?.orderType === ORDER_TYPES.NOTICE
                : [ORDER_TYPES.SUMMONS, ORDER_TYPES.WARRANT, ORDER_TYPES.PROCLAMATION, ORDER_TYPES.ATTACHMENT].includes(item?.orderType)) &&
              (order?.scheduledHearingNumber || order?.hearingNumber) === hearingId
          )
          ?.map((item) => ({
            ...order,
            orderType: item?.orderType,
            additionalDetails: item?.orderSchema?.additionalDetails,
            orderDetails: item?.orderSchema?.orderDetails,
            itemId: item?.id,
          }));
      } else {
        return (taskOrderType === ORDER_TYPES.NOTICE
          ? order?.orderType === ORDER_TYPES.NOTICE
          : [ORDER_TYPES.SUMMONS, ORDER_TYPES.WARRANT, ORDER_TYPES.PROCLAMATION, ORDER_TYPES.ATTACHMENT].includes(order?.orderType)) &&
          (order?.scheduledHearingNumber || order?.hearingNumber) === hearingId
          ? [order]
          : [];
      }
    });

    // make orders list by partyTypes Accused and Witness.
    const accusedWiseOrdersList = groupOrdersByParty(filteredOrders);

    return accusedWiseOrdersList;
  }, [hearingId, ordersData?.list, partyIndex, taskOrderType, ordersData]);

  const [activeIndex, setActiveIndex] = useState({ partyIndex: 0, orderIndex: 0 });
  useEffect(() => {
    setOrderList(orderListFiltered?.[0]?.ordersList || []);
    setOrderNumber(orderListFiltered?.[0]?.ordersList?.[0]?.orderNumber);
    setOrderType(orderListFiltered?.[0]?.ordersList?.[0]?.orderType);
    setOrderId(orderListFiltered?.[0]?.ordersList?.[0]?.id);
    setItemId(orderListFiltered?.[0]?.ordersList?.[0]?.itemId);
  }, [orderListFiltered]);

  const config = useMemo(() => summonsConfig({ filingNumber, orderNumber, orderId, orderType, taskCnrNumber, itemId, caseCourtId }), [
    taskCnrNumber,
    filingNumber,
    orderId,
    orderNumber,
    orderType,
    itemId,
    caseCourtId,
  ]);

  const getOrderPartyData = (orderType, orderList) => {
    return orderList?.find((item) => orderType === item?.orderType)?.orderDetails?.parties;
  };

  const { respondentName, partyType } = useMemo(() => {
    const partyData = getOrderPartyData(orderType, orderList);
    const respondentName = partyData?.[0]?.partyName || "Unknown";
    const partyType = partyData?.[0]?.partyType || PARTY_TYPES.RESPONDENT_DISPLAY;
    return { respondentName, partyType };
  }, [orderList, orderType]);

  const CloseButton = (props) => {
    return (
      <div onClick={props?.onClick} className="header-bar-end">
        <CloseSvg />
      </div>
    );
  };

  const totalSummons = useMemo(() => {
    return (orderList || [])?.filter((order) => order?.orderType === ORDER_TYPES.SUMMONS)?.length;
  }, [orderList]);

  const totalWarrants = useMemo(() => {
    return (orderList || [])?.filter((order) => order?.orderType === ORDER_TYPES.WARRANT)?.length;
  }, [orderList]);

  const totalNotices = useMemo(() => {
    return (orderList || [])?.filter((order) => order?.orderType === ORDER_TYPES.NOTICE)?.length;
  }, [orderList]);

  const lastSummon = useMemo(() => {
    return orderList?.find((order) => order?.orderType === ORDER_TYPES.SUMMONS) || null;
  }, [orderList]);

  const lastWarrant = useMemo(() => {
    return orderList?.find((order) => order?.orderType === ORDER_TYPES.WARRANT) || null;
  }, [orderList]);

  const lastNotice = useMemo(() => {
    return orderList?.find((order) => order?.orderType === ORDER_TYPES.NOTICE) || null;
  }, [orderList]);

  const caseInfo = useMemo(() => {
    return (
      <div className="case-info">
        <div className="case-info-column">
          <div className="case-info-row" style={{ display: "flex", flexDirection: "row", gap: "20px" }}>
            <span style={{ minWidth: "40%" }}>{t("Case Name & ID")}</span>
            <span>
              {caseDetails?.caseTitle}, {filingNumber}
            </span>
          </div>
          <div className="case-info-row" style={{ display: "flex", flexDirection: "row", gap: "20px" }}>
            <span style={{ minWidth: "40%" }}>{t("Issued to")}</span>
            <span>{respondentName}</span>
          </div>
          <div className="case-info-row" style={{ display: "flex", flexDirection: "row", gap: "20px" }}>
            <span style={{ minWidth: "40%" }}>{t("Next Hearing Date")}</span>
            <span>{hearingDetails?.startTime && DateUtils.getFormattedDate(new Date(hearingDetails?.startTime), "DD-MM-YYYY")}</span>
          </div>
          {totalSummons > 0 && (
            <div className="case-info-row" style={{ display: "flex", flexDirection: "row", gap: "20px" }}>
              <span style={{ minWidth: "40%" }}>{t("Last Summon issued on")}</span>
              <span>
                {lastSummon.createdDate && DateUtils.getFormattedDate(new Date(lastSummon?.createdDate), "DD-MM-YYYY")} (Round {totalSummons})
              </span>
            </div>
          )}
          {totalWarrants > 0 && (
            <div className="case-info-row" style={{ display: "flex", flexDirection: "row", gap: "20px" }}>
              <span style={{ minWidth: "40%" }}>{t("Last Warrant issued on")}</span>
              <span>
                {lastWarrant?.createdDate && DateUtils.getFormattedDate(new Date(lastWarrant?.createdDate), "DD-MM-YYYY")} (Round {totalWarrants})
              </span>
            </div>
          )}
          {totalNotices > 0 && (
            <div className="case-info-row" style={{ display: "flex", flexDirection: "row", gap: "20px" }}>
              <span style={{ minWidth: "40%" }}>{t("Last Notice issued on")}</span>
              <span>
                {lastNotice?.createdDate && DateUtils.getFormattedDate(new Date(lastNotice?.createdDate), "DD-MM-YYYY")} (Round {totalNotices})
              </span>
            </div>
          )}
        </div>

        <div className="case-info-column" style={{ marginLeft: "10px" }}>
          <a
            href={`/${window?.contextPath}/${userType}/dristi/home/view-case?caseId=${caseId}&filingNumber=${filingNumber}&tab=Overview`}
            className="case-info-link"
          >
            {t("View Case")}
          </a>
          <a
            href={`/${window?.contextPath}/${userType}/dristi/home/view-case?caseId=${caseId}&filingNumber=${filingNumber}&tab=Orders`}
            className="case-info-link"
          >
            {t("View Order")}
          </a>
        </div>
      </div>
    );
  }, [caseDetails, filingNumber, respondentName, hearingDetails, orderList, userType, caseId]);

  const modalLabel = [ORDER_TYPES.SUMMONS, ORDER_TYPES.WARRANT, ORDER_TYPES.PROCLAMATION, ORDER_TYPES.ATTACHMENT].includes(orderType) ? "SUMMON_WARRANT_STATUS" : "NOTICE_STATUS";

  function removeAccusedSuffix(partyName) {
    return partyName.replace(/\s*\(Accused\)$/, "");
  }

  return (
    <Modal
      isOpen={true}
      headerBarEnd={<CloseButton onClick={handleCloseModal} />}
      popupStyles={modalPopup}
      popupModuleActionBarStyles={{
        display: "none",
      }}
      formId="modal-action"
      headerBarMain={orderList && <ModalHeading label={t(modalLabel)} orderList={orderList} />}
      popupModuleMianStyles={{
        height: "calc(100% - 64px)",
        overFlowY: "auto",
        overflowX: "hidden",
      }}
    >
      <div className="summon-modal" style={{ width: "100%" }}>
        <div className="rounds-of-delivery" style={{ cursor: "pointer", marginLeft: "17px" }}>
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
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span>{removeAccusedSuffix(item?.partyName)}</span>
                <span style={{ fontWeight: "400" }}>{item?.partyType}</span>
              </div>
            </div>
          ))}
        </div>
        {caseInfo}
        <h1 className="heading-m">{t("Rounds Of Delivery")}</h1>
        <div className="rounds-of-delivery" style={{ cursor: "pointer", marginLeft: "17px" }}>
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
            >
              <div style={{ display: "flex", flexDirection: "row", alignItems: "center", width: "auto", whiteSpace: "nowrap" }}>
                <span>{`${orderList?.length - index} (${item?.orderType})`}</span>
              </div>
            </div>
          ))}
        </div>

        {orderNumber && !orderLoading && <InboxSearchComposer configs={config} defaultValues={filingNumber}></InboxSearchComposer>}

        <div className="action-buttons" style={actionButtonStyle}>
          {isCaseAdmitted && orderType !== ORDER_TYPES.NOTICE ? (
            <Button
              variation="secondary"
              className="action-button"
              label={t("Issue Warrant")}
              labelClassName={"secondary-label-selector"}
              onButtonClick={() => {
                handleIssueWarrant({
                  cnrNumber,
                  filingNumber,
                  orderType: ORDER_TYPES.WARRANT,
                  hearingId,
                });
              }}
              isDisabled={isActionLoading}
              style={{ marginRight: "1rem", fontWeight: "900" }}
            />
          ) : (
            orderType === ORDER_TYPES.NOTICE && (
              <Button
                variation="secondary"
                className="action-button"
                label={t("View Case File")}
                labelClassName={"secondary-label-selector"}
                onButtonClick={() => {
                  history.push(
                    `/${window?.contextPath}/employee/dristi/home/view-case?caseId=${caseDetails?.id}&filingNumber=${caseDetails?.filingNumber}&tab=Overview`
                  );
                }}
                style={{ marginRight: "1rem", fontWeight: "900" }}
              />
            )
          )}
          {/* <Button
            label={`Re-Issue ${t(orderType)}`}
            onButtonClick={() => {
              handleNavigate();
            }}
            className="action-button"
            style={{
              boxShadow: "none",
              padding: "16px 24px",
            }}
            textStyles={headingStyle}
          /> */}
        </div>
      </div>
    </Modal>
  );
};

export default SummonsAndWarrantsModal;
