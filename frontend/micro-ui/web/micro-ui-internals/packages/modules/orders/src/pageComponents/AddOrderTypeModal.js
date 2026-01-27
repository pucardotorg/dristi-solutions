import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import { CloseSvg } from "@egovernments/digit-ui-react-components";
import { FormComposerV2 } from "@egovernments/digit-ui-react-components";
import isEqual from "lodash/isEqual";
import { CloseBtn, Heading } from "../utils/orderUtils";
import { DRISTIService } from "@egovernments/digit-ui-module-dristi/src/services";
import { HomeService } from "@egovernments/digit-ui-module-home/src/hooks/services";
import { Urls } from "@egovernments/digit-ui-module-dristi/src/hooks";

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
  setWarrantSubtypeCode,
  onOrderFormDataChange,
  persistedDefaultValues,
  bailBondRequired,
  setBailBondRequired,
}) => {
  const [formdata, setFormData] = useState({});
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
  const containerRef = useRef(null);
  const [showBailBondModal, setShowBailBondModal] = useState(false);

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

    const currentOrderType = orderType?.code || "";

    if (currentOrderType && ["COST", "WITNESS_BATTA"].includes(currentOrderType)) {
      if (typeof formData?.amount === "string") {
        let cleanedAmount = formData.amount.replace(/-/g, "").replace(/[^0-9.]/g, "");
        if (cleanedAmount === "-") cleanedAmount = "";
        if (cleanedAmount !== formData.amount) {
          setValue("amount", cleanedAmount);
        }
      }

      const amountNum = Number(formData?.amount);
      const hasAmount = formData?.amount !== undefined && formData?.amount !== null && formData?.amount !== "";
      const hasAmountError = Object.keys(formState?.errors).includes("amount");

      if (hasAmount && Number.isFinite(amountNum) && amountNum < 0 && !hasAmountError) {
        setFormErrors?.current?.[index]?.("amount", { message: t("Amount should be greater that 0") });
      } else if ((!hasAmount || (Number.isFinite(amountNum) && amountNum >= 0)) && hasAmountError) {
        clearFormErrors?.current?.[index]?.("amount");
      }
    }

    if (currentOrderType && ["MANDATORY_SUBMISSIONS_RESPONSES"].includes(currentOrderType)) {
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

    if (currentOrderType && ["WARRANT"].includes(currentOrderType)) {
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

    if (currentOrderType && ["ATTACHMENT"].includes(currentOrderType)) {
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

    if (currentOrderType === "ACCEPT_BAIL") {
      if (typeof formData?.chequeAmount === "string") {
        let cleaned = formData.chequeAmount.replace(/[^0-9.]/g, "");
        if (cleaned !== formData.chequeAmount) {
          setValue("chequeAmount", cleaned);
        }
      }

      const chequeAmountNum = Number(formData?.chequeAmount);
      if (chequeAmountNum < 0 && !Object.keys(formState?.errors).includes("chequeAmount")) {
        setFormErrors?.current?.[index]?.("chequeAmount", { message: t("Amount should be greater that 0") });
      } else if (chequeAmountNum >= 0 && Object.keys(formState?.errors).includes("chequeAmount")) {
        clearFormErrors?.current?.[index]?.("chequeAmount");
      }

      const isSurety = (() => {
        const bt = formData?.bailType;
        const code = typeof bt === "string" ? bt : bt?.code || bt?.type;
        return (code || "").toUpperCase() === "SURETY";
      })();

      if (isSurety) {
        if (typeof formData?.noOfSureties === "string") {
          const cleanedSureties = formData.noOfSureties.replace(/\D/g, "");
          if (cleanedSureties !== formData.noOfSureties) {
            setValue("noOfSureties", cleanedSureties);
          }
        }

        const suretiesNum = Number(formData?.noOfSureties);
        const hasNoOfSuretiesError = Object.keys(formState?.errors).includes("noOfSureties");
        if (formState?.submitCount && !formData?.noOfSureties && !hasNoOfSuretiesError) {
          setFormErrors?.current?.[index]?.("noOfSureties", { message: t("CORE_REQUIRED_FIELD_ERROR") });
        } else if (Number.isFinite(suretiesNum) && suretiesNum <= 0 && !hasNoOfSuretiesError) {
          setFormErrors?.current?.[index]?.("noOfSureties", { message: t("MINIMUM_SURETIES_ERROR") });
        } else if (Number.isFinite(suretiesNum) && suretiesNum > 100 && !hasNoOfSuretiesError) {
          setFormErrors?.current?.[index]?.("noOfSureties", { message: t("MAXIMUM_SURETIES_ERROR") });
        } else if (Number.isFinite(suretiesNum) && suretiesNum > 0 && suretiesNum <= 100 && hasNoOfSuretiesError) {
          clearFormErrors?.current?.[index]?.("noOfSureties");
        }
      } else {
        if (formData?.noOfSureties) setValue("noOfSureties", undefined);
        if (Object.keys(formState?.errors).includes("noOfSureties")) {
          clearFormErrors?.current?.[index]?.("noOfSureties");
        }
        // if (bailBondRequired) setBailBondRequired(false);
      }
    }

    if (!isEqual(formdata, formData)) {
      setFormData(formData);
      setWarrantSubtypeCode(formData?.warrantSubType?.templateType);
      try {
        if (typeof onOrderFormDataChange === "function") onOrderFormDataChange({ ...formData, bailBondRequired }, { index, orderType });
      } catch (_) {}
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

  const isBailBondCheckboxEnabled = useMemo(() => {
    const isAcceptBail = orderType?.code === "ACCEPT_BAIL";
    const isSurety = formdata?.bailType?.code === "SURETY";
    const amountValid = Number(formdata?.chequeAmount) > 0;
    const suretiesValid = Number(formdata?.noOfSureties) > 0;

    if (isAcceptBail && isSurety && amountValid && suretiesValid) {
      return true;
    }
    return false;
  }, [orderType, formdata]);

  const newCurrentOrder = useMemo(() => {
    if (currentOrder?.orderCategory === "COMPOSITE") {
      const item = currentOrder?.compositeItems?.[index];
      const schema = item?.orderSchema;

      return {
        ...currentOrder,
        additionalDetails: schema?.additionalDetails,
        orderDetails: schema?.orderDetails,
        orderType: item?.orderType,
      };
    }

    return currentOrder;
  }, [currentOrder, index]);

  const initialBailType = useMemo(() => {
    const bt = newCurrentOrder?.additionalDetails?.formdata?.bailType;
    if (bt == null) return { type: "SURETY", code: "SURETY", name: "SURETY" };
    if (typeof bt === "object" && Object.keys(bt).length === 0) return { type: "SURETY", code: "SURETY", name: "SURETY" };
    return bt;
  }, [newCurrentOrder]);

  const defaultNatureOfDisposal = useMemo(() => {
    const natureOfDisposal = newCurrentOrder?.additionalDetails?.formdata?.natureOfDisposal;
    if (natureOfDisposal == null)
      return {
        code: "UNCONTESTED",
        name: "Uncontested",
      };
    if (typeof natureOfDisposal === "object" && Object?.keys(natureOfDisposal)?.length === 0)
      return {
        code: "UNCONTESTED",
        name: "Uncontested",
      };
    return natureOfDisposal;
  }, [newCurrentOrder]);

  return (
    <React.Fragment>
      <Modal
        headerBarMain={<Heading label={t(headerLabel)} />}
        headerBarEnd={<CloseBtn onClick={handleCancel} />}
        hideModalActionbar={true}
        className="add-order-type-modal"
      >
        <div ref={containerRef}>
          <div className="generate-orders">
            <div className="view-order order-type-form-modal">
              {(() => {
                const isAcceptBail = orderType?.code === "ACCEPT_BAIL";
                const isReferralToADR = orderType?.code === "REFERRAL_CASE_TO_ADR";
                const bt = formdata?.bailType;
                const bailTypeCode = (typeof bt === "string" ? bt : bt?.code || bt?.type || "").toUpperCase();
                const showSuretyFields = !isAcceptBail || bailTypeCode === "SURETY";
                const isMediation = formdata?.ADRMode?.name === "MEDIATION";

                let effectiveConfig = modifiedFormConfig;

                if (isAcceptBail) {
                  effectiveConfig = (modifiedFormConfig || [])?.map((conf) => ({
                    ...conf,
                    body: conf?.body?.filter((field) => {
                      if (field?.key === "noOfSureties") return showSuretyFields;
                      return true;
                    }),
                  }));
                } else if (isReferralToADR) {
                  const mediationKeys = ["mediationCentre", "mediationNote", "dateOfEndADR"];
                  const hideForMediationEndKeys = ["dateOfEndADR"];
                  effectiveConfig = (modifiedFormConfig || [])?.map((conf) => ({
                    ...conf,
                    body: conf?.body?.map((field) => {
                      const shouldHide =
                        (mediationKeys?.includes(field?.key) && !isMediation) || (hideForMediationEndKeys?.includes(field?.key) && isMediation);
                      return {
                        ...field,
                        populators: {
                          ...field?.populators,
                          hideInForm: shouldHide,
                        },
                      };
                    }),
                  }));
                }

                if (isAcceptBail && bailTypeCode === "SURETY") {
                  const CheckboxRow = () => (
                    <div className="checkbox-item" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        id="bail-bond-required"
                        type="checkbox"
                        className="custom-checkbox"
                        checked={newCurrentOrder?.additionalDetails?.formdata?.requestBailBond || bailBondRequired}
                        onChange={(e) => {
                          const checked = e?.target?.checked;
                          if (checked === true) {
                            setShowBailBondModal(true);
                          } else {
                            setBailBondRequired(false);
                          }
                        }}
                        style={{ cursor: "pointer", width: 20, height: 20 }}
                        disabled={newCurrentOrder?.additionalDetails?.formdata?.requestBailBond ? true : !isBailBondCheckboxEnabled}
                      />
                      <label htmlFor="bail-bond-required">{t("REQUEST_BAIL_BOND")}</label>
                    </div>
                  );
                  effectiveConfig = [
                    ...effectiveConfig,
                    {
                      body: [
                        {
                          type: "component",
                          key: "requestBailBond",
                          withoutLabel: true,
                          component: CheckboxRow,
                          populators: {},
                        },
                      ],
                    },
                  ];
                }
                return (
                  <FormComposerV2
                    className={"generate-orders order-type-modal"}
                    defaultValues={{
                      ...(getDefaultValue(index) || {}),
                      ...(orderType?.code === "ACCEPT_BAIL" && { bailType: initialBailType }),
                      ...(orderType?.code === "ABATE_CASE" && { natureOfDisposal: defaultNatureOfDisposal }),
                    }}
                    config={effectiveConfig}
                    fieldStyle={{ width: "100%" }}
                    cardClassName={`order-type-form-composer new-order`}
                    actionClassName={"order-type-action"}
                    onFormValueChange={onFormValueChange}
                    label={t(saveLabel)}
                    secondaryLabel={t(cancelLabel)}
                    showSecondaryLabel={true}
                    onSubmit={() => {
                      const updatedFormData = {
                        ...formdata,
                        ...(orderType?.code === "ACCEPT_BAIL" && {
                          requestBailBond: Boolean(newCurrentOrder?.additionalDetails?.formdata?.requestBailBond || bailBondRequired),
                        }),
                      };
                      handleSubmit(updatedFormData, index);
                    }}
                    onSecondayActionClick={handleCancel}
                    isDisabled={isSubmitDisabled || addOrderTypeLoader}
                  />
                );
              })()}
            </div>
          </div>
        </div>
      </Modal>

      {showBailBondModal && (
        <Modal
          headerBarEnd={<CloseBtn onClick={() => setShowBailBondModal(false)} />}
          actionSaveLabel={t("CS_COMMON_CONFIRM")}
          actionSaveOnSubmit={() => {
            setBailBondRequired(true);
            setShowBailBondModal(false);
          }}
          actionCancelLabel={t("CS_COMMON_CANCEL")}
          isBackButtonDisabled={false}
          actionCancelOnSubmit={() => {
            setShowBailBondModal(false);
            setBailBondRequired(false);
          }}
          formId="modal-action"
          headerBarMain={<Heading label={t("CREATE_BAIL_BOND_TASK")} />}
          className="upload-signature-modal"
          submitTextClassName="upload-signature-button"
        >
          <div style={{ margin: "16px 16px" }}>{t("CREATE_BAIL_BOND_TASK_TEXT")}</div>
        </Modal>
      )}
    </React.Fragment>
  );
};

export default AddOrderTypeModal;
