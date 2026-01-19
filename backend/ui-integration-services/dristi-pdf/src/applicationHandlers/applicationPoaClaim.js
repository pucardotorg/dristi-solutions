const cheerio = require("cheerio");
const config = require("../config");
const {
  search_sunbirdrc_credential_service,
  create_pdf,
  search_individual,
} = require("../api");
const { renderError } = require("../utils/renderError");
const { formatDate } = require("./formatDate");

const getPoaClaimList = (individualDetails = [], poaIndividualId) => {
  return individualDetails?.filter(
    (item) => item?.individualId !== poaIndividualId
  );
};

const getPoaRevokeList = (individualDetails = [], poaIndividualId) => {
  return individualDetails?.filter(
    (item) =>
      item?.individualId === poaIndividualId || item?.isRevoking === true
  );
};

async function applicationPoaClaim(
  req,
  res,
  qrCode,
  application,
  courtCaseJudgeDetails
) {
  const cnrNumber = req.query.cnrNumber;
  const applicationNumber = req.query.applicationNumber;
  const tenantId = req.query.tenantId;
  const entityId = req.query.entityId;
  const code = req.query.code;
  const requestInfo = req.body.RequestInfo;

  const missingFields = [];
  if (!cnrNumber) missingFields.push("cnrNumber");
  if (!applicationNumber) missingFields.push("applicationNumber");
  if (!tenantId) missingFields.push("tenantId");
  if (requestInfo === undefined) missingFields.push("requestInfo");
  if (qrCode === "true" && (!entityId || !code))
    missingFields.push("entityId and code");

  if (missingFields.length > 0) {
    return renderError(
      res,
      `${missingFields.join(", ")} are mandatory to generate the PDF`,
      400
    );
  }

  // Function to handle API calls
  const handleApiCall = async (apiCall, errorMessage) => {
    try {
      return await apiCall();
    } catch (ex) {
      renderError(res, `${errorMessage}`, 500, ex);
      throw ex; // Ensure the function stops on error
    }
  };

  try {
    const mdmsCourtRoom = courtCaseJudgeDetails.mdmsCourtRoom;
    const partyName = application?.additionalDetails?.onBehalOfName || "";

    // Handle QR code if enabled
    let base64Url = "";
    if (qrCode === "true") {
      const resCredential = await handleApiCall(
        () =>
          search_sunbirdrc_credential_service(
            tenantId,
            code,
            entityId,
            requestInfo
          ),
        "Failed to query sunbirdrc credential service"
      );
      const $ = cheerio.load(resCredential.data);
      const imgTag = $("img");
      if (imgTag.length === 0) {
        return renderError(
          res,
          "No img tag found in the sunbirdrc response",
          500
        );
      }
      base64Url = imgTag.attr("src");
    }

    const currentDate = new Date();
    const formattedToday = formatDate(currentDate, "DD-MM-YYYY");

    const additionalComments =
      application?.additionalDetails?.formdata?.comments?.text || "";
    const prayer = application?.additionalDetails?.formdata?.prayer?.text || "";
    const taskDetails = application?.applicationDetails?.taskDetails;
    const poaIndividualId =
      application?.applicationDetails?.taskDetails?.poaDetails?.individualId;
    const poaCliamList = getPoaClaimList(
      taskDetails?.individualDetails,
      poaIndividualId
    );
    const poaRevokeList = getPoaRevokeList(
      taskDetails?.individualDetails,
      poaIndividualId
    );
    const partyType =
      application?.additionalDetails?.partyType === "COMPLAINANTS"
        ? "Complainant"
        : "Accused";

    let poaClaimLitigant = [];
    if (poaCliamList && poaCliamList?.length > 0) {
      poaClaimLitigant = await Promise.all(
        poaCliamList.map(async (litigant, index) => {
          const individualResponse = await handleApiCall(
            () => search_individual(tenantId, litigant?.individualId, req.body),
            "Failed to search Individual"
          );

          const individualRes = individualResponse?.data?.Individual[0];
          if (!individualRes) {
            return renderError(res, "individual not found", 404);
          }

          const partyName = [
            individualRes.name.givenName,
            individualRes.name.otherNames,
            individualRes.name.familyName,
          ]
            .filter(Boolean)
            .join(" ");

          return {
            index: index + 1,
            name: partyName,
            designation: partyType,
          };
        })
      );
    }

    let poaRevokeLitigant = [];
    if (poaRevokeList && poaRevokeList?.length > 0) {
      poaRevokeLitigant = await Promise.all(
        poaRevokeList.map(async (litigant, index) => {
          const individualResponse = await handleApiCall(
            () => search_individual(tenantId, litigant?.individualId, req.body),
            "Failed to search Individual"
          );

          const individualRes = individualResponse?.data?.Individual[0];
          if (!individualRes) {
            return renderError(res, "individual not found", 404);
          }

          const partyName = [
            individualRes.name.givenName,
            individualRes.name.otherNames,
            individualRes.name.familyName,
          ]
            .filter(Boolean)
            .join(" ");

          return {
            index: index + 1,
            name: partyName,
            designation: partyType,
          };
        })
      );
    }

    const data = {
      Data: [
        {
          courtComplex: mdmsCourtRoom.name,
          caseType: "Negotiable Instruments Act 138 A",
          caseNumber: application?.additionalDetails?.caseNumber || "",
          caseName: application?.additionalDetails?.caseTitle || "",
          date: formattedToday,
          partyName: partyName,
          prayer,
          additionalComments,
          signPlaceHolder: "Signature",
          litigants: poaClaimLitigant,
          revokePOAlitigants: poaRevokeLitigant,
          appointementOfPOA: poaCliamList?.length > 0 ? true : false,
          revokeOfPOA: poaRevokeList?.length > 0 ? true : false,
          qrCodeUrl: base64Url,
        },
      ],
    };

    // Generate the PDF
    const pdfKey =
      qrCode === "true" ? config.pdf.poa_claim_qr : config.pdf.poa_claim;
    const pdfResponse = await handleApiCall(
      () => create_pdf(tenantId, pdfKey, data, req.body),
      "Failed to generate PDF of Generic Application"
    );
    const filename = `${pdfKey}_${new Date().getTime()}`;
    res.writeHead(200, {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=${filename}.pdf`,
    });
    pdfResponse.data
      .pipe(res)
      .on("finish", () => {
        res.end();
      })
      .on("error", (err) => {
        return renderError(res, "Failed to send PDF response", 500, err);
      });
  } catch (ex) {
    return renderError(
      res,
      "Failed to query details of Generic Application",
      500,
      ex
    );
  }
}

module.exports = applicationPoaClaim;
