import React, { useState, useEffect, useMemo } from "react";
import { useHistory } from "react-router-dom";
import { Modal, CloseSvg, Button, InboxSearchComposer } from "@egovernments/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { summonsConfig } from "../../configs/SummonsNWarrantConfig";
import useSearchOrdersService from "../../../../orders/src/hooks/orders/useSearchOrdersService";
import { formatDate } from "../../utils";
import { hearingService } from "../../hooks/services";
import { Urls } from "../../hooks/services/Urls";
import { useLocation } from "react-router-dom/cjs/react-router-dom.min";

const modalPopup = {
  height: "70%",
  minHeight: "40rem",
  width: "50%",
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
  const [orderLoading, setOrderLoading] = useState(false);
  const userType = Digit.UserService.getType();
  const { data: caseData } = Digit.Hooks.dristi.useSearchCaseService(
    {
      criteria: [
        {
          filingNumber: filingNumber,
        },
      ],
      tenantId,
    },
    {},
    `dristi-${filingNumber}`,
    filingNumber,
    Boolean(filingNumber)
  );

  const { data: hearingsData } = Digit.Hooks.hearings.useGetHearings(
    {
      hearing: { tenantId },
      criteria: {
        tenantID: tenantId,
        filingNumber: filingNumber,
        hearingId: hearingId,
      },
    },
    { applicationNumber: "", cnrNumber: "" },
    hearingId,
    Boolean(hearingId)
  );

  const hearingDetails = useMemo(() => hearingsData?.HearingList?.[0], [hearingsData]);

  const caseDetails = useMemo(
    () => ({
      ...caseData?.criteria?.[0]?.responseList?.[0],
    }),
    [caseData]
  );

  const isCaseAdmitted = useMemo(() => caseDetails?.status === "CASE_ADMITTED", [caseDetails]);

  const { caseId, cnrNumber } = useMemo(() => ({ cnrNumber: caseDetails.cnrNumber || "", caseId: caseDetails?.id }), [caseDetails]);

  const handleCloseModal = () => {
    if (handleClose) {
      handleClose();
    } else history.goBack();
  };

  const handleNavigate = () => {
    const contextPath = window?.contextPath || "";
    history.push(
      `/${contextPath}/employee/home/home-pending-task/reissue-summons-modal?filingNumber=${filingNumber}&hearingId=${hearingId}&cnrNumber=${cnrNumber}&orderType=${orderType}`
    );
  };

  const handleIssueWarrant = async ({ cnrNumber, filingNumber, orderType, hearingId }) => {
    let reqBody = {
      order: {
        createdDate: null,
        tenantId,
        cnrNumber,
        filingNumber: filingNumber,
        hearingNumber: hearingId,
        statuteSection: {
          tenantId,
        },
        orderType: orderType,
        status: "",
        isActive: true,
        workflow: {
          action: "SAVE_DRAFT",
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
            dateOfHearing: formatDate(new Date(hearingDetails?.startTime)),
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
          entityType: "order-default",
          referenceId: `MANUAL_${res.order.orderNumber}`,
          status: "DRAFT_IN_PROGRESS",
          assignedTo: [],
          assignedRole: ["JUDGE_ROLE"],
          cnrNumber: null,
          filingNumber: filingNumber,
          isCompleted: true,
          stateSla: null,
          additionalDetails: {},
          tenantId,
        },
      });
      history.push(`/${window.contextPath}/employee/orders/generate-orders?filingNumber=${filingNumber}&orderNumber=${res.order.orderNumber}`);
    } catch (error) {}
  };

  const { data: ordersData } = useSearchOrdersService(
    { criteria: { tenantId: tenantId, filingNumber } },
    { tenantId },
    filingNumber,
    Boolean(filingNumber)
  );

  const [orderList, setOrderList] = useState([]);

  const orderListFiltered = useMemo(() => {
    if (!ordersData?.list) return [];

    const filteredOrders = ordersData?.list?.filter(
      (item) =>
        (taskOrderType === "NOTICE" ? item.orderType === "NOTICE" : item.orderType === "SUMMONS" || item.orderType === "WARRANT") &&
        item?.status === "PUBLISHED" &&
        item?.hearingNumber === hearingId &&
        item?.additionalDetails?.formdata?.noticeOrder?.party?.data?.partyIndex === partyIndex 
    );

    const sortedOrders = filteredOrders?.sort((a, b) => {
      return new Date(b.auditDetails.createdTime) - new Date(a.auditDetails.createdTime);
    });

    return sortedOrders;
  }, [hearingId, ordersData?.list, partyIndex, taskOrderType]);

  const [activeIndex, setActiveIndex] = useState(0);
  useEffect(() => {
    setOrderList(orderListFiltered || []);
    setOrderNumber(orderListFiltered?.[0]?.orderNumber);
    setOrderType(orderListFiltered?.[0]?.orderType);
    setOrderId(orderListFiltered?.[0]?.id);
  }, [orderListFiltered]);

  const config = useMemo(() => summonsConfig({ filingNumber, orderNumber, orderId, orderType, taskCnrNumber }), [
    taskCnrNumber,
    filingNumber,
    orderId,
    orderNumber,
    orderType,
  ]);

  const getOrderPartyData = (orderType, orderList) => {
    return orderList?.find((item) => orderType === item?.orderType)?.orderDetails?.parties;
  };

  const { respondentName, partyType } = useMemo(() => {
    const partyData = getOrderPartyData(orderType, orderList);
    const respondentName = partyData?.[0]?.partyName || "Unknown";
    const partyType = partyData?.[0]?.partyType || "Respondent";
    return { respondentName, partyType };
  }, [orderList, orderType]);

  const CloseButton = (props) => {
    return (
      <div onClick={props?.onClick} className="header-bar-end">
        <CloseSvg />
      </div>
    );
  };

  const modalLabel = ["SUMMONS", "WARRANT"].includes(orderType) ? "SUMMON_WARRANT_STATUS" : "NOTICE_STATUS";

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
        <div className="case-info">
          <div className="case-info-column">
            <span className="case-info-label">{t("Case Name & ID")}</span>
            <span className="case-info-label">{t("Issued to")}</span>
            <span className="case-info-label">{t("Next Hearing Date")}</span>
            <span className="case-info-label">{t("Issued on")}</span>
          </div>

          <div className="case-info-column">
            <span className="case-info-value">
              {caseDetails?.caseTitle}, {filingNumber}
            </span>
            <span className="case-info-value">
              {respondentName} ({partyType} 1)
            </span>
            <span className="case-info-value">{hearingDetails?.startTime && formatDate(new Date(hearingDetails?.startTime), "DD-MM-YYYY")}</span>
            <span className="case-info-value">
              {orderList[orderList.length - 1]?.createdDate && formatDate(new Date(orderList[orderList.length - 1]?.createdDate), "DD-MM-YYYY")}{" "}
              (Round {orderList.length})
            </span>
          </div>

          <div className="case-info-column">
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
            <span></span>
            <span></span>
          </div>
        </div>

        <h1 className="heading-m">{t("Rounds Of Delivery")}</h1>
        <div></div>
        <div className="rounds-of-delivery" style={{ cursor: "pointer" }}>
          {orderList.map((item, index) => (
            <div
              key={index}
              onClick={() => {
                setActiveIndex(index);
                setOrderLoading(true);
                setOrderNumber(item?.orderNumber);
                setOrderType(item?.orderType);
                setOrderId(item?.id);
                setTimeout(() => {
                  setOrderLoading((prev) => !prev);
                }, 0);
              }}
              className={`round-item ${index === activeIndex ? "active" : ""}`}
            >
              {`${orderList.length - index} (${item?.orderType})`}
            </div>
          ))}
        </div>

        {orderNumber && !orderLoading && <InboxSearchComposer configs={config} defaultValues={filingNumber}></InboxSearchComposer>}

        <div className="action-buttons" style={actionButtonStyle}>
          {isCaseAdmitted && orderType !== "NOTICE" ? (
            <Button
              variation="secondary"
              className="action-button"
              label={t("Issue Warrant")}
              labelClassName={"secondary-label-selector"}
              onButtonClick={() => {
                handleIssueWarrant({
                  cnrNumber,
                  filingNumber,
                  orderType: "WARRANT",
                  hearingId,
                });
              }}
              style={{ marginRight: "1rem", fontWeight: "900" }}
            />
          ) : (
            orderType === "NOTICE" && (
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
          <Button
            label={t(`Re-Issue ${orderType === "SUMMONS" ? "Summon" : "Notice"}`)}
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
      </div>
    </Modal>
  );
};

export default SummonsAndWarrantsModal;
