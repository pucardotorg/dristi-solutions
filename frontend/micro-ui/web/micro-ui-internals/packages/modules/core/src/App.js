import React, { useEffect, useState } from "react";
import { Redirect, Route, Switch, useHistory, useLocation } from "react-router-dom";
import CitizenApp from "./pages/citizen";
import EmployeeApp from "./pages/employee";
import { useTranslation } from "react-i18next";
import { trackEvent } from "./lib/gtag";
import { getCLS, getFID, getLCP, getFCP, getTTFB } from "web-vitals";
import TopBarSideBar from "./components/TopBarSideBar";
const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    width: "100vw",
    padding: "0 20px",
    boxSizing: "border-box",
  },
  text: {
    fontSize: "24px",
    color: "#333",
  },
};

export const DigitApp = ({ stateCode, modules, appTenants, logoUrl, initData, defaultLanding = "citizen" }) => {
  const history = useHistory();
  const { pathname, search } = useLocation();
  const innerWidth = window.innerWidth;
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 900);
  const cityDetails = Digit.ULBService.getCurrentUlb();
  const userDetails = Digit.UserService.getUser();
  const { data: storeData } = Digit.Hooks.useStore.getInitData();
  const { stateInfo } = storeData || {};

  const DSO = Digit.UserService.hasAccess(["FSM_DSO"]);
  let CITIZEN = userDetails?.info?.type === "CITIZEN" || !window.location.pathname.split("/").includes("employee") ? true : false;

  if (window.location.pathname.split("/").includes("employee")) CITIZEN = false;

  useEffect(() => {
    if (!pathname?.includes("application-details")) {
      if (!pathname?.includes("inbox")) {
        Digit.SessionStorage.del("fsm/inbox/searchParams");
      }
      if (pathname?.includes("search")) {
        Digit.SessionStorage.del("fsm/search/searchParams");
      }
    }
    if (!pathname?.includes("dss")) {
      Digit.SessionStorage.del("DSS_FILTERS");
    }
    if (pathname?.toString() === `/${window?.contextPath}/employee`) {
      Digit.SessionStorage.del("SEARCH_APPLICATION_DETAIL");
      Digit.SessionStorage.del("WS_EDIT_APPLICATION_DETAILS");
    }
    if (pathname?.toString() === `/${window?.contextPath}/citizen` || pathname?.toString() === `/${window?.contextPath}/employee`) {
      Digit.SessionStorage.del("WS_DISCONNECTION");
    }
  }, [pathname]);

  useEffect(() => {

    // Track web vitals
    const reportWebVitals = ({ name, delta, id, value }) => {
      trackEvent(name, value, pathname + search, "Web Vitals");
    };

    // Measure and report web vitals
    getFID(reportWebVitals);
    getLCP(reportWebVitals);
    getFCP(reportWebVitals);
  }, [pathname, search]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 900);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    // Set up history listener for smooth scrolling
    const unlisten = history.listen(() => {
      window?.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    });

    // Clean up the listener when component unmounts
    return () => unlisten();
  }, [history]);

  const handleUserDropdownSelection = (option) => {
    option.func();
  };

  const mobileView = innerWidth <= 640;
  let sourceUrl = `${window.location.origin}/citizen`;
  const commonProps = {
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
  };

  const { t } = useTranslation()

  if (isMobileView) {
    return (
      <div style={styles.container}>
        <TopBarSideBar
          t={t}
          stateInfo={stateInfo}
          userDetails={userDetails}
          cityDetails={cityDetails}
          mobileView={false}
          handleUserDropdownSelection={handleUserDropdownSelection}
          logoUrl={logoUrl}
          showSidebar={true}
        />
        <h1 style={styles.text}>{t("MOBILE_VIEW_ERROR")}</h1>
      </div>
    );
  }

  return (
    <Switch>
      <Route path={`/${window?.contextPath}/employee`}>
        <EmployeeApp {...commonProps} />
      </Route>
      <Route path={`/${window?.contextPath}/citizen`}>
        <CitizenApp {...commonProps} />
      </Route>
      <Route>
        <Redirect to={`/${window?.contextPath}/${defaultLanding}`} />
      </Route>
    </Switch>
  );
};
