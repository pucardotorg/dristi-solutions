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
      show: !(fromHome || isCitizen),
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

// Helper: suffix when more than one advocate share a side (C) or (A)
const formatExtraAdvocatesSuffix = (count, t) => {
  if (count <= 1) return "";
  const othersLabel = count === 2 ? t("CS_COMMON_OTHER") : t("CS_COMMON_OTHERS");
  return ` ${t("CS_COMMON_AND")} ${count - 1} ${othersLabel}`;
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
      ? `${complainantAdvocates?.[0]?.additionalDetails?.advocateName} (C)${formatExtraAdvocatesSuffix(complainantAdvocates.length, t)}`
      : "";
      
  const accusedAdvocateName =
    accusedAdvocates?.length > 0
      ? `${accusedAdvocates?.[0]?.additionalDetails?.advocateName} (A)${formatExtraAdvocatesSuffix(accusedAdvocates.length, t)}`
      : "";
      
  return `${t("CS_COMMON_ADVOCATES")}: ${complainantAdvocateName} ${accusedAdvocateName ? ", " + accusedAdvocateName : ""}`;
};
