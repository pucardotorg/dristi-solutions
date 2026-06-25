import { CardLabel, Dropdown, LabelFieldPair, TextInput } from "@egovernments/digit-ui-react-components";
import React, { useEffect, useState } from "react";
import ApplicationInfoComponent from "./ApplicationInfoComponent";
import { convertToDateInputFormat } from "../utils/index";
import { sanitizeData } from "@egovernments/digit-ui-module-dristi/src/Utils";

const SUMMONS_REASON_OPTIONS = [
  { key: "ADDRESS_NOT_FOUND", value: "Address not found" },
  { key: "DOOR_LOCKED", value: "Door locked" },
  { key: "PERSON_NOT_PRESENT", value: "Person not present" },
  { key: "DELIVERY_REFUSED", value: "Delivery Refused" },
  { key: "OTHER", value: "Other" },
];

const WARRANT_REASON_OPTIONS = [
  { key: "ACCUSED_NOT_FOUND", value: "Accused not found" },
  { key: "SHO_SOUGHT_TIME", value: "SHO sought time" },
  { key: "ACCUSED_ABSCONDING", value: "Accused absconding" },
  { key: "OTHER", value: "Other" },
];

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
  const isSummons = (orderType || rowData?.taskType) === "SUMMONS";
  const reasonOptions = isSummons ? SUMMONS_REASON_OPTIONS : WARRANT_REASON_OPTIONS;
  const showReasonDropdown = selectedDelievery?.key === "NOT_DELIVERED" && !isIcops;
  const showReasonText = showReasonDropdown && selectedReason?.key === "OTHER";

  const deliveryOptions = [
    { key: "DELIVERED", value: "Delivered" },
    { key: "NOT_DELIVERED", value: "Not Delivered" },
    { key: "OTHER", value: "Other" },
  ];

  useEffect(() => {
    if (date) setUpdateStatusDate(date);
    const isSelectedDeliveryEmpty = !selectedDelievery || Object.keys(selectedDelievery).length === 0;
    const isReasonRequired = selectedDelievery?.key === "NOT_DELIVERED" && !isIcops;
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
          <CardLabel className="case-input-label">{`${t("Reason for Non-Delivery")} *`}</CardLabel>
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
