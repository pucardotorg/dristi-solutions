import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { RadioButtons, Dropdown, LabelFieldPair, CardLabel } from "@egovernments/digit-ui-react-components";
import { LeftArrow } from "../../../icons/svgIndex";
import CustomTextArea from "../../../components/CustomTextArea";
import MultiSelectDropdown from "../../../components/MultiSelectDropdown";
import CustomDatePicker from "../../../../../hearings/src/components/CustomDatePicker";
import Button from "../../../components/Button";
import { getFormattedName } from "../../../../../hearings/src/utils";
import { constructFullName } from "@egovernments/digit-ui-module-orders/src/utils";
import { getAdvocates } from "@egovernments/digit-ui-module-orders/src/utils/caseUtils";
import { removeInvalidNameParts } from "../../../Utils";

const OrderDrawer = ({ isOpen, onClose, onSubmit, attendees, caseDetails }) => {
  const { t } = useTranslation();
  const [orderData, setOrderData] = useState({
    attendees: [],
    botdText: "",
    hearingType: "",
    hearingDate: "",
    isCaseDisposed: "CASE_DISPOSED",
    partiesToAttendHearing: [],
  });

  const { data: hearingTypeOptions, isLoading: isOptionsLoading } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    "Hearing",
    [{ name: "HearingType" }],
    {
      select: (data) => {
        return data?.case?.pendingTaskFilterText || [];
      },
    }
  );

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
      caseDetails?.additionalDetails?.witnessDetails?.formdata?.map((data) => {
        const fullName = getFormattedName(data?.data?.firstName, data?.data?.middleName, data?.data?.lastName, data?.data?.witnessDesignation, null);
        return { code: fullName, name: `${fullName} (Witness)`, uuid: data?.data?.uuid, partyType: "witness" };
      }) || []
    );
  }, [caseDetails]);

  const attendeeOptions = useMemo(() => {
    if (!Array.isArray(attendees)) {
      return [];
    }
    const uniqueAttendees = attendees.reduce((acc, attendee) => {
      if (!acc.some((item) => item?.individualId === attendee?.individualId)) {
        acc.push(attendee);
      }
      return acc;
    }, []);
    return uniqueAttendees.map((attendee) => ({
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
    <div className="bottom-drawer-wrapper">
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
                }}
                id="botdText"
                info={t("BUSINESS_OF_THE_DAY")}
              />
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
                }}
                customLabel={customLabel}
                config={{
                  isSelectAll: true,
                }}
                // parentRef={targetRef}
              />
            </LabelFieldPair>
          </div>
          <div className="drawer-section">
            <div className="drawer-sub-section">
              <h3 className="drawer-sub-section-title">{t("CS_NEXT_HEARING")}</h3>
            </div>
            <div className="drawer-sub-section">
              <LabelFieldPair className="case-label-field-pair">
                <RadioButtons
                  selectedOption={orderData?.isCaseDisposed}
                  disabled={false}
                  optionsKey={"label"}
                  options={[{ label: `${t("CS_CASE_DISPOSED")}: ${t("CS_CASE_NEXT_HEARING_SCHEDULED")}`, value: "CASE_DISPOSED" }]}
                  additionalWrapperClass={"radio-disabled"}
                  onSelect={(value) => {
                    setOrderData((orderData) => ({
                      ...orderData,
                      isCaseDisposed: value,
                    }));
                  }}
                />
              </LabelFieldPair>
            </div>
            <div className="drawer-sub-section">
              <LabelFieldPair className="case-label-field-pair">
                <CardLabel className="case-input-label">{`${t("HEARING_TYPE")}`}</CardLabel>
                <Dropdown
                  t={t}
                  option={[]}
                  selected={orderData?.hearingType}
                  optionKey={"fullName"}
                  select={(e) => {
                    setOrderData((orderData) => ({
                      ...orderData,
                      hearingType: e,
                    }));
                  }}
                  freeze={true}
                  topbarOptionsClassName={"top-bar-option"}
                  disable={false}
                  style={{
                    marginBottom: "1px",
                  }}
                />
              </LabelFieldPair>
              <LabelFieldPair className="case-label-field-pair">
                <CardLabel className="case-input-label">{`${t("CS_CASE_SELECT_HEARING_DATE")}`}</CardLabel>
                <CustomDatePicker
                  t={t}
                  config={{
                    type: "component",
                    component: "CustomDatePicker",
                    disable: false,
                    key: "hearingDate",
                    label: "CS_CASE_SELECT_HEARING_DATE",
                    className: "order-date-picker",
                    isMandatory: true,
                    customStyleLabelField: { display: "flex", justifyContent: "space-between" },
                    popUpStyleMain: { minHeight: "100%" },
                    populators: {
                      name: "hearingDate",
                      // error: "Required",
                    },
                  }}
                  formData={orderData}
                  onDateChange={(date) => setOrderData((orderData) => ({ ...orderData, hearingDate: new Date(date).setHours(0, 0, 0, 0) }))}
                />
              </LabelFieldPair>
              <LabelFieldPair className="case-label-field-pair">
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
                  }}
                  customLabel={customAttendeeLabel}
                  config={{
                    isSelectAll: true,
                  }}
                  // parentRef={targetRef}
                />
              </LabelFieldPair>
            </div>
          </div>
        </div>
        <div className="drawer-footer">
          <Button label={t("Add Other Items")} variation="outlined" onClick={() => onSubmit("add-other-items")} />
          <Button label={t("SAVE_DRAFT")} className={"order-drawer-save-btn"} onClick={() => onSubmit("save-draft")} />
        </div>
      </div>
    </div>
  );
};

export default OrderDrawer;
