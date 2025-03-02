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

router.post(
  "",
  asyncMiddleware(async function (req, res, next) {
    let qrCode = req.query.qrCode;
    const tenantId = req.query.tenantId;
    const requestInfo = req.body.RequestInfo;
    const orderId = req.query.orderId;

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
        () => search_order(tenantId, orderId, requestInfo),
        "Failed to query order service"
      );
      let order = resOrder?.data?.list[0];

      if (order?.orderCategory === "COMPOSITE") {
        await handleCompositePDF(req, res, qrCode, order);
      } else {
        const applicationStatus = applicationStatusType(
          order?.additionalDetails?.applicationStatus
        );
        const orderType = order?.orderType;
        const orderPreviewKey =
          OrderPreviewOrderTypeMap[
            orderPDFMap?.[orderType]?.[applicationStatus] || orderType
          ];
        await processOrder(req, res, qrCode, order, orderPreviewKey);
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
