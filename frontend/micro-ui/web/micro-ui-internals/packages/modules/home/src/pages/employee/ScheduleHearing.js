import React, { useEffect, useMemo, useState } from "react";
import { Button, CardText, CustomDropdown, SubmitBar, TextInput, Modal, Loader, Banner } from "@egovernments/digit-ui-react-components";
import { formatDateInMonth } from "../../utils";
import { useTranslation } from "react-i18next";
import { useHistory, useLocation } from "react-router-dom/cjs/react-router-dom.min";
import useSearchCaseService from "@egovernments/digit-ui-module-dristi/src/hooks/dristi/useSearchCaseService";
import { HomeService, Urls } from "../../hooks/services";
import { InfoCard } from "@egovernments/digit-ui-components";
import { getAuthorizedUuid } from "@egovernments/digit-ui-module-dristi/src/Utils";
import { Heading } from "@egovernments/digit-ui-module-dristi/src/components/ModalComponents";
import CustomToast from "@egovernments/digit-ui-module-dristi/src/components/CustomToast";
import {
  SCHEDULE_HEARING_CUSTOM_DATE_CONFIG,
  ScheduleHearingCloseBtn,
  buildScheduleHearingDraftOrderRequest,
  createScheduleHearingDateClickHandler,
  extractSchedulerOptOutLimitUnit,
  getSuggestedDatesFromRescheduleResponse,
  scheduleHearingDateToEpoch,
  useSyncNextFiveHearingDates,
} from "@egovernments/digit-ui-module-dristi/src/pages/employee/shared/scheduleHearingShared";

const hearingTypeOptions = [{}];

const dropdownConfig = {
  label: "HEARING_TYPE",
  type: "dropdown",
  name: "hearingType",
  optionsKey: "type",
  isMandatory: true,
  options: hearingTypeOptions,
};
function ScheduleHearing({
  config = {
    headModal: "CS_SCHEDULE_HEARING",
  },
  submitModalInfo = {
    shortCaseInfo: [
      {
        key: "CASE_NUMBER",
        value: "",
      },
      {
        key: "COURT_NAME",
        value: "Kerala City Criminal Court",
      },
      {
        key: "CASE_TYPE",
        value: "NIA S138",
      },
    ],
  },
  disabled = true,
  isCaseAdmitted = false,
  showPurposeOfHearing = false,
}) {
  const [showToast, setShowToast] = useState(null);
  const { data: availableDateResponse } = window?.Digit.Hooks.dristi.useJudgeAvailabilityDates(
    {
      SearchCriteria: {
        tenantId: Digit.ULBService.getCurrentTenantId(),
        fromDate: scheduleHearingDateToEpoch(new Date(new Date().setDate(new Date().getDate() + 1))),
      },
    },
    {},
    "",
    true
  );
  const [nextFiveDates] = useSyncNextFiveHearingDates(availableDateResponse);

  const fetchBasicUserInfo = async () => {
    const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
    const userUuid = userInfo?.uuid;
    const authorizedUuid = getAuthorizedUuid(userUuid);
    const individualData = await window?.Digit.DRISTIService.searchIndividualUser(
      {
        Individual: {
          userUuid: [authorizedUuid],
        },
      },
      { tenantId, limit: 1000, offset: 0 },
      "",
      userInfo
    );
    return individualData?.Individual?.[0];
  };

  const { filingNumber, status } = Digit.Hooks.useQueryParams();
  const [modalInfo, setModalInfo] = useState(null);
  const [selectedChip, setSelectedChip] = React.useState(status === "OPTOUT" ? [] : null);
  const [scheduleHearingParams, setScheduleHearingParam] = useState({ purpose: "Admission Purpose" });
  const [selectedCustomDate, setSelectedCustomDate] = useState(new Date());
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
  const [sucessOptOut, setSucessOptOut] = useState(false);
  const [OptOutLimitValue, setOptOutLimitValue] = useState(null);
  const location = useLocation();
  const referenceId = location?.state?.state?.params?.referenceId;

  const CustomCaseInfoDiv = Digit.ComponentRegistryService.getComponent("CustomCaseInfoDiv") || <React.Fragment></React.Fragment>;
  const CustomChooseDate = Digit.ComponentRegistryService.getComponent("CustomChooseDate") || <React.Fragment></React.Fragment>;
  const CustomCalendar = Digit.ComponentRegistryService.getComponent("CustomCalendar") || <React.Fragment></React.Fragment>;
  const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
  const userInfoType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo]);
  const OrderWorkflowAction = Digit.ComponentRegistryService.getComponent("OrderWorkflowActionEnum") || {};
  const courtId = localStorage.getItem("courtId");
  const { t } = useTranslation();
  const history = useHistory();
  const shortCaseInfo = useMemo(() => {
    if (submitModalInfo?.shortCaseInfo) {
      return submitModalInfo?.shortCaseInfo.map((data) => {
        if (data.key === "CASE_NUMBER") {
          data.value = filingNumber || "";
        }
        return data;
      });
    }
    return null;
  }, [filingNumber, submitModalInfo?.shortCaseInfo]);

  const tenantId = window?.Digit.ULBService.getCurrentTenantId();

  const { data: caseData, isLoading } = useSearchCaseService(
    {
      criteria: [
        {
          filingNumber: filingNumber,
          ...(courtId && userInfoType === "employee" && { courtId }),
        },
      ],
      tenantId,
    },
    {},
    `dristi-${filingNumber}`,
    filingNumber,
    Boolean(filingNumber)
  );
  const caseDetails = useMemo(() => caseData?.criteria[0]?.responseList[0], [caseData]);
  const cnrNumber = useMemo(() => caseDetails?.cnrNumber, [caseDetails]);

  const { data: dateResponse } = Digit.Hooks.home.useSearchReschedule(
    {
      SearchCriteria: {
        tenantId: Digit.ULBService.getCurrentTenantId(),
        rescheduledRequestId: [referenceId],
      },
    },
    { limit: 1, offset: 0 },
    "",
    !!referenceId
  );

  const nextFourDates = status === "OPTOUT" ? getSuggestedDatesFromRescheduleResponse(dateResponse) : nextFiveDates;

  const { data: OptOutLimit } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    "SCHEDULER-CONFIG",
    [
      {
        name: "config",
      },
    ],
    {
      cacheTime: 0,
    }
  );

  const setPurposeValue = (value, input) => {
    setScheduleHearingParam({ ...scheduleHearingParams, purpose: isCaseAdmitted ? value : value.code });
  };

  const handleClickDate = useMemo(
    () =>
      createScheduleHearingDateClickHandler({
        status,
        selectedChip,
        setSelectedChip,
        setScheduleHearingParam,
        scheduleHearingParams,
        OptOutLimitValue,
      }),
    [status, selectedChip, scheduleHearingParams, OptOutLimitValue]
  );

  const showCustomDateModal = () => {
    setModalInfo({ ...modalInfo, showDate: true });
  };

  const onCalendarConfirm = () => {
    setModalInfo({ ...modalInfo, page: 0, showDate: false, showCustomDate: true });
    setSelectedChip(null);
  };

  const handleSelect = (date) => {
    setScheduleHearingParam({ ...scheduleHearingParams, date: formatDateInMonth(date) });
    setSelectedCustomDate(date);
  };

  const handleClose = () => {
    history.goBack();
  };

  const handleSubmit = async (data) => {
    if (status !== "OPTOUT") {
      const reqBody = buildScheduleHearingDraftOrderRequest(data, {
        tenantId,
        cnrNumber,
        filingNumber,
        OrderWorkflowAction,
      });

      try {
        setIsSubmitDisabled(true);
        const res = await HomeService.customApiService(Urls.orderCreate, reqBody, { tenantId });
        await HomeService.customApiService(Urls.pendingTask, {
          pendingTask: {
            name: "Schedule Hearing",
            entityType: "case-default",
            referenceId: `MANUAL_${caseDetails?.filingNumber}`,
            status: "SCHEDULE_HEARING",
            assignedTo: [],
            assignedRole: ["PENDING_TASK_ORDER"],
            cnrNumber: caseDetails?.cnrNumber,
            filingNumber: caseDetails?.filingNumber,
            caseId: caseDetails?.id,
            caseTitle: caseDetails?.caseTitle,
            isCompleted: true,
            additionalDetails: {},
            tenantId,
          },
        });
        history.push(`/${window.contextPath}/employee/orders/generate-order?filingNumber=${filingNumber}&orderNumber=${res.order.orderNumber}`);
      } catch (err) {
        console.error("Error creating order:", err);
        const errorId = err?.response?.headers?.["x-correlation-id"] || err?.response?.headers?.["X-Correlation-Id"];
        setShowToast({ error: true, label: t("CS_ORDER_CREATION_FAILED"), errorId });
      } finally {
        setIsSubmitDisabled(false);
      }
    } else if (status && status === "OPTOUT") {
      const individualId = await fetchBasicUserInfo();
      const judgeId = localStorage.getItem("judgeId");

      setIsSubmitDisabled(true);
      HomeService.customApiService(
        Urls.submitOptOutDates,
        {
          OptOut: {
            tenantId: tenantId,
            individualId: individualId?.individualId,
            caseId: filingNumber,
            rescheduleRequestId: referenceId,
            judgeId: judgeId,
            optOutDates: selectedChip,
          },
        },
        {}
      )
        .then(async () => {
          const individualId = await fetchBasicUserInfo();
          await HomeService.customApiService(Urls.pendingTask, {
            pendingTask: {
              name: "Completed",
              entityType: "order-default",
              referenceId: `MANUAL_${individualId?.userUuid}_${referenceId}`,
              status: "DRAFT_IN_PROGRESS",
              assignedTo: [],
              assignedRole: [],
              cnrNumber: cnrNumber,
              filingNumber: filingNumber,
              caseId: caseDetails?.id,
              caseTitle: caseDetails?.caseTitle,
              isCompleted: true,
              stateSla: null,
              additionalDetails: {},
              tenantId,
            },
          });
          setIsSubmitDisabled(false);
          setSucessOptOut(true);
        })
        .catch((err) => {
          setIsSubmitDisabled(false);
        });
    }
  };

  useEffect(() => {
    if (OptOutLimit) setOptOutLimitValue(extractSchedulerOptOutLimitUnit(OptOutLimit));
  }, [OptOutLimit]);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <Modal
      headerBarMain={<Heading label={status === "OPTOUT" ? t("SELECT_OPT_OUT_DATES") : t(config.headModal)} />}
      headerBarEnd={<ScheduleHearingCloseBtn onClick={handleClose} />}
      hideSubmit={true}
      popupStyles={{
        maxWidth: "650px",
        width: "100%",
      }}
    >
      <div className="schedule-admission-main">
        {shortCaseInfo && <CustomCaseInfoDiv t={t} data={shortCaseInfo} style={{ marginTop: "24px" }} />}

        {status === "OPTOUT" && Array.isArray(selectedChip) && selectedChip.length > 0 && (
          <InfoCard
            className="payment-status-info-card"
            headerWrapperClassName="payment-status-info-header"
            populators={{
              name: "infocard",
            }}
            variant="default"
            text={"The date for the next hearing will be decided based on the selections made below."}
            label={"Please Note"}
            style={{ marginTop: "1.5rem" }}
            textStyle={{
              color: "#3D3C3C",
              margin: "0.5rem 0",
            }}
          />
        )}
        {config.label && <CardText className="card-label-smaller">{t(config.label)}</CardText>}
        {!isCaseAdmitted ? (
          showPurposeOfHearing ? (
            <TextInput
              value={scheduleHearingParams?.purpose}
              className="field desktop-w-full"
              name={`${config.name}`}
              onChange={(e) => {
                setPurposeValue(e.target.value, config.name);
              }}
              disabled={disabled}
            />
          ) : (
            <React.Fragment></React.Fragment>
          )
        ) : (
          <CustomDropdown
            t={t}
            defaulValue={hearingTypeOptions[4]}
            onChange={(e) => {
              setPurposeValue(e, config.name);
            }}
            config={dropdownConfig}
          ></CustomDropdown>
        )}
        {!modalInfo?.showCustomDate && (
          <div>
            <CardText>{status === "OPTOUT" ? `Select upto ${OptOutLimitValue} dates that do not work for you` : t("CS_SELECT_DATE")}</CardText>
            <CustomChooseDate
              data={nextFourDates}
              selectedChip={selectedChip}
              handleClick={handleClickDate}
              scheduleHearingParams={scheduleHearingParams}
              isSelectMulti={status === "OPTOUT" ? true : false}
            />
          </div>
        )}
        {status !== "OPTOUT" &&
          (modalInfo?.showCustomDate ? (
            <h3>
              {scheduleHearingParams?.date}{" "}
              <span style={{ color: "#007E7E", fontWeight: "500" }} onClick={() => showCustomDateModal()}>
                {String(t("SELECT_ANOTHER_DATE"))}
              </span>
            </h3>
          ) : (
            <span className="select-custom-dates-main">
              <h3>{t("DATE_DONT_WORK")}</h3>
              <span className="select-custom-dates-child" onClick={() => showCustomDateModal()}>
                {String(t("CS_SELECT_CUSTOM_DATE"))}
              </span>
            </span>
          ))}
        <div className="action-button-schedule-admission">
          <Button variation="secondary" onButtonClick={handleClose} className="primary-label-btn back-from-schedule" label={"Close"}></Button>
          <SubmitBar
            variation="primary"
            onSubmit={() => handleSubmit(scheduleHearingParams)}
            className="primary-label-btn select-participant-submit"
            label={status === "OPTOUT" ? "Done" : t("GENERATE_ORDERS_LINK")}
            disabled={
              (status === "OPTOUT" && Array.isArray(selectedChip) && selectedChip.length === 0) ||
              (status !== "OPTOUT" && !scheduleHearingParams?.date) ||
              isSubmitDisabled
            }
          ></SubmitBar>
        </div>
        {modalInfo?.showDate && (
          <Modal
            headerBarMain={<Heading label={t(SCHEDULE_HEARING_CUSTOM_DATE_CONFIG.headModal)} />}
            headerBarEnd={
              <ScheduleHearingCloseBtn onClick={() => setModalInfo({ ...modalInfo, page: 0, showDate: false, showCustomDate: false })} />
            }
            hideSubmit={true}
            popmoduleClassName={"custom-date-selector-modal"}
          >
            <CustomCalendar
              config={SCHEDULE_HEARING_CUSTOM_DATE_CONFIG}
              t={t}
              minDate={new Date()}
              onCalendarConfirm={onCalendarConfirm}
              handleSelect={handleSelect}
              selectedCustomDate={selectedCustomDate}
              tenantId={tenantId}
            />
          </Modal>
        )}

        {sucessOptOut && (
          <Modal
            actionCancelLabel={"Close"}
            actionCancelOnSubmit={handleClose}
            actionSaveLabel={"Next Pending Task"}
            actionSaveOnSubmit={handleClose}
            formId="modal-action"
            className="case-types"
            popupStyles={{ maxWidth: "650px", width: "100%" }}
            style={{ height: "40px", border: "none" }}
          >
            <div style={{ padding: "20px 0px 40px" }}>
              <Banner
                whichSvg={"tick"}
                successful={true}
                message={"You have successfully selected your opt-out dates."}
                headerStyles={{ fontSize: "32px" }}
                style={{ minWidth: "100%", marginTop: "10px", padding: "0px 24px" }}
              ></Banner>
              <InfoCard
                className="payment-status-info-card"
                headerWrapperClassName="payment-status-info-header"
                populators={{
                  name: "infocard",
                }}
                variant="default"
                text={"The date for the next hearing will be decided once all parties have selected their opt-out dates."}
                label={"Please Note"}
                style={{ marginTop: "1.5rem" }}
                textStyle={{
                  color: "#3D3C3C",
                  margin: "0.5rem 0",
                }}
              />
            </div>
          </Modal>
        )}
        {showToast && (
          <CustomToast
            error={showToast?.error}
            label={showToast?.label}
            errorId={showToast?.errorId}
            onClose={() => setShowToast(null)}
            duration={showToast?.errorId ? 7000 : 5000}
          />
        )}
      </div>
    </Modal>
  );
}

export default ScheduleHearing;
