import { CloseBtn, Heading } from "@egovernments/digit-ui-module-orders/src/utils/orderUtils";
import { FormComposerV2, SubmitBar } from "@egovernments/digit-ui-react-components";
import React, { useMemo, useState } from "react";
import isEqual from "lodash/isEqual";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";

const AddTemplateModal = ({
  t,
  headerLabel,
  handleCancel,
  config,
  saveLabel,
  cancelLabel,
  defaultValues,
  formdata,
  setFormData,
  handleSubmit,
  isShowPdf = false,
  previewPdf = null,
}) => {
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
  const DocViewerWrapper = window?.Digit?.ComponentRegistryService?.getComponent("DocViewerWrapper");

  const onFormValueChange = (setValue, formData, formState, reset, setError, clearErrors, trigger, getValues) => {
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
        hideModalActionbar={isShowPdf ? false : true}
        className="add-order-type-modal template-from-modal"
        actionSaveLabel={t(saveLabel)}
        actionCancelLabel={t(cancelLabel)}
        actionCancelOnSubmit={handleCancel}
        actionSaveOnSubmit={handleSubmit}
      >
        <div className="generate-orders">
          <div className="view-order order-type-form-modal">
            {isShowPdf ? (
              <div
                className="pdf-viewer-container"
                style={{
                  height: "calc(100vh - 400px)",
                  minHeight: "400px",
                  overflowY: "auto",
                }}
              >
                {!previewPdf ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
                    <span>{t("LOADING")}</span>
                  </div>
                ) : (
                  <DocViewerWrapper
                    docWidth={"100%"}
                    selectedDocs={[previewPdf]}
                    showDownloadOption={false}
                    docHeight={"100%"}
                  />
                )}
              </div>
            ) : (
              <FormComposerV2
                className={"generate-orders order-type-modal template-form-composer"}
                defaultValues={defaultValues}
                config={config}
                onFormValueChange={onFormValueChange}
                fieldStyle={{ width: "100%" }}
                cardClassName={`order-type-form-composer new-template-form`}
                actionClassName={"order-type-action"}
                label={t(saveLabel)}
                secondaryLabel={t(cancelLabel)}
                showSecondaryLabel={true}
                onSubmit={handleSubmit}
                onSecondayActionClick={handleCancel}
                isDisabled={isSubmitDisabled}
              />
            )}
          </div>
        </div>
      </Modal>
    </React.Fragment>
  );
};

export default AddTemplateModal;
