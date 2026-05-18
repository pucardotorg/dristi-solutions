import {
  Card,
  CaseIcon, ComplaintIcon, HelpLineIcon, Loader, MCollectIcon, PTIcon, RupeeSymbol, ServiceCenterIcon, TimerIcon, ValidityTimeIcon,
  WhatsappIconGreen
} from "@egovernments/digit-ui-react-components";
import React from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

const IconComponent = ({ module, styles }) => {
  switch (module) {
    case "TL":
      return <CaseIcon className="fill-path-primary-main" styles={styles} />;
    case "PT":
      return <PTIcon className="fill-path-primary-main" styles={styles} />;
    case "MCOLLECT":
      return <MCollectIcon className="fill-path-primary-main" styles={styles} />;
    case "PGR":
      return <ComplaintIcon className="fill-path-primary-main" styles={styles} />;
    default:
      return <CaseIcon className="fill-path-primary-main" styles={styles} />;
  }
};

IconComponent.propTypes = {
  module: PropTypes.string,
  styles: PropTypes.object,
};

const StaticDataIconComponentOne = ({ module }) => {
  if (module === "PT" || module === "WS") {
    return (
      <span className="timerIcon">
        <TimerIcon />
      </span>
    );
  }
  return null;
};

StaticDataIconComponentOne.propTypes = { module: PropTypes.string };

const StaticDataIconComponentTwo = ({ module }) => {
  if (module === "PT") {
    return (
      <span className="rupeeSymbol">
        <RupeeSymbol />
      </span>
    );
  }
  if (module === "WS") {
    return (
      <span className="timerIcon">
        <TimerIcon />
      </span>
    );
  }
  return null;
};

StaticDataIconComponentTwo.propTypes = { module: PropTypes.string };

const buildStaticContent = (module, mdmsConfigResult, t) => {
  switch (module) {
    case "TL":
    case "PT":
    case "MCOLLECT":
      return {
        staticCommonContent: t("COMMON_VALIDITY"),
        validity: mdmsConfigResult?.validity + (mdmsConfigResult?.validity === "1" ? t("COMMON_DAY") : t("COMMON_DAYS")),
      };
    case "PGR":
      return { staticCommonContent: t("ACTION_TEST_COMPLAINT_TYPES") };
    case "OBPS":
      return {
        staticCommonContent: t("BUILDING_PLAN_PERMIT_VALIDITY"),
        validity: mdmsConfigResult?.validity + " " + (mdmsConfigResult?.validity === "1" ? t("COMMON_DAY") : t("COMMON_DAYS")),
      };
    default:
      return { staticCommonContent: "" };
  }
};

const buildStaticData = (module, mdmsConfigResult, t) => {
  switch (module) {
    case "PT":
      return {
        staticDataOne: mdmsConfigResult?.staticDataOne + " " + t("COMMON_DAYS"),
        staticDataOneHeader: t("APPLICATION_PROCESSING_TIME"),
        staticDataTwo: mdmsConfigResult?.staticDataTwo,
        staticDataTwoHeader: t("APPLICATION_PROCESSING_FEE"),
      };
    case "WS":
      return {
        staticDataOne: "",
        staticDataOneHeader:
          t("PAY_WATER_CHARGES_BY") + " " + mdmsConfigResult?.staticDataOne + " " + t("COMMON_DAYS") + " " + t("OF_BILL_GEN_TO_AVOID_LATE_FEE"),
        staticDataTwo: mdmsConfigResult?.staticDataTwo + " " + t("COMMON_DAYS"),
        staticDataTwoHeader: t("APPLICATION_PROCESSING_TIME"),
      };
    default:
      return {};
  }
};

const WhatsAppCard = ({ url, onClick, t }) => (
  <Card style={{ margin: "16px", padding: "16px", maxWidth: "unset" }}>
    <button
      type="button"
      className="pay-whatsapp-card"
      onClick={() => onClick(url)}
      style={{ background: "none", border: "none", padding: 0, width: "100%", textAlign: "left" }}
    >
      <div className="pay-whatsapp-text">{t("PAY_VIA_WHATSAPP")}</div>
      <div className="whatsAppIconG">
        <WhatsappIconGreen />
      </div>
    </button>
  </Card>
);

WhatsAppCard.propTypes = {
  url: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
};

const HelplineCard = ({ helpline, t }) => (
  <Card style={{ margin: "16px", padding: "16px", maxWidth: "unset" }}>
    <div className="static-home-Card">
      <div className="static-home-Card-header">{t("CALL_CENTER_HELPLINE")}</div>
      <div className="helplineIcon">
        <HelpLineIcon />
      </div>
    </div>
    <div className="call-center-card-text">
      {helpline?.contactOne && (
        <div className="call-center-card-content">
          <a href={`tel:${helpline?.contactOne}`}>{helpline?.contactOne}</a>
        </div>
      )}
      {helpline?.contactTwo && (
        <div className="call-center-card-content">
          <a href={`tel:${helpline?.contactTwo}`}>{helpline?.contactTwo}</a>
        </div>
      )}
    </div>
  </Card>
);

HelplineCard.propTypes = {
  helpline: PropTypes.object,
  t: PropTypes.func.isRequired,
};

const ServiceCenterCard = ({ serviceCenter, viewMapLocation, t }) => (
  <Card style={{ margin: "16px", padding: "16px", maxWidth: "unset" }}>
    <div className="static-home-Card">
      <div className="static-home-Card-header">{t("CITIZEN_SERVICE_CENTER")}</div>
      <div className="serviceCentrIcon">
        <ServiceCenterIcon />
      </div>
    </div>
    <div className="service-center-details-card">
      <div className="service-center-details-text">{serviceCenter}</div>
    </div>
    {viewMapLocation && (
      <div className="link">
        <a href={viewMapLocation}>{t("VIEW_ON_MAP")}</a>
      </div>
    )}
  </Card>
);

ServiceCenterCard.propTypes = {
  serviceCenter: PropTypes.string,
  viewMapLocation: PropTypes.string,
  t: PropTypes.func.isRequired,
};

const StaticDynamicCard = ({ moduleCode }) => {
  const { t } = useTranslation();
  const tenantId = Digit.ULBService.getCitizenCurrentTenant();
  const { isLoading: isMdmsLoading, data: mdmsData } = Digit.Hooks.useStaticData(Digit.ULBService.getStateId());
  const { isLoading: isSearchLoading, error, data: dynamicData } = Digit.Hooks.useDynamicData({
    moduleCode,
    tenantId,
    filters: {},
    t,
  });
  const handleClickOnWhatsApp = (obj) => {
    window.open(obj);
  };

  const mdmsConfigResult = mdmsData?.MdmsRes["common-masters"]?.StaticData[0]?.[`${moduleCode}`];

  if (isMdmsLoading || isSearchLoading) {
    return <Loader />;
  }
  if (!mdmsConfigResult) return null;

  const staticContentValues = buildStaticContent(moduleCode, mdmsConfigResult, t);
  const staticDataValues = buildStaticData(moduleCode, mdmsConfigResult, t);

  return (
    <React.Fragment>
      {mdmsConfigResult?.payViaWhatsApp && (
        <WhatsAppCard url={mdmsConfigResult?.payViaWhatsApp} onClick={handleClickOnWhatsApp} t={t} />
      )}
      {mdmsConfigResult?.helpline && <HelplineCard helpline={mdmsConfigResult?.helpline} t={t} />}
      {mdmsConfigResult?.serviceCenter ? (
        <ServiceCenterCard
          serviceCenter={mdmsConfigResult?.serviceCenter}
          viewMapLocation={mdmsConfigResult?.viewMapLocation}
          t={t}
        />
      ) : (
        <div />
      )}
      <Card style={{ margin: "16px", padding: "16px", maxWidth: "unset" }}>
        {!error && dynamicData?.dynamicDataOne != null && (
          <div className="dynamicDataCard">
            <div className="dynamicData">
              <IconComponent module={moduleCode} styles={{ width: "24px", height: "24px" }} />
              <span className="dynamicData-content">{dynamicData?.dynamicDataOne}</span>
            </div>
          </div>
        )}
        {!error && dynamicData?.dynamicDataTwo != null && (
          <div className="dynamicDataCard">
            <div className="dynamicData">
              <IconComponent module={moduleCode} styles={{ width: "24px", height: "24px" }} />
              <span className="dynamicData-content">{dynamicData?.dynamicDataTwo}</span>
            </div>
          </div>
        )}
        {mdmsConfigResult?.staticDataOne && (
          <div className="staticDataCard">
            <div className="staticData">
              <StaticDataIconComponentOne module={moduleCode} />
              <span className="static-data-content">
                <span
                  className="static-data-content-first"
                  style={{
                    marginTop: staticDataValues?.staticDataOne === "" ? "8px" : "unset",
                  }}
                >
                  {staticDataValues?.staticDataOneHeader}
                </span>
                <span className="static-data-content-second">{`${staticDataValues?.staticDataOne}`}</span>
              </span>
            </div>
          </div>
        )}
        {mdmsConfigResult?.staticDataTwo && (
          <div className="staticDataCard">
            <div className="staticData">
              <StaticDataIconComponentTwo module={moduleCode} />
              <span className="static-data-content">
                <span className="static-data-content-first">{staticDataValues?.staticDataTwoHeader}</span>
                <span className="static-data-content-second">{staticDataValues?.staticDataTwo}</span>
              </span>
            </div>
          </div>
        )}
        {mdmsConfigResult?.validity && (
          <div className="staticDataCard">
            <div className="staticData">
              <span className="validityIcon">
                <ValidityTimeIcon />
              </span>
              <span className="static-data-content">
                <span className="static-data-content-first">{staticContentValues?.staticCommonContent}</span>
                <span className="static-data-content-second">{staticContentValues?.validity}</span>
              </span>
            </div>
          </div>
        )}
        {!error && dynamicData?.staticData && (
          <div className="staticDataCard">
            <div className="staticData">
              {moduleCode === "PGR" ? (
                <IconComponent module={moduleCode} styles={{ width: "24px", height: "24px", marginLeft: "13px", marginTop: "12px" }} />
              ) : (
                <span className="validityIcon">
                  <ValidityTimeIcon />
                </span>
              )}
              <span className="static-data-content">
                <span className="static-data-content-first">{staticContentValues?.staticCommonContent}</span>
                <span className="static-data-content-second">{dynamicData?.staticData}</span>
              </span>
            </div>
          </div>
        )}
      </Card>
    </React.Fragment>
  );
};

StaticDynamicCard.propTypes = {
  moduleCode: PropTypes.string,
};

export default StaticDynamicCard;
