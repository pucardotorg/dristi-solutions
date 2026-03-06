import { useState, useCallback } from "react";
import { DRISTIService } from "../../services";

// sort like first document will signed one, rest will sort based on documentOrder
const _getSortedByOrder = (documents) => {
  return documents?.sort((a, b) => {
    if (a?.documentType === "SIGNED" && b?.documentType !== "SIGNED") return -1;
    if (a?.documentType !== "SIGNED" && b?.documentType === "SIGNED") return 1;
    return (a?.documentOrder || 0) - (b?.documentOrder || 0);
  });
};

const extractOrderNumber = (orderItemId) => {
  if (!orderItemId || typeof orderItemId !== "string") return orderItemId || "";
  return orderItemId?.includes("_") ? orderItemId?.split("_")?.pop() : orderItemId;
};

const useGetAllOrderApplicationRelatedDocuments = ({ courtId }) => {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRecursiveData = useCallback(
    async (initialInput) => {
      setIsLoading(true);

      let currentResponse = initialInput;
      const collectedDocuments = [];

      const processDocuments = (docs) => {
        if (docs) {
          const sortedDocuments = _getSortedByOrder(docs);
          collectedDocuments.push(...sortedDocuments);
        }
      };

      const fetchApplicationDocuments = async (filingNumber, applicationNumber, tenantId) => {
        const applicationData = await DRISTIService.searchSubmissions(
          {
            criteria: { filingNumber, applicationNumber, tenantId, ...(courtId && { courtId }) },
            tenantId,
          },
          {}
        );

        const appDocuments = applicationData?.applicationList?.[0]?.documents;
        processDocuments(appDocuments);
        return applicationData?.applicationList?.[0];
      };

      const fetchOrderDocuments = async (filingNumber, orderNumber, tenantId) => {
        const orderData = await DRISTIService.searchOrders(
          {
            tenantId,
            criteria: { filingNumber, orderNumber, applicationNumber: "", cnrNumber: "", ...(courtId && { courtId }) },
          },
          { tenantId }
        );

        const orderDocuments = orderData?.list?.[0]?.documents;
        processDocuments(orderDocuments);
        return orderData?.list?.[0];
      };

      if (currentResponse?.documents) {
        processDocuments(currentResponse?.documents);
      }

      while (currentResponse) {
        let nextResponse;
        if (currentResponse?.orderCategory === "COMPOSITE") {
          for (const item of currentResponse?.compositeItems || []) {
            const refApplicationId = item?.orderSchema?.additionalDetails?.formdata?.refApplicationId;
            if (refApplicationId) {
              nextResponse = await fetchApplicationDocuments(currentResponse?.filingNumber, refApplicationId, currentResponse?.tenantId);
            }
          }
        } else if (currentResponse?.additionalDetails?.formdata?.refApplicationId) {
          nextResponse = await fetchApplicationDocuments(
            currentResponse?.filingNumber,
            currentResponse?.additionalDetails?.formdata?.refApplicationId,
            currentResponse?.tenantId
          );
        } else if (currentResponse?.additionalDetails?.formdata?.refOrderId) {
          nextResponse = await fetchOrderDocuments(
            currentResponse?.filingNumber,
            extractOrderNumber(currentResponse?.additionalDetails?.formdata?.refOrderId),
            currentResponse?.tenantId
          );
        }

        if (
          !nextResponse ||
          (nextResponse?.orderCategory !== "COMPOSITE" &&
            !nextResponse?.additionalDetails?.formdata?.refApplicationId &&
            !nextResponse?.additionalDetails?.formdata?.refOrderId) ||
          (nextResponse?.orderCategory === "COMPOSITE" &&
            !nextResponse?.compositeItems?.some((item) => item?.orderSchema?.additionalDetails?.formdata?.refApplicationId) &&
            !nextResponse?.additionalDetails?.formdata?.refOrderId)
        ) {
          break;
        }
        currentResponse = nextResponse;
      }

      setDocuments(collectedDocuments);
      setIsLoading(false);
    },
    [courtId]
  );

  return { documents, isLoading, fetchRecursiveData };
};

export default useGetAllOrderApplicationRelatedDocuments;
