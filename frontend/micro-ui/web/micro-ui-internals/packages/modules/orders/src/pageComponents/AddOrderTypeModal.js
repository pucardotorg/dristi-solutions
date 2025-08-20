import React, { useCallback, useMemo, useState } from "react";
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

const AddOrderTypeModal = ({
  t,
  headerLabel,
  saveLabel,
  cancelLabel,
  handleCancel,
  handleSubmit,
  modifiedFormConfig,
  getDefaultValue,
  currentOrder,
  index,
  setFormErrors,
  clearFormErrors,
  setValueRef,
  orderType,
  addOrderTypeLoader,
}) => {
  const [formdata, setFormData] = useState({});
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);

  // needs to be change
  const multiSelectDropdownKeys = useMemo(() => {
    const foundKeys = [];
    modifiedFormConfig?.forEach((config) => {
      config.body.forEach((field) => {
        if (field.type === "dropdown" && field.populators.allowMultiSelect) {
          foundKeys.push(field.key);
        }
      });
    });
    return foundKeys;
  }, [modifiedFormConfig]);

  const onFormValueChange = (setValue, formData, formState, reset, setError, clearErrors, trigger, getValues) => {
    applyMultiSelectDropdownFix(setValue, formData, multiSelectDropdownKeys);
    const orderType = currentOrder?.orderCategory === "COMPOSITE" ? currentOrder?.compositeItems?.[index]?.orderType : currentOrder?.orderType;

    if (orderType && ["MANDATORY_SUBMISSIONS_RESPONSES"].includes(orderType)) {
      if (formData?.submissionDeadline && formData?.responseInfo?.responseDeadline) {
        if (new Date(formData?.submissionDeadline).getTime() >= new Date(formData?.responseInfo?.responseDeadline).getTime()) {
          setValue("responseInfo", {
            ...formData.responseInfo,
            responseDeadline: "",
          });
          setFormErrors?.current?.[index]?.("responseDeadline", { message: t("PROPOSED_DATE_CAN_NOT_BE_BEFORE_SUBMISSION_DEADLINE") });
        } else if (Object.keys(formState?.errors).includes("responseDeadline")) {
          setValue("responseInfo", formData?.responseInfo);
          clearFormErrors?.current?.[index]?.("responseDeadline");
        }
      }
      if (formData?.responseInfo?.isResponseRequired && Object.keys(formState?.errors).includes("isResponseRequired")) {
        clearFormErrors?.current?.[index]?.("isResponseRequired");
      } else if (
        formState?.submitCount &&
        !formData?.responseInfo?.isResponseRequired &&
        !Object.keys(formState?.errors).includes("isResponseRequired")
      ) {
        setFormErrors?.current?.[index]?.("isResponseRequired", { message: t("CORE_REQUIRED_FIELD_ERROR") });
      }
      if (
        formData?.responseInfo?.responseDeadline &&
        new Date(formData?.submissionDeadline).getTime() < new Date(formData?.responseInfo?.responseDeadline).getTime() &&
        Object.keys(formState?.errors).includes("responseDeadline")
      ) {
        clearFormErrors?.current?.[index]?.("responseDeadline");
      } else if (formData?.responseInfo?.isResponseRequired?.code === false && Object.keys(formState?.errors).includes("responseDeadline")) {
        clearFormErrors?.current?.[index]?.("responseDeadline");
      } else if (
        formState?.submitCount &&
        !formData?.responseInfo?.responseDeadline &&
        formData?.responseInfo?.isResponseRequired?.code === true &&
        !Object.keys(formState?.errors).includes("responseDeadline")
      ) {
        setFormErrors?.current?.[index]?.("responseDeadline", { message: t("PROPOSED_DATE_CAN_NOT_BE_BEFORE_SUBMISSION_DEADLINE") });
      }
      if (formData?.responseInfo?.respondingParty?.length > 0 && Object.keys(formState?.errors).includes("respondingParty")) {
        clearFormErrors?.current?.[index]?.("respondingParty");
      } else if (formData?.responseInfo?.isResponseRequired?.code === false && Object.keys(formState?.errors).includes("respondingParty")) {
        clearFormErrors?.current?.[index]?.("respondingParty");
      } else if (
        formState?.submitCount &&
        (!formData?.responseInfo?.respondingParty || formData?.responseInfo?.respondingParty?.length === 0) &&
        formData?.responseInfo?.isResponseRequired?.code === true &&
        !Object.keys(formState?.errors).includes("respondingParty")
      ) {
        setFormErrors?.current?.[index]?.("respondingParty", { message: t("CORE_REQUIRED_FIELD_ERROR") });
      }
    }

    if (orderType && ["WARRANT"].includes(orderType)) {
      if (
        formData?.warrantSubType?.templateType === "SPECIFIC" &&
        formData?.bailInfo?.isBailable &&
        Object.keys(formState?.errors).includes("isBailable")
      ) {
        clearFormErrors?.current?.[index]?.("isBailable");
      } else if (
        formState?.submitCount &&
        formData?.warrantSubType?.templateType === "SPECIFIC" &&
        !formData?.bailInfo?.isBailable &&
        !Object.keys(formState?.errors).includes("isBailable")
      ) {
        setFormErrors?.current?.[index]?.("isBailable", { message: t("CORE_REQUIRED_FIELD_ERROR") });
      }

      if (formData?.warrantSubType?.templateType === "GENERIC" && formData?.warrantText && Object.keys(formState?.errors).includes("warrantText")) {
        clearFormErrors?.current?.[index]?.("warrantText");
      } else if (
        formState?.submitCount &&
        formData?.warrantSubType?.templateType === "GENERIC" &&
        !formData?.warrantText &&
        !Object.keys(formState?.errors).includes("warrantText")
      ) {
        setFormErrors?.current?.[index]?.("warrantText", { message: t("CORE_REQUIRED_FIELD_ERROR") });
      }

      if (formData?.bailInfo?.noOfSureties && Object.keys(formState?.errors).includes("noOfSureties")) {
        clearFormErrors?.current?.[index]?.("noOfSureties");
      } else if (formData?.bailInfo?.isBailable?.code === false && Object.keys(formState?.errors).includes("noOfSureties")) {
        clearFormErrors?.current?.[index]?.("noOfSureties");
      } else if (
        formState?.submitCount &&
        !formData?.bailInfo?.noOfSureties &&
        formData?.bailInfo?.isBailable?.code === true &&
        !Object.keys(formState?.errors).includes("noOfSureties")
      ) {
        setFormErrors?.current?.[index]?.("noOfSureties", { message: t("CORE_REQUIRED_FIELD_ERROR") });
      }
      if (
        formData?.bailInfo?.bailableAmount &&
        formData?.bailInfo?.bailableAmount?.slice(-1) !== "." &&
        Object.keys(formState?.errors).includes("bailableAmount")
      ) {
        clearFormErrors?.current?.[index]?.("bailableAmount");
      } else if (formData?.bailInfo?.isBailable?.code === false && Object.keys(formState?.errors).includes("bailableAmount")) {
        clearFormErrors?.current?.[index]?.("bailableAmount");
      } else if (
        formState?.submitCount &&
        formData?.bailInfo?.isBailable?.code === true &&
        formData?.bailInfo?.bailableAmount?.slice(-1) === "." &&
        !Object.keys(formState?.errors).includes("bailableAmount")
      ) {
        setFormErrors?.current?.[index]?.("bailableAmount", { message: t("CS_VALID_AMOUNT_DECIMAL") });
      } else if (
        formState?.submitCount &&
        !formData?.bailInfo?.bailableAmount &&
        formData?.bailInfo?.isBailable?.code === true &&
        !Object.keys(formState?.errors).includes("bailableAmount")
      ) {
        setFormErrors?.current?.[index]?.("bailableAmount", { message: t("CS_VALID_AMOUNT_DECIMAL") });
      }

      const warrantType = formData?.warrantSubType?.templateType;
      if (warrantType !== "GENERIC" && formData?.bailInfo?.warrantText) {
        setValue("bailInfo", undefined);
      } else if (warrantType === "GENERIC" && formData?.warrantText?.isBailable) {
        setValue("warrantText", undefined);
      }
    }

    if (orderType && ["PROCLAMATION"].includes(orderType)) {
      if (formData?.proclamationText && Object.keys(formState?.errors).includes("proclamationText")) {
        clearFormErrors?.current?.[index]?.("proclamationText");
      } else if (formState?.submitCount && !formData?.proclamationText && !Object.keys(formState?.errors).includes("proclamationText")) {
        setFormErrors?.current?.[index]?.("proclamationText", { message: t("CORE_REQUIRED_FIELD_ERROR") });
      }
    }

    if (orderType && ["ATTACHMENT"].includes(orderType)) {
      if (formData?.attachmentText && Object.keys(formState?.errors).includes("attachmentText")) {
        clearFormErrors?.current?.[index]?.("attachmentText");
      } else if (formState?.submitCount && !formData?.attachmentText && !Object.keys(formState?.errors).includes("attachmentText")) {
        setFormErrors?.current?.[index]?.("attachmentText", { message: t("CORE_REQUIRED_FIELD_ERROR") });
      }

      if (formData?.village && Object.keys(formState?.errors).includes("village")) {
        clearFormErrors?.current?.[index]?.("village");
      } else if (formState?.submitCount && !formData?.village && !Object.keys(formState?.errors).includes("village")) {
        setFormErrors?.current?.[index]?.("village", { message: t("CORE_REQUIRED_FIELD_ERROR") });
      }

      if (formData?.district && Object.keys(formState?.errors).includes("district")) {
        clearFormErrors?.current?.[index]?.("district");
      } else if (formState?.submitCount && !formData?.district && !Object.keys(formState?.errors).includes("district")) {
        setFormErrors?.current?.[index]?.("district", { message: t("CORE_REQUIRED_FIELD_ERROR") });
      }

      if (formData?.chargeDays && Object.keys(formState?.errors).includes("chargeDays")) {
        clearFormErrors?.current?.[index]?.("chargeDays");
      } else if (formState?.submitCount && !formData?.chargeDays && !Object.keys(formState?.errors).includes("chargeDays")) {
        setFormErrors?.current?.[index]?.("chargeDays", { message: t("CORE_REQUIRED_FIELD_ERROR") });
      }
    }

    if (!isEqual(formdata, formData)) {
      setFormData(formData);
    }

    setFormErrors.current[index] = setError;
    clearFormErrors.current[index] = clearErrors;
    setValueRef.current[index] = setValue;

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
        hideModalActionbar={true}
        className="add-order-type-modal"
      >
        <div className="generate-orders">
          <div className="view-order order-type-form-modal">
            <FormComposerV2
              className={"generate-orders order-type-modal"}
              defaultValues={getDefaultValue(index)}
              config={modifiedFormConfig}
              fieldStyle={{ width: "100%" }}
              cardClassName={`order-type-form-composer`}
              actionClassName={"order-type-action"}
              onFormValueChange={onFormValueChange}
              label={t(saveLabel)}
              secondaryLabel={t(cancelLabel)}
              showSecondaryLabel={true}
              onSubmit={() => {
                const updatedFormData = { ...formdata, orderType: orderType };
                handleSubmit(updatedFormData, index);
              }}
              onSecondayActionClick={handleCancel}
              isDisabled={isSubmitDisabled || addOrderTypeLoader}
            />
          </div>
        </div>
      </Modal>
    </React.Fragment>
  );
};

export default AddOrderTypeModal;
