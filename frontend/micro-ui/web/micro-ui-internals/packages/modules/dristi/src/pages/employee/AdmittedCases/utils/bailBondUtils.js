// Helper function to create bail bond task
export const createBailBondTask = async ({
  tenantId,
  roles,
  filingNumber,
  courtId,
  HomeService,
  DRISTIService,
  Urls,
  cnrNumber,
  caseDetails,
  bailPendingTaskExpiryDays,
  todayDate,
  setBailBondLoading,
  setIsBailBondTaskExists,
  setShowBailBondModal,
  setShowToast,
  t,
}) => {
  setBailBondLoading(true);
  try {
    const bailBondPendingTask = await HomeService.getPendingTaskService(
      {
        SearchCriteria: {
          tenantId,
          moduleName: "Pending Tasks Service",
          moduleSearchCriteria: {
            isCompleted: false,
            assignedRole: [...roles],
            filingNumber: filingNumber,
            courtId: courtId,
            entityType: "bail bond",
          },
          limit: 10,
          offset: 0,
        },
      },
      { tenantId }
    );

    if (bailBondPendingTask?.data?.length > 0) {
      setIsBailBondTaskExists(true);
      setShowToast({
        label: t("BAIL_BOND_TASK_ALREADY_EXISTS"),
        error: true,
      });
      return;
    } else {
      await DRISTIService.customApiService(Urls.dristi.pendingTask, {
        pendingTask: {
          name: t("CS_COMMON_BAIL_BOND"),
          entityType: "bail bond",
          referenceId: `MANUAL_BAIL_BOND_${filingNumber}`,
          status: "PENDING_SIGN",
          assignedTo: [],
          assignedRole: ["PENDING_TASK_CONFIRM_BOND_SUBMISSION"],
          actionCategory: "Bail Bond",
          cnrNumber,
          filingNumber,
          caseId: caseDetails?.id,
          caseTitle: caseDetails?.caseTitle,
          isCompleted: false,
          expiryDate: bailPendingTaskExpiryDays * 24 * 60 * 60 * 1000 + todayDate,
          stateSla: todayDate,
          additionalDetails: {},
          tenantId,
        },
      });
      setTimeout(() => {
        setBailBondLoading(false);
        setIsBailBondTaskExists(true);
        setShowBailBondModal(false);
      }, 1000);
    }
  } catch (e) {
    console.error(e);
    setBailBondLoading(false);
    const errorId = e?.response?.headers?.["x-correlation-id"] || e?.response?.headers?.["X-Correlation-Id"];
    setShowToast({
      label: t("UNABLE_TO_CREATE_BAIL_BOND_TASK"),
      error: true,
      errorId,
    });
  }
};
