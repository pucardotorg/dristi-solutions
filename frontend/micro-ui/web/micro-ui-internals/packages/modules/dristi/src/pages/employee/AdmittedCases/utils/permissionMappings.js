// Citizen action options
export const citizenActionOptions = [
  {
    value: "RAISE_APPLICATION",
    label: "Raise Application",
  },
  {
    value: "SUBMIT_DOCUMENTS",
    label: "Submit Documents",
  },
  {
    value: "GENERATE_BAIL_BOND",
    label: "Generate Bail Bond",
  },
];

// Employee actions permissions mapping
export const employeeActionsPermissionsMapping = [
  {
    label: "END_HEARING",
    requiredRoles: ["HEARING_APPROVER"], // update hearing api validation
  },
  {
    label: "GENERATE_ORDER",
    requiredRoles: ["ORDER_CREATOR"], // order create api validation
  },
  {
    label: "SUBMIT_DOCUMENTS", // /evidence/v1/_create api, then /evidence/v1/_update api for signing
    requiredRoles: ["EVIDENCE_CREATOR", "EVIDENCE_EDITOR"],
  },
  {
    label: "GENERATE_PAYMENT_DEMAND",
    requiredRoles: ["TASK_CREATOR"], // task create api validation
  },
  {
    label: "CREATE_BAIL_BOND",
    requiredRoles: ["PENDING_TASK_CONFIRM_BOND_SUBMISSION"],
    // The employee which has this role, wil receive this pending task so for create button also we are using same role.
  },
  {
    label: "DOWNLOAD_CASE_FILE",
    requiredRoles: [],
  },
  {
    label: "SHOW_TIMELINE",
    requiredRoles: [],
  },
  {
    label: "ADD_WITNESS",
    requiredRoles: ["ALLOW_ADD_WITNESS"], // add witness api validation
  },
  {
    label: "TAKE_WITNESS_DEPOSITION",
    requiredRoles: ["EVIDENCE_EDITOR"], // update evidence api validation
  },
  {
    label: "VIEW_CALENDAR",
    requiredRoles: [],
  },
  {
    label: "RECORD_PLEA",
    requiredRoles: ["PLEA_CREATOR", "PLEA_EDITOR"],
  },
  {
    label: "RECORD_EXAMINATION_OF_ACCUSED",
    requiredRoles: ["EXAMINATION_CREATOR", "EXAMINATION_EDITOR"], // TODO: update this when backend validation is done.
  },
];

// Take action options
export const takeActionOptions = [
  { label: "CS_GENERATE_ORDER" },
  { label: "SUBMIT_DOCUMENTS" },
  { label: "GENERATE_PAYMENT_DEMAND" },
];

// Helper function to get employee action options based on context
export const getEmployeeActionOptions = (isEmployee, hasHearingPriorityView, currentInProgressHearing) => {
  if (!isEmployee) return [];

  if (hasHearingPriorityView) {
    return currentInProgressHearing
      ? [
          {
            value: "NEXT_HEARING",
            label: "NEXT_HEARING",
          },
          {
            value: "GENERATE_ORDER",
            label: "GENERATE_ORDER",
          },
          {
            value: "SUBMIT_DOCUMENTS",
            label: "SUBMIT_DOCUMENTS",
          },
          {
            value: "DOWNLOAD_CASE_FILE",
            label: "DOWNLOAD_CASE_FILE",
          },
          {
            value: "GENERATE_PAYMENT_DEMAND",
            label: "GENERATE_PAYMENT_DEMAND",
          },
          {
            value: "SHOW_TIMELINE",
            label: "SHOW_TIMELINE",
          },
          {
            value: "ADD_WITNESS",
            label: "ADD_WITNESS",
          },
          {
            value: "TAKE_WITNESS_DEPOSITION",
            label: "TAKE_WITNESS_DEPOSITION",
          },
          { value: "RECORD_PLEA", label: "RECORD_PLEA" },
          {
            value: "RECORD_EXAMINATION_OF_ACCUSED",
            label: "RECORD_EXAMINATION_OF_ACCUSED",
          },
        ]
      : [
          {
            value: "DOWNLOAD_CASE_FILE",
            label: "DOWNLOAD_CASE_FILE",
          },
          {
            value: "SHOW_TIMELINE",
            label: "SHOW_TIMELINE",
          },
          {
            value: "ADD_WITNESS",
            label: "ADD_WITNESS",
          },
          {
            value: "TAKE_WITNESS_DEPOSITION",
            label: "TAKE_WITNESS_DEPOSITION",
          },
          { value: "RECORD_PLEA", label: "RECORD_PLEA" },
          {
            value: "RECORD_EXAMINATION_OF_ACCUSED",
            label: "RECORD_EXAMINATION_OF_ACCUSED",
          },
        ];
  } else {
    return [
      ...(currentInProgressHearing
        ? [
            {
              value: "END_HEARING",
              label: "END_HEARING",
            },
            {
              value: "SUBMIT_DOCUMENTS",
              label: "SUBMIT_DOCUMENTS",
            },
            {
              value: "GENERATE_PAYMENT_DEMAND",
              label: "GENERATE_PAYMENT_DEMAND",
            },
          ]
        : [
            {
              value: "CREATE_BAIL_BOND",
              label: "CREATE_BAIL_BOND",
            },
          ]),
      {
        value: "DOWNLOAD_CASE_FILE",
        label: "DOWNLOAD_CASE_FILE",
      },
      {
        value: "SHOW_TIMELINE",
        label: "SHOW_TIMELINE",
      },
      {
        value: "ADD_WITNESS",
        label: "ADD_WITNESS",
      },
      {
        value: "TAKE_WITNESS_DEPOSITION",
        label: "TAKE_WITNESS_DEPOSITION",
      },
      { value: "RECORD_PLEA", label: "RECORD_PLEA" },
      {
        value: "RECORD_EXAMINATION_OF_ACCUSED",
        label: "RECORD_EXAMINATION_OF_ACCUSED",
      },
    ];
  }
};

// Helper function to filter actions based on permissions
export const filterActionsByPermissions = (actionOptions, permissionsMapping, roles) => {
  return actionOptions?.filter((option) => {
    // Find matching permission mapping for this action
    const permissionMapping = permissionsMapping.find((mapping) => mapping.label === option.label);

    // If no mapping found, allow the action (no restrictions)
    if (!permissionMapping) {
      return true;
    }

    // If no required roles specified, allow the action
    if (!permissionMapping.requiredRoles || permissionMapping.requiredRoles.length === 0) {
      return true;
    }

    // Check if user has all required roles
    const userRoleCodes = roles?.map((role) => role.code) || [];
    return permissionMapping.requiredRoles.every((requiredRole) => userRoleCodes.includes(requiredRole));
  });
};
