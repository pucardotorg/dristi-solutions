import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { RadioButtons, Dropdown, LabelFieldPair, CardLabel, CardLabelError, Toast } from "@egovernments/digit-ui-react-components";
import { LeftArrow } from "../../../icons/svgIndex";
import CustomTextArea from "../../../components/CustomTextArea";
import MultiSelectDropdown from "../../../components/MultiSelectDropdown";
import CustomDatePickerV2 from "../../../../../hearings/src/components/CustomDatePickerV2";
import Button from "../../../components/Button";
import { getFormattedName } from "../../../../../hearings/src/utils";
import { constructFullName } from "@egovernments/digit-ui-module-orders/src/utils";
import { getAdvocates } from "@egovernments/digit-ui-module-orders/src/utils/caseUtils";
import { removeInvalidNameParts } from "../../../Utils";
import { OrderWorkflowAction, OrderWorkflowState } from "@egovernments/digit-ui-module-orders/src/utils/orderWorkflow";
import { ordersService } from "@egovernments/digit-ui-module-orders/src/hooks/services";
import { useHistory } from "react-router-dom/cjs/react-router-dom";

const OrderDrawer = ({
  isOpen,
  onClose,
  attendees,
  caseDetails,
  currentHearingId,
  setUpdateCounter,
  isBailBondTaskExists,
  setIsBailBondTaskExists,
  setShowBailBondModal,
}) => {
  const { t } = useTranslation();
  const targetRef = useRef(null);
  const history = useHistory();
  const userInfo = Digit.UserService.getUser()?.info;
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo]);

  const [orderData, setOrderData] = useState({
    attendees: [],
    botdText: "",
    hearingType: {},
    hearingDate: "",
    partiesToAttendHearing: [],
  });
  const [orderError, setOrderError] = useState({
    botdText: "",
    hearingType: "",
    hearingDate: "",
    partiesToAttendHearing: "",
  });
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(null);

  useEffect(() => {
    if (showErrorToast) {
      const timer = setTimeout(() => {
        setShowErrorToast(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showErrorToast]);

  const closeToast = () => {
    setShowErrorToast(null);
  };

  const { data: hearingTypeOptions, isLoading: isOptionsLoading } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    "Hearing",
    [{ name: "HearingType" }],
    {
      select: (data) => {
        return data?.Hearing?.HearingType || [];
      },
    }
  );

  const { data: orderDataNextHearing, refetch: refetchOrderDataNextHearing } = Digit.Hooks.orders.useSearchOrdersService(
    {
      tenantId: caseDetails?.tenantId,
      criteria: {
        tenantID: caseDetails?.tenantId,
        filingNumber: caseDetails?.filingNumber,
        orderType: "SCHEDULING_NEXT_HEARING",
        status: OrderWorkflowState.DRAFT_IN_PROGRESS,
        ...(caseDetails?.courtId && { courtId: caseDetails?.courtId }),
      },
    },
    { tenantId: caseDetails?.tenantId },
    caseDetails?.filingNumber + OrderWorkflowState.DRAFT_IN_PROGRESS + isOpen,
    Boolean(caseDetails?.filingNumber && isOpen)
  );

  const orderDataNextHearingData = useMemo(
    () => orderDataNextHearing?.list?.find((order) => order?.additionalDetails?.refHearingId === currentHearingId),
    [currentHearingId, orderDataNextHearing?.list]
  );

  useEffect(() => {
    if (orderDataNextHearingData) {
      const order = orderDataNextHearingData;
      let hearingDate;
      if (order?.additionalDetails?.formdata?.hearingDate) {
        const [year, month, day] = order?.additionalDetails?.formdata?.hearingDate?.split("-");
        hearingDate = new Date(year, month - 1, day).getTime();
      }
      setOrderData({
        attendees: order?.additionalDetails?.formdata?.attendees,
        botdText: order?.additionalDetails?.formdata?.hearingSummary?.text,
        hearingType: order?.additionalDetails?.formdata?.hearingPurpose,
        hearingDate: hearingDate,
        partiesToAttendHearing: order?.additionalDetails?.formdata?.namesOfPartiesRequired,
      });
    }
  }, [orderDataNextHearingData]);

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

  const witnesses = useMemo(() => {
    return (
      caseDetails?.witnessDetails?.map((data) => {
        const fullName = getFormattedName(data?.firstName, data?.middleName, data?.lastName, data?.witnessDesignation, null);
        return { code: fullName, name: `${fullName} (Witness)`, uuid: data?.uuid, partyType: "witness" };
      }) || []
    );
  }, [caseDetails]);

  const validateOrderData = useCallback((orderData, type) => {
    const errors = {};
    if (!orderData?.botdText?.trim() && !orderData?.botdText?.trim()?.length < 2) errors.botdText = "CORE_REQUIRED_FIELD_ERROR";
    if (type === "add-other-items") {
      if (!orderData?.hearingType?.code) errors.hearingType = "CORE_REQUIRED_FIELD_ERROR";
      if (!orderData?.hearingDate) errors.hearingDate = "CORE_REQUIRED_FIELD_ERROR";
      if (!orderData?.partiesToAttendHearing?.length) errors.partiesToAttendHearing = "CORE_REQUIRED_FIELD_ERROR";
    }
    return errors;
  }, []);

  const onSubmit = useCallback(
    async (type) => {
      const errors = validateOrderData(orderData, type);
      if (Object.keys(errors).length && type === "add-other-items") {
        setOrderError(errors);
        return;
      }
      setIsApiLoading(true);
      let date = undefined;
      let hearingDate = undefined;
      if (orderData?.hearingDate) {
        date = new Date(orderData?.hearingDate);
        if (!isNaN(date)) {
          const day = String(date.getDate()).padStart(2, "0");
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const year = date.getFullYear();
          hearingDate = `${year}-${month}-${day}`;
        }
      }
      if (type === "save-draft") {
        if (orderDataNextHearingData) {
          const payload = {
            order: {
              ...orderDataNextHearingData,
              additionalDetails: {
                ...orderDataNextHearingData?.additionalDetails,
                formdata: {
                  ...orderDataNextHearingData?.additionalDetails?.formdata,
                  hearingDate,
                  hearingSummary: {
                    text: orderData?.botdText,
                  },
                  namesOfPartiesRequired: orderData?.partiesToAttendHearing,
                  hearingPurpose: orderData?.hearingType,
                  attendees: orderData?.attendees,
                },
                refHearingId: currentHearingId,
              },
              workflow: { ...orderDataNextHearingData?.workflow, action: OrderWorkflowAction.SAVE_DRAFT, documents: [{}] },
            },
          };
          try {
            await ordersService.updateOrder(payload, { tenantId: Digit.ULBService.getCurrentTenantId() });
            setShowErrorToast({ label: t("DRAFT_SAVED_SUCCESSFULLY"), error: false });
          } catch (error) {
            console.error("error", error);
          }
        } else {
          const payload = {
            order: {
              createdDate: null,
              tenantId: caseDetails?.tenantId,
              filingNumber: caseDetails?.filingNumber,
              cnrNumber: caseDetails?.cnrNumber,
              statuteSection: {
                tenantId: caseDetails?.tenantId,
              },
              orderTitle: "SCHEDULING_NEXT_HEARING",
              orderCategory: "INTERMEDIATE",
              orderType: "SCHEDULING_NEXT_HEARING",
              status: "",
              isActive: true,
              workflow: {
                action: OrderWorkflowAction.SAVE_DRAFT,
                comments: "Creating order",
                assignes: [],
                rating: null,
                documents: [{}],
              },
              documents: [],
              additionalDetails: {
                formdata: {
                  orderType: {
                    type: "SCHEDULING_NEXT_HEARING",
                    isactive: true,
                    code: "SCHEDULING_NEXT_HEARING",
                    name: "ORDER_TYPE_SCHEDULING_NEXT_HEARING",
                  },
                  hearingDate,
                  hearingSummary: {
                    text: orderData?.botdText,
                  },
                  namesOfPartiesRequired: orderData?.partiesToAttendHearing,
                  hearingPurpose: orderData?.hearingType,
                  attendees: orderData?.attendees,
                },
                refHearingId: currentHearingId,
              },
            },
          };
          try {
            await ordersService.createOrder(payload, { tenantId: Digit.ULBService.getCurrentTenantId() });
            setShowErrorToast({ label: t("DRAFT_SAVED_SUCCESSFULLY"), error: false });
          } catch (error) {
            console.error("error", error);
          }
        }
      } else if (type === "add-other-items") {
        if (orderDataNextHearingData) {
          const payload = {
            order: {
              ...orderDataNextHearingData,
              additionalDetails: {
                ...orderDataNextHearingData?.additionalDetails,
                formdata: {
                  ...orderDataNextHearingData?.additionalDetails?.formdata,
                  hearingDate,
                  hearingSummary: {
                    text: orderData?.botdText,
                  },
                  namesOfPartiesRequired: orderData?.partiesToAttendHearing,
                  hearingPurpose: orderData?.hearingType,
                  attendees: orderData?.attendees,
                },
                refHearingId: currentHearingId,
              },
              workflow: { ...orderDataNextHearingData?.workflow, action: OrderWorkflowAction.SAVE_DRAFT, documents: [{}] },
            },
          };
          try {
            const response = await ordersService.updateOrder(payload, { tenantId: Digit.ULBService.getCurrentTenantId() });
            history.push(
              `/${window.contextPath}/${userType}/orders/generate-order?filingNumber=${caseDetails?.filingNumber}&orderNumber=${response?.order?.orderNumber}`
            );
          } catch (error) {
            console.error("error", error);
          }
        } else {
          const payload = {
            order: {
              createdDate: null,
              tenantId: caseDetails?.tenantId,
              filingNumber: caseDetails?.filingNumber,
              cnrNumber: caseDetails?.cnrNumber,
              statuteSection: {
                tenantId: caseDetails?.tenantId,
              },
              orderTitle: "SCHEDULING_NEXT_HEARING",
              orderCategory: "INTERMEDIATE",
              orderType: "SCHEDULING_NEXT_HEARING",
              status: "",
              isActive: true,
              workflow: {
                action: OrderWorkflowAction.SAVE_DRAFT,
                comments: "Creating order",
                assignes: [],
                rating: null,
                documents: [{}],
              },
              documents: [],
              additionalDetails: {
                formdata: {
                  orderType: {
                    type: "SCHEDULING_NEXT_HEARING",
                    isactive: true,
                    code: "SCHEDULING_NEXT_HEARING",
                    name: "ORDER_TYPE_SCHEDULING_NEXT_HEARING",
                  },
                  hearingDate,
                  hearingSummary: {
                    text: orderData?.botdText,
                  },
                  namesOfPartiesRequired: orderData?.partiesToAttendHearing,
                  hearingPurpose: orderData?.hearingType,
                  attendees: orderData?.attendees,
                },
                refHearingId: currentHearingId,
              },
            },
          };
          try {
            const response = await ordersService.createOrder(payload, { tenantId: Digit.ULBService.getCurrentTenantId() });
            history.push(
              `/${window.contextPath}/${userType}/orders/generate-order?filingNumber=${caseDetails?.filingNumber}&orderNumber=${response?.order?.orderNumber}`
            );
          } catch (error) {
            console.error("error", error);
          }
        }
      }
      await refetchOrderDataNextHearing();
      setUpdateCounter((prev) => prev + 1);
      setIsApiLoading(false);
    },
    [
      validateOrderData,
      orderData,
      refetchOrderDataNextHearing,
      setUpdateCounter,
      orderDataNextHearingData,
      currentHearingId,
      t,
      caseDetails?.tenantId,
      caseDetails?.filingNumber,
      caseDetails?.cnrNumber,
      history,
      userType,
    ]
  );

  const attendeeOptions = useMemo(() => {
    if (!Array.isArray(attendees)) {
      return [];
    }
    return attendees.map((attendee) => ({
      ...attendee,
      partyType: attendee?.type,
      value: attendee.individualId || attendee.name,
      label: attendee.name,
    }));
  }, [attendees]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const customLabel = useMemo(() => {
    const attendeeCount = orderData?.attendees?.length || 0;

    if (attendeeCount === 1) return orderData?.attendees[0]?.label;
    if (attendeeCount > 1) return `${orderData?.attendees[0]?.label} + ${attendeeCount - 1} ${t("CS_OTHERS")}`;

    return "";
  }, [t, orderData?.attendees]);

  const customAttendeeLabel = useMemo(() => {
    const attendeeCount = orderData?.partiesToAttendHearing?.length || 0;

    if (attendeeCount === 1) return orderData?.partiesToAttendHearing[0]?.name;
    if (attendeeCount > 1) return `${orderData?.partiesToAttendHearing[0]?.name} + ${attendeeCount - 1} ${t("CS_OTHERS")}`;

    return "";
  }, [t, orderData?.partiesToAttendHearing]);

  if (!isOpen) return null;

  return (
    <div ref={targetRef} className="bottom-drawer-wrapper">
      <div className="bottom-drawer-overlay" onClick={onClose} />
      <div className={`bottom-drawer ${isOpen ? "open" : ""}`}>
        <div className="drawer-header">
          <div className="header-content">
            <button className="drawer-close-button" onClick={onClose}>
              <LeftArrow color="#0b0c0c" />
            </button>
            <h2>{t("CS_ORDER")}</h2>
          </div>
        </div>
        <div className="drawer-content">
          <div className="drawer-section">
            <LabelFieldPair className="case-label-field-pair">
              <CustomTextArea
                name="botdText"
                value={orderData?.botdText}
                onTextChange={(value) => {
                  setOrderData((orderData) => ({
                    ...orderData,
                    botdText: value,
                  }));
                  setOrderError((orderError) => ({
                    ...orderError,
                    botdText: null,
                  }));
                }}
                id="botdText"
                info={t("BUSINESS_OF_THE_DAY")}
              />
              {orderError?.botdText && <CardLabelError style={{ margin: 0, padding: 0 }}> {t(orderError?.botdText)} </CardLabelError>}
            </LabelFieldPair>

            <LabelFieldPair className="case-label-field-pair" style={{ width: "344px" }}>
              <CardLabel className="case-input-label">{`${t("CS_CASE_ATTENDEES")}`}</CardLabel>
              <MultiSelectDropdown
                options={attendeeOptions}
                selected={orderData?.attendees}
                optionsKey={"label"}
                onSelect={(value) => {
                  setOrderData((orderData) => ({
                    ...orderData,
                    attendees: value?.map((val) => val[1]),
                  }));
                  setOrderError((orderError) => ({
                    ...orderError,
                    attendees: null,
                  }));
                }}
                customLabel={customLabel}
                config={{
                  isSelectAll: true,
                }}
                parentRef={targetRef}
              />
              {orderError?.attendees && <CardLabelError style={{ margin: 0, padding: 0 }}> {t(orderError?.attendees)} </CardLabelError>}
            </LabelFieldPair>
          </div>
          <div className="drawer-section">
            <div className="drawer-sub-section">
              <h3 className="drawer-sub-section-title">{t("CS_NEXT_HEARING")}</h3>
            </div>
            <div className="drawer-sub-section">
              <LabelFieldPair className={`case-label-field-pair`}>
                <CardLabel className="case-input-label">{`${t("HEARING_TYPE")}`}</CardLabel>
                <Dropdown
                  t={t}
                  option={hearingTypeOptions}
                  selected={orderData?.hearingType}
                  optionKey={"code"}
                  select={(e) => {
                    setOrderData((orderData) => ({
                      ...orderData,
                      hearingType: e,
                    }));
                    setOrderError((orderError) => ({
                      ...orderError,
                      hearingType: null,
                    }));
                  }}
                  freeze={true}
                  topbarOptionsClassName={"top-bar-option"}
                  style={{
                    marginBottom: "1px",
                  }}
                />
                {orderError?.hearingType && <CardLabelError style={{ margin: 0, padding: 0 }}> {t(orderError?.hearingType)} </CardLabelError>}
              </LabelFieldPair>
              <LabelFieldPair className={`case-label-field-pair`}>
                <CardLabel className="case-input-label">{`${t("CS_CASE_SELECT_HEARING_DATE")}`}</CardLabel>
                <CustomDatePickerV2
                  t={t}
                  config={{
                    type: "component",
                    component: "CustomDatePicker",
                    key: "hearingDate",
                    label: "CS_CASE_SELECT_HEARING_DATE",
                    className: "order-date-picker",
                    isMandatory: true,
                    customStyleLabelField: { display: "flex", justifyContent: "space-between" },
                    populators: {
                      name: "hearingDate",
                      // error: "Required",
                    },
                  }}
                  formData={orderData}
                  onDateChange={(date) => {
                    setOrderData((orderData) => ({ ...orderData, hearingDate: new Date(date).setHours(0, 0, 0, 0) }));
                    setOrderError((orderError) => ({ ...orderError, hearingDate: null }));
                  }}
                />
                {orderError?.hearingDate && <CardLabelError style={{ margin: 0, padding: 0 }}> {t(orderError?.hearingDate)} </CardLabelError>}
              </LabelFieldPair>
              <LabelFieldPair className={`case-label-field-pair`}>
                <CardLabel className="case-input-label">{`${t("CS_CASE_PARTIES_ATTEND_HEARING")}`}</CardLabel>
                <MultiSelectDropdown
                  options={[...complainants, ...poaHolders, ...respondents, ...unJoinedLitigant, ...witnesses]}
                  selected={orderData?.partiesToAttendHearing}
                  optionsKey={"name"}
                  onSelect={(value) => {
                    setOrderData((orderData) => ({
                      ...orderData,
                      partiesToAttendHearing: value?.map((val) => val[1]),
                    }));
                    setOrderError((orderError) => ({
                      ...orderError,
                      partiesToAttendHearing: null,
                    }));
                  }}
                  customLabel={customAttendeeLabel}
                  config={{
                    isSelectAll: true,
                  }}
                  parentRef={targetRef}
                  isOpenAbove={true}
                />
                {orderError?.partiesToAttendHearing && (
                  <CardLabelError style={{ margin: 0, padding: 0 }}> {t(orderError?.partiesToAttendHearing)} </CardLabelError>
                )}
              </LabelFieldPair>
            </div>
          </div>
          <div className="drawer-section">
            <div className="drawer-sub-section">
              <LabelFieldPair className="case-label-field-pair">
                <RadioButtons
                  selectedOption={isBailBondTaskExists ? { label: `Bail Bond Required`, value: "CASE_DISPOSED" } : orderData?.isCaseDisposed}
                  disabled={isBailBondTaskExists}
                  optionsKey={"label"}
                  options={[{ label: `Bail Bond Required`, value: "CASE_DISPOSED" }]}
                  additionalWrapperClass={"radio-disabled"}
                  onSelect={(value) => {
                    setShowBailBondModal(true);
                    // setIsBailBondTaskExists(true);
                    // setOrderData((orderData) => ({
                    //   ...orderData,
                    //   isCaseDisposed: orderData?.isCaseDisposed?.value === value?.value ? {} : value,
                    // }));
                    // setOrderError((orderError) => ({
                    //   ...orderError,
                    //   isCaseDisposed: null,
                    // }));
                  }}
                />
              </LabelFieldPair>
            </div>
          </div>
        </div>
        <div className="drawer-footer">
          <Button
            label={t("CS_CASE_ADD_OTHER_ITEMS")}
            variation="outlined"
            onButtonClick={() => onSubmit("add-other-items")}
            isDisabled={isApiLoading}
          />
          <Button
            label={t("SAVE_DRAFT")}
            className={"order-drawer-save-btn"}
            onButtonClick={() => onSubmit("save-draft")}
            isDisabled={isApiLoading}
          />
        </div>
      </div>
      {showErrorToast && <Toast error={showErrorToast?.error} label={showErrorToast?.label} isDleteBtn={true} onClose={closeToast} />}
    </div>
  );
};

export default OrderDrawer;
