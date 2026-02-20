import React from "react";
import { Button, CardLabel, CustomDropdown } from "@egovernments/digit-ui-react-components";
import { EditPencilIcon, CustomDeleteIcon } from "../../../dristi/src/icons/svgIndex";

/**
 * OrderTypeControlItem component that combines dropdown and action buttons
 * for order type selection, editing, and deletion
 */
const OrderTypeControlItem = ({
  t,
  orderType,
  dropdownType,
  orderTypeData,
  orderTypeConfig,
  setOrderType,
  setCompositeOrderIndex,
  handleEditOrder,
  setDeleteOrderItemIndex,
  index = null,
  style = {},
  handleOrderTypeChange,
  isCompositeItem = false,
}) => {
  return (
    <React.Fragment>
      <CardLabel className="order-type-dropdown-label">{t("CHOOSE_ITEM")}</CardLabel>
      <div style={{ display: "flex", width: "100%", alignItems: "center", ...style }}>
        {/* Order Type Dropdown */}
        <CustomDropdown
          t={t}
          type={dropdownType}
          onChange={(e) => handleOrderTypeChange(index, e)}
          value={
            orderType
              ? {
                  ...orderTypeData?.find((type) => type?.code === orderType),
                  name: `ORDER_TYPE_${orderType}`,
                }
              : {}
          }
          config={{
            ...orderTypeConfig?.populators,
            styles: { ...orderTypeConfig?.populators?.styles, flex: 1 },
            optionsCustomStyle: { marginTop: "42px" },
          }}
          disable={orderType}
        />

        {/* Edit Button */}
        <Button
          className={"edit-button"}
          variation="secondary"
          onButtonClick={() => {
            if (index !== null) {
              setCompositeOrderIndex(index);
            }
            setOrderType(
              {
                ...orderTypeData?.find((type) => type?.code === orderType),
                name: `ORDER_TYPE_${orderType}`,
              } || {}
            );
            handleEditOrder();
          }}
          label={t("EDIT")}
          isDisabled={!orderType}
          icon={<EditPencilIcon width="20" height="20" />}
        />

        {/* Delete Button */}
        <Button
          className={"delete-button"}
          variation="secondary"
          onButtonClick={() => {
            setDeleteOrderItemIndex(index !== null ? index : 0);
          }}
          label={t("DELETE_ORDER_ITEM")}
          icon={<CustomDeleteIcon color="#BB2C2F" width="20" height="20" />}
          isDisabled={!orderType && !isCompositeItem}
        />
      </div>
    </React.Fragment>
  );
};

export default OrderTypeControlItem;
