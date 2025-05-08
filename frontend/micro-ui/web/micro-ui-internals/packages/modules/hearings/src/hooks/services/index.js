import { Request } from "@egovernments/digit-ui-libraries";
import { Urls } from "./Urls";

const judgeId = window?.globalConfigs?.getConfig("JUDGE_ID") || "JUDGE_ID";
const benchId = window?.globalConfigs?.getConfig("BENCH_ID") || "BENCH_ID";
const courtId = window?.globalConfigs?.getConfig("COURT_ID") || "KLKM52";
const presidedBy = {
  judgeID: [judgeId],
  benchID: benchId,
  courtID: courtId,
};

export const hearingService = {
  updateHearingTranscript: (data, params) => {
    const updatedData = {
      ...data,
      hearing: {
        ...data.hearing,
        presidedBy: presidedBy,
      },
    };
    return Request({
      url: Urls.hearing.hearingUpdateTranscript,
      useCache: false,
      userService: false,
      data: updatedData,
      params,
    });
  },
  updateHearings: (data, params) => {
    const updatedData = {
      ...data,
      hearing: {
        ...data.hearing,
        presidedBy: presidedBy,
      },
    };
    return Request({
      url: Urls.hearing.updateHearings,
      useCache: false,
      userService: false,
      data: updatedData,
      params,
    });
  },
  searchHearings: (data, params) => {
    // Add courtId to criteria if it exists
    return Request({
      url: Urls.hearing.searchHearings,
      useCache: false,
      userService: false,
      data:{...data,criteria: {...data?.criteria,courtId: window?.globalConfigs?.getConfig("COURT_ID") || 'KLKM52'}},
      params,
    });
  },
  searchHearingCount: (data, params) => {
    return Request({
      url: Urls.hearing.searchHearingCount,
      useCache: false,
      userService: false,
      data,
      params,
    });
  },

  searchTaskList: (data, params) => {
    // Add courtId to criteria if it exists
    return Request({
      url: Urls.hearing.searchTasks,
      useCache: false,
      userService: false,
      data: { ...data, criteria: { ...data?.criteria, courtId: window?.globalConfigs?.getConfig("COURT_ID") || "KLKM52" } },
      params,
    });
  },
  startHearing: ({ hearing }, params) => {
    const updatedData = { hearing: { ...hearing, presidedBy: presidedBy, workflow: { action: "START" } } };
    return Request({
      url: Urls.hearing.updateHearings,
      useCache: false,
      userService: false,
      data: updatedData,
      params,
    });
  },
  customApiService: (url, data, params, useCache = false, userDownload = false) =>
    Request({
      url: url,
      useCache: useCache,
      userService: true,
      data: {
        ...data,
        ...(data?.pendingTask && {
          pendingTask: {
            ...data?.pendingTask,
            screenType: data?.pendingTask?.isDiary ? "Adiary" : "home",
          },
        }),
      },
      params,
      userDownload,
    }),

  generateWitnessDepostionDownload: (data, params) =>
    Request({
      url: Urls.hearing.downloadWitnesspdf,
      useCache: false,
      userService: false,
      data,
      params,
      userDownload: true,
    }),
  bulkReschedule: (data, params) => {
    return Request({
      url: Urls.hearing.bulkReschedule,
      useCache: false,
      userService: false,
      data,
      params,
    });
  },
  updateBulkHearing: (data, params) => {
    return Request({
      url: Urls.hearing.bulkHearingsUpdate,
      useCache: false,
      userService: false,
      data,
      params,
    });
  },
  createNotification: (data, params) => {
    return Request({
      url: Urls.hearing.createNotification,
      useCache: false,
      userService: false,
      data,
      params,
    });
  },
  updateNotification: (data, params) => {
    return Request({
      url: Urls.hearing.updateNotification,
      useCache: false,
      userService: false,
      data,
      params,
    });
  },
  addBulkDiaryEntries: (data, params) => {
    return Request({
      url: Urls.hearing.addBulkDiaryEntries,
      useCache: false,
      userService: false,
      data,
      params,
    });
  },
  aDiaryEntryUpdate: (data, params) =>
    Request({
      url: Urls.hearing.aDiaryEntryUpdate,
      useCache: false,
      userService: false,
      data,
      params,
    }),
  searchNotification: (data, params) =>
    Request({
      url: Urls.hearing.searchNotification,
      useCache: false,
      userService: false,
      data,
      params,
    }),
};
