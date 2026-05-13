import React from "react";

// Helper function to create DCA (Delay Condonation Application) confirm modal config
export const getDcaConfirmModalConfig = ({
  isDelayCondonationApplicable,
  isDelayApplicationPending,
  setIsOpenFromPendingTask,
  setIsOpenDCA,
  setSubmitModalInfo,
  admitCaseSubmitConfig,
  caseInfo,
  setModalInfo,
  setShowModal,
  isOpenFromPendingTask,
  t,
  delayCondonationTextStyle,
}) => {
  if (!isDelayCondonationApplicable) return;

  return {
    handleClose: () => {
      setIsOpenFromPendingTask(false);
      setIsOpenDCA(false);
    },
    heading: { label: "" },
    actionSaveLabel: "",
    isStepperModal: true,
    actionSaveOnSubmit: () => {},
    steps: [
      {
        heading: { label: isDelayApplicationPending ? t("DELAY_CONDONATION_APPLICATION_OPEN") : t("DCA_NOT_FILED") },
        ...(isDelayCondonationApplicable &&
          !isDelayApplicationPending && {
            actionSaveLabel: t("DCA_PROCEED_ANYWAY"),
            actionSaveOnSubmit: () => {
              setIsOpenDCA(false);
              setSubmitModalInfo({ ...admitCaseSubmitConfig, caseInfo: caseInfo });
              setModalInfo({ type: "admitCase", page: 0 });
              setShowModal(true);
            },
          }),
        modalBody: (
          <div style={{ width: "527px", padding: "12px 16px" }}>
            <p style={delayCondonationTextStyle}>
              {isDelayApplicationPending ? t("DELAY_CONDONATION_APPLICATION_OPEN_MESSAGE") : t("DCA_NOT_FILED_MESSAGE")}
            </p>
          </div>
        ),
        actionCancelLabel: "BACK",
        actionCancelOnSubmit: () => {
          setIsOpenDCA(false);
          if (isOpenFromPendingTask) {
            setIsOpenFromPendingTask(false);
            window.history.back();
          }
        },
      },
    ],
  };
};

// Helper function to create void modal config
export const getVoidModalConfig = ({
  showVoidModal,
  documentSubmission,
  evidenceUpdateMutation,
  filingNumber,
  refetchCaseData,
  setShowVoidModal,
  setShowToast,
  t,
  userType,
  voidReason,
  setVoidReason,
  setDocumentSubmission,
  VoidSubmissionBody,
  Urls,
}) => {
  if (!showVoidModal) return {};

  const itemType = documentSubmission?.[0]?.itemType;

  let voidHeadingLabel = t("ARE_YOU_SURE_TO_MARK_AS_VOID");
  if (itemType === "view_reason_for_voiding") voidHeadingLabel = t("REASON_FOR_VOIDING");
  else if (itemType === "unmark_void_submission") voidHeadingLabel = t("ARE_YOU_SURE_TO_UNMARK_AS_VOID");

  let voidActionSaveLabel;
  if (userType === "citizen") voidActionSaveLabel = undefined;
  else if (itemType === "view_reason_for_voiding") voidActionSaveLabel = t("UNMARK_AS_VOID");
  else if (itemType === "unmark_void_submission") voidActionSaveLabel = t("MARK_VOID_CONFIRM");
  else voidActionSaveLabel = t("MARK_AS_VOID");
  const onSuccess = async (response, data) => {
    setShowToast({
      label: !data?.body?.artifact?.isVoid ? t("SUCCESSFULLY_UNMARKED_AS_VOID_MESSAGE") : t("SUCCESSFULLY_MARKED_AS_VOID_MESSAGE"),
      error: false,
    });
    refetchCaseData();
    setShowVoidModal(false);
  };

  const onError = async (error, data) => {
    setShowToast({
      label: !data?.body?.artifact?.isVoid ? t("UNSUCCESSFULLY_UNMARKED_AS_VOID_MESSAGE") : t("UNSUCCESSFULLY_MARKED_AS_VOID_MESSAGE"),
      error: true,
    });
  };

  const handleMarkAsVoid = async (documentSubmission, isVoid) => {
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
  };

  const handleClose = () => {
    refetchCaseData();
    setShowVoidModal(false);
  };

  return {
    handleClose: handleClose,
    heading: {
      label: voidHeadingLabel,
    },
    isStepperModal: true,
    actionSaveLabel: voidActionSaveLabel,
    actionCancelLabel: userType === "citizen" ? t("VOID_BACK") : t("MARK_VOID_CANCEL"),
    steps: [
      {
        actionCancelOnSubmit: handleClose,
        actionSaveLableType: itemType === "mark_as_void" ? "WARNING" : null,
        modalBody: (
          <VoidSubmissionBody
            t={t}
            documentSubmission={documentSubmission}
            setVoidReason={setVoidReason}
            voidReason={voidReason}
            disabled={itemType === "view_reason_for_voiding" || itemType === "unmark_void_submission"}
          />
        ),
        async: true,
        isDisabled: !voidReason,
        actionSaveOnSubmit: async () => {
          if (documentSubmission[0].itemType === "unmark_void_submission") {
            await handleMarkAsVoid(documentSubmission, false);
          } else if (documentSubmission[0].itemType === "view_reason_for_voiding") {
            setDocumentSubmission(
              documentSubmission?.map((item) => {
                return { ...item, itemType: "unmark_void_submission" };
              })
            );
          } else {
            await handleMarkAsVoid(documentSubmission, true);
          }
        },
      },
    ],
  };
};
