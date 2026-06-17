import { Card, Header } from "@egovernments/digit-ui-react-components";
/** Digit bootstrapping uses window/contextPath intentionally (NOSONAR globalThis preference). */
import React, { useMemo } from "react";
import CustomCard from "./CustomCard";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import JudgeScreen from "../pages/employee/Judge/JudgeScreen";
import { useTranslation } from "react-i18next";

const DRISTICard = () => {
  const { t } = useTranslation();
  const Digit = useMemo(() => window?.Digit || {}, []); // NOSONAR — Digit bootstrapped on window
  const history = useHistory();
  const roles = Digit.UserService.getUser()?.info?.roles;
  const isEpostUser = useMemo(() => roles?.some((role) => role?.code === "POST_MANAGER"), [roles]);
  const isJudge = useMemo(() => roles?.some((role) => role?.code === "JUDGE"), [roles]);
  const isCitizen = useMemo(() => Boolean(Digit?.UserService?.getUser()?.info?.type === "CITIZEN"), [Digit]);
  const isProcessViewer = useMemo(() => roles?.some((role) => role.code === "PROCESS_VIEWER"), [roles]);

  if (!isEpostUser && !isCitizen) {
    history.push(`/${window?.contextPath}/employee/home/home-screen`); // NOSONAR
  } else if (isCitizen) {
    history.push(`/${window?.contextPath}/citizen/home/home-pending-task`); // NOSONAR
  } else if (isProcessViewer) {
    history.push(`/${window?.contextPath}/employee/orders/Summons&Notice`); // NOSONAR
  } else if (isEpostUser) {
    history.push(`/${window?.contextPath}/employee/home/epost-home-screen`); // NOSONAR
  }

  if (isJudge) {
    return (
      <div className={"file-case-main"}>
        {/* NOSONAR — window.contextPath for Digit routing */}
        <JudgeScreen path={`/${window?.contextPath}/employee/dristi`} />
      </div>
    );
  }

  return (
    <Card className="main-card-home">
      <Header className="main-card-header">{t("WHAT_DO_YOU_WISH_TO_DO")}</Header>
      <div className="main-inner-div">
        <CustomCard
          label={t("CS_VIEW_REGISTRATION")}
          subLabel={t("CS_VIEW_REGISTRATION_SUB_TEXT")}
          buttonLabel={t("CS_VIEW_PENDING_REQUESTS")}
          className="custom-card-style"
          onClick={() => {
            history.push(`/${window?.contextPath}/employee/dristi/registration-requests`); // NOSONAR
          }}
        />
        <CustomCard
          label={t("CS_VIEW_CASES")}
          subLabel={t("CS_VIEW_CASES_SUB_TEXT")}
          buttonLabel={t("CS_VIEW_CASES")}
          className="custom-card-style"
          onClick={() => {
            history.push(`/${window?.contextPath}/employee/dristi/cases`); // NOSONAR
          }}
        />
      </div>
    </Card>
  );
};

export default DRISTICard;
