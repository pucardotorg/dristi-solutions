import { Request } from "@egovernments/digit-ui-libraries";

export const Urls = {
  Authenticate: "/user/oauth/token",
  case: {
    joinCase: "/case/v1/joincase/_joincase",
    verifyAccessCode: "/case/v2/joincase/_verifycode",
  },
  task: {
    pendingTask: "/analytics/pending_task/v1/create",
  },
};

export const CASEService = {
  joinCaseService: (data, params) =>
    Request({
      url: Urls.case.joinCase,
      useCache: false,
      userService: true,
      data,
      params,
    }),
  verifyAccessCode: (data, params) =>
    Request({
      url: Urls.case.verifyAccessCode,
      useCache: false,
      userService: true,
      data,
      params,
    }),
};
