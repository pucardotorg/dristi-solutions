import { InboxSearchComposer } from "@egovernments/digit-ui-react-components";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { offlinePaymentsConfig } from "../../configs/OfflinePaymentsConfig";
import { DRISTIService } from "@egovernments/digit-ui-module-dristi/src/services";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";

const sectionsParentStyle = {
  height: "50%",
  display: "flex",
  flexDirection: "column",
  gridTemplateColumns: "20% 1fr",
  gap: "1rem",
};

function OfflinePaymentsHomeTab() {
  const { t } = useTranslation();
  const [config, setConfig] = useState(offlinePaymentsConfig?.TabSearchConfig?.[0]);
  const [tabData, setTabData] = useState(
    offlinePaymentsConfig?.TabSearchConfig?.map((configItem, index) => ({
      key: index,
      label: configItem.label,
      active: index === 0 ? true : false,
    }))
  );
  const userInfo = window?.Digit?.UserService?.getUser()?.info;
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo]);
  const roles = useMemo(() => userInfo?.roles, [userInfo]);
  const isEpostUser = useMemo(() => roles?.some((role) => role?.code === "POST_MANAGER"), [roles]);

  let homePath = `/${window?.contextPath}/${userType}/home/home-pending-task`;
  if (!isEpostUser && userType === "employee") homePath = `/${window?.contextPath}/${userType}/home/home-screen`;

  const tenantId = useMemo(() => window?.Digit.ULBService.getCurrentTenantId(), []);

  const getTotalCountForTab = useCallback(
    async function (tabConfig) {
      const updatedTabData = await Promise.all(
        tabConfig?.TabSearchConfig?.map(async (configItem, index) => {
          const response = await DRISTIService.customApiService(configItem?.apiDetails?.serviceName, {
            inbox: {
              tenantId,
              processSearchCriteria: {
                ...configItem?.apiDetails?.requestBody?.inbox?.processSearchCriteria,
                tenantId,
              },
              moduleSearchCriteria: {
                ...configItem?.apiDetails?.requestBody?.inbox?.moduleSearchCriteria,
                tenantId,
              },
              offset: 0,
              limit: 1,
            },
          });
          const totalCount = response?.totalCount;
          return {
            key: index,
            label: totalCount ? `${t(configItem.label)} (${totalCount})` : `${t(configItem.label)} (0)`,
            active: index === 0 ? true : false,
          };
        }) || []
      );
      setTabData(updatedTabData);
    },
    [tenantId, t]
  );

  useEffect(() => {
    getTotalCountForTab(offlinePaymentsConfig);
  }, [getTotalCountForTab, tenantId]);

  const onTabChange = (n) => {
    setTabData((prev) => prev.map((i, c) => ({ ...i, active: c === n ? true : false })));
    setConfig(offlinePaymentsConfig?.TabSearchConfig?.[n]);
  };

  return (
    <React.Fragment>
      <div className="home-screen-wrapper payment-inbox" style={{ minHeight: "calc(100vh - 90px)", width: "100%" }}>
        <div className={"bulk-esign-order-view offlinePayments-home-tab"}>
          <div className="header" style={{ paddingLeft: "0px", paddingBottom: "24px" }}>
            {t("COLLECT_OFFLINE_PAYMENTS")}
          </div>
          <InboxSearchComposer
            customStyle={sectionsParentStyle}
            configs={config}
            showTab={true}
            tabData={tabData}
            onTabChange={onTabChange}
          ></InboxSearchComposer>
        </div>
      </div>
    </React.Fragment>
  );
}

export default OfflinePaymentsHomeTab;
