const advocateDetailsFormConfig = [
  {
    body: [
      {
        type: "component",
        component: "MultipleAdvocatesAndPip",
        key: "multipleAdvocatesAndPip",
        labelHeading: "CS_ADVOCATE_HEADING",
        withoutLabel: true,
        populators: {
          isDependent: true,
          inputs: [
            {
              type: "radioInput",
              label: "CS_IF_COMPLAINANT_IS_PIP",
              name: "isComplainantPip",
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
              type: "textInput",
              label: "FIRST_NAME",
              name: "firstName",
            },
            {
              type: "textInput",
              label: "MIDDLE_NAME_OPTIONAL",
              name: "middleName",
            },
            {
              type: "textInput",
              label: "LAST_NAME",
              name: "lastName",
            },
            {
              fileKey: "vakalatnamaFileUpload",
              type: "DragDropComponent",
              name: "document",
              isDocDependentOn: "multipleAdvocatesAndPip",
              isDocDependentKey: "showVakalatNamaUpload",
              documentHeader: "UPLOAD_VAKALATNAMA",
              infoTooltipMessage: "UPLOAD_VAKALATNAMA",
              uploadGuidelines: "UPLOAD_DOC_10",
              maxFileSize: 10,
              maxFileErrorMessage: "CS_FILE_LIMIT_10_MB",
              fileTypes: ["JPG", "PDF", "PNG"],
              isMultipleUpload: true,
              downloadTemplateText: "VAKALATNAMA_TEMPLATE_TEXT",
              downloadTemplateLink:
                "https://oncourts.kerala.gov.in/minio-filestore/v1/files/id?tenantId=kl&fileStoreId=eb7407fb-5642-40d9-9f06-31e4895c75b0",
            },
            {
              infoHeader: "CS_PLEASE_NOTE",
              infoText: "AFFIDAVIT_NECESSARY_FOR_PIP",
              infoTooltipMessage: "ADVOCATE_DETAIL_NOTE",
              type: "InfoComponent",
            },
            {
              fileKey: "pipAffidavitFileUpload",
              type: "DragDropComponent",
              name: "document",
              isDocDependentOn: "multipleAdvocatesAndPip",
              isDocDependentKey: "showAffidavit",
              documentHeader: "UPLOAD_AFFIDAVIT",
              uploadGuidelines: "UPLOAD_DOC_10",
              maxFileSize: 10,
              maxFileErrorMessage: "CS_FILE_LIMIT_10_MB",
              fileTypes: ["JPG", "PDF", "PNG"],
              isMultipleUpload: true,
            },
          ],
        },
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
    vakalatnamaFileUpload: "UPLOAD_VAKALATNAMA",
    pipAffidavitFileUpload: "UPLOAD_PIP_AFFIDAVIT",
  },
};
