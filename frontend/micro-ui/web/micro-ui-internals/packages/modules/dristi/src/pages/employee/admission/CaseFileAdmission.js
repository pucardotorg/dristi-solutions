import { BackButton, FormComposerV2, Header, Loader, Toast } from "@egovernments/digit-ui-react-components";
import React, { useMemo, useState } from "react";
import { Redirect, useHistory, useLocation } from "react-router-dom/cjs/react-router-dom.min";
import CustomCaseInfoDiv from "../../../components/CustomCaseInfoDiv";
import { Urls } from "../../../hooks";
import useSearchCaseService from "../../../hooks/dristi/useSearchCaseService";
import { CustomArrowDownIcon, FileDownloadIcon, RightArrow, WarningInfoRedIcon } from "../../../icons/svgIndex";
import { DRISTIService } from "../../../services";
import { CaseWorkflowState } from "../../../Utils/caseWorkflow";
import { OrderTypes, OrderWorkflowAction } from "../../../Utils/orderWorkflow";
import { formatDate } from "../../citizen/FileCase/CaseType";
import {
  admitCaseSubmitConfig,
  registerCaseConfig,
  scheduleCaseAdmissionConfig,
  scheduleCaseSubmitConfig,
  selectParticipantConfig,
  sendBackCase,
} from "../../citizen/FileCase/Config/admissionActionConfig";
import { reviewCaseFileFormConfig } from "../../citizen/FileCase/Config/reviewcasefileconfig";
import { getAdvocates } from "../../citizen/FileCase/EfilingValidationUtils";
import AdmissionActionModal from "./AdmissionActionModal";
import { generateUUID, getFilingType } from "../../../Utils";
import { documentTypeMapping } from "../../citizen/FileCase/Config";
import ScheduleHearing from "../AdmittedCases/ScheduleHearing";
import { SubmissionWorkflowAction, SubmissionWorkflowState } from "../../../Utils/submissionWorkflow";
import useDownloadCasePdf from "../../../hooks/dristi/useDownloadCasePdf";
import WorkflowTimeline from "../../../components/WorkflowTimeline";

