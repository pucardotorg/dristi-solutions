import { CardLabel, Dropdown, LabelFieldPair, TextInput } from "@egovernments/digit-ui-react-components";
import React, { useEffect, useState } from "react";
import ApplicationInfoComponent from "./ApplicationInfoComponent";
import { convertToDateInputFormat } from "../utils/index";
import { sanitizeData } from "@egovernments/digit-ui-module-dristi/src/Utils";

const convertToDisplayFormat = (dateStr) => {
  const [year, month, day] = dateStr.split("-");
  return `${day}-${month}-${year}`;
};

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
}) => {
  const [date, setDate] = useState(
    rowData?.taskDetails?.deliveryChannels?.statusChangeDate
      ? convertToDateInputFormat(rowData.taskDetails.deliveryChannels.statusChangeDate)
      : convertToDateInputFormat(rowData?.createdDate)
  );

  const deliveryOptions = [
    {
      key: "DELIVERED",
      value: "Delivered",
    },
    {
      key: "NOT_DELIVERED",
      value: "Not Delivered",
    },
    {
      key: "OTHER",
      value: "Other",
    },
  ];

  useEffect(() => {
    if (date) setUpdateStatusDate(date);
    const isSelectedDeliveryEmpty = !selectedDelievery || Object.keys(selectedDelievery).length === 0;
    if (!isSelectedDeliveryEmpty && date) handleSubmitButtonDisable(false);
    else handleSubmitButtonDisable(true);
  }, [selectedDelievery, date]);

  return (
    <div className="update-delivery-status">
      <LabelFieldPair className="case-label-field-pair">
        <CardLabel className="case-input-label">{`${t("Update Delivery Status")}`}</CardLabel>
        <Dropdown t={t} option={deliveryOptions} selected={selectedDelievery} optionKey={"value"} select={(e) => setSelectedDelievery(e)} />
      </LabelFieldPair>
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
