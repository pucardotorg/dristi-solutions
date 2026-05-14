import { BackButton, CitizenHomeCard, CitizenInfoLabel } from "@egovernments/digit-ui-react-components";
import React, { useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { Route, Switch, useHistory, useRouteMatch } from "react-router-dom";
import ErrorBoundary from "../../components/ErrorBoundaries";
import ErrorComponent from "../../components/ErrorComponent";
import { AppHome, processLinkData } from "../../components/Home";
import TopBarSideBar from "../../components/TopBarSideBar";
import FAQsSection from "./FAQs/FAQs";
import CitizenHome from "./Home";
import LanguageSelection from "./Home/LanguageSelection";
import LocationSelection from "./Home/LocationSelection";
import UserProfile from "./Home/UserProfile";
import HowItWorks from "./HowItWorks/howItWorks";
import Login from "./Login";
import Search from "./SearchApp";
import StaticDynamicCard from "./StaticDynamicComponent/StaticDynamicCard";

const getTenants = (codes, tenants) =>
  tenants.filter((tenant) => codes.map((item) => item.code).includes(tenant.code));

const EmptyComponent = () => null;

const EmptyIcon = () => <span />;

const ObpsInfo = ({ t }) => (
  <CitizenInfoLabel
    style={{ margin: "0px", padding: "10px" }}
    info={t("CS_FILE_APPLICATION_INFO_LABEL")}
    text={t(`BPA_CITIZEN_HOME_STAKEHOLDER_INCLUDES_INFO_LABEL`)}
  />
);

ObpsInfo.propTypes = {
  t: PropTypes.func.isRequired,
};

const buildObpsInfoComponent = (t) => () => <ObpsInfo t={t} />;

const Home = ({
  stateInfo,
  userDetails,
  CITIZEN,
  cityDetails,
  mobileView,
  handleUserDropdownSelection,
  logoUrl,
  DSO,
  stateCode,
  modules,
  appTenants,
  sourceUrl,
  pathname,
  initData,
}) => {
  const { isLoading: islinkDataLoading, isFetched: isLinkDataFetched } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    "ACCESSCONTROL-ACTIONS-TEST",
    [
      {
        name: "actions-test",
        filter: `[?(@.url == '${window.contextPath}-card')]`,
      },
    ],
    {
      select: (data) => {
        const formattedData = data?.["ACCESSCONTROL-ACTIONS-TEST"]?.["actions-test"]
          ?.filter((el) => el.enabled === true)
          .reduce((a, b) => {
            a[b.parentModule] = a[b.parentModule]?.length > 0 ? [b, ...a[b.parentModule]] : [b];
            return a;
          }, {});
        return formattedData;
      },
    }
  );

  useEffect(() => {
    Digit.UserService.setType("citizen");
  }, []);

  const sidebarHiddenFor = useMemo(() => {
    const contextPath = window?.contextPath;
    return [
      `/${contextPath}/citizen/select-language`,
      `${contextPath}/citizen/register/name`,
      `/${contextPath}/citizen/select-location`,
      `/${contextPath}/citizen/dristi/landing-page`,
    ];
  }, []);

  const linkData = useMemo(
    () => ({
      DRISTI: [
        {
          id: 2446,
          name: "CS_DRISTI_HOME",
          url: "digit-ui-card",
          displayName: "CS_DRISTI_HOME",
          orderNumber: 1,
          parentModule: "DRISTI",
          enabled: true,
          serviceCode: "",
          code: "DRISTI",
          path: "",
          navigationURL: "/ui/citizen/dristi/home",
          leftIcon: "HomeIcon",
          rightIcon: "",
          queryParams: "",
          sidebar: "digit-ui-links",
          sidebarURL: "/ui/citizen/dristi/home",
        },
      ],
    }),
    []
  );

  const classname = Digit.Hooks.useRouteSubscription(pathname);
  const { t } = useTranslation();
  const { path } = useRouteMatch();
  const history = useHistory();

  const hideSidebar = sidebarHiddenFor.some((e) => window.location.href.includes(e)) || true;
  const appRoutes = modules.map(({ code, tenants }) => {
    const Module = Digit.ComponentRegistryService.getComponent(`${code}Module`);
    return Module ? (
      <Route key={code} path={`${path}/${code.toLowerCase()}`}>
        <Module stateCode={stateCode} moduleCode={code} userType="citizen" tenants={getTenants(tenants, appTenants)} />
      </Route>
    ) : null;
  });

  const ModuleLevelLinkHomePages = modules.map(({ code, bannerImage }) => {
    const Links = Digit.ComponentRegistryService.getComponent(`${code}Links`) || EmptyComponent;
    const mdmsDataObj = isLinkDataFetched ? processLinkData(linkData, code, t) : undefined;

    if (mdmsDataObj?.header === "ACTION_TEST_WS") {
      mdmsDataObj?.links.sort((a, b) => b.orderNumber - a.orderNumber);
    }
    return (
      <React.Fragment key={code}>
        <Route path={`${path}/${code.toLowerCase()}-home`}>
          <div className="moduleLinkHomePage">
            <img src={bannerImage || stateInfo?.bannerUrl} alt="noimagefound" />
            <BackButton className="moduleLinkHomePageBackButton" />
            <h1>{t("MODULE_" + code.toUpperCase())}</h1>
            <div className="moduleLinkHomePageModuleLinks">
              {mdmsDataObj && (
                <CitizenHomeCard
                  header={t(mdmsDataObj?.header)}
                  links={mdmsDataObj?.links}
                  Icon={EmptyIcon}
                  Info={code === "OBPS" ? buildObpsInfoComponent(t) : null}
                  isInfo={code === "OBPS"}
                />
              )}
              <Links key={`links-${code}`} matchPath={`/${window?.contextPath}/citizen/${code.toLowerCase()}`} userType={"citizen"} />
            </div>
            <StaticDynamicCard moduleCode={code?.toUpperCase()} />
          </div>
        </Route>
        <Route key={`${code}-faq`} path={`${path}/${code.toLowerCase()}-faq`}>
          <FAQsSection module={code?.toUpperCase()} />
        </Route>
        <Route key={`${code}-how-it-works`} path={`${path}/${code.toLowerCase()}-how-it-works`}>
          <HowItWorks module={code?.toUpperCase()} />
        </Route>
      </React.Fragment>
    );
  });

  return (
    <div className={classname}>
      <TopBarSideBar
        t={t}
        stateInfo={stateInfo}
        userDetails={userDetails}
        CITIZEN={CITIZEN}
        cityDetails={cityDetails}
        mobileView={mobileView}
        handleUserDropdownSelection={handleUserDropdownSelection}
        logoUrl={logoUrl}
        showSidebar={true}
        linkData={linkData}
        islinkDataLoading={islinkDataLoading}
      />

      <div className={`main center-container citizen-home-container mb-25`}>
        {hideSidebar ? null : <div>{/* <StaticCitizenSideBar linkData={linkData} islinkDataLoading={islinkDataLoading} /> */}</div>}

        <Switch>
          <Route exact path={path}>
            <CitizenHome />
          </Route>

          <Route exact path={`${path}/select-language`}>
            <LanguageSelection />
          </Route>

          <Route exact path={`${path}/select-location`}>
            <LocationSelection />
          </Route>
          <Route path={`${path}/error`}>
            <ErrorComponent
              initData={initData}
              goToHome={() => {
                history.push(`/${window?.contextPath}/${Digit?.UserService?.getType?.()}`);
              }}
            />
          </Route>
          <Route path={`${path}/all-services`}>
            <AppHome
              userType="citizen"
              modules={modules}
              getCitizenMenu={linkData}
              fetchedCitizen={isLinkDataFetched}
              isLoading={islinkDataLoading}
            />
          </Route>

          <Route path={`${path}/login`}>
            <Login stateCode={stateCode} />
          </Route>

          <Route path={`${path}/register`}>
            <Login stateCode={stateCode} isUserRegistered={false} />
          </Route>

          <Route path={`${path}/user/profile`}>
            <UserProfile stateCode={stateCode} userType={"citizen"} cityDetails={cityDetails} />
          </Route>

          <Route path={`${path}/Audit`}>
            <Search />
          </Route>
          <ErrorBoundary initData={initData}>
            {appRoutes}
            {ModuleLevelLinkHomePages}
          </ErrorBoundary>
        </Switch>
      </div>
    </div>
  );
};

Home.propTypes = {
  stateInfo: PropTypes.object,
  userDetails: PropTypes.object,
  CITIZEN: PropTypes.any,
  cityDetails: PropTypes.object,
  mobileView: PropTypes.bool,
  handleUserDropdownSelection: PropTypes.func,
  logoUrl: PropTypes.string,
  DSO: PropTypes.any,
  stateCode: PropTypes.string,
  modules: PropTypes.array,
  appTenants: PropTypes.array,
  sourceUrl: PropTypes.string,
  pathname: PropTypes.string,
  initData: PropTypes.object,
};

export default Home;
