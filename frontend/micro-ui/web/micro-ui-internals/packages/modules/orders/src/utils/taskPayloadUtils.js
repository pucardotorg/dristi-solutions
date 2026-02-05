export const createTaskPayload = async (
  orderType,
  orderDetails,
  {
    caseDetails,
    courtRoomData,
    judgeName,
    tenantId,
    channelTypeEnum,
    getCourtFee,
    getFormData,
    getOrderData,
    getComplainantName,
    getRespondantName,
    _getTaskPayload,
  }
) => {
  let payload = {};
  const { litigants } = caseDetails;
  const complainantIndividualId = litigants?.find((item) => item?.partyType === "complainant.primary")?.individualId;

  const orderData = orderDetails?.order;
  const orderFormData = getFormData(orderType, orderData);
  const orderFormValue = orderDetails?.order?.additionalDetails?.formdata;
  const respondentNameData = getOrderData(orderType, orderFormData);
  const formDataKeyMap = {
    NOTICE: "noticeOrder",
    SUMMONS: "SummonsOrder",
    WARRANT: "warrantFor",
    PROCLAMATION: "proclamationFor",
    ATTACHMENT: "attachmentFor",
  };

  const selectedChannel = orderData?.additionalDetails?.formdata?.[formDataKeyMap[orderType]]?.selectedChannels;
  const noticeType = orderData?.additionalDetails?.formdata?.noticeType?.type;
  const respondentAddress = orderFormData?.addressDetails
    ? orderFormData?.addressDetails?.map((data) => ({ ...data?.addressDetails }))
    : respondentNameData?.address
    ? respondentNameData?.address
    : caseDetails?.additionalDetails?.respondentDetails?.formdata?.[0]?.data?.addressDetails?.map((data) => data?.addressDetails);
  const partyIndex = orderFormData?.party?.data?.partyIndex || "";
  const result = getRespondantName(respondentNameData);
  const respondentName = result?.name || result;
  const respondentPhoneNo = orderFormData?.party?.data?.phone_numbers || [];
  const respondentEmail = orderFormData?.party?.data?.email || [];
  const respondentUniqueId = orderFormData?.party?.data?.uniqueId || orderFormData?.party?.uniqueId || "";
  const complainantDetails = caseDetails?.additionalDetails?.complainantDetails?.formdata?.find(
    (d) => d?.data?.complainantVerification?.individualDetails?.individualId === complainantIndividualId
  )?.data;

  const state = complainantDetails?.addressDetails?.state || "";
  const district = complainantDetails?.addressDetails?.district || "";
  const city = complainantDetails?.addressDetails?.city || "";
  const pincode = complainantDetails?.addressDetails?.pincode || "";
  const latitude = complainantDetails?.addressDetails?.pincode?.latitude || "";
  const longitude = complainantDetails?.addressDetails?.pincode?.longitude || "";
  const complainantName = getComplainantName(complainantDetails);
  const locality = complainantDetails?.addressDetails?.locality || "";
  const complainantAddress = {
    pincode,
    district,
    city,
    state,
    coordinate: { longitude, latitude },
    locality,
  };

  const courtDetails = courtRoomData?.Court_Rooms?.find((data) => data?.code === caseDetails?.courtId);
  const ownerType = orderFormData?.party?.data?.ownerType;

  const respondentDetails = {
    name: respondentName,
    address: { ...respondentAddress?.[0], coordinate: respondentAddress?.[0]?.coordinates },
    phone: respondentPhoneNo[0] || "",
    email: respondentEmail[0] || "",
    age: "",
    gender: "",
    uniqueId: respondentUniqueId,
    ...(ownerType && { ownerType }),
  };

  const caseRespondent = {
    name: caseDetails?.additionalDetails?.respondentDetails?.formdata?.[0]?.data?.respondentFirstName || "",
    address: caseDetails?.additionalDetails?.respondentDetails?.formdata?.[0]?.data?.addressDetails?.[0]?.addressDetails,
    phone: caseDetails?.additionalDetails?.respondentDetails?.formdata?.[0]?.data?.phonenumbers?.mobileNumber?.[0] || "",
    email: caseDetails?.additionalDetails?.respondentDetails?.formdata?.[0]?.data?.emails?.emailId?.[0] || "",
    age: caseDetails?.additionalDetails?.respondentDetails?.formdata?.[0]?.data?.respondentAge,
    gender: "",
  };

  switch (orderType) {
    case "SUMMONS":
      payload = {
        summonDetails: {
          issueDate: orderData?.auditDetails?.lastModifiedTime,
          caseFilingDate: caseDetails?.filingDate,
          docSubType: orderFormData?.party?.data?.partyType === "Witness" ? "WITNESS" : "ACCUSED",
        },
        respondentDetails: orderFormData?.party?.data?.partyType === "Witness" ? caseRespondent : respondentDetails,
        ...(orderFormData?.party?.data?.partyType === "Witness" && { witnessDetails: respondentDetails }),
        complainantDetails: {
          name: complainantName,
          address: complainantAddress,
        },
        caseDetails: {
          caseTitle: caseDetails?.caseTitle,
          year: new Date(caseDetails).getFullYear(),
          hearingDate: new Date(orderData?.additionalDetails?.formdata?.dateForHearing || "").getTime(),
          courtName: courtDetails?.name,
          courtAddress: courtDetails?.address,
          courtPhone: courtDetails?.phone,
          courtId: caseDetails?.courtId,
          hearingNumber: orderData?.hearingNumber,
          judgeName,
        },
        deliveryChannels: {
          channelName: "",
          status: "",
          statusChangeDate: "",
          fees: 0,
          feesStatus: "pending",
        },
      };
      break;

    case "NOTICE":
      payload = {
        noticeDetails: {
          issueDate: orderData?.auditDetails?.lastModifiedTime,
          caseFilingDate: caseDetails?.filingDate,
          noticeType,
          docSubType: orderFormData?.party?.data?.partyType === "Witness" ? "WITNESS" : "ACCUSED",
          partyIndex,
        },
        respondentDetails: orderFormData?.party?.data?.partyType === "Witness" ? caseRespondent : respondentDetails,
        ...(orderFormData?.party?.data?.partyType === "Witness" && { witnessDetails: respondentDetails }),
        complainantDetails: {
          name: complainantName,
          address: complainantAddress,
        },
        caseDetails: {
          caseTitle: caseDetails?.caseTitle,
          year: new Date(caseDetails).getFullYear(),
          hearingDate: new Date(orderData?.additionalDetails?.formdata?.dateForHearing || "").getTime(),
          courtName: courtDetails?.name,
          courtAddress: courtDetails?.address,
          courtPhone: courtDetails?.phone,
          courtId: caseDetails?.courtId,
          hearingNumber: orderData?.hearingNumber,
          judgeName,
        },
        deliveryChannels: {
          channelName: "",
          status: "",
          statusChangeDate: "",
          fees: 0,
          feesStatus: "pending",
        },
      };
      break;

    case "WARRANT":
      payload = {
        warrantDetails: {
          issueDate: orderData?.auditDetails?.lastModifiedTime,
          caseFilingDate: caseDetails?.filingDate,
          docType: orderFormValue.warrantType?.code,
          docSubType: orderFormValue.bailInfo?.isBailable?.code ? "BAILABLE" : "NON_BAILABLE",
          surety: orderFormValue.bailInfo?.noOfSureties?.code,
          bailableAmount: orderFormValue.bailInfo?.bailableAmount,
          templateType: orderFormValue?.warrantSubType?.templateType || "GENERIC",
          warrantText: orderFormValue?.warrantText?.warrantText || "",
        },
        ...(orderFormData?.party?.data?.partyType === "Witness" && { witnessDetails: respondentDetails }),
        respondentDetails,
        caseDetails: {
          caseTitle: caseDetails?.caseTitle,
          year: new Date(caseDetails).getFullYear(),
          hearingDate: new Date(orderData?.additionalDetails?.formdata?.dateOfHearing || "").getTime(),
          judgeName,
          courtName: courtDetails?.name,
          courtAddress: courtDetails?.address,
          courtPhone: courtDetails?.phone,
          courtId: caseDetails?.courtId,
        },
        deliveryChannels: {
          channelName: "Police",
          name: "",
          address: "",
          phone: "",
          email: "",
          status: "",
          statusChangeDate: "",
          fees: await getCourtFee(
            "POLICE",
            respondentAddress?.[0]?.pincode,
            orderType === "WARRANT" || orderType === "PROCLAMATION" || orderType === "ATTACHMENT" ? "WARRANT" : orderType,
            tenantId
          ),
          feesStatus: "",
        },
      };
      break;

    case "PROCLAMATION":
      payload = {
        proclamationDetails: {
          issueDate: orderData?.auditDetails?.lastModifiedTime,
          caseFilingDate: caseDetails?.filingDate,
          docSubType: "Proclamation requiring the apperance of a person accused",
          templateType: "GENERIC",
          proclamationText: orderFormValue?.proclamationText?.proclamationText || "",
          partyType: respondentNameData?.partyType?.toLowerCase() || "accused",
        },
        ...(orderFormData?.party?.data?.partyType === "Witness" && { witnessDetails: respondentDetails }),
        respondentDetails,
        caseDetails: {
          caseTitle: caseDetails?.caseTitle,
          year: new Date(caseDetails).getFullYear(),
          hearingDate: new Date(orderData?.additionalDetails?.formdata?.dateOfHearing || "").getTime(),
          judgeName,
          courtName: courtDetails?.name,
          courtAddress: courtDetails?.address,
          courtPhone: courtDetails?.phone,
          courtId: caseDetails?.courtId,
        },
        deliveryChannels: {
          channelName: "Police",
          name: "",
          address: "",
          phone: "",
          email: "",
          status: "",
          statusChangeDate: "",
          fees: await getCourtFee(
            "POLICE",
            respondentAddress?.[0]?.pincode,
            orderType === "WARRANT" || orderType === "PROCLAMATION" ? "WARRANT" : orderType,
            tenantId
          ),
          feesStatus: "",
        },
      };
      break;

    case "ATTACHMENT":
      payload = {
        attachmentDetails: {
          issueDate: orderData?.auditDetails?.lastModifiedTime,
          caseFilingDate: caseDetails?.filingDate,
          docSubType: "Attachment requiring the apperance of a person accused",
          templateType: "GENERIC",
          attachmentText: orderFormValue?.attachmentText?.attachmentText || "",
          district: orderFormValue?.district?.district || "",
          village: orderFormValue?.village?.village || "",
          chargeDays: orderFormValue?.chargeDays?.chargeDays || "",
          partyType: respondentNameData?.partyType?.toLowerCase() || "accused",
        },
        ...(orderFormData?.party?.data?.partyType === "Witness" && { witnessDetails: respondentDetails }),
        respondentDetails,
        caseDetails: {
          caseTitle: caseDetails?.caseTitle,
          year: new Date(caseDetails).getFullYear(),
          hearingDate: new Date(orderData?.additionalDetails?.formdata?.dateOfHearing || "").getTime(),
          judgeName,
          courtName: courtDetails?.name,
          courtAddress: courtDetails?.address,
          courtPhone: courtDetails?.phone,
          courtId: caseDetails?.courtId,
        },
        deliveryChannels: {
          channelName: "Police",
          name: "",
          address: "",
          phone: "",
          email: "",
          status: "",
          statusChangeDate: "",
          fees: await getCourtFee(
            "POLICE",
            respondentAddress?.[0]?.pincode,
            orderType === "WARRANT" || orderType === "PROCLAMATION" || orderType === "ATTACHMENT" ? "WARRANT" : orderType,
            tenantId
          ),
          feesStatus: "",
        },
      };
      break;

    case "BAIL":
      payload = {
        respondentDetails: {
          name: respondentName,
          address: respondentAddress?.[0],
          phone: respondentPhoneNo?.[0] || "",
          email: respondentEmail?.[0] || "",
          age: "",
          gender: "",
        },
        caseDetails: {
          title: caseDetails?.caseTitle,
          year: new Date(caseDetails).getFullYear(),
          hearingDate: new Date(orderData?.additionalDetails?.formdata?.date || "").getTime(),
          judgeName: "",
          courtName: courtDetails?.name,
          courtAddress: courtDetails?.address,
          courtPhone: courtDetails?.phone,
          courtId: caseDetails?.courtId,
        },
      };
      break;

    case "MISCELLANEOUS_PROCESS":
      const hearingDate = new Date(orderData?.additionalDetails?.formdata?.dateOfHearing || "").getTime();
      const taskCaseDetails = {
        title: caseDetails?.caseTitle,
        year: new Date(caseDetails).getFullYear(),
        hearingDate,
        judgeName: "",
        courtName: courtDetails?.name,
        courtAddress: courtDetails?.address,
        courtPhone: courtDetails?.phone,
        courtId: caseDetails?.courtId,
      };
      const caseNumber = caseDetails?.courtCaseNumber || caseDetails?.cmpNumber || caseDetails?.filingNumber;
      payload = await _getTaskPayload(taskCaseDetails, orderData, caseDetails?.filingDate, hearingDate, caseNumber);
      break;

    default:
      break;
  }

  if (orderType === "MISCELLANEOUS_PROCESS") return payload;
  if (Object.keys(payload || {}).length > 0 && !Array.isArray(selectedChannel)) return [payload];
  else if (Object.keys(payload || {}).length > 0 && Array.isArray(selectedChannel)) {
    const channelPayloads = await Promise.all(
      selectedChannel?.map(async (item) => {
        let clonedPayload = JSON.parse(JSON.stringify(payload));

        const pincode = ["e-Post", "Registered Post", "Via Police"].includes(item?.type)
          ? item?.value?.pincode
          : clonedPayload?.respondentDetails?.address?.pincode;

        let courtFees = await getCourtFee(
          item?.code,
          pincode,
          orderType === "WARRANT" || orderType === "PROCLAMATION" || orderType === "ATTACHMENT" ? "WARRANT" : orderType,
          tenantId
        );

        if ("deliveryChannels" in clonedPayload) {
          clonedPayload.deliveryChannels = {
            ...clonedPayload.deliveryChannels,
            channelName: channelTypeEnum?.[item?.type]?.type,
            fees: courtFees,
            channelCode: channelTypeEnum?.[item?.type]?.code,
            isPendingCollection: channelTypeEnum?.[item?.type]?.code === "RPAD" ? true : false,
          };

          let address = {};
          if (orderType === "WARRANT" || orderType === "PROCLAMATION" || orderType === "ATTACHMENT" || item?.type === "Via Police") {
            address = {
              ...item?.value,
              locality: item?.value?.locality || "",
              coordinate: {
                longitude: item?.value?.geoLocationDetails?.longitude,
                latitude: item?.value?.geoLocationDetails?.latitude,
              },
            };
          } else if (["e-Post", "Registered Post"].includes(item?.type)) {
            const baseAddress = item?.value || {};
            address = {
              ...baseAddress,
              locality: item?.value?.locality || baseAddress?.locality || "",
              coordinate: item?.value?.coordinates || baseAddress?.coordinates || {},
            };
          } else {
            const baseAddress = respondentAddress[0] || {};
            address = {
              ...baseAddress,
              coordinate: baseAddress?.coordinates || {},
            };
          }

          const phone = item?.type === "SMS" ? item?.value : respondentPhoneNo?.[0] || "";
          const email = item?.type === "E-mail" ? item?.value : respondentEmail?.[0] || "";
          const commonDetails = { address, phone, email, age: "", gender: "" };

          clonedPayload.respondentDetails = {
            ...clonedPayload.respondentDetails,
            ...commonDetails,
          };

          if (clonedPayload?.witnessDetails) {
            clonedPayload.witnessDetails = {
              ...clonedPayload.witnessDetails,
              ...commonDetails,
            };
          }
        }

        return clonedPayload;
      })
    );
    return channelPayloads;
  }
};
