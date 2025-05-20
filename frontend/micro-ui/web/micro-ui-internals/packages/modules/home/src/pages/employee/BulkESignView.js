import { ActionBar, BreadCrumb, Toast, CloseSvg, InboxSearchComposer, SubmitBar, Loader } from "@egovernments/digit-ui-react-components";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { bulkESignOrderConfig } from "../../configs/BulkSignConfig";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import { orderManagementService, ordersService } from "@egovernments/digit-ui-module-orders/src/hooks/services";
import { OrderWorkflowAction, OrderWorkflowState } from "@egovernments/digit-ui-module-dristi/src/Utils/orderWorkflow";
import OrderBulkReviewModal from "@egovernments/digit-ui-module-orders/src/pageComponents/OrderBulkReviewModal";
import useSearchOrdersService from "@egovernments/digit-ui-module-orders/src/hooks/orders/useSearchOrdersService";
import axios from "axios";
import qs from "qs";
import { HomeService } from "../../hooks/services";
import useSearchOrdersNotificationService from "@egovernments/digit-ui-module-orders/src/hooks/orders/useSearchOrdersNotificationService";

const parseXml = (xmlString, tagName) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "application/xml");

  const element = xmlDoc.getElementsByTagName(tagName)[0];
  return element ? element.textContent.trim() : null;
};

const sectionsParentStyle = {
  height: "50%",
  display: "flex",
  flexDirection: "column",
  gridTemplateColumns: "20% 1fr",
  gap: "1rem",
};

const ProjectBreadCrumb = ({ location }) => {
  const userInfo = window?.Digit?.UserService?.getUser()?.info;
  let userType = "employee";
  if (userInfo) {
    userType = userInfo?.type === "CITIZEN" ? "citizen" : "employee";
  }
  const { t } = useTranslation();
  const crumbs = [
    {
      path: `/${window?.contextPath}/${userType}/home/home-pending-task`,
      content: t("ES_COMMON_HOME"),
      show: true,
    },
    {
      path: `/${window?.contextPath}/${userType}`,
      content: t("BULK_SIGNING"),
      show: true,
    },
  ];
  return <BreadCrumb crumbs={crumbs} spanStyle={{ maxWidth: "min-content" }} />;
};

function BulkESignView() {
  const { t } = useTranslation();
  const tenantId = window?.Digit.ULBService.getStateId();
  const history = useHistory();
  const userInfo = Digit.UserService.getUser()?.info;
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo?.type]);

  const [bulkSignList, setBulkSignList] = useState(null);
  const [showOrderDeleteModal, setShowOrderDeleteModal] = useState(false);
  const [showBulkSignConfirmModal, setShowBulkSignConfirmModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteOrderLoading, setIsDeleteOrderLoading] = useState(false);

  const [showErrorToast, setShowErrorToast] = useState(null);
  const { orderNumber, deleteOrder } = Digit.Hooks.useQueryParams();
  const [showBulkSignAllModal, setShowBulkSignAllModal] = useState(false);
  const bulkSignUrl = window?.globalConfigs?.getConfig("BULK_SIGN_URL") || "http://localhost:1620";
  const courtId = localStorage.getItem("courtId");

  const Heading = (props) => {
    return <h1 className="heading-m">{props.label}</h1>;
  };

  const CloseBtn = (props) => {
    return (
      <div onClick={props?.onClick} style={{ height: "100%", display: "flex", alignItems: "center", cursor: "pointer" }}>
        <CloseSvg />
      </div>
    );
  };

  const closeToast = () => {
    setShowErrorToast(null);
  };

  const { data: ordersData } = useSearchOrdersService(
    {
      tenantId,
      criteria: { orderNumber: orderNumber },
      pagination: { limit: 1000, offset: 0 },
    },
    { tenantId },
    orderNumber,
    Boolean(orderNumber)
  );

  const { data: bulkOrdersData } = useSearchOrdersNotificationService(
    {
      inbox: {
        processSearchCriteria: {
          businessService: ["notification"],
          moduleName: "Transformer service",
        },
        limit: 1,
        offset: 0,
        tenantId: tenantId,
        moduleSearchCriteria: {
          entityType: "Order",
          tenantId: tenantId,
          status: OrderWorkflowState.PENDING_BULK_E_SIGN,
          ...(courtId && { courtId }),
        },
      },
    },
    { tenantId },
    `${orderNumber}-${OrderWorkflowState.PENDING_BULK_E_SIGN}`,
    true
  );

  const orderDetails = useMemo(() => ordersData?.list?.[0] || {}, [ordersData]);

  useEffect(() => {
    if (orderDetails?.orderNumber) {
      if (deleteOrder) {
        setShowOrderDeleteModal(true);
      } else {
        setShowBulkSignAllModal(true);
      }
    }
    if (bulkOrdersData?.totalCount === 0) {
      history.replace(`/${window?.contextPath}/${userType}/home/home-pending-task`);
    }
  }, [history, userType, deleteOrder, orderDetails, bulkOrdersData]);

  useEffect(() => {
    if (showErrorToast) {
      const timer = setTimeout(() => {
        setShowErrorToast(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showErrorToast]);

  const config = useMemo(() => {
    const updateOrderFunc = async (orderData, checked) => {
      setBulkSignList((prev) => {
        return prev?.map((item, i) => {
          if (item?.businessObject?.orderNotification?.id !== orderData?.businessObject?.orderNotification?.id) return item;

          return {
            ...item,
            isSelected: checked,
          };
        });
      });
    };

    const deleteOrderFunc = async (data) => {
      history.push(
        `/${window?.contextPath}/${userType}/home/bulk-esign-order?orderNumber=${data?.businessObject?.orderNotification?.id}&deleteOrder=true`
      );
    };

    const setOrderFunc = async (order) => {
      if (order?.businessObject?.orderNotification?.entityType === "Order") {
        const orderResponse = await ordersService.searchOrder(
          { criteria: { tenantId: tenantId, orderNumber: order?.businessObject?.orderNotification?.id, ...(courtId && { courtId }) } },
          { tenantId }
        );
        order = orderResponse?.list?.[0];

        if (order?.status === OrderWorkflowState.DRAFT_IN_PROGRESS) {
          history.push(
            `/${window.contextPath}/${userType}/orders/generate-orders?filingNumber=${order?.filingNumber}&orderNumber=${order?.orderNumber}`
          );
        } else if (order?.status === OrderWorkflowState.PENDING_BULK_E_SIGN) {
          history.push(`/${window?.contextPath}/${userType}/home/bulk-esign-order?orderNumber=${order?.orderNumber}`);
        }
      }
    };

    return {
      ...bulkESignOrderConfig,
      apiDetails: {
        ...bulkESignOrderConfig.apiDetails,
        requestBody: {
          ...bulkESignOrderConfig.apiDetails.requestBody,
          inbox: {
            ...bulkESignOrderConfig.apiDetails.requestBody.inbox,
            moduleSearchCriteria: {
              ...bulkESignOrderConfig.apiDetails.requestBody.inbox.moduleSearchCriteria,
              ...(courtId && { courtId }),
            },
          },
        },
      },
      sections: {
        ...bulkESignOrderConfig.sections,
        searchResult: {
          ...bulkESignOrderConfig.sections.searchResult,
          uiConfig: {
            ...bulkESignOrderConfig.sections.searchResult.uiConfig,
            columns: bulkESignOrderConfig.sections.searchResult.uiConfig.columns.map((column) => {
              return column.label === "SELECT"
                ? {
                    ...column,
                    updateOrderFunc: updateOrderFunc,
                  }
                : column.label === "TITLE"
                ? {
                    ...column,
                    clickFunc: setOrderFunc,
                  }
                : column.label === "CS_ACTIONS"
                ? {
                    ...column,
                    clickFunc: deleteOrderFunc,
                  }
                : column;
            }),
          },
        },
      },
    };
  }, [history, tenantId, userType]);

  const onFormValueChange = async (form) => {
    if (Object.keys(form?.searchForm)?.length > 0) {
      const tenantId = window?.Digit.ULBService.getStateId();
      const entityType = "Order";
      const caseTitle = form?.searchForm?.caseTitle;
      const status = form?.searchForm?.status;
      const startOfTheDay = form?.searchForm?.startOfTheDay;
      const moduleSearchCriteria = {
        entityType,
        tenantId,
        ...(caseTitle && { caseTitle }),
        status: status?.type,
        ...(startOfTheDay && {
          startOfTheDay: new Date(startOfTheDay + "T00:00:00").getTime(),
          endOfTheDay: new Date(startOfTheDay + "T23:59:59.999").getTime(),
        }),
        ...(courtId && { courtId }),
      };
      await HomeService.customApiService(bulkESignOrderConfig?.apiDetails?.serviceName, {
        inbox: {
          limit: form?.tableForm?.limit,
          offset: form?.tableForm?.offset,
          tenantId: tenantId,
          moduleSearchCriteria: moduleSearchCriteria,
          processSearchCriteria: {
            businessService: ["notification"],
            moduleName: "Transformer service",
          },
        },
      }).then((response) => {
        const updatedData = response?.items
          ?.filter((data) => data?.businessObject?.orderNotification?.status === OrderWorkflowState.PENDING_BULK_E_SIGN)
          ?.map((item) => {
            return {
              ...item,
              isSelected: true,
            };
          });
        setBulkSignList(updatedData);
      });
    }
  };

  const handleDeleteOrder = async (action) => {
    setIsDeleteOrderLoading(true);
    try {
      await ordersService
        .updateOrder(
          {
            order: {
              ...orderDetails,
              workflow: { ...orderDetails?.workflow, action, documents: [{}] },
            },
          },
          { tenantId }
        )
        .then(async () => {
          setTimeout(() => {
            setIsDeleteOrderLoading(false);
            setShowOrderDeleteModal(false);
            history.goBack();
          }, 2000);
        });
    } catch (e) {
      setShowErrorToast({ label: t("FAILED_TO_REMOVE_ORDER_FROM_BULK_LIST"), error: true });
      setIsDeleteOrderLoading(false);
      console.error("Failed to remove the order from bulk list", e?.message);
    }
  };

  const fetchResponseFromXmlRequest = async (orderRequestList) => {
    const responses = [];

    const requests = orderRequestList?.map(async (order) => {
      try {
        // URL encoding the XML request
        const formData = qs.stringify({ response: order?.request });
        const response = await axios.post(bulkSignUrl, formData, {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          },
        });

        const data = response?.data;

        if (parseXml(data, "status") !== "failed") {
          responses.push({
            orderNumber: order?.orderNumber,
            signedOrderData: parseXml(data, "data"),
            signed: true,
            errorMsg: null,
            tenantId: tenantId,
          });
        } else {
          responses.push({
            orderNumber: order?.orderNumber,
            signedOrderData: parseXml(data, "data"),
            signed: false,
            errorMsg: parseXml(data, "error"),
            tenantId: tenantId,
          });
        }
      } catch (error) {
        console.error(`Error fetching order ${order?.orderNumber}:`, error?.message);
      }
    });

    await Promise.allSettled(requests);
    return responses;
  };

  const handleBulkSign = async () => {
    setShowBulkSignConfirmModal(false);
    setIsLoading(true);
    const criteriaList = bulkSignList
      ?.filter((data) => data?.isSelected)
      ?.map((order) => {
        return {
          fileStoreId: order?.businessObject?.orderNotification?.documents?.find((doc) => doc?.documentType === "UNSIGNED")?.fileStore || "",
          orderNumber: order?.businessObject?.orderNotification?.id,
          placeholder: order?.businessObject?.orderNotification?.type === "COMPOSITE" ? "Fduy44hjb" : "Signature",
          tenantId: tenantId,
        };
      });
    try {
      const response = await orderManagementService.getOrdersToSign(
        {
          criteria: criteriaList,
        },
        {}
      );
      await fetchResponseFromXmlRequest(response?.orderList).then(async (responseArray) => {
        const updateOrderResponse = await orderManagementService.updateSignedOrders(
          {
            signedOrders: responseArray,
          },
          {}
        );
        history.replace(`/${window?.contextPath}/${userType}/home/home-pending-task`, {
          bulkSignSuccess: {
            show: true,
            bulkSignOrderListLength: updateOrderResponse?.orders?.length,
          },
        });
      });
    } catch (e) {
      setShowErrorToast({ label: t("FAILED_TO_PERFORM_BULK_SIGN"), error: true });
      console.error("Failed to perform bulk sign", e?.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <React.Fragment>
      {isLoading ? (
        <Loader />
      ) : (
        <React.Fragment>
          <ProjectBreadCrumb location={window.location} />
          <div className={"bulk-esign-order-view"}>
            <div className="header">{t("BULK_SIGN_ORDERS")}</div>
            <InboxSearchComposer customStyle={sectionsParentStyle} configs={config} onFormValueChange={onFormValueChange}></InboxSearchComposer>{" "}
          </div>
          <ActionBar className={"e-filing-action-bar"} style={{ justifyContent: "space-between" }}>
            <div style={{ width: "fit-content", display: "flex", gap: 20 }}>
              <SubmitBar
                label={t("SIGN_SELECTED_ORDERS")}
                submit="submit"
                disabled={!bulkSignList || bulkSignList?.length === 0 || bulkSignList?.every((item) => !item?.isSelected)}
                onSubmit={() => setShowBulkSignConfirmModal(true)}
              />
            </div>
          </ActionBar>
        </React.Fragment>
      )}
      {showBulkSignAllModal && <OrderBulkReviewModal t={t} history={history} orderDetails={orderDetails} />}
      {showOrderDeleteModal && (
        <Modal
          headerBarMain={<Heading label={t("CONFIRM_BULK_DELETE")} />}
          headerBarEnd={<CloseBtn onClick={() => !isDeleteOrderLoading && history.goBack()} />}
          actionCancelLabel={t("CS_BULK_CANCEL")}
          actionCancelOnSubmit={() => history.goBack()}
          actionSaveLabel={t("CS_BULK_DELETE")}
          actionSaveOnSubmit={() => handleDeleteOrder(OrderWorkflowAction.DELETE)}
          style={{ height: "40px", background: "#BB2C2F" }}
          popupStyles={{ width: "35%" }}
          className={"review-order-modal"}
          isDisabled={isDeleteOrderLoading}
          isBackButtonDisabled={isDeleteOrderLoading}
          children={
            isDeleteOrderLoading ? (
              <Loader />
            ) : (
              <div className="delete-warning-text">
                <h3 style={{ margin: "12px 24px" }}>{t("CONFIRM_BULK_DELETE_TEXT")}</h3>
              </div>
            )
          }
        />
      )}
      {showBulkSignConfirmModal && (
        <Modal
          headerBarMain={<Heading label={t("CONFIRM_BULK_SIGN")} />}
          headerBarEnd={<CloseBtn onClick={() => setShowBulkSignConfirmModal(false)} />}
          actionCancelLabel={t("CS_BULK_BACK")}
          actionCancelOnSubmit={() => setShowBulkSignConfirmModal(false)}
          actionSaveLabel={t("CS_BULK_SIGN_AND_PUBLISH")}
          actionSaveOnSubmit={() => handleBulkSign()}
          style={{ height: "40px", background: "#007E7E" }}
          popupStyles={{ width: "35%" }}
          className={"review-order-modal"}
          children={
            <div className="delete-warning-text">
              <h3 style={{ margin: "12px 24px" }}>{t("CONFIRM_BULK_SIGN_TEXT")}</h3>
            </div>
          }
        />
      )}
      {showErrorToast && <Toast error={showErrorToast?.error} label={showErrorToast?.label} isDleteBtn={true} onClose={closeToast} />}
    </React.Fragment>
  );
}

export default BulkESignView;
