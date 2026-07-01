import React, { useEffect, useMemo } from "react";
import { Loader } from "@egovernments/digit-ui-react-components";
import ApplicationAwaitingPage from "./ApplicationAwaitingPage";
import TakeUserToRegistration from "./TakeUserToRegistration";
import { userTypeOptions } from "../registration/config";
import { useGetAccessToken } from "../../../hooks/useGetAccessToken";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import Modal from "../../../components/Modal";
import { Heading } from "../../../components/ModalComponents";

function CitizenHome({ tenantId, setHideBack = () => {} }) {
  const Digit = window?.Digit || {};
  const token = window.localStorage.getItem("token");
  const isUserLoggedIn = Boolean(token);
  const { t } = useTranslation();
  const moduleCode = "DRISTI";
  const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
  const userInfoType = Digit.UserService.getType();
  const history = useHistory();
  const { refetchIndividual } = Digit.Hooks.useQueryParams();

  useEffect(() => {
    if (refetchIndividual === "true" || refetchIndividual === true) {
      const event = new CustomEvent("refetchIndividualData");
      window.dispatchEvent(event);
    }
  }, [refetchIndividual]);

  const { data, isLoading } = Digit.Hooks.dristi.useGetIndividualUser(
    {
      Individual: {
        userUuid: [userInfo?.uuid],
      },
    },
    { tenantId, limit: 1000, offset: 0 },
    moduleCode,
    "HOME",
    userInfo?.uuid && isUserLoggedIn
  );

  const individualId = useMemo(() => data?.Individual?.[0]?.individualId, [data?.Individual]);
  const isLitigantPartialRegistered = useMemo(() => {
    if (userInfoType !== "citizen") return false;

    if (!data?.Individual || data?.Individual.length === 0) return false;

    if (data?.Individual[0]?.userDetails?.roles?.some((role) => role?.code === "ADVOCATE_ROLE" || role?.code === "ADVOCATE_CLERK_ROLE")) return false;

    const address = data?.Individual[0]?.address;
    return !address || (Array.isArray(address) && address.length === 0);
  }, [data?.Individual, userInfoType]);

  const userType = useMemo(() => data?.Individual?.[0]?.additionalFields?.fields?.find((obj) => obj.key === "userType")?.value, [data?.Individual]);
  const { data: searchData, isLoading: isSearchLoading, isFetching: refetchingAdvocateClerk } = Digit?.Hooks?.dristi?.useGetAdvocateClerk(
    {
      criteria: [{ individualId }],
      tenantId,
    },
    { tenantId },
    individualId + (userType || ""),
    Boolean(isUserLoggedIn && individualId && userType && userType !== "LITIGANT"),
    userType === "ADVOCATE" ? "/advocate/v1/_search" : "/advocate/clerk/v1/_search"
  );

  const userTypeDetail = useMemo(() => {
    return userTypeOptions.find((item) => item.code === userType) || {};
  }, [userType]);

  const searchResult = useMemo(() => {
    return searchData?.[`${userTypeDetail?.apiDetails?.requestKey}s`]?.[0]?.responseList;
  }, [searchData, userTypeDetail?.apiDetails?.requestKey]);

  const isAdvocateMissingDetails = useMemo(() => {
    if (!data?.Individual || data?.Individual?.length === 0) return false;
    const individual = data?.Individual[0];
    if (!individual?.userDetails?.roles?.some((role) => role?.code === "ADVOCATE_ROLE")) return false;
    if (!Array.isArray(searchResult) || searchResult.length === 0) return false;

    const hasAddress = Array?.isArray(individual?.address) && individual?.address?.length > 0;
    const hasIdentifiers = Array?.isArray(individual?.identifiers) && individual?.identifiers?.length > 0;
    const identifierIdDetails = individual?.additionalFields?.fields?.find((f) => f?.key === "identifierIdDetails")?.value;
    const hasIdentifierIdDetails = Boolean(identifierIdDetails) && identifierIdDetails !== "{}" && identifierIdDetails !== "null";

    return !hasAddress || !hasIdentifiers || !hasIdentifierIdDetails;
  }, [data?.Individual, searchResult]);

  const isApprovalPending = useMemo(() => {
    return (
      userType !== "LITIGANT" &&
      Array.isArray(searchResult) &&
      searchResult?.length > 0 &&
      searchResult?.[0]?.isActive === false &&
      searchResult?.[0]?.status !== "INACTIVE"
    );
  }, [searchResult, userType]);
  const isRejected = useMemo(() => {
    return (
      userType !== "LITIGANT" &&
      Array.isArray(searchResult) &&
      searchResult?.length > 0 &&
      searchResult?.[0]?.isActive === false &&
      searchResult?.[0]?.status === "INACTIVE"
    );
  }, [searchResult, userType]);

  const rejectionReason = useMemo(() => {
    if (!isRejected) return null;
    return searchResult?.find((obj) => obj?.status === "INACTIVE")?.workflow?.comments || "NA";
  }, [isRejected, searchResult]);

  const userHasIncompleteRegistration = useMemo(() => !individualId || isRejected || searchResult?.length === 0 || isLitigantPartialRegistered, [
    individualId,
    isLitigantPartialRegistered,
    isRejected,
    searchResult?.length,
  ]);

  const registrationIsDoneApprovalIsPending = individualId && isApprovalPending && !isRejected && !isLitigantPartialRegistered;

  useEffect(() => {
    if (!data || (userType !== "LITIGANT" && !searchData)) return;
    if (
      individualId &&
      !isApprovalPending &&
      !isRejected &&
      !isLitigantPartialRegistered &&
      !isAdvocateMissingDetails &&
      (userType !== "ADVOCATE" || (userType === "ADVOCATE" && searchResult?.length > 0))
    ) {
      history.push(`/${window?.contextPath}/citizen/home/home-pending-task`);
    }
  }, [
    individualId,
    isLitigantPartialRegistered,
    isRejected,
    history,
    isApprovalPending,
    searchResult,
    data,
    searchData,
    userType,
    isAdvocateMissingDetails,
  ]);

  useEffect(() => {
    setHideBack(userHasIncompleteRegistration || registrationIsDoneApprovalIsPending);
    return () => {
      setHideBack(false);
    };
  }, [userHasIncompleteRegistration, registrationIsDoneApprovalIsPending, setHideBack]);

  useEffect(() => {
    setHideBack(userHasIncompleteRegistration || registrationIsDoneApprovalIsPending);
    return () => {
      setHideBack(false);
    };
  }, [userHasIncompleteRegistration, registrationIsDoneApprovalIsPending, setHideBack]);

  useGetAccessToken("citizen.refresh-token", individualId && !isApprovalPending && !isRejected);

  if (isLoading || isSearchLoading || refetchingAdvocateClerk) {
    return <Loader />;
  }

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "30px",
        cursor: "pointer",
        justifyContent: "space-evenly",
        width: "100%",
      }}
    >
      {registrationIsDoneApprovalIsPending && <ApplicationAwaitingPage individualId={individualId} />}
      {userHasIncompleteRegistration && (
        <TakeUserToRegistration
          message={isRejected ? `${t("CS_REJECT_MESSAGE")} due to ${rejectionReason}. ${t("KINDLY_REGISTER_AGAIN")}` : t("CS_REGISTRATION_MESSAGE")}
          isRejected={isRejected}
          isLitigantPartialRegistered={isLitigantPartialRegistered}
          data={data}
          advocate={searchResult?.[0]}
        />
      )}
      {isAdvocateMissingDetails && (
        <Modal
          headerBarMain={<Heading label={t("PROFILE_DETAILS_MISSING")} />}
          headerBarEnd={null}
          actionSaveLabel={t("CS_COMMON_CONTINUE")}
          actionSaveOnSubmit={() => history.push(`/${window?.contextPath}/citizen/dristi/home/advocate-profile-update/user-address`)}
          hideSubmit={false}
          popupStyles={{ zIndex: 1000 }}
        >
          <div style={{ padding: "16px 0" }}>{t("ADVOCATE_PROFILE_DETAILS_MISSING_MSG")}</div>
        </Modal>
      )}
    </div>
  );
}

export default CitizenHome;
