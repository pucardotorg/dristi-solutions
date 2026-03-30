const config = require("../config/config");
const axios = require("axios");
var url = require("url");
const { getUniqueAcronym } = require("../util/formatUtil");
const { htmlToFormattedText } = require("../util/htmlToFormattedText");

/**
 * Extracts document file store id from respective object.
 *
 * @param {Object} fileUploadDocuments - The object containing file store id.
 * @param {String} fileName - File Name to search for in the document.
 * @returns {String} A string object that refers to File Store Id.
 */
function getDocumentFileStore(fileUploadDocuments, fileName) {
  const documents = fileUploadDocuments?.document;
  if (Array.isArray(documents)) {
    const document = documents.find(
      (doc) =>
        doc?.fileName === fileName ||
        doc?.name === fileName ||
        doc?.additionalDetails?.fileName === fileName,
    );
    return document?.fileStore ?? null;
  } else if (documents && documents?.fileName) {
    return documents.fileName === fileName
      ? (documents?.fileStore ?? null)
      : null;
  }
  return null;
}

function getComplaintAdditionalDocumentFileStore(fileUploadDocuments) {
  if (!Array.isArray(fileUploadDocuments)) return [];

  return fileUploadDocuments
    .flatMap((doc) => doc?.document || [])
    .map((item) => item?.fileStore)
    .filter((fileStore) => fileStore);
}

function getStringAddressDetails(addressObject) {
  return `${addressObject?.locality || ""}, ${addressObject?.city || ""}, ${
    addressObject?.district || ""
  },  ${addressObject?.state || ""},  ${addressObject?.pincode || ""}`;
}

function formatDate(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

function convertDateToDDMMYYYY(dateString) {
  if (!dateString) return "";

  const [year, month, day] = dateString?.split("-");
  return `${day}-${month}-${year}`;
}

function convertToIndianCurrency(amount, locale, currency) {
  if (typeof amount !== "number" && typeof amount !== "string") return "";

  const number = Number(amount);
  if (isNaN(number)) return "";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(number)
    .toString();
}

/**
 * Extracts cheque information from the case object.
 *
 * @param {Object} cases - The cases object containing court case details.
 * @returns {Array} An array of cheque information objects.
 */
function getChequeDetails(cases) {
  if (
    !cases.caseDetails ||
    !cases.caseDetails.chequeDetails ||
    !cases.caseDetails.chequeDetails.formdata
  ) {
    return [];
  }
  const chequeDetailsList = cases.caseDetails.chequeDetails.formdata.map(
    (dataItem) => {
      const chequeDetailsData = dataItem.data || {};

      return {
        signatoryName: chequeDetailsData.chequeSignatoryName || null,
        bouncedChequeFileStore: getDocumentFileStore(
          chequeDetailsData.bouncedChequeFileUpload,
          "CS_BOUNCED_CHEQUE",
        ),
        nameOnCheque: chequeDetailsData.name || null,
        chequeNumber: chequeDetailsData.chequeNumber || null,
        dateOfIssuance: chequeDetailsData.issuanceDate || null,
        bankName: chequeDetailsData.bankName || null,
        ifscCode: chequeDetailsData.ifsc || null,
        chequeAmount: chequeDetailsData.chequeAmount || null,
        dateOfDeposit: chequeDetailsData.depositDate || null,
        depositChequeFileStore: getDocumentFileStore(
          chequeDetailsData.depositChequeFileUpload,
          "CS_PROOF_DEPOSIT_CHEQUE",
        ),
        returnMemoFileStore: getDocumentFileStore(
          chequeDetailsData.returnMemoFileUpload,
          "CS_CHEQUE_RETURN_MEMO",
        ),
        chequeAdditionalDetails:
          (chequeDetailsData.chequeAdditionalDetails &&
            chequeDetailsData.chequeAdditionalDetails.text) ||
          null,
      };
    },
  );

  return chequeDetailsList;
}

/**
 * Extracts debt liability information from the case object.
 *
 * @param {Object} cases - The cases object containing court case details.
 * @returns {Array} An array of debt liability information objects.
 */
function getDebtLiabilityDetails(cases) {
  if (
    !cases.caseDetails ||
    !cases.caseDetails.debtLiabilityDetails ||
    !cases.caseDetails.debtLiabilityDetails.formdata
  ) {
    return [];
  }
  const debtLiabilityDetailsList =
    cases.caseDetails.debtLiabilityDetails.formdata.map((dataItem) => {
      const debtLiabilityData = dataItem.data || {};

      return {
        natureOfDebt:
          (debtLiabilityData.liabilityNature &&
            debtLiabilityData.liabilityNature.name) ||
          null,
        totalAmountCoveredByCheque:
          debtLiabilityData.liabilityType &&
          debtLiabilityData.liabilityType.showAmountCovered
            ? debtLiabilityData.liabilityAmountCovered || null
            : null,
        proofOfLiabilityFileStore: getDocumentFileStore(
          debtLiabilityData.debtLiabilityFileUpload,
          "CS_PROOF_DEBT",
        ),
        additionalDetails:
          (debtLiabilityData.additionalDebtLiabilityDetails &&
            debtLiabilityData.additionalDebtLiabilityDetails.text) ||
          null,
      };
    });

  return debtLiabilityDetailsList;
}

/**
 * Extracts demand notice information from the case object.
 *
 * @param {Object} cases - The cases object containing court case details.
 * @returns {Array} An array of demand notice information objects.
 */
function getDemandNoticeDetails(cases) {
  if (
    !cases.caseDetails ||
    !cases.caseDetails.demandNoticeDetails ||
    !cases.caseDetails.demandNoticeDetails.formdata
  ) {
    return [];
  }
  const demandNoticeDetailsList =
    cases.caseDetails.demandNoticeDetails.formdata.map((dataItem) => {
      const demandNoticeData = dataItem.data || {};

      return {
        modeOfDispatch:
          (demandNoticeData.modeOfDispatchType &&
            demandNoticeData.modeOfDispatchType.modeOfDispatchType &&
            demandNoticeData.modeOfDispatchType.modeOfDispatchType.name) ||
          null,
        dateOfIssuance: demandNoticeData.dateOfIssuance || null,
        dateOfDispatch: demandNoticeData.dateOfDispatch || null,
        legalDemandNoticeFileStore: getDocumentFileStore(
          demandNoticeData.legalDemandNoticeFileUpload,
          "LEGAL_DEMAND_NOTICE",
        ),
        proofOfDispatchFileStore: getDocumentFileStore(
          demandNoticeData.proofOfDispatchFileUpload,
          "PROOF_OF_DISPATCH_FILE_NAME",
        ),
        proofOfService:
          (demandNoticeData.proofOfService &&
            demandNoticeData.proofOfService.code) ||
          null,
        dateOfDeemedService: demandNoticeData.dateOfService || null,
        dateOfAccrual: demandNoticeData.dateOfAccrual || null,
        proofOfAcknowledgmentFileStore: getDocumentFileStore(
          demandNoticeData.proofOfAcknowledgmentFileUpload,
          "PROOF_LEGAL_DEMAND_NOTICE_FILE_NAME",
        ),
        replyReceived:
          (demandNoticeData.proofOfReply &&
            demandNoticeData.proofOfReply.code) ||
          null,
        dateOfReply: demandNoticeData.dateOfReply || null,
        proofOfReplyFileStore: getDocumentFileStore(
          demandNoticeData.proofOfReplyFileUpload,
          "CS_PROOF_TO_REPLY_DEMAND_NOTICE_FILE_NAME",
        ),
      };
    });

  return demandNoticeDetailsList;
}

/**
 * Extracts delay condonation information from the case object.
 *
 * @param {Object} cases - The cases object containing court case details.
 * @returns {Array} An array of delay condonation information objects.
 */
function getDelayCondonationDetails(cases) {
  if (
    !cases.caseDetails ||
    !cases.caseDetails.delayApplications ||
    !cases.caseDetails.delayApplications.formdata
  ) {
    return [];
  }
  const delayCondonationDetailsList =
    cases.caseDetails.delayApplications.formdata.map((dataItem) => {
      const delayData = dataItem.data || {};

      return {
        reasonForDelay:
          (delayData.delayApplicationReason &&
            delayData.delayApplicationReason.reasonForDelay) ||
          null,
        proofOfReplyFileStore: getDocumentFileStore(
          delayData.legalDemandNoticeFileUpload,
          "CS_DELAY_CONDONATION_APPLICATION",
        ),
      };
    });

  return delayCondonationDetailsList;
}

/**
 * Extracts prayer and sworn statement information from the case object.
 *
 * @param {Object} cases - The cases object containing court case details.
 * @returns {Array} An array of prayer and sworn statement information objects.
 */
function getPrayerSwornStatementDetails(cases) {
  if (
    !cases.additionalDetails ||
    !cases.additionalDetails.prayerSwornStatement ||
    !cases.additionalDetails.prayerSwornStatement.formdata
  ) {
    return [];
  }
  const prayerSwornStatementDetailsList =
    cases.additionalDetails.prayerSwornStatement.formdata.map((dataItem) => {
      const swornStatementData = dataItem.data || {};

      return {
        prayerAndSwornStatementType:
          (swornStatementData.prayerAndSwornStatementType &&
            swornStatementData.prayerAndSwornStatementType.name) ||
          null,
        whetherComplainantWillingToSettle:
          (swornStatementData.infoBoxData &&
            swornStatementData.infoBoxData.data) ||
          null,
        circumstancesUnderWhichComplainantWillingToSettle:
          (swornStatementData.caseSettlementCondition &&
            swornStatementData.caseSettlementCondition.text) ||
          null,
        prayer:
          (swornStatementData.prayer && swornStatementData.prayer.text) || null,
        memorandumOfComplaintText:
          (swornStatementData.memorandumOfComplaint &&
            swornStatementData.memorandumOfComplaint.text) ||
          null,
        memorandumOfComplaintFileStore: getDocumentFileStore(
          swornStatementData.memorandumOfComplaint,
          "CS_MEMORANDUM_OF_COMPLAINT_HEADER",
        ),
        prayerForReliefText:
          (swornStatementData.prayerForRelief &&
            swornStatementData.prayerForRelief.text) ||
          null,
        prayerForReliefFileStore: getDocumentFileStore(
          swornStatementData.prayerForRelief,
          "CS_PRAYER_FOR_RELIEF_HEADER",
        ),
        swornStatement:
          getDocumentFileStore(
            swornStatementData.swornStatement,
            "CS_SWORN_STATEMENT_HEADER",
          ) || "",
        additionalDetails:
          (swornStatementData.additionalDetails &&
            swornStatementData.additionalDetails.text) ||
          null,
        additionalActsSectionsToChargeWith:
          (swornStatementData.additionalActsSections &&
            swornStatementData.additionalActsSections.text) ||
          null,
        complaintAdditionalDocumentFileStore:
          getComplaintAdditionalDocumentFileStore(
            swornStatementData?.SelectUploadDocWithName,
          ),
          synopsisText:
          (swornStatementData.synopsis && swornStatementData.synopsis.text) ||
          null,
      };
    });

  return prayerSwornStatementDetailsList;
}

function getComplainantsDetailsForComplaint(cases) {
  if (
    !cases?.additionalDetails ||
    !cases?.additionalDetails?.complainantDetails ||
    !cases?.additionalDetails?.complainantDetails?.formdata
  ) {
    return [];
  }
  return cases?.additionalDetails?.complainantDetails?.formdata?.map(
    (formData) => {
      const data = formData?.data;
      const complainantType = data?.complainantType || "";
      const firstName = data?.firstName || "";
      const middleName = data?.middleName || "";
      const lastName = data?.lastName || "";
      const phoneNumber =
        (data?.complainantVerification &&
          data?.complainantVerification?.mobileNumber) ||
        "";
      const allAdvocateDetails = getAdvocateDetailsForComplainant(cases);
      const currentAdvocateDetails = allAdvocateDetails?.find(
        (advocateDetails) =>
          advocateDetails?.individualId ===
          data?.complainantVerification?.individualDetails?.individualId,
      );

      if (complainantType.code === "REPRESENTATIVE") {
        const companyDetails = data.addressCompanyDetails || {};
        const companyAddress = getStringAddressDetails(companyDetails);

        return {
          ifIndividual: false,
          institutionName: data?.complainantCompanyName || "",
          complainantAddress: companyAddress || "",
          nameOfAuthorizedSignatory:
            [firstName, middleName, lastName].filter(Boolean).join(" ") || "",
          designationOfAuthorizedSignatory: data?.complainantDesignation || "",
          companyDetailsFileStore:
            getDocumentFileStore(
              data?.companyDetailsUpload,
              "Company documents",
            ) || "",
          advocateList: currentAdvocateDetails?.advocateList,
          isPartyInPerson: currentAdvocateDetails?.isPartyInPerson,
        };
      } else {
        const addressDetails =
          (data?.complainantVerification &&
            data?.complainantVerification?.individualDetails &&
            data?.complainantVerification?.individualDetails?.addressDetails) ||
          {};
        const address = getStringAddressDetails(addressDetails);

        return {
          ifIndividual: true,
          complainantName:
            [firstName, middleName, lastName].filter(Boolean).join(" ") || "",
          complainantAge: data?.complainantAge || "",
          complainantAddress: address || "",
          phoneNumber: phoneNumber || "",
          emailId: "",
          complainantIdProofFileStore:
            getDocumentFileStore(
              data?.complainantVerification?.individualDetails,
            ) || "",
          advocateList: currentAdvocateDetails?.advocateList,
          isPartyInPerson: currentAdvocateDetails?.isPartyInPerson,
        };
      }
    },
  );
}

function getAdvocateDetailsForComplainant(cases) {
  const isReassigned = cases?.status === "CASE_REASSIGNED";

  const buildPIP = (individualId, pipAffidavit) => ({
    isPartyInPerson: true,
    individualId,
    pipAffidavitFileStore:
      getDocumentFileStore(pipAffidavit, "UPLOAD_PIP_AFFIDAVIT") || "",
    advocateList: [],
  });

  const buildAdvocate = (individualId, vakalatnama, advocates = []) => ({
    isPartyInPerson: false,
    individualId,
    vakalatnamaFileStore:
      getDocumentFileStore(vakalatnama, "VAKALATNAMA") || "",
    advocateList: advocates,
  });

  if (isReassigned) {
    const formDataList =
      cases?.additionalDetails?.advocateDetails?.formdata || [];

    return formDataList
      .map(({ data }) => {
        const details = data?.multipleAdvocatesAndPip;

        if (details?.isComplainantPip?.code === "YES") {
          return buildPIP(
            details?.boxComplainant?.individualId,
            details?.pipAffidavitFileUpload,
          );
        }

        if (details?.isComplainantPip?.code === "NO") {
          const advocates =
            details?.multipleAdvocateNameDetails?.map((adv, index) => ({
              index,
              advocateName:
                adv?.advocateBarRegNumberWithName?.advocateName || "",
              barId:
                adv?.advocateBarRegNumberWithName
                  ?.barRegistrationNumberOriginal || "",
              advocatePhoneNumber:
                adv?.advocateNameDetails?.advocateMobileNumber || "",
            })) || [];

          return buildAdvocate(
            details?.boxComplainant?.individualId,
            details?.vakalatnamaFileUpload,
            advocates,
          );
        }

        return null;
      })
      .filter(Boolean);
  }

  const advocateBlocks = cases?.advocateDetailBlock || [];

  return advocateBlocks
    .map((data) => {
      if (data?.isComplainantPip?.code === "YES") {
        return buildPIP(data?.complainant?.individualId, {
          document: data?.documents?.pipAffidavit,
        });
      }

      if (data?.isComplainantPip?.code === "NO") {
        const advocates =
          data?.advocates?.map((adv, index) => ({
            index,
            advocateName: [adv?.firstName, adv?.middleName, adv?.lastName]
              .filter(Boolean)
              .join(" "),
            barId: adv?.barRegistrationNumber || "",
            advocatePhoneNumber: adv?.mobileNumber || "",
          })) || [];

        return buildAdvocate(
          data?.complainant?.individualId,
          { document: data?.documents?.vakalatnama },
          advocates,
        );
      }

      return null;
    })
    .filter(Boolean);
}

function getRespondentsDetailsForComplaint(cases) {
  if (
    !cases?.additionalDetails ||
    !cases?.additionalDetails?.respondentDetails ||
    !cases?.additionalDetails?.respondentDetails?.formdata
  ) {
    return [];
  }
  return cases.additionalDetails.respondentDetails.formdata?.map((formData) => {
    const data = formData?.data;
    const respondentType = data?.respondentType || "";
    const firstName = data?.respondentFirstName || "";
    const middleName = data?.respondentMiddleName || "";
    const lastName = data?.respondentLastName || "";
    const addresses = data?.addressDetails?.map((addressDetail) => {
      return getStringAddressDetails(addressDetail?.addressDetails);
    });
    if (respondentType.code === "REPRESENTATIVE") {
      return {
        ifAccusedIndividual: false,
        accusedInstitutionName: data?.respondentCompanyName || "",
        accusedAddress: (addresses && addresses?.join(", ")) || "",
        nameOfAccusedAuthorizedSignatory:
          [firstName, middleName, lastName].filter(Boolean).join(" ") || "",
        designationOfAccusedAuthorizedSignatory:
          data?.respondentDesignation || "",
        inquiryAffidavitFileStore:
          getDocumentFileStore(
            data?.inquiryAffidavitFileUpload,
            "Affidavit documents",
          ) || "",
        companyDetailsUpload:
          getDocumentFileStore(
            data?.companyDetailsUpload,
            "Company documents",
          ) || "",
      };
    } else {
      return {
        ifAccusedIndividual: true,
        accusedName:
          [firstName, middleName, lastName].filter(Boolean).join(" ") || "",
        accusedAge: data?.respondentAge || "",
        accusedAddress: (addresses && addresses?.join(", ")) || "",
        accusedPhoneNumber: data?.phonenumbers?.mobileNumber?.join(", ") || "",
        accusedEmailId: data?.emails?.emailId?.join(", ") || "",
        inquiryAffidavitFileStore:
          getDocumentFileStore(
            data?.inquiryAffidavitFileUpload,
            "Affidavit documents",
          ) || "",
      };
    }
  });
}

function getDocumentList(cases) {
  const newDocumentList = [];

  const chequeDetails = getChequeDetails(cases);
  const demandNoticeDetails = getDemandNoticeDetails(cases);

  const bounceCheque = generateBounceChequeDescriptions(chequeDetails);
  const returnMemo = generateChequeReturnMemoDescriptions(chequeDetails);
  const statutoryNotice = generateDemandNoticeDescriptions(demandNoticeDetails);
  const proofOfDispatch =
    generateProofDispatchDescriptions(demandNoticeDetails);
  const proofOfService = generateProofServiceDescriptions(demandNoticeDetails);
  const affidavitInLieuComplaint = [
    "Digital record of proof of Affidavit under section 223 of BNSS",
  ];
  const proofOfReply = generateProofReplyDescriptions(demandNoticeDetails);
  const proofOfDeposit = generateProofDepositDescriptions(chequeDetails);
  const optionalDocs = generateOptionalDocDescriptions(cases.documents);

  newDocumentList.push(
    ...bounceCheque,
    ...returnMemo,
    ...statutoryNotice,
    ...proofOfDispatch,
    ...proofOfService,
    ...affidavitInLieuComplaint,
    ...proofOfReply,
    ...proofOfDeposit,
    ...optionalDocs,
  );
  return newDocumentList;
}

function generateBounceChequeDescriptions(chequeDetailsList) {
  return chequeDetailsList.map((chequeDetails) => {
    const chequeNumber = chequeDetails.chequeNumber || "";
    const dateOfIssuance = convertDateToDDMMYYYY(chequeDetails.dateOfIssuance);
    const chequeAmount =
      convertToIndianCurrency(chequeDetails.chequeAmount, "en-IN", "INR") || "";
    return `Digital record of cheque no. ${chequeNumber} dated ${dateOfIssuance} for ${chequeAmount}`;
  });
}

function generateChequeReturnMemoDescriptions(chequeDetailsList) {
  return chequeDetailsList.map((chequeDetails) => {
    const dateOfDishonorCheque = convertDateToDDMMYYYY(
      chequeDetails.dateOfDeposit,
    );
    return `Digital record of cheque return memo dated ${dateOfDishonorCheque}.`;
  });
}

function generateDemandNoticeDescriptions(demandNoticeList) {
  return demandNoticeList.map((demandNotice) => {
    const dateOfIssuance = convertDateToDDMMYYYY(demandNotice.dateOfIssuance);
    if (dateOfIssuance) {
      return `Digital record of the statutory notice dated ${dateOfIssuance}.`;
    } else {
      return `Digital record of the statutory notice.`;
    }
  });
}

function generateProofDispatchDescriptions(demandNoticeList) {
  return demandNoticeList.map((demandNotice) => {
    const dateOfDispatch = convertDateToDDMMYYYY(demandNotice.dateOfDispatch);
    return `Digital record of proof of dispatch dated ${dateOfDispatch}.`;
  });
}

function generateProofServiceDescriptions(demandNoticeList) {
  return demandNoticeList
    .filter((demandNotice) => demandNotice.proofOfAcknowledgmentFileStore)
    .map((demandNotice) => {
      const dateOfDeemedService = convertDateToDDMMYYYY(
        demandNotice.dateOfDeemedService,
      );
      return `Digital record of proof of service- ${dateOfDeemedService}.`;
    });
}

function generateProofReplyDescriptions(demandNoticeList) {
  return demandNoticeList
    .filter((demandNotice) => demandNotice.proofOfReplyFileStore)
    .map((demandNotice) => {
      const dateOfReply = convertDateToDDMMYYYY(demandNotice.dateOfReply);
      return `Digital record of proof of reply dated ${dateOfReply}.`;
    });
}

function generateProofDepositDescriptions(chequeDetailsList) {
  return chequeDetailsList
    .filter((chequeDetails) => chequeDetails.depositChequeFileStore)
    .map((chequeDetails) => {
      const dateOfDeposit = convertDateToDDMMYYYY(chequeDetails.dateOfDeposit);
      return `Digital record of proof of deposit dated ${dateOfDeposit}.`;
    });
}

function generateOptionalDocDescriptions(documentList) {
  if (!documentList) {
    return [];
  }
  return documentList
    .map((document) => {
      switch (document.documentType) {
        case "AUTHORIZED_COMPLAINANT_COMPANY_REPRESENTATIVE":
          return `Digital record of proof of authorized representative of the company in complainant`;
        case "case.affidavit.225bnss":
          return `Digital record of Affidavit in-lieu-of inquiry under section 225, Bharatiya Nagarik Suraksha Sanhita, 2024`;
        case "AUTHORIZED_ACCUSED_COMPANY_REPRESENTATIVE":
          return `Digital record of proof of authorized representative of the company in accused`;
        case "case.liabilityproof":
          return `Digital record of proof of Debt/Liability`;
        case "CONDONATION_DOC":
          return `Digital record of proof of Delay Condonation`;
        case "case.docs":
          return `Digital record of proof of Complaint Additional Documents`;
        case "VAKALATNAMA_DOC":
          return `Digital record of proof of Advocate Vakalatnama`;
        case "COMPLAINANT_PIP_AFFIDAVIT":
          return `Digital record of proof of Pip Affidavit`;
        default:
          return null;
      }
    })
    .filter(Boolean);
}

function getWitnessDetailsForComplaint(cases) {
  if (
    !cases?.additionalDetails ||
    !cases?.additionalDetails?.witnessDetails ||
    !cases?.additionalDetails?.witnessDetails?.formdata
  ) {
    return [];
  }
  return cases?.additionalDetails?.witnessDetails?.formdata?.map((formData) => {
    const data = formData?.data;
    const addresses = data?.addressDetails?.map((addressDetail) => {
      return getStringAddressDetails(addressDetail?.addressDetails);
    });
    const firstName = data?.firstName || "";
    const middleName = data?.middleName || "";
    const lastName = data?.lastName || "";

    return {
      witnessName:
        [firstName, middleName, lastName].filter(Boolean).join(" ") || "",
      witnessOccupation: data?.witnessDesignation,
      witnessPhoneNumber: data?.phonenumbers?.mobileNumber?.join(", ") || "",
      witnessEmail: data?.emails?.emailId?.join(", ") || "",
      witnessAddress: addresses?.join(", ") || "",
      witnessAdditionalDetails: htmlToFormattedText(
        data?.witnessAdditionalDetails?.text || "",
      ),
    };
  });
}

async function searchCase(caseId, tenantId, requestinfo) {
  try {
    return await axios({
      method: "post",
      url: url.resolve(config.caseUrl, config.caseSearchUrl),
      data: {
        RequestInfo: requestinfo,
        tenantId: tenantId,
        criteria: [
          {
            caseId: caseId,
          },
        ],
      },
    });
  } catch (error) {
    throw error;
  }
}

function getComplainantPlaceholderList(caseDetails) {
  const poaHolders = caseDetails?.poaHolders?.map((poaHolder) => {
    const representingWithLitigant = poaHolder?.representingLitigants.map(
      (rep) => {
        return {
          ...caseDetails?.litigants?.find(
            (lit) => rep?.individualId === lit?.individualId,
          ),
          ...rep,
        };
      },
    );
    return {
      ...poaHolder,
      representingLitigants: representingWithLitigant,
    };
  });

  const litigants = caseDetails?.litigants
    ?.filter((litigant) => litigant.partyType.includes("complainant"))
    ?.map((litigant) => ({
      ...litigant,
      poaHolder: poaHolders?.find((poaHolder) =>
        poaHolder?.representingLitigants?.some(
          (complainant) => complainant?.individualId === litigant?.individualId,
        ),
      ),
    }));

  const placeholderArray = [];
  const processedLitigantIds = new Set();

  litigants?.forEach((litigant) => {
    if (processedLitigantIds.has(litigant?.individualId)) {
      placeholderArray.push({
        index: litigant?.additionalDetails?.currentPosition,
        placeholder: "",
        acronym: "",
      });
      return;
    }

    let placeholder = "";

    if (litigant?.poaHolder) {
      const representedNames = litigant?.poaHolder?.representingLitigants
        ?.map((rep) => rep?.additionalDetails?.fullName)
        ?.filter(Boolean)
        ?.join(", ");
      placeholder = `${litigant?.poaHolder?.name} - PoA holder for ${representedNames}`;
      litigant?.poaHolder?.representingLitigants?.forEach((rep) => {
        processedLitigantIds.add(rep?.individualId);
      });
    } else {
      const complainantPoaHolder = poaHolders?.find(
        (poa) => poa?.individualId === litigant?.individualId,
      );
      if (complainantPoaHolder) {
        const representedNames = complainantPoaHolder?.representingLitigants
          ?.map((rep) => rep?.additionalDetails?.fullName)
          ?.filter(Boolean)
          ?.join(", ");
        placeholder = `${litigant?.additionalDetails?.fullName} - Complainant ${litigant?.additionalDetails?.currentPosition}, PoA holder for ${representedNames}`;
        complainantPoaHolder?.representingLitigants?.forEach((rep) => {
          processedLitigantIds.add(rep?.individualId);
        });
      } else {
        placeholder = `${litigant?.additionalDetails?.fullName} - Complainant ${litigant?.additionalDetails?.currentPosition}`;
        processedLitigantIds.add(litigant?.individualId);
      }
    }

    placeholderArray.push({
      index: litigant?.additionalDetails?.currentPosition,
      acronym: getUniqueAcronym(placeholder),
      placeholder: placeholder,
    });
  });
  return placeholderArray.sort((a, b) => a.index - b.index);
}

module.exports = {
  formatDate,
  getChequeDetails,
  getDebtLiabilityDetails,
  getDemandNoticeDetails,
  getDelayCondonationDetails,
  getPrayerSwornStatementDetails,
  getComplainantsDetailsForComplaint,
  getAdvocateDetailsForComplainant,
  getRespondentsDetailsForComplaint,
  getDocumentList,
  generateBounceChequeDescriptions,
  generateChequeReturnMemoDescriptions,
  generateDemandNoticeDescriptions,
  generateProofDispatchDescriptions,
  generateProofServiceDescriptions,
  generateProofReplyDescriptions,
  generateProofDepositDescriptions,
  generateOptionalDocDescriptions,
  getWitnessDetailsForComplaint,
  searchCase,
  getComplainantPlaceholderList,
};
