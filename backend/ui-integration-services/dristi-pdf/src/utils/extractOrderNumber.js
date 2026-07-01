function extractOrderNumber(orderItemId) {
  if (!orderItemId || typeof orderItemId !== "string") return orderItemId || "";
  return orderItemId?.includes("_")
    ? orderItemId?.split("_")?.pop()
    : orderItemId;
}

module.exports = { extractOrderNumber };
