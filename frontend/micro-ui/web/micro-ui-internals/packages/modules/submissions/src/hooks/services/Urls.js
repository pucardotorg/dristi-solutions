export const Urls = {
  Authenticate: "/user/oauth/token",
  application: {
    applicationCreate: "/application/v1/create",
    applicationUpdate: "/application/v1/update",
    applicationSearch: "/application/v1/search",
    pendingTask: "/analytics/pending_task/v1/create",
    getPendingTaskFields: "/inbox/v2/_getFields",
    submissionPreviewPdf: "/egov-pdf/application",
    taskCreate: "/task/v1/create",
  },
  evidence: {
    evidenceSearch: "/evidence/v1/_search",
    evidenceCreate: "/evidence/v1/_create",
    evidenceUpdate: "/evidence/v1/_update",
  },
  FileFetchById: "/filestore/v1/files/id",
  bailBond : {
    bailBondCreate: "/bail-bond/v1/_create",
    bailBondUpdate: "/bail-bond/v1/_update",
    bailBondSearch: "/bail-bond/v1/_search",
    bailBondPreviewPdf: "/egov-pdf/bailBond",
  },
  openApi:{
    FileFetchByFileStore: "/openapi/v1/landing_page/file",
    bailSearch:"/openapi/v1/bail/search",
    updateBailBond: "/openapi/v1/updateBailBond",
    witnessDepositionSearch:"/openapi/v1/witness_deposition/search",
  }
};
