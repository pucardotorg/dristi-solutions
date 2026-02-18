import React, { useMemo } from "react";
import { useHistory } from "react-router-dom";
import { Modal, CloseSvg } from "@egovernments/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { Loader } from "@egovernments/digit-ui-components";
import { ordersService } from "../hooks/services";
import { OrderWorkflowAction } from "../utils/orderWorkflow";
import { Urls } from "../hooks/services/Urls";
import { DateUtils } from "@egovernments/digit-ui-module-dristi/src/Utils";
function ReIssueSummonsModal() {
  const { t } = useTranslation();
  const history = useHistory();
  const { hearingId, filingNumber, cnrNumber, orderType, caseId, caseTitle } = Digit.Hooks.useQueryParams();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const userInfo = Digit.UserService.getUser()?.info;
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo?.type]);
  const courtId = localStorage.getItem("courtId");
  const { data: hearingsData, isLoading: isHearingLoading } = Digit.Hooks.hearings.useGetHearings(
    {
      hearing: { tenantId },
      criteria: {
        tenantID: tenantId,
        filingNumber: filingNumber,
        hearingId: hearingId,
        ...(courtId && userType === "employee" && { courtId }),
      },
    },
    { applicationNumber: "", cnrNumber },
    hearingId,
    Boolean(hearingId && userType)
  );
  const hearingDetails = useMemo(() => hearingsData?.HearingList?.[0], [hearingsData]);

  const handleCloseModal = () => {
    history.goBack();
  };

  const Heading = (props) => {
    return <h1 className="heading-m">{props.label}</h1>;
  };

  const CloseButton = (props) => {
    return (
      <div onClick={props?.onClick} className="header-bar-end">
        <CloseSvg />
      </div>
    );
  };
  const todayDate = new Date().getTime();
  const dayInMillisecond = 24 * 3600 * 1000;
  const hadleCreateOrder = async (orderType, taskOrderType) => {
    const reqbody = {
      order: {
        createdDate: null,
        tenantId,
        cnrNumber,
        filingNumber,
        statuteSection: {
          tenantId,
        },
        orderTitle: orderType,
        orderCategory: "INTERMEDIATE",
        orderType,
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
          [taskOrderType === "NOTICE" ? "isReIssueNotice" : "isReIssueSummons"]: true,
          formdata: {
            orderType: {
              code: orderType,
              type: orderType,
              name: `ORDER_TYPE_${orderType}`,
            },
            originalHearingDate: DateUtils.getFormattedDate(new Date(hearingDetails?.startTime), "YYYY-MM-DD"),
            hearingDate: DateUtils.getFormattedDate(new Date(hearingDetails?.startTime), "YYYY-MM-DD"),
          },
        },
        // hearingNumber: hearingId,
      },
    };
    const res = await ordersService.createOrder(reqbody, { tenantId });
    await ordersService.customApiService(Urls.orders.pendingTask, {
      pendingTask: {
        name: "Completed",
        entityType: "order-default",
        referenceId: `MANUAL_${hearingId}`,
        status: "DRAFT_IN_PROGRESS",
        assignedTo: [],
        assignedRole: [],
        cnrNumber: cnrNumber,
        filingNumber: filingNumber,
        caseId: caseId,
        caseTitle: caseTitle,
        isCompleted: true,
        stateSla: null,
        additionalDetails: {},
        tenantId,
      },
    });
    ordersService.customApiService(Urls.orders.pendingTask, {
      pendingTask: {
        name: t("ORDERS_DRAFT_IN_PROGRESS"),
        entityType: "order-default",
        referenceId: `MANUAL_${res?.order?.orderNumber}`,
        status: "DRAFT_IN_PROGRESS",
        assignedTo: [],
        assignedRole: ["PENDING_TASK_ORDER"],
        cnrNumber,
        filingNumber,
        caseId: caseId,
        caseTitle: caseTitle,
        isCompleted: false,
        stateSla: 3 * dayInMillisecond + todayDate,
        additionalDetails: {},
        tenantId,
      },
    });
    history.push(`/${window.contextPath}/employee/orders/generate-order?filingNumber=${filingNumber}&orderNumber=${res?.order?.orderNumber}`);
  };
  const handleRescheduleHearing = async () => {
    try {
      return await hadleCreateOrder("RESCHEDULE_OF_HEARING_DATE", orderType);
    } catch (error) {}
  };

  const handleReIssueSummon = async () => {
    try {
      return await hadleCreateOrder(orderType || "SUMMONS");
    } catch (error) {}
  };

  if (isHearingLoading) {
    return <Loader />;
  }

  return (
    <Modal
      headerBarMain={<Heading label={t("RESCHEDULE_HEARING_FOR_SUMMONS")} />}
      headerBarEnd={<CloseButton onClick={handleCloseModal} />}
      actionCancelLabel={t("CS_SKIP_AND_CONTINUE")}
      actionCancelOnSubmit={handleReIssueSummon}
      actionSaveLabel={t("RESCHEDULE_HEARING")}
      actionSaveOnSubmit={handleRescheduleHearing}
    >
      <h2>{`${t("NEXT_HEARING_SCHEDULED_ON")} ${DateUtils.getFormattedDate(new Date(hearingDetails?.startTime))} ${t(
        "DO_YOU_WANT_TO_RESCHEDULE"
      )}`}</h2>
    </Modal>
  );
}

export default ReIssueSummonsModal;
