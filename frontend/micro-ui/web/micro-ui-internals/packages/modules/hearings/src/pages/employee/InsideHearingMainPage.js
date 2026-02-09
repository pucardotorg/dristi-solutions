import { TextArea } from "@egovernments/digit-ui-components";
import { ActionBar, CardLabel, Dropdown, LabelFieldPair, Button } from "@egovernments/digit-ui-react-components";
import debounce from "lodash/debounce";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { Urls } from "../../hooks/services/Urls";
import AddParty from "./AddParty";
import AdjournHearing from "./AdjournHearing";
import EndHearing from "./EndHearing";
import EvidenceHearingHeader from "./EvidenceHeader";
import HearingSideCard from "./HearingSideCard";
import MarkAttendance from "./MarkAttendance";
import useGetHearingLink from "../../hooks/hearings/useGetHearingLink";
import isEmpty from "lodash/isEmpty";

import TasksComponent from "../../../../home/src/components/TaskComponent";
import { SubmissionWorkflowState } from "@egovernments/digit-ui-module-dristi/src/Utils/submissionWorkflow";
import { getFormattedName } from "../../utils";
import { getAdvocates } from "@egovernments/digit-ui-module-orders/src/utils/caseUtils";
import { constructFullName, removeInvalidNameParts } from "@egovernments/digit-ui-module-orders/src/utils";
import { Loader } from "@egovernments/digit-ui-react-components";
import { BreadCrumbsParamsDataContext } from "@egovernments/digit-ui-module-core";

const SECOND = 1000;

const InsideHearingMainPage = () => {
  const history = useHistory();
  const [activeTab, setActiveTab] = useState("Transcript/Summary");
  const [transcriptText, setTranscriptText] = useState("");
  const [hearing, setHearing] = useState({});
  const [witnessDepositionText, setWitnessDepositionText] = useState("");
  const [options, setOptions] = useState([]);
  const [additionalDetails, setAdditionalDetails] = useState({});
  const [selectedWitness, setSelectedWitness] = useState({});
  const [addPartyModal, setAddPartyModal] = useState(false);
  const [adjournHearing, setAdjournHearing] = useState(false);
  const [endHearingModalOpen, setEndHearingModalOpen] = useState(false);
  const textAreaRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const { hearingId, filingNumber } = Digit.Hooks.useQueryParams();
  const [isItemPending, setIsItemPending] = useState(false);
  const courtId = localStorage.getItem("courtId");
  const { t } = useTranslation();
  const isInitialLoad = useRef(true);
  const userInfo = Digit?.UserService?.getUser?.()?.info;
  const { BreadCrumbsParamsData, setBreadCrumbsParamsData } = useContext(BreadCrumbsParamsDataContext);
  const { caseId: caseIdFromBreadCrumbs, filingNumber: filingNumberFromBreadCrumbs } = BreadCrumbsParamsData;

  const roles = useMemo(() => userInfo?.roles, [userInfo]);
  const isEpostUser = useMemo(() => roles?.some((role) => role?.code === "POST_MANAGER"), [roles]);

  const onCancel = () => {
    setAddPartyModal(false);
  };

  const onClickAddWitness = () => {
    setAddPartyModal(true);
  };

  const userType = Digit?.UserService?.getType?.();
  let homePath = `/${window?.contextPath}/${userType}/home/home-pending-task`;
  if (!isEpostUser && userType === "employee") homePath = `/${window?.contextPath}/${userType}/home/home-screen`;

  const { data: caseData, isLoading: isCaseLoading, refetch: refetchCase } = Digit.Hooks.dristi.useSearchCaseService(
    {
      criteria: [
        {
          filingNumber,
          ...(courtId && userType === "employee" && { courtId }),
        },
      ],
      tenantId,
    },
    {},
    `case-details-${filingNumber}`,
    filingNumber,
    Boolean(filingNumber)
  );
  const isBreadCrumbsParamsDataSet = useRef(false);
  const caseId = caseData?.criteria?.[0]?.responseList?.[0]?.id;

  useEffect(() => {
    if (
      caseId &&
      filingNumber &&
      !isBreadCrumbsParamsDataSet.current &&
      (caseId !== caseIdFromBreadCrumbs || filingNumber !== filingNumberFromBreadCrumbs)
    ) {
      isBreadCrumbsParamsDataSet.current = true;
      setBreadCrumbsParamsData({
        caseId,
        filingNumber,
      });
    }
  }, [caseId, caseIdFromBreadCrumbs, filingNumber, filingNumberFromBreadCrumbs, setBreadCrumbsParamsData]);

  const caseDetails = useMemo(() => {
    return caseData?.criteria?.[0]?.responseList?.[0];
  }, [caseData]);

  const caseCourtId = useMemo(() => caseDetails?.courtId, [caseDetails]);

  if (!hearingId) {
    const contextPath = window?.contextPath || "";
    history.push(`/${contextPath}/${userType}/home/pending-task`);
  }

  const userInfoType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo]);
  const userRoles = Digit?.UserService?.getUser?.()?.info?.roles || [];

  const userHasRole = (userRole) => {
    return userRoles.some((role) => role.code === userRole);
  };

  const disableTextArea = !userHasRole("EMPLOYEE");
  // if (!userHasRole("HEARING_VIEWER")) {
  //   history.push(`/${window.contextPath}/${userType}/home/home-pending-task`);
  // }

  const { data: hearingLink } = useGetHearingLink();
  const hearingVcLink = hearingLink?.[0];
  const refetchTime = disableTextArea ? 10 * SECOND : "";
  const reqBody = {
    hearing: { tenantId },
    criteria: {
      tenantID: tenantId,
      hearingId: hearingId,
    },
  };
  const { data: hearingsData, refetch: refetchHearing = () => {} } = Digit.Hooks.hearings.useGetHearings(
    reqBody,
    { applicationNumber: "", cnrNumber: "", hearingId, ...(caseCourtId && { courtId: caseCourtId }) },
    "dristi",
    Boolean(hearingId && caseCourtId),
    refetchTime
  );

  const { mutateAsync: _updateTranscriptRequest } = Digit.Hooks.useCustomAPIMutationHook({
    url: Urls.hearing.hearingUpdateTranscript,
    params: { applicationNumber: "", cnrNumber: "" },
    body: { tenantId, hearingType: "", status: "" },
    config: {
      mutationKey: "updateTranscript",
    },
  });

  const updateTranscriptRequest = useMemo(
    () =>
      debounce(
        (...args) =>
          _updateTranscriptRequest(...args).then((res) => {
            setHearing(res.hearing);
          }),
        1000
      ),
    [_updateTranscriptRequest]
  );

  const { data: applicationData, isLoading: isApplicationLoading } = Digit.Hooks.submissions.useSearchSubmissionService(
    {
      criteria: {
        filingNumber,
        tenantId,
        ...(caseCourtId && { courtId: caseCourtId }),
      },
      tenantId,
    },
    {},
    filingNumber + "allApplications",
    Boolean(filingNumber && caseCourtId)
  );

  const isDelayApplicationPending = useMemo(() => {
    return Boolean(
      applicationData?.applicationList?.some(
        (item) =>
          item?.applicationType === "DELAY_CONDONATION" &&
          [SubmissionWorkflowState.PENDINGAPPROVAL, SubmissionWorkflowState.PENDINGREVIEW].includes(item?.status)
      )
    );
  }, [applicationData]);

  const isDelayApplicationCompleted = useMemo(
    () =>
      Boolean(
        applicationData?.applicationList?.some(
          (item) => item?.applicationType === "DELAY_CONDONATION" && [SubmissionWorkflowState.COMPLETED].includes(item?.status)
        )
      ),
    [applicationData]
  );

  const delayCondonationData = useMemo(() => caseDetails?.caseDetails?.delayApplications?.formdata?.[0]?.data, [caseDetails]);

  useEffect(() => {
    if (hearingsData) {
      const hearingData = hearingsData?.HearingList?.[0];
      // hearing data with particular id will always give array of one object
      if (hearingData) {
        setHearing(hearingData);
        setTranscriptText(hearingData?.hearingSummary || "");
      }
    }
  }, [hearingsData]);
  const allAdvocates = useMemo(() => getAdvocates(caseDetails), [caseDetails]);

  const complainants = useMemo(() => {
    return (
      caseDetails?.litigants
        ?.filter((item) => item?.partyType?.includes("complainant"))
        ?.map((item) => {
          const fullName = removeInvalidNameParts(item?.additionalDetails?.fullName);
          const poaHolder = caseDetails?.poaHolders?.find((poa) => poa?.individualId === item?.individualId);
          if (poaHolder) {
            return {
              code: fullName,
              name: `${fullName} (Complainant, PoA Holder)`,
              uuid: allAdvocates[item?.additionalDetails?.uuid],
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

  const respondents = useMemo(() => {
    return (
      caseDetails?.litigants
        ?.filter((item) => item?.partyType?.includes("respondent"))
        .map((item) => {
          const fullName = removeInvalidNameParts(item?.additionalDetails?.fullName);
          const uniqueId = caseDetails?.additionalDetails?.respondentDetails?.formdata?.find(
            (obj) => obj?.data?.respondentVerification?.individualDetails?.individualId === item?.individualId
          )?.uniqueId;
          return {
            code: fullName,
            name: `${fullName} (Accused)`,
            uuid: allAdvocates[item?.additionalDetails?.uuid],
            partyUuid: item?.additionalDetails?.uuid,
            individualId: item?.individualId,
            isJoined: true,
            partyType: "respondent",
            uniqueId,
          };
        }) || []
    );
  }, [caseDetails, allAdvocates]);

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

  const allParties = useMemo(() => [...complainants, ...poaHolders, ...respondents, ...unJoinedLitigant], [
    complainants,
    poaHolders,
    respondents,
    unJoinedLitigant,
  ]);

  useEffect(() => {
    setAdditionalDetails(caseDetails?.additionalDetails);
    const witnessOptions =
      caseDetails?.witnessDetails?.map((witness) => ({
        label: getFormattedName(witness?.firstName, witness?.middleName, witness?.lastName, witness?.witnessDesignation),
        value: witness?.uuid,
      })) || [];

    const advocateOptions =
      caseDetails?.representatives?.map((rep) => ({
        label: rep?.additionalDetails?.advocateName,
        value: rep?.advocateId,
      })) || [];

    const partiesOption =
      allParties
        ?.filter((party) => party?.isJoined === true)
        .map((party) => ({
          label: party?.name,
          value: party?.partyType === "poaHolder" ? party?.individualId : party?.partyUuid,
        })) || [];

    const combinedOptions = [...witnessOptions, ...advocateOptions, ...partiesOption];
    setOptions(combinedOptions);

    if (isInitialLoad.current) {
      const selectedWitnessDefault = caseDetails?.witnessDetails?.[0] || {};
      setSelectedWitness(selectedWitnessDefault);
      setWitnessDepositionText(
        hearing?.additionalDetails?.witnessDepositions?.find((witness) => witness.uuid === selectedWitnessDefault?.uuid)?.deposition || ""
      );
      isInitialLoad.current = false;
    }
  }, [caseDetails, hearing?.additionalDetails?.witnessDepositions, hearingsData, allParties]);

  const handleModal = () => {
    setIsOpen(!isOpen);
  };

  const updateAPICall = (newText) => {
    const newHearingUpdated = structuredClone(hearing);
    if (!Array.isArray(newHearingUpdated.transcript)) {
      newHearingUpdated.transcript = [];
    }
    newHearingUpdated.transcript[0] = newText;
    if (userHasRole("EMPLOYEE") && !disableTextArea) {
      updateTranscriptRequest({ body: { hearing: newHearingUpdated } });
    }
  };

  useEffect(() => {
    if (hearingsData && transcriptText) {
      const hearingData = hearingsData?.HearingList?.[0];
      if (hearingData && transcriptText !== hearingData?.transcript?.[0] && !disableTextArea) {
        updateAPICall(transcriptText);
      }
    }
  }, [transcriptText, setTranscriptText, hearingsData, disableTextArea]);

  const handleDropdownChange = (selectedWitnessOption) => {
    const selectedUUID = selectedWitnessOption.value;

    let selectedData = caseDetails?.witnessDetails?.find((w) => w.uuid === selectedUUID);

    if (!selectedData) {
      const attendee = hearing?.attendees?.find((a) => a.individualId === selectedUUID);
      if (attendee) {
        selectedData = {
          ...attendee,
          uuid: attendee.individualId,
        };
      }
    }

    if (!selectedData) {
      const party = allParties?.find((p) => p.partyUuid === selectedUUID);
      if (party) {
        selectedData = {
          ...party,
          uuid: party.partyUuid,
        };
      }
    }

    if (!selectedData) {
      const advocate = caseDetails?.representatives?.find((adv) => adv?.advocateId === selectedUUID);
      if (advocate) {
        selectedData = {
          ...advocate,
          uuid: advocate?.advocateId,
        };
      }
    }

    setSelectedWitness(selectedData || {});
    setWitnessDepositionText(hearing?.additionalDetails?.witnessDepositions?.find((w) => w.uuid === selectedUUID)?.deposition || "");
  };

  const handleEndHearingModal = () => {
    setEndHearingModalOpen(!endHearingModalOpen);
  };

  const handleExitHearing = () => {
    history.push(homePath);
  };

  const attendanceCount = useMemo(() => hearing?.attendees?.filter((attendee) => attendee.wasPresent)?.length || 0, [hearing]);
  const [taskType, setTaskType] = useState({});

  const IsSelectedWitness = useMemo(() => {
    return !isEmpty(selectedWitness);
  }, [selectedWitness]);

  if (isCaseLoading || isApplicationLoading) {
    return <Loader />;
  }

  return (
    <div className="admitted-case" style={{ display: "flex" }}>
      <div className="left-side" style={{ padding: "24px 40px" }}>
        <React.Fragment>
          <EvidenceHearingHeader
            caseData={caseDetails}
            hearing={hearing}
            setActiveTab={setActiveTab}
            activeTab={activeTab}
            filingNumber={filingNumber}
            onAddParty={onClickAddWitness}
            hearingLink={hearingVcLink}
            delayCondonationData={delayCondonationData}
            isDelayApplicationPending={
              (delayCondonationData?.isDcaSkippedInEFiling?.code === "NO" && isDelayApplicationPending) ||
              isDelayApplicationPending ||
              isDelayApplicationCompleted
            }
          ></EvidenceHearingHeader>
        </React.Fragment>
        {activeTab === "Witness Deposition" && (
          <div style={{ width: "100%", marginTop: "15px", marginBottom: "10px" }}>
            <LabelFieldPair className="case-label-field-pair">
              <CardLabel className="case-input-label">{`Select Witness`}</CardLabel>
              <Dropdown
                t={t}
                option={options}
                optionKey={"label"}
                select={handleDropdownChange}
                freeze={true}
                disable={false}
                selected={
                  IsSelectedWitness
                    ? {
                        label: getFormattedName(
                          selectedWitness?.firstName || selectedWitness?.name || selectedWitness?.additionalDetails?.advocateName,
                          selectedWitness?.middleName,
                          selectedWitness?.lastName,
                          selectedWitness?.witnessDesignation
                        ),
                        value: selectedWitness?.uuid,
                      }
                    : {}
                }
                style={{ width: "100%", height: "40px", fontSize: "16px" }}
              />
            </LabelFieldPair>
          </div>
        )}
        <div style={{ padding: "40px, 40px", gap: "16px" }}>
          <div style={{ gap: "16px", border: "1px solid", marginTop: "2px" }}>
            <React.Fragment>
              {activeTab === "Witness Deposition" && (
                <TextArea
                  style={{
                    width: "100%",
                    minHeight: "40vh",
                    cursor: "default",
                    backgroundColor: "#E8E8E8",
                    color: "#3D3C3C",
                    pointerEvents: "unset !important",
                  }}
                  value={IsSelectedWitness ? witnessDepositionText || "" : ""}
                  disabled
                />
              )}
              {activeTab !== "Witness Deposition" && (
                <TextArea
                  style={{
                    width: "100%",
                    minHeight: "40vh",
                    cursor: "default",
                    backgroundColor: "#E8E8E8",
                    color: "#3D3C3C",
                    pointerEvents: "unset !important",
                  }}
                  value={transcriptText || ""}
                  disabled
                />
              )}
            </React.Fragment>
          </div>
        </div>
      </div>
      <div className="right-side" style={{ borderLeft: "1px solid lightgray" }}>
        <HearingSideCard hearingId={hearingId} caseId={caseDetails?.id} filingNumber={filingNumber}></HearingSideCard>
        {adjournHearing && (
          <AdjournHearing
            hearing={hearing}
            updateTranscript={_updateTranscriptRequest}
            transcriptText={transcriptText}
            setAdjournHearing={setAdjournHearing}
            disableTextArea={disableTextArea}
            setTranscriptText={setTranscriptText}
          />
        )}
        <TasksComponent
          taskType={taskType}
          setTaskType={setTaskType}
          userInfoType={userInfoType}
          filingNumber={filingNumber}
          inCase={true}
          taskIncludes={["Review Delay Condonation application", "Admit/Dismiss case"]}
        />
      </div>
      <ActionBar>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "16px",
            }}
          >
            <Button
              label={t("ATTENDANCE_CHIP")}
              style={{ boxShadow: "none", backgroundColor: "#ECF3FD", borderRadius: "4px", border: "none", padding: "10px" }}
              textStyles={{
                fontFamily: "Roboto",
                fontSize: "16px",
                fontWeight: 400,
                lineHeight: "18.75px",
                textAlign: "center",
                color: "#0F3B8C",
              }}
            >
              <h2
                style={{
                  paddingLeft: "4px",
                  fontFamily: "Roboto",
                  fontSize: "16px",
                  lineHeight: "18.75px",
                  textAlign: "center",
                  color: "#0F3B8C",
                  fontWeight: "700",
                }}
              >
                {`${attendanceCount}`}
              </h2>
            </Button>
          </div>

          <Button
            label={t("EXIT_HEARING")}
            variation={"primary"}
            onButtonClick={handleExitHearing}
            style={{ boxShadow: "none", backgroundColor: "#007e7e", border: "none", padding: "10px", width: "166px" }}
            textStyles={{
              fontFamily: "Roboto",
              fontSize: "16px",
              fontWeight: 700,
              lineHeight: "18.75px",
              textAlign: "center",
              color: "#ffffff",
            }}
          />
        </div>
      </ActionBar>
      {isOpen && (
        <MarkAttendance
          handleModal={handleModal}
          attendees={hearing.attendees || []}
          refetchHearing={refetchHearing}
          hearingData={hearing}
          setAddPartyModal={setAddPartyModal}
        />
      )}
      <div>
        {addPartyModal && (
          <AddParty
            onCancel={onCancel}
            onAddSuccess={() => {
              refetchCase();
            }}
            caseDetails={caseDetails}
            tenantId={tenantId}
            hearing={hearing}
            refetchHearing={refetchHearing}
          ></AddParty>
        )}
      </div>
      {endHearingModalOpen && (
        <EndHearing
          handleEndHearingModal={handleEndHearingModal}
          hearingId={hearingId}
          hearing={hearing}
          transcriptText={transcriptText}
          disableTextArea={disableTextArea}
          setTranscriptText={setTranscriptText}
          isItemPending={isItemPending}
        />
      )}
    </div>
  );
};

export default InsideHearingMainPage;
