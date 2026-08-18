import { useCallback } from "react";
import { useHistory } from "react-router-dom";
import { DRISTIService } from "../../../../services";
import { convertTaskResponseToPayload } from "@egovernments/digit-ui-module-orders/src/utils";

const useCitizenActions = ({
  tenantId,
  filingNumber,
  complainantsList,
  isCitizen,
  authorizedUuid,
  courtId,
  setApiCalled,
  showToast,
}) => {
  const history = useHistory();

  const handleCitizenAction = useCallback(
    async (option) => {
      try {
        if (option.value === "RAISE_APPLICATION") {
          history.push(`/${window?.contextPath}/citizen/submissions/submissions-create?filingNumber=${filingNumber}`);
        } else if (option.value === "SUBMIT_DOCUMENTS") {
          history.push(`/${window?.contextPath}/citizen/submissions/submit-document?filingNumber=${filingNumber}`);
        } else if (option.value === "GENERATE_BAIL_BOND") {
          if (complainantsList?.length === 1) {
            setApiCalled(true);
            const res = await DRISTIService?.getPendingTaskService(
              {
                SearchCriteria: {
                  tenantId,
                  moduleName: "Pending Tasks Service",
                  moduleSearchCriteria: {
                    isCompleted: false,
                    ...(isCitizen && { assignedTo: authorizedUuid }),
                    ...(courtId && { courtId }),
                    filingNumber,
                    entityType: "bail bond",
                  },
                  limit: 1000,
                  offset: 0,
                },
              },
              { tenantId }
            );
            const pendingTaskResponse = res?.data || [];
            const pendingTaskDetails = convertTaskResponseToPayload(pendingTaskResponse);

            if (pendingTaskResponse?.length > 0 && pendingTaskDetails?.additionalDetails?.bailbondId) {
              history.push(
                `/${window?.contextPath}/citizen/submissions/bail-bond/view?filingNumber=${filingNumber}&bailBondId=${pendingTaskDetails?.additionalDetails?.bailbondId}`
              );
            } else if (pendingTaskResponse?.length > 0) {
              history.push(`/${window?.contextPath}/citizen/submissions/bail-bond?filingNumber=${filingNumber}`, {
                state: {
                  params: {
                    actualReferenceId: pendingTaskDetails?.referenceId,
                  },
                },
              });
            } else {
              history.push(`/${window?.contextPath}/citizen/submissions/bail-bond?filingNumber=${filingNumber}`);
            }
          } else {
            history.push(`/${window?.contextPath}/citizen/submissions/bail-bond?filingNumber=${filingNumber}`);
          }
        }
      } catch (error) {
        console.error("Error handling citizen action:", error);
        showToast({ isError: true, message: "BAIL_BOND_SEARCH_FAILED" });
      } finally {
        setApiCalled(false);
      }
    },
    [history, filingNumber, complainantsList, isCitizen, authorizedUuid, courtId, tenantId, setApiCalled, showToast]
  );

  return {
    handleCitizenAction,
  };
};

export default useCitizenActions;
