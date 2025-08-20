import { CloseSvg } from "@egovernments/digit-ui-components";
import { DRISTIService } from "@egovernments/digit-ui-module-dristi/src/services";
import React from "react";

export const getCourtFee = async (channelId, receiverPincode, taskType, tenantId) => {
  try {
    const breakupResponse = await DRISTIService.getSummonsPaymentBreakup(
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
    return breakupResponse?.Calculation?.[0]?.breakDown?.filter((data) => data?.type === "Court Fee").reduce((sum, fee) => (sum += fee.amount), 0);
  } catch (error) {
    console.error("error", error);
    return 0;
  }
};

export const Heading = (props) => {
  return <h1 className="heading-m">{props.label}</h1>;
};

export const CloseBtn = (props) => {
  return (
    <div
      onClick={props?.onClick}
      style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        paddingRight: "20px",
        cursor: "pointer",
        ...(props?.backgroundColor && { backgroundColor: props.backgroundColor }),
      }}
    >
      <CloseSvg />
    </div>
  );
};

export const prepareUpdatedOrderData = (currentOrder, orderFormData, compOrderIndex) => {
  let updatedCompositeItems = null;

  if (currentOrder?.orderCategory === "COMPOSITE") {
    updatedCompositeItems = currentOrder?.compositeItems?.map((compItem, compIndex) => {
      if (compIndex === compOrderIndex) {
        return {
          ...compItem,
          orderType: orderFormData?.orderType?.code,
          orderSchema: {
            ...(compItem?.orderSchema || {}),
            additionalDetails: {
              ...(compItem?.orderSchema?.additionalDetails || {}),
              formdata: orderFormData,
            },
          },
        };
      }
      return compItem;
    });
  }

  return {
    ...currentOrder,
    comments:
      orderFormData?.comments?.text ||
      orderFormData?.additionalComments?.text ||
      orderFormData?.otherDetails?.text ||
      orderFormData?.sentence?.text ||
      orderFormData?.briefSummary ||
      "",
    orderTitle: currentOrder?.orderCategory !== "COMPOSITE" ? orderFormData?.orderType?.code : currentOrder?.orderTitle,
    orderCategory: currentOrder?.orderCategory,
    orderType: currentOrder?.orderCategory !== "COMPOSITE" ? orderFormData?.orderType?.code : null,
    compositeItems: currentOrder?.orderCategory !== "COMPOSITE" ? null : updatedCompositeItems,
    additionalDetails: currentOrder?.orderCategory !== "COMPOSITE" ? { ...currentOrder?.additionalDetails, formdata: orderFormData } : null,
    orderDetails: currentOrder?.orderCategory !== "COMPOSITE" ? currentOrder?.orderDetails : null,
  };
};

export const getUpdateDocuments = (documents, documentsFile, signedDoucumentUploadedID, fileStoreIds) => {
  if (!documentsFile) return documents;

  if (documentsFile?.documentType === "UNSIGNED") {
    const existingUnsignedDoc = documents?.find((doc) => doc?.documentType === "UNSIGNED");

    if (existingUnsignedDoc) {
      return documents?.map((doc) =>
        doc?.documentType === "UNSIGNED"
          ? {
              ...doc,
              fileStore: documentsFile?.fileStore,
              additionalDetails: documentsFile?.additionalDetails,
            }
          : doc
      );
    }
  }

  if (documentsFile?.documentType === "SIGNED") {
    const localStorageID = sessionStorage.getItem("fileStoreId");
    const newFileStoreId = localStorageID || signedDoucumentUploadedID;
    fileStoreIds.delete(newFileStoreId);
    let index = 1;
    for (const fileStoreId of fileStoreIds) {
      if (fileStoreId !== newFileStoreId) {
        documents.push({
          isActive: false,
          documentType: "UNSIGNED",
          fileStore: fileStoreId,
          documentOrder: index,
        });
        index++;
      }
    }
  }
  return [...documents, documentsFile];
};

export const getFormData = (orderType, order) => {
  const formDataKeyMap = {
    SUMMONS: "SummonsOrder",
    WARRANT: "warrantFor",
    NOTICE: "noticeOrder",
    PROCLAMATION: "proclamationFor",
    ATTACHMENT: "attachmentFor",
  };
  const formDataKey = formDataKeyMap[orderType];
  return order?.additionalDetails?.formdata?.[formDataKey];
};

export const getOrderData = (orderType, orderFormData) => {
  return ["SUMMONS", "NOTICE", "WARRANT", "PROCLAMATION", "ATTACHMENT"].includes(orderType) ? orderFormData?.party?.data : orderFormData;
};

export const formatDate = (date, format) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  if (format === "DD-MM-YYYY") {
    return `${day}-${month}-${year}`;
  }
  return `${year}-${month}-${day}`;
};

export const generateAddress = ({
  pincode = "",
  district = "",
  city = "",
  state = "",
  coordinates = { longitude: "", latitude: "" },
  locality = "",
  address = "",
} = {}) => {
  if (address) {
    return address;
  }
  return `${locality ? `${locality},` : ""} ${district ? `${district},` : ""} ${city ? `${city},` : ""} ${state ? `${state},` : ""} ${
    pincode ? `- ${pincode}` : ""
  }`.trim();
};

export const channelTypeEnum = {
  "e-Post": { code: "POST", type: "Post" },
  "Registered Post": { code: "RPAD", type: "RPAD" },
  SMS: { code: "SMS", type: "SMS" },
  "Via Police": { code: "POLICE", type: "Police" },
  "E-mail": { code: "EMAIL", type: "Email" },
};

export const getParties = (type, orderSchema, allParties) => {
  let parties = [];
  if (["SCHEDULE_OF_HEARING_DATE", "SCHEDULING_NEXT_HEARING"].includes(type)) {
    parties = orderSchema?.orderDetails.partyName;
  } else if (type === "MANDATORY_SUBMISSIONS_RESPONSES") {
    parties = [
      ...(orderSchema?.orderDetails?.partyDetails?.partiesToRespond || []),
      ...(orderSchema?.orderDetails?.partyDetails?.partyToMakeSubmission || []),
    ];
  } else if (["WARRANT", "SUMMONS", "NOTICE", "PROCLAMATION", "ATTACHMENT"].includes(type)) {
    parties = orderSchema?.orderDetails?.respondentName?.name
      ? [orderSchema?.orderDetails?.respondentName?.name]
      : orderSchema?.orderDetails?.respondentName
      ? [orderSchema?.orderDetails?.respondentName]
      : [];
  } else if (type === "SECTION_202_CRPC") {
    parties = [orderSchema?.orderDetails?.applicationFilledBy, orderSchema?.orderDetails.soughtOfDetails];
  } else if (
    orderSchema?.orderDetails?.parties?.length > 0 &&
    ["BAIL", "REJECT_VOLUNTARY_SUBMISSIONS", "APPROVE_VOLUNTARY_SUBMISSIONS", "REJECTION_RESCHEDULE_REQUEST", "CHECKOUT_REJECT"].includes(type)
  ) {
    parties = orderSchema?.orderDetails?.parties?.map((party) => party?.partyName);
  } else {
    parties = allParties?.map((party) => ({ partyName: party.name, partyType: party?.partyType }));
    return parties;
  }
  const updatedParties = parties?.map((party) => {
    const matchingParty = allParties?.find((p) => p?.code?.trim() === party?.trim());
    if (matchingParty) {
      return {
        partyName: matchingParty?.name,
        partyType: matchingParty?.partyType,
      };
    } else {
      return {
        partyName: party,
        partyType: "witness",
      };
    }
  });
  return updatedParties;
};
