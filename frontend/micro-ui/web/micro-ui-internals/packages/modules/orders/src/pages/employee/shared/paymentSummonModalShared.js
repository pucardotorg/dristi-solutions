import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RadioButtons, CardLabel, LabelFieldPair } from "@egovernments/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { InfoCard } from "@egovernments/digit-ui-components";
import { DRISTIService } from "@egovernments/digit-ui-module-dristi/src/services";
import ApplicationInfoComponent from "../../../components/ApplicationInfoComponent";
import ButtonSelector from "@egovernments/digit-ui-module-dristi/src/components/ButtonSelector";
import { getAdvocates } from "../../../utils/caseUtils";
import { ORDER_TYPES } from "../../../utils/constants";

/**
 * Shared helpers for summon/notice payment modals (RPAD, post, SMS/email).
 * Extract-only — bill, lock, and redirect logic stay in each modal file.
 */

/** Same string built in both PaymentForRPADModal and PaymentForSummonModal `infos`. */
export const formatRespondentAddressLine = (addressDetails) => {
  if (typeof addressDetails !== "object") return addressDetails;
  return `${addressDetails?.locality || ""}, ${addressDetails?.city || ""}, ${addressDetails?.district || ""}, ${addressDetails?.state || ""}, ${
    addressDetails?.pincode || ""
  }`;
};

export const useIsUserAdvocateOnCase = (caseDetails, authorizedUuid) => {
  const allAdvocates = useMemo(() => getAdvocates(caseDetails), [caseDetails]);
  const advocatesUuids = useMemo(() => {
    if (allAdvocates && typeof allAdvocates === "object") {
      return Object.values(allAdvocates).flat();
    }
    return [];
  }, [allAdvocates]);
  return useMemo(() => advocatesUuids.includes(authorizedUuid), [advocatesUuids, authorizedUuid]);
};

/**
 * Mirrors the original inline `fetchCaseLockStatus` + `useEffect` pair in both modals
 * (including `useCallback` with no dependency list) to avoid any behavior drift.
 */
export const useCaseLockStatusForPaymentModal = (caseDetails, tenantId, t, setIsCaseLocked, setShowToast) => {
  const fetchCaseLockStatus = useCallback(async () => {
    try {
      const status = await DRISTIService.getCaseLockStatus(
        {},
        {
          uniqueId: caseDetails?.filingNumber,
          tenantId: tenantId,
        }
      );
      setIsCaseLocked(status?.Lock?.isLocked);
    } catch (error) {
      console.error("Error fetching case lock status", error);
      const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
      setShowToast({ label: t("ERROR_FETCHING_CASE_LOCK_STATUS"), error: true, errorId });
    }
  });
  useEffect(() => {
    if (caseDetails?.filingNumber) {
      fetchCaseLockStatus();
    }
  }, [caseDetails?.filingNumber]);
};

/** Same display string as the legacy inline helper in RPAD / post-payment summon modals (15 days ahead, short month name). */
export const getPaymentModalDeliveryNoteDeadlineFormatted = () => {
  const today = new Date();
  today.setDate(today.getDate() + 15);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dd = String(today.getDate()).padStart(2, "0");
  const mm = monthNames[today.getMonth()];
  const yyyy = today.getFullYear();
  return `${dd} ${mm} ${yyyy}`;
};

/** Same history.push target as both modals' "View order" link. */
export const getViewOrderClickHandler = ({ history, caseData, filingNumber }) => () => {
  history.push(
    `/${window.contextPath}/citizen/dristi/home/view-case?caseId=${caseData?.criteria?.[0]?.responseList?.[0]?.id}&filingNumber=${filingNumber}&tab=Orders`
  );
};

/** RPAD vs E-Post: tooltip-heavy offline copy vs simple + PAYMENT_COMPLETED branch. */
const OFFLINE_HELP_VARIANT = {
  RPAD_TOOLTIPS: "rpad-tooltips",
  EPOST_SIMPLE: "epost-simple",
};

/**
 * Shared body for PaymentForRPADModal and PaymentForSummonModal (post).
 */
export const PaymentSummonFeeSelectionComponent = ({
  infos,
  links,
  feeOptions,
  orderType,
  isUserAdv,
  isCaseLocked = false,
  payOnlineButtonTitle = null,
  paymentLoader,
  modeOptions,
  modeSelectionLabelKey,
  showOfflinePaymentInfoCardLabel,
  offlineHelpVariant,
}) => {
  const { t } = useTranslation();
  const CustomErrorTooltip = window?.Digit?.ComponentRegistryService?.getComponent("CustomErrorTooltip");

  const [selectedOption, setSelectedOption] = useState(modeOptions[0]);

  const renderPaymentActionCell = (action, index) => {
    if (index === 0) {
      return t(action?.action);
    }
    if (offlineHelpVariant === OFFLINE_HELP_VARIANT.EPOST_SIMPLE && action?.isCompleted) {
      return <p style={{ color: "green" }}>{t("PAYMENT_COMPLETED")}</p>;
    }
    if (action?.action !== "offline-process") {
      return (
        <ButtonSelector
          style={{ border: "1px solid" }}
          label={t(action.action)}
          onSubmit={action.onClick}
          isDisabled={paymentLoader || isCaseLocked}
          title={isCaseLocked ? t(payOnlineButtonTitle) : ""}
          textStyles={{ margin: "0px" }}
        />
      );
    }
    if (offlineHelpVariant === OFFLINE_HELP_VARIANT.RPAD_TOOLTIPS) {
      return (
        <p className="offline-process-text">
          {t("THIS_OFFLINE_TEXT")}
          <span className="learn-more-text">
            {t("LEARN_MORE")}
            <p className="text-tooltip">{orderType === ORDER_TYPES.SUMMONS ? t("SUMMONS_LEARN_MORE") : t("NOTICE_LEARN_MORE")}</p>
          </span>
        </p>
      );
    }
    return (
      <p className="offline-process-text">
        {t("THIS_OFFLINE_TEXT")} <span className="learn-more-text">{t("LEARN_MORE")}</span>
      </p>
    );
  };

  return (
    <div className="payment-for-summon">
      <InfoCard
        variant={"warning"}
        label={"Complete in 2 days"}
        additionalElements={[
          <p key="delivery-note">
            {t(orderType === ORDER_TYPES.SUMMONS ? "SUMMON_DELIVERY_NOTE" : "NOTICE_DELIVERY_NOTE")}{" "}
            <span style={{ fontWeight: "bold" }}>{getPaymentModalDeliveryNoteDeadlineFormatted()}</span> {t("ON_TIME_DELIVERY")}
          </p>,
        ]}
        inline
        textStyle={{}}
        className={`custom-info-card warning`}
      />
      {showOfflinePaymentInfoCardLabel ? <CardLabel className="case-input-label">{t("OFFLINE_PAYMENT_INFO")}</CardLabel> : null}
      <ApplicationInfoComponent infos={infos} links={links} />
      <LabelFieldPair className="case-label-field-pair">
        <div className="join-case-tooltip-wrapper">
          <CardLabel className="case-input-label">{t(modeSelectionLabelKey)}</CardLabel>
          <CustomErrorTooltip message={t("Select date")} showTooltip={true} icon />
        </div>
        <RadioButtons
          additionalWrapperClass="mode-of-post-pay"
          options={modeOptions}
          selectedOption={selectedOption}
          optionsKey={"label"}
          onSelect={(value) => setSelectedOption(value)}
          disabled={paymentLoader}
        />
      </LabelFieldPair>
      {selectedOption?.value && (
        <div className="summon-payment-action-table">
          {feeOptions[selectedOption?.value]?.map((action, index) => (
            <div className={`${index === 0 ? "header-row" : "action-row"}`} key={index}>
              <div className="payment-label">{t(action?.label)}</div>
              <div className="payment-amount">{action?.action !== "offline-process" && action?.amount ? `Rs. ${action?.amount}/-` : "-"}</div>
              {isUserAdv && <div className="payment-action">{renderPaymentActionCell(action, index)}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
