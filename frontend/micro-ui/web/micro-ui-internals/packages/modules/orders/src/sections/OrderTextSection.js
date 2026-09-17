import React from "react";
import { CardLabelError } from "@egovernments/digit-ui-react-components";

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
  purposeOfHearingConfig,
  nextDateOfHearing,
}) => {
  return (
    <div className="generate-orders-v2-column">
      <div className="section-header">{t("ORDER_TEXT")}</div>
      {(currentInProgressHearing || currentOrder?.hearingNumber) && (
        <div>
          <div style={{ fontSize: "16px", fontWeight: "400", marginBottom: "5px", marginTop: "12px" }}>{t("ORDER_ATTENDANCE")}</div>
          <textarea
            value={(() => {
              // Use presentAttendees if available, otherwise use currentOrder.attendance.Present
              const presentNames =
                presentAttendees?.length > 0
                  ? presentAttendees?.map((item) => t(item?.name))?.join(", ")
                  : currentOrder?.attendance?.Present?.length > 0
                  ? attendeeOptions
                      ?.filter((option) => currentOrder.attendance.Present.includes(option.code))
                      ?.map((item) => t(item?.name))
                      ?.join(", ")
                  : "";

              // Use absentAttendees if available, otherwise use currentOrder.attendance.Absent
              const absentNames =
                absentAttendees?.length > 0
                  ? absentAttendees?.map((item) => t(item?.name))?.join(", ")
                  : currentOrder?.attendance?.Absent?.length > 0
                  ? attendeeOptions
                      ?.filter((option) => currentOrder.attendance.Absent.includes(option.code))
                      ?.map((item) => t(item?.name))
                      ?.join(", ")
                  : "";

              const presentText = presentNames ? `Present: ${presentNames}` : "";
              const absentText = absentNames ? `Absent: ${absentNames}` : "";
              const newline = presentText && absentText ? "\n" : "";

              return `${presentText}${newline}${absentText}`;
            })()}
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
            value={
              skipScheduling
                ? `${t("NO_NEXT_HEARING")}`
                : `${
                    purposeOfHearing || currentOrder?.purposeOfNextHearing
                      ? `${t("PURPOSE_OF_NEXT_HEARING")} ${t(purposeOfHearing?.code || purposeOfHearing || currentOrder?.purposeOfNextHearing)}`
                      : ``
                  }${(purposeOfHearing || currentOrder?.purposeOfNextHearing) && (nextHearingDate || currentOrder?.nextHearingDate) ? "\n" : ""}${
                    nextHearingDate || currentOrder?.nextHearingDate
                      ? `${t("DATE_TEXT")} ${new Date(nextHearingDate || currentOrder?.nextHearingDate).toLocaleDateString()}`
                      : ``
                  }`
            }
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

export default OrderTextSection;
