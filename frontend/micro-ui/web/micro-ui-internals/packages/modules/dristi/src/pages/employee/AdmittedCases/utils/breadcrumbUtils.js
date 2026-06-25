// Helper function to generate employee breadcrumbs
export const getEmployeeCrumbs = ({ t, isCitizen, homeFilteredData, homeActiveTab, fromHome, path, homeTabEnum }) => {
  return [
    {
      path: `/${window?.contextPath}/${isCitizen ? "citizen" : "employee"}/home/home-screen`,
      content: t("ES_COMMON_HOME"),
      show: true,
      isLast: false,
      homeFilteredData: homeFilteredData,
    },
    {
      path: `/${window?.contextPath}/${isCitizen ? "citizen" : "employee"}/home/home-screen`,
      content: t(homeTabEnum[homeActiveTab]),
      show: ["RESCHEDULE_APPLICATIONS", "DELAY_CONDONATION", "OTHERS"]?.includes(homeActiveTab),
      homeActiveTab: homeActiveTab,
      isLast: false,
    },
    {
      path: `/${window?.contextPath}/${isCitizen ? "citizen" : "employee"}/home/home-pending-task`,
      content: t("OPEN_ALL_CASES"),
      show: fromHome || isCitizen ? false : true,
      isLast: false,
    },
    {
      path: `${path}/home/view-case`,
      content: t("VIEW_CASE"),
      show: true,
      isLast: true,
    },
  ];
};

// Helper function to generate advocate name display
export const getAdvocateName = ({ caseDetails, t }) => {
  if (!caseDetails?.representatives?.length) return "";
  
  const complainantAdvocates = caseDetails?.representatives?.filter((rep) =>
    rep?.representing?.some((lit) => lit?.partyType?.includes("complainant"))
  );
  const accusedAdvocates = caseDetails?.representatives?.filter((rep) => 
    rep?.representing?.some((lit) => lit?.partyType?.includes("respondent"))
  );
  
  const complainantAdvocateName =
    complainantAdvocates?.length > 0
      ? `${complainantAdvocates?.[0]?.additionalDetails?.advocateName} (C)${
          complainantAdvocates?.length > 1
            ? ` ${t("CS_COMMON_AND")} ${complainantAdvocates?.length - 1} ${
                complainantAdvocates?.length === 2 ? t("CS_COMMON_OTHER") : t("CS_COMMON_OTHERS")
              }`
            : ""
        }`
      : "";
      
  const accusedAdvocateName =
    accusedAdvocates?.length > 0
      ? `${accusedAdvocates?.[0]?.additionalDetails?.advocateName} (A)${
          accusedAdvocates?.length > 1
            ? ` ${t("CS_COMMON_AND")} ${accusedAdvocates?.length - 1} ${
                accusedAdvocates?.length === 2 ? t("CS_COMMON_OTHER") : t("CS_COMMON_OTHERS")
              }`
            : ""
        }`
      : "";
      
  return `${t("CS_COMMON_ADVOCATES")}: ${complainantAdvocateName} ${accusedAdvocateName ? ", " + accusedAdvocateName : ""}`;
};
