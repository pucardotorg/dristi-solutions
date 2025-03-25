import { editComplainantDetailsConfig } from "./editComplainantDetailsConfig";
import { editRespondentConfig } from "./editRespondentConfig";

const editProfileConfig = [
  {
    isOpen: false,
    isDisabled: false,
    title: "CS_LITIGENT_DETAILS",
    key: "litigentDetails",
    children: [
      {
        key: "complainantDetails",
        label: "CS_COMPLAINT_DETAILS",
        checked: false,
        isCompleted: false,
        isDisabled: false,
        pageConfig: editComplainantDetailsConfig,
        // pageConfig: [
        //   {
        //     moduleName: "commonUiConfig",
        //     masterDetails: [
        //       {
        //         name: "editComplainantDetailsConfig",
        //       },
        //     ],
        //   },
        // ],
      },
      {
        key: "respondentDetails",
        label: "CS_RESPONDENT_DETAILS",
        checked: false,
        isCompleted: false,
        isDisabled: false,
        pageConfig: editRespondentConfig,

        // pageConfig: [
        //   {
        //     moduleName: "commonUiConfig",
        //     masterDetails: [
        //       {
        //         name: "editRespondentConfig",
        //       },
        //     ],
        //   },
        // ],
      },
    ],
  },
];

export default editProfileConfig;
