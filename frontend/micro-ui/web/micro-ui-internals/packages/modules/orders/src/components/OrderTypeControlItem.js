import React from "react";
import { Button, CustomDropdown } from "@egovernments/digit-ui-react-components";
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
  setAddOrderModal,
  setCompositeOrderIndex,
  handleEditOrder,
  setDeleteOrderItemIndex,
  index = null,
  style = {},
}) => {
  return (
    <div style={{ display: "flex", width: "100%", alignItems: "center", ...style }}>
      {/* Order Type Dropdown */}
      <CustomDropdown
        t={t}
        type={dropdownType}
        onChange={(e) => {
          setCompositeOrderIndex(index !== null ? index : 0);
          setOrderType(e);
          setAddOrderModal(true);
        }}
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
        }}
      />

      {/* Edit Button */}
      <Button
        className={"edit-button"}
        variation="secondary"
        onButtonClick={() => {
          if (index !== null) {
            setCompositeOrderIndex(index);
          }
          setOrderType(orderTypeData?.find((type) => type.code === orderType) || {});
          handleEditOrder();
        }}
        label={t("Edit")}
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
        label={t("Delete")}
        icon={<CustomDeleteIcon color="#BB2C2F" width="20" height="20" />}
      />
    </div>
  );
};

export default OrderTypeControlItem;
