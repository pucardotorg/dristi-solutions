import { CardLabelError, Dropdown } from "@egovernments/digit-ui-components";
import { CustomMultiSelectDropdown } from "@egovernments/digit-ui-module-dristi/src/components/CustomMultiSelectDropdown";
import { CustomAddIcon } from "@egovernments/digit-ui-module-dristi/src/icons/svgIndex";
import React, { useMemo, useState } from "react";

const MultiPartyAddressSelector = ({ t, config, formData = {}, onSelect, errors }) => {
  const [activeDropdownIndex, setActiveDropdownIndex] = useState(null);

  const inputs = useMemo(
    () =>
      config?.populators?.inputs || [
        {
          name: "select address",
          errorStyle: {},
          disable: true,
        },
      ],
    [config?.populators?.inputs]
  );

  const selectedRows = useMemo(() => {
    return formData?.[config?.key] || [{ selectedParty: null, selectedAddresses: [] }];
  }, [formData, config?.key]);

  const partyOptions = useMemo(() => {
    return [];
  }, []);

  const updateRow = (index, field, value) => {
    const updatedData = [...(selectedRows || [])];
    if (field === "selectedParty") {
      updatedData[index] = {
        selectedParty: value,
        selectedAddresses: [],
      };
    } else {
      updatedData[index] = { ...updatedData[index], [field]: value };
    }
    onSelect?.(config?.key, updatedData);
  };

  const addRow = () => onSelect?.(config?.key, [...(selectedRows || []), { selectedParty: null, selectedAddresses: [] }]);

  const removeRow = (index) => {
    const updatedData = selectedRows?.filter((_, i) => i !== index);
    onSelect?.(config?.key, updatedData);
  };

  return (
    <div className="multi-party-address-wrapper">
      {selectedRows?.map((row, index) => {
        const currentPartyData = partyOptions?.find((opt) => opt?.party?.id === row?.selectedParty?.id);
        const availableAddresses = currentPartyData?.address || [];

        return (
          <div key={index} className="party-card">
            {selectedRows?.length > 1 && (
              <div onClick={() => removeRow(index)} className="delete-btn">
                <svg width="16" height="18" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M6.10764 5.73407e-07H7.2257C7.57713 -1.13475e-05 7.8803 -2.16787e-05 8.13002 0.0203808C8.39358 0.0419148 8.65573 0.0894588 8.90798 0.217988C9.2843 0.409735 9.59027 0.715696 9.78201 1.09202C9.91054 1.34427 9.95809 1.60642 9.97962 1.86998C9.99791 2.09383 9.99979 2.36065 9.99998 2.66667H12.6667C13.0349 2.66667 13.3333 2.96514 13.3333 3.33333C13.3333 3.70152 13.0349 4 12.6667 4H12V10.8276C12 11.3642 12 11.8071 11.9705 12.1679C11.9399 12.5426 11.8742 12.8871 11.7093 13.2106C11.4537 13.7124 11.0457 14.1204 10.544 14.376C10.2204 14.5409 9.87595 14.6066 9.50122 14.6372C9.14042 14.6667 8.69752 14.6667 8.16088 14.6667H5.17245C4.63581 14.6667 4.19291 14.6667 3.83212 14.6372C3.45738 14.6066 3.11292 14.5409 2.78936 14.376C2.28759 14.1204 1.87964 13.7124 1.62398 13.2106C1.45912 12.8871 1.39341 12.5426 1.3628 12.1679C1.33332 11.8071 1.33332 11.3642 1.33333 10.8275L1.33333 4H0.666667C0.298477 4 0 3.70152 0 3.33333C0 2.96514 0.298477 2.66667 0.666667 2.66667H3.33335C3.33354 2.36065 3.33542 2.09383 3.35371 1.86998C3.37525 1.60642 3.42279 1.34427 3.55132 1.09202C3.74307 0.715696 4.04903 0.409735 4.42535 0.217988C4.67761 0.0894588 4.93975 0.0419148 5.20331 0.0203809C5.45303 -2.16787e-05 5.7562 -1.13475e-05 6.10764 5.73407e-07ZM2.66667 4V10.8C2.66667 11.3711 2.66718 11.7593 2.6917 12.0593C2.71558 12.3516 2.75886 12.5011 2.81199 12.6053C2.93982 12.8562 3.1438 13.0602 3.39468 13.188C3.49895 13.2411 3.64841 13.2844 3.94069 13.3083C4.24075 13.3328 4.62895 13.3333 5.2 13.3333H8.13333C8.70439 13.3333 9.09258 13.3328 9.39264 13.3083C9.68492 13.2844 9.83439 13.2411 9.93865 13.188C10.1895 13.0602 10.3935 12.8562 10.5213 12.6053C10.5745 12.5011 10.6178 12.3516 10.6416 12.0593C10.6661 11.7593 10.6667 11.3711 10.6667 10.8V4H2.66667ZM8.66662 2.66667H4.66671C4.66701 2.3566 4.66905 2.14466 4.68262 1.97856C4.69742 1.79745 4.72253 1.7303 4.73933 1.69734C4.80324 1.5719 4.90523 1.46991 5.03067 1.406C5.06364 1.3892 5.13078 1.36408 5.31189 1.34929C5.50078 1.33385 5.74896 1.33333 6.13333 1.33333H7.2C7.58437 1.33333 7.83255 1.33385 8.02144 1.34929C8.20255 1.36408 8.2697 1.3892 8.30266 1.406C8.4281 1.46991 8.53009 1.5719 8.594 1.69734C8.6108 1.7303 8.63592 1.79745 8.65071 1.97856C8.66429 2.14466 8.66632 2.3566 8.66662 2.66667ZM5.33333 6.33333C5.70152 6.33333 6 6.63181 6 7V10.3333C6 10.7015 5.70152 11 5.33333 11C4.96514 11 4.66667 10.7015 4.66667 10.3333V7C4.66667 6.63181 4.96514 6.33333 5.33333 6.33333ZM8 6.33333C8.36819 6.33333 8.66667 6.63181 8.66667 7V10.3333C8.66667 10.7015 8.36819 11 8 11C7.63181 11 7.33333 10.7015 7.33333 10.3333V7C7.33333 6.63181 7.63181 6.33333 8 6.33333Z"
                    fill="#DC2626"
                  />
                </svg>
              </div>
            )}

            <div className="card-content">
              <div>
                <p className="input-label">{t("PARTY_NAME")}</p>
                <Dropdown
                  t={t}
                  option={partyOptions?.map((opt) => opt?.party)}
                  optionKey="name"
                  selected={row?.selectedParty}
                  select={(val) => updateRow(index, "selectedParty", val)}
                />
              </div>

              <div>
                <p className="input-label">{t("PARTY_ADDRESS")}</p>
                <CustomMultiSelectDropdown
                  t={t}
                  options={availableAddresses}
                  optionsKey="text"
                  displayKey="text"
                  filterKey="text"
                  selected={row?.selectedAddresses}
                  onSelect={(val) => updateRow(index, "selectedAddresses", val)}
                  disable={!row?.selectedParty || config?.disable}
                  active={activeDropdownIndex === index}
                  setActive={(isOpen) => setActiveDropdownIndex(isOpen ? index : null)}
                />
              </div>
            </div>
          </div>
        );
      })}

      <div
        onClick={addRow}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          cursor: "pointer",
          color: "#007E7E",
          fontWeight: "700",
          marginTop: "6px",
        }}
      >
        <CustomAddIcon width="14px" height="14px" />
        <span style={{ color: "#007E7E" }}>{t("ADD_PARTIES")}</span>
      </div>

      {errors[config?.key] && (
        <CardLabelError style={inputs?.errorStyle}>{t(errors[config?.key]?.msg || "CORE_REQUIRED_FIELD_ERROR")}</CardLabelError>
      )}
    </div>
  );
};

export default MultiPartyAddressSelector;
