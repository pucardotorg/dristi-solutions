import { CloseSvg } from "@egovernments/digit-ui-components";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Modal from "../../../components/Modal";
import { Button, SubmitBar, TextInput } from "@egovernments/digit-ui-react-components";
import { CaseWorkflowState } from "../../../Utils/caseWorkflow";
import useGetAllOrderApplicationRelatedDocuments from "../../../hooks/dristi/useGetAllOrderApplicationRelatedDocuments";
import { DRISTIService } from "../../../services";
import { getAdvocates } from "@egovernments/digit-ui-module-orders/src/utils/caseUtils";
import useSearchCaseService from "../../../hooks/dristi/useSearchCaseService";
import useGetDiaryEntry from "../../../hooks/dristi/useGetDiaryEntry";

function PublishedOrderModal({
  t,
  order,
  handleDownload,
  handleRequestLabel,
  handleSubmitDocument,
  caseStatus,
  handleOrdersTab,
  extensionApplications = [],
  productionOfDocumentApplications = [],
  submitBailDocumentsApplications = [],
}) {
  const [fileStoreId, setFileStoreID] = useState(null);
  const [fileName, setFileName] = useState();
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const DocViewerWrapper = Digit?.ComponentRegistryService?.getComponent("DocViewerWrapper");
  const userRoles = Digit.UserService.getUser()?.info?.roles.map((role) => role.code);
  const isCitizen = useMemo(() => Boolean(Digit?.UserService?.getUser()?.info?.type === "CITIZEN"), [Digit]);

  const { documents, isLoading, fetchRecursiveData } = useGetAllOrderApplicationRelatedDocuments();
  const [loading, setLoading] = useState(false);
  const Heading = (props) => {
    return <h1 className="heading-m">{props.label}</h1>;
  };

  const CloseBtn = (props) => {
    return (
      <div onClick={props?.onClick} style={{ height: "100%", display: "flex", alignItems: "center", paddingRight: "20px", cursor: "pointer" }}>
        <CloseSvg />
      </div>
    );
  };

  const { data: caseData } = useSearchCaseService(
    {
      criteria: [
        {
          filingNumber: order?.filingNumber,
        },
      ],
      tenantId,
    },
    {},
    `dristi-${order?.filingNumber}`,
    order?.filingNumber,
    Boolean(order?.filingNumber)
  );
  const caseDetails = useMemo(() => caseData?.criteria?.[0]?.responseList?.[0] || {}, [caseData]);

  const signedOrder = useMemo(() => order?.documents?.filter((item) => item?.documentType === "SIGNED")[0], [order]);
  const userInfo = Digit.UserService.getUser()?.info;
  const allAdvocates = useMemo(() => getAdvocates(caseDetails), [caseDetails]);

  const { data: diaryResponse } = useGetDiaryEntry(
    {
      criteria: {
        referenceId: order?.orderNumber,
        tenantId,
        judgeId: "super",
        caseId: caseDetails?.cmpNumber,
      },
    },
    {},
    order?.orderNumber + caseDetails?.id,
    Boolean(order?.orderNumber) && Boolean(caseDetails?.id)
  );

  const isComposite = useMemo(() => order?.orderCategory === "COMPOSITE", [order]);

  const compositeMandatorySubmissionItems = useMemo(
    () => order?.compositeItems?.filter((item) => item?.orderType === "MANDATORY_SUBMISSIONS_RESPONSES") || [],
    [order]
  );

  const mandatorySubmissionItemId = useMemo(() => {
    for (const compositeItem of compositeMandatorySubmissionItems) {
      const isMatched = productionOfDocumentApplications?.some((item) => item?.referenceId === `${compositeItem?.id}_${order?.id}`);

      if (!isMatched) {
        return compositeItem?.id;
      }
    }
    return null;
  }, [order, compositeMandatorySubmissionItems, productionOfDocumentApplications]);

  const compositeSetTermsOfBailItems = useMemo(() => order?.compositeItems?.filter((item) => item?.orderType === "SET_BAIL_TERMS") || [], [order]);

  const setTermBailItemId = useMemo(() => {
    for (const compositeItem of compositeSetTermsOfBailItems) {
      const isMatched = submitBailDocumentsApplications?.some((item) => item?.referenceId === `${compositeItem?.id}_${order?.id}`);

      if (!isMatched) {
        return compositeItem?.id;
      }
    }
    return null;
  }, [order, compositeSetTermsOfBailItems, submitBailDocumentsApplications]);

  const applicationNumberSetTerms = useMemo(() => {
    return isComposite
      ? compositeSetTermsOfBailItems?.find((item) => item?.id === setTermBailItemId)?.orderSchema?.formdata?.applicationNumber?.[0]
      : order?.applicationNumber?.[0];
  }, [order, compositeSetTermsOfBailItems, setTermBailItemId, isComposite]);

  const { data: applicationData, isLoading: isApplicationDetailsLoading } = Digit.Hooks.submissions.useSearchSubmissionService(
    {
      criteria: {
        filingNumber: order?.filingNumber,
        tenantId: tenantId,
        applicationNumber: applicationNumberSetTerms,
      },
      tenantId,
    },
    {},
    applicationNumberSetTerms + order?.filingNumber,
    Boolean(applicationNumberSetTerms + order?.filingNumber)
  );
  const applicationDetails = useMemo(() => applicationData?.applicationList?.[0], [applicationData]);

  const litigantIndId = useMemo(
    () =>
      caseDetails?.litigants?.find(
        (litigant) => litigant?.additionalDetails?.uuid === applicationDetails?.additionalDetails?.formdata?.selectComplainant?.uuid
      )?.individualId,
    [applicationDetails, caseDetails]
  );

  const litigant = useMemo(
    () =>
      caseDetails?.litigants?.find(
        (litigant) => litigant?.additionalDetails?.uuid === applicationDetails?.additionalDetails?.formdata?.selectComplainant?.uuid
      )?.additionalDetails?.uuid,
    [applicationDetails, caseDetails]
  );

  const showSubmissionButtons = useMemo(() => {
    const hasMatchingReference = (compositeItems, itemId) =>
      isComposite ? compositeItems?.length > 0 && itemId === null : productionOfDocumentApplications?.some((item) => item?.referenceId === order?.id);

    const hasMandatorySubmissionMatchingReference = hasMatchingReference(compositeMandatorySubmissionItems, mandatorySubmissionItemId);
    const hasBailMatchingReference = hasMatchingReference(compositeSetTermsOfBailItems, setTermBailItemId);

    if (hasMandatorySubmissionMatchingReference || hasBailMatchingReference) return false;

    if (!Boolean(caseDetails?.filingNumber) && Object?.keys(allAdvocates)?.length === 0) return false;

    //TODO : need to ask
    const isAuthority = isComposite
      ? order?.compositeItems?.find((item) => item?.orderType === "SET_BAIL_TERMS")?.orderSchema?.additionalDetails?.formdata?.partyId
      : order?.additionalDetails?.formdata?.partyId;

    let submissionParty = [];
    const formDataList = isComposite
      ? order?.compositeItems
          ?.filter((item) => item?.orderType === "MANDATORY_SUBMISSIONS_RESPONSES")
          ?.map((item) => item?.orderSchema?.additionalDetails?.formdata)
      : [order?.additionalDetails?.formdata];

    submissionParty =
      formDataList
        ?.flatMap((formData) =>
          formData?.submissionParty?.map(
            (item) => allAdvocates[caseDetails?.litigants?.find((litigant) => litigant?.individualId === item?.individualId)?.additionalDetails?.uuid]
          )
        )
        ?.flat()
        ?.filter(Boolean) || [];
    const allSubmissionParty = [...submissionParty, isAuthority].filter(Boolean);
    return (
      allSubmissionParty?.includes(userInfo?.uuid) &&
      userRoles.includes("SUBMISSION_CREATOR") &&
      [
        CaseWorkflowState.PENDING_ADMISSION_HEARING,
        CaseWorkflowState.PENDING_NOTICE,
        CaseWorkflowState.PENDING_RESPONSE,
        CaseWorkflowState.PENDING_ADMISSION,
        CaseWorkflowState.CASE_ADMITTED,
      ].includes(caseStatus)
    );
  }, [
    compositeMandatorySubmissionItems,
    mandatorySubmissionItemId,
    compositeSetTermsOfBailItems,
    setTermBailItemId,
    caseDetails,
    allAdvocates,
    isComposite,
    order,
    userInfo?.uuid,
    userRoles,
    caseStatus,
    productionOfDocumentApplications,
  ]);

  const showExtensionButton = useMemo(() => {
    const hasSetBailTerms = isComposite
      ? order?.compositeItems?.some((item) => item?.orderType === "SET_BAIL_TERMS")
      : order?.orderType === "SET_BAIL_TERMS";
    return (
      showSubmissionButtons &&
      !extensionApplications?.some((item) => item?.additionalDetails?.formdata?.refOrderId === order?.orderNumber) &&
      !hasSetBailTerms
    );
  }, [extensionApplications, order, showSubmissionButtons, isComposite]);

  useEffect(() => {
    const onDocumentUpload = async (fileData, filename) => {
      const fileUploadRes = await Digit.UploadServices.Filestorage("DRISTI", fileData, tenantId);
      return { file: fileUploadRes?.data, fileType: fileData.type, filename };
    };

    if (order?.filesData) {
      const numberOfFiles = order?.filesData.length;
      let finalDocumentData = [];
      if (numberOfFiles > 0) {
        order?.filesData.forEach((value) => {
          finalDocumentData.push({
            fileName: value?.[0],
            fileStoreId: value?.[1]?.fileStoreId,
            documentType: value?.[1]?.file?.type,
          });
        });
      }
      if (numberOfFiles > 0) {
        onDocumentUpload(order?.filesData[0][1]?.file, order?.filesData[0][0]).then((document) => {
          setFileName(order?.filesData[0][0]);
          setFileStoreID(document.file?.files?.[0]?.fileStoreId);
        });
      }
    }
  }, [order, tenantId]);

  const showSubmitDocumentButton = useMemo(() => {
    const hasSetBailTerms = isComposite
      ? order?.compositeItems?.some((item) => item?.orderType === "SET_BAIL_TERMS")
      : order?.orderType === "SET_BAIL_TERMS";
    return hasSetBailTerms ? showSubmissionButtons : showSubmissionButtons;
  }, [order, showSubmissionButtons, isComposite]);

  const showDocument = useMemo(() => {
    return (
      <div
        className="show-document-doc-container"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          maxHeight: "60vh",
          maxWidth: "100%",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {documents?.length > 0 ? (
          documents.map((docs) => (
            <DocViewerWrapper
              key={docs?.fileStore}
              docWidth={"calc(95vw * 62 / 100)"}
              docHeight={"unset"}
              fileStoreId={docs?.fileStore}
              tenantId={tenantId}
              displayFilename={docs?.additionalDetails?.name}
              showDownloadOption={false}
              documentName={docs?.additionalDetails?.name}
            />
          ))
        ) : (
          <h2>{isLoading ? t("Loading.....") : t("PREVIEW_DOC_NOT_AVAILABLE")}</h2>
        )}
      </div>
    );
  }, [documents, isLoading, t, tenantId]);

  useEffect(() => {
    fetchRecursiveData(order);
  }, [fetchRecursiveData, order]);

  return (
    <Modal
      headerBarMain={<Heading label={t("VIEW_ORDER_HEADING")} />}
      headerBarEnd={<CloseBtn onClick={handleOrdersTab} />}
      actionCancelLabel={null}
      actionCancelOnSubmit={() => {}}
      actionSaveLabel={null}
      hideSubmit={true}
      actionSaveOnSubmit={() => {}}
      popupStyles={{ minWidth: "880px", width: "80%" }}
    >
      {showDocument}
      {!isCitizen && (
        <React.Fragment>
          {" "}
          <h3 style={{ marginTop: "24px", marginBottom: "2px" }}>{t("BUSINESS_OF_THE_DAY")} </h3>
          <div style={{ display: "flex", gap: "10px" }}>
            <TextInput
              className="field desktop-w-full"
              onChange={(e) => {}}
              disable={true}
              value={diaryResponse?.entries?.[0]?.businessOfDay}
              style={{ minWidth: "500px" }}
              textInputStyle={{ maxWidth: "100%" }}
            />
          </div>
        </React.Fragment>
      )}

      <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
        <div
          onClick={() => {
            handleDownload(signedOrder?.fileStore);
          }}
          style={{ fontWeight: 700, fontSize: "16px", lineHeight: "18.75px", color: "#007E7E", cursor: "pointer" }}
        >
          {t("DOWNLOAD_ORDER_LINK")}
        </div>
        <div style={{ display: "flex", width: "50%", gap: "20px", justifyContent: "end" }}>
          {showExtensionButton && (
            <Button
              variation="secondary"
              onButtonClick={() => {
                handleRequestLabel(order.orderNumber, mandatorySubmissionItemId || setTermBailItemId, litigant, litigantIndId);
              }}
              className="primary-label-btn"
              label={t("EXTENSION_REQUEST_LABEL")}
            />
          )}
          {!loading && showSubmitDocumentButton && (
            <SubmitBar
              variation="primary"
              onSubmit={() => {
                handleSubmitDocument(order.orderNumber, mandatorySubmissionItemId || setTermBailItemId, litigant, litigantIndId);
              }}
              className="primary-label-btn"
              label={t("SUBMIT_DOCUMENT_LABEL")}
            ></SubmitBar>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default PublishedOrderModal;
