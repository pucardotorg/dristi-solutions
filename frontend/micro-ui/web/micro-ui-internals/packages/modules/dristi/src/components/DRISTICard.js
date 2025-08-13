import { Card, Header } from "@egovernments/digit-ui-react-components";
import React, { useMemo } from "react";
import CustomCard from "./CustomCard";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import JudgeScreen from "../pages/employee/Judge/JudgeScreen";
import { useTranslation } from "react-i18next";

const DRISTICard = () => {
  const { t } = useTranslation();
  const Digit = useMemo(() => window?.Digit || {}, []);
  const history = useHistory();
  const roles = Digit.UserService.getUser()?.info?.roles;
  const isJudge = useMemo(() => roles?.some((role) => role.code === "CASE_APPROVER"), [roles]);
  const isScrutiny = useMemo(() => roles?.some((role) => role.code === "CASE_REVIEWER"), [roles]);
  const isCourtOfficer = useMemo(() => roles?.some((role) => role.code === "HEARING_CREATOR"), [roles]);
  const isBenchClerk = useMemo(() => roles?.some((role) => role.code === "BENCH_CLERK"), [roles]);
  const isTypist = useMemo(() => roles?.some((role) => role.code === "TYPIST_ROLE"), [roles]);
  const isCitizen = useMemo(() => Boolean(Digit?.UserService?.getUser()?.info?.type === "CITIZEN"), [Digit]);
  const isProcessViewer = useMemo(() => roles?.some((role) => role.code === "PROCESS_VIEWER"), [roles]);
  const isNyayMitra = ["ADVOCATE_APPLICATION_VIEWER", "ADVOCATE_APPROVER", "ADVOCATE_CLERK_APPROVER"].reduce((res, curr) => {
    if (!res) return res;
    res = roles?.some((role) => role.code === curr);
    return res;
  }, true);

  if (isJudge || isTypist || isBenchClerk) {
    history.push(`/${window?.contextPath}/employee/home/home-screen`);
  } else if (isScrutiny) {
    history.push(`/${window?.contextPath}/employee/home/home-pending-task`);
  } else if (isCitizen) {
    history.push(`/${window?.contextPath}/citizen/home/home-pending-task`);
  } else if (isProcessViewer) {
    history.push(`/${window?.contextPath}/employee/orders/Summons&Notice`);
  }

  let roleType = isJudge ? "isJudge" : "default";
  return (
    <React.Fragment>
      {(() => {
        switch (roleType) {
          case "isJudge":
            return (
              <div className={"file-case-main"}>
                <JudgeScreen path={`/${window?.contextPath}/employee/dristi`} />
              </div>
            );
          default:
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
                      history.push(`/${window?.contextPath}/employee/dristi/registration-requests`);
                    }}
                  />
                  <CustomCard
                    label={isNyayMitra ? t("CS_VIEW_PENDING_PAYMENTS") : t("CS_VIEW_CASES")}
                    subLabel={isNyayMitra ? t("CS_VIEW_PENDING_PAYMENTS_SUB_TEXT") : t("CS_VIEW_CASES_SUB_TEXT")}
                    buttonLabel={isNyayMitra ? t("CS_VIEW_PENDING_PAYMENTS") : t("CS_VIEW_CASES")}
                    className="custom-card-style"
                    onClick={() => {
                      isNyayMitra
                        ? history.push(`/${window?.contextPath}/employee/dristi/pending-payment-inbox`)
                        : history.push(`/${window?.contextPath}/employee/dristi/cases`);
                    }}
                  />
                </div>
              </Card>
            );
        }
      })()}
    </React.Fragment>
  );
};

export default DRISTICard;
