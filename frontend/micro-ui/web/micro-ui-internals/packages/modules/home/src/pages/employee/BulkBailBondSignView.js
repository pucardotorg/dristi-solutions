import { ActionBar, Toast, CloseSvg, InboxSearchComposer, SubmitBar, Loader } from "@egovernments/digit-ui-react-components";
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { bulkBailBondSignConfig } from "../../configs/BulkBailBondSignConfig";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import { orderManagementService } from "@egovernments/digit-ui-module-orders/src/hooks/services";
import { OrderWorkflowAction } from "@egovernments/digit-ui-module-dristi/src/Utils/orderWorkflow";
import axios from "axios";
import { HomeService } from "../../hooks/services";
import { BailBondSignModal } from "./BailBondSignModal";

const sectionsParentStyle = {
  height: "50%",
  display: "flex",
  flexDirection: "column",
  gridTemplateColumns: "20% 1fr",
  gap: "1rem",
};

function BulkBailBondSignView() {
  const { t } = useTranslation();
  const tenantId = window?.Digit.ULBService.getStateId();
  const history = useHistory();
  const userInfo = Digit.UserService.getUser()?.info;
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo?.type]);
  const searchComposerRef = useRef(null);

  const [bulkSignList, setBulkSignList] = useState(null);
  const [showOrderDeleteModal, setShowOrderDeleteModal] = useState(false);
  const [showBulkSignConfirmModal, setShowBulkSignConfirmModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteOrderLoading, setIsDeleteOrderLoading] = useState(false);

  const [showErrorToast, setShowErrorToast] = useState(null);
  const { orderNumber, deleteBailBond } = Digit.Hooks.useQueryParams();

  const initialFormState = {};

  const onSearchFormReset = () => {
    // Reset form logic if needed
  };

  const bulkSignUrl = window?.globalConfigs?.getConfig("BULK_SIGN_URL") || "http://localhost:1620";
  const courtId = localStorage.getItem("courtId");
  const roles = useMemo(() => userInfo?.roles, [userInfo]);

  const isJudge = useMemo(() => roles?.some((role) => role.code === "CASE_APPROVER"), [roles]);
  const isBenchClerk = useMemo(() => roles?.some((role) => role.code === "BENCH_CLERK"), [roles]);
  const isTypist = useMemo(() => roles?.some((role) => role.code === "TYPIST_ROLE"), [roles]);
  let homePath = `/${window?.contextPath}/${userType}/home/home-pending-task`;
  if (isJudge || isTypist || isBenchClerk) homePath = `/${window?.contextPath}/${userType}/home/home-screen`;

  useEffect(() => {
    console.log(bulkSignList, "bulkSignList");
  }, [bulkSignList]);

  const config = useMemo(() => {
    const setOrderFunc = (order) => {
      if (bulkSignList && bulkSignList.length > 0) {
        const existingOrder = bulkSignList.find(
          (item) => item?.businessObject?.orderNotification?.id === order?.businessObject?.orderNotification?.id
        );
        if (existingOrder) {
          const updatedList = bulkSignList.map((item) => {
            if (item?.businessObject?.orderNotification?.id === order?.businessObject?.orderNotification?.id) {
              return { ...item, ...order };
            }
            return item;
          });
          setBulkSignList(updatedList);
        } else {
          setBulkSignList([...bulkSignList, { ...order, isSelected: false }]);
        }
      } else {
        setBulkSignList([{ ...order, isSelected: false }]);
      }
    };

    const updateOrderFunc = (orderData, checked) => {
      debugger;
      // let orderListUpdate = [];
      // if (bulkSignList && bulkSignList.length > 0) {
      //   orderListUpdate = [...bulkSignList];
      //   const index = orderListUpdate.findIndex(
      //     (item) => item?.businessObject?.orderNotification?.id === orderData?.businessObject?.orderNotification?.id
      //   );
      //   if (index !== -1) {
      //     orderListUpdate[index] = { ...orderData, isSelected: checked };
      //   }
      // } else {
      //   orderListUpdate.push({ ...orderData, isSelected: checked });
      // }
      // setBulkSignList(orderListUpdate);
      setBulkSignList((prev) => {
        return prev?.map((item, i) => {
          debugger;
          if (item?.businessObject?.orderNotification?.id !== orderData?.businessObject?.orderNotification?.id) return item;

          return {
            ...item,
            isSelected: checked,
          };
        });
      });
    };
    return {
      ...bulkBailBondSignConfig,
      sections: {
        ...bulkBailBondSignConfig.sections,
        searchResult: {
          ...bulkBailBondSignConfig.sections.searchResult,
          uiConfig: {
            ...bulkBailBondSignConfig.sections.searchResult.uiConfig,
            columns: bulkBailBondSignConfig.sections.searchResult.uiConfig.columns.map((column) => {
              return column.label === "SELECT"
                ? {
                    ...column,
                    updateOrderFunc: updateOrderFunc,
                  }
                : column.label === "CASE_NAME_AND_NUMBER"
                ? {
                    ...column,
                    clickFunc: setOrderFunc,
                  }
                : column;
            }),
          },
        },
      },
      additionalDetails: {
        setBulkSignList: setBulkSignList,
      },
    };
  }, [t, isJudge]);

  useEffect(() => {
    if (deleteBailBond) {
      setShowOrderDeleteModal(true);
    } else {
      setShowOrderDeleteModal(false);
    }
  }, [deleteBailBond]);

  const closeToast = () => {
    setShowErrorToast(null);
  };

  BulkBailBondSignView.Heading = (props) => <span className="heading-m">{props.label}</span>;

  BulkBailBondSignView.CloseBtn = (props) => (
    <div onClick={props.onClick}>
      <span className="icon-circle">
        <CloseSvg />
      </span>{" "}
    </div>
  );

  BulkBailBondSignView.closeToast = () => {
    setShowErrorToast(null);
  };

  const deleteOrderFunc = (data) => {
    setShowOrderDeleteModal(false);
    history.goBack();
  };

  const { Heading, CloseBtn } = BulkBailBondSignView;

  const handleDeleteOrder = async (action) => {
    try {
      setIsDeleteOrderLoading(true);
      const response = await orderManagementService.deleteOrder({
        id: deleteBailBond,
      });

      if (response) {
        history.replace(homePath, {
          bulkDeleteSuccess: {
            show: true,
            label: t("ORDER_DELETE_SUCCESS"),
          },
        });
      }
    } catch (error) {
      setShowErrorToast({ label: t("ORDER_DELETE_FAIL"), error: true });
      console.log("Failed to delete order:", error);
      history.goBack();
    } finally {
      setIsDeleteOrderLoading(false);
    }
  };

  const fetchResponseFromXmlRequest = async (orderRequestList) => {
    setIsLoading(true);
    return new Promise((resolve, reject) => {
      const requestIds = [];
      orderRequestList.forEach((data) => {
        requestIds.push({ requestId: data.requestId });
      });

      const checkStatus = (idsToCheck) => {
        const requestIds = idsToCheck.map((data) => data.requestId);
        axios
          .get(`${bulkSignUrl}/resource/sign-status?ids=${requestIds.join(",")}`)
          .then((statusResponse) => {
            if (statusResponse.data.every((status) => status.status === "SIGNED" || status.status === "FAILED")) {
              // All requests have completed (either SIGNED or FAILED)
              resolve(statusResponse.data);
            } else {
              // Some requests are still processing
              setTimeout(() => checkStatus(idsToCheck), 2000); // Check again after 2 seconds
            }
          })
          .catch((error) => {
            console.error("Error checking status:", error);
            reject(error);
          });
      };

      // Start the status polling
      checkStatus(requestIds);
    });
  };

  const handleBulkSign = async () => {
    setShowBulkSignConfirmModal(false);
    setIsLoading(true);
    const selectedOrders = bulkSignList?.filter((item) => item?.isSelected);

    if (!selectedOrders || selectedOrders.length === 0) {
      setShowErrorToast({ label: t("NO_ORDERS_SELECTED_FOR_BULK_SIGN"), error: true });
      setIsLoading(false);
      return;
    }

    const criteriaList =
      selectedOrders?.map((item) => {
        const { id } = item?.businessObject?.orderNotification || {};
        return {
          id: id,
          entityType: "BailBond",
          tenantId: tenantId,
        };
      }) || [];

    try {
      const response = await HomeService.getBailBondsToSign(
        {
          criteria: criteriaList,
        },
        {}
      );

      await fetchResponseFromXmlRequest(response?.bailBondList).then(async (responseArray) => {
        const updateSignedResponse = await HomeService.updateSignedBailBonds(
          {
            signedBailBonds: responseArray,
          },
          {}
        );
        history.replace(homePath, {
          bulkSignSuccess: {
            show: true,
            bulkSignBailBondListLength: updateSignedResponse?.bailBonds?.length,
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

  const handleSigningComplete = () => {
    // Refresh the data after successful signing
    if (searchComposerRef.current) {
      searchComposerRef.current.refresh();
    }
  };

  const tableCustomization = {
    "businessObject.orderNotification.id": {
      customComponent: (props) => {
        const documentId = props.rowData?.businessObject?.orderNotification?.id;
        if (!documentId) return <React.Fragment />;
        return <BailBondSignModal rowData={props.rowData} colData={props.colData} value={props.value} onSigningComplete={handleSigningComplete} />;
      },
    },
  };
  console.log("bulkSignList", bulkSignList);

  return (
    <React.Fragment>
      {isLoading ? (
        <Loader />
      ) : (
        <React.Fragment>
          <div className={"bulk-esign-order-view"}>
            <div className="header">{t("BULK_SIGN_BAIL_BONDS")}</div>
            <InboxSearchComposer
              ref={searchComposerRef}
              configs={config}
              // onFormValueChange={onFormValueChange}
              onSearchFormReset={onSearchFormReset}
              defaultValues={initialFormState}
              // showBulkActions={false}
              // tableCustomization={tableCustomization}
              customStyle={sectionsParentStyle}
            />
          </div>
          {isJudge && (
            <ActionBar className={"e-filing-action-bar"} style={{ justifyContent: "space-between" }}>
              <div style={{ width: "fit-content", display: "flex", gap: 20 }}>
                <SubmitBar
                  label={t("SIGN_SELECTED_BAIL_BONDS")}
                  submit="submit"
                  disabled={!bulkSignList || bulkSignList?.length === 0 || bulkSignList?.every((item) => !item?.isSelected)}
                  onSubmit={() => setShowBulkSignConfirmModal(true)}
                />
              </div>
            </ActionBar>
          )}
        </React.Fragment>
      )}
      {/* {showBulkSignAllModal && <BailBondBulkReviewModal t={t} history={history} bailBondDetails={bulkSignList} />} */}
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

export default BulkBailBondSignView;
