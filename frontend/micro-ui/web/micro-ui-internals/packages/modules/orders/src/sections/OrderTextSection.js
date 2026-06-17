import React from "react";
import PropTypes from "prop-types";
import { CardLabelError } from "@egovernments/digit-ui-react-components";

const buildNamesFromSelectedAttendees = (attendees, t) =>
  attendees?.length > 0 ? attendees.map((item) => t(item?.name)).join(", ") : "";

const buildNamesFromOrderAttendance = (codes, attendeeOptions, t) => {
  if (!codes?.length || !attendeeOptions?.length) return "";
  return attendeeOptions
    .filter((option) => codes.includes(option.code))
    .map((item) => t(item?.name))
    .join(", ");
};

const getPresentAttendanceText = ({ presentAttendees, currentOrder, attendeeOptions, t }) => {
  const fromSelections = buildNamesFromSelectedAttendees(presentAttendees, t);
  if (fromSelections) return fromSelections;
  return buildNamesFromOrderAttendance(currentOrder?.attendance?.Present, attendeeOptions, t);
};

const getAbsentAttendanceText = ({ absentAttendees, currentOrder, attendeeOptions, t }) => {
  const fromSelections = buildNamesFromSelectedAttendees(absentAttendees, t);
  if (fromSelections) return fromSelections;
  return buildNamesFromOrderAttendance(currentOrder?.attendance?.Absent, attendeeOptions, t);
};

const formatAttendanceSummary = ({ presentAttendees, absentAttendees, currentOrder, attendeeOptions, t }) => {
  const presentNames = getPresentAttendanceText({ presentAttendees, currentOrder, attendeeOptions, t });
  const absentNames = getAbsentAttendanceText({ absentAttendees, currentOrder, attendeeOptions, t });
  const presentText = presentNames ? `Present: ${presentNames}` : "";
  const absentText = absentNames ? `Absent: ${absentNames}` : "";
  const newline = presentText && absentText ? "\n" : "";
  return `${presentText}${newline}${absentText}`;
};

const resolvePurposeForNextHearingLabel = (purposeOfHearing, currentOrder) => {
  if (purposeOfHearing && typeof purposeOfHearing === "object" && purposeOfHearing.code != null) {
    return purposeOfHearing.code;
  }
  if (purposeOfHearing != null && purposeOfHearing !== "" && typeof purposeOfHearing !== "object") {
    return purposeOfHearing;
  }
  return currentOrder?.purposeOfNextHearing;
};

const formatNextHearingSummary = (t, skipScheduling, purposeOfHearing, currentOrder, nextHearingDate) => {
  if (skipScheduling) {
    return t("NO_NEXT_HEARING");
  }
  const purposeKey = resolvePurposeForNextHearingLabel(purposeOfHearing, currentOrder);
  const purposeLine = purposeKey ? `${t("PURPOSE_OF_NEXT_HEARING")} ${t(purposeKey)}` : "";
  const dateRaw = nextHearingDate || currentOrder?.nextHearingDate;
  const divider = purposeLine && dateRaw ? "\n" : "";
  const dateLine = dateRaw ? `${t("DATE_TEXT")} ${new Date(dateRaw).toLocaleDateString()}` : "";
  return `${purposeLine}${divider}${dateLine}`;
};

/**
 * Renders the "Order Text" right column including:
 * - Attendance summary textarea (present/absent names)
 * - Item text (SelectCustomFormatterTextArea)
 * - Next hearing summary textarea
 * Extracted from GenerateOrdersV2.js for maintainability.
 */
const OrderTextSection = ({
  t,
  currentInProgressHearing,
  currentOrder,
  presentAttendees,
  absentAttendees,
  attendeeOptions,
  SelectCustomFormatterTextArea,
  itemTextConfig,
  onItemTextSelect,
  errors,
  skipScheduling,
  purposeOfHearing,
  nextHearingDate,
}) => {
  return (
    <div className="generate-orders-v2-column">
      <div className="section-header">{t("ORDER_TEXT")}</div>
      {(currentInProgressHearing || currentOrder?.hearingNumber) && (
        <div>
          <div style={{ fontSize: "16px", fontWeight: "400", marginBottom: "5px", marginTop: "12px" }}>{t("ORDER_ATTENDANCE")}</div>
          <textarea
            value={formatAttendanceSummary({ presentAttendees, absentAttendees, currentOrder, attendeeOptions, t })}
            rows={3}
            maxLength={1000}
            className={`custom-textarea-style`}
            disabled={true}
            readOnly={true}
          ></textarea>
        </div>
      )}

      <div>
        <div style={{ fontSize: "16px", fontWeight: "400", marginBottom: "5px", marginTop: "12px" }}>{t("ITEM_TEXT")}</div>
        <SelectCustomFormatterTextArea
          t={t}
          config={itemTextConfig}
          formData={{ itemText: { itemText: currentOrder?.itemText || "" } }}
          onSelect={onItemTextSelect}
          errors={{}}
        />
        {errors["itemText"] && <CardLabelError>{t(errors["itemText"]?.msg || "CORE_REQUIRED_FIELD_ERROR")}</CardLabelError>}
      </div>

      {(currentInProgressHearing || currentOrder?.hearingNumber) && (
        <div>
          <div style={{ fontSize: "16px", fontWeight: "400", marginBottom: "5px", marginTop: "12px" }}>{t("NEXT_HEARING_TEXT")}</div>
          <textarea
            value={formatNextHearingSummary(t, skipScheduling, purposeOfHearing, currentOrder, nextHearingDate)}
            rows={3}
            maxLength={1000}
            className={`custom-textarea-style`}
            disabled={true}
            readOnly={true}
          ></textarea>
        </div>
      )}
    </div>
  );
};

OrderTextSection.propTypes = {
  absentAttendees: PropTypes.arrayOf(PropTypes.object),
  attendeeOptions: PropTypes.arrayOf(PropTypes.shape({ code: PropTypes.string, name: PropTypes.any })),
  currentInProgressHearing: PropTypes.any,
  currentOrder: PropTypes.shape({
    attendance: PropTypes.shape({
      Absent: PropTypes.array,
      Present: PropTypes.array,
    }),
    hearingNumber: PropTypes.any,
    itemText: PropTypes.any,
    nextHearingDate: PropTypes.any,
    purposeOfNextHearing: PropTypes.any,
  }),
  errors: PropTypes.object,
  itemTextConfig: PropTypes.object,
  nextHearingDate: PropTypes.any,
  onItemTextSelect: PropTypes.func.isRequired,
  presentAttendees: PropTypes.arrayOf(PropTypes.object),
  purposeOfHearing: PropTypes.any,
  SelectCustomFormatterTextArea: PropTypes.elementType.isRequired,
  skipScheduling: PropTypes.bool,
  t: PropTypes.func.isRequired,
};

export default OrderTextSection;
