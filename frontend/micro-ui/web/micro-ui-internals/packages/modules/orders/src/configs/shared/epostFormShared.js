export const EPOST_STATUS_OPTIONS = [
  { code: "IN_TRANSIT", name: "In Transit", isEnabled: true },
  { code: "NOT_DELIVERED", name: "Not Delivered", isEnabled: true },
  { code: "DELIVERED", name: "Delivered", isEnabled: true },
  { code: "NOT_UPDATED", name: "Not Updated", isEnabled: true },
];

export const epostCurrentStatusField = {
  isMandatory: true,
  type: "dropdown",
  key: "currentStatus",
  label: "Current Status",
  disable: false,
  populators: {
    name: "currentStatus",
    optionsKey: "name",
    options: EPOST_STATUS_OPTIONS,
  },
};

export const epostRemarksTextAreaField = {
  type: "component",
  component: "SelectCustomTextArea",
  key: "remarks",
  isMandatory: false,
  withoutLabel: true,
  isInfinite: true,
  populators: {
    inputs: [
      {
        name: "text",
        placeholder: "TYPE_HERE_PLACEHOLDER",
        textAreaHeader: "ADDITIONAL_REMARKS",
        isOptional: true,
        type: "TextAreaComponent",
        maxLength: 300,
      },
    ],
  },
};

export const buildEpostDateField = (label, key) => ({
  type: "date",
  label,
  key,
  populators: {
    name: key === "dateOfDelivery" ? "dateOfDelivery" : "dateofBooking",
  },
});
