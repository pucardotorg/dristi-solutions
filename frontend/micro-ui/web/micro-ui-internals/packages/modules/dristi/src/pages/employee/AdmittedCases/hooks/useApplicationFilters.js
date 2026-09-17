import { useMemo } from "react";
import { SubmissionWorkflowState } from "../../../../Utils/submissionWorkflow";

/**
 * Hook to filter and derive application-related data from application search results.
 */
const useApplicationFilters = (applicationData, onBehalfOfuuid) => {
  const extensionApplications = useMemo(
    () =>
      applicationData?.applicationList?.filter(
        (item) =>
          item?.applicationType === "EXTENSION_SUBMISSION_DEADLINE" &&
          item?.onBehalfOf?.includes(onBehalfOfuuid) &&
          ![
            SubmissionWorkflowState.COMPLETED,
            SubmissionWorkflowState.DELETED,
            SubmissionWorkflowState.REJECTED,
            SubmissionWorkflowState.ABATED,
          ].includes(item?.status)
      ) || [],
    [applicationData, onBehalfOfuuid]
  );

  const productionOfDocumentApplications = useMemo(
    () =>
      applicationData?.applicationList?.filter(
        (item) =>
          item?.applicationType === "PRODUCTION_DOCUMENTS" &&
          item?.onBehalfOf?.includes(onBehalfOfuuid) &&
          ![SubmissionWorkflowState.DELETED, SubmissionWorkflowState.ABATED].includes(item?.status)
      ) || [],
    [applicationData, onBehalfOfuuid]
  );

  const submitBailDocumentsApplications = useMemo(
    () =>
      applicationData?.applicationList?.filter(
        (item) =>
          item?.applicationType === "SUBMIT_BAIL_DOCUMENTS" &&
          item?.onBehalfOf?.includes(onBehalfOfuuid) &&
          ![SubmissionWorkflowState.DELETED, SubmissionWorkflowState.ABATED].includes(item?.status)
      ) || [],
    [applicationData, onBehalfOfuuid]
  );

  const isDelayApplicationPendingComputed = useMemo(
    () =>
      Boolean(
        applicationData?.applicationList?.some(
          (item) =>
            item?.applicationType === "DELAY_CONDONATION" &&
            [SubmissionWorkflowState.PENDINGAPPROVAL, SubmissionWorkflowState.PENDINGREVIEW].includes(item?.status)
        )
      ),
    [applicationData]
  );

  const isDelayApplicationCompleted = useMemo(
    () =>
      Boolean(
        applicationData?.applicationList?.some(
          (item) => item?.applicationType === "DELAY_CONDONATION" && [SubmissionWorkflowState.COMPLETED].includes(item?.status)
        )
      ),
    [applicationData]
  );

  const isDelayApplicationRejected = useMemo(
    () =>
      Boolean(
        applicationData?.applicationList?.some(
          (item) => item?.applicationType === "DELAY_CONDONATION" && [SubmissionWorkflowState.REJECTED].includes(item?.status)
        )
      ),
    [applicationData]
  );

  return {
    extensionApplications,
    productionOfDocumentApplications,
    submitBailDocumentsApplications,
    isDelayApplicationPendingComputed,
    isDelayApplicationCompleted,
    isDelayApplicationRejected,
  };
};

export default useApplicationFilters;
