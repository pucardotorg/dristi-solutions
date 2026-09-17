const advocateDetailsFormConfig = [
  {
    body: [
      {
        key: "multipleAdvocatesAndPip",
        type: "component",
        component: "MultipleAdvocatesAndPip",
        populators: {
          inputs: [
            {
              name: "isComplainantPip",
              type: "radioInput",
              label: "CS_IF_COMPLAINANT_IS_PIP",
              options: [
                {
                  code: "YES",
                  name: "Yes",
                  isEnabled: true,
                },
                {
                  code: "NO",
                  name: "No",
                  isEnabled: true,
                },
              ],
            },
            {
              name: "numberOfAdvocates",
              type: "textInput",
              label: "CS_NUMBER_OF_ADVOCATES",
            },
            {
              name: "firstName",
              type: "textInput",
              label: "FIRST_NAME",
            },
            {
              name: "middleName",
              type: "textInput",
              label: "MIDDLE_NAME_OPTIONAL",
            },
            {
              name: "lastName",
              type: "textInput",
              label: "LAST_NAME",
            },
            {
              name: "document",
              type: "DragDropComponent",
              fileKey: "vakalatnamaFileUpload",
              fileTypes: ["JPG", "PDF", "PNG", "JPEG"],
              maxFileSize: 10,
              documentHeader: "UPLOAD_VAKALATNAMA",
              isDocDependentOn: "multipleAdvocatesAndPip",
              isMultipleUpload: true,
              uploadGuidelines: "UPLOAD_DOC_10",
              isDocDependentKey: "showVakalatNamaUpload",
              infoTooltipMessage: "UPLOAD_VAKALATNAMA",
              maxFileErrorMessage: "CS_FILE_LIMIT_10_MB",
              downloadTemplateLink:
                "https://oncourts.kerala.gov.in/minio-filestore/v1/files/id?tenantId=kl&fileStoreId=eb7407fb-5642-40d9-9f06-31e4895c75b0",
              downloadTemplateText: "VAKALATNAMA_TEMPLATE_TEXT",
            },
            {
              type: "InfoComponent",
              infoText: "AFFIDAVIT_NECESSARY_FOR_PIP",
              infoHeader: "CS_PLEASE_NOTE",
              infoTooltipMessage: "ADVOCATE_DETAIL_NOTE",
            },
            {
              name: "document",
              type: "DragDropComponent",
              fileKey: "pipAffidavitFileUpload",
              fileTypes: ["JPG", "PDF", "PNG", "JPEG"],
              maxFileSize: 10,
              documentHeader: "UPLOAD_AFFIDAVIT",
              isDocDependentOn: "multipleAdvocatesAndPip",
              isMultipleUpload: true,
              uploadGuidelines: "UPLOAD_DOC_10",
              isDocDependentKey: "showAffidavit",
              maxFileErrorMessage: "CS_FILE_LIMIT_10_MB",
            },
          ],
          isDependent: true,
        },
        labelHeading: "CS_ADVOCATE_HEADING",
        withoutLabel: true,
      },
    ],
  },
];

export const advocateDetailsConfig = {
  formconfig: advocateDetailsFormConfig,
  header: "CS_ADVOCATE_DETAILS_HEADING",
  subtext: "CS_ADVOCATE_DETAILS_SUBTEXT",
  className: "advocate-detail",
  selectDocumentName: {
    vakalatnamaFileUpload: "VAKALATNAMA",
    pipAffidavitFileUpload: "UPLOAD_PIP_AFFIDAVIT",
  },
};
