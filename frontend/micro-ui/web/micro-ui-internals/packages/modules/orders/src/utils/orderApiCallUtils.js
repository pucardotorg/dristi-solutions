import { HomeService } from "@egovernments/digit-ui-module-home/src/hooks/services";
import { ordersService } from "../hooks/services";
import { getMediationChangedFlag, getParties } from "./orderUtils";

export const getCourtFee = async (channelId, receiverPincode, taskType, tenantId) => {
  try {
    const breakupResponse = await window?.Digit?.DRISTIService.getSummonsPaymentBreakup(
      {
        Criteria: [
          {
            channelId: channelId,
            receiverPincode: receiverPincode,
            tenantId: tenantId,
            taskType: taskType,
          },
        ],
      },
      {}
    );
    return breakupResponse?.Calculation?.[0]?.breakDown?.reduce((sum, fee) => (sum += fee.amount), 0);
  } catch (error) {
    console.error("error", error);
    return 0;
  }
};

export const addOrderItem = async (
  t,
  order,
  action,
  tenantId,
  applicationTypeConfigUpdated,
  configKeys,
  caseDetails,
  allParties,
  currentOrder,
  allAdvocatesNames
) => {
  const compositeItems = [];
  order?.compositeItems?.forEach((item, index) => {
    let orderSchema = {};
    try {
      let orderTypeDropDownConfig = item?.id
        ? applicationTypeConfigUpdated?.map((obj) => ({ body: obj.body.map((input) => ({ ...input, disable: true })) }))
        : structuredClone(applicationTypeConfigUpdated);
      let orderFormConfig = configKeys.hasOwnProperty(item?.orderSchema?.additionalDetails?.formdata?.orderType?.code)
        ? configKeys[item?.orderSchema?.additionalDetails?.formdata?.orderType?.code]
        : [];
      const modifiedPlainFormConfig = [...orderTypeDropDownConfig, ...orderFormConfig];
      orderSchema = Digit.Customizations.dristiOrders.OrderFormSchemaUtils.formToSchema(
        item?.orderSchema?.additionalDetails?.formdata,
        modifiedPlainFormConfig
      );
    } catch (error) {
      console.error("error :>> ", error);
    }

    let actionResponse = null;
    if (item?.orderType === "MANDATORY_SUBMISSIONS_RESPONSES") {
      const isResponseRequired = item?.orderSchema?.additionalDetails?.formdata?.responseInfo?.isResponseRequired?.code;
      actionResponse = isResponseRequired ? "RESPONSE_REQUIRED" : "RESPONSE_NOT_REQUIRED";
    }

    let parties = getParties(
      item?.orderSchema?.additionalDetails?.formdata?.orderType?.code,
      {
        ...orderSchema,
        orderDetails: { ...orderSchema?.orderDetails },
      },
      allParties
    );

    parties = parties?.map((p) => ({
      ...p,
      counselName: (allAdvocatesNames[p?.userUuid] || [])?.join(", "),
    }));

    const caseNumber =
      (caseDetails?.isLPRCase ? caseDetails?.lprNumber : caseDetails?.courtCaseNumber) ||
      caseDetails?.courtCaseNumber ||
      caseDetails?.cmpNumber ||
      caseDetails?.filingNumber;

    const oldItem = currentOrder?.compositeItems?.find((compItem) => compItem?.id === item?.id);
    const isMediationChanged = getMediationChangedFlag(oldItem?.orderSchema?.orderDetails, {
      ...orderSchema?.orderDetails,
      mediationCentre: t(orderSchema?.orderDetails?.mediationCentre),
      parties,
      modeOfSigning: "INITIATE_E-SIGN",
    });
    const orderSchemaUpdated = {
      ...orderSchema,
      orderDetails: {
        ...orderSchema?.orderDetails,
        parties: parties,
        caseNumber: caseNumber,
        ...(actionResponse && { action: actionResponse }),
        ...(item?.orderSchema?.additionalDetails?.formdata?.orderType?.code === "REFERRAL_CASE_TO_ADR" && {
          dateOfInstitution: caseDetails?.filingDate,
          caseStage: caseDetails?.stage,
          caseId: caseDetails?.id,
          isMediationChanged: isMediationChanged,
          dateOfEndADR: orderSchema?.orderDetails?.hearingDate,
          mediationCentre: t(orderSchema?.orderDetails?.mediationCentre) || "",
          modeOfSigning: "INITIATE_E-SIGN",
        }),
        ...(order?.orderType === "ACCEPT_RESCHEDULING_REQUEST" && { currentDate: new Date().getTime() }),
      },
      additionalDetails: item?.orderSchema?.additionalDetails,
      ...(orderSchema?.orderDetails?.refApplicationId && {
        applicationNumber: [orderSchema.orderDetails.refApplicationId],
      }),
    };
    compositeItems.push({
      ...(item?.id ? { id: item.id } : {}),
      orderType: item?.orderSchema?.additionalDetails?.formdata?.orderType?.code,
      orderSchema: orderSchemaUpdated,
    });
  });
  const payload = {
    order: {
      ...order,
      additionalDetails: null,
      orderDetails: null,
      orderType: null,
      orderCategory: "COMPOSITE",
      orderTitle: `${t(compositeItems?.[0]?.orderType)} and Other Items`,
      compositeItems,
      workflow: { ...order.workflow, action, documents: [{}] },
    },
  };

  if (order?.orderNumber) {
    return await ordersService.addOrderItem(payload, { tenantId });
  }
  return await ordersService.createOrder(payload, { tenantId });
};

export const createOrder = async (order, tenantId, applicationTypeConfigUpdated, configKeys, caseDetails, allParties) => {
  try {
    let orderSchema = {};
    try {
      let orderTypeDropDownConfig = order?.orderNumber
        ? applicationTypeConfigUpdated?.map((item) => ({ body: item.body.map((input) => ({ ...input, disable: true })) }))
        : structuredClone(applicationTypeConfigUpdated);
      let orderFormConfig = configKeys.hasOwnProperty(order?.orderType) ? configKeys[order?.orderType] : [];
      const modifiedPlainFormConfig = [...orderTypeDropDownConfig, ...orderFormConfig];
      orderSchema = Digit.Customizations.dristiOrders.OrderFormSchemaUtils.formToSchema(order.additionalDetails.formdata, modifiedPlainFormConfig);
    } catch (error) {
      console.error("error :>> ", error);
    }
    const parties = getParties(
      order?.orderType,
      {
        ...orderSchema,
        orderDetails: { ...orderSchema?.orderDetails, ...(order?.orderDetails || {}) },
      },
      allParties
    );

    const caseNumber =
      (caseDetails?.isLPRCase ? caseDetails?.lprNumber : caseDetails?.courtCaseNumber) ||
      caseDetails?.courtCaseNumber ||
      caseDetails?.cmpNumber ||
      caseDetails?.filingNumber;
    orderSchema = { ...orderSchema, orderDetails: { ...orderSchema?.orderDetails, parties: parties, caseNumber: caseNumber } };

    return await ordersService.createOrder(
      {
        order: {
          ...order,
          ...orderSchema,
        },
      },
      { tenantId }
    );
  } catch (error) {
    console.error(error);
    throw error; // Re-throw to allow calling component to handle with CustomToast
  }
};

export const deleteOrderItem = async (order, itemID, tenantId) => {
  try {
    return await ordersService.removeOrderItem(
      {
        order: {
          tenantId: order?.tenantId,
          itemID: itemID,
          orderNumber: order?.orderNumber,
          itemText: order?.itemText,
        },
      },
      { tenantId }
    );
  } catch (error) {
    console.error(error);
    throw error; // Re-throw to allow calling component to handle with CustomToast
  }
};

export const onDocumentUpload = async (fileData, filename, tenantId) => {
  if (fileData?.fileStore) return fileData;
  const fileUploadRes = await window?.Digit.UploadServices.Filestorage("DRISTI", fileData, tenantId);
  return { file: fileUploadRes?.data, fileType: fileData.type, filename };
};

export const replaceUploadedDocsWithCombinedFile = async (formData, tenantId) => {
  try {
    const docsArray = formData?.lprDocuments?.documents;
    if (!Array.isArray(docsArray) || docsArray.length === 0) {
      return formData;
    }
    const uploadedDocs = await Promise.all(
      docsArray.map(async (fileData) => {
        if (fileData?.fileStore) {
          return fileData;
        }
        try {
          const docs = await onDocumentUpload(fileData, fileData?.name, tenantId);
          return {
            documentType: docs?.fileType || "application/pdf",
            fileStore: docs?.file?.files?.[0]?.fileStoreId || null,
            additionalDetails: { name: docs?.filename || fileData?.name || "lpr" },
          };
        } catch (err) {
          console.error("Error uploading document:", fileData, err);
          return null;
        }
      })
    );
    formData.lprDocuments.documents = uploadedDocs.filter(Boolean);
    return formData;
  } catch (err) {
    console.error("replaceUploadedDocsWithCombinedFile failed:", err);
    throw err;
  }
};

export const fetchInboxData = async ({ tenantId }) => {
  const now = new Date();

  const from = new Date(now);
  from.setHours(0, 0, 0, 0);

  const to = new Date(now);
  to.setHours(23, 59, 59, 999);

  const payload = {
    inbox: {
      processSearchCriteria: {
        businessService: ["hearing-default"],
        moduleName: "Hearing Service",
        tenantId,
      },
      moduleSearchCriteria: {
        tenantId,
        fromDate: from.getTime(),
        toDate: to.getTime(),
      },
      tenantId,
      limit: 300,
      offset: 0,
    },
  };

  const res = await HomeService.InboxSearch(payload, { tenantId });
  return res?.items || [];
};
