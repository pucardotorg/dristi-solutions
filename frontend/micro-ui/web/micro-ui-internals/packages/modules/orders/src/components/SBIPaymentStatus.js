import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Banner } from "@egovernments/digit-ui-react-components";
import { Button, InfoCard } from "@egovernments/digit-ui-components";
import CustomCopyTextDiv from "@egovernments/digit-ui-module-dristi/src/components/CustomCopyTextDiv";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";

const getStatusMessage = (status) => {
  switch (status) {
    case "FAIL":
      return "CS_PAYMENT_FAILED";
    case "PENDING":
      return "CS_PAYMENT_PENDING";
    case "ERROR":
      return "CS_ERROR";
    default:
      return "Payment Successful";
  }
};

const getPaymentDueMessage = (status, amount) => {
  if (status === "ERROR") {
    return "Something Went Wrong";
  } else {
    return `You have a payment due ${amount || "Rs 11/-"}. `;
  }
};

const SBIPaymentStatus = ({ path }) => {
  const location = useLocation();
  const { t } = useTranslation();
  const status = location.state.state.status;
  const { state } = useLocation();
  const fileStoreId = location.state.state.fileStoreId;
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const caseId = location.state.state.caseId;
  const receiptData = location.state.state.receiptData;
  const amount = location.state.state.amount;

  const history = useHistory();
  const userInfo = Digit?.UserService?.getUser()?.info;
  const hasCitizenRoute = useMemo(() => path?.includes(`/${window?.contextPath}/citizen`), [path]);
  const isCitizen = useMemo(() => Boolean(Digit?.UserService?.getUser()?.info?.type === "CITIZEN"), [Digit]);

  const commonProps = {
    whichSvg: status === "SUCCESS" ? "tick" : null,
    headerStyles: { fontSize: "32px" },
    style: { minWidth: "100%", marginTop: "10px" },
  };

  const bannerProps = {
    ...commonProps,
    successful: status === "SUCCESS",
    message: t(getStatusMessage(status)),
  };

  if (isCitizen && !hasCitizenRoute && Boolean(userInfo)) {
    history.push(`/${window?.contextPath}/citizen/home/home-pending-task`);
  } else if (!isCitizen && hasCitizenRoute && Boolean(userInfo)) {
    history.push(`/${window?.contextPath}/employee/home/home-pending-task`);
  }

  return (
    <div className="user-registration">
      <div className="e-filing-payment" style={{ minHeight: "100%", height: "100%" }}>
        <Banner
          successful={status === "SUCCESS"}
          message={status === "SUCCESS" ? "Payment Successful" : getStatusMessage(status)}
          info={`${state?.showID ? t("SUBMISSION_ID") : ""}`}
          whichSvg={status === "SUCCESS" ? "tick" : null}
          {...bannerProps}
        />
        {status === "SUCCESS" ? (
          <div>
            <CustomCopyTextDiv
              t={t}
              keyStyle={{ margin: "8px 0px" }}
              valueStyle={{ margin: "8px 0px", fontWeight: 700 }}
              data={receiptData?.caseInfo}
              tableDataClassName={"e-filing-table-data-style"}
              tableValueClassName={"e-filing-table-value-style"}
            />
          </div>
        ) : (
          <InfoCard
            className="payment-status-info-card"
            headerWrapperClassName="payment-status-info-header"
            populators={{
              name: "infocard",
            }}
            variant="default"
            text={getPaymentDueMessage(status, amount)}
            label={"Note"}
            style={{ marginTop: "1.5rem" }}
            textStyle={{
              color: "#3D3C3C",
              margin: "0.5rem 0",
            }}
          />
        )}
        <div className="button-field" style={{ width: "100%", marginTop: 16 }}>
          {!fileStoreId && caseId ? (
            <Button
              variation={"secondary"}
              className={"secondary-button-selector"}
              label={t("Retry Payment")}
              labelClassName={"secondary-label-selector"}
              onClick={() => {
                history.goBack();
              }}
            />
          ) : (
            <Button
              variation={"secondary"}
              className={"secondary-button-selector"}
              label={t("CS_PRINT_RECEIPT")}
              labelClassName={"secondary-label-selector"}
              isDisabled={true}
              onButtonClick={() => {
                // To Do: implement generate pdf functionality when backend support is ready.
              }}
            />
          )}

          <Button
            className={"tertiary-button-selector"}
            label={t("CS_GO_TO_HOME")}
            labelClassName={"tertiary-label-selector"}
            onClick={() => {
              history.replace(`/${window?.contextPath}/citizen/home/home-pending-task`);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SBIPaymentStatus;
