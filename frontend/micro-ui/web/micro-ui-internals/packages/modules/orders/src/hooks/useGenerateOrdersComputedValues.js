import { useMemo, useEffect, useState } from "react";
import { HearingWorkflowState } from "../utils/hearingWorkflow";
import { SubmissionWorkflowState } from "../utils/submissionWorkflow";
import { getAdvocates, getAdvocatesNames, getuuidNameMap } from "../utils/caseUtils";
import { constructFullName, getFormattedName, removeInvalidNameParts } from "../utils";
import { CaseWorkflowState } from "@egovernments/digit-ui-module-dristi/src/Utils/caseWorkflow";

/**
 * useGenerateOrdersComputedValues
 *
 * Aggregates all derived/computed values from hearings data, case details,
 * and application data into a single hook. Zero business logic changes.
 */
const useGenerateOrdersComputedValues = ({
  hearingsData,
  caseDetails,
  applicationData,
  currentOrder,
  orderTypeData,
  warrantSubType,
  tenantId,
  approveRejectLitigantDetailsChangeOrderData,
  publishedBailOrdersData,
}) => {
  const [respondents, setRespondents] = useState([]);

  // ── Hearing selectors ─────────────────────────────────────────────────────
  const publishedLitigantDetailsChangeOrders = useMemo(() => approveRejectLitigantDetailsChangeOrderData?.list || [], [
    approveRejectLitigantDetailsChangeOrderData,
  ]);
  const publishedBailOrder = useMemo(() => publishedBailOrdersData?.list?.[0] || {}, [publishedBailOrdersData]);

  const applicationDetails = useMemo(
    () =>
      applicationData?.applicationList?.find(
        (application) => application?.applicationNumber === currentOrder?.additionalDetails?.formdata?.refApplicationId
      ),
    [applicationData, currentOrder]
  );

  const hearingId = useMemo(() => currentOrder?.hearingNumber || applicationDetails?.additionalDetails?.hearingId || "", [
    applicationDetails,
    currentOrder,
  ]);

  const currentInProgressHearing = useMemo(() => hearingsData?.HearingList?.find((list) => list?.status === "IN_PROGRESS"), [
    hearingsData?.HearingList,
  ]);

  const currentScheduledHearing = useMemo(() => hearingsData?.HearingList?.find((list) => ["SCHEDULED"]?.includes(list?.status)), [
    hearingsData?.HearingList,
  ]);

  const currentOptOutHearing = useMemo(() => hearingsData?.HearingList?.find((list) => ["OPT_OUT"]?.includes(list?.status)), [
    hearingsData?.HearingList,
  ]);

  const todayScheduledHearing = useMemo(() => {
    const now = new Date();
    const fromDate = new Date(now.setHours(0, 0, 0, 0)).getTime();
    const toDate = new Date(now.setHours(23, 59, 59, 999)).getTime();
    return hearingsData?.HearingList?.find((list) => list?.status === "SCHEDULED" && list?.startTime >= fromDate && list?.startTime <= toDate);
  }, [hearingsData?.HearingList]);

  const lastCompletedHearing = useMemo(() => {
    if (!hearingsData?.HearingList) return null;
    return hearingsData.HearingList.filter((list) => list?.status === "COMPLETED").reduce(
      (latest, current) => (!latest || (current?.endTime || 0) > (latest?.endTime || 0) ? current : latest),
      null
    );
  }, [hearingsData?.HearingList]);

  const hearingDetails = useMemo(() => hearingsData?.HearingList?.[0], [hearingsData]);
  const hearingsList = useMemo(() => hearingsData?.HearingList?.sort((a, b) => b.startTime - a.startTime), [hearingsData]);

  const attendeeOptions = useMemo(() => {
    if (!Array.isArray(hearingDetails?.attendees)) return [];
    return hearingDetails?.attendees.map((attendee) => ({
      ...attendee,
      partyType: attendee?.type,
      value: attendee.individualId || attendee.name,
      label: attendee.name,
    }));
  }, [hearingDetails?.attendees]);

  const isHearingScheduled = useMemo(() => {
    return (hearingsData?.HearingList || []).some((hearing) => hearing?.status === HearingWorkflowState.SCHEDULED);
  }, [hearingsData]);

  const isHearingInProgress = useMemo(() => {
    return (hearingsData?.HearingList || []).some((hearing) => hearing?.status === HearingWorkflowState.INPROGRESS);
  }, [hearingsData]);

  const isHearingInPassedOver = useMemo(() => {
    return (hearingsData?.HearingList || []).some((hearing) => hearing?.status === HearingWorkflowState.PASSED_OVER);
  }, [hearingsData]);

  const isHearingOptout = useMemo(() => {
    return (hearingsData?.HearingList || []).some((hearing) => hearing?.status === HearingWorkflowState.OPTOUT);
  }, [hearingsData]);

  // ── Case detail selectors ──────────────────────────────────────────────────
  const cnrNumber = useMemo(() => caseDetails?.cnrNumber, [caseDetails]);
  const allAdvocates = useMemo(() => getAdvocates(caseDetails), [caseDetails]);
  const allAdvocatesNames = useMemo(() => getAdvocatesNames(caseDetails), [caseDetails]);
  const uuidNameMap = useMemo(() => getuuidNameMap(caseDetails), [caseDetails]);
  const isCaseAdmitted = useMemo(() => caseDetails?.status === CaseWorkflowState.CASE_ADMITTED, [caseDetails?.status]);

  const complainants = useMemo(() => {
    return (
      caseDetails?.litigants
        ?.filter((item) => item?.partyType?.includes("complainant"))
        ?.map((item) => {
          const fullName = removeInvalidNameParts(item?.additionalDetails?.fullName);
          const mobileNumber = caseDetails?.additionalDetails?.complainantDetails?.formdata?.find(
            (obj) => obj?.data?.complainantVerification?.individualDetails?.individualId === item?.individualId
          )?.data?.complainantVerification?.mobileNumber;
          const poaHolder = caseDetails?.poaHolders?.find((poa) => poa?.individualId === item?.individualId);
          const complainantPoaHolder = caseDetails?.poaHolders?.find((poa) =>
            poa?.representingLitigants?.some((lit) => lit?.individualId === item?.individualId)
          );
          if (poaHolder) {
            return {
              code: fullName,
              name: `${fullName} (Complainant, PoA Holder)`,
              uuid: allAdvocates[item?.additionalDetails?.uuid],
              mobileNumber,
              partyUuid: item?.additionalDetails?.uuid,
              individualId: item?.individualId,
              isJoined: true,
              partyType: "complainant",
              representingLitigants: poaHolder?.representingLitigants?.map((lit) => lit?.individualId),
            };
          }
          return {
            code: fullName,
            name: `${fullName} (Complainant)`,
            uuid: allAdvocates[item?.additionalDetails?.uuid],
            mobileNumber,
            poaUuid: complainantPoaHolder?.additionalDetails?.uuid,
            partyUuid: item?.additionalDetails?.uuid,
            individualId: item?.individualId,
            isJoined: true,
            partyType: "complainant",
          };
        }) || []
    );
  }, [caseDetails, allAdvocates]);

  const poaHolders = useMemo(() => {
    const complainantIds = new Set(complainants?.map((c) => c?.individualId));
    return (
      caseDetails?.poaHolders
        ?.filter((item) => !complainantIds.has(item?.individualId))
        ?.map((item) => {
          const fullName = removeInvalidNameParts(item?.name);
          return {
            code: fullName,
            name: `${fullName} (PoA Holder)`,
            representingLitigants: item?.representingLitigants?.map((lit) => lit?.individualId),
            individualId: item?.individualId,
            isJoined: true,
            partyType: "poaHolder",
          };
        }) || []
    );
  }, [caseDetails, complainants]);

  // Respondents require an async fetch — kept as useState + useEffect
  useEffect(() => {
    if (!caseDetails?.litigants?.length) return;

    const fetchRespondents = async () => {
      const litigants = caseDetails?.litigants?.filter((item) => item?.partyType?.includes("respondent")) || [];

      const results = await Promise?.all(
        litigants?.map(async (item) => {
          const fullName = removeInvalidNameParts(item?.additionalDetails?.fullName);
          const uniqueId = caseDetails?.additionalDetails?.respondentDetails?.formdata?.find(
            (obj) => obj?.data?.respondentVerification?.individualDetails?.individualId === item?.individualId
          )?.uniqueId;

          const userResult = await Digit.UserService.userSearch(tenantId, { uuid: [item?.additionalDetails?.uuid] }, {});
          const userData = userResult?.user?.[0];

          const respondentPoaHolder = caseDetails?.poaHolders?.find((poa) =>
            poa?.representingLitigants?.some((lit) => lit?.individualId === item?.individualId)
          );
          return {
            code: fullName,
            name: `${fullName} (Accused)`,
            uuid: allAdvocates[item?.additionalDetails?.uuid],
            mobileNumber: userData?.mobileNumber,
            poaUuid: respondentPoaHolder?.additionalDetails?.uuid,
            partyUuid: item?.additionalDetails?.uuid,
            individualId: item?.individualId,
            isJoined: true,
            partyType: "respondent",
            uniqueId,
          };
        })
      );

      setRespondents(results);
    };

    fetchRespondents();
  }, [allAdvocates, caseDetails, tenantId]);

  const unJoinedLitigant = useMemo(() => {
    return (
      caseDetails?.additionalDetails?.respondentDetails?.formdata
        ?.filter((data) => !data?.data?.respondentVerification?.individualDetails?.individualId)
        ?.map((data) => {
          const fullName = constructFullName(data?.data?.respondentFirstName, data?.data?.respondentMiddleName, data?.data?.respondentLastName);
          return {
            code: fullName,
            name: `${fullName} (Accused)`,
            uuid: data?.data?.uuid,
            isJoined: false,
            partyType: "respondent",
            uniqueId: data?.uniqueId,
          };
        }) || []
    );
  }, [caseDetails]);

  const witnesses = useMemo(() => {
    return (
      caseDetails?.witnessDetails?.map((data) => {
        const fullName = getFormattedName(data?.firstName, data?.middleName, data?.lastName, data?.witnessDesignation, null);
        return { code: fullName, name: `${fullName} (Witness)`, uuid: data?.uuid, partyType: "witness" };
      }) || []
    );
  }, [caseDetails]);

  const allParties = useMemo(() => [...complainants, ...poaHolders, ...respondents, ...unJoinedLitigant, ...witnesses], [
    complainants,
    poaHolders,
    respondents,
    unJoinedLitigant,
    witnesses,
  ]);

  // ── Application state selectors ───────────────────────────────────────────
  const isDelayApplicationPending = useMemo(() => {
    return Boolean(
      applicationData?.applicationList?.some(
        (item) =>
          item?.applicationType === "DELAY_CONDONATION" &&
          [SubmissionWorkflowState.PENDINGAPPROVAL, SubmissionWorkflowState.PENDINGREVIEW].includes(item?.status)
      )
    );
  }, [applicationData]);

  const isBailApplicationPending = useMemo(() => {
    return Boolean(
      applicationData?.applicationList?.some(
        (item) =>
          item?.applicationType === "REQUEST_FOR_BAIL" &&
          [SubmissionWorkflowState.PENDINGAPPROVAL, SubmissionWorkflowState.PENDINGREVIEW].includes(item?.status)
      )
    );
  }, [applicationData]);

  // ── Warrant sub-type grouping ─────────────────────────────────────────────
  const groupedWarrantOptions = useMemo(() => {
    if (!Array.isArray(warrantSubType)) return [];

    const specific = [];
    const others = [];

    for (const item of warrantSubType) {
      if (item?.belowOthers === "YES") {
        others.push(item);
      } else {
        specific.push(item);
      }
    }

    const result = [];
    if (specific.length) result.push({ options: specific });
    if (others.length) result.push({ label: "Others", options: others });

    return result;
  }, [warrantSubType]);

  return {
    // Hearing
    publishedLitigantDetailsChangeOrders,
    publishedBailOrder,
    applicationDetails,
    hearingId,
    currentInProgressHearing,
    currentScheduledHearing,
    currentOptOutHearing,
    todayScheduledHearing,
    lastCompletedHearing,
    hearingDetails,
    hearingsList,
    attendeeOptions,
    isHearingScheduled,
    isHearingInProgress,
    isHearingInPassedOver,
    isHearingOptout,
    // Case
    cnrNumber,
    allAdvocates,
    allAdvocatesNames,
    uuidNameMap,
    isCaseAdmitted,
    complainants,
    poaHolders,
    respondents,
    setRespondents,
    unJoinedLitigant,
    witnesses,
    allParties,
    // Application state
    isDelayApplicationPending,
    isBailApplicationPending,
    // Warrant
    groupedWarrantOptions,
  };
};

export default useGenerateOrdersComputedValues;
