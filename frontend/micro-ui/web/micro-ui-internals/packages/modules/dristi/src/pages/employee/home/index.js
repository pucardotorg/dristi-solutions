import { InboxSearchComposer } from "@egovernments/digit-ui-react-components";
import React, { useMemo } from "react";
import { scrutinyInboxConfig } from "./scrutinyInboxConfig";
import { useHistory } from "react-router-dom";

const sectionsParentStyle = {
  height: "50%",
  display: "flex",
  flexDirection: "column",
  gridTemplateColumns: "20% 1fr",
  gap: "1rem",
};

function Home() {
  const history = useHistory();
  const userInfo = window?.Digit?.UserService?.getUser()?.info;
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo]);
  const roles = useMemo(() => userInfo?.roles, [userInfo]);

  const isJudge = useMemo(() => roles?.some((role) => role.code === "CASE_APPROVER"), [roles]);
  const isBenchClerk = useMemo(() => roles?.some((role) => role.code === "BENCH_CLERK"), [roles]);
  const isTypist = useMemo(() => roles?.some((role) => role.code === "TYPIST_ROLE"), [roles]);
  let homePath = `/${window?.contextPath}/${userType}/home/home-pending-task`;
  if (isJudge || isTypist || isBenchClerk) homePath = `/${window?.contextPath}/${userType}/home/home-screen`;
  history.push(homePath);
  return (
    <React.Fragment>
      <div className="scrutiny-inbox-table">
        <div className="inbox-search-wrapper">
          <InboxSearchComposer
            customStyle={sectionsParentStyle}
            configs={scrutinyInboxConfig}
            additionalConfig={{
              resultsTable: {
                onClickRow: (row) => {
                  const searchParams = new URLSearchParams();
                  searchParams.set("caseId", row.original.id);
                  history.push(`case?${searchParams.toString()}`);
                },
              },
            }}
          ></InboxSearchComposer>
        </div>
      </div>
    </React.Fragment>
  );
}

export default Home;
