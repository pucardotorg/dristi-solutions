import { useIndividualView } from "./useIndividualView";
import utils from "../utils";
import useUpdateHearingsService from "./hearings/useUpdateHearingsService";
import useGetHearings from "./hearings/useGetHearings";
import usePreHearingModalData from "./usePreHearingModalData";
import useGetHearingSlotMetaData from "./useGetHearingSlotMetaData";
import useGetTaskList from "./hearings/useGetTaskList";
import useGetHearingLink from "./hearings/useGetHearingLink";
import { hearingService } from "./services";
import useGetHearingsCounts from "./hearings/useGetHearingCounts";

const hearings = {
  useIndividualView,
  useUpdateHearingsService,
  useGetHearings,
  usePreHearingModalData,
  useGetHearingSlotMetaData,
  useGetTaskList,
  useGetHearingLink,
  useGetHearingsCounts,
};

const Hooks = {
  hearings,
};

const Utils = {
  browser: {
    hearings: () => {},
  },
  hearings: {
    ...utils,
  },
};

export const CustomisedHooks = {
  Hooks,
  HearingService: hearingService,
  Utils,
};
