import { useCallback } from "react";
import { Urls } from "../../../../hooks";

/**
 * Hook to handle evidence mark/unmark mutations.
 */
const useEvidenceActions = ({ evidenceUpdateMutation, filingNumber, showToast, refetchCaseData, t }) => {
  const onMarkSuccess = useCallback(
    async (response, data) => {
      showToast({
        isError: false,
        message: !data?.body?.artifact?.isEvidence ? t("SUCCESSFULLY_UNMARKED_MESSAGE") : t("SUCCESSFULLY_MARKED_MESSAGE"),
      });
      refetchCaseData();
    },
    [showToast, refetchCaseData, t]
  );

  const onMarkError = useCallback(
    async (error, data) => {
      showToast({
        isError: true,
        message: !data?.body?.artifact?.isEvidence ? t("UNSUCCESSFULLY_UNMARKED_MESSAGE") : t("UNSUCCESSFULLY_MARKED_MESSAGE"),
      });
    },
    [showToast, t]
  );

  const handleMarkEvidence = useCallback(
    async (documentSubmission, isEvidence) => {
      await evidenceUpdateMutation.mutate(
        {
          url: Urls.dristi.evidenceUpdate,
          params: {},
          body: {
            artifact: {
              ...documentSubmission?.[0].artifactList,
              isEvidence: !isEvidence,
              isVoid: false,
              reason: "",
              filingNumber: filingNumber,
            },
          },
          config: {
            enable: true,
          },
        },
        {
          onSuccess: onMarkSuccess,
          onError: onMarkError,
        }
      );
    },
    [evidenceUpdateMutation, filingNumber, onMarkSuccess, onMarkError]
  );

  const handleMarkAsVoid = useCallback(
    async (documentSubmission, isVoid, voidReason, onSuccess, onError) => {
      await evidenceUpdateMutation.mutate(
        {
          url: Urls.dristi.evidenceUpdate,
          params: {},
          body: {
            artifact: {
              ...documentSubmission?.[0].artifactList,
              filingNumber: filingNumber,
              isVoid,
              reason: isVoid ? voidReason : "",
              workflow: null,
            },
          },
          config: {
            enable: true,
          },
        },
        {
          onSuccess,
          onError,
        }
      );
    },
    [evidenceUpdateMutation, filingNumber]
  );

  return {
    handleMarkEvidence,
    handleMarkAsVoid,
  };
};

export default useEvidenceActions;
