import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader } from "@egovernments/digit-ui-react-components";
import CustomSearchForm from "./CustomSearchForm";
import CustomTable from "./CustomTable";

const CustomInboxSearchComposer = ({ configs, customStyle, onFormValueChange, customActionComponents }) => {
    const { t } = useTranslation();
    const tenantId = window?.Digit.ULBService.getStateId();
    const searchConfig = configs?.sections?.search;
    const searchResultConfig = configs?.sections?.searchResult;
    const apiDetails = configs?.apiDetails;

    const [searchPayload, setSearchPayload] = useState(
        searchConfig?.uiConfig?.defaultValues || {}
    );

    const [pagination, setPagination] = useState({
        limit: apiDetails?.requestParam?.limit || 10,
        offset: apiDetails?.requestParam?.offset || 0,
    });

    // Call the UICustomizations preProcess to prep the request
    const reqCriteria = useMemo(() => ({
        body: {
            inbox: {
                moduleSearchCriteria: {},
            },
            ...apiDetails?.requestBody,
            criteria: searchPayload,
        },
        state: {
            searchForm: searchPayload,
            tableForm: pagination,
        },
        config: {
            select: (data) => data, // Fallback, preProcess usually overrides this
        },
    }), [apiDetails, searchPayload, pagination]);

    const moduleName = apiDetails?.moduleName;
    const masterName = apiDetails?.masterName;

    // In Dristi, Customizations are often mounted inside a master config space
    const customConfigSpace = masterName ? window?.Digit?.Customizations?.[masterName] : window?.Digit?.Customizations;
    const preProcessFn = customConfigSpace?.[moduleName]?.preProcess;

    const processedRequest = useMemo(() => preProcessFn
        ? preProcessFn(reqCriteria, { sortBy: undefined })
        : reqCriteria, [preProcessFn, reqCriteria]);

    // React Query fetching data
    const { data: rawData, isLoading, isFetching } = window?.Digit?.Hooks?.useCustomAPIHook({
        url: apiDetails?.serviceName,
        params: { tenantId, ...processedRequest?.body?.criteria?.pagination },
        body: processedRequest?.body,
        config: {
            enabled: true,
        },
    });

    const data = useMemo(() => {
        if (!rawData) return rawData;
        return processedRequest?.config?.select
            ? processedRequest.config.select(rawData)
            : rawData;
    }, [rawData, processedRequest?.config?.select]);

    const onSubmitSearch = (formData) => {
        setSearchPayload(formData);
        setPagination((prev) => ({ ...prev, offset: 0 })); // Reset page
    };

    const defaultData = useMemo(() => [], []);
    const tableData = data?.items || defaultData;

    const onClearSearch = () => {
        setSearchPayload(searchConfig?.uiConfig?.defaultValues || {});
        setPagination((prev) => ({ ...prev, offset: 0 }));
    };

    return (
        <div className="inbox-search-composer-wrapper" style={customStyle}>
            {searchConfig?.show && (
                <CustomSearchForm
                    config={searchConfig}
                    onSubmit={onSubmitSearch}
                    onClear={onClearSearch}
                    defaultValues={searchPayload}
                    actionComponents={customActionComponents}
                />
            )}

            {searchResultConfig?.show && (
                <div className="search-results-wrapper">
                    {isLoading || isFetching ? (
                        <Loader />
                    ) : (
                        <CustomTable
                            config={searchResultConfig}
                            data={tableData}
                            totalCount={data?.totalCount || 0}
                            pagination={pagination}
                            setPagination={setPagination}
                            onFormValueChange={onFormValueChange}
                            moduleName={moduleName}
                            masterName={masterName}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default CustomInboxSearchComposer;
