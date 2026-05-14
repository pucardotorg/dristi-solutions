import { useIndividualView } from "./useIndividualView";
import utils from "../utils";
import { useGetPendingTask } from "./useGetPendingTask";
import { HomeService } from "./services";
import useSearchReschedule from "./useSearchReschedule";
const home = {
  useIndividualView,
  useGetPendingTask,
  useSearchReschedule,
};

const Hooks = {
  home,
};

const Utils = {
  browser: {
    home: () => {},
  },
  home: {
    ...utils,
  },
};

export const CustomisedHooks = {
  Hooks,
  Utils,
  HomeService,
};

export const Urls = {
  pendingTask: "/analytics/pending_task/v1/create",
  Authenticate: "/user/oauth/token",
  FileFetchById: "/filestore/v1/files/id",
  bailBondSearch: "/bail-bond/v1/_search",
  bailBondUpdate: "/bail-bond/v1/_update",
};
