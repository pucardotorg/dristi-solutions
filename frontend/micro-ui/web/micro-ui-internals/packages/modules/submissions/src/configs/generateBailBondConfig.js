import {
  bailBondSuretyAddressInput,
  bailBondSuretyPopulatorInputs,
  buildBailBondSuretyUploadInput,
} from "./generateBailBondConfigShared";

export const bailBondConfig = [
  {
    body: [
      {
        inline: true,
        label: "PETITIONER_NAME",
        isMandatory: true,
        type: "dropdown",
        key: "selectComplainant",
        populators: {
          optionsKey: "name",
          styles: { maxWidth: "100%" },
          options: [
            {
              code: "complainantOne",
              name: "ComplainantOne",
            },
          ],
        },
      },
      {
        label: "PETITIONER_FATHER_NAME",
        isMandatory: true,
        key: "litigantFatherName",
        type: "text",
        populators: {
          name: "litigantFatherName",
          error: "CORE_REQUIRED_FIELD_ERROR",
          validation: {
            pattern: {
              message: "CORE_COMMON_APPLICANT_NAME_INVALID",
              masterName: "commonUiConfig",
              moduleName: "patternValidation",
              patternType: "userName",
            },
            minLength: 1,
            patternType: "Name",
          },
        },
      },
      {
        type: "amount",
        label: "BAIL_AMOUNT",
        isMandatory: true,
        key: "bailAmount",
        populators: {
          error: "CORE_REQUIRED_FIELD_ERROR",
          name: "bailAmount",
          prefix: "",
        },
      },
      {
        isMandatory: true,
        key: "bailType",
        type: "dropdown",
        label: "BAIL_TYPE",
        populators: {
          name: "bailType",
          optionsKey: "code",
          error: "CORE_REQUIRED_FIELD_ERROR",
          styles: { maxWidth: "100%" },
          required: true,
          isMandatory: true,
          options: [
            {
              code: "SURETY",
              name: "surety",
              showSurety: true,
            },
            {
              code: "PERSONAL",
              name: "personal",
              showSurety: false,
            },
          ],
          customStyle: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
        },
      },
    ],
  },
  {
    body: [
      {
        type: "component",
        key: "sureties",
        component: "SuretyComponent",
        name: "BAIL_SURETY",
        disable: false,
        isMandatory: false,
        populators: {
          hideInForm: false,
          inputs: [
            ...bailBondSuretyPopulatorInputs,
            bailBondSuretyAddressInput,
            buildBailBondSuretyUploadInput("identityProof", "IDENTITY_PROOF", true),
            buildBailBondSuretyUploadInput("proofOfSolvency", "PROOF_OF_SOLVENCY", true),
            buildBailBondSuretyUploadInput("otherDocuments", "OTHER_DOCUMENTS", false, "CS_IS_OPTIONAL"),
          ],
        },
      },
    ],
    dependentKey: {
      bailType: ["showSurety"],
    },
  },
];
