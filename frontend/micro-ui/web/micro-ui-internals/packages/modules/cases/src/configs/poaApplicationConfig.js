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
    ],
  },
];
