import {
  epostCurrentStatusField,
  epostRemarksTextAreaField,
} from "./shared/epostFormShared";

export const printAndSendDocumentsConfig = [
  {
    body: [
      {
        inline: false,
        label: "Bar Code",
        isMandatory: true,
        key: "barCode",
        type: "text",
        disable: false,
        populators: { name: "barCode", error: "Required" },
      },
      {
        type: "date",
        label: "Date of Booking",
        key: "dateOfBooking",
        populators: {
          name: "dateofBooking",
        },
      },
    ],
  },
];

const buildStatusUpdateBody = (dateLabel) => [
  {
    body: [
      epostCurrentStatusField,
      {
        type: "date",
        label: dateLabel,
        key: "dateOfDelivery",
        populators: {
          name: "dateOfDelivery",
        },
      },
    ],
  },
];

export const updateEPostConfig = (status) => {
  if (status === "DELIVERED") {
    return buildStatusUpdateBody("Date of Delivery");
  }

  if (status === "NOT_DELIVERED") {
    return buildStatusUpdateBody("Date of Delivery Attempted");
  }

  return [{ body: [epostCurrentStatusField] }];
};

export const updateEpostStatusPendingConfig = [
  {
    body: [
      {
        isMandatory: true,
        type: "date",
        label: "DELIEVRY_DATE",
        key: "statusDate",
        disable: false,
        populators: {
          name: "statusDate",
          error: "CORE_REQUIRED_FIELD_ERROR",
          validation: {},
        },
      },
      {
        isMandatory: true,
        type: "text",
        label: "SPEED_POST_ID",
        key: "speedPostId",
        populators: {
          name: "speedPostId",
          error: "ALPHANUMERIC_VALIDATION_ERROR",
          validation: {
            pattern: /^[0-9A-Za-z]+$/i,
            message: "ALPHANUMERIC_VALIDATION_ERROR",
          },
        },
      },
      epostRemarksTextAreaField,
    ],
  },
];

export const updateEpostStatusConfig = [
  {
    body: [
      {
        isMandatory: true,
        type: "date",
        label: "DELIEVRY_DATE",
        key: "statusDate",
        disable: false,
        populators: {
          name: "statusDate",
          error: "CORE_REQUIRED_FIELD_ERROR",
          validation: {
            customValidationFn: {
              moduleName: "dristiOrders",
              masterName: "maxTodayDateValidation",
            },
          },
        },
      },
      {
        isMandatory: true,
        key: "status",
        type: "dropdown",
        label: "STATUS",
        populators: {
          name: "status",
          optionsKey: "name",
          error: "CORE_REQUIRED_FIELD_ERROR",
          styles: { maxWidth: "100%" },
          required: true,
          isMandatory: true,
          options: [],
          customStyle: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
        },
      },
      epostRemarksTextAreaField,
    ],
  },
];
