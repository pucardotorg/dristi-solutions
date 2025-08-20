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
  const [value, setValue] = useState([]);
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
    key: "hearingDate",
    label: "Next Date of Hearing",
    className: "order-date-picker",
    isMandatory: true,
    customStyleLabelField: { display: "flex", justifyContent: "space-between" },
    populators: {
      name: "hearingDate",
      error: "CORE_REQUIRED_FIELD_ERROR",
    },
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

  if (isCaseDetailsLoading || isHearingFetching) {
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
                            let tempData = value;
                            const isFound = value?.some((val) => val?.code === option?.code);
                            if (isFound) tempData = value?.filter((val) => val?.code !== option?.code);
                            else tempData.push(option);
                            setValue(tempData);
                          }}
                          checked={value?.find((val) => val?.code === option?.code)}
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
                          id={`present-${option.code}`}
                          type="checkbox"
                          className="custom-checkbox"
                          onChange={(e) => {
                            let tempData = value;
                            const isFound = value?.some((val) => val?.code === option?.code);
                            if (isFound) tempData = value?.filter((val) => val?.code !== option?.code);
                            else tempData.push(option);
                            setValue(tempData);
                          }}
                          checked={value?.find((val) => val?.code === option?.code)}
                          style={{ cursor: "pointer", width: "20px", height: "20px" }}
                        />
                        <label htmlFor={`present-${option.code}`}>{t(option?.name)}</label>
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
                    // onChange={() => {
                    //   setChecked(!checked);
                    //   colData?.updateOrderFunc(rowData, !checked);
                    // }}
                    // checked={checked}
                    style={{ cursor: "pointer", width: "20px", height: "20px" }}
                  />
                  <label htmlFor="skip-scheduling">Skip Scheduling Next Hearing</label>
                </div>

                <LabelFieldPair style={{ alignItems: "flex-start", fontSize: "16px", fontWeight: 400, width: "75%" }}>
                  <CardLabel style={{ fontSize: "16px", fontWeight: "400", marginBottom: "5px" }}>{t(purposeOfHearingConfig?.label)}</CardLabel>
                  <CustomDropdown
                    t={t}
                    // onChange={(e) => {
                    //   setModeOfPayment(e);
                    //   setAdditionalDetails("");
                    // }}
                    // value={modeOfPayment}
                    config={purposeOfHearingConfig?.populators}
                  ></CustomDropdown>
                </LabelFieldPair>

                <LabelFieldPair className={`case-label-field-pair`} style={{ width: "75%" }}>
                  <CardLabel className="case-input-label">Next Date of Hearing</CardLabel>
                  <CustomDatePickerV2
                    t={t}
                    config={nextDateOfHearing}
                    // formData={orderData}
                    onDateChange={(date) => {
                      // setOrderData((orderData) => ({ ...orderData, hearingDate: new Date(date).setHours(0, 0, 0, 0) }));
                      // setOrderError((orderError) => ({ ...orderError, hearingDate: null }));
                    }}
                  />
                  {/* {orderError?.hearingDate && <CardLabelError style={{ margin: 0, padding: 0 }}> {t(orderError?.hearingDate)} </CardLabelError>} */}
                </LabelFieldPair>

                <div className="checkbox-item">
                  <input
                    id="bail-bond-required"
                    type="checkbox"
                    className="custom-checkbox"
                    // onChange={() => {
                    //   setChecked(!checked);
                    //   colData?.updateOrderFunc(rowData, !checked);
                    // }}
                    // checked={checked}
                    style={{ cursor: "pointer", width: "20px", height: "20px" }}
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
                  // value={formdata?.[config.key]?.[input.name]}
                  // onChange={(data) => {
                  //   handleChange(data, input);
                  // }}
                  rows={3}
                  maxLength={1000}
                  className={`custom-textarea-style`}
                  // placeholder={t(input?.placeholder)}
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
                  // value={formdata?.[config.key]?.[input.name]}
                  // onChange={(data) => {
                  //   handleChange(data, input);
                  // }}
                  rows={3}
                  maxLength={1000}
                  className={`custom-textarea-style`}
                  // placeholder={t(input?.placeholder)}
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
    </React.Fragment>
  );
};

export default GenerateOrdersV2;
