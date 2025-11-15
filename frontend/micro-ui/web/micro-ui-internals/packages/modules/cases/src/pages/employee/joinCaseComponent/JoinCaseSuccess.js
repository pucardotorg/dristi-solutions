import CustomCaseInfoDiv from "@egovernments/digit-ui-module-dristi/src/components/CustomCaseInfoDiv";
import { Button, CheckSvg } from "@egovernments/digit-ui-react-components";
import React, { useMemo } from "react";
import { createShorthand } from "../../../utils/joinCaseUtils";
import { formatDate } from "../../../utils";
import NameListWithModal from "../../../components/NameListWithModal";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { RightArrow } from "@egovernments/digit-ui-module-dristi/src/icons/svgIndex";
import { useTranslation } from "react-i18next";

const JoinCaseSuccess = ({
  success,
  messageHeader,
  type,
  caseDetails,
  closeModal,
  refreshInbox,
  successScreenData,
  isCaseViewDisabled,
  isBailBondRequired,
}) => {
  const { t } = useTranslation();

  const history = useHistory();
  const tenantId = useMemo(() => Digit.ULBService.getCurrentTenantId(), []);

  const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
  const userInfoType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo]);
  const { triggerSurvey, SurveyUI } = Digit.Hooks.dristi.useSurveyManager({ tenantId: tenantId });

  const caseInfo = useMemo(() => {
    if (caseDetails?.caseCategory) {
      return [
        {
          key: "CS_CASE_NAME",
          value: caseDetails?.caseTitle,
        },
        {
          key: "CS_CASE_ID",
          value: caseDetails?.cnrNumber,
        },
        {
          key: "CS_FILING_NUMBER",
          value: caseDetails?.filingNumber,
        },
        {
          key: "CASE_NUMBER",
          value:
            (caseDetails?.isLPRCase ? caseDetails?.lprNumber : caseDetails?.courtCaseNumber) ||
            caseDetails?.courtCaseNumber ||
            caseDetails?.cmpNumber ||
            caseDetails?.filingNumber,
        },
        {
          key: "CASE_CATEGORY",
          value: caseDetails?.caseCategory,
          prefix: "CS_",
        },
        {
          key: "CASE_TYPE",
          value: `${createShorthand(caseDetails?.statutesAndSection?.section)} S${caseDetails?.statutesAndSection?.subsection}`,
        },
        {
          key: "CS_FILING_DATE",
          value: formatDate(new Date(caseDetails?.filingDate)),
        },
      ];
    }
    return [];
  }, [caseDetails]);

  return (
    <div className="join-a-case-success">
      <div className={`joining-message ${success ? "join-success" : "join-failed"}`}>
        <h3 className="message-header">{messageHeader}</h3>
        <div style={{ width: "48px", height: "48px" }}>
          <CheckSvg />
        </div>
      </div>
      {success && (
        <React.Fragment>
          {caseDetails?.cnrNumber && (
            <React.Fragment>
              <CustomCaseInfoDiv
                t={t}
                data={caseInfo}
                column={4}
                children={
                  <div>
                    <div className="complainants-respondents" style={{ display: "flex", flexWrap: "wrap", gap: "0px" }}>
                      <div
                        style={{
                          flex: "0 0 50%",
                          boxSizing: "border-box",
                        }}
                      >
                        <h2 className="case-info-title">{t("COMPLAINANTS_TEXT")}</h2>
                        <NameListWithModal t={t} data={successScreenData?.complainantList} type={"COMPLAINANTS_TEXT"} />
                      </div>
                      <div
                        style={{
                          flex: "0 0 50%",
                          boxSizing: "border-box",
                          borderLeft: "1px solid rgba(0, 0, 0, 0.10196)",
                          paddingLeft: "16px",
                        }}
                      >
                        <h2 className="case-info-title">{t("RESPONDENTS_TEXT")}</h2>
                        <NameListWithModal t={t} data={successScreenData?.respondentList} type={"RESPONDENTS_TEXT"} />
                      </div>
                    </div>
                    <div className="complainants-respondents" style={{ display: "flex", flexWrap: "wrap", gap: "0px" }}>
                      <div style={{ width: "50%" }}>
                        <h2 className="case-info-title">{t("COMPLAINTS_ADVOCATES")}</h2>
                        <NameListWithModal t={t} data={successScreenData?.complainantAdvocateList} type={"COMPLAINTS_ADVOCATES"} />
                      </div>
                      <div style={{ width: "50%", paddingLeft: "16px", borderLeft: "1px solid rgba(0, 0, 0, 0.10196)" }}>
                        <h2 className="case-info-title">{t("ACCUSEDS_ADVOCATES")}</h2>
                        <NameListWithModal t={t} data={successScreenData?.respondentAdvocateList} type={"ACCUSEDS_ADVOCATES"} />
                      </div>
                    </div>
                  </div>
                }
              />
            </React.Fragment>
          )}
          <div className="action-button-success">
            <Button
              className={"selector-button-border"}
              label={t("BACK_HOME")}
              onButtonClick={() => {
                triggerSurvey("JOIN_CASE_PAYMENT", () => {
                  closeModal();
                  if (refreshInbox) refreshInbox();
                });
              }}
            />
            <Button
              className={"selector-button-primary"}
              label={isBailBondRequired ? t("FILE_BAIL_APPLICATION") : t("VIEW_CASE_FILE")}
              onButtonClick={() => {
                if (isBailBondRequired) {
                  // TODO : can add for lititgants and respondents like litigant=${}&&litigantIndId=${}`;
                  history.push(
                    `/${window?.contextPath}/${userInfoType}/submissions/submissions-create?filingNumber=${caseDetails?.filingNumber}&applicationType=REQUEST_FOR_BAIL`
                  );
                } else {
                  triggerSurvey("JOIN_CASE_PAYMENT", () => {
                    if (type === "external") {
                      closeModal();
                      if (refreshInbox) refreshInbox();
                      return;
                    }
                    history.push(
                      `/${window?.contextPath}/${userInfoType}/dristi/home/view-case?caseId=${caseDetails?.id}&filingNumber=${caseDetails?.filingNumber}&tab=Overview`
                    );
                  });
                }
              }}
              isDisabled={isCaseViewDisabled}
            >
              <RightArrow />
            </Button>
          </div>
        </React.Fragment>
      )}
      {SurveyUI}
    </div>
  );
};

export default JoinCaseSuccess;
