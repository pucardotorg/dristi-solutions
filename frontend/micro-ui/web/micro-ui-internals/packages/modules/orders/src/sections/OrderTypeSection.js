import React from "react";
import PropTypes from "prop-types";
import { LabelFieldPair, CardLabel, CustomDropdown, CardLabelError, Button, CardHeader } from "@egovernments/digit-ui-react-components";
import CustomDatePickerV2 from "@egovernments/digit-ui-module-hearings/src/components/CustomDatePickerV2";
import OrderTypeControls from "../components/OrderTypeControls";
import { CustomAddIcon } from "@egovernments/digit-ui-module-dristi/src/icons/svgIndex";

/**
 * Renders the order-type dropdown, Add Item button, skip-scheduling checkbox,
 * purpose-of-hearing dropdown, and next-hearing date picker.
 * Extracted from GenerateOrdersV2.js for maintainability.
 */
const OrderTypeSection = ({
  t,
  isHearingAvailable,
  currentOrder,
  orderTypeData,
  applicationTypeConfigUpdated,
  setOrderType,
  setCompositeOrderIndex,
  handleEditOrder,
  setDeleteOrderItemIndex,
  handleOrderTypeChange,
  handleAddForm,
  isAddItemDisabled,
  skipScheduling,
  setSkipScheduling,
  setCurrentOrder,
  setPurposeOfHearing,
  setNextHearingDate,
  setErrors,
  purposeOfHearing,
  purposeOfHearingData,
  nextHearingDate,
  purposeOfHearingConfig,
  nextDateOfHearing,
  errors,
  currentInProgressHearing,
}) => {
  return (
    <React.Fragment>
      {(currentInProgressHearing || currentOrder?.hearingNumber) && (
        <React.Fragment>
          <CardHeader styles={{ fontSize: "16px", fontWeight: "bold", marginTop: "20px" }}>{t("ORDER_NEXT_HEARING_DETAILS")}</CardHeader>

          <div className="checkbox-item" style={{ marginTop: "10px" }}>
            <input
              id="skip-scheduling"
              type="checkbox"
              className="custom-checkbox"
              onChange={() => {
                const newSkipValue = !skipScheduling;
                setSkipScheduling(newSkipValue);
                if (newSkipValue) {
                  // Clear purpose and date when skipping
                  setCurrentOrder({ ...currentOrder, purposeOfNextHearing: "", nextHearingDate: null });
                  setPurposeOfHearing("");
                  setNextHearingDate("");
                  setErrors((prevErrors) => {
                    const newErrors = { ...prevErrors };
                    delete newErrors["hearingPurpose"];
                    delete newErrors["nextHearingDate"];
                    return newErrors;
                  });
                }
              }}
              checked={skipScheduling}
              style={{ cursor: "pointer", width: "20px", height: "20px" }}
            />
            <label htmlFor="skip-scheduling">{t("SKIP_SCHEDULING_NEXT_HEARING")}</label>
          </div>

          <LabelFieldPair className="purpose-hearing-dropdown">
            <CardLabel className={`purpose-hearing-dropdown-label ${skipScheduling ? "disabled" : ""}`}>{t(purposeOfHearingConfig?.label)}</CardLabel>
            <CustomDropdown
              t={t}
              onChange={(e) => {
                setCurrentOrder({ ...currentOrder, purposeOfNextHearing: e?.code });
                setPurposeOfHearing(e);
                if (e?.code) {
                  setErrors((prevErrors) => {
                    const newErrors = { ...prevErrors };
                    delete newErrors["hearingPurpose"];
                    return newErrors;
                  });
                }
              }}
              value={purposeOfHearing || purposeOfHearingData?.find((item) => item?.code === currentOrder?.purposeOfNextHearing)}
              config={{ ...purposeOfHearingConfig?.populators, options: purposeOfHearingData }}
              disable={skipScheduling}
            ></CustomDropdown>
            {errors[purposeOfHearingConfig?.key] && (
              <CardLabelError> {t(errors[purposeOfHearingConfig?.key]?.msg || "CORE_REQUIRED_FIELD_ERROR")} </CardLabelError>
            )}
          </LabelFieldPair>

          <LabelFieldPair className={`case-label-field-pair`} style={{ width: "75%" }}>
            <CardLabel className={`case-input-label ${skipScheduling ? "disabled" : ""}`}> {t(nextDateOfHearing?.label)}</CardLabel>
            <CustomDatePickerV2
              t={t}
              config={nextDateOfHearing}
              formData={{ nextHearingDate: nextHearingDate || currentOrder?.nextHearingDate }}
              onDateChange={(date) => {
                setCurrentOrder({ ...currentOrder, nextHearingDate: date ? new Date(date).setHours(0, 0, 0, 0) : null });
                setNextHearingDate(date ? new Date(date).setHours(0, 0, 0, 0) : null);
                setErrors((prevErrors) => {
                  const newErrors = { ...prevErrors };
                  delete newErrors["nextHearingDate"];
                  return newErrors;
                });
              }}
              value={nextHearingDate || currentOrder?.nextHearingDate}
              disable={skipScheduling}
              disableColor="#D6D5D4"
              disableBorderColor="#D6D5D4"
              disableBackgroundColor="white"
            />
            {errors[nextDateOfHearing?.key] && (
              <CardLabelError> {t(errors[nextDateOfHearing?.key]?.msg || "CORE_REQUIRED_FIELD_ERROR")} </CardLabelError>
            )}
          </LabelFieldPair>
        </React.Fragment>
      )}

      <LabelFieldPair className="order-type-dropdown">
        <OrderTypeControls
          t={t}
          isHearingAvailable={isHearingAvailable}
          currentOrder={currentOrder}
          orderTypeData={orderTypeData}
          orderTypeConfig={{
            ...applicationTypeConfigUpdated?.[0]?.body[0],
            populators: {
              ...applicationTypeConfigUpdated?.[0]?.body[0]?.populators,
              styles: { maxWidth: "75%" },
            },
          }}
          setOrderType={setOrderType}
          setCompositeOrderIndex={setCompositeOrderIndex}
          handleEditOrder={handleEditOrder}
          setDeleteOrderItemIndex={setDeleteOrderItemIndex}
          handleOrderTypeChange={handleOrderTypeChange}
        />
        <div style={{ marginBottom: "10px" }}>
          <Button
            variation="secondary"
            onButtonClick={() => {
              handleAddForm();
            }}
            className="add-new-form"
            icon={<CustomAddIcon width="16px" height="16px" />}
            label={t("ADD_ITEM")}
            style={{ border: "none" }}
            isDisabled={isAddItemDisabled}
          ></Button>
        </div>
      </LabelFieldPair>
    </React.Fragment>
  );
};

OrderTypeSection.propTypes = {
  applicationTypeConfigUpdated: PropTypes.arrayOf(
    PropTypes.shape({
      body: PropTypes.arrayOf(
        PropTypes.shape({
          populators: PropTypes.object,
        })
      ),
    })
  ),
  currentInProgressHearing: PropTypes.any,
  currentOrder: PropTypes.shape({
    hearingNumber: PropTypes.any,
    nextHearingDate: PropTypes.any,
    purposeOfNextHearing: PropTypes.any,
  }),
  errors: PropTypes.objectOf(
    PropTypes.shape({
      msg: PropTypes.string,
    })
  ),
  handleAddForm: PropTypes.func.isRequired,
  handleEditOrder: PropTypes.func.isRequired,
  handleOrderTypeChange: PropTypes.func.isRequired,
  isAddItemDisabled: PropTypes.bool,
  isHearingAvailable: PropTypes.any,
  nextDateOfHearing: PropTypes.shape({
    key: PropTypes.string,
    label: PropTypes.string,
  }),
  nextHearingDate: PropTypes.any,
  orderTypeData: PropTypes.any,
  purposeOfHearing: PropTypes.any,
  purposeOfHearingConfig: PropTypes.shape({
    key: PropTypes.string,
    label: PropTypes.string,
    populators: PropTypes.object,
  }),
  purposeOfHearingData: PropTypes.arrayOf(PropTypes.object),
  setCompositeOrderIndex: PropTypes.func.isRequired,
  setCurrentOrder: PropTypes.func.isRequired,
  setDeleteOrderItemIndex: PropTypes.func.isRequired,
  setErrors: PropTypes.func.isRequired,
  setNextHearingDate: PropTypes.func.isRequired,
  setOrderType: PropTypes.func.isRequired,
  setPurposeOfHearing: PropTypes.func.isRequired,
  setSkipScheduling: PropTypes.func.isRequired,
  skipScheduling: PropTypes.bool,
  t: PropTypes.func.isRequired,
};

export default OrderTypeSection;
