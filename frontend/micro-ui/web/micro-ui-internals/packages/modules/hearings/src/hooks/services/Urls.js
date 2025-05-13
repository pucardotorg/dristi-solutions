export const Urls = {
  Authenticate: "/user/oauth/token",
  pendingTask: "/analytics/pending_task/v1/create",
  hearing: {
    hearingUpdateTranscript: "/hearing/v1/update_transcript_additional_attendees",
    searchHearings: "/hearing/v1/search",
    searchTasks: "/task/v1/search",
    updateHearings: "/hearing/v1/update",
    downloadWitnesspdf: "/hearing/witnessDeposition/v1/downloadPdf",
    uploadWitnesspdf: "/hearing/witnessDeposition/v1/uploadPdf",
    causeList: "/scheduler/causelist/v1/_download",
    bulkReschedule: "/hearing/v1/bulk/_reschedule",
    createNotificationPdf: "/egov-pdf/hearing",
    bulkHearingsUpdate: "/hearing/v1/bulk/_update",
    addBulkDiaryEntries: "/ab-diary/case/diary/v1/bulkEntry",
    createNotification: "/notification/v1/_create",
    updateNotification: "/notification/v1/_update",
    searchNotification: "/notification/v1/_search",
    aDiaryEntryUpdate: "/ab-diary/case/diary/entry/v1/update",
    searchHearingCount: "/hearing-management/hearing/v1/search",
  },
  order: {
    createOrder: "/order/v1/create",
  },
  case: {
    caseSearch: "/case/v1/_search",
  },
  FileFetchById: "/filestore/v1/files/id",
};
