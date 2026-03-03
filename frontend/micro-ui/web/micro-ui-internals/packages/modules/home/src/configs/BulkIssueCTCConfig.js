const defaultSearchValues = {
    date: "",
    documentType: "",
    searchQuery: "",
};

export const bulkIssueCTCConfig = {
    type: "search",
    apiDetails: {
        serviceName: "/task/v1/table/search",
        requestParam: {
            tenantId: Digit.ULBService.getCurrentTenantId(),
            limit: 10,
            offset: 0,
        },
        requestBody: {
            apiOperation: "SEARCH",
            criteria: {},
        },
        minParametersForSearchForm: 0,
        masterName: "commonUiConfig",
        moduleName: "bulkIssueCTCConfig",
        searchFormJsonPath: "requestBody.criteria",
        filterFormJsonPath: "requestBody.criteria",
        tableFormJsonPath: "requestParam",
    },
    sections: {
        search: {
            uiConfig: {
                formClassName: "custom-both-clear-search",
                primaryLabel: "ES_COMMON_SEARCH",
                secondaryLabel: "ES_COMMON_CLEAR_SEARCH",
                minReqFields: 0,
                defaultValues: defaultSearchValues,
                fields: [
                    {
                        label: "Date",
                        type: "date",
                        isMandatory: false,
                        disable: false,
                        populators: {
                            name: "date",
                            error: "BR_PATTERN_ERR_MSG",
                            style: { maxWidth: "200px" },
                        },
                    },
                    {
                        label: "Documents",
                        type: "dropdown",
                        isMandatory: false,
                        disable: false,
                        populators: {
                            name: "documentType",
                            optionsKey: "name",
                            options: [
                                { code: "ALL", name: "All Documents" },
                                { code: "CHEQUE", name: "Cheque" },
                                { code: "NOTICE", name: "Legal Demand Notice" },
                                { code: "VAKALATNAMA", name: "Vakalatnama" },
                                { code: "BANK_STATEMENT", name: "Bank Statement" }
                            ],
                            error: "BR_PATTERN_ERR_MSG",
                            style: { maxWidth: "250px" },
                        },
                    },
                    {
                        label: "Search Case Name",
                        type: "text",
                        isMandatory: false,
                        disable: false,
                        populators: {
                            name: "searchQuery",
                            error: "BR_PATTERN_ERR_MSG",
                            style: { maxWidth: "350px", minWidth: "250px", width: "100%" },
                            validation: {
                                pattern: {},
                                minlength: 2,
                            },
                        },
                    },
                ],
            },
            show: true,
        },
        searchResult: {
            tenantId: Digit.ULBService.getCurrentTenantId(),
            uiConfig: {
                columns: [
                    {
                        label: "SELECT",
                        additionalCustomization: true,
                    },
                    {
                        label: "DOCUMENTS_REQUESTED",
                        jsonPath: "businessObject.documentsRequested",
                        additionalCustomization: true,
                    },
                    {
                        label: "CASE_NAME",
                        jsonPath: "businessObject.caseName",
                        additionalCustomization: true,
                    },
                    {
                        label: "CASE_NUMBER",
                        jsonPath: "businessObject.caseNumber",
                        additionalCustomization: true,
                    },
                    {
                        label: "APPLICATION_NUMBER",
                        jsonPath: "businessObject.applicationNumber",
                        additionalCustomization: true,
                    },
                ],
                resultsJsonPath: "items",
                enableColumnSort: true,
            },
            show: true,
        },
    },
};
