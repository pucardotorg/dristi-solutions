import { FormComposerV2 } from "@egovernments/digit-ui-react-components";
import React, { useState } from "react";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import { CloseBtn, Heading } from "../../utils/orderUtils"

const EpostUpdateStatus = ({t, headerLabel, handleCancel, handleSubmit, defaultValue, modifiedFormConfig, saveLabel, cancelLabel, }) => {
  const [formdata, setFormData] = useState({});
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);

   const onFormValueChange = (setValue, formData, formState, reset, setError, clearErrors, trigger, getValues) => { }
  console.log(modifiedFormConfig);
  
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
    </React.Fragment>
  );
};

export default EpostUpdateStatus;
