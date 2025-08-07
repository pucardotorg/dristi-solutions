export const poaApplicationConfig = [
  {
    body: [
      {
        inline: true,
        type: "component",
        component: "SelectCustomTextArea",
        key: "comments",
        transformer: "customTextArea",
        isMandatory: false,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "COMMENTS",
              placeholder: "TYPE_HERE_PLACEHOLDER",
              isOptional: true,
              type: "TextAreaComponent",
            },
          ],
        },
      },
      {
        inline: true,
        type: "component",
        component: "SelectCustomTextArea",
        key: "prayer",
        transformer: "customTextArea",
        isMandatory: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "PRAYER",
              placeholder: "TYPE_HERE_PLACEHOLDER",
              type: "TextAreaComponent",
              textAreaStyle: {
                fontSize: "16px",
                fontWeight: 400,
                marginBottom: 0,
              },
              errorStyle:{
                marginTop: "5px"
              }
            },
          ],
          validation: {
            customValidationFn: {
              moduleName: "dristiSubmissions",
              masterName: "alphaNumericValidation",
            },
          },
          customStyle: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
        },
      },
    ],
  },
];
