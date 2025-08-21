import React from "react";
import OrderTypeControlItem from "./OrderTypeControlItem";

const OrderTypeControls = ({
  t,
  currentOrder,
  orderTypeData,
  orderTypeConfig,
  setOrderType,
  setAddOrderModal,
  setCompositeOrderIndex,
  handleEditOrder,
  setDeleteOrderItemIndex,
}) => {
  return (
    <React.Fragment>
      <div className="order-type-dropdown">
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
                  setAddOrderModal={setAddOrderModal}
                  setCompositeOrderIndex={setCompositeOrderIndex}
                  handleEditOrder={handleEditOrder}
                  setDeleteOrderItemIndex={setDeleteOrderItemIndex}
                  index={idx}
                  style={{ marginBottom: "10px" }}
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
            setAddOrderModal={setAddOrderModal}
            setCompositeOrderIndex={setCompositeOrderIndex}
            handleEditOrder={handleEditOrder}
            setDeleteOrderItemIndex={setDeleteOrderItemIndex}
          />
        )}
      </div>
    </React.Fragment>
  );
};

export default OrderTypeControls;
