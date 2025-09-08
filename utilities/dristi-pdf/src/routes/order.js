const express = require("express");
const router = express.Router();
const asyncMiddleware = require("../utils/asyncMiddleware");
const { search_order } = require("../api");
const { renderError } = require("../utils/renderError");
const { handleApiCall } = require("../utils/handleApiCall");
const {
  applicationStatusType,
  OrderPreviewOrderTypeMap,
  orderPDFMap,
  processOrder,
  handleCompositePDF,
} = require("../utils/orderUtils");

const { getCourtAndJudgeDetails } = require("../utils/commonUtils");
const { logger } = require("../logger");

router.post(
  "",
  asyncMiddleware(async function (req, res, next) {
    let qrCode = req.query.qrCode;
    const tenantId = req.query.tenantId;
    const requestInfo = req.body.RequestInfo;
    const orderId = req.query.orderId;
    const courtId = req.query.courtId;
    const orderPreviewKey = req.query.orderPreviewKey;

    // Set qrCode to false if it is undefined, null, or empty
    if (!qrCode) {
      qrCode = "false";
    } else {
      // Convert qrCode to lowercase
      qrCode = qrCode.toString().toLowerCase();
    }

    if (!orderId) {
      return renderError(res, "Order Id is mandatory to generate the PDF", 400);
    }

    try {
      const resOrder = await handleApiCall(
        res,
        () => search_order(tenantId, orderId, requestInfo, courtId),
        "Failed to query order service"
      );
      let order = resOrder?.data?.list[0];

      const courtCaseJudgeDetails = await getCourtAndJudgeDetails(
        res,
        tenantId,
        "Judge",
        courtId || order?.courtId,
        requestInfo
      );

      if (orderPreviewKey) {
        await processOrder(
          req,
          res,
          qrCode,
          order,
          orderPreviewKey,
          courtCaseJudgeDetails
        );
      } else {
        if (order?.orderCategory === "COMPOSITE") {
          await handleCompositePDF(
            req,
            res,
            qrCode,
            order,
            courtCaseJudgeDetails
          );
        } else {
          const applicationStatus = applicationStatusType(
            order?.additionalDetails?.applicationStatus
          );
          const orderType = order?.orderType;
          logger.info("orderType", orderType);
          const orderPreviewKey =
            OrderPreviewOrderTypeMap[
              orderPDFMap?.[orderType]?.[applicationStatus] || orderType
            ];
          logger.info("orderPreviewKey", orderPreviewKey);
          await processOrder(
            req,
            res,
            qrCode,
            order,
            orderPreviewKey,
            courtCaseJudgeDetails
          );
        }
      }
    } catch (error) {
      renderError(
        res,
        "An error occurred while processing the request",
        500,
        error
      );
    }
  })
);

module.exports = router;
