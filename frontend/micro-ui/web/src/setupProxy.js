const { createProxyMiddleware } = require("http-proxy-middleware");
const createProxy = createProxyMiddleware({
  target: process.env.REACT_APP_PROXY_URL,
  changeOrigin: true,
});
module.exports = function (app) {
  [
    "/egov-mdms-service",
    "/egov-location",
    "/localization",
    "/egov-workflow-v2",
    "/pgr-services",
    "/filestore",
    "/egov-hrms",
    "/user-otp",
    "/user",
    "/fsm",
    "/billing-service",
    "/collection-services",
    "/pdf-service",
    "/pg-service",
    "/vehicle",
    "/vendor",
    "/property-services",
    "/fsm-calculator/v1/billingSlab/_search",
    "/muster-roll",
    "/advocate",
    "/clerk",
    "/case",
    "/individual",
    "/evidence",
    "/casemanagement",
    "/application",
    "/case",
    "/order",
    "/inbox",
    "/hearing",
    "/e-sign-svc",
    "/payment",
    "/etreasury",
    "/payment-calculator",
    "/case",
    "/analytics",
    "/epost-tracker",
    "/task",
    "/ocr-service",
    "/scheduler",
    "/egov-pdf",
    "/sbi-backend",
    "/dristi-case-pdf",
    "/casemanagement/casemanager/case/v1/_buildcasebundle",
  ].forEach((location) => app.use(location, createProxy));
};
