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

export const updateEPostConfig = (status) => {
  if (status === "DELIVERED") {
    return [
      {
        body: [
          {
            isMandatory: true,
            type: "dropdown",
            key: "currentStatus",
            label: "Current Status",
            disable: false,
            populators: {
              name: "currentStatus",
              optionsKey: "name",
              options: [
                {
                  code: "IN_TRANSIT",
                  name: "In Transit",
                  isEnabled: true,
                },
                {
                  code: "NOT_DELIVERED",
                  name: "Not Delivered",
                  isEnabled: true,
                },
                {
                  code: "DELIVERED",
                  name: "Delivered",
                  isEnabled: true,
                },
                {
                  code: "NOT_UPDATED",
                  name: "Not Updated",
                  isEnabled: true,
                },
              ],
            },
          },
          {
            type: "date",
            label: "Date of Delivery",
            key: "dateOfDelivery",
            populators: {
              name: "dateOfDelivery",
            },
          },
        ],
      },
    ];
  }

  if (status === "NOT_DELIVERED") {
    return [
      {
        body: [
          {
            isMandatory: true,
            type: "dropdown",
            key: "currentStatus",
            label: "Current Status",
            disable: false,
            populators: {
              name: "currentStatus",
              optionsKey: "name",
              options: [
                {
                  code: "IN_TRANSIT",
                  name: "In Transit",
                  isEnabled: true,
                },
                {
                  code: "NOT_DELIVERED",
                  name: "Not Delivered",
                  isEnabled: true,
                },
                {
                  code: "DELIVERED",
                  name: "Delivered",
                  isEnabled: true,
                },
                {
                  code: "NOT_UPDATED",
                  name: "Not Updated",
                  isEnabled: true,
                },
              ],
            },
          },
          {
            type: "date",
            label: "Date of Delivery Attempted",
            key: "dateOfDelivery",
            populators: {
              name: "dateOfDelivery",
            },
          },
        ],
      },
    ];
  }

  return [
    {
      body: [
        {
          isMandatory: true,
          type: "dropdown",
          key: "currentStatus",
          label: "Current Status",
          disable: false,
          populators: {
            name: "currentStatus",
            optionsKey: "name",
            options: [
              {
                code: "IN_TRANSIT",
                name: "In Transit",
                isEnabled: true,
              },
              {
                code: "NOT_DELIVERED",
                name: "Not Delivered",
                isEnabled: true,
              },
              {
                code: "DELIVERED",
                name: "Delivered",
                isEnabled: true,
              },
              {
                code: "NOT_UPDATED",
                name: "Not Updated",
                isEnabled: true,
              },
            ],
          },
        },
      ],
    },
  ];
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
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "remarks",
        isMandatory: false,
        withoutLabel: true,
        // label: "ADDITIONAL_REMARKS",
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
      },
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
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "remarks",
        isMandatory: false,
        withoutLabel: true,
        // label: "ADDITIONAL_REMARKS",
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
      },
    ],
  },
];
