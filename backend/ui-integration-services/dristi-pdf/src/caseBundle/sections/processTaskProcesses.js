const {
  filterCaseBundleBySection,
} = require("../utils/filterCaseBundleBySection");
const { search_table_task } = require("../../api");
const {
  duplicateExistingFileStore,
} = require("../utils/duplicateExistingFileStore");

async function processTaskProcesses(
  courtCase,
  caseBundleMaster,
  tenantId,
  requestInfo,
  TEMP_FILES_DIR,
  indexCopy
) {
  const processesSection = filterCaseBundleBySection(
    caseBundleMaster,
    "processes"
  );

  const processesIndexSection = indexCopy.sections?.find(
    (section) => section.name === "processes"
  );

  if (processesSection?.length !== 0) {
    const resTask = await search_table_task(
      tenantId,
      requestInfo,
      {
        completeStatus: [
          "ISSUE_SUMMON",
          "ISSUE_NOTICE",
          "ISSUE_WARRANT",
          "ISSUE_PROCLAMATION",
          "ISSUE_ATTACHMENT",
          "OTHER",
          "ABATED",
          "SUMMON_SENT",
          "EXECUTED",
          "NOT_EXECUTED",
          "WARRANT_SENT",
          "PROCLAMATION_SENT",
          "ATTACHMENT_SENT",
          "DELIVERED",
          "UNDELIVERED",
          "NOTICE_SENT",
        ],
        searchText:
          courtCase.cnrNumber ||
          courtCase.cmpNumber ||
          (courtCase?.isLPRCase
            ? courtCase?.lprNumber
            : courtCase.courtCaseNumber),
        courtId: courtCase.courtId,
        tenantId,
      },
      {
        sortBy: "createdDate",
        order: "asc",
        limit: 100,
      }
    );

    const taskList = resTask?.data?.list;

    // Group while preserving createdDate order
    const noticeTasks = taskList?.filter((task) => task.orderType === "NOTICE");
    const summonsTasks = taskList?.filter(
      (task) => task.orderType === "SUMMONS"
    );
    const warrantsTasks = taskList?.filter(
      (task) => task.orderType === "WARRANT"
    );
    const proclamationTasks = taskList?.filter(
      (task) => task.orderType === "PROCLAMATION"
    );
    const attachmentTasks = taskList?.filter(
      (task) => task.orderType === "ATTACHMENT"
    );

    // Concatenate groups to get final ordered list
    const orderedTaskList = [
      ...noticeTasks,
      ...summonsTasks,
      ...warrantsTasks,
      ...proclamationTasks,
      ...attachmentTasks,
    ];

    if (orderedTaskList.length !== 0) {
      const processesLineItems = await Promise.all(
        taskList?.map(async (task, ind) => {
          if (task?.documents?.length !== 0) {
            const expectedDocumentType =
              task.documentStatus === "SIGN_PENDING"
                ? "GENERATE_TASK_DOCUMENT"
                : "SIGNED_TASK_DOCUMENT";

            const fileStoreId = task.documents?.find(
              (doc) => doc.documentType === expectedDocumentType
            )?.fileStore;

            if (fileStoreId) {
              const newFileStoreId = await duplicateExistingFileStore(
                tenantId,
                fileStoreId,
                requestInfo,
                TEMP_FILES_DIR
              );
              return {
                sourceId: fileStoreId,
                fileStoreId: newFileStoreId,
                sortParam: ind + 1,
                createPDF: false,
                content: "processes",
              };
            } else {
              return null;
            }
          } else {
            return null;
          }
        })
      );
      processesIndexSection.lineItems = processesLineItems?.filter(Boolean);
    } else {
      processesIndexSection.lineItems = [];
    }
  } else {
    processesIndexSection.lineItems = [];
  }
}

module.exports = {
  processTaskProcesses,
};
