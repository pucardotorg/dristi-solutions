// Helper function to handle case PDF download
export const handleDownloadPDF = async ({
  caseDetails,
  tenantId,
  DRISTIService,
  setCasePdfError,
  setCasePdfFileStoreId,
  setDownloadCasePdfLoading,
  setShowToast,
  t,
}) => {
  const caseId = caseDetails?.id;
  const caseStatus = caseDetails?.status;

  setCasePdfError(null);
  setCasePdfFileStoreId(null);

  if (["PENDING_PAYMENT", "RE_PENDING_PAYMENT", "UNDER_SCRUTINY", "PENDING_REGISTRATION"].includes(caseStatus)) {
    const fileStoreId =
      caseDetails?.documents?.find((doc) => doc?.key === "case.complaint.signed")?.fileStore || caseDetails?.additionalDetails?.signedCaseDocument;
    if (fileStoreId) {
      setCasePdfFileStoreId(fileStoreId);
      return;
    } else {
      console.error("No fileStoreId available for download.");
      setCasePdfError("No fileStoreId available for download.");
      return;
    }
  }

  try {
    setDownloadCasePdfLoading(true);

    if (!caseId) {
      throw new Error("Case ID is not available.");
    }

    const response = await DRISTIService.downloadCaseBundle({ tenantId, caseId }, { tenantId });
    const responseFileStoreId = response?.fileStoreId?.toLowerCase();

    if (!responseFileStoreId || ["null", "undefined"].includes(responseFileStoreId)) {
      throw new Error("Invalid fileStoreId received in the response.");
    }

    setCasePdfFileStoreId(responseFileStoreId);
  } catch (error) {
    console.error("Error downloading PDF: ", error.message || error);
    const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
    setShowToast({
      label: t("UNABLE_CASE_PDF"),
      error: true,
      errorId,
    });
    setCasePdfError(t("UNABLE_CASE_PDF"));
  } finally {
    setDownloadCasePdfLoading(false);
  }
};
