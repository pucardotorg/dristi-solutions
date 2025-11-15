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
  onBailBondRequiredChecked,
  bailBondTaskExists = false,
  onConfirmBailBondTask,
  onOrderFormDataChange,
  persistedDefaultValues,
}) => {
  const [formdata, setFormData] = useState({});
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
  const [isBailBondTaskExists, setIsBailBondTaskExists] = useState(false);
  const [bailBondRequired, setBailBondRequired] = useState(false);
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const { filingNumber } = Digit.Hooks.useQueryParams();
  const courtId = localStorage.getItem("courtId");
  const getBailBondSessionKey = useCallback(() => {
    try {
      const uniqueRefPart =
        currentOrder?.orderNumber ||
        currentOrder?.additionalDetails?.formdata?.refApplicationId ||
        currentOrder?.additionalDetails?.refApplicationId ||
        "";
      return `RAISE_BB_REF_${filingNumber}${uniqueRefPart ? `_${uniqueRefPart}` : ""}`;
    } catch (_) {
      return `RAISE_BB_REF_${filingNumber || ""}`;
    }
  }, [currentOrder, filingNumber]);
  const existingRefApplicationId = useMemo(() => {
    try {
      if (currentOrder?.orderCategory === "INTERMEDIATE") {
        return currentOrder?.additionalDetails?.formdata?.refApplicationId || currentOrder?.additionalDetails?.refApplicationId;
      }
      if (Array.isArray(currentOrder?.compositeItems)) {
        const ad = currentOrder?.compositeItems?.[index]?.orderSchema?.additionalDetails;
        return ad?.formdata?.refApplicationId || ad?.refApplicationId;
      }
      return undefined;
    } catch (e) {
      return undefined;
    }
  }, [currentOrder, index]);
  const [caseData, setCaseData] = useState(undefined);
  const containerRef = useRef(null);
  const initialRefApplicationIdRef = useRef(undefined);
  useEffect(() => {
    try {
      const dv = getDefaultValue?.(index) || {};
      if (typeof initialRefApplicationIdRef.current === "undefined" && typeof dv?.refApplicationId !== "undefined") {
        initialRefApplicationIdRef.current = dv.refApplicationId;
      }
    } catch (e) {
      // noop
    }
  }, [getDefaultValue, index]);
  const userInfo = useMemo(() => Digit.UserService.getUser()?.info, []);
  const roles = useMemo(() => userInfo?.roles || [], [userInfo]);
  const caseDetails = useMemo(() => ({ ...(caseData?.criteria?.[0]?.responseList?.[0] || {}) }), [caseData]);

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
      if (formData?.chequeAmount < 0 && !Object.keys(formState?.errors).includes("chequeAmount")) {
        setFormErrors?.current?.[index]?.("chequeAmount", { message: t("Amount should be greater that 0") });
      } else if (formData?.chequeAmount > 0 && Object.keys(formState?.errors).includes("chequeAmount")) {
        clearFormErrors?.current?.[index]?.("chequeAmount");
      }

      const isSurety = (() => {
        const bt = formData?.bailType;
        const code = typeof bt === "string" ? bt : bt?.code || bt?.type;
        return (code || "").toUpperCase() === "SURETY";
      })();

      if (isSurety) {
        const suretiesNum = Number(formData?.noOfSureties);
        const hasNoOfSuretiesError = Object.keys(formState?.errors).includes("noOfSureties");
        if (formState?.submitCount && !formData?.noOfSureties && !hasNoOfSuretiesError) {
          setFormErrors?.current?.[index]?.("noOfSureties", { message: t("CORE_REQUIRED_FIELD_ERROR") });
        } else if (formState?.submitCount && Number.isFinite(suretiesNum) && suretiesNum <= 0 && !hasNoOfSuretiesError) {
          setFormErrors?.current?.[index]?.("noOfSureties", { message: t("Sureties should be greater that 0") });
        } else if (Number.isFinite(suretiesNum) && suretiesNum > 0 && hasNoOfSuretiesError) {
          clearFormErrors?.current?.[index]?.("noOfSureties");
        }
      } else {
        if (formData?.noOfSureties) setValue("noOfSureties", undefined);
        if (Object.keys(formState?.errors).includes("noOfSureties")) {
          clearFormErrors?.current?.[index]?.("noOfSureties");
        }
        if (bailBondRequired) setBailBondRequired(false);
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

  useEffect(() => {
    const fetchCaseDetails = async () => {
      if (!filingNumber) return;
      try {
        const res = await DRISTIService.searchCaseService(
          {
            criteria: [
              {
                filingNumber,
                ...(courtId && { courtId }),
              },
            ],
            tenantId,
          },
          {}
        );
        setCaseData(res);
      } catch (err) {
        // noop
      }
    };
    fetchCaseDetails();
  }, [filingNumber, courtId, tenantId]);

  useEffect(() => {
    try {
      const hasAcceptBail =
        orderType?.code === "ACCEPT_BAIL" ||
        (currentOrder?.orderCategory === "INTERMEDIATE" && currentOrder?.orderType === "ACCEPT_BAIL") ||
        (Array.isArray(currentOrder?.compositeItems) &&
          currentOrder?.compositeItems?.some?.((it) => it?.isEnabled && it?.orderType === "ACCEPT_BAIL"));
      if (hasAcceptBail) {
        const persisted = (persistedDefaultValues || {}).bailBondRequired;
        const defaults = (getDefaultValue?.(index) || {}).bailBondRequired;
        const readBailFlag = (fd) => {
          if (!fd) return undefined;
          if (typeof fd?.bailBondRequired !== "undefined") return fd?.bailBondRequired;
          if (typeof fd?.acceptBail?.bailBondRequired !== "undefined") return fd?.acceptBail?.bailBondRequired;
          if (typeof fd?.bail?.bailBondRequired !== "undefined") return fd?.bail?.bailBondRequired;
          return undefined;
        };
        const currentOrderValue = (() => {
          try {
            if (currentOrder?.orderCategory === "INTERMEDIATE") {
              if (currentOrder?.orderType === "ACCEPT_BAIL") {
                return readBailFlag(currentOrder?.additionalDetails?.formdata);
              }
            } else if (Array.isArray(currentOrder?.compositeItems)) {
              const acceptItem = currentOrder?.compositeItems?.find?.((it) => it?.orderType === "ACCEPT_BAIL");
              return readBailFlag(acceptItem?.orderSchema?.additionalDetails?.formdata);
            }
            return undefined;
          } catch (_) {
            return undefined;
          }
        })();
        const initial =
          typeof persisted !== "undefined"
            ? persisted
            : typeof currentOrderValue !== "undefined"
            ? currentOrderValue
            : typeof defaults !== "undefined"
            ? defaults
            : bailBondRequired;
        if (typeof initial !== "undefined") {
          setBailBondRequired(Boolean(initial));
        }
      }
    } catch (_) {}
  }, [orderType?.code, index, persistedDefaultValues, currentOrder]);

  const hasBailBondTask = useMemo(() => Boolean(bailBondTaskExists || isBailBondTaskExists), [bailBondTaskExists, isBailBondTaskExists]);
  const hasSessionPersisted = useMemo(() => {
    try {
      const key = getBailBondSessionKey();
      return sessionStorage.getItem(key) === "true";
    } catch (_) {
      return false;
    }
  }, [getBailBondSessionKey]);

  const effectiveBailBondRequired = useMemo(() => {
    try {
      if (bailBondRequired) return true;
      if (hasBailBondTask) return true;
      if (hasSessionPersisted) return true;
      if (formdata?.bailBondRequired || formdata?.acceptBail?.bailBondRequired || formdata?.bail?.bailBondRequired) return true;
      if (currentOrder?.orderCategory === "INTERMEDIATE" && currentOrder?.orderType === "ACCEPT_BAIL") {
        const fd = currentOrder?.additionalDetails?.formdata;
        return Boolean(fd?.bailBondRequired || fd?.acceptBail?.bailBondRequired || fd?.bail?.bailBondRequired);
      }
      if (Array.isArray(currentOrder?.compositeItems)) {
        const acceptItem = currentOrder?.compositeItems?.find?.((it) => it?.orderType === "ACCEPT_BAIL");
        const fd = acceptItem?.orderSchema?.additionalDetails?.formdata;
        return Boolean(fd?.bailBondRequired || fd?.acceptBail?.bailBondRequired || fd?.bail?.bailBondRequired);
      }
      return false;
    } catch (_) {
      return false;
    }
  }, [bailBondRequired, hasBailBondTask, hasSessionPersisted, formdata, currentOrder, index]);

  useEffect(() => {
    if (effectiveBailBondRequired && !bailBondRequired) {
      setBailBondRequired(true);
    }
  }, []);

  useEffect(() => {
    try {
      if (effectiveBailBondRequired) {
        const key = getBailBondSessionKey();
        sessionStorage.setItem(key, "true");
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    const checkBailBondTask = async () => {
      if (!filingNumber) return;
      try {
        const uniqueRefPart =
          currentOrder?.orderNumber ||
          currentOrder?.additionalDetails?.formdata?.refApplicationId ||
          currentOrder?.additionalDetails?.refApplicationId ||
          "";
        const expectedRefId = `MANUAL_BAIL_BOND_${filingNumber}${uniqueRefPart ? `_${uniqueRefPart}` : ""}`;
        const pendingTask = await HomeService.getPendingTaskService(
          {
            SearchCriteria: {
              tenantId,
              moduleName: "Pending Tasks Service",
              moduleSearchCriteria: {
                isCompleted: false,
                assignedRole: [...roles],
                filingNumber: filingNumber,
                courtId: courtId,
                entityType: "bail bond",
              },
              limit: 1000,
              offset: 0,
            },
          },
          { tenantId }
        );
        const exists = Array.isArray(pendingTask?.data) && pendingTask?.data?.some?.((task) => task?.referenceId === expectedRefId);
        setIsBailBondTaskExists(Boolean(exists));
      } catch (e) {
        // noop
      }
    };
    checkBailBondTask();
  }, [filingNumber, courtId, roles, tenantId]);

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
                const bt = formdata?.bailType;
                const bailTypeCode = (typeof bt === "string" ? bt : bt?.code || bt?.type || "").toUpperCase();
                const showSuretyFields = !isAcceptBail || bailTypeCode === "SURETY";
                let effectiveConfig = isAcceptBail
                  ? (modifiedFormConfig || []).map((cfg) => ({
                      ...cfg,
                      body: cfg.body.filter((field) => {
                        if (field.key === "noOfSureties") return showSuretyFields;
                        return true;
                      }),
                    }))
                  : modifiedFormConfig;

                if (isAcceptBail && bailTypeCode === "SURETY") {
                  const isBailBondCheckboxEnabled = (() => {
                    if (!(orderType?.code === "ACCEPT_BAIL" && bailTypeCode === "SURETY")) return false;
                    const amountValid = Number(formdata?.chequeAmount) > 0;
                    const suretiesValid = Number(formdata?.noOfSureties) > 0;
                    return amountValid && suretiesValid && !isSubmitDisabled;
                  })();

                  const CheckboxRow = () => (
                    <div className="checkbox-item" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        id="bail-bond-required"
                        type="checkbox"
                        className="custom-checkbox"
                        checked={effectiveBailBondRequired}
                        onChange={(e) => {
                          const checked = e?.target?.checked;
                          setBailBondRequired(checked);
                          try {
                            if (typeof onOrderFormDataChange === "function")
                              onOrderFormDataChange({ ...formdata, bailBondRequired: checked }, { index, orderType });
                          } catch (_) {}
                          if (checked) {
                            try {
                              const key = getBailBondSessionKey();
                              sessionStorage.setItem(key, "true");
                            } catch (_) {}
                            onBailBondRequiredChecked && onBailBondRequiredChecked();
                          }
                        }}
                        style={{ cursor: "pointer", width: 20, height: 20 }}
                        disabled={!isBailBondCheckboxEnabled || hasBailBondTask || effectiveBailBondRequired}
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
                      ...(orderType?.code === "ACCEPT_BAIL" ? persistedDefaultValues || {} : {}),
                    }}
                    config={effectiveConfig}
                    fieldStyle={{ width: "100%" }}
                    cardClassName={`order-type-form-composer new-order`}
                    actionClassName={"order-type-action"}
                    onFormValueChange={onFormValueChange}
                    label={t(saveLabel)}
                    secondaryLabel={t(cancelLabel)}
                    showSecondaryLabel={true}
                    onSubmit={async () => {
                      const outgoing = {
                        ...formdata,
                        bailBondRequired,
                        ...(formdata?.refApplicationId || existingRefApplicationId || initialRefApplicationIdRef.current
                          ? { refApplicationId: formdata?.refApplicationId || existingRefApplicationId || initialRefApplicationIdRef.current }
                          : {}),
                      };
                      try {
                        if (
                          typeof onConfirmBailBondTask === "function" &&
                          orderType?.code === "ACCEPT_BAIL" &&
                          bailBondRequired &&
                          !bailBondTaskExists
                        ) {
                          await onConfirmBailBondTask();
                          // After successful confirmation, mark the task as existing so the checkbox stays checked and disabled
                          setIsBailBondTaskExists(true);
                        }
                      } catch (_) {}
                      handleSubmit(outgoing, index);
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
    </React.Fragment>
  );
};

export default AddOrderTypeModal;
