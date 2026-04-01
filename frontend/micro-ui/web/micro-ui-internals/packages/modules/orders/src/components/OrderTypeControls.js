import React from "react";
import OrderTypeControlItem from "./OrderTypeControlItem";
import { CardHeader } from "@egovernments/digit-ui-react-components";

const OrderTypeControls = ({
  t,
  currentOrder,
  orderTypeData,
  orderTypeConfig,
  setOrderType,
  setCompositeOrderIndex,
  handleEditOrder,
  setDeleteOrderItemIndex,
  handleOrderTypeChange,
}) => {
  return (
    <React.Fragment>
      <div className="order-type-dropdown">
        <CardHeader styles={{ fontSize: "16px", fontWeight: "bold" }}>{t("ORDER_ITEMS")}</CardHeader>

        {currentOrder?.orderCategory === "COMPOSITE" ? (
          <div>
            {currentOrder?.compositeItems
              ?.filter((o) => o?.isEnabled)
              ?.map((item, idx) => (
                <OrderTypeControlItem
                  key={item.id}
                  t={t}
                  orderType={item?.orderType}
                  orderTypeData={orderTypeData}
                  orderTypeConfig={orderTypeConfig}
                  setOrderType={setOrderType}
                  setCompositeOrderIndex={setCompositeOrderIndex}
                  handleEditOrder={handleEditOrder}
                  setDeleteOrderItemIndex={setDeleteOrderItemIndex}
                  index={idx}
                  style={{ marginBottom: "10px" }}
                  handleOrderTypeChange={handleOrderTypeChange}
                  isCompositeItem={true}
                />
              ))}
          </div>
        ) : (
          <OrderTypeControlItem
            t={t}
            orderType={currentOrder?.orderType}
            dropdownType={orderTypeConfig?.type}
            orderTypeData={orderTypeData}
            orderTypeConfig={orderTypeConfig}
            setOrderType={setOrderType}
            setCompositeOrderIndex={setCompositeOrderIndex}
            handleEditOrder={handleEditOrder}
            setDeleteOrderItemIndex={setDeleteOrderItemIndex}
            handleOrderTypeChange={handleOrderTypeChange}
            isCompositeItem={false}
          />
        )}
      </div>
    </React.Fragment>
  );
};

export default OrderTypeControls;
