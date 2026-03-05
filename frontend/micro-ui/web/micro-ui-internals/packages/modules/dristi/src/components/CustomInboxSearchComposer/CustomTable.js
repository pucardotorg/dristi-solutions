import React, { useMemo, useEffect, useState } from "react";
import { Table } from "@egovernments/digit-ui-react-components";
import { useTranslation } from "react-i18next";

const CustomTable = ({ config, data, totalCount, pagination, setPagination, onFormValueChange, moduleName, masterName }) => {
    const { t } = useTranslation();
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [selectAll, setSelectAll] = useState(false);

    const onFormValueChangeRef = React.useRef(onFormValueChange);
    useEffect(() => {
        onFormValueChangeRef.current = onFormValueChange;
    }, [onFormValueChange]);

    // Sync internal checkbox state to parent wrapper via onFormValueChange
    useEffect(() => {
        if (onFormValueChangeRef.current) {
            const selectedData = data.filter((item) => selectedRows.has(item?.businessObject?.applicationNumber));
            onFormValueChangeRef.current({
                searchResult: selectedData
            });
        }
    }, [selectedRows, data]);

    const handleSelectAll = (e) => {
        const isChecked = e.target.checked;
        setSelectAll(isChecked);
        if (isChecked) {
            const allIds = data.map((item) => item?.businessObject?.applicationNumber);
            setSelectedRows(new Set(allIds));
        } else {
            setSelectedRows(new Set());
        }
    };

    const handleSelectRow = (e, rowData) => {
        const isChecked = e.target.checked;
        const appId = rowData?.businessObject?.applicationNumber;
        setSelectedRows((prev) => {
            const newSet = new Set(prev);
            if (isChecked) {
                newSet.add(appId);
            } else {
                newSet.delete(appId);
            }
            return newSet;
        });
    };

    const tableColumns = useMemo(() => {
        return config?.uiConfig?.columns?.map((col) => {
            return {
                Header: col.label === "SELECT" ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <input type="checkbox" checked={selectAll} onChange={handleSelectAll} style={{ cursor: "pointer", width: "16px", height: "16px" }} />
                    </div>
                ) : t(col.label),
                accessor: col.jsonPath || col.label,
                Cell: ({ row, value }) => {
                    const rowData = row.original;

                    if (col.label === "SELECT") {
                        const isChecked = selectedRows.has(rowData?.businessObject?.applicationNumber);
                        return (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <input type="checkbox" checked={isChecked} onChange={(e) => handleSelectRow(e, rowData)} style={{ cursor: "pointer", width: "16px", height: "16px" }} />
                            </div>
                        );
                    }

                    // Use the dynamic `additionalCustomizations` logic provided in `UICustomizations.js`
                    const customConfigSpace = masterName ? window?.Digit?.Customizations?.[masterName] : window?.Digit?.Customizations;
                    const customizationFn = customConfigSpace?.[moduleName]?.additionalCustomizations;
                    if (customizationFn && col.additionalCustomization) {
                        return customizationFn(rowData, col.label, col, value, t, data);
                    }

                    return value || "-";
                },
            };
        });
    }, [config, t, selectedRows, selectAll, data, moduleName, masterName]);

    const handlePageNext = () => setPagination((prev) => ({ ...prev, offset: prev.offset + prev.limit }));
    const handlePagePrev = () => setPagination((prev) => ({ ...prev, offset: prev.offset - prev.limit }));
    const handlePageSizeChange = (e) => setPagination((prev) => ({ ...prev, limit: Number(e.target.value), offset: 0 }));

    return (
        <div className="custom-table-wrapper" style={{ marginTop: "16px", background: "#fff" }}>
            <Table
                t={t}
                data={data}
                columns={tableColumns}
                getCellProps={(cellInfo) => {
                    return { style: { padding: "16px", textAlign: "left" } };
                }}
                onNextPage={handlePageNext}
                onPrevPage={handlePagePrev}
                currentPage={Math.floor(pagination.offset / pagination.limit)}
                pageSizeLimit={pagination.limit}
                totalRecords={totalCount}
                onPageSizeChange={handlePageSizeChange}
            />
        </div>
    );
};

export default CustomTable;
