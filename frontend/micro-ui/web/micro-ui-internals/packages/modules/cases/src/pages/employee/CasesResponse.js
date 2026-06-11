import React, { useState } from "react";
import { Link, useHistory, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LinkLabel, ArrowLeftWhite, ActionBar, SubmitBar } from "@egovernments/digit-ui-react-components";
import { PanelCard } from "@egovernments/digit-ui-components";

const buttonStyle = {
  wrapper: { display: "flex" },
  linkLabel: { display: "flex", marginRight: "3rem" },
  arrow: { marginRight: "8px", marginTop: "3px" },
};

const Response = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const queryStrings = Digit.Hooks.useQueryParams();
  const [isResponseSuccess] = useState(() => {
    if (queryStrings?.isSuccess === "true") return true;
    if (queryStrings?.isSuccess === "false") return false;
    return true;
  });
  const { state } = useLocation();

  const navigateHome = () => {
    history.push(`/${window?.contextPath}/employee`);
  };

  return (
    <>
      <PanelCard type={isResponseSuccess ? "success" : "error"} message={t(state?.message || "SUCCESS")} response={`${state?.showID ? t("CONTRACTS_WO_ID") : ""}`} footerChildren={[]}>
        <div style={buttonStyle?.wrapper}>
          <LinkLabel style={buttonStyle?.linkLabel} onClick={navigateHome}>
            <ArrowLeftWhite fill="#F47738" style={buttonStyle?.arrow} />
            {t("CORE_COMMON_GO_TO_HOME")}
          </LinkLabel>
        </div>
      </PanelCard>
      <ActionBar>
        <Link to={`/${window?.contextPath}/employee`}>
          <SubmitBar label={t("CORE_COMMON_GO_TO_HOME")} />
        </Link>
      </ActionBar>
    </>
  );
};

export default Response;
