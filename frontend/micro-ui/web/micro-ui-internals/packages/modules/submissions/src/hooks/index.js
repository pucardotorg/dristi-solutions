import { useIndividualView } from "./useIndividualView";
import utils from "../utils";
import { submissionService } from "./services";
import useSearchSubmissionService from "./submissions/useSearchSubmissionService";
import useSearchEvidenceService from "./submissions/useSearchEvidenceService";
import useSearchBailBondService from "./submissions/useSearchBailBondService";
import useOpenApiSearchBailBond from "./submissions/useOpenApiSearchBailBond";
import useSearchDigitalization from "./submissions/useSearchDigitalization";

const submissions = {
  useIndividualView,
  useSearchSubmissionService,
  useSearchEvidenceService,
  useSearchBailBondService,
  useOpenApiSearchBailBond,
  useSearchDigitalization,
};

const Hooks = {
  submissions,
};

const Utils = {
  browser: {
    submissions: () => {},
  },
  submissions: {
    ...utils,
  },
};

export const CustomisedHooks = {
  Hooks,
  Utils,
  submissionService,
};
