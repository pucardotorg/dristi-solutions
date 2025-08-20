import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import {
  Header,
  Button,
  LabelFieldPair,
  CardHeader,
  CardLabel,
  CustomDropdown,
  ActionBar,
  SubmitBar,
  Loader,
  CloseSvg,
  Toast,
} from "@egovernments/digit-ui-react-components";
import { CustomAddIcon, CustomDeleteIcon, EditPencilIcon } from "../../../../dristi/src/icons/svgIndex";
import ReactTooltip from "react-tooltip";
import AddOrderTypeModal from "../../pageComponents/AddOrderTypeModal";
import {
  applicationTypeConfig,
  configCheckout,
  configRejectSubmission,
  configsAssignDateToRescheduledHearing,
  configsAssignNewHearingDate,
  configsBail,
  configsCaseSettlement,
  configsCaseTransferAccept,
  configsCaseTransferReject,
  configsCaseWithdrawalAccept,
  configsCaseWithdrawalReject,
  configsCreateOrderWarrant,
  configsInitiateRescheduleHearingDate,
  configsIssueNotice,
  configsIssueSummons,
  configsJudgement,
  configsOrderMandatorySubmissions,
  configsOrderSection202CRPC,
  configsOrderSubmissionExtension,
  configsOrderTranferToADR,
  configsOthers,
  configsRejectCheckout,
  configsRejectRescheduleHeadingDate,
  configsRescheduleHearingDate,
  configsScheduleHearingDate,
  configsScheduleNextHearingDate,
  configsVoluntarySubmissionStatus,
  configsIssueBailAcceptance,
  configsIssueBailReject,
  configsSetTermBail,
  configsAcceptRejectDelayCondonation,
  configsAdmitCase,
  configsDismissCase,
  configsApproveRejectLitigantDetailsChange,
  replaceAdvocateConfig,
  configsCreateOrderProclamation,
  configsCreateOrderAttachment,
} from "../../configs/ordersCreateConfig";
import { DRISTIService } from "@egovernments/digit-ui-module-dristi/src/services";
import { BreadCrumbsParamsDataContext } from "@egovernments/digit-ui-module-core";
import CustomDatePickerV2 from "@egovernments/digit-ui-module-hearings/src/components/CustomDatePickerV2";
import { HomeService } from "@egovernments/digit-ui-module-home/src/hooks/services";
import { Urls } from "@egovernments/digit-ui-module-dristi/src/hooks";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";

const configKeys = {
  SECTION_202_CRPC: configsOrderSection202CRPC,
  MANDATORY_SUBMISSIONS_RESPONSES: configsOrderMandatorySubmissions,
  EXTENSION_OF_DOCUMENT_SUBMISSION_DATE: configsOrderSubmissionExtension,
  REFERRAL_CASE_TO_ADR: configsOrderTranferToADR,
  SCHEDULE_OF_HEARING_DATE: configsScheduleHearingDate,
  SCHEDULING_NEXT_HEARING: configsScheduleNextHearingDate,
  RESCHEDULE_OF_HEARING_DATE: configsRescheduleHearingDate,
  CHECKOUT_ACCEPTANCE: configCheckout,
  CHECKOUT_REJECT: configsRejectCheckout,
  REJECTION_RESCHEDULE_REQUEST: configsRejectRescheduleHeadingDate,
  INITIATING_RESCHEDULING_OF_HEARING_DATE: configsInitiateRescheduleHearingDate,
  ASSIGNING_DATE_RESCHEDULED_HEARING: configsAssignDateToRescheduledHearing,
  ASSIGNING_NEW_HEARING_DATE: configsAssignNewHearingDate,
  CASE_TRANSFER_ACCEPT: configsCaseTransferAccept,
  CASE_TRANSFER_REJECT: configsCaseTransferReject,
  SETTLEMENT_ACCEPT: configsCaseSettlement,
  SETTLEMENT_REJECT: configsCaseSettlement,
  SUMMONS: configsIssueSummons,
  NOTICE: configsIssueNotice,
  BAIL: configsBail,
  WARRANT: configsCreateOrderWarrant,
  PROCLAMATION: configsCreateOrderProclamation,
  ATTACHMENT: configsCreateOrderAttachment,
  WITHDRAWAL_ACCEPT: configsCaseWithdrawalAccept,
  WITHDRAWAL_REJECT: configsCaseWithdrawalReject,
  OTHERS: configsOthers,
  APPROVE_VOLUNTARY_SUBMISSIONS: configsVoluntarySubmissionStatus,
  REJECT_VOLUNTARY_SUBMISSIONS: configRejectSubmission,
  JUDGEMENT: configsJudgement,
  REJECT_BAIL: configsIssueBailReject,
  ACCEPT_BAIL: configsIssueBailAcceptance,
  SET_BAIL_TERMS: configsSetTermBail,
  ACCEPTANCE_REJECTION_DCA: configsAcceptRejectDelayCondonation,
  TAKE_COGNIZANCE: configsAdmitCase,
  DISMISS_CASE: configsDismissCase,
  APPROVAL_REJECTION_LITIGANT_DETAILS_CHANGE: configsApproveRejectLitigantDetailsChange,
  ADVOCATE_REPLACEMENT_APPROVAL: replaceAdvocateConfig,
};

const OutlinedInfoIcon = () => (
  <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: "absolute", right: -22, top: 0 }}>
    <g clip-path="url(#clip0_7603_50401)">
      <path
        d="M8.70703 5.54232H10.2904V7.12565H8.70703V5.54232ZM8.70703 8.70898H10.2904V13.459H8.70703V8.70898ZM9.4987 1.58398C5.1287 1.58398 1.58203 5.13065 1.58203 9.50065C1.58203 13.8707 5.1287 17.4173 9.4987 17.4173C13.8687 17.4173 17.4154 13.8707 17.4154 9.50065C17.4154 5.13065 13.8687 1.58398 9.4987 1.58398ZM9.4987 15.834C6.00745 15.834 3.16536 12.9919 3.16536 9.50065C3.16536 6.0094 6.00745 3.16732 9.4987 3.16732C12.9899 3.16732 15.832 6.0094 15.832 9.50065C15.832 12.9919 12.9899 15.834 9.4987 15.834Z"
        fill="#3D3C3C"
      />
    </g>
    <defs>
      <clipPath id="clip0_7603_50401">
        <rect width="19" height="19" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

const GenerateOrdersV2 = () => {
  const { t } = useTranslation();
  const history = useHistory();
  // Component state and hooks can be added here as needed
  const [presentAttendees, setPresentAttendees] = useState([]);
  const [absentAttendees, setAbsentAttendees] = useState([]);
  const [purposeOfHearing, setPurposeOfHearing] = useState("");
  const [nextHearingDate, setNextHearingDate] = useState("");
  const [skipScheduling, setSkipScheduling] = useState(false);
  const [showEditOrderModal, setEditOrderModal] = useState(false);
  const [showAddOrderModal, setAddOrderModal] = useState(false);
  const EditSendBackModal = Digit?.ComponentRegistryService?.getComponent("EditSendBackModal");
  const [orderType, setOrderType] = useState({}); // not sure it needed
  const [showOrderValidationModal, setShowOrderValidationModal] = useState({ showModal: false, errorMessage: "" });
  const [OrderTitles, setOrderTitles] = useState([]);
  const submitButtonRefs = useRef([]);
  const setValueRef = useRef([]);
  const formStateRef = useRef([]);
  const clearFormErrors = useRef([]);
  const setFormErrors = useRef([]);
  const [compositeOrderIndex, setCompositeOrderIndex] = useState(0);
  const [currentOrder, setCurrentOrder] = useState({});
  const [caseData, setCaseData] = useState(undefined);
  const [isCaseDetailsLoading, setIsCaseDetailsLoading] = useState(false);
  const { orderNumber, filingNumber } = Digit.Hooks.useQueryParams();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const courtId = localStorage.getItem("courtId");
  const { BreadCrumbsParamsData, setBreadCrumbsParamsData } = useContext(BreadCrumbsParamsDataContext);
  const { caseId: caseIdFromBreadCrumbs, filingNumber: filingNumberFromBreadCrumbs } = BreadCrumbsParamsData;
  const [caseApiError, setCaseApiError] = useState(undefined);
  // Flag to prevent multiple breadcrumb updates
  const isBreadCrumbsParamsDataSet = useRef(false);
  const [isBailBondTaskExists, setIsBailBondTaskExists] = useState(false);
  const [bailBondLoading, setBailBondLoading] = useState(false);
  const userInfo = useMemo(() => Digit.UserService.getUser()?.info, []);
  const roles = useMemo(() => userInfo?.roles, [userInfo]);
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo?.type]);
  const todayDate = new Date().getTime();
  const [showBailBondModal, setShowBailBondModal] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(null);

  const options = [
    { code: "COMPLAINANT", name: "Complainant" },
    { code: "COMPLAINANT_ADVOCATE", name: "Complainant's Advocate" },
    { code: "ACCUSED", name: "Accused" },
    { code: "ACCUSED_ADVOCATE", name: "Accused Advocate" },
  ];

  const orderTypeConfig = {
    isMandatory: true,
    key: "orderType",
    type: "dropdown",
    label: "CHOOSE_ITEM",
    schemaKeyPath: "orderType",
    transformer: "mdmsDropdown",
    disable: false,
    populators: {
      name: "orderType",
      optionsKey: "name",
      error: "required ",
      styles: { maxWidth: "75%" },
      mdmsConfig: {
        moduleName: "Order",
        masterName: "OrderType",
        localePrefix: "ORDER_TYPE",
        select:
          "(data) => {return data['Order'].OrderType?.filter((item)=>[`SUMMONS`, `NOTICE`, `SECTION_202_CRPC`, `MANDATORY_SUBMISSIONS_RESPONSES`, `REFERRAL_CASE_TO_ADR`, `SCHEDULE_OF_HEARING_DATE`, `WARRANT`, `OTHERS`, `JUDGEMENT`, `ACCEPT_BAIL`, `PROCLAMATION`, `ATTACHMENT`].includes(item.type)).map((item) => {return { ...item, name: 'ORDER_TYPE_'+item.code };});}",
      },
    },
  };

  const purposeOfHearingConfig = {
    label: "HEARING_PURPOSE",
    isMandatory: true,
    key: "hearingPurpose",
    schemaKeyPath: "orderDetails.purposeOfHearing",
    transformer: "mdmsDropdown",
    type: "dropdown",
    populators: {
      name: "hearingPurpose",
      optionsKey: "code",
      error: "CORE_REQUIRED_FIELD_ERROR",
      styles: { maxWidth: "100%" },
      required: true,
      isMandatory: true,
      hideInForm: false,
      mdmsConfig: {
        masterName: "HearingType",
        moduleName: "Hearing",
        localePrefix: "HEARING_PURPOSE",
      },
    },
  };

  const nextDateOfHearing = {
    type: "component",
    component: "CustomDatePicker",
    key: "nextHearingDate",
    label: "Next Date of Hearing",
    className: "order-date-picker",
    isMandatory: true,
    placeholder: "DD/MM/YYYY",
    customStyleLabelField: { display: "flex", justifyContent: "space-between" },
    populators: {
      name: "nextHearingDate",
      error: "CORE_REQUIRED_FIELD_ERROR",
    },
  };

  const closeToast = () => {
    setShowErrorToast(null);
  };

  useEffect(() => {
    if (showErrorToast) {
      const timer = setTimeout(() => {
        setShowErrorToast(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showErrorToast]);

  useEffect(() => {
    const isBailBondPendingTaskPresent = async () => {
      try {
        const bailBondPendingTask = await HomeService.getPendingTaskService(
          {
            SearchCriteria: {
              tenantId,
              moduleName: "Pending Tasks Service",
              moduleSearchCriteria: {
                isCompleted: false,
                assignedRole: [...roles], //judge.clerk,typist
                filingNumber: filingNumber,
                courtId: courtId,
                entityType: "bail bond",
              },
              limit: 10000,
              offset: 0,
            },
          },
          { tenantId }
        );
        if (bailBondPendingTask?.data?.length > 0) {
          setIsBailBondTaskExists(true);
        }
      } catch (err) {
        console.log(err);
      }
    };
    if (userType === "employee") isBailBondPendingTaskPresent();
  }, [userType]);

  const Heading = (props) => {
    return <h1 className="heading-m">{props.label}</h1>;
  };

  const CloseBtn = (props) => {
    return (
      <div
        onClick={props?.onClick}
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          paddingRight: "20px",
          cursor: "pointer",
          ...(props?.backgroundColor && { backgroundColor: props.backgroundColor }),
        }}
      >
        <CloseSvg />
      </div>
    );
  };

  // TODO: temporary Form Config, need to be replaced with the actual config
  const modifiedFormConfig = useMemo(() => {
    let orderTypeForm = configKeys[orderType?.code] || [];
    let newConfig = [...orderTypeForm];

    const updatedConfig = newConfig.map((config) => {
      return {
        ...config,
        body: config?.body.map((body) => {
          if (body?.labelChildren === "OutlinedInfoIcon") {
            body.labelChildren = (
              <React.Fragment>
                <span style={{ color: "#77787B", position: "relative" }} data-tip data-for={`${body.label}-tooltip`}>
                  {" "}
                  <OutlinedInfoIcon />
                </span>
                <ReactTooltip id={`${body.label}-tooltip`} place="bottom" content={body?.tooltipValue || ""}>
                  {t(body?.tooltipValue || body.label)}
                </ReactTooltip>
              </React.Fragment>
            );
          }

          if (body?.populators?.validation?.customValidationFn) {
            const customValidations =
              Digit.Customizations[body.populators.validation.customValidationFn.moduleName][
                body.populators.validation.customValidationFn.masterName
              ];

            body.populators.validation = {
              ...body.populators.validation,
              ...customValidations(),
            };
          }
          if (body?.labelChildren === "optional") {
            return {
              ...body,
              labelChildren: <span style={{ color: "#77787B" }}>&nbsp;{`${t("CS_IS_OPTIONAL")}`}</span>,
            };
          }
          return {
            ...body,
          };
        }),
      };
    });
    return updatedConfig;
  }, [orderType?.code, t]);

  const defaultFormValue = useMemo(() => {
    return currentOrder || {};
  }, [currentOrder]);

  const fetchCaseDetails = async () => {
    try {
      setIsCaseDetailsLoading(true);
      const caseData = await DRISTIService.searchCaseService(
        {
          criteria: [
            {
              filingNumber: filingNumber,
              ...(courtId && { courtId }),
            },
          ],
          tenantId,
        },
        {}
      );
      const caseId = caseData?.criteria?.[0]?.responseList?.[0]?.id;
      setCaseData(caseData);
      // Only update breadcrumb data if it's different from current and hasn't been set yet
      if (!(caseIdFromBreadCrumbs === caseId && filingNumberFromBreadCrumbs === filingNumber) && !isBreadCrumbsParamsDataSet.current) {
        setBreadCrumbsParamsData({
          caseId,
          filingNumber,
        });
        isBreadCrumbsParamsDataSet.current = true;
      }
    } catch (err) {
      setCaseApiError(err);
    } finally {
      setIsCaseDetailsLoading(false);
    }
  };

  // Fetch case details on component mount
  useEffect(() => {
    fetchCaseDetails();
  }, [courtId]);

  const caseDetails = useMemo(
    () => ({
      ...caseData?.criteria?.[0]?.responseList?.[0],
    }),
    [caseData]
  );

  const caseCourtId = useMemo(() => caseDetails?.courtId || localStorage.getItem("courtId"), [caseDetails]);

  const { data: hearingDetails, isFetching: isHearingFetching, refetch: refetchHearing } = Digit.Hooks.hearings.useGetHearings(
    {
      hearing: { tenantId },
      criteria: {
        tenantID: tenantId,
        filingNumber: filingNumber,
        ...(caseCourtId && { courtId: caseCourtId }),
      },
    },
    {},
    filingNumber,
    Boolean(filingNumber && caseCourtId)
  );

  const currentInProgressHearing = useMemo(() => hearingDetails?.HearingList?.find((list) => list?.status === "IN_PROGRESS"), [
    hearingDetails?.HearingList,
  ]);

  const { data: bailPendingTaskExpiry } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    "common-masters",
    [{ name: "pendingTaskExpiry" }],
    {
      select: (data) => {
        return data?.["common-masters"]?.pendingTaskExpiry || [];
      },
    }
  );
  const bailPendingTaskExpiryDays = useMemo(() => {
    return bailPendingTaskExpiry?.find((data) => data?.enitiyName === "BAIL_BONDS_REVIEW")?.noofdaysforexpiry || 0;
  }, [bailPendingTaskExpiry]);

  const handleEditOrder = () => {
    setEditOrderModal(true);
  };

  const handleEditConfirmationOrder = () => {
    setAddOrderModal(true);
  };

  const handleAddOrder = (orderFormData) => {
    setCurrentOrder(orderFormData);
    setAddOrderModal(false);
  };

  const createBailBondTask = async () => {
    setBailBondLoading(true);
    try {
      const bailBondPendingTask = await HomeService.getPendingTaskService(
        {
          SearchCriteria: {
            tenantId,
            moduleName: "Pending Tasks Service",
            moduleSearchCriteria: {
              isCompleted: false,
              assignedRole: [...roles],
              filingNumber: filingNumber,
              courtId: courtId,
              entityType: "bail bond",
            },
            limit: 10,
            offset: 0,
          },
        },
        { tenantId }
      );

      if (bailBondPendingTask?.data?.length > 0) {
        setIsBailBondTaskExists(true);
        setShowErrorToast({
          label: t("BAIL_BOND_TASK_ALREADY_EXISTS"),
          error: true,
        });
        return;
      } else {
        await DRISTIService.customApiService(Urls.dristi.pendingTask, {
          pendingTask: {
            name: t("CS_COMMON_BAIL_BOND"),
            entityType: "bail bond",
            referenceId: `MANUAL_BAIL_BOND_${filingNumber}`,
            status: "PENDING_SIGN",
            assignedTo: [],
            assignedRole: ["JUDGE_ROLE", "BENCH_CLERK", "COURT_ROOM_MANAGER"],
            actionCategory: "Bail Bond",
            cnrNumber: caseDetails?.cnrNumber,
            filingNumber,
            caseId: caseDetails?.id,
            caseTitle: caseDetails?.caseTitle,
            isCompleted: false,
            expiryDate: bailPendingTaskExpiryDays * 24 * 60 * 60 * 1000 + todayDate,
            stateSla: todayDate,
            additionalDetails: {},
            tenantId,
          },
        });
        setTimeout(() => {
          setBailBondLoading(false);
          setIsBailBondTaskExists(true);
          setShowBailBondModal(false);
        }, 1000);
      }
    } catch (e) {
      console.log(e);
      setBailBondLoading(false);

      setShowErrorToast({
        label: t("UNABLE_TO_CREATE_BAIL_BOND_TASK"),
        error: true,
      });
    }
  };

  if (isCaseDetailsLoading || isHearingFetching || bailBondLoading) {
    return <Loader />;
  }

  return (
    <React.Fragment>
      <div className="generate-orders-v2-content">
        <Header className="generate-orders-v2-header">{t("Order : Case Ashutosh vs Ranjit")}</Header>

        <div className="generate-orders-v2-columns">
          {/* Left Column */}
          <div className="generate-orders-v2-column">
            {currentInProgressHearing && (
              <React.Fragment>
                <LabelFieldPair style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "left" }}>
                  <CardHeader styles={{ fontSize: "16px", fontWeight: "bold" }}>Mark Who Is Present</CardHeader>

                  <div className="checkbox-group">
                    {options?.map((option, index) => (
                      <div className="checkbox-item" key={index}>
                        <input
                          id={`present-${option.code}`}
                          type="checkbox"
                          className="custom-checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              // Add to present attendees
                              setPresentAttendees([...presentAttendees, option]);
                              // Remove from absent attendees if present there
                              setAbsentAttendees(absentAttendees.filter((item) => item.code !== option.code));
                            } else {
                              // Remove from present attendees
                              setPresentAttendees(presentAttendees.filter((item) => item.code !== option.code));
                            }
                          }}
                          checked={presentAttendees.some((item) => item.code === option.code)}
                          disabled={absentAttendees.some((item) => item.code === option.code)}
                          style={{ cursor: "pointer", width: "20px", height: "20px" }}
                        />
                        <label htmlFor={`present-${option.code}`}>{t(option?.name)}</label>
                      </div>
                    ))}
                  </div>
                </LabelFieldPair>

                <LabelFieldPair style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "left", marginTop: "12px" }}>
                  <CardHeader styles={{ fontSize: "16px", fontWeight: "bold" }}>Mark Who Is Absent</CardHeader>

                  <div className="checkbox-group">
                    {options?.map((option, index) => (
                      <div className="checkbox-item" key={index}>
                        <input
                          id={`absent-${option.code}`}
                          type="checkbox"
                          className="custom-checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              // Add to absent attendees
                              setAbsentAttendees([...absentAttendees, option]);
                              // Remove from present attendees if present there
                              setPresentAttendees(presentAttendees?.filter((item) => item?.code !== option?.code));
                            } else {
                              // Remove from absent attendees
                              setAbsentAttendees(absentAttendees?.filter((item) => item?.code !== option?.code));
                            }
                          }}
                          checked={absentAttendees?.some((item) => item?.code === option?.code)}
                          disabled={presentAttendees?.some((item) => item?.code === option?.code)}
                          style={{ cursor: "pointer", width: "20px", height: "20px" }}
                        />
                        <label htmlFor={`absent-${option.code}`}>{t(option?.name)}</label>
                      </div>
                    ))}
                  </div>
                </LabelFieldPair>
              </React.Fragment>
            )}

            <LabelFieldPair className="order-type-dropdown">
              <CardLabel className="order-type-dropdown-label">{t(orderTypeConfig?.label)}</CardLabel>
              <div style={{ display: "flex", width: "100%", alignItems: "center" }}>
                <CustomDropdown
                  t={t}
                  onChange={(e) => {
                    // setModeOfPayment(e);
                    // setAdditionalDetails("");
                    setOrderType(e);
                    setAddOrderModal(true);
                  }}
                  value={orderType}
                  config={{
                    ...orderTypeConfig?.populators,
                    styles: { ...orderTypeConfig?.populators?.styles, flex: 1 },
                  }}
                />
                <Button
                  className={"edit-button"}
                  variation="secondary"
                  onButtonClick={handleEditOrder}
                  label={t("Edit")}
                  icon={<EditPencilIcon width="20" height="20" />}
                />
                <Button
                  className={"delete-button"}
                  variation="secondary"
                  label={t("Delete")}
                  icon={<CustomDeleteIcon color="#BB2C2F" width="20" height="20" />}
                />
              </div>

              <div style={{ marginBottom: "10px" }}>
                <Button
                  variation="secondary"
                  // onButtonClick={handleAddForm}
                  className="add-new-form"
                  icon={<CustomAddIcon width="16px" height="16px" />}
                  label={t("ADD_ITEM")}
                  style={{ border: "none" }}
                ></Button>
              </div>
            </LabelFieldPair>

            {currentInProgressHearing && (
              <React.Fragment>
                <div className="checkbox-item">
                  <input
                    id="skip-scheduling"
                    type="checkbox"
                    className="custom-checkbox"
                    onChange={() => {
                      const newSkipValue = !skipScheduling;
                      setSkipScheduling(newSkipValue);
                      if (newSkipValue) {
                        // Clear purpose and date when skipping
                        setPurposeOfHearing("");
                        setNextHearingDate("");
                      }
                    }}
                    checked={skipScheduling}
                    style={{ cursor: "pointer", width: "20px", height: "20px" }}
                  />
                  <label htmlFor="skip-scheduling">Skip Scheduling Next Hearing</label>
                </div>

                <LabelFieldPair className="purpose-hearing-dropdown">
                  <CardLabel className={`purpose-hearing-dropdown-label ${skipScheduling ? "disabled" : ""}`}>
                    {t(purposeOfHearingConfig?.label)}
                  </CardLabel>
                  <CustomDropdown
                    t={t}
                    onChange={(e) => {
                      setPurposeOfHearing(e);
                    }}
                    value={purposeOfHearing}
                    config={purposeOfHearingConfig?.populators}
                    disable={skipScheduling}
                  ></CustomDropdown>
                </LabelFieldPair>

                <LabelFieldPair className={`case-label-field-pair`} style={{ width: "75%" }}>
                  <CardLabel className={`case-input-label ${skipScheduling ? "disabled" : ""}`}>Next Date of Hearing</CardLabel>
                  <CustomDatePickerV2
                    t={t}
                    config={nextDateOfHearing}
                    formData={{ nextHearingDate: nextHearingDate }}
                    onDateChange={(date) => {
                      setNextHearingDate(new Date(date).setHours(0, 0, 0, 0));
                    }}
                    value={nextHearingDate}
                    disable={skipScheduling}
                    disableColor="#D6D5D4"
                    disableBorderColor="#D6D5D4"
                    disableBackgroundColor="white"
                  />
                  {/* {orderError?.hearingDate && <CardLabelError style={{ margin: 0, padding: 0 }}> {t(orderError?.hearingDate)} </CardLabelError>} */}
                </LabelFieldPair>

                <div className="checkbox-item">
                  <input
                    id="bail-bond-required"
                    type="checkbox"
                    className="custom-checkbox"
                    onChange={() => {
                      setShowBailBondModal(true);
                    }}
                    checked={isBailBondTaskExists}
                    style={{ cursor: "pointer", width: "20px", height: "20px" }}
                    disabled={isBailBondTaskExists || skipScheduling}
                  />
                  <label htmlFor="bail-bond-required">Bail Bond Required</label>
                </div>
              </React.Fragment>
            )}
          </div>

          {/* Right Column */}
          <div className="generate-orders-v2-column">
            <div className="section-header">Order Text</div>
            {currentInProgressHearing && (
              <div>
                <div style={{ fontSize: "16px", fontWeight: "400", marginBottom: "5px", marginTop: "12px" }}>Attendance</div>
                <textarea
                  value={`${presentAttendees?.length > 0 ? `Present: ${presentAttendees?.map((item) => t(item?.name))?.join(", ")}` : ``}${
                    presentAttendees?.length > 0 && absentAttendees?.length > 0 ? "\n" : ""
                  }${absentAttendees?.length > 0 ? `Absent: ${absentAttendees?.map((item) => t(item?.name))?.join(", ")}` : ``}`}
                  rows={3}
                  maxLength={1000}
                  className={`custom-textarea-style`}
                  disabled={true}
                  readOnly={true}
                ></textarea>
                {/* {errors[config.key] && <CardLabelError style={input?.errorStyle}>{t(errors[config.key].msg || "CORE_REQUIRED_FIELD_ERROR")}</CardLabelError>} */}
              </div>
            )}

            <div>
              <div style={{ fontSize: "16px", fontWeight: "400", marginBottom: "5px", marginTop: "12px" }}>Item Text</div>
              <textarea
                // value={formdata?.[config.key]?.[input.name]}
                // onChange={(data) => {
                //   handleChange(data, input);
                // }}
                rows={currentInProgressHearing ? 8 : 20}
                maxLength={1000}
                className={`custom-textarea-style`}
                // placeholder={t(input?.placeholder)}
                // disabled={config.disable}
              ></textarea>
              {/* {errors[config.key] && <CardLabelError style={input?.errorStyle}>{t(errors[config.key].msg || "CORE_REQUIRED_FIELD_ERROR")}</CardLabelError>} */}
            </div>

            {currentInProgressHearing && (
              <div>
                <div style={{ fontSize: "16px", fontWeight: "400", marginBottom: "5px", marginTop: "12px" }}>Next Hearing</div>
                <textarea
                  value={
                    skipScheduling
                      ? "No Next Hearing"
                      : `${purposeOfHearing ? `Purpose of Next Hearing: ${t(purposeOfHearing?.code || purposeOfHearing)}` : ``}${
                          purposeOfHearing && nextHearingDate ? "\n" : ""
                        }${nextHearingDate ? `Date: ${new Date(nextHearingDate).toLocaleDateString()}` : ``}`
                  }
                  rows={3}
                  maxLength={1000}
                  className={`custom-textarea-style`}
                  disabled={true}
                  readOnly={true}
                ></textarea>
                {/* {errors[config.key] && <CardLabelError style={input?.errorStyle}>{t(errors[config.key].msg || "CORE_REQUIRED_FIELD_ERROR")}</CardLabelError>} */}
              </div>
            )}
          </div>
        </div>
        <ActionBar
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "#fff",
            padding: "16px 24px",
            boxShadow: "none",
            borderTop: "1px solid #BBBBBD",
          }}
        >
          <div style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
            <Button
              label={t("SAVE_AS_DRAFT")}
              variation={"secondary"}
              // onButtonClick={() => {
              //   setEditCaseModal(true);
              // }}
              style={{ boxShadow: "none", backgroundColor: "#fff", padding: "10px", width: "240px", marginRight: "20px" }}
              textStyles={{
                fontFamily: "Roboto",
                fontSize: "16px",
                fontWeight: 700,
                lineHeight: "18.75px",
                textAlign: "center",
                color: "#007E7E",
              }}
            />
            <SubmitBar
              label={t("PREVIEW_ORDER_PDF")}
              // disabled={
              //   Object.keys(!modeOfPayment ? {} : modeOfPayment).length === 0 ||
              //   (["CHEQUE", "DD"].includes(modeOfPayment?.code) ? additionDetails.length !== 6 : false) ||
              //   isDisabled
              // }
              // onSubmit={() => {
              //   onSubmitCase();
              // }}
            />
          </div>
        </ActionBar>
      </div>
      {showEditOrderModal && (
        <EditSendBackModal
          t={t}
          handleCancel={() => setEditOrderModal(false)}
          handleSubmit={handleEditConfirmationOrder}
          headerLabel={"Confirm Edit"}
          saveLabel={"CONFIRM"}
          cancelLabel={"CANCEL_EDIT"}
          contentText={"Are you sure you want to make these changes in this item. This will not update the order text on the right side."}
          className={"edit-send-back-modal"}
        />
      )}
      {showAddOrderModal && (
        <AddOrderTypeModal
          t={t}
          handleCancel={() => setAddOrderModal(false)}
          headerLabel={"Add Order"}
          saveLabel={"CONFIRM"}
          cancelLabel={"CANCEL_EDIT"}
          handleSubmit={handleAddOrder}
          orderType={orderType}
          modifiedFormConfig={modifiedFormConfig}
          defaultFormValue={defaultFormValue}
          currentOrder={currentOrder}
          index={compositeOrderIndex}
          setFormErrors={setFormErrors}
          clearFormErrors={clearFormErrors}
          setValueRef={setValueRef}
        />
      )}
      {showBailBondModal && !isBailBondTaskExists && (
        <Modal
          headerBarEnd={<CloseBtn onClick={() => !bailBondLoading && setShowBailBondModal(false)} />}
          actionSaveLabel={t("CS_COMMON_CONFIRM")}
          actionSaveOnSubmit={createBailBondTask}
          actionCancelLabel={t("CS_COMMON_CANCEL")}
          isBackButtonDisabled={bailBondLoading}
          isDisabled={bailBondLoading}
          actionCancelOnSubmit={() => setShowBailBondModal(false)}
          formId="modal-action"
          headerBarMain={<Heading label={t("CREATE_BAIL_BOND_TASK")} />}
          className="upload-signature-modal"
          submitTextClassName="upload-signature-button"
        >
          <div style={{ margin: "16px 16px" }}>{t("CREATE_BAIL_BOND_TASK_TEXT")}</div>
        </Modal>
      )}
      {showErrorToast && <Toast error={showErrorToast?.error} label={showErrorToast?.label} isDleteBtn={true} onClose={closeToast} />}
    </React.Fragment>
  );
};

export default GenerateOrdersV2;
