import React, { useEffect, useMemo, useState } from "react";
import { ActionBar, SubmitBar, Loader } from "@egovernments/digit-ui-react-components";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import DocViewerWrapper from "../../employee/docViewerWrapper";
import { FileUploadIcon } from "../../../icons/svgIndex";
import { ReactComponent as InfoIcon } from "../../../icons/info.svg";
import { useTranslation } from "react-i18next";
import useSearchCaseService from "../../../hooks/dristi/useSearchCaseService";
import useDownloadCasePdf from "../../../hooks/dristi/useDownloadCasePdf";
import { DRISTIService } from "../../../services";
import { getSuffixByBusinessCode, getTaxPeriodByBusinessService } from "../../../Utils";
import UploadSignatureModal from "../../../components/UploadSignatureModal";
import { getAllAssignees } from "./EfilingValidationUtils";
import { Urls } from "../../../hooks";

const getStyles = () => ({
  container: { display: "flex", flexDirection: "row", height: "100vh", marginBottom: "50px" },
  leftPanel: {
    flex: 1,
    padding: "24px 16px 16px 16px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
  },
  caseDetails: {
    border: "1px solid #9E400A24",
    borderRadius: "4px",
    padding: "12px 16px",
    backgroundColor: "#F7F5F3",
    marginBottom: "16px",
  },
  infoRow: { display: "flex", alignItems: "center" },
  infoText: { marginLeft: "8px" },
  detailsSection: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  advocateDetails: {
    marginTop: "8px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  litigantDetails: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  signedLabel: {
    padding: "6px 8px",
    borderRadius: "999px",
    color: "#00703C",
    backgroundColor: "#E4F2E4",
    fontSize: "14px",
    fontWeight: 400,
  },
  centerPanel: { flex: 3, padding: "24px 16px 16px 16px", border: "1px solid #e0e0e0" },
  header: { height: "72px", gap: "8px", display: "flex", flexDirection: "column", justifyContent: "space-between" },
  title: { width: "584px", height: "38px", color: "#0A0A0A", fontSize: "32px", fontWeight: 700 },
  downloadButton: {
    background: "none",
    border: "none",
    color: "#007E7E",
    fontSize: "16px",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  details: { color: "#231F20", fontWeight: 700, fontSize: "18px" },
  description: { color: "#77787B", fontSize: "16px", fontWeight: 400 },
  docViewer: { marginTop: "24px", border: "1px solid #e0e0e0", display: "flex", overflow: "hidden" },
  rightPanel: { flex: 1, padding: "24px 16px 24px 24px", borderLeft: "1px solid #ccc" },
  signaturePanel: { display: "flex", flexDirection: "column" },
  signatureTitle: { fontSize: "24px", fontWeight: 700, color: "#3D3C3C" },
  signatureDescription: { fontWeight: "400", fontSize: "16px", color: "#3D3C3C" },
  esignButton: {
    height: "40px",
    alignItems: "center",
    fontWeight: 700,
    fontSize: "16px",
    color: "#FFFFFF",
    display: "flex",
    justifyContent: "center",
    backgroundColor: "#007E7E",
    border: "none",
    cursor: "pointer",
    padding: "0 20px",
  },
  uploadButton: {
    marginBottom: "16px",
    height: "40px",
    fontWeight: 700,
    fontSize: "16px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "0 16px",
    color: "#007E7E",
  },
  actionBar: { display: "flex", justifyContent: "flex-end", width: "100%" },
  submitButton: { backgroundColor: "#008080", color: "#fff", fontWeight: "bold", cursor: "pointer" },
});

const RightArrow = () => (
  <svg style={{ marginLeft: "8px" }} width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 0L6.59 1.41L12.17 7H0V9H12.17L6.59 14.59L8 16L16 8L8 0Z" fill="white" />
  </svg>
);

const FileDownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.6693 6H10.0026V2H6.0026V6H3.33594L8.0026 10.6667L12.6693 6ZM3.33594 12V13.3333H12.6693V12H3.33594Z" fill="#007E7E" />
  </svg>
);

const caseType = {
  category: "Criminal",
  act: "Negotiable Instruments Act",
  section: "138",
  courtName: "Kollam S-138 Special Court",
  href: "https://districts.ecourts.gov.in/sites/default/files/study%20circles.pdf",
};

const complainantWorkflowACTION = {
  UPLOAD_DOCUMENT: "UPLOAD",
  ADVOCATE_ESIGN_SEND: "E-SIGN-2",
  LITIGANT_SUBMIT_CASE: "E-SIGN_PARTY_IN_PERSON",
  ADVOCATE_SUBMIT_CASE: "E-SIGN",
};

const complainantWorkflowState = {
  PENDING_ESIGN_LITIGANT: "PENDING_E-SIGN",
  PENDING_ESIGN_ADVOCATE: "PENDING_E-SIGN-2",
  UPLOAD_SIGN_DOC: "PENDING_SIGN",
};

const stateSla = {
  PENDING_PAYMENT: 2,
};

const dayInMillisecond = 24 * 3600 * 1000;

const ComplainantSignature = ({ path }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const Digit = window.Digit || {};
  const urlParams = new URLSearchParams(window.location.search);
  const caseId = urlParams.get("caseId");
  const todayDate = new Date().getTime();
  const [Loading, setLoader] = useState(false);
  const [isEsignSuccess, setEsignSuccess] = useState(false);
  const [uploadDoc, setUploadDoc] = useState(false);
  const [isDocumentUpload, setDocumentUpload] = useState(false);
  const [formData, setFormData] = useState({});
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const styles = getStyles();
  const roles = Digit.UserService.getUser()?.info?.roles;
  const isAdvocateFilingCase = roles?.some((role) => role.code === "ADVOCATE_ROLE");
  const userInfo = Digit?.UserService?.getUser()?.info;
  const userInfoType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo]);
  const [signatureDocumentId, setSignatureDocumentId] = useState(null);
  const { downloadPdf } = useDownloadCasePdf();
  const { handleEsign } = Digit.Hooks.orders.useESign();
  const { uploadDocuments } = Digit.Hooks.orders.useDocumentUpload();
  const name = "Signature";

  const uploadModalConfig = useMemo(() => {
    return {
      key: "uploadSignature",
      populators: {
        inputs: [
          {
            name: name,
            documentHeader: "Signature",
            type: "DragDropComponent",
            uploadGuidelines: "Ensure the image is not blurry and under 5MB.",
            maxFileSize: 5,
            maxFileErrorMessage: "CS_FILE_LIMIT_5_MB",
            fileTypes: ["JPG", "PNG", "JPEG", "PDF"],
            isMultipleUpload: false,
          },
        ],
        validation: {},
      },
    };
  }, [name]);

  const onSelect = (key, value) => {
    if (value === null) {
      setFormData({});
      setSignatureDocumentId(null);
      setUploadDoc(false);
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [key]: value,
      }));
    }
  };

  useEffect(() => {
    const upload = async () => {
      if (formData?.uploadSignature?.Signature?.length > 0) {
        const uploadedFileId = await uploadDocuments(formData?.uploadSignature?.Signature, tenantId);
        setSignatureDocumentId(uploadedFileId[0]?.fileStoreId);
        setUploadDoc(true);
      }
    };

    upload();
  }, [formData]);

  const { data: caseData, refetch: refetchCaseData, isLoading } = useSearchCaseService(
    {
      criteria: [
        {
          caseId: caseId,
          defaultFields: false,
        },
      ],
      tenantId,
    },
    {},
    "dristi",
    caseId,
    caseId
  );

  const caseDetails = useMemo(
    () => ({
      ...caseData?.criteria?.[0]?.responseList?.[0],
    }),
    [caseData]
  );

  const DocumentFileStoreId = useMemo(() => {
    return caseDetails?.additionalDetails?.signedCaseDocument;
  });

  const advocateDetails = useMemo(() => {
    const advocateData = caseDetails?.additionalDetails?.advocateDetails?.formdata?.[0]?.data;
    if (advocateData?.isAdvocateRepresenting?.code === "YES") {
      return advocateData;
    }
    return null;
  }, [caseDetails]);

  const litigants = useMemo(() => {
    return caseDetails?.litigants?.filter((litigant) => litigant.partyType === "complainant.primary")?.[0];
  }, [caseDetails]);

  const state = useMemo(() => caseDetails?.status, [caseDetails]);
  const isSelectedEsign = useMemo(() => {
    const esignStates = [complainantWorkflowState.PENDING_ESIGN_LITIGANT, complainantWorkflowState.PENDING_ESIGN_ADVOCATE];

    return esignStates.includes(state);
  }, [state]);

  const isSelectedUploadDoc = useMemo(() => state === complainantWorkflowState.UPLOAD_SIGN_DOC, [state]);

  const isLitigantEsignCompleted = useMemo(() => state === complainantWorkflowState.PENDING_ESIGN_ADVOCATE, [state]);

  const closePendingTask = async ({ status }) => {
    const entityType = "case-default";
    const filingNumber = caseDetails?.filingNumber;
    await DRISTIService.customApiService(Urls.dristi.pendingTask, {
      pendingTask: {
        entityType,
        status,
        referenceId: `MANUAL_${filingNumber}`,
        cnrNumber: caseDetails?.cnrNumber,
        filingNumber: filingNumber,
        isCompleted: true,
        additionalDetails: {},
        tenantId,
      },
    });
  };

  const handleCasePdf = () => {
    downloadPdf(tenantId, signatureDocumentId || DocumentFileStoreId);
  };

  const handleEsignAction = () => {
    handleEsign(name, "ci", DocumentFileStoreId);
  };

  const handleUploadFile = () => {
    setDocumentUpload(true);
  };

  const delayCondonation = useMemo(() => {
    const today = new Date();
    if (!caseDetails?.caseDetails?.["demandNoticeDetails"]?.formdata) {
      return null;
    }
    const dateOfAccrual = new Date(caseDetails?.caseDetails["demandNoticeDetails"]?.formdata[0]?.data?.dateOfAccrual);
    return today?.getTime() - dateOfAccrual?.getTime();
  }, [caseDetails]);
  const chequeDetails = useMemo(() => {
    const debtLiability = caseDetails?.caseDetails?.debtLiabilityDetails?.formdata?.[0]?.data;
    if (debtLiability?.liabilityType?.code === "PARTIAL_LIABILITY") {
      return {
        totalAmount: debtLiability?.totalAmount,
      };
    } else {
      const chequeData = caseDetails?.caseDetails?.chequeDetails?.formdata || [];
      const totalAmount = chequeData.reduce((sum, item) => {
        return sum + parseFloat(item.data.chequeAmount);
      }, 0);
      return {
        totalAmount: totalAmount.toString(),
      };
    }
  }, [caseDetails]);

  const { data: paymentTypeData, isLoading: isPaymentTypeLoading } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    "payment",
    [{ name: "paymentType" }],
    {
      select: (data) => {
        return data?.payment?.paymentType || [];
      },
    }
  );

  const { data: taxPeriodData, isLoading: taxPeriodLoading } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    "BillingService",
    [{ name: "TaxPeriod" }],
    {
      select: (data) => {
        return data?.BillingService?.TaxPeriod || [];
      },
    }
  );

  const callCreateDemandAndCalculation = async (caseDetails, tenantId, caseId) => {
    const suffix = getSuffixByBusinessCode(paymentTypeData, "case-default");
    const taxPeriod = getTaxPeriodByBusinessService(taxPeriodData, "case-default");
    const calculationResponse = await DRISTIService.getPaymentBreakup(
      {
        EFillingCalculationCriteria: [
          {
            checkAmount: chequeDetails?.totalAmount,
            numberOfApplication: 1,
            tenantId: tenantId,
            caseId: caseId,
            delayCondonation: delayCondonation,
          },
        ],
      },
      {},
      "dristi",
      Boolean(chequeDetails?.totalAmount && chequeDetails.totalAmount !== "0")
    );

    await DRISTIService.createDemand({
      Demands: [
        {
          tenantId,
          consumerCode: caseDetails?.filingNumber + `_${suffix}`,
          consumerType: "case-default",
          businessService: "case-default",
          taxPeriodFrom: taxPeriod?.fromDate,
          taxPeriodTo: taxPeriod?.toDate,
          demandDetails: [
            {
              taxHeadMasterCode: "CASE_ADVANCE_CARRYFORWARD",
              taxAmount: 4, // amount to be replaced with calculationResponse
              collectionAmount: 0,
              delayCondonation: delayCondonation,
            },
          ],
        },
      ],
    });

    return calculationResponse;
  };

  const SubmitLabel = useMemo(() => {
    if (!isAdvocateFilingCase && advocateDetails && !isLitigantEsignCompleted) {
      return "CS_ADVOCATE_SIGN";
    }
    return "CS_SUBMIT_CASE";
  }, [isLitigantEsignCompleted, advocateDetails]);

  const handleSubmit = async (Submitlabel) => {
    localStorage.removeItem("name");
    localStorage.removeItem("isSignSuccess");
    localStorage.removeItem("signStatus");
    localStorage.removeItem("fileStoreId");
    localStorage.removeItem("esignProcess");

    setLoader(true);
    let calculationResponse = {};
    const assignees = getAllAssignees(caseDetails);

    if (Submitlabel === "CS_SUBMIT_CASE") {
      await DRISTIService.caseUpdateService(
        {
          cases: {
            ...caseDetails,
            additionalDetails: {
              ...caseDetails?.additionalDetails,
              signedCaseDocument: signatureDocumentId ? signatureDocumentId : DocumentFileStoreId,
            },
            workflow: {
              ...caseDetails?.workflow,
              action: isSelectedUploadDoc
                ? complainantWorkflowACTION.UPLOAD_DOCUMENT
                : isAdvocateFilingCase
                ? complainantWorkflowACTION.ADVOCATE_SUBMIT_CASE
                : complainantWorkflowACTION.LITIGANT_SUBMIT_CASE,

              assignes: [],
            },
          },
          tenantId,
        },
        tenantId
      ).then(async (res) => {
        await closePendingTask({
          status: isSelectedUploadDoc
            ? complainantWorkflowState.UPLOAD_SIGN_DOC
            : isAdvocateFilingCase
            ? complainantWorkflowState.PENDING_ESIGN_ADVOCATE
            : complainantWorkflowState.PENDING_ESIGN_LITIGANT,
        });
        if (res?.cases?.[0]?.status === "PENDING_PAYMENT") {
          await DRISTIService.customApiService(Urls.dristi.pendingTask, {
            pendingTask: {
              name: "Pending Payment",
              entityType: "case-default",
              referenceId: `MANUAL_${caseDetails?.filingNumber}`,
              status: "PENDING_PAYMENT",
              assignedTo: [...assignees?.map((uuid) => ({ uuid }))],
              assignedRole: ["CASE_CREATOR"],
              cnrNumber: null,
              filingNumber: caseDetails?.filingNumber,
              isCompleted: false,
              stateSla: stateSla.PENDING_PAYMENT * dayInMillisecond + todayDate,
              additionalDetails: {},
              tenantId,
            },
          });
        }
      });
      calculationResponse = await callCreateDemandAndCalculation(caseDetails, tenantId, caseId);
      setLoader(false);
      history.push(`${path}/e-filing-payment?caseId=${caseId}`, { state: { calculationResponse: calculationResponse } });
    } else {
      await DRISTIService.caseUpdateService(
        {
          cases: {
            ...caseDetails,
            additionalDetails: {
              ...caseDetails?.additionalDetails,
              signedCaseDocument: signatureDocumentId ? signatureDocumentId : DocumentFileStoreId,
            },
            workflow: {
              ...caseDetails?.workflow,
              action: complainantWorkflowACTION.ADVOCATE_ESIGN_SEND,
              assignes: [],
            },
          },
          tenantId,
        },
        tenantId
      ).then(async (res) => {
        await closePendingTask({
          status: complainantWorkflowState.PENDING_ESIGN_LITIGANT,
        });

        if (res?.cases?.[0]?.status === complainantWorkflowState.PENDING_ESIGN_ADVOCATE) {
          await DRISTIService.customApiService(Urls.dristi.pendingTask, {
            pendingTask: {
              name: "Pending Advocate Sign",
              entityType: "case-default",
              referenceId: `MANUAL_${caseDetails?.filingNumber}`,
              status: complainantWorkflowState.PENDING_ESIGN_ADVOCATE,
              assignedTo: [...assignees?.map((uuid) => ({ uuid }))],
              assignedRole: ["CASE_CREATOR"],
              cnrNumber: null,
              filingNumber: caseDetails?.filingNumber,
              isCompleted: false,
              stateSla: stateSla.PENDING_PAYMENT * dayInMillisecond + todayDate,
              additionalDetails: {},
              tenantId,
            },
          });
        }
      });
      setLoader(false);
      history.push(`/${window?.contextPath}/${userInfoType}/dristi/landing-page`);
    }
  };

  const isSubmitEnabled = () => {
    return isEsignSuccess || uploadDoc;
  };

  useEffect(() => {
    const isSignSuccess = localStorage.getItem("isSignSuccess");
    const storedESignObj = localStorage.getItem("signStatus");
    const parsedESignObj = JSON.parse(storedESignObj);

    if (isSignSuccess) {
      const matchedSignStatus = parsedESignObj?.find((obj) => obj.name === name && obj.isSigned === true);
      if (isSignSuccess === "success" && matchedSignStatus) {
        const fileStoreId = localStorage.getItem("fileStoreId");
        setSignatureDocumentId(fileStoreId);
        setEsignSuccess(true);
      }
    }
  }, []);

  const isRightPannelEnable = () => {
    if (isAdvocateFilingCase) {
      return !(isEsignSuccess || uploadDoc);
    }

    return !(isLitigantEsignCompleted || isEsignSuccess);
  };

  if (isLoading || Loading) {
    return <Loader />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.leftPanel}>
        <div style={styles.caseDetails}>
          <div style={styles.infoRow}>
            <InfoIcon />
            <span style={styles.infoText}>
              <b>{t("CS_YOU_ARE_FILING_A_CASE")}</b>
            </span>
          </div>
          <div>
            <p>
              {t("CS_UNDER")}{" "}
              <a href={caseType?.href} target="_blank" rel="noreferrer" style={{ color: "#3d3c3c" }}>{`S-${caseType.section}, ${caseType.act}`}</a>{" "}
              {t("CS_IN")}
              <span style={{ fontWeight: 700 }}>{` ${caseType.courtName}.`}</span>
            </p>
          </div>
        </div>

        <div style={styles.detailsSection}>
          <div style={styles.litigantDetails}>
            <div style={styles.details}>
              <div>{t("COMPLAINT_SIGN")}:</div>
              <div style={{ marginTop: "5px" }}>{litigants?.additionalDetails?.fullName}</div>
            </div>
            {!isAdvocateFilingCase
              ? (isEsignSuccess || isLitigantEsignCompleted) && <span style={styles.signedLabel}>{t("SIGNED")}</span>
              : (isLitigantEsignCompleted || uploadDoc) && <span style={styles.signedLabel}>{t("SIGNED")}</span>}
          </div>
          {advocateDetails && (
            <div style={styles.advocateDetails}>
              <div style={styles.details}>
                <div>{t("ADVOCATE_SIGN")}:</div>
                <div style={{ marginTop: "5px" }}>{advocateDetails?.advocateName}</div>
              </div>
              {isAdvocateFilingCase && (isEsignSuccess || uploadDoc) && <span style={styles.signedLabel}>{t("SIGNED")}</span>}
            </div>
          )}
        </div>
      </div>

      <div style={styles.centerPanel}>
        <div style={styles.header}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={styles.title}>{t("SIGN_COMPLAINT")}</div>
            <button style={styles.downloadButton} onClick={handleCasePdf}>
              <span style={{ marginRight: "8px", display: "flex", alignItems: "center" }}>
                <FileDownloadIcon />
              </span>
              <span>{t("DOWNLOAD_PDF")}</span>
            </button>
          </div>
          <div style={styles.description}>{t("CS_REVIEW_CASE_FILE_SUBTEXT")}</div>
        </div>
        <div style={styles.docViewer}>
          {signatureDocumentId || DocumentFileStoreId ? (
            <DocViewerWrapper
              docWidth={"100vh"}
              docHeight={"70vh"}
              fileStoreId={signatureDocumentId || DocumentFileStoreId}
              tenantId={tenantId}
              docViewerCardClassName={"doc-card"}
              showDownloadOption={false}
            />
          ) : (
            <h2>{t("PREVIEW_DOC_NOT_AVAILABLE")}</h2>
          )}
        </div>
      </div>

      <div style={styles.rightPanel}>
        {isRightPannelEnable() && (
          <div style={styles.signaturePanel}>
            <div style={styles.signatureTitle}>{t("ADD_SIGNATURE")}</div>
            <p style={styles.signatureDescription}>{t("EITHER_ESIGN_UPLOAD")}</p>
            {isSelectedEsign &&
              (!(isAdvocateFilingCase && !isLitigantEsignCompleted) ? (
                <button style={styles.esignButton} onClick={handleEsignAction}>
                  {t("CS_ESIGN")}
                </button>
              ) : (
                <p style={{ fontSize: "18px", fontWeight: 700 }}>Wait for litigant to Complete Signature</p>
              ))}

            {isSelectedUploadDoc && (
              <button style={styles.uploadButton} onClick={handleUploadFile}>
                <FileUploadIcon />
                <span style={{ marginLeft: "8px" }}>{t("UPLOAD_SIGNED_PDF")}</span>
              </button>
            )}
          </div>
        )}
      </div>

      <ActionBar>
        <div style={styles.actionBar}>
          <SubmitBar
            label={
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
                <span>{t(SubmitLabel)}</span>
                <RightArrow />
              </div>
            }
            onSubmit={() => handleSubmit(SubmitLabel)}
            style={styles.submitButton}
            disabled={!isSubmitEnabled()}
          />
        </div>
      </ActionBar>

      {isDocumentUpload && (
        <UploadSignatureModal
          t={t}
          key={name}
          name={name}
          setOpenUploadSignatureModal={setDocumentUpload}
          onSelect={onSelect}
          config={uploadModalConfig}
          formData={formData}
        />
      )}
    </div>
  );
};

export default ComplainantSignature;
