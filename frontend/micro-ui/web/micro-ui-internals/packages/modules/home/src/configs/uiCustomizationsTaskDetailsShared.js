/**
 * Parses taskDetails from inbox/task rows (string JSON or object).
 * Shared by home UICustomizations and orders ReviewSummonsNoticeAndWarrant.
 */
export const parseTaskDetails = (taskDetails) => {
  try {
    if (typeof taskDetails === "string") {
      const cleanedDetails = taskDetails.replace(/\\n/g, "").replace(/\\/g, "");
      const parsed = JSON.parse(cleanedDetails);
      if (typeof parsed === "string") {
        try {
          return JSON.parse(parsed);
        } catch {
          return parsed;
        }
      }
      return parsed;
    }
    return taskDetails;
  } catch (error) {
    console.error("Failed to parse taskDetails:", error);
    return null;
  }
};
