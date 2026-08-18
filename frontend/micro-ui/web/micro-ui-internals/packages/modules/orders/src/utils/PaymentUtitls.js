export const formDataKeyMap = {
  NOTICE: "noticeOrder",
  SUMMONS: "SummonsOrder",
};

export const formatAddress = (address) => {
  if (typeof address === "string") return address;

  if (address && typeof address === "object") {
    // Handle nested addressDetails structure
    const addressObj = address.addressDetails || address;
    const { pincode, city, district, locality, state } = addressObj;
    return [locality, city, district, state, pincode].filter(Boolean).join(", ");
  }

  return "";
};

export const prepareTaskPayload = ({
  noticeData = [],
  taskSearchData,
  formData = [],
  filingNumber,
  tenantId,
  taskType,
  orderNumber,
  orderItemId,
  courtId,
}) => {
  const findFormData = (uniqueId) => formData?.find((f) => (f?.data?.uniqueId || f?.uniqueId) === uniqueId)?.data;
  const updatedParties =
    noticeData?.map((notice) => {
      const uniqueId = notice?.partyUniqueId;
      const matchedForm = findFormData(uniqueId);

      const allAddress = notice?.addresses?.map((item) => ({
        id: item?.id,
        addressDetails: item?.addressDetails?.addressDetails || item?.addressDetails || {},
      }));
      const updatedUserData = {
        ...matchedForm,
        addressDetails: allAddress,
      };

      const selectedAddresses = notice?.addresses?.filter((a) => a?.selected) || [];

      const selectedChannels = notice?.courierOptions?.filter((c) => c?.selected) || [];
      const baseParty = {
        addresses: selectedAddresses?.map((a) => ({
          id: a?.id,
          addressDetails: {
            city: a?.addressDetails?.addressDetails?.city || a?.addressDetails?.city || null,
            state: a?.addressDetails?.addressDetails?.state || a?.addressDetails?.state || null,
            pincode: a?.addressDetails?.addressDetails?.pincode || a?.addressDetails?.pincode || null,
            district: a?.addressDetails?.addressDetails?.district || a?.addressDetails?.district || null,
            locality: a?.addressDetails?.addressDetails?.locality || a?.addressDetails?.locality || null,
            coordinates: a?.addressDetails?.addressDetails?.coordinates || null,
            typeOfAddress: a?.addressDetails?.addressDetails?.typeOfAddress || null,
          },
        })),
        deliveryChannels: selectedChannels?.map((c) => ({
          fees: String(c?.fees || "0"),
          status: null,
          channelCode: c?.channelCode || null,
          feePaidDate: null,
          statusChangeDate: null,
          deliveryChannelName: c?.deliveryChannelName || null,
          paymentFees: null,
          paymentTransactionId: null,
          paymentStatus: null,
          deliveryStatus: null,
          channelAcknowledgementId: null,
          channelId: c?.channelId || null,
          taskType: c?.taskType || null,
          channelDeliveryTime: c?.channelDeliveryTime || null,
        })),
      };

      if (notice?.partyType === "Respondent" || notice?.partyType === "Accused") {
        return {
          ...baseParty,
          respondentDetails: { ...(updatedUserData || {}), uniqueId },
        };
      } else if (notice?.partyType === "Witness") {
        return {
          ...baseParty,
          witnessDetails: { ...(updatedUserData || {}), uniqueId },
        };
      } else {
        return baseParty;
      }
    }) || [];

  let finalPartyDetails = [];

  if (taskSearchData) {
    const existingParties = taskSearchData?.partyDetails || [];

    finalPartyDetails = updatedParties?.reduce(
      (acc, newParty) => {
        const newId = newParty?.respondentDetails?.uniqueId || newParty?.witnessDetails?.uniqueId;

        const existingIndex = existingParties?.findIndex((p) => {
          const existingId = p?.respondentDetails?.uniqueId || p?.witnessDetails?.uniqueId;
          return existingId === newId;
        });

        if (existingIndex !== -1) {
          acc[existingIndex] = newParty;
        } else {
          acc?.push(newParty);
        }
        return acc;
      },
      [...(existingParties || [])]
    );
  } else {
    finalPartyDetails = updatedParties;
  }

  const taskManagementPayload = taskSearchData
    ? {
        ...(taskSearchData || {}),
        partyDetails: finalPartyDetails,
        workflow: {
          action: "UPDATE",
        },
      }
    : {
        filingNumber,
        tenantId,
        taskType,
        partyDetails: finalPartyDetails,
        courtId,
        orderNumber,
        orderItemId,
        workflow: {
          action: "CREATE",
        },
      };

  return taskManagementPayload;
};
