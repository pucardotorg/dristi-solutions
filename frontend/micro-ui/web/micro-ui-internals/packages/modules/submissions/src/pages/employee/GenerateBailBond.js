import { FormComposerV2, Header, Loader, Toast } from "@egovernments/digit-ui-react-components";
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { bailBondConfig } from "../../configs/generateBailBondConfig";
import isEqual from "lodash/isEqual";
import BailBondReviewModal from "../../components/BailBondReviewModal";
import BailUploadSignatureModal from "../../components/BailUploadSignatureModal";
import useDownloadCasePdf from "@egovernments/digit-ui-module-dristi/src/hooks/dristi/useDownloadCasePdf";
import SuccessBannerModal from "../../components/SuccessBannerModal";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import BailBondEsignLockModal from "../../components/BailBondEsignLockModal";
import { combineMultipleFiles, formatAddress } from "@egovernments/digit-ui-module-dristi/src/Utils";
import { submissionService } from "../../hooks/services";
import useSearchBailBondService from "../../hooks/submissions/useSearchBailBondService";
import { bailBondWorkflowAction } from "../../../../dristi/src/Utils/submissionWorkflow";
import { BreadCrumbsParamsDataContext } from "@egovernments/digit-ui-module-core";
import { DRISTIService } from "@egovernments/digit-ui-module-dristi/src/services";
import { HomeService, Urls as HomeUrls } from "@egovernments/digit-ui-module-home/src/hooks/services";
import { convertTaskResponseToPayload } from "../../utils";
import { Urls } from "../../hooks/services/Urls";

const fieldStyle = { marginRight: 0, width: "100%" };

const convertToFormData = (t, obj) => {
  const formdata = {
    selectComplainant: {
      code: obj?.litigantName,
      name: obj?.litigantName,
      uuid: obj?.litigantId,
    },
    litigantFatherName: obj?.litigantFatherName,
    bailAmount: obj?.bailAmount,
    bailType: (() => {
      const bt = obj?.bailType;
      const code = typeof bt === "string" ? bt : typeof bt?.code === "string" ? bt.code : "";
      const upper = typeof code === "string" ? code.toUpperCase() : "";
      return {
        code: upper,
        name: upper ? t(upper) : "",
        showSurety: upper === "SURETY",
      };
    })(),
    noOfSureties: (() => {
      const add = (obj && (obj.additionalDetails || obj)) || {};
      const raw = add.noOfSureties || add.noOfSurities || add.noOfSurety || add.numberOfSureties || add.suretyCount;
      const cnt = typeof raw === "number" ? raw : parseInt(raw, 10);
      return Number.isFinite(cnt) && cnt > 0 ? cnt : undefined;
    })(),
    sureties:
      Array.isArray(obj?.sureties) && obj.sureties.length > 0
        ? obj.sureties.map((surety) => ({
            id: surety?.id,
            name: surety?.name,
            fatherName: surety?.fatherName,
            mobileNumber: surety?.mobileNumber,
            address: surety?.address,
            email: surety?.email,
            identityProof: {
              document: surety?.documents?.filter((doc) => doc?.documentType === "IDENTITY_PROOF") || [],
            },
            proofOfSolvency: {
              document: surety?.documents?.filter((doc) => doc?.documentType === "PROOF_OF_SOLVENCY") || [],
            },
            otherDocuments: {
              document: surety?.documents?.filter((doc) => doc?.documentType === "OTHER_DOCUMENTS") || [],
            },
          }))
        : [{}],
  };

  return formdata;
};

export const bailBondAddressValidation = ({ formData, inputs }) => {
  if (
    inputs?.some((input) => {
      const isEmpty = /^\s*$/.test(formData?.[input?.name]);
      return isEmpty || !formData?.[input?.name]?.match(window?.Digit.Utils.getPattern(input?.validation?.patternType) || input?.validation?.pattern);
    })
  ) {
    return true;
  }
};

const GenerateBailBond = () => {
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const { t } = useTranslation();
  const history = useHistory();
  const { filingNumber, bailBondId, showModal, source } = Digit?.Hooks?.useQueryParams ? Digit.Hooks.useQueryParams() : {};
  const fromPendingTask = source === "pendingTasks";
  const userInfo = Digit.UserService.getUser()?.info;
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo?.type]);
  const isCitizen = useMemo(() => userInfo?.type === "CITIZEN", [userInfo]);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
  const [showBailBondReview, setShowBailBondReview] = useState(false);
  const [showSignatureModal, setShowsignatureModal] = useState(false);
  const [showUploadSignature, setShowUploadSignature] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showBailBondEsign, setShowBailBondEsign] = useState(false);
  const [loader, setLoader] = useState(false);
  const [bailUploadLoader, setBailUploadLoader] = useState(false);
  const { downloadPdf } = useDownloadCasePdf();
  const setFormErrors = useRef(null);
  const setFormState = useRef(null);
  const resetFormData = useRef(null);
  const setFormDataValue = useRef(null);
  const clearFormDataErrors = useRef(null);
  const targetPetitionerRef = useRef(null);
  const alignedOnceRef = useRef(false);
  const [formdata, setFormdata] = useState({});
  const hasClearedRef = useRef(false);
  const [showErrorToast, setShowErrorToast] = useState(null);
  const [bailBondFileStoreId, setBailBondFileStoreId] = useState("");
  const [bailBondSignatureURL, setBailBondSignatureURL] = useState("");
  const [defaultFormValueData, setDefaultFormValueData] = useState({});
  const [caseData, setCaseData] = useState(undefined);
  const [isCaseDetailsLoading, setIsCaseDetailsLoading] = useState(false);
  const [caseApiError, setCaseApiError] = useState(undefined);
  const [lockPrefilledFields, setLockPrefilledFields] = useState(false);
  const firstPopulateDoneRef = useRef(false);
  const [formReady, setFormReady] = useState(false);
  const [requiredSuretyCount, setRequiredSuretyCount] = useState(null);
  const isBreadCrumbsParamsDataSet = useRef(false);
  const [formInstanceNonce, setFormInstanceNonce] = useState(0);
  const latestRaiseTaskRef = useRef(null);
  const persistedRaiseRefKey = useMemo(() => `RAISE_BB_REF_${filingNumber}`, [filingNumber]);
  const hasInitFromDefaultRef = useRef(false);
  const [pendingTaskData, setPendingTaskData] = useState([]);

  const defaultFormValue = useMemo(() => {
    try {
      if (!hasInitFromDefaultRef.current && defaultFormValueData && Object.keys(defaultFormValueData).length > 0) {
        return convertToFormData(t, defaultFormValueData);
      }
    } catch (e) {}
    return undefined;
  }, [defaultFormValueData, t]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(persistedRaiseRefKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          latestRaiseTaskRef.current = parsed;
        }
      }
    } catch (_) {}
  }, [persistedRaiseRefKey]);

  const { BreadCrumbsParamsData, setBreadCrumbsParamsData } = useContext(BreadCrumbsParamsDataContext);
  const { caseId: caseIdFromBreadCrumbs, filingNumber: filingNumberFromBreadCrumbs } = BreadCrumbsParamsData;
  const courtId = localStorage.getItem("courtId");

  const fetchCaseDetails = async () => {
    try {
      setIsCaseDetailsLoading(true);
      const caseData = await DRISTIService.searchCaseService(
        {
          criteria: [
            {
              filingNumber: filingNumber,
              ...(courtId && { courtId }),
            },
          ],
          tenantId,
        },
        {}
      );
      const caseId = caseData?.criteria?.[0]?.responseList?.[0]?.id;
      setCaseData(caseData);
      // Only update breadcrumb data if it's different from current and hasn't been set yet
      if (!(caseIdFromBreadCrumbs === caseId && filingNumberFromBreadCrumbs === filingNumber) && !isBreadCrumbsParamsDataSet.current) {
        setBreadCrumbsParamsData({
          caseId,
          filingNumber,
        });
        isBreadCrumbsParamsDataSet.current = true;
      }
    } catch (err) {
      setCaseApiError(err);
    } finally {
      setIsCaseDetailsLoading(false);
    }
  };

  // Fetch case details on component mount
  useEffect(() => {
    fetchCaseDetails();
  }, [courtId]);

  const [isAligning, setIsAligning] = useState(true);

  useEffect(() => {
    const prefillFromPendingTask = async () => {
      try {
        if (bailBondId || !filingNumber || !tenantId) return;
        const userInfo = Digit?.UserService?.getUser()?.info;
        const isCitizen = userInfo?.type === "CITIZEN";
        const roles = (userInfo?.roles || []).map((r) => r.code);

        const pendingTaskRes = await HomeService.getPendingTaskService(
          {
            SearchCriteria: {
              tenantId,
              moduleName: "Pending Tasks Service",
              moduleSearchCriteria: {
                isCompleted: false,
                ...(isCitizen ? { assignedTo: userInfo?.uuid } : { assignedRole: [...roles] }),
                ...(courtId && { courtId }),
                filingNumber,
                entityType: "bail bond",
              },
              limit: 1000,
              offset: 0,
            },
          },
          { tenantId }
        );

        const tasks = Array.isArray(pendingTaskRes?.data) ? pendingTaskRes.data : [];
        const raiseTasks = tasks.filter((t) => {
          const status = t?.fields?.find((f) => f.key === "status")?.value;
          const name = t?.fields?.find((f) => f.key === "name")?.value || "";
          const entityType = t?.fields?.find((f) => f.key === "entityType")?.value || "";
          return (status === "PENDING_RAISE_BAIL_BOND" || /raise bail bond/i.test(name)) && /bail bond/i.test(entityType);
        });

        if (!raiseTasks.length) return;

        const latest = raiseTasks
          .map((t) => ({
            task: t,
            createdTime: t?.fields?.find((f) => f.key === "createdTime")?.value || 0,
          }))
          .sort((a, b) => (b.createdTime || 0) - (a.createdTime || 0))?.[0]?.task;

        if (!latest) return;

        const getField = (k) => latest?.fields?.find((f) => f.key === k)?.value;
        const additionalDetailsObj = getField("additionalDetails");
        const firstDefined = (...vals) => {
          for (let i = 0; i < vals.length; i++) {
            if (vals[i] !== undefined && vals[i] !== null) return vals[i];
          }
          return undefined;
        };
        const bailAmount = firstDefined(
          getField("additionalDetails.bailAmount"),
          getField("additionalDetails.chequeAmount"),
          getField("additionalDetails.amount"),
          additionalDetailsObj && firstDefined(additionalDetailsObj.bailAmount, additionalDetailsObj.chequeAmount, additionalDetailsObj.amount)
        );
        const bailTypeRaw = firstDefined(
          getField("additionalDetails.bailType"),
          additionalDetailsObj && (additionalDetailsObj.bailType?.code || additionalDetailsObj.bailType?.type || additionalDetailsObj.bailType),
          getField("additionalDetails.bailType.code"),
          getField("additionalDetails.bailType.type"),
          getField("bailType"),
          getField("bailTypeCode"),
          getField("bail_type")
        );
        const addSuretyPending = firstDefined(
          getField("additionalDetails.addSurety"),
          additionalDetailsObj && additionalDetailsObj.addSurety,
          getField("addSurety")
        );
        const refApplicationId = firstDefined(
          getField("additionalDetails.refApplicationId"),
          additionalDetailsObj && additionalDetailsObj.refApplicationId
        );
        const noOfSureties = firstDefined(getField("additionalDetails.noOfSureties"), additionalDetailsObj && additionalDetailsObj.noOfSureties);

        const mappedDefaults = {};
        const parseAmount = (val) => {
          if (typeof val === "number") return val;
          if (typeof val === "string") {
            const sanitized = val.replace(/[,\s]/g, "").replace(/[^0-9.]/g, "");
            const num = parseFloat(sanitized);
            return isNaN(num) ? undefined : num;
          }
          return undefined;
        };
        if (bailAmount != null && bailAmount !== "") {
          const num = parseAmount(bailAmount);
          if (!isNaN(num)) mappedDefaults.bailAmount = num;
        }
        if (bailTypeRaw || addSuretyPending) {
          const code = bailTypeRaw ? String(bailTypeRaw).toUpperCase() : String(addSuretyPending).toUpperCase() === "YES" ? "SURETY" : "PERSONAL";
          mappedDefaults.bailType = {
            code,
            name: t(code),
            showSurety: code === "SURETY",
          };
        }

        if (Object.keys(mappedDefaults).length > 0) {
          setDefaultFormValueData((prev) => ({
            ...(prev || {}),
            ...mappedDefaults,
            ...(refApplicationId ? { refApplicationId } : {}),
            additionalDetails: {
              ...((prev && prev.additionalDetails) || {}),
              ...(refApplicationId ? { refApplicationId } : {}),
            },
          }));
        }
        try {
          const ptUuid0 = getField("additionalDetails.litigantUuid[0]");
          const ptUuidArr = getField("additionalDetails.litigantUuid");
          const ptUuidAlt = getField("additionalDetails.litigants[0]");
          const ptIndivId = getField("individualId");
          const ptAccusedId = additionalDetailsObj && (additionalDetailsObj.accusedIndividualId || additionalDetailsObj.accusedKey);
          const pendingLitigantUuid = firstDefined(ptAccusedId, ptUuid0, Array.isArray(ptUuidArr) && ptUuidArr[0], ptUuidAlt, ptIndivId);
          const pendingLitigantName = firstDefined(getField("additionalDetails.litigantName"));

          let resolvedName = pendingLitigantName;
          if (!resolvedName && pendingLitigantUuid && caseData?.criteria?.[0]?.responseList?.[0]?.litigants) {
            const cLit = (caseData.criteria[0].responseList[0].litigants || []).find(
              (l) => String(l?.individualId) === String(pendingLitigantUuid) || String(l?.additionalDetails?.uuid) === String(pendingLitigantUuid)
            );
            resolvedName = cLit?.additionalDetails?.fullName || cLit?.name;
          }

          if (pendingLitigantUuid || resolvedName) {
            const petitioner = {
              uuid: pendingLitigantUuid || "",
              name: resolvedName || "",
              code: resolvedName || "",
            };
            targetPetitionerRef.current = petitioner.uuid || petitioner.name || null;
            setDefaultFormValueData((prev) => ({ ...(prev || {}), selectComplainant: petitioner }));
            setFormdata((prev) => ({ ...(prev || {}), selectComplainant: petitioner }));
            if (typeof setFormDataValue?.current === "function") setFormDataValue.current("selectComplainant", petitioner);
          }
        } catch (e) {}

        const hasExistingSureties = Array.isArray(formdata?.sureties) && formdata.sureties.length > 0;
        if (!hasExistingSureties && mappedDefaults?.bailType?.code === "SURETY" && noOfSureties) {
          const count = typeof noOfSureties === "number" ? noOfSureties : parseInt(noOfSureties, 10);
          if (!isNaN(count) && count > 0) {
            setRequiredSuretyCount(count);
            const emptySureties = Array.from({ length: count }, () => ({}));
            mappedDefaults.sureties = emptySureties;
            mappedDefaults.noOfSureties = count;
            try {
              if (typeof setFormDataValue?.current === "function") setFormDataValue.current("sureties", emptySureties);
              if (typeof setFormDataValue?.current === "function") setFormDataValue.current("noOfSureties", count);
            } catch (e) {}
          }
        }

        if (noOfSureties) {
          const count = typeof noOfSureties === "number" ? noOfSureties : parseInt(noOfSureties, 10);
          if (!isNaN(count) && count > 0) {
            mappedDefaults.noOfSureties = count;
            try {
              if (typeof setFormDataValue?.current === "function") setFormDataValue.current("noOfSureties", count);
            } catch (e) {}
          }
        }

        if (typeof resetFormData?.current === "function") {
          try {
            const base = { ...(defaultFormValue || {}), ...(formdata || {}), ...mappedDefaults };
            resetFormData.current(base);
            if (typeof clearFormDataErrors?.current === "function") clearFormDataErrors.current();
          } catch (e) {}
        }

        if (refApplicationId) {
          try {
            const appSearchPayload = {
              criteria: {
                filingNumber: filingNumber,
                tenantId: tenantId,
                ...(courtId && { courtId }),
                applicationNumber: refApplicationId,
              },
              tenantId: tenantId,
            };
            const appRes = await submissionService.searchApplication(appSearchPayload, {});
            const application = Array.isArray(appRes?.applicationList) ? appRes.applicationList[0] : null;
            if (application) {
              const appDetails = application?.applicationDetails || {};
              const formdataFromApp = application?.additionalDetails?.formdata || {};
              const addSuretyFromDetails = appDetails?.addSurety;
              const addSuretyFromForm =
                formdataFromApp && formdataFromApp.addSurety && formdataFromApp.addSurety.code != null
                  ? formdataFromApp.addSurety.code
                  : formdataFromApp && formdataFromApp.addSurety;
              const addSurety = firstDefined(addSuretyFromDetails, addSuretyFromForm);

              const isSuretyFromAdd = (() => {
                const v = addSurety;
                if (typeof v === "boolean") return v;
                if (typeof v === "number") return v === 1;
                const s = String(v || "")
                  .trim()
                  .toUpperCase();
                return s === "YES" || s === "TRUE" || s === "1" || s === "Y";
              })();

              const finalBailTypeCode = bailTypeRaw ? String(bailTypeRaw).toUpperCase() : isSuretyFromAdd ? "SURETY" : "PERSONAL";
              const finalBailType = {
                code: finalBailTypeCode,
                name: t(finalBailTypeCode),
                showSurety: finalBailTypeCode === "SURETY",
              };

              let mappedSureties;
              let appSuretyCount = null;
              if (finalBailTypeCode === "SURETY") {
                const suretiesFromDetails = Array.isArray(appDetails?.sureties) ? appDetails.sureties : undefined;
                const suretiesFromForm = Array.isArray(formdataFromApp?.sureties) ? formdataFromApp.sureties : undefined;
                const sourceSureties = suretiesFromDetails || suretiesFromForm || [];
                const add = application?.additionalDetails || {};
                const rawCnt = add.noOfSureties;
                const parsedCnt = typeof rawCnt === "number" ? rawCnt : parseInt(rawCnt, 10);
                appSuretyCount =
                  Number.isFinite(parsedCnt) && parsedCnt > 0 ? parsedCnt : Array.isArray(sourceSureties) ? sourceSureties.length : null;

                const appLevelDocs = Array.isArray(appDetails?.applicationDocuments) ? appDetails.applicationDocuments : [];
                const appLevelIdProofDocs = appLevelDocs
                  .filter((d) => d?.documentType === "IDENTITY_PROOF")
                  .map((d) => ({
                    fileStore: d?.fileStore,
                    documentType: "IDENTITY_PROOF",
                    documentName: d?.documentTitle || "identityProof.pdf",
                    tenantId,
                  }));
                const appLevelSolvencyDocs = appLevelDocs
                  .filter((d) => d?.documentType === "PROOF_OF_SOLVENCY")
                  .map((d) => ({
                    fileStore: d?.fileStore,
                    documentType: "PROOF_OF_SOLVENCY",
                    documentName: d?.documentTitle || "proofOfSolvency.pdf",
                    tenantId,
                  }));

                mappedSureties = sourceSureties.map((s) => {
                  const perSuretyDocs = Array.isArray(s?.documents) ? s.documents : [];
                  const perIdDocs = perSuretyDocs
                    .filter((d) => d?.documentType === "IDENTITY_PROOF")
                    .map((d) => ({
                      fileStore: d?.fileStore,
                      documentType: "IDENTITY_PROOF",
                      documentName: d?.documentName || d?.documentTitle || "identityProof.pdf",
                      isActive: true,
                      tenantId,
                    }));
                  const perSolDocs = perSuretyDocs
                    .filter((d) => d?.documentType === "PROOF_OF_SOLVENCY")
                    .map((d) => ({
                      fileStore: d?.fileStore,
                      documentType: "PROOF_OF_SOLVENCY",
                      documentName: d?.documentName || d?.documentTitle || "proofOfSolvency.pdf",
                      isActive: true,
                      tenantId,
                    }));
                  const useAppLevelForThisSurety = sourceSureties.length === 1 && perSuretyDocs.length === 0;

                  return {
                    name: s?.name || "",
                    fatherName: s?.fatherName || "",
                    mobileNumber: s?.mobileNumber || "",
                    address: s?.address || {},
                    email: s?.email || "",
                    identityProof: { document: perIdDocs.length ? perIdDocs : useAppLevelForThisSurety ? appLevelIdProofDocs : [] },
                    proofOfSolvency: { document: perSolDocs.length ? perSolDocs : useAppLevelForThisSurety ? appLevelSolvencyDocs : [] },
                    otherDocuments: { document: [] },
                    documents: [...perIdDocs, ...perSolDocs, ...(useAppLevelForThisSurety ? [...appLevelIdProofDocs, ...appLevelSolvencyDocs] : [])],
                  };
                });
              }
              const applicantSel = formdataFromApp?.selectComplainant;
              const fatherNameFromDetails = appDetails?.litigantFatherName;
              const fatherNameFromForm = formdataFromApp?.litigantFatherName;
              const finalFatherName = firstDefined(fatherNameFromDetails, fatherNameFromForm);

              const patch = {
                bailType: finalBailType,
                ...(finalBailTypeCode === "SURETY" && Array.isArray(mappedSureties) && mappedSureties.length
                  ? { sureties: mappedSureties }
                  : { sureties: [] }),
                ...(finalBailTypeCode === "SURETY" && appSuretyCount ? { noOfSureties: appSuretyCount } : {}),
                ...(applicantSel
                  ? { selectComplainant: { code: applicantSel?.code || applicantSel?.name, name: applicantSel?.name, uuid: applicantSel?.uuid } }
                  : {}),
                ...(finalFatherName ? { litigantFatherName: finalFatherName } : {}),
              };
              if (applicantSel?.uuid) targetPetitionerRef.current = applicantSel.uuid;

              setDefaultFormValueData((prev) => ({
                ...(prev || {}),
                ...patch,
                ...(refApplicationId ? { refApplicationId } : {}),
                additionalDetails: { ...((prev && prev.additionalDetails) || {}), ...(refApplicationId ? { refApplicationId } : {}) },
              }));
              setFormdata((prev) => ({ ...(prev || {}), ...patch }));
              setLockPrefilledFields(true);
              try {
                if (typeof setFormDataValue?.current === "function") {
                  if (patch?.bailType?.code) setFormDataValue.current("bailType", patch.bailType);
                  if (finalBailTypeCode === "SURETY") setFormDataValue.current("sureties", patch.sureties || []);
                  if (finalBailTypeCode === "PERSONAL") setFormDataValue.current("sureties", []);
                  if (finalBailTypeCode === "SURETY" && appSuretyCount) setFormDataValue.current("noOfSureties", appSuretyCount);
                  if (patch?.selectComplainant) setFormDataValue.current("selectComplainant", patch.selectComplainant);
                  if (patch?.litigantFatherName != null) setFormDataValue.current("litigantFatherName", patch.litigantFatherName);
                }
              } catch (e) {}

              if (typeof resetFormData?.current === "function") {
                try {
                  const base = { ...(defaultFormValue || {}), ...(formdata || {}), ...patch };
                  resetFormData.current(base);
                  if (typeof clearFormDataErrors?.current === "function") clearFormDataErrors.current();
                } catch (e) {}
              }
            }
          } catch (appErr) {}
        }
      } catch (err) {}
    };

    prefillFromPendingTask();
  }, [bailBondId, filingNumber, tenantId, courtId]);

  useEffect(() => {
    try {
      const need = Number(requiredSuretyCount) > 0 ? Number(requiredSuretyCount) : null;
      const isSurety = (formdata?.bailType?.code || "").toUpperCase() === "SURETY";
      if (hasClearedRef.current && !isSurety) return;
      if (!need || !isSurety) return;
      const current = Array.isArray(formdata?.sureties) ? [...formdata.sureties] : [];
      let changed = false;
      while (current.length < need) {
        current.push({});
        changed = true;
      }
      if (changed) {
        if (typeof setFormDataValue?.current === "function") setFormDataValue.current("sureties", current);
        setFormdata((prev) => ({ ...(prev || {}), sureties: current }));
      }
    } catch (e) {}
  }, [requiredSuretyCount, formdata?.bailType?.code, formdata?.sureties]);

  const { data: bailBond, isLoading: isBailBondLoading } = useSearchBailBondService(
    {
      criteria: {
        bailId: bailBondId,
      },
      tenantId,
    },
    {},
    `bail-bond-details-${bailBondId}`,
    Boolean(bailBondId && filingNumber)
  );

  const getUserUUID = useCallback(
    async (uuid) => {
      const individualData = await window?.Digit.DRISTIService.searchIndividualUser(
        {
          Individual: {
            userUuid: [uuid],
          },
        },
        { tenantId, limit: 1000, offset: 0 }
      );
      return individualData;
    },
    [tenantId]
  );

  const caseDetails = useMemo(() => {
    return caseData?.criteria?.[0]?.responseList?.[0];
  }, [caseData]);

  const caseCourtId = useMemo(() => caseDetails?.courtId, [caseDetails]);

  const bailBondDetails = useMemo(() => {
    // TODO: check if we need to prioritize defaultFormValueData over bailBond else remove commented code
    // if (Object.keys(defaultFormValueData).length > 0) {
    //   return defaultFormValueData;
    // }
    return bailBond?.bails?.[0];
  }, [defaultFormValueData, bailBond]);

  const pipComplainants = useMemo(() => {
    return caseDetails?.litigants
      ?.filter((litigant) => litigant.partyType.includes("complainant"))
      ?.filter(
        (litigant) =>
          !caseDetails?.representatives?.some((representative) =>
            representative?.representing?.some((rep) => rep?.individualId === litigant?.individualId)
          )
      );
  }, [caseDetails]);

  const pipAccuseds = useMemo(() => {
    return caseDetails?.litigants
      ?.filter((litigant) => litigant.partyType.includes("respondent"))
      ?.filter(
        (litigant) =>
          !caseDetails?.representatives?.some((representative) =>
            representative?.representing?.some((rep) => rep?.individualId === litigant?.individualId)
          )
      );
  }, [caseDetails]);

  const complainantsList = useMemo(() => {
    const loggedinUserUuid = userInfo?.uuid;
    const isAdvocateLoggedIn = caseDetails?.representatives?.find((rep) => rep?.additionalDetails?.uuid === loggedinUserUuid);
    const isPipLoggedIn = pipComplainants?.find((p) => p?.additionalDetails?.uuid === loggedinUserUuid);
    const accusedLoggedIn = pipAccuseds?.find((p) => p?.additionalDetails?.uuid === loggedinUserUuid);

    if (isAdvocateLoggedIn) {
      return isAdvocateLoggedIn?.representing?.map((r) => {
        return {
          code: r?.additionalDetails?.fullName,
          name: r?.additionalDetails?.fullName,
          uuid: r?.additionalDetails?.uuid,
        };
      });
    } else if (isPipLoggedIn) {
      return [
        {
          code: isPipLoggedIn?.additionalDetails?.fullName,
          name: isPipLoggedIn?.additionalDetails?.fullName,
          uuid: isPipLoggedIn?.additionalDetails?.uuid,
        },
      ];
    } else if (accusedLoggedIn) {
      return [
        {
          code: accusedLoggedIn?.additionalDetails?.fullName,
          name: accusedLoggedIn?.additionalDetails?.fullName,
          uuid: accusedLoggedIn?.additionalDetails?.uuid,
        },
      ];
    }
    const allLitigants = caseDetails?.litigants || [];
    const options = allLitigants
      .map((l) => {
        const name = l?.additionalDetails?.fullName || l?.name || l?.litigantName || l?.individualName || "";
        const uuid = l?.additionalDetails?.uuid || l?.individualId || l?.uuid || l?.id || "";
        return name && uuid
          ? {
              code: name,
              name,
              uuid,
            }
          : null;
      })
      .filter(Boolean);
    return options;
  }, [caseDetails, pipComplainants, pipAccuseds, userInfo]);

  useEffect(() => {
    const normalize = (v) =>
      typeof v === "string"
        ? v
            .trim()
            .replace(/\s+/g, " ")
            .replace(/[^\w\s]/g, "")
            .toLowerCase()
        : v;

    if (!Array.isArray(complainantsList) || complainantsList.length === 0) {
      return;
    }

    if (alignedOnceRef.current) {
      if (isAligning) setIsAligning(false);
      return;
    }

    const target =
      targetPetitionerRef?.current || formdata?.selectComplainant?.uuid || formdata?.selectComplainant?.name || formdata?.selectComplainant?.code;
    if (!target) {
      if (complainantsList.length === 1) {
        const only = complainantsList[0];
        requestAnimationFrame(() => {
          if (typeof setFormDataValue?.current === "function") setFormDataValue.current("selectComplainant", only);
          setFormdata((p) => ({ ...(p || {}), selectComplainant: only }));
          setDefaultFormValueData((p) => ({ ...(p || {}), selectComplainant: only }));
          alignedOnceRef.current = true;
          setIsAligning(false);
        });
      }
      return;
    }

    const targetNorm = normalize(target);
    let match = null;

    match = complainantsList.find((o) => {
      if (!o) return false;
      const oUuid = o.uuid || o.individualId || o.id || o?.additionalDetails?.uuid || "";
      if (oUuid && String(oUuid) === String(target)) return true;
      return false;
    });

    if (!match) {
      match = complainantsList.find((o) => {
        if (!o) return false;
        const code = o.code || o.name || "";
        if (code && String(code) === String(target)) return true;
        return false;
      });
    }

    if (!match) {
      match = complainantsList.find((o) => {
        const oname = o?.name || o?.code || "";
        return oname && normalize(oname) === targetNorm;
      });
    }

    if (!match) {
      match = complainantsList.find((o) => {
        const oname = o?.name || o?.code || "";
        const onorm = normalize(oname);
        if (!onorm) return false;
        return (
          targetNorm && (onorm.includes(targetNorm) || targetNorm.includes(onorm) || onorm.startsWith(targetNorm) || targetNorm.startsWith(onorm))
        );
      });
    }

    if (!match && complainantsList.length === 1) match = complainantsList[0];

    if (!match) {
      return;
    }

    const alreadySame =
      formdata?.selectComplainant &&
      (formdata.selectComplainant.uuid === match.uuid || normalize(formdata.selectComplainant.name) === normalize(match.name));

    if (alreadySame) {
      alignedOnceRef.current = true;
      setIsAligning(false);
      return;
    }

    requestAnimationFrame(() => {
      if (typeof setFormDataValue?.current === "function") {
        setFormDataValue.current("selectComplainant", match);
      }
      setFormdata((p) => ({ ...(p || {}), selectComplainant: match }));
      setDefaultFormValueData((p) => ({ ...(p || {}), selectComplainant: match }));
      alignedOnceRef.current = true;
      setIsAligning(false);
    });
  }, [
    complainantsList?.length,
    targetPetitionerRef?.current,
    formdata?.selectComplainant?.uuid,
    formdata?.selectComplainant?.name,
    formdata?.selectComplainant?.code,
  ]);
  useEffect(() => {
    try {
      if (fromPendingTask) return;
      const hasSingle = Array.isArray(complainantsList) && complainantsList.length === 1;
      if (!hasSingle) return;
      const currentSel = formdata?.selectComplainant;
      if (currentSel && (currentSel?.uuid || currentSel?.name)) return;
      const single = complainantsList[0];
      if (typeof setFormDataValue?.current === "function") setFormDataValue.current("selectComplainant", single);
      setFormdata((p) => ({ ...(p || {}), selectComplainant: single }));
      setLockPrefilledFields(true);
    } catch (e) {}
  }, [fromPendingTask, complainantsList, formdata?.selectComplainant?.uuid, formdata?.selectComplainant?.name]);

  // Prefill from matching pending task when the accused is selected (fresh path without application)
  useEffect(() => {
    const run = async () => {
      try {
        const sel = formdata?.selectComplainant || defaultFormValueData?.selectComplainant;
        const selectedUuid = sel?.uuid || sel?.individualId || sel?.id || sel?.code || sel?.name;
        if (!selectedUuid || !filingNumber || !tenantId) return;

        const userInfo = Digit?.UserService?.getUser()?.info;
        const isCitizen = userInfo?.type === "CITIZEN";
        const roles = (userInfo?.roles || []).map((r) => r.code);

        const pendingTaskRes = await HomeService.getPendingTaskService(
          {
            SearchCriteria: {
              tenantId,
              moduleName: "Pending Tasks Service",
              moduleSearchCriteria: {
                isCompleted: false,
                ...(isCitizen ? { assignedTo: userInfo?.uuid } : { assignedRole: [...roles] }),
                ...(courtId && { courtId }),
                filingNumber,
                entityType: "bail bond",
              },
              limit: 1000,
              offset: 0,
            },
          },
          { tenantId }
        );

        const tasks = Array.isArray(pendingTaskRes?.data) ? pendingTaskRes.data : [];
        setPendingTaskData(tasks);
        const raiseTasks = tasks.filter((t) => {
          const status = t?.fields?.find((f) => f.key === "status")?.value;
          const name = t?.fields?.find((f) => f.key === "name")?.value || "";
          const entityType = t?.fields?.find((f) => f.key === "entityType")?.value || "";
          return (status === "PENDING_RAISE_BAIL_BOND" || /raise bail bond/i.test(name)) && /bail bond/i.test(entityType);
        });

        if (!raiseTasks.length) return;
        const findField = (task, k) => task?.fields?.find((f) => f.key === k)?.value;
        const matched = raiseTasks.find((t) => {
          const add = findField(t, "additionalDetails") || {};
          const accusedId = add?.accusedIndividualId || add?.accusedKey || findField(t, "individualId") || null;
          return accusedId && String(accusedId) === String(selectedUuid);
        });
        const targetTask = matched || null;
        if (!targetTask) return;

        const getField = (k) => targetTask?.fields?.find((f) => f.key === k)?.value;
        const additionalDetailsObj = getField("additionalDetails");
        const firstDefined = (...vals) => {
          for (let i = 0; i < vals.length; i++) {
            if (vals[i] !== undefined && vals[i] !== null) return vals[i];
          }
          return undefined;
        };
        const bailAmount = firstDefined(
          getField("additionalDetails.bailAmount"),
          getField("additionalDetails.chequeAmount"),
          getField("additionalDetails.amount"),
          additionalDetailsObj && firstDefined(additionalDetailsObj.bailAmount, additionalDetailsObj.chequeAmount, additionalDetailsObj.amount)
        );
        const bailTypeRaw = firstDefined(
          getField("additionalDetails.bailType"),
          additionalDetailsObj && (additionalDetailsObj.bailType?.code || additionalDetailsObj.bailType?.type || additionalDetailsObj.bailType),
          getField("additionalDetails.bailType.code"),
          getField("additionalDetails.bailType.type"),
          getField("bailType"),
          getField("bailTypeCode"),
          getField("bail_type")
        );
        const noOfSureties = firstDefined(getField("additionalDetails.noOfSureties"), additionalDetailsObj && additionalDetailsObj.noOfSureties);

        const mappedDefaults = {};
        const parseAmount = (val) => {
          if (typeof val === "number") return val;
          if (typeof val === "string") {
            const sanitized = val.replace(/[\,\s]/g, "").replace(/[^0-9.]/g, "");
            const num = parseFloat(sanitized);
            return isNaN(num) ? undefined : num;
          }
          return undefined;
        };
        if (bailAmount != null && bailAmount !== "") {
          const num = parseAmount(bailAmount);
          if (!isNaN(num)) mappedDefaults.bailAmount = num;
        }
        // eslint-disable-next-line no-undef
        if (bailTypeRaw || addSuretyPending !== undefined) {
          const isSuretyFromAdd = (() => {
            // eslint-disable-next-line no-undef
            const v = addSuretyPending;
            if (typeof v === "boolean") return v;
            if (typeof v === "number") return v === 1;
            const s = String(v || "")
              .trim()
              .toUpperCase();
            return s === "YES" || s === "TRUE" || s === "1" || s === "Y";
          })();
          const code = bailTypeRaw ? String(bailTypeRaw).toUpperCase() : isSuretyFromAdd ? "SURETY" : "PERSONAL";
          mappedDefaults.bailType = { code, name: t(code), showSurety: code === "SURETY" };
        }
        if (noOfSureties) {
          const cnt = typeof noOfSureties === "number" ? noOfSureties : parseInt(noOfSureties, 10);
          if (!isNaN(cnt) && cnt > 0) mappedDefaults.noOfSureties = cnt;
        }

        if (Object.keys(mappedDefaults).length > 0) {
          setDefaultFormValueData((prev) => ({ ...(prev || {}), ...mappedDefaults }));
          setFormdata((prev) => ({ ...(prev || {}), ...mappedDefaults }));
          try {
            if (typeof setFormDataValue?.current === "function") {
              if (mappedDefaults?.bailType) setFormDataValue.current("bailType", mappedDefaults.bailType);
              if (mappedDefaults?.bailAmount != null) setFormDataValue.current("bailAmount", mappedDefaults.bailAmount);
              if (mappedDefaults?.noOfSureties != null) setFormDataValue.current("noOfSureties", mappedDefaults.noOfSureties);
            }
          } catch (e) {}
        }
      } catch (_) {}
    };
    run();
  }, [formdata?.selectComplainant, defaultFormValueData?.selectComplainant, filingNumber, tenantId, courtId, t]);

  const modifiedFormConfig = useMemo(() => {
    const updatedConfig = bailBondConfig
      .filter((config) => {
        const dependentKeys = config?.dependentKey;
        if (!dependentKeys) {
          return config;
        }
        let show = true;
        for (const key in dependentKeys) {
          const nameArray = dependentKeys[key];
          for (const name of nameArray) {
            if (Array.isArray(formdata?.[key]?.[name]) && formdata?.[key]?.[name]?.length === 0) {
              show = false;
            } else show = show && Boolean(formdata?.[key]?.[name]);
          }
        }
        return show && config;
      })
      .map((config) => {
        const mappedBody = (config?.body || []).map((body) => {
          if (body?.populators?.validation) {
            const customValidations =
              Digit?.Customizations?.[body.populators?.validation?.pattern?.masterName]?.[body.populators?.validation?.pattern?.moduleName];
            if (typeof customValidations === "function") {
              const patternType = body.populators.validation.pattern.patternType;
              const message = body.populators.validation.pattern.message;
              body.populators.validation = {
                ...body.populators.validation,
                pattern: { value: customValidations(patternType), message },
              };
            }
          }
          if (body?.key === "selectComplainant") {
            const options = Array.isArray(complainantsList) ? [...complainantsList] : [];
            const defaultSel =
              (defaultFormValueData?.selectComplainant && {
                uuid: defaultFormValueData?.selectComplainant?.uuid,
                name: defaultFormValueData?.selectComplainant?.name,
                code: defaultFormValueData?.selectComplainant?.code || defaultFormValueData?.selectComplainant?.name,
              }) ||
              undefined;
            const singlePetitioner = Array.isArray(options) && options.length === 1;
            const autoSingleSel = !fromPendingTask && singlePetitioner ? options[0] : undefined;
            const sel = formdata?.selectComplainant || defaultSel || autoSingleSel;
            if (sel) {
              const exists = options.find(
                (o) => (o?.uuid && sel?.uuid && String(o.uuid) === String(sel.uuid)) || (o?.name && sel?.name && o.name === sel.name)
              );
              if (!exists) options.unshift(sel);
            }
            body.populators.options = options;
            const hasSelected = Boolean(sel?.uuid || sel?.name);
            const shouldDisable = fromPendingTask
              ? hasSelected
              : singlePetitioner
              ? hasSelected
              : !isAligning && alignedOnceRef.current && hasSelected;
            return { ...body, disable: shouldDisable };
          }
          if (body?.key === "litigantFatherName") {
            const prefilledFather = Boolean(defaultFormValueData?.litigantFatherName);
            if (lockPrefilledFields && !hasClearedRef.current && prefilledFather) {
              return { ...body, disable: true };
            }
          }
          if (body?.key === "bailType" && lockPrefilledFields && !hasClearedRef.current && !!formdata?.bailType?.code) {
            return { ...body, disable: true };
          }
          if (
            body?.key === "bailAmount" &&
            lockPrefilledFields &&
            !hasClearedRef.current &&
            typeof formdata?.bailAmount === "number" &&
            !Number.isNaN(formdata?.bailAmount)
          ) {
            return { ...body, disable: true };
          }
          if (body?.key === "noOfSureties") {
            const isSurety = (formdata?.bailType?.code || "").toUpperCase() === "SURETY";
            const add = (defaultFormValueData && (defaultFormValueData.additionalDetails || defaultFormValueData)) || {};
            const fallbackRaw = add.noOfSureties;
            const fallbackCount = Number.isFinite(parseInt(fallbackRaw, 10)) && parseInt(fallbackRaw, 10) > 0 ? parseInt(fallbackRaw, 10) : null;
            const need = Number(requiredSuretyCount) > 0 ? Number(requiredSuretyCount) : fallbackCount;
            const hideInForm = hasClearedRef.current || !(isSurety && need);
            if (hideInForm) {
              return { __hide: true };
            }
            return { ...body, hideInForm, disable: true, populators: { ...(body.populators || {}), hideInForm } };
          }
          if (body?.key === "sureties") {
            return { ...body, lockPrefilledFields: lockPrefilledFields && !hasClearedRef.current };
          }
          return {
            ...body,
          };
        });
        return { ...config, body: mappedBody.filter((b) => !b?.__hide) };
      });
    return updatedConfig;
  }, [
    complainantsList,
    formdata,
    lockPrefilledFields,
    fromPendingTask,
    isAligning,
    defaultFormValueData?.selectComplainant,
    defaultFormValueData,
    requiredSuretyCount,
    formInstanceNonce,
  ]);
  const formInstanceKey = useMemo(() => {
    const complCount = Array.isArray(complainantsList) ? complainantsList.length : 0;
    return [String(filingNumber || "new"), complCount, formInstanceNonce].join("-");
  }, [filingNumber, complainantsList, formInstanceNonce]);
  useEffect(() => {
    const sel = defaultFormValue?.selectComplainant || formdata?.selectComplainant;
    if (sel && typeof setFormDataValue?.current === "function") {
      setTimeout(() => {
        try {
          setFormDataValue.current("selectComplainant", sel);
        } catch (e) {}
      }, 0);
    }
  }, [formInstanceKey]);
  useEffect(() => {
    try {
      if (!fromPendingTask) return;
      const hasSel = !!(formdata?.selectComplainant?.uuid || formdata?.selectComplainant?.name);
      if (hasSel) return;
      const options = Array.isArray(complainantsList) ? complainantsList : [];
      if (!options.length) return;
      const targetUuid = defaultFormValueData?.litigantId || caseDetails?.litigantId;
      const targetName = defaultFormValueData?.litigantName || caseDetails?.litigantName;
      const norm = (v) => (typeof v === "string" ? v.trim().toLowerCase() : v);
      let match = undefined;
      if (targetUuid) match = options.find((o) => String(o?.uuid) === String(targetUuid));
      if (!match && targetName) match = options.find((o) => norm(o?.name || o?.code) === norm(targetName));
      if (!match && options.length === 1) match = options[0];
      if (match) {
        if (typeof setFormDataValue?.current === "function") setFormDataValue.current("selectComplainant", match);
        setFormdata((p) => ({ ...(p || {}), selectComplainant: match }));
        setLockPrefilledFields(true);
      }
    } catch (e) {}
  }, [fromPendingTask, complainantsList, defaultFormValueData, caseDetails, formdata?.selectComplainant]);

  const onFormValueChange = (setValue, formData, formState, reset, setError, clearErrors, trigger, getValues) => {
    const amt = formData?.bailAmount;
    const isEmptyAmt = amt === "" || amt === null || amt === undefined;
    const parsedAmt = typeof amt === "number" ? amt : parseFloat(String(amt == null ? "" : amt).replace(/[\s,]/g, ""));
    const hasAmtError = Object.keys(formState?.errors || {}).includes("bailAmount");
    if (isEmptyAmt) {
      if (hasAmtError) clearErrors("bailAmount");
    } else if (!Number.isNaN(parsedAmt) && parsedAmt <= 0 && !hasAmtError) {
      setError("bailAmount", { message: t("Must be greater than zero") });
    } else if (!Number.isNaN(parsedAmt) && parsedAmt > 0 && hasAmtError) {
      clearErrors("bailAmount");
    }

    // Enforce name pattern for litigantFatherName explicitly to ensure it remains validated after clear
    // try {
    //   const namePattern = window?.Digit?.Utils?.getPattern ? window?.Digit?.Utils?.getPattern("Name") : null;
    //   const value = formData?.litigantFatherName;
    //   const hasErrorKey = Object.keys(formState?.errors || {}).includes("litigantFatherName");
    //   if (typeof value === "string") {
    //     const isEmpty = /^\s*$/.test(value);
    //     const isValid = namePattern ? new RegExp(namePattern).test(value) : true;
    //     if (!isEmpty && !isValid && !hasErrorKey) {
    //       setError("litigantFatherName", { message: t("CORE_COMMON_APPLICANT_NAME_INVALID") });
    //     } else if ((isEmpty || isValid) && hasErrorKey) {
    //       clearErrors("litigantFatherName");
    //     }
    //   }
    // } catch (e) {}
    if (formData?.bailType?.code === "SURETY") {
      const sureties = Array.isArray(formData?.sureties) ? formData.sureties : [];
      const hasPrefilledSureties =
        (Array.isArray(defaultFormValueData?.sureties) && defaultFormValueData.sureties.length > 0) ||
        (Array.isArray(formdata?.sureties) && formdata.sureties.length > 0);
      if (!hasPrefilledSureties && (!Array.isArray(formData?.sureties) || (Array.isArray(formData?.sureties) && formData.sureties.length === 0))) {
        try {
          setValue("sureties", [{}], { shouldValidate: false, shouldDirty: true });
          if (!(typeof formData?.noOfSureties === "number" && formData.noOfSureties > 0)) {
            setValue("noOfSureties", 1, { shouldValidate: false, shouldDirty: false });
          }
        } catch (_) {}
      }
      if (sureties.length > 0 && !Object.keys(formState?.errors).includes("sureties")) {
        sureties.forEach((s, index) => {
          if (s?.name && Object.keys(formState?.errors).includes(`name_${index}`)) clearErrors(`name_${index}`);
          if (s?.fatherName && Object.keys(formState?.errors).includes(`fatherName_${index}`)) clearErrors(`fatherName_${index}`);
          if (s?.mobileNumber && Object.keys(formState?.errors).includes(`mobileNumber_${index}`)) clearErrors(`mobileNumber_${index}`);
          const idDocs = s?.identityProof?.uploadedDocs || s?.identityProof?.document || [];
          const solDocs = s?.proofOfSolvency?.uploadedDocs || s?.proofOfSolvency?.document || [];
          if (idDocs?.length && Object.keys(formState?.errors).includes(`identityProof_${index}`)) clearErrors(`identityProof_${index}`);
          if (solDocs?.length && Object.keys(formState?.errors).includes(`proofOfSolvency_${index}`)) clearErrors(`proofOfSolvency_${index}`);
        });
      } else if (sureties.length > 0 && Object.keys(formState?.errors).includes("sureties")) {
        clearErrors("sureties");
      }

      try {
        const add = (defaultFormValueData && (defaultFormValueData.additionalDetails || defaultFormValueData)) || {};
        const fallbackRaw = add.noOfSureties || add.noOfSurities || add.noOfSurety || add.numberOfSureties || add.suretyCount;
        const fallbackCount = Number.isFinite(parseInt(fallbackRaw, 10)) && parseInt(fallbackRaw, 10) > 0 ? parseInt(fallbackRaw, 10) : null;
        const need = Number(requiredSuretyCount) > 0 ? Number(requiredSuretyCount) : fallbackCount;
        const isSurety = (formData?.bailType?.code || "").toUpperCase() === "SURETY";
        if (need && isSurety) {
          if (!requiredSuretyCount && fallbackCount) setRequiredSuretyCount(fallbackCount);
          const current = Array.isArray(sureties) ? [...sureties] : [];
          while (current.length < need) current.push({});
          if (current.length !== (sureties?.length || 0)) {
            setValue("sureties", current, { shouldValidate: false, shouldDirty: true });
          }
          const currNo = formData?.noOfSureties;
          if (currNo !== need) setValue("noOfSureties", need, { shouldValidate: false, shouldDirty: false });
        }
      } catch (e) {}
    }
    if ((formData?.bailType?.code || "").toUpperCase() !== "SURETY") {
      const hasNo = formData?.noOfSureties != null && formData?.noOfSureties !== "";
      if (hasNo) setValue("noOfSureties", "", { shouldValidate: false, shouldDirty: false });
    }
    setIsSubmitDisabled(Object.keys(formState?.errors || {}).length > 0);

    // Do not overwrite prefilled application data before defaults are initialized
    if (hasInitFromDefaultRef.current) {
      if (!isEqual(formdata, formData)) {
        setFormdata(formData);
      }
    }
    try {
      const prevUuid = formdata?.selectComplainant?.uuid;
      const currUuid = formData?.selectComplainant?.uuid;
      const selectionChanged = currUuid && currUuid !== prevUuid;
      if (!fromPendingTask && selectionChanged && !firstPopulateDoneRef.current) {
        prefillFromPendingTaskForPetitioner(currUuid);
        firstPopulateDoneRef.current = true;
      }
    } catch (e) {}
    setFormErrors.current = setError;
    setFormState.current = formState;
    resetFormData.current = reset;
    setFormDataValue.current = setValue;
    clearFormDataErrors.current = clearErrors;
    if (!formReady) setFormReady(true);
  };

  useEffect(() => {
    if (
      formReady &&
      !hasInitFromDefaultRef.current &&
      !bailBondId &&
      defaultFormValueData &&
      Object.keys(defaultFormValueData).length > 0 &&
      typeof resetFormData?.current === "function"
    ) {
      try {
        const mapped = convertToFormData(t, defaultFormValueData);
        resetFormData.current(mapped);
        if (typeof clearFormDataErrors?.current === "function") clearFormDataErrors.current();
        if (mapped?.selectComplainant && typeof setFormDataValue?.current === "function") {
          setFormDataValue.current("selectComplainant", mapped.selectComplainant);
        }
        hasInitFromDefaultRef.current = true;
      } catch (e) {
        // no-op
      }
    }
  }, [formReady, defaultFormValueData, bailBondId, t]);

  const prefillFromPendingTaskForPetitioner = async (petitionerUuid) => {
    try {
      if (!petitionerUuid || !filingNumber || !tenantId) return;
      const userInfo = Digit?.UserService?.getUser()?.info;
      const isCitizen = userInfo?.type === "CITIZEN";
      const roles = (userInfo?.roles || []).map((r) => r.code);
      const pendingTaskRes = await HomeService.getPendingTaskService(
        {
          SearchCriteria: {
            tenantId,
            moduleName: "Pending Tasks Service",
            moduleSearchCriteria: {
              isCompleted: false,
              ...(isCitizen ? { assignedTo: userInfo?.uuid } : { assignedRole: [...roles] }),
              ...(courtId && { courtId }),
              filingNumber,
              entityType: "bail bond",
            },
            limit: 1000,
            offset: 0,
          },
        },
        { tenantId }
      );
      const tasks = Array.isArray(pendingTaskRes?.data) ? pendingTaskRes.data : [];
      const matches = tasks.filter((t) => {
        const fields = Array.isArray(t?.fields) ? t.fields : [];
        const getField = (k) => fields.find((f) => f.key === k)?.value;
        const add = getField("additionalDetails") || {};
        const arr = (Array.isArray(getField("additionalDetails.litigantUuid")) && getField("additionalDetails.litigantUuid")) || [];
        const first0 = getField("additionalDetails.litigantUuid[0]");
        const alt = getField("additionalDetails.litigants") || [];
        return (
          petitionerUuid === first0 ||
          (Array.isArray(arr) && arr.includes(petitionerUuid)) ||
          (Array.isArray(alt) && alt.includes(petitionerUuid)) ||
          add?.litigantUuid === petitionerUuid
        );
      });
      if (!matches.length) return;
      const latest = matches
        .map((t) => ({ task: t, createdTime: (Array.isArray(t.fields) ? t.fields : []).find((f) => f.key === "createdTime")?.value || 0 }))
        .sort((a, b) => (b.createdTime || 0) - (a.createdTime || 0))?.[0]?.task;
      if (!latest) return;
      const fields = Array.isArray(latest?.fields) ? latest.fields : [];
      const getField = (k) => fields.find((f) => f.key === k)?.value;
      const additionalDetailsObj = getField("additionalDetails") || {};
      const rawBailType =
        getField("additionalDetails.bailType") ||
        additionalDetailsObj?.bailType?.code ||
        additionalDetailsObj?.bailType?.type ||
        additionalDetailsObj?.bailType ||
        getField("bailType") ||
        getField("bailTypeCode") ||
        getField("bail_type");
      const bailTypeRaw = typeof rawBailType === "object" && rawBailType !== null ? rawBailType.code || rawBailType.type : rawBailType;
      const rawAddSurety = getField("additionalDetails.addSurety") || additionalDetailsObj?.addSurety || getField("addSurety");
      const addSuretyPending = typeof rawAddSurety === "object" && rawAddSurety !== null ? rawAddSurety.code || rawAddSurety.value : rawAddSurety;
      const fatherName = getField("additionalDetails.litigantFatherName") || additionalDetailsObj?.litigantFatherName;
      const refApplicationId = getField("additionalDetails.refApplicationId") || additionalDetailsObj?.refApplicationId;
      const noOfSureties = getField("additionalDetails.noOfSureties") || additionalDetailsObj?.noOfSureties;
      const patch = {};
      if (bailTypeRaw || addSuretyPending) {
        const normalizedBailType = bailTypeRaw ? String(bailTypeRaw).trim().toUpperCase() : "";
        const normalizedAddSurety = addSuretyPending ? String(addSuretyPending).trim().toUpperCase() : "";
        const code = normalizedBailType ? normalizedBailType : normalizedAddSurety === "YES" ? "SURETY" : "PERSONAL";
        patch.bailType = { code, name: t(code), showSurety: code === "SURETY" };
      }
      if (fatherName) patch.litigantFatherName = fatherName;
      if (refApplicationId) {
        patch.additionalDetails = { ...(formdata?.additionalDetails || {}), refApplicationId };
      }
      if (Object.keys(patch).length) {
        setDefaultFormValueData((prev) => ({ ...(prev || {}), ...patch }));
        setFormdata((prev) => ({ ...(prev || {}), ...patch }));
        if (typeof setFormDataValue?.current === "function") {
          if (patch?.bailType) setFormDataValue.current("bailType", patch.bailType);
          if (patch?.litigantFatherName != null) setFormDataValue.current("litigantFatherName", patch.litigantFatherName);
        }
        setLockPrefilledFields(true);
      }

      const reqCount = Number(noOfSureties) > 0 ? Number(noOfSureties) : null;
      if ((patch?.bailType?.code === "SURETY" || String(bailTypeRaw).toUpperCase() === "SURETY") && reqCount) {
        setRequiredSuretyCount(reqCount);
        const current = Array.isArray(formdata?.sureties) ? [...formdata.sureties] : [];
        while (current.length < reqCount) current.push({});
        if (typeof setFormDataValue?.current === "function") setFormDataValue.current("sureties", current);
        setFormdata((prev) => ({ ...(prev || {}), sureties: current }));
      }
      if (reqCount) {
        try {
          if (typeof setFormDataValue?.current === "function") setFormDataValue.current("noOfSureties", reqCount);
        } catch (e) {}
        setFormdata((prev) => ({ ...(prev || {}), noOfSureties: reqCount }));
        setDefaultFormValueData((prev) => ({ ...(prev || {}), noOfSureties: reqCount }));
      }
    } catch (e) {}
  };

  const onDocumentUpload = async (fileData, filename) => {
    const fileUploadRes = await Digit.UploadServices.Filestorage("DRISTI", fileData, Digit.ULBService.getCurrentTenantId());
    return { file: fileUploadRes?.data, fileType: fileData.type, filename };
  };

  const preProcessFormData = async (formData) => {
    if (!formData?.bailType || formData?.bailType?.code !== "SURETY") {
      return { ...formData, sureties: [] };
    }
    const updatedFormData = { ...formData };
    if (Array.isArray(updatedFormData?.sureties)) {
      updatedFormData.sureties = await Promise.all(
        updatedFormData.sureties.map(async (surety) => {
          const updatedSurety = { ...surety };

          if (surety?.identityProof?.document?.length > 0) {
            // Check if any document is a File type (needs processing)
            const hasFileTypeDoc = surety.identityProof.document.some((doc) => doc instanceof File || (doc.file && doc.file instanceof File));

            if (hasFileTypeDoc) {
              // Only process if we have File type documents
              const combinedIdentityProof = await combineMultipleFiles(surety.identityProof.document);
              const file = await onDocumentUpload(combinedIdentityProof?.[0], "identityProof.pdf");
              updatedSurety.identityProof = {
                document: [
                  {
                    fileStore: file?.file?.files?.[0]?.fileStoreId,
                    documentName: file?.filename,
                    documentType: "IDENTITY_PROOF",
                    tenantId,
                  },
                ],
              };
            }
          }

          if (surety?.proofOfSolvency?.document?.length > 0) {
            // Check if any document is a File type (needs processing)
            const hasFileTypeDoc = surety.proofOfSolvency.document.some((doc) => doc instanceof File || (doc.file && doc.file instanceof File));

            if (hasFileTypeDoc) {
              // Only process if we have File type documents
              const combinedProof = await combineMultipleFiles(surety.proofOfSolvency.document);
              const file = await onDocumentUpload(combinedProof?.[0], "proofOfSolvency.pdf");
              updatedSurety.proofOfSolvency = {
                document: [
                  {
                    fileStore: file?.file?.files?.[0]?.fileStoreId,
                    documentName: file?.filename,
                    documentType: "PROOF_OF_SOLVENCY",
                    tenantId,
                  },
                ],
              };
            }
          }

          if (surety?.otherDocuments?.document?.length > 0) {
            // Check if any document is a File type (needs processing)
            const hasFileTypeDoc = surety.otherDocuments.document.some((doc) => doc instanceof File || (doc.file && doc.file instanceof File));

            if (hasFileTypeDoc) {
              // Only process if we have File type documents
              const combinedOtherDocs = await combineMultipleFiles(surety.otherDocuments.document);
              const file = await onDocumentUpload(combinedOtherDocs?.[0], "otherDocuments.pdf");
              updatedSurety.otherDocuments = {
                document: [
                  {
                    fileStore: file?.file?.files?.[0]?.fileStoreId,
                    documentName: file?.filename,
                    documentType: "OTHER_DOCUMENTS",
                    tenantId,
                  },
                ],
              };
            }
          }
          return updatedSurety;
        })
      );
    }
    return updatedFormData;
  };

  const extractSureties = (formData) => {
    const existingSureties = bailBondDetails?.sureties || [];
    if (existingSureties?.length > 0 && formData?.bailType?.code === "SURETY") {
      const activeSureties = formData?.sureties?.map((surety, index) => {
        const matchingSurety = existingSureties?.find((existing) => existing?.id === surety?.id);
        return {
          ...matchingSurety,
          index: index + 1,
          name: surety?.name,
          fatherName: surety?.fatherName,
          mobileNumber: surety?.mobileNumber,
          tenantId,
          address: surety?.address,
          email: surety?.email,
          documents: [
            ...(surety?.identityProof?.document || []),
            ...(surety?.proofOfSolvency?.document || []),
            ...(surety?.otherDocuments?.document || []),
          ],
        };
      });

      const formDataSuretyIds = formData?.sureties?.map((surety) => surety?.id)?.filter(Boolean);
      const inactiveSureties = existingSureties
        ?.filter((existingSurety) => existingSurety?.id && !formDataSuretyIds?.includes(existingSurety.id))
        ?.map((surety) => ({
          ...surety,
          isActive: false,
        }));

      return [...activeSureties, ...inactiveSureties];
    } else if (existingSureties?.length > 0 && formData?.bailType?.code !== "SURETY") {
      return existingSureties?.map((surety) => ({
        ...surety,
        isActive: false,
      }));
    } else {
      return formData?.sureties?.map((surety, index) => {
        return {
          index: index + 1,
          name: surety?.name,
          fatherName: surety?.fatherName,
          mobileNumber: surety?.mobileNumber,
          tenantId,
          address: surety?.address,
          email: surety?.email,
          documents: [
            ...(surety?.identityProof?.document || []),
            ...(surety?.proofOfSolvency?.document || []),
            ...(surety?.otherDocuments?.document || []),
          ],
        };
      });
    }
  };

  const createBailBond = async (individualData) => {
    try {
      const updatedFormData = await preProcessFormData(formdata);
      const sureties = updatedFormData?.bailType?.code === "SURETY" ? extractSureties(updatedFormData) : [];
      const refApplicationId = defaultFormValueData?.refApplicationId || defaultFormValueData?.additionalDetails?.refApplicationId;

      const payload = {
        bail: {
          tenantId,
          caseId: caseDetails?.id,
          filingNumber: filingNumber,
          complainant: updatedFormData?.selectComplainant?.uuid,
          bailType: updatedFormData?.bailType?.code,
          bailAmount: updatedFormData?.bailAmount,
          sureties: sureties || [],
          litigantId: updatedFormData?.selectComplainant?.uuid,
          litigantName: updatedFormData?.selectComplainant?.name,
          litigantFatherName: updatedFormData?.litigantFatherName,
          litigantMobileNumber: individualData?.Individual?.[0]?.mobileNumber,
          courtId: caseDetails?.courtId,
          caseTitle: caseDetails?.caseTitle,
          cnrNumber: caseDetails?.cnrNumber,
          caseType: caseDetails?.caseType,
          documents: [],
          additionalDetails: {
            createdUserName: userInfo?.name,
            ...(refApplicationId ? { refApplicationId } : {}),
            ...(updatedFormData?.bailType?.code ? { bailTypeCode: updatedFormData.bailType.code } : {}),
            ...(updatedFormData?.bailType?.code ? { addSurety: updatedFormData.bailType.code === "SURETY" ? "YES" : "NO" } : {}),
            ...(updatedFormData?.bailType?.code === "SURETY"
              ? {
                  noOfSureties:
                    typeof updatedFormData?.noOfSureties === "number"
                      ? updatedFormData.noOfSureties
                      : Array.isArray(sureties)
                      ? sureties.length
                      : undefined,
                }
              : {}),
          },
          workflow: {
            action: bailBondWorkflowAction.SAVEDRAFT,
            documents: [{}],
          },
        },
      };
      const res = await submissionService.createBailBond(payload, { tenantId });
      return res;
    } catch (error) {
      throw error;
    }
  };

  const updateBailBond = async (fileStoreId = null, action, individualData) => {
    try {
      let payload = {};
      if (action !== bailBondWorkflowAction.SAVEDRAFT) {
        const documents = Array.isArray(bailBondDetails?.documents) ? bailBondDetails.documents : [];
        const documentsFile = fileStoreId
          ? [
              {
                fileStore: fileStoreId,
                documentType: action === bailBondWorkflowAction.UPLOAD ? "SIGNED" : "UNSIGNED",
                additionalDetails: { name: `${t("BAIL_BOND")}.pdf` },
                tenantId,
              },
            ]
          : null;

        payload = {
          bail: {
            ...bailBondDetails,
            documents: documentsFile ? [...documentsFile] : documents,
            workflow: { ...bailBondDetails.workflow, action, documents: [{}] },
          },
        };
      } else {
        const updatedFormData = await preProcessFormData(formdata);
        const sureties = updatedFormData?.bailType?.code === "SURETY" ? extractSureties(updatedFormData) : [];
        const refApplicationId =
          defaultFormValueData?.refApplicationId ||
          defaultFormValueData?.additionalDetails?.refApplicationId ||
          bailBondDetails?.additionalDetails?.refApplicationId;

        payload = {
          bail: {
            ...bailBondDetails,
            complainant: updatedFormData?.selectComplainant?.uuid,
            bailType: updatedFormData?.bailType?.code,
            bailAmount: updatedFormData?.bailAmount,
            sureties: sureties || [],
            litigantId: updatedFormData?.selectComplainant?.uuid,
            litigantName: updatedFormData?.selectComplainant?.name,
            litigantFatherName: updatedFormData?.litigantFatherName,
            litigantMobileNumber: individualData ? individualData?.Individual?.[0]?.mobileNumber : bailBondDetails?.litigantMobileNumber,
            additionalDetails: {
              ...bailBondDetails?.additionalDetails,
              createdUserName: userInfo?.name,
              ...(refApplicationId ? { refApplicationId } : {}),
              ...(updatedFormData?.bailType?.code ? { bailTypeCode: updatedFormData.bailType.code } : {}),
              ...(updatedFormData?.bailType?.code ? { addSurety: updatedFormData.bailType.code === "SURETY" ? "YES" : "NO" } : {}),
              ...(updatedFormData?.bailType?.code === "SURETY"
                ? {
                    noOfSureties:
                      typeof updatedFormData?.noOfSureties === "number"
                        ? updatedFormData.noOfSureties
                        : Array.isArray(sureties)
                        ? sureties.length
                        : undefined,
                  }
                : {}),
            },
            workflow: { ...bailBondDetails.workflow, action, documents: [{}] },
          },
        };
      }

      const res = await submissionService.updateBailBond(payload, { tenantId });
      return res;
    } catch (error) {
      throw error;
    }
  };

  const validateSuretyContactNumber = (individualData, formData) => {
    const indivualMobileNumber = individualData?.Individual?.[0]?.mobileNumber;
    const hasDuplicate = formData?.sureties?.some((surety) => surety?.mobileNumber && surety?.mobileNumber === indivualMobileNumber);

    if (hasDuplicate) {
      setShowErrorToast({ label: t("SURETY_CONTACT_NUMBER_CANNOT_BE_SAME_AS_COMPLAINANT"), error: true });
      return false;
    }
    return true;
  };

  const validateAdvocateSuretyContactNumber = (sureties) => {
    const advocateMobileNumber = userInfo?.mobileNumber;
    const mobileNumbers = new Set();

    for (let i = 0; i < sureties?.length; i++) {
      const currentMobile = sureties[i]?.mobileNumber;
      if (!currentMobile) continue;

      if (advocateMobileNumber && currentMobile === advocateMobileNumber) {
        setShowErrorToast({ label: t("SURETY_ADVOCATE_MOBILE_NUMBER_SAME"), error: true });
        return true;
      }

      if (mobileNumbers.has(currentMobile)) {
        setShowErrorToast({ label: t("SAME_MOBILE_NUMBER_SURETY"), error: true });
        return true;
      }

      mobileNumbers.add(currentMobile);
    }

    return false;
  };

  const validateSurities = (sureties) => {
    let error = false;
    if (!sureties && !Object.keys(setFormState?.current?.errors).includes("sureties")) {
      error = true;
      setFormDataValue.current("sureties", [{}, {}]);
      setFormErrors.current("sureties", { message: t("CORE_REQUIRED_FIELD_ERROR") });
    } else if (sureties?.length > 0 && !Object.keys(setFormState?.current?.errors).includes("sureties")) {
      // Enforce per-surety required fields
      sureties?.forEach((docs, index) => {
        if (!docs?.name && !Object.keys(setFormState?.current?.errors).includes(`name_${index}`)) {
          error = true;
          setFormErrors.current(`name_${index}`, { message: t("CORE_REQUIRED_FIELD_ERROR") });
        }

        if (!docs?.fatherName && !Object.keys(setFormState?.current?.errors).includes(`fatherName_${index}`)) {
          error = true;
          setFormErrors.current(`fatherName_${index}`, { message: t("CORE_REQUIRED_FIELD_ERROR") });
        }

        if (!docs?.mobileNumber && !Object.keys(setFormState?.current?.errors).includes(`mobileNumber_${index}`)) {
          error = true;
          setFormErrors.current(`mobileNumber_${index}`, { message: t("CORE_REQUIRED_FIELD_ERROR") });
        }

        if (!docs?.identityProof && !Object.keys(setFormState?.current?.errors).includes(`identityProof_${index}`)) {
          error = true;
          setFormErrors.current(`identityProof_${index}`, { message: t("CORE_REQUIRED_FIELD_ERROR") });
        }

        if (!docs?.proofOfSolvency && !Object.keys(setFormState?.current?.errors).includes(`proofOfSolvency_${index}`)) {
          error = true;
          setFormErrors.current(`proofOfSolvency_${index}`, { message: t("CORE_REQUIRED_FIELD_ERROR") });
        }
      });
    }
    try {
      const need = Number(requiredSuretyCount) > 0 ? Number(requiredSuretyCount) : null;
      const isSuretyType = (formdata?.bailType?.code || "").toUpperCase() === "SURETY";
      if (need && isSuretyType) {
        if (!Array.isArray(sureties) || sureties.length < need) {
          error = true;
          setShowErrorToast({ label: t("AT_LEAST_N_SURETIES_REQUIRED", { n: need }), error: true });
          return error;
        }
        const isDocValid = (d) => (Array.isArray(d?.document) ? d.document.length > 0 : Boolean(d));
        const validCount = Array.isArray(sureties)
          ? sureties.filter((s) => s && s.name && s.fatherName && s.mobileNumber && isDocValid(s.identityProof) && isDocValid(s.proofOfSolvency))
              .length
          : 0;
        if (validCount < need) {
          error = true;
          setShowErrorToast({ label: t("AT_LEAST_N_SURETIES_REQUIRED", { n: need }), error: true });
        }
      }
    } catch (e) {}
    return error;
  };

  const handleSubmit = async () => {
    if (formdata?.bailType?.code === "SURETY") {
      if (validateSurities(formdata?.sureties)) {
        return;
      }

      const inputs = bailBondConfig?.[1]?.body?.[0]?.populators?.inputs?.find((input) => input?.key === "address")?.populators?.inputs;
      for (let i = 0; i < formdata?.sureties?.length; i++) {
        const surety = formdata?.sureties?.[i];
        const isError = bailBondAddressValidation({ formData: surety?.address, inputs });
        if (isError) {
          setShowErrorToast({ label: t("CS_PLEASE_CHECK_ADDRESS_DETAILS_BEFORE_SUBMIT"), error: true });
          return;
        }
      }

      if (validateAdvocateSuretyContactNumber(formdata?.sureties)) {
        return;
      }
    }

    try {
      setLoader(true);
      const individualData = await getUserUUID(formdata?.selectComplainant?.uuid);
      const validateSuretyContactNumbers = validateSuretyContactNumber(individualData, formdata);

      if (!validateSuretyContactNumbers) {
        setLoader(false);
        return;
      }
      const getPendingTaskPayload = convertTaskResponseToPayload(pendingTaskData);
      let bailBondResponse = null;
      if (!bailBondId) {
        bailBondResponse = await createBailBond(individualData);
        setDefaultFormValueData(bailBondResponse?.bails?.[0] || {});
        await submissionService.customApiService(Urls.pendingTask, {
          pendingTask: {
            ...getPendingTaskPayload,
            additionalDetails: {
              ...getPendingTaskPayload?.additionalDetails,
              bailBondId: bailBondResponse?.bails?.[0]?.bailId || null,
            },
            tenantId,
          },
        });
        try {
          if (latestRaiseTaskRef.current) {
            sessionStorage.setItem(persistedRaiseRefKey, JSON.stringify(latestRaiseTaskRef.current));
          }
        } catch (_) {}
        const sourceQS = fromPendingTask || latestRaiseTaskRef.current ? `&source=pendingTasks` : "";
        history.replace(
          `/${window?.contextPath}/${userType}/submissions/bail-bond?filingNumber=${filingNumber}&bailBondId=${bailBondResponse?.bails?.[0]?.bailId}&showModal=true${sourceQS}`
        );
      } else {
        bailBondResponse = await updateBailBond(null, bailBondWorkflowAction.SAVEDRAFT, individualData);
        setDefaultFormValueData(bailBondResponse?.bails?.[0] || {});
        setShowBailBondReview(true);
      }
    } catch (error) {
      console.error("Error while creating bail bond:", error);
      setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
    } finally {
      setLoader(false);
    }
  };

  const handleSaveDraft = async () => {
    // Todo : Create and Update Api Call
    try {
      if (!formdata?.bailType) {
        setShowErrorToast({ label: t("BAIL_TYPE_ISSUE"), error: true });
        return;
      }

      setLoader(true);
      const individualData = await getUserUUID(formdata?.selectComplainant?.uuid);
      const getPendingTaskPayload = convertTaskResponseToPayload(pendingTaskData);
      let bailBondResponse = null;
      if (!bailBondId) {
        bailBondResponse = await createBailBond(individualData);
        setDefaultFormValueData(bailBondResponse?.bails?.[0] || {});
        await submissionService.customApiService(Urls.pendingTask, {
          pendingTask: {
            ...getPendingTaskPayload,
            additionalDetails: {
              ...getPendingTaskPayload?.additionalDetails,
              bailBondId: bailBondResponse?.bails?.[0]?.bailId || null,
            },
            tenantId,
          },
        });
        history.replace(
          `/${window?.contextPath}/${userType}/submissions/bail-bond?filingNumber=${filingNumber}&bailBondId=${bailBondResponse?.bails?.[0]?.bailId}`
        );
      } else {
        bailBondResponse = await updateBailBond(null, bailBondWorkflowAction.SAVEDRAFT, individualData);
        setDefaultFormValueData(bailBondResponse?.bails?.[0] || {});
      }
      // try {
      //   sessionStorage.setItem("documents-activeTab", "Bail Bonds");
      // } catch (e) {}
      setShowErrorToast({ label: t("DRAFT_SAVED_SUCCESSFULLY"), error: false });
    } catch (error) {
      console.error("Error while creating bail bond:", error);
      setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
    } finally {
      setLoader(false);
    }
  };

  const handleCloseSignatureModal = () => {
    setShowsignatureModal(false);
    setShowBailBondReview(true);
  };

  const handleDownload = () => {
    downloadPdf(tenantId, bailBondFileStoreId);
  };

  const closeRaiseBailBondPendingTasks = async () => {
    try {
      if (!filingNumber || !tenantId) return;

      let shouldClose = false;
      let referenceIdToClose = null;
      let taskNameToClose = null;

      // Case (a): came via pending tasks and we identified the raise task (or query param missing but we still detected it)
      if (latestRaiseTaskRef.current) {
        const matchedName = latestRaiseTaskRef.current.name;
        const isRaiseByName = /RAISE\s*BAIL\s*BOND/i.test(String(matchedName || ""));
        if (latestRaiseTaskRef.current.referenceId && isRaiseByName) {
          shouldClose = true;
          referenceIdToClose = latestRaiseTaskRef.current.referenceId;
          taskNameToClose = "CS_COMMON_RAISE_BAIL_BOND";
        }
      }

      // Case (b): fresh path – if selected complainant (accused) has any pending raise task, close it
      if (!shouldClose) {
        try {
          const userInfo = Digit?.UserService?.getUser()?.info;
          const isCitizen = userInfo?.type === "CITIZEN";
          const roles = (userInfo?.roles || []).map((r) => r.code);
          const pendingTaskRes = await HomeService.getPendingTaskService(
            {
              SearchCriteria: {
                tenantId,
                moduleName: "Pending Tasks Service",
                moduleSearchCriteria: {
                  isCompleted: false,
                  ...(isCitizen ? { assignedTo: userInfo?.uuid } : { assignedRole: [...roles] }),
                  ...(caseCourtId && { courtId: caseCourtId }),
                  filingNumber,
                  entityType: "bail bond",
                },
                limit: 1000,
                offset: 0,
              },
            },
            { tenantId }
          );
          let tasks = Array.isArray(pendingTaskRes?.data) ? pendingTaskRes.data : [];
          // If nothing found with courtId filter, retry without courtId (some tasks may not carry courtId field)
          if (!tasks.length && caseCourtId) {
            try {
              const retryRes = await HomeService.getPendingTaskService(
                {
                  SearchCriteria: {
                    tenantId,
                    moduleName: "Pending Tasks Service",
                    moduleSearchCriteria: {
                      isCompleted: false,
                      ...(isCitizen ? { assignedTo: userInfo?.uuid } : { assignedRole: [...roles] }),
                      filingNumber,
                      entityType: "bail bond",
                    },
                    limit: 1000,
                    offset: 0,
                  },
                },
                { tenantId }
              );
              tasks = Array.isArray(retryRes?.data) ? retryRes.data : [];
            } catch (_) {}
          }
          const selectedUuid = formdata?.selectComplainant?.uuid || latestRaiseTaskRef.current?.litigantUuid;
          const selectedName = formdata?.selectComplainant?.name || formdata?.selectComplainant?.code;
          const allLits = caseDetails?.litigants || [];
          const selectedLit = allLits.find((l) => {
            const litUuid = l?.additionalDetails?.uuid || l?.uuid || l?.id;
            const litName = l?.additionalDetails?.fullName || l?.name || l?.litigantName;
            return (
              (selectedUuid && String(litUuid) === String(selectedUuid)) || (selectedName && litName && String(litName) === String(selectedName))
            );
          });
          const selectedIndividualId = selectedLit?.individualId || null;
          try {
          } catch (_) {}
          let raiseTasks = tasks.filter((t) => {
            const getField = (k) => t?.fields?.find((f) => f.key === k)?.value;
            const status = getField("status");
            const name = getField("name") || "";
            const entityType = getField("entityType") || "";
            const litigantUuid =
              getField("additionalDetails.litigantUuid") ||
              (getField("additionalDetails") &&
                (getField("additionalDetails")?.litigantUuid ||
                  (Array.isArray(getField("additionalDetails")?.litigantUuid) ? getField("additionalDetails")?.litigantUuid?.[0] : null))) ||
              getField("individualId") ||
              null;
            const accusedIndividualId =
              (getField("additionalDetails") && getField("additionalDetails")?.accusedIndividualId) || getField("accusedIndividualId") || null;
            const isRaiseName = /RAISE\s*BAIL\s*BOND/i.test(String(name || ""));
            const isRaise = (status === "PENDING_RAISE_BAIL_BOND" || isRaiseName) && /bail bond/i.test(entityType);
            const matchesByUuid = selectedUuid ? String(litigantUuid) === String(selectedUuid) : false;
            const matchesByIndividual = selectedIndividualId ? String(accusedIndividualId) === String(selectedIndividualId) : false;
            const matchesAccused = matchesByUuid || matchesByIndividual || (!selectedUuid && !selectedIndividualId);
            return isRaise && matchesAccused;
          });
          // Fallback: if nothing matched, try to find by referenceId prefix pattern
          if (!raiseTasks.length) {
            try {
              const prefix = `MANUAL_RAISE_BAIL_BOND_${filingNumber}`;
              const fuzzy = tasks.filter((t) => {
                const refField = (t?.fields || []).find((f) => /ref(erence)?id/i.test(String(f?.key)) && typeof f?.value === "string");
                return refField?.value?.startsWith(prefix);
              });
              if (fuzzy.length) {
                raiseTasks = fuzzy;
              }
            } catch (_) {}
          }
          if (raiseTasks.length) {
            shouldClose = true;
            const latest = raiseTasks
              .map((t) => ({ task: t, createdTime: t?.fields?.find((f) => f.key === "createdTime")?.value || 0 }))
              .sort((a, b) => (b.createdTime || 0) - (a.createdTime || 0))?.[0]?.task;
            const getFieldLatest = (k) => latest?.fields?.find((f) => f.key === k)?.value;
            referenceIdToClose =
              getFieldLatest("referenceId") ||
              getFieldLatest("taskReferenceId") ||
              getFieldLatest("refId") ||
              getFieldLatest("taskRefId") ||
              (() => {
                const anyRef = (latest?.fields || []).find((f) => /ref(erence)?id/i.test(String(f?.key)) && typeof f?.value === "string");
                return anyRef?.value || null;
              })();
            taskNameToClose = "CS_COMMON_RAISE_BAIL_BOND";
          }
        } catch (_) {}
      }

      if (!shouldClose || !referenceIdToClose) {
        try {
        } catch (_) {}
        return; // do nothing when criteria not met or referenceId not found
      }

      const caseId = caseDetails?.id;
      const caseTitle = caseDetails?.caseTitle;
      try {
      } catch (_) {}
      await DRISTIService.customApiService(
        HomeUrls.pendingTask,
        {
          pendingTask: {
            name: t(taskNameToClose || "CS_COMMON_RAISE_BAIL_BOND"),
            entityType: "bail bond",
            referenceId: referenceIdToClose,
            status: "completed",
            assignedTo: [],
            actionCategory: "Bail Bond",
            filingNumber,
            isCompleted: true,
            caseId: caseId,
            caseTitle: caseTitle,
            additionalDetails: {},
            tenantId,
          },
        },
        {}
      );
    } catch (e) {
      try {
        console.error("[BailBond] Failed to close pending tasks", e);
      } catch (_) {}
    }
  };

  const handleESign = async () => {
    // TODO: call Api then close this modal and show next modal
    try {
      const res = await updateBailBond(bailBondFileStoreId, bailBondWorkflowAction.INITIATEESIGN);
      setBailBondSignatureURL(res?.bails?.[0]?.shortenedURL);
      setShowsignatureModal(false);
      setShowBailBondEsign(true);
    } catch (error) {
      console.error("Error while updating bail bond:", error);
      setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
    } finally {
      setShowsignatureModal(false);
    }
  };

  const handleSubmitSignature = async (fileStoreId) => {
    // TODO: api call with fileStoreID then
    try {
      setLoader(false);
      const res = await updateBailBond(fileStoreId, bailBondWorkflowAction.UPLOAD);
      setShowsignatureModal(false);
      setShowUploadSignature(false);
      setShowSuccessModal(true);
      closeRaiseBailBondPendingTasks();
    } catch (error) {
      console.error("Error while updating bail bond:", error);
      setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
    } finally {
      setLoader(false);
      setShowsignatureModal(false);
      setShowUploadSignature(false);
    }
  };

  const handleCloseSuccessModal = () => {
    history.replace(`/${window?.contextPath}/${userType}/dristi/home/view-case?caseId=${caseDetails?.id}&filingNumber=${filingNumber}&tab=Documents`);
  };

  const closeToast = () => {
    setShowErrorToast(null);
  };

  const clearAutoPopulated = () => {
    try {
      hasClearedRef.current = true;
      const shouldPreserveComplainant = fromPendingTask || (Array.isArray(complainantsList) && complainantsList.length === 1);
      const preservedComplainant = shouldPreserveComplainant ? formdata?.selectComplainant || {} : {};
      setFormDataValue.current && setFormDataValue.current("bailAmount", undefined);
      setFormDataValue.current && setFormDataValue.current("bailType", {});
      setFormDataValue.current && setFormDataValue.current("litigantFatherName", "");
      setFormDataValue.current && setFormDataValue.current("sureties", []);
      setFormDataValue.current && setFormDataValue.current("noOfSureties", "");
      setFormDataValue.current && setFormDataValue.current("selectComplainant", preservedComplainant);
      setFormdata((prev) => ({
        ...(prev || {}),
        bailAmount: undefined,
        bailType: {},
        litigantFatherName: "",
        sureties: [],
        noOfSureties: "",
        selectComplainant: preservedComplainant,
      }));
      try {
        if (typeof resetFormData?.current === "function") {
          const currentVals = (typeof setFormState?.current?.getValues === "function" && setFormState.current.getValues()) || {};
          const clearedSnapshot = {
            ...currentVals,
            bailAmount: "",
            bailType: {},
            litigantFatherName: "",
            sureties: [],
            noOfSureties: "",
            selectComplainant: preservedComplainant,
          };
          resetFormData.current(clearedSnapshot);
        }
      } catch (e) {}
      setDefaultFormValueData((prev) => {
        const next = { ...(prev || {}) };
        if ("bailAmount" in next) delete next.bailAmount;
        if ("bailType" in next) delete next.bailType;
        if ("litigantFatherName" in next) delete next.litigantFatherName;
        next.sureties = [];
        ["noOfSureties"].forEach((k) => {
          if (k in next) delete next[k];
        });
        if (next.additionalDetails) {
          ["noOfSureties"].forEach((k) => {
            if (k in next.additionalDetails) delete next.additionalDetails[k];
          });
        }
        if (preservedComplainant && Object.keys(preservedComplainant).length) {
          next.selectComplainant = preservedComplainant;
        }
        return next;
      });
      setLockPrefilledFields(false);
      setRequiredSuretyCount(null);
      setFormInstanceNonce((n) => n + 1);

      const errorKeys = Object.keys(setFormState.current?.errors || {});
      [
        "bailAmount",
        "bailType",
        "litigantFatherName",
        "sureties",
        ...errorKeys.filter((k) => /^name_\d+$|^fatherName_\d+$|^mobileNumber_\d+$|^identityProof_\d+$|^proofOfSolvency_\d+$/.test(k)),
      ].forEach((k) => {
        clearFormDataErrors.current && clearFormDataErrors.current(k);
      });
    } catch (e) {}
  };

  const documents = useMemo(() => {
    let docList = [];
    if (bailBondDetails?.sureties?.length > 0) {
      bailBondDetails.sureties.forEach((surety, index) => {
        if (surety?.documents?.length > 0) {
          surety?.documents?.forEach((doc) => {
            docList.push({
              ...doc,
              name: `Surety${index + 1} ${doc?.documentName}`,
            });
          });
        }
      });
    }
    return docList;
  }, [bailBondDetails]);

  useEffect(() => {
    if (showErrorToast) {
      const timer = setTimeout(() => {
        setShowErrorToast(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showErrorToast]);

  useEffect(() => {
    if (showModal) {
      setShowBailBondReview(true);
    }
  }, []);

  useEffect(() => {
    if (!bailBondId && defaultFormValueData && Object.keys(defaultFormValueData || {}).length > 0) {
      try {
        const mapped = convertToFormData(t, defaultFormValueData);
        setFormdata((prev) => ({ ...(mapped || {}), ...(prev || {}) }));
        if (mapped?.selectComplainant && typeof setFormDataValue?.current === "function") {
          setFormDataValue.current("selectComplainant", mapped.selectComplainant);
        }
      } catch (e) {}
    }
  }, [defaultFormValueData, bailBondId, t]);

  useEffect(() => {
    try {
      const mapped = convertToFormData(t, bailBondDetails || {});
      const hasExisting = formdata && Object.keys(formdata || {}).length > 0;
      if (!hasExisting && Object.keys(mapped || {}).length > 0) {
        setFormdata(mapped);
      }
    } catch (e) {}
  }, [bailBondDetails, t, formdata]);

  useEffect(() => {
    const prefillFromCompleted = async () => {
      try {
        if (bailBondId || !filingNumber || !tenantId) {
          return;
        }
        if (!fromPendingTask && (bailBondDetails || (defaultFormValueData && Object.keys(defaultFormValueData).length > 0))) {
          return;
        }
        if (fromPendingTask) {
          return;
        }

        const searchPayload = {
          criteria: {
            ...(courtId && { courtId }),
            ...(caseDetails?.id && { caseId: caseDetails.id }),
            filingNumber,
            status: ["COMPLETED"],
          },
          tenantId,
          pagination: {
            limit: 1,
            offSet: 0,
            sortBy: "bailCreatedTime",
            order: "desc",
          },
        };

        const res = await submissionService.searchBailBond(searchPayload, {});
        let latestMatched = res?.bails?.[0];
        if (latestMatched) {
          setDefaultFormValueData(latestMatched);
          const mapped = convertToFormData(t, latestMatched);
          setFormdata(mapped);
          if (typeof resetFormData?.current === "function") {
            try {
              resetFormData.current(mapped);
              if (typeof clearFormDataErrors?.current === "function") clearFormDataErrors.current();
            } catch (e) {
              // no-op
            }
          }
        } else {
          try {
            const appSearchPayload = {
              criteria: {
                filingNumber: filingNumber,
                tenantId: tenantId,
                ...(courtId && { courtId }),
                status: "COMPLETED",
                applicationType: "REQUEST_FOR_BAIL",
              },
              tenantId: tenantId,
            };
            const appRes = await submissionService.searchApplication(appSearchPayload, {});
            const list = Array.isArray(appRes?.applicationList) ? appRes.applicationList : [];
            const matched = list
              .filter((a) => a?.applicationType === "REQUEST_FOR_BAIL" && a?.status === "COMPLETED")
              .sort((a, b) => (b?.createdDate || 0) - (a?.createdDate || 0));
            const latestApp = matched?.[0];
            if (latestApp) {
              const formdataFromApp = latestApp?.additionalDetails?.formdata || {};
              const appDetails = latestApp?.applicationDetails || {};
              const complainant = formdataFromApp?.selectComplainant;

              const addSuretyFromDetails = appDetails?.addSurety;
              const addSuretyFromForm = formdataFromApp?.addSurety?.code;
              const addSurety = addSuretyFromDetails != null ? addSuretyFromDetails : addSuretyFromForm;
              const derivedBailType = addSurety
                ? {
                    code: addSurety === "YES" ? "SURETY" : "PERSONAL",
                    name: t((addSurety === "YES" ? "SURETY" : "PERSONAL").toUpperCase()),
                    showSurety: addSurety === "YES",
                  }
                : undefined;

              const suretiesFromDetails = Array.isArray(appDetails?.sureties) ? appDetails.sureties : undefined;
              const suretiesFromForm = Array.isArray(formdataFromApp?.sureties) ? formdataFromApp.sureties : undefined;
              const sourceSureties = suretiesFromDetails || suretiesFromForm;
              const appLevelDocs = Array.isArray(appDetails?.applicationDocuments) ? appDetails.applicationDocuments : [];
              const appLevelIdProofDocs = appLevelDocs
                .filter((d) => d?.documentType === "IDENTITY_PROOF")
                .map((d) => ({
                  fileStore: d?.fileStore,
                  documentType: "IDENTITY_PROOF",
                  documentName: d?.documentTitle || "identityProof.pdf",
                  tenantId,
                }));
              const appLevelSolvencyDocs = appLevelDocs
                .filter((d) => d?.documentType === "PROOF_OF_SOLVENCY")
                .map((d) => ({
                  fileStore: d?.fileStore,
                  documentType: "PROOF_OF_SOLVENCY",
                  documentName: d?.documentTitle || "proofOfSolvency.pdf",
                  tenantId,
                }));

              const mappedSureties = Array.isArray(sourceSureties)
                ? sourceSureties.map((s, sIdx) => {
                    const perSuretyDocs = Array.isArray(s?.documents) ? s.documents : [];
                    const perIdDocs = perSuretyDocs
                      .filter((d) => d?.documentType === "IDENTITY_PROOF")
                      .map((d) => ({
                        fileStore: d?.fileStore,
                        documentType: "IDENTITY_PROOF",
                        documentName: d?.documentName || d?.documentTitle || "identityProof.pdf",
                        isActive: true,
                        tenantId,
                      }));
                    const perSolDocs = perSuretyDocs
                      .filter((d) => d?.documentType === "PROOF_OF_SOLVENCY")
                      .map((d) => ({
                        fileStore: d?.fileStore,
                        documentType: "PROOF_OF_SOLVENCY",
                        documentName: d?.documentName || d?.documentTitle || "proofOfSolvency.pdf",
                        isActive: true,
                        tenantId,
                      }));
                    const useAppLevelForThisSurety = sourceSureties.length === 1 && perSuretyDocs.length === 0;

                    return {
                      name: s?.name || "",
                      fatherName: s?.fatherName || "",
                      mobileNumber: s?.mobileNumber || "",
                      address: s?.address || {},
                      email: s?.email || "",
                      identityProof: { document: perIdDocs.length ? perIdDocs : useAppLevelForThisSurety ? appLevelIdProofDocs : [] },
                      proofOfSolvency: { document: perSolDocs.length ? perSolDocs : useAppLevelForThisSurety ? appLevelSolvencyDocs : [] },
                      otherDocuments: { document: [] },
                      documents: [
                        ...perIdDocs,
                        ...perSolDocs,
                        ...(useAppLevelForThisSurety ? [...appLevelIdProofDocs, ...appLevelSolvencyDocs] : []),
                      ],
                    };
                  })
                : undefined;

              const litigantFatherNameFromDetails = appDetails?.litigantFatherName;
              const litigantFatherNameFromForm = formdataFromApp?.litigantFatherName;

              const mappedCandidate = {
                ...(complainant && { selectComplainant: { code: complainant?.name, name: complainant?.name, uuid: complainant?.uuid } }),
                ...((litigantFatherNameFromDetails || litigantFatherNameFromForm) && {
                  litigantFatherName: litigantFatherNameFromDetails || litigantFatherNameFromForm,
                }),
                ...(derivedBailType && { bailType: derivedBailType }),
                ...(mappedSureties && { sureties: mappedSureties }),
              };
              const current = formdata || {};
              const mapped = {
                ...(current?.selectComplainant
                  ? {}
                  : mappedCandidate?.selectComplainant
                  ? { selectComplainant: mappedCandidate.selectComplainant }
                  : {}),
                ...(current?.litigantFatherName
                  ? {}
                  : mappedCandidate?.litigantFatherName
                  ? { litigantFatherName: mappedCandidate.litigantFatherName }
                  : {}),
                ...(current?.bailType?.code ? {} : mappedCandidate?.bailType ? { bailType: mappedCandidate.bailType } : {}),
                ...(Array.isArray(current?.sureties) && current?.sureties?.length
                  ? {}
                  : mappedCandidate?.sureties
                  ? { sureties: mappedCandidate.sureties }
                  : {}),
              };
              if (Object.keys(mapped).length > 0) {
                const compatForConvert = {};
                if (mappedCandidate?.selectComplainant) {
                  compatForConvert.litigantName = mappedCandidate.selectComplainant.name;
                  compatForConvert.litigantId = mappedCandidate.selectComplainant.uuid;
                }
                if (mappedCandidate?.litigantFatherName) {
                  compatForConvert.litigantFatherName = mappedCandidate.litigantFatherName;
                }
                if (derivedBailType?.code) {
                  compatForConvert.bailType = derivedBailType.code;
                }
                if (Array.isArray(mappedCandidate?.sureties) && mappedCandidate.sureties.length) {
                  compatForConvert.sureties = mappedCandidate.sureties.map((s) => ({
                    name: s?.name || "",
                    fatherName: s?.fatherName || "",
                    mobileNumber: s?.mobileNumber || "",
                    address: s?.address || {},
                    email: s?.email || "",
                    documents: Array.isArray(s?.documents)
                      ? s.documents.map((d) => ({ ...d, isActive: d?.isActive != null ? d.isActive : true }))
                      : [],
                  }));
                }

                setDefaultFormValueData((prev) => ({ ...(prev || {}), ...compatForConvert }));
                setFormdata((prev) => ({ ...(prev || {}), ...mapped }));
                setLockPrefilledFields(true);
                if (typeof resetFormData?.current === "function") {
                  try {
                    const base = {
                      ...(current || {}),
                      ...(current?.litigantName ? { litigantName: current.litigantName } : {}),
                      ...(!current?.litigantName && caseDetails?.litigantName ? { litigantName: caseDetails.litigantName } : {}),
                      ...mapped,
                    };
                    resetFormData.current(base);
                    if (typeof clearFormDataErrors?.current === "function") clearFormDataErrors.current();
                  } catch (e) {
                    console.error("[Bail Prefill][Apps] Error while resetting form:", e);
                  }
                }
              }
              return;
            }
          } catch (appErr) {
            // no-op
          }
          try {
            const diagPayload = {
              criteria: {
                ...(courtId && { courtId }),
                ...(caseDetails?.id && { caseId: caseDetails.id }),
                filingNumber,
              },
              tenantId,
              pagination: { limit: 3, offSet: 0, sortBy: "bailCreatedTime", order: "desc" },
            };
            const diagRes = await submissionService.searchBailBond(diagPayload, {});
            const diagStatuses = Array.isArray(diagRes?.bails)
              ? diagRes.bails.map((b) => ({ bailId: b?.bailId, status: b?.status || b?.bailStatus, created: b?.bailCreatedTime }))
              : [];
          } catch (diagErr) {
            // no-op
          }
        }
      } catch (err) {
        // no-op
      }
    };

    prefillFromCompleted();
  }, [bailBondId, filingNumber, tenantId, courtId, bailBondDetails, defaultFormValueData, t]);

  useEffect(() => {
    if (
      !bailBondId &&
      !hasInitFromDefaultRef.current &&
      defaultFormValueData &&
      Object.keys(defaultFormValueData || {}).length > 0 &&
      typeof resetFormData?.current === "function"
    ) {
      try {
        const mapped = convertToFormData(t, defaultFormValueData);
        resetFormData.current(mapped);
        if (typeof clearFormDataErrors?.current === "function") clearFormDataErrors.current();
        hasInitFromDefaultRef.current = true;
      } catch (e) {
        // no-op
      }
    }
  }, [resetFormData?.current, clearFormDataErrors?.current, defaultFormValueData, bailBondId, t]);

  useEffect(() => {
    if (!isCaseDetailsLoading && !isBailBondLoading && bailBondId && bailBondDetails?.status === "COMPLETED") {
      history.replace(
        `/${window?.contextPath}/${userType}/dristi/home/view-case?caseId=${caseDetails?.id}&filingNumber=${filingNumber}&tab=Documents`
      );
    }
  }, [isCaseDetailsLoading, isBailBondLoading, bailBondId, bailBondDetails, caseDetails, filingNumber, history, userType]);

  // if pass directly this in formComposer will work normally
  // const getDefaultFormValue = useMemo(() => {
  //   return convertToFormData(t, bailBondDetails || {});
  // }, [bailBondDetails, t]);

  if (isCaseDetailsLoading || !caseDetails || isBailBondLoading) {
    return <Loader />;
  }

  return (
    <React.Fragment>
      {loader && (
        <div
          style={{
            width: "100vw",
            height: "100vh",
            zIndex: "9999",
            position: "fixed",
            right: "0",
            display: "flex",
            top: "0",
            background: "rgb(234 234 245 / 50%)",
            alignItems: "center",
            justifyContent: "center",
          }}
          className="submit-loader"
        >
          <Loader />
        </div>
      )}
      <div className="citizen create-submission" style={{ width: "90%", ...(!isCitizen && { padding: "0 8px 24px 16px" }) }}>
        <Header styles={{ margin: "25px 0px 0px 25px" }}> {t("BAIL_BOND_DETAILS")}</Header>
        <div style={{ minHeight: "550px", overflowY: "auto" }}>
          <FormComposerV2
            key={formInstanceKey}
            className={"bailbond"}
            label={t("REVIEW_BAIL_BOND")}
            secondaryLabel={t("SAVE_AS_DRAFT")}
            showSecondaryLabel={true}
            config={modifiedFormConfig}
            defaultValues={defaultFormValue}
            onFormValueChange={onFormValueChange}
            onSubmit={handleSubmit}
            onSecondayActionClick={handleSaveDraft}
            fieldStyle={fieldStyle}
            isDisabled={isSubmitDisabled}
            actionClassName={"bail-action-bar"}
          />
          <button
            type="button"
            onClick={clearAutoPopulated}
            className="tertiary-clear-btn"
            style={{
              position: "fixed",
              bottom: 12,
              left: 32,
              background: "transparent",
              border: "1px solid #007E7E",
              color: "#007E7E",
              padding: "8px 16px",
              fontWeight: 600,
              cursor: "pointer",
              zIndex: 1000,
            }}
          >
            {t("CLEAR_INFORMATION")}
          </button>
        </div>

        {showBailBondReview && (
          <BailBondReviewModal
            t={t}
            handleBack={() => {
              setShowBailBondReview(false);
              history.replace(`/${window?.contextPath}/${userType}/submissions/bail-bond?filingNumber=${filingNumber}&bailBondId=${bailBondId}`);
            }}
            setShowBailBondReview={setShowBailBondReview}
            setShowsignatureModal={setShowsignatureModal}
            bailBondDetails={bailBondDetails}
            courtId={caseCourtId}
            setBailBondFileStoreId={setBailBondFileStoreId}
            documents={documents}
          />
        )}

        {showSignatureModal && (
          <BailUploadSignatureModal
            t={t}
            handleCloseSignatureModal={handleCloseSignatureModal}
            handleDownload={handleDownload}
            handleESign={handleESign}
            setShowUploadSignature={setShowUploadSignature}
            showUploadSignature={showUploadSignature}
            handleSubmit={handleSubmitSignature}
            setLoader={setBailUploadLoader}
            loader={bailUploadLoader}
            bailBondFileStoreId={bailBondFileStoreId}
          />
        )}

        {showBailBondEsign && (
          <BailBondEsignLockModal
            t={t}
            handleSaveOnSubmit={handleCloseSuccessModal}
            userType={userType}
            filingNumber={filingNumber}
            bailBondSignatureURL={bailBondSignatureURL}
          />
        )}
        {showSuccessModal && <SuccessBannerModal t={t} handleCloseSuccessModal={handleCloseSuccessModal} message={"BAIL_BOND_BANNER_HEADER"} />}
        {showErrorToast && <Toast error={showErrorToast?.error} label={showErrorToast?.label} isDleteBtn={true} onClose={closeToast} />}
      </div>
    </React.Fragment>
  );
};

export default GenerateBailBond;
