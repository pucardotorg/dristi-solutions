export const bulkInboxCaseTitleTextField = {
  label: "CS_CASE_NAME_ID",
  type: "text",
  isMandatory: false,
  disable: false,
  populators: {
    name: "caseTitle",
    error: "BR_PATTERN_ERR_MSG",
    style: { maxWidth: "250px", minWidth: "200px", width: "220px" },
    validation: {
      pattern: {},
      minlength: 2,
    },
  },
};

export const bulkInboxDateField = {
  label: "DATE",
  isMandatory: false,
  key: "startOfTheDay",
  type: "date",
  disable: false,
  populators: {
    name: "startOfTheDay",
  },
};

export const bulkInboxProcessTypeField = {
  label: "PROCESS_TYPE",
  isMandatory: false,
  key: "type",
  type: "dropdown",
  populators: {
    name: "type",
    optionsKey: "code",
    mdmsConfig: {
      masterName: "DigitalizationForm",
      moduleName: "Order",
      select:
        "(data) => {return data['Order']?.DigitalizationForm?.map((item) => {return { code: item.code, name: item.name};}).sort((a, b) => a.code.localeCompare(b.code));}",
    },
  },
};

export const bulkInboxOrderStatusField = {
  label: "STATUS",
  isMandatory: false,
  key: "status",
  type: "dropdown",
  populators: {
    name: "status",
    optionsKey: "type",
    mdmsConfig: {
      masterName: "OrderStatus",
      moduleName: "Order",
      select:
        "(data) => {return data['Order'].OrderStatus?.filter((item)=>[`PENDING_BULK_E-SIGN`, `DRAFT_IN_PROGRESS`].includes(item.type)).sort((a, b) => a.type.localeCompare(b.type));}",
    },
  },
};
