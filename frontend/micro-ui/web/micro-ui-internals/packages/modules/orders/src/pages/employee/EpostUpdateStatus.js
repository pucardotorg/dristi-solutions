import { FormComposerV2, Toast } from "@egovernments/digit-ui-react-components";
import React, { useState } from "react";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import { CloseBtn, Heading } from "../../utils/orderUtils";
import isEqual from "lodash/isEqual";

const EpostUpdateStatus = ({
  t,
  headerLabel,
  handleCancel,
  handleSubmit,
  defaultValue,
  modifiedFormConfig,
  saveLabel,
  cancelLabel,
  closeToast,
  showErrorToast,
  setFormErrors,
  clearFormErrors,
}) => {
  const [formdata, setFormData] = useState({});
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);

  const onFormValueChange = (setValue, formData, formState, reset, setError, clearErrors, trigger, getValues) => {
    if (formData?.statusDate && formData?.statusDate !== formdata?.statusDate && Object.keys(formState?.errors).includes("statusDate")) {
      clearFormErrors?.current("statusDate");
    }

    if (
      formData?.speedPostId &&
      formData?.speedPostId?.trim() !== formdata?.speedPostId?.trim() &&
      Object.keys(formState?.errors).includes("speedPostId")
    ) {
      clearFormErrors?.current("speedPostId");
    }

    if (!isEqual(formData, formdata)) {
      setFormData(formData);
    }

    if (Object.keys(formState?.errors).length) {
      setIsSubmitDisabled(true);
    } else {
      setIsSubmitDisabled(false);
    }

    setFormErrors.current = setError;
    clearFormErrors.current = clearErrors;
  };

  return (
    <React.Fragment>
      <Modal
        headerBarMain={<Heading label={t(headerLabel)} />}
        headerBarEnd={<CloseBtn onClick={handleCancel} />}
        hideModalActionbar={true}
        className="add-order-type-modal e-post-update-modal"
      >
        <div className="generate-orders">
          <div className="view-order order-type-form-modal">
            <FormComposerV2
              className={"generate-orders order-type-modal"}
              defaultValues={defaultValue}
              config={modifiedFormConfig}
              fieldStyle={{ width: "100%" }}
              cardClassName={`order-type-form-composer new-order`}
              actionClassName={"order-type-action e-post-action"}
              onFormValueChange={onFormValueChange}
              label={t(saveLabel)}
              secondaryLabel={t(cancelLabel)}
              showSecondaryLabel={true}
              onSubmit={() => {
                handleSubmit(formdata);
              }}
              onSecondayActionClick={handleCancel}
              isDisabled={isSubmitDisabled}
            />
          </div>
        </div>
      </Modal>
      {showErrorToast && <Toast error={showErrorToast?.error} label={showErrorToast?.label} isDleteBtn onClose={closeToast} />}
    </React.Fragment>
  );
};

export default EpostUpdateStatus;
