import React, { useMemo, useState } from "react";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import { CloseSvg } from "@egovernments/digit-ui-react-components";
import { FormComposerV2 } from "@egovernments/digit-ui-react-components";
import isEqual from "lodash/isEqual";

const Heading = ({ label }) => <h1 className="heading-m">{label}</h1>;

const CloseBtn = ({ onClick, backgroundColor }) => (
  <div
    onClick={onClick}
    style={{
      height: "100%",
      display: "flex",
      alignItems: "center",
      paddingRight: "20px",
      cursor: "pointer",
      ...(backgroundColor && { backgroundColor }),
    }}
  >
    <CloseSvg />
  </div>
);

function applyMultiSelectDropdownFix(setValue, formData, keys) {
  keys.forEach((key) => {
    if (formData[key] && Array.isArray(formData[key]) && formData[key].length === 0) {
      setValue(key, undefined);
    }
  });
}

const AddOrderTypeModal = ({ t, headerLabel, saveLabel, cancelLabel, handleCancel, handleSubmit, modifiedFormConfig, defaultFormValue, currentOrder, index }) => {
  const [formdata, setFormData] = useState({});
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);

  const multiSelectDropdownKeys = useMemo(() => {
      const foundKeys = [];
      modifiedFormConfig?.forEach((modified) => {
        modified?.forEach((config) => {
          config.body.forEach((field) => {
            if (field.type === "dropdown" && field.populators.allowMultiSelect) {
              foundKeys.push(field.key);
            }
          });
        });
      });
      return foundKeys;
    }, [modifiedFormConfig]);

  const onFormValueChange = (setValue, formData, formState, reset, setError, clearErrors, trigger, getValues) => {

    // if (currentOrder?.orderCategory === "COMPOSITE") {
    //   // Validation for order Types check
    //   if (formData?.orderType?.code) {
    //     const orderTypeValidationObj = checkOrderValidation(formData?.orderType?.code, index);
    //     if (orderTypeValidationObj?.showModal) {
    //       setShowOrderValidationModal(orderTypeValidationObj);
    //       if (!currentOrder?.compositeItems?.[index]?.orderSchema?.additionalDetails?.formdata?.orderType?.code) {
    //         setValue("orderType", undefined); // If we are adding new order- set order type to null if validation fails.
    //         return;
    //       }
    //       return;
    //     }
    //   }
    // }

    // applyMultiSelectDropdownFix(setValue, formData, multiSelectDropdownKeys);





    if (!isEqual(formdata, formData)) {
      setFormData(formData);
    }

    if (Object.keys(formState?.errors).length) {
      setIsSubmitDisabled(true);
    } else {
      setIsSubmitDisabled(false);
    }
  };

  return (
    <React.Fragment>
      <Modal
        headerBarMain={<Heading label={t(headerLabel)} />}
        headerBarEnd={<CloseBtn onClick={handleCancel} />}
        actionSaveLabel={t(saveLabel)}
        actionCancelLabel={t(cancelLabel)}
        actionCancelOnSubmit={handleCancel}
        actionSaveOnSubmit={() => handleSubmit(formdata)}
        isDisabled={isSubmitDisabled}
        className="add-order-type-modal"
      >
        <div className="generate-orders">
          <div className="view-order order-type-form-modal">
            <FormComposerV2
              className={"generate-orders"}
              defaultValues={defaultFormValue}
              config={modifiedFormConfig}
              fieldStyle={{ width: "100%" }}
              cardClassName={`order-type-form-composer`}
              actionClassName={"order-type-action"}
              onFormValueChange={onFormValueChange}
            />
          </div>
        </div>
      </Modal>
    </React.Fragment>
  );
};

export default AddOrderTypeModal;
