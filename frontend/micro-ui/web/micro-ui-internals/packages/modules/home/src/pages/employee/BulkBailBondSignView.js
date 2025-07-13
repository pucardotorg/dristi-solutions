import { ActionBar, Toast, CloseSvg, InboxSearchComposer, SubmitBar, Loader } from "@egovernments/digit-ui-react-components";
import React, { useEffect, useMemo, useState, useRef, useCallback, memo } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { bulkBailBondSignConfig } from "../../configs/BulkBailBondSignConfig";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import { OrderWorkflowAction } from "@egovernments/digit-ui-module-dristi/src/Utils/orderWorkflow";
import axios from "axios";
import { BailBondSignModal, clearBailBondSessionData } from "./BailBondSignModal";
import { set } from "lodash";

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
  const [selectedBailBond, setSelectedBailBond] = useState(
    sessionStorage.getItem("bulkBailBondSignSelectedItem") ? JSON.parse(sessionStorage.getItem("bulkBailBondSignSelectedItem")) : null
  );
  const [showBulkSignModal, setShowBulkSignModal] = useState(sessionStorage.getItem("bulkBailBondSignSelectedItem") ? true : false);
  const [bailBondPaginationData, setBailBondPaginationData] = useState({});

  const { deleteBailBond } = Digit.Hooks.useQueryParams();

  const initialFormState = {};

  const onSearchFormReset = useCallback(() => {
    // Reset form logic if needed
  }, []);

  const bulkSignUrl = window?.globalConfigs?.getConfig("BULK_SIGN_URL") || "http://localhost:1620";
  const courtId = localStorage.getItem("courtId");
  const roles = useMemo(() => userInfo?.roles, [userInfo]);

  const isJudge = useMemo(() => roles?.some((role) => role.code === "CASE_APPROVER"), [roles]);
  const isBenchClerk = useMemo(() => roles?.some((role) => role.code === "BENCH_CLERK"), [roles]);
  const isTypist = useMemo(() => roles?.some((role) => role.code === "TYPIST_ROLE"), [roles]);
  let homePath = `/${window?.contextPath}/${userType}/home/home-pending-task`;
  if (isJudge || isTypist || isBenchClerk) homePath = `/${window?.contextPath}/${userType}/home/home-screen`;

  const config = useMemo(() => {
    const setOrderFunc = async (order) => {
      setShowBulkSignModal(true);
      setSelectedBailBond(order);
    };

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
    return {
      ...bulkBailBondSignConfig,
      sections: {
        ...bulkBailBondSignConfig.sections,
        searchResult: {
          ...bulkBailBondSignConfig.sections.searchResult,
          uiConfig: {
            ...bulkBailBondSignConfig.sections.searchResult.uiConfig,
            columns: bulkBailBondSignConfig.sections.searchResult.uiConfig.columns.map((column) => {
              if (column.label === "SELECT") {
                return {
                  ...column,
                  updateOrderFunc: updateOrderFunc,
                };
              } else if (column.label === "CASE_NAME_AND_NUMBER") {
                return {
                  ...column,
                  clickFunc: setOrderFunc,
                };
              } else {
                return column;
              }
            }),
          },
        },
      },
      additionalDetails: {
        setbulkBailBondSignList: setBulkSignList,
        setBailBondPaginationData: setBailBondPaginationData,
      },
    };
  }, []);

  useEffect(() => {
    if (deleteBailBond) {
      setShowOrderDeleteModal(true);
    } else {
      setShowOrderDeleteModal(false);
    }
  }, [deleteBailBond]);

  const closeToast = useCallback(() => {
    setShowErrorToast(null);
  }, []);

  const Heading = useCallback((props) => <span className="heading-m">{props.label}</span>, []);

  const CloseBtn = useCallback(
    (props) => (
      <div onClick={props.onClick}>
        <span className="icon-circle">
          <CloseSvg />
        </span>{" "}
      </div>
    ),
    []
  );

  const handleDeleteOrder = useCallback(
    async (action) => {
      try {
        setIsDeleteOrderLoading(true);
        const response = await axios.post(
          `${window?.globalConfigs?.getConfig("ORDER_MANAGEMENT_URL")}/order/delete`,
          { id: deleteBailBond },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${sessionStorage.getItem("Digit.citizen.token") || sessionStorage.getItem("Digit.employee.token")}`,
              courtId: courtId || "",
              tenantId: tenantId || "",
            },
          }
        );

        if (response) {
          history.replace(homePath, {
            bulkDeleteSuccess: {
              show: true,
              label: t("ORDER_DELETE_SUCCESS"),
            },
          });
        }
      } catch (error) {
        setShowErrorToast({ label: t("FAILED_TO_DELETE_ORDER"), error: true });
        history.goBack();
      } finally {
        setIsDeleteOrderLoading(false);
      }
    },
    [deleteBailBond, homePath, history, t, courtId, tenantId]
  );

  const handleBulkSign = useCallback(async () => {
    try {
      const xmlReqIds = [];
      setIsLoading(true);

      if (bulkSignList && bulkSignList.length > 0) {
        const selectedBulkSignList = bulkSignList?.filter((item) => item?.isSelected);

        if (selectedBulkSignList?.length > 0) {
          const orderRequestList = selectedBulkSignList?.map((item) => {
            const id = item?.businessObject?.orderNotification?.id;
            xmlReqIds.push(id);
            return { id };
          });

          const bulkSignReqData = {
            orderRequestList,
          };

          if (bulkSignReqData.orderRequestList.length > 0) {
            sessionStorage.setItem(
              "bulkBailBondSelectedItems",
              JSON.stringify(selectedBulkSignList.map((item) => item?.businessObject?.orderNotification?.id))
            );

            const bulkAPIRes = await axios.post(`${bulkSignUrl}/bulk/api/orders/getOrderList`, bulkSignReqData, {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${sessionStorage.getItem("Digit.citizen.token") || sessionStorage.getItem("Digit.employee.token")}`,
                courtId: courtId || "",
                tenantId: tenantId || "",
              },
            });

            if (bulkAPIRes?.status === 200 && bulkAPIRes?.data?.status === "successful") {
              window.location.href = `${bulkSignUrl}?successURL=${window.location.origin}/${window.contextPath}/employee/home/BulkBailBondSignView`;
            } else {
              setShowErrorToast({
                error: true,
                label: bulkAPIRes?.data?.error?.message ? bulkAPIRes?.data?.error?.message : t("ERROR_BAIL_BULK_SIGN_MSG"),
              });
              setShowBulkSignConfirmModal(false);
            }
          }
        }
      }
    } catch (error) {
      setShowErrorToast({
        error: true,
        label: error?.message ? error?.message : t("ERROR_BAIL_BULK_SIGN_MSG"),
      });
      setShowBulkSignConfirmModal(false);
    } finally {
      setIsLoading(false);
    }
  }, [bulkSignList, tenantId, courtId, bulkSignUrl, t]);

  const handleSigningComplete = useCallback(() => {
    // Refresh the data after successful signing
    if (searchComposerRef.current) {
      searchComposerRef.current.refresh();
    }
    // Clear any bail bond session data that might remain
    clearBailBondSessionData();
  }, []);

  const MemoInboxSearchComposer = useMemo(() => {
    return (
      <InboxSearchComposer pageSizeLimit={sessionStorage.getItem("bulkBailBondSignlimit") || 10} configs={config} customStyle={sectionsParentStyle} />
    );
  }, [config]);

  return (
    <React.Fragment>
      {isLoading ? (
        <Loader />
      ) : (
        <React.Fragment>
          <div className={"bulk-esign-order-view"} style={{ padding: 0 }}>
            {MemoInboxSearchComposer}
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
      {showBulkSignModal && (
        <BailBondSignModal
          selectedBailBond={selectedBailBond}
          setShowBulkSignModal={setShowBulkSignModal}
          onSigningComplete={handleSigningComplete}
          bailBondPaginationData={bailBondPaginationData}
        />
      )}
      {showErrorToast && <Toast error={showErrorToast?.error} label={showErrorToast?.label} isDleteBtn={true} onClose={closeToast} />}
    </React.Fragment>
  );
}

export default BulkBailBondSignView;
