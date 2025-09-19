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

  const isEpostUser = useMemo(() => roles?.some((role) => role?.code === "POST_MANAGER"), [roles]);

  let homePath = `/${window?.contextPath}/${userType}/home/home-pending-task`;
  if (!isEpostUser && userType === "employee") homePath = `/${window?.contextPath}/${userType}/home/home-screen`;
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
