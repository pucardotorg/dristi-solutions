/**
 * Citizen action dropdown options.
 */
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

/**
 * Mapping of employee actions to required roles.
 */
export const employeeActionsPermissionsMapping = [
  {
    label: "END_HEARING",
    requiredRoles: ["HEARING_APPROVER"],
  },
  {
    label: "GENERATE_ORDER",
    requiredRoles: ["ORDER_CREATOR"],
  },
  {
    label: "SUBMIT_DOCUMENTS",
    requiredRoles: ["EVIDENCE_CREATOR", "EVIDENCE_EDITOR"],
  },
  {
    label: "GENERATE_PAYMENT_DEMAND",
    requiredRoles: ["TASK_CREATOR"],
  },
  {
    label: "CREATE_BAIL_BOND",
    requiredRoles: ["PENDING_TASK_CONFIRM_BOND_SUBMISSION"],
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
    requiredRoles: ["ALLOW_ADD_WITNESS"],
  },
  {
    label: "TAKE_WITNESS_DEPOSITION",
    requiredRoles: ["EVIDENCE_EDITOR"],
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
    requiredRoles: ["EXAMINATION_CREATOR", "EXAMINATION_EDITOR"],
  },
];

/**
 * Builds the employee action options list based on current context.
 */
export const getEmployeeActionOptions = (isEmployee, hasHearingPriorityView, currentInProgressHearing) => {
  if (!isEmployee) return [];

  if (hasHearingPriorityView) {
    return currentInProgressHearing
      ? [
          { value: "NEXT_HEARING", label: "NEXT_HEARING" },
          { value: "GENERATE_ORDER", label: "GENERATE_ORDER" },
          { value: "SUBMIT_DOCUMENTS", label: "SUBMIT_DOCUMENTS" },
          { value: "DOWNLOAD_CASE_FILE", label: "DOWNLOAD_CASE_FILE" },
          { value: "GENERATE_PAYMENT_DEMAND", label: "GENERATE_PAYMENT_DEMAND" },
          { value: "SHOW_TIMELINE", label: "SHOW_TIMELINE" },
          { value: "ADD_WITNESS", label: "ADD_WITNESS" },
          { value: "TAKE_WITNESS_DEPOSITION", label: "TAKE_WITNESS_DEPOSITION" },
          { value: "RECORD_PLEA", label: "RECORD_PLEA" },
          { value: "RECORD_EXAMINATION_OF_ACCUSED", label: "RECORD_EXAMINATION_OF_ACCUSED" },
        ]
      : [
          { value: "DOWNLOAD_CASE_FILE", label: "DOWNLOAD_CASE_FILE" },
          { value: "SHOW_TIMELINE", label: "SHOW_TIMELINE" },
          { value: "ADD_WITNESS", label: "ADD_WITNESS" },
          { value: "TAKE_WITNESS_DEPOSITION", label: "TAKE_WITNESS_DEPOSITION" },
          { value: "RECORD_PLEA", label: "RECORD_PLEA" },
          { value: "RECORD_EXAMINATION_OF_ACCUSED", label: "RECORD_EXAMINATION_OF_ACCUSED" },
        ];
  }

  return [
    ...(currentInProgressHearing
      ? [
          { value: "END_HEARING", label: "END_HEARING" },
          { value: "SUBMIT_DOCUMENTS", label: "SUBMIT_DOCUMENTS" },
          { value: "GENERATE_PAYMENT_DEMAND", label: "GENERATE_PAYMENT_DEMAND" },
        ]
      : [
          { value: "CREATE_BAIL_BOND", label: "CREATE_BAIL_BOND" },
        ]),
    { value: "DOWNLOAD_CASE_FILE", label: "DOWNLOAD_CASE_FILE" },
    { value: "SHOW_TIMELINE", label: "SHOW_TIMELINE" },
    { value: "ADD_WITNESS", label: "ADD_WITNESS" },
    { value: "TAKE_WITNESS_DEPOSITION", label: "TAKE_WITNESS_DEPOSITION" },
    { value: "RECORD_PLEA", label: "RECORD_PLEA" },
    { value: "RECORD_EXAMINATION_OF_ACCUSED", label: "RECORD_EXAMINATION_OF_ACCUSED" },
  ];
};

/**
 * Filters action options based on user roles and permission mappings.
 */
export const filterActionsByPermissions = (options, roles, permissionsMapping) => {
  return options?.filter((option) => {
    const permissionMapping = permissionsMapping.find((mapping) => mapping.label === option.label);
    if (!permissionMapping) return true;
    if (!permissionMapping.requiredRoles || permissionMapping.requiredRoles.length === 0) return true;
    const userRoleCodes = roles?.map((role) => role.code) || [];
    return permissionMapping.requiredRoles.every((requiredRole) => userRoleCodes.includes(requiredRole));
  });
};
