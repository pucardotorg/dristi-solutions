import React, { useEffect, useMemo, useState } from "react";
import { Loader } from "@egovernments/digit-ui-react-components";
import ApplicationAwaitingPage from "./ApplicationAwaitingPage";
import TakeUserToRegistration from "./TakeUserToRegistration";
import { userTypeOptions } from "../registration/config";
import { useGetAccessToken } from "../../../hooks/useGetAccessToken";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";

function CitizenHome({ tenantId = "kl", setHideBack = () => {} }) {
  const Digit = window?.Digit || {};
  const token = window.localStorage.getItem("token");
  const isUserLoggedIn = Boolean(token);
  const { t } = useTranslation();
  const moduleCode = "DRISTI";
  const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
  const [isFetching, setIsFetching] = useState(true);
  const [isFetchingAdvoacte, setIsFetchingAdvocate] = useState(true);
  const userInfoType = Digit.UserService.getType();
  const history = useHistory();
  const { data, isLoading, refetch } = Digit.Hooks.dristi.useGetIndividualUser(
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

    if (data?.Individual[0]?.userDetails?.roles?.some((role) => role?.code === "ADVOCATE_ROLE")) return false;

    const address = data?.Individual[0]?.address;
    return !address || (Array.isArray(address) && address.length === 0);
  }, [data?.Individual, userInfoType]);

  const userType = useMemo(() => data?.Individual?.[0]?.additionalFields?.fields?.find((obj) => obj.key === "userType")?.value, [data?.Individual]);
  const { data: searchData, isLoading: isSearchLoading, refetch: refetchAdvocateClerk } = Digit.Hooks.dristi.useGetAdvocateClerk(
    {
      criteria: [{ individualId }],
      tenantId,
    },
    { tenantId },
    moduleCode,
    Boolean(isUserLoggedIn && individualId && userType !== "LITIGANT"),
    userType === "ADVOCATE" ? "/advocate/v1/_search" : "/advocate/clerk/v1/_search"
  );
  useEffect(() => {
    refetch().then(() => {
      refetchAdvocateClerk().then(() => {
        setIsFetchingAdvocate(false);
      });
      setIsFetching(false);
    });
  }, []);

  const userTypeDetail = useMemo(() => {
    return userTypeOptions.find((item) => item.code === userType) || {};
  }, [userType]);

  const searchResult = useMemo(() => {
    return searchData?.[`${userTypeDetail?.apiDetails?.requestKey}s`]?.[0]?.responseList;
  }, [searchData, userTypeDetail?.apiDetails?.requestKey]);

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

  const userHasIncompleteRegistration = useMemo(() => !individualId || isRejected || isLitigantPartialRegistered, [
    individualId,
    isLitigantPartialRegistered,
    isRejected,
  ]);

  const registrationIsDoneApprovalIsPending = individualId && isApprovalPending && !isRejected && !isLitigantPartialRegistered;

  useEffect(() => {
    if (!data || !searchData) return;
    if (individualId && !isApprovalPending && !isRejected && !isLitigantPartialRegistered) {
      history.push(`/${window?.contextPath}/citizen/home/home-pending-task`);
    }
  }, [individualId, isLitigantPartialRegistered, isRejected, history, isApprovalPending, searchResult, data, searchData]);

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

  if (isLoading || isSearchLoading || isFetching || isFetchingAdvoacte) {
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
    </div>
  );
}

export default CitizenHome;
