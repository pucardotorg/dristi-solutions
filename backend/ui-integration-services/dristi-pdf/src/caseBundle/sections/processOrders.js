const {
  filterCaseBundleBySection,
} = require("../utils/filterCaseBundleBySection");
const { search_order_v2 } = require("../../api");

async function processOrders(
  courtCase,
  caseBundleMaster,
  tenantId,
  requestInfo,
  TEMP_FILES_DIR,
  indexCopy
) {
  const processesSection = filterCaseBundleBySection(
    caseBundleMaster,
    "orders"
  );

  const ordersIndexSection = indexCopy.sections?.find(
    (section) => section.name === "orders"
  );

  if (processesSection?.length !== 0) {
    const section = processesSection[0];
    const resOrder = await search_order_v2(
      tenantId,
      requestInfo,
      {
        filingNumber: courtCase.filingNumber,
        courtId: courtCase.courtId,
        status: "PUBLISHED",
        tenantId,
      },
      {
        sortBy: section.sorton,
        order: "asc",
        limit: 100,
      }
    );

    const orderList = resOrder?.data?.list;

    if (orderList.length !== 0) {
      const ordersLineItems = await Promise.all(
        orderList?.map(async (order, index) => {
          if (order?.documents?.length !== 0) {
            const fileStoreId = order?.documents?.find(
              (doc) => doc?.documentType === "SIGNED"
            )?.fileStore;
            if (fileStoreId) {
              return {
                sourceId: fileStoreId,
                fileStoreId: fileStoreId,
                sortParam: index + 1,
                createPDF: false,
                content: "orders",
              };
            } else {
              return null;
            }
          } else {
            return null;
          }
        })
      );
      ordersIndexSection.lineItems = ordersLineItems?.filter(Boolean);
    }
  } else {
    ordersIndexSection.lineItems = [];
  }
}

module.exports = {
  processOrders,
};
