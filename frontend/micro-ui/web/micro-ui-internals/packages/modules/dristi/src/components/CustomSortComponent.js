import PropTypes from "prop-types";
import React, { useMemo } from "react";

export const ArrowDownIcon = () => {
  return (
    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10.59 0.589844L6 5.16984L1.41 0.589844L0 1.99984L6 7.99984L12 1.99984L10.59 0.589844Z" fill="#3D3C3C" />
    </svg>
  );
};

export const UpDownArrowIcon = () => (
  <svg width="14" height="18" viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 0L0 3.99H3V11H5V3.99H8L4 0ZM11 14.01V7H9V14.01H6L10 18L14 14.01H11Z" fill="#505A5F" />
  </svg>
);

function CustomSortComponent({ t, config, onSelect, formData = {}, errors: _errors }) {
  const Icon = useMemo(() => {
    switch (config?.icon) {
      case "ArrowDownIcon":
        return ArrowDownIcon;
      case "UpDownArrowIcon":
        return UpDownArrowIcon;
      default:
        return ArrowDownIcon;
    }
  }, [config?.icon]);

  const isDescOrder = formData?.[config.key]?.order === "desc" || formData?.[config.key] === "DESC";

  const handleSortClick = () => {
    let payload;
    if (config?.paymentInbox) {
      payload = formData?.[config.key] === "DESC" ? "ASC" : "DESC";
    } else {
      payload = {
        sortBy: config.sortBy,
        order: formData?.[config.key]?.order === "desc" ? "asc" : "desc",
      };
    }
    onSelect(config.key, payload);
  };

  return (
    <div className="select-signature-main" style={{ justifyContent: "center", alignItems: "center", flexDirection: "row", maxWidth: "100%" }}>
      <button
        type="button"
        className="custom-sort-button"
        style={{
          height: 40,
          width: "100%",
          display: "flex",
          alignItems: "center",
          fontSize: 16,
          justifyContent: "center",
          backgroundColor: "#fff",
          border: "1px solid black",
        }}
        onClick={handleSortClick}
      >
        <span className="custom-sort-name">{t(config.name)} </span>
        {config?.showAdditionalText ? (
          <span className="custom-sort-text">
            &nbsp;
            {isDescOrder ? t(config?.descText) : t(config?.ascText)}
          </span>
        ) : null}
        {config?.showIcon && Icon && (
          <span
            className="custom-sort-icon"
            style={{
              display: "inline-flex",
              marginLeft: 16,
              transform: isDescOrder ? "rotate(0deg)" : "rotate(180deg)",
              transition: "transform 0.3s",
            }}
          >
            <Icon />
          </span>
        )}
      </button>
    </div>
  );
}

const sortConfigPropType = PropTypes.shape({
  key: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  icon: PropTypes.string,
  paymentInbox: PropTypes.bool,
  sortBy: PropTypes.string,
  showAdditionalText: PropTypes.bool,
  descText: PropTypes.string,
  ascText: PropTypes.string,
  showIcon: PropTypes.bool,
});

CustomSortComponent.propTypes = {
  t: PropTypes.func.isRequired,
  config: sortConfigPropType.isRequired,
  onSelect: PropTypes.func.isRequired,
  formData: PropTypes.object,
  errors: PropTypes.object,
};

export default CustomSortComponent;
