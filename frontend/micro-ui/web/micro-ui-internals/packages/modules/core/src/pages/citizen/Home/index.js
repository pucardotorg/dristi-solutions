import {
  Calender,
  CardBasedOptions,
  CaseIcon,
  ComplaintIcon,
  DocumentIcon,
  HomeIcon,
  Loader,
  OBPSIcon,
  PTIcon,
  WhatsNewCard,
} from "@egovernments/digit-ui-react-components";
import React from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";

const shouldShowNotificationCountTrigger = () => {
  if (Digit.UserService?.getUser()?.info?.type === "EMPLOYEE") return false;
  return Boolean(Digit.UserService?.getUser()?.access_token);
};

const WhatsAppBanner = ({ isMobile, mobileBanner, webBanner, onClick }) => {
  if (!mobileBanner && !webBanner) return null;
  const banner = isMobile ? mobileBanner : webBanner;
  const handleClick = () => onClick(banner);
  const handleKey = (e) => {
    if (e.key === "Enter" || e.key === " ") onClick(banner);
  };
  return (
    <div className="WhatsAppBanner">
      <img
        src={banner?.bannerUrl}
        alt="WhatsApp banner"
        onClick={handleClick}
        onKeyDown={handleKey}
        role="button"
        tabIndex={0}
      />
    </div>
  );
};

const WhatsNewSection = ({ isLoading, section, events, onSideOptionClick }) => {
  if (isLoading) return <Loader />;
  const handleClick = () => onSideOptionClick(section?.sideOption?.navigationUrl);
  const handleKey = (e) => {
    if (e.key === "Enter" || e.key === " ") onSideOptionClick(section?.sideOption?.navigationUrl);
  };
  return (
    <div className="WhatsNewSection">
      <div className="headSection">
        <h2>{section?.headerLabel}</h2>
        <p onClick={handleClick} onKeyDown={handleKey} role="button" tabIndex={0}>
          {section?.sideOption?.name}
        </p>
      </div>
      <WhatsNewCard {...events?.[0]} />
    </div>
  );
};

WhatsAppBanner.propTypes = {
  isMobile: PropTypes.bool,
  mobileBanner: PropTypes.shape({ bannerUrl: PropTypes.string, navigationUrl: PropTypes.string }),
  webBanner: PropTypes.shape({ bannerUrl: PropTypes.string, navigationUrl: PropTypes.string }),
  onClick: PropTypes.func.isRequired,
};

WhatsNewSection.propTypes = {
  isLoading: PropTypes.bool,
  section: PropTypes.shape({
    headerLabel: PropTypes.string,
    sideOption: PropTypes.shape({ name: PropTypes.string, navigationUrl: PropTypes.string }),
  }),
  events: PropTypes.array,
  onSideOptionClick: PropTypes.func.isRequired,
};

const Home = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const tenantId = Digit.ULBService.getCitizenCurrentTenant(true);
  const { data: { uiHomePage } = {}, isLoading } = Digit.Hooks.useStore.getInitData();
  const isMobile = window.Digit.Utils.browser.isMobile();

  const { data: EventsData, isLoading: EventsDataLoading } = Digit.Hooks.useEvents({
    tenantId,
    variant: "whats-new",
    config: {
      enabled: shouldShowNotificationCountTrigger(),
    },
  });

  if (!tenantId) {
    history.push(`/${window?.contextPath}/citizen/select-language`);
  }

  const appBannerWebObj = uiHomePage?.appBannerDesktop;
  const appBannerMobObj = uiHomePage?.appBannerMobile;
  const citizenServicesObj = uiHomePage?.citizenServicesCard;
  const infoAndUpdatesObj = uiHomePage?.informationAndUpdatesCard;
  const whatsAppBannerWebObj = uiHomePage?.whatsAppBannerDesktop;
  const whatsAppBannerMobObj = uiHomePage?.whatsAppBannerMobile;
  const whatsNewSectionObj = uiHomePage?.whatsNewSection;
  const redirectURL = uiHomePage?.redirectURL;

  if (redirectURL) {
    history.push(`/${window?.contextPath}/citizen/${redirectURL}`);
  }
  if (window?.location?.href?.includes?.("sanitation-ui")) {
    history.push(`/${window?.contextPath}/citizen/all-services`);
  }

  const handleClickOnWhatsAppBanner = (obj) => {
    window.open(obj?.navigationUrl);
  };

  const allCitizenServicesProps = {
    header: t(citizenServicesObj?.headerLabel),
    sideOption: {
      name: t(citizenServicesObj?.sideOption?.name),
      onClick: () => history.push(citizenServicesObj?.sideOption?.navigationUrl),
    },
    options: [
      {
        name: t(citizenServicesObj?.props?.[0]?.label),
        Icon: <ComplaintIcon />,
        onClick: () => history.push(citizenServicesObj?.props?.[0]?.navigationUrl),
      },
      {
        name: t(citizenServicesObj?.props?.[1]?.label),
        Icon: <PTIcon className="fill-path-primary-main" />,
        onClick: () => history.push(citizenServicesObj?.props?.[1]?.navigationUrl),
      },
      {
        name: t(citizenServicesObj?.props?.[2]?.label),
        Icon: <CaseIcon className="fill-path-primary-main" />,
        onClick: () => history.push(citizenServicesObj?.props?.[2]?.navigationUrl),
      },
      {
        name: t(citizenServicesObj?.props?.[3]?.label),
        Icon: <OBPSIcon />,
        onClick: () => history.push(citizenServicesObj?.props?.[3]?.navigationUrl),
      },
    ],
    styles: { display: "flex", flexWrap: "wrap", justifyContent: "flex-start", width: "100%" },
  };
  const allInfoAndUpdatesProps = {
    header: t(infoAndUpdatesObj?.headerLabel),
    sideOption: {
      name: t(infoAndUpdatesObj?.sideOption?.name),
      onClick: () => history.push(infoAndUpdatesObj?.sideOption?.navigationUrl),
    },
    options: [
      {
        name: t(infoAndUpdatesObj?.props?.[0]?.label),
        Icon: <HomeIcon />,
        onClick: () => history.push(infoAndUpdatesObj?.props?.[0]?.navigationUrl),
      },
      {
        name: t(infoAndUpdatesObj?.props?.[1]?.label),
        Icon: <Calender />,
        onClick: () => history.push(infoAndUpdatesObj?.props?.[1]?.navigationUrl),
      },
      {
        name: t(infoAndUpdatesObj?.props?.[2]?.label),
        Icon: <DocumentIcon />,
        onClick: () => history.push(infoAndUpdatesObj?.props?.[2]?.navigationUrl),
      },
      {
        name: t(infoAndUpdatesObj?.props?.[3]?.label),
        Icon: <DocumentIcon />,
        onClick: () => history.push(infoAndUpdatesObj?.props?.[3]?.navigationUrl),
      },
    ],
    styles: { display: "flex", flexWrap: "wrap", justifyContent: "flex-start", width: "100%" },
  };

  if (isLoading) return <Loader />;

  const bannerUrl = isMobile ? appBannerMobObj?.bannerUrl : appBannerWebObj?.bannerUrl;
  const showWhatsNew = shouldShowNotificationCountTrigger();

  return (
    <div className="HomePageContainer">
      <div className="HomePageWrapper">
        <div className="BannerWithSearch">
          <img src={bannerUrl} alt="Home banner" />
          <div className="ServicesSection">
            <CardBasedOptions style={{ marginTop: "-30px" }} {...allCitizenServicesProps} />
            <CardBasedOptions style={isMobile ? {} : { marginTop: "-30px" }} {...allInfoAndUpdatesProps} />
          </div>
        </div>

        <WhatsAppBanner
          isMobile={isMobile}
          mobileBanner={whatsAppBannerMobObj}
          webBanner={whatsAppBannerWebObj}
          onClick={handleClickOnWhatsAppBanner}
        />

        {showWhatsNew && (
          <WhatsNewSection
            isLoading={EventsDataLoading}
            section={{
              headerLabel: t(whatsNewSectionObj?.headerLabel),
              sideOption: {
                name: t(whatsNewSectionObj?.sideOption?.name),
                navigationUrl: whatsNewSectionObj?.sideOption?.navigationUrl,
              },
            }}
            events={EventsData}
            onSideOptionClick={(url) => history.push(url)}
          />
        )}
      </div>
    </div>
  );
};

export default Home;
