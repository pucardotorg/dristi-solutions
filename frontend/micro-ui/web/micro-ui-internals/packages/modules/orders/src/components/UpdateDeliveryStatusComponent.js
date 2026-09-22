import { CardLabel, Dropdown, LabelFieldPair, TextInput } from "@egovernments/digit-ui-react-components";
import React, { useEffect, useState } from "react";
import ApplicationInfoComponent from "./ApplicationInfoComponent";
import { convertToDateInputFormat } from "../utils/index";
import { NON_DELIVERY_REASON_OPTIONS } from "../utils/constants";
import { sanitizeData } from "@egovernments/digit-ui-module-dristi/src/Utils";

const UpdateDeliveryStatusComponent = ({
  t,
  infos,
  links,
  handleSubmitButtonDisable,
  rowData,
  selectedDelievery,
  setSelectedDelievery,
  remarks,
  setRemarks,
  setUpdateStatusDate,
  orderType,
  selectedReason,
  setSelectedReason,
  reasonText,
  setReasonText,
}) => {
  const [date, setDate] = useState(
    rowData?.taskDetails?.deliveryChannels?.statusChangeDate
      ? convertToDateInputFormat(rowData.taskDetails.deliveryChannels.statusChangeDate)
      : convertToDateInputFormat(rowData?.createdDate)
  );

  const isIcops = rowData?.taskDetails?.deliveryChannels?.channelCode === "POLICE";
  const isRpad = rowData?.taskDetails?.deliveryChannels?.channelCode === "RPAD";
  const isWarrant = rowData?.taskType === "WARRANT";
  const reasonOptions = isWarrant ? NON_DELIVERY_REASON_OPTIONS.WARRANT : NON_DELIVERY_REASON_OPTIONS.SUMMONS;
  const showReasonDropdown = selectedDelievery?.key === "NOT_DELIVERED" && isRpad;
  const showReasonText = showReasonDropdown && selectedReason?.key === "OTHER";

  const deliveryOptions = [
    { key: "DELIVERED", value: "Delivered" },
    { key: "NOT_DELIVERED", value: "Not Delivered" },
    { key: "OTHER", value: "Other" },
  ];

  useEffect(() => {
    if (date) setUpdateStatusDate(date);
    const isSelectedDeliveryEmpty = !selectedDelievery || Object.keys(selectedDelievery).length === 0;
    const isReasonRequired = showReasonDropdown;
    const isReasonEmpty = !selectedReason || Object.keys(selectedReason).length === 0;
    if (!isSelectedDeliveryEmpty && date && (!isReasonRequired || !isReasonEmpty)) {
      handleSubmitButtonDisable(false);
    } else {
      handleSubmitButtonDisable(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDelievery, date, selectedReason, isIcops]);

  return (
    <div className="update-delivery-status">
      <LabelFieldPair className="case-label-field-pair">
        <CardLabel className="case-input-label">{`${t("Update Delivery Status")}`}</CardLabel>
        <Dropdown
          t={t}
          option={deliveryOptions}
          selected={selectedDelievery}
          optionKey={"value"}
          freeze={true}
          select={(e) => {
            setSelectedDelievery(e);
            if (e?.key !== "NOT_DELIVERED") {
              setSelectedReason({});
              setReasonText("");
            }
          }}
        />
      </LabelFieldPair>

      {showReasonDropdown && (
        <LabelFieldPair className="case-label-field-pair">
          <CardLabel className="case-input-label">{`${t("REASON_FOR_NON_DELIVERY")} *`}</CardLabel>
          <Dropdown
            t={t}
            option={reasonOptions}
            selected={selectedReason}
            optionKey={"value"}
            freeze={true}
            select={(e) => {
              setSelectedReason(e);
              if (e?.key !== "OTHER") setReasonText("");
            }}
          />
        </LabelFieldPair>
      )}

      {showReasonText && (
        <LabelFieldPair className="case-label-field-pair">
          <CardLabel className="case-input-label">{`${t("Specify Reason (optional)")}`}</CardLabel>
          <TextInput value={reasonText} type={"text"} name={"reason-text"} onChange={(e) => setReasonText(sanitizeData(e?.target?.value))} />
        </LabelFieldPair>
      )}

      {selectedDelievery && (
        <LabelFieldPair className="case-label-field-pair">
          <CardLabel className="case-input-label">{`${t("Update Delivery Date")}`}</CardLabel>
          <TextInput
            value={date.replace(/(\d{2})-(\d{2})-(\d{4})/, "$3-$2-$1")}
            type={"date"}
            name={"delivery-date"}
            onChange={(e) => {
              setDate(e?.target?.value);
              setUpdateStatusDate(e?.target?.value);
            }}
          />
        </LabelFieldPair>
      )}

      <LabelFieldPair className="case-label-field-pair">
        <CardLabel className="case-input-label">{`${t("Remarks (optional)")}`}</CardLabel>
        <TextInput
          value={remarks}
          type={"text"}
          name={"remarks"}
          onChange={(e) => {
            setRemarks(sanitizeData(e?.target?.value));
          }}
        />
      </LabelFieldPair>

      <ApplicationInfoComponent infos={infos} links={links} />
    </div>
  );
};

export default UpdateDeliveryStatusComponent;
