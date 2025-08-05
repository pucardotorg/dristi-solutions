import React, { useEffect, useState, useMemo, useCallback } from "react";
import Modal from "../../../components/Modal";
import { Dropdown, Loader, CloseSvg, TextInput, LabelFieldPair, CardLabel } from "@egovernments/digit-ui-react-components";
import { DRISTIService } from "../../../services";
import SuccessBannerModal from "../../../../../submissions/src/components/SuccessBannerModal";
import SignatureSuccessModal from "../../../../../submissions/src/components/SignatureSuccessModal";
import { MarkAsEvidenceAction } from "../../../Utils/submissionWorkflow";
import { getFullName } from "../../../../../cases/src/utils/joinCaseUtils";

const Heading = (props) => {
  return <h1 className="heading-m">{props.label}</h1>;
};

const CloseBtn = (props) => {
  return (
    <div
      onClick={props?.onClick}
      style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        paddingRight: "20px",
        cursor: "pointer",
        ...(props?.backgroundColor && { backgroundColor: props.backgroundColor }),
      }}
    >
      <CloseSvg />
    </div>
  );
};

const MarkAsEvidence = ({
  t,
  isEvidenceLoading = false,
  setShowMakeAsEvidenceModal,
  selectedRow,
  showToast,
  paginatedData,
  evidenceDetailsObj,
  setDocumentCounter = (e) => {
    console.log(e, "in ff");
  },
}) => {
  const [stepper, setStepper] = useState(0);
  const courtId = localStorage.getItem("courtId");
  const userInfo = Digit.UserService.getUser()?.info;
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo?.type]);
  const roles = useMemo(() => userInfo?.roles, [userInfo]);
  const isJudge = useMemo(() => roles?.some((role) => role.code === "CASE_APPROVER"), [roles]);
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const [evidenceDetails, setEvidenceDetails] = useState(evidenceDetailsObj || {});
  const [, setCaseDetails] = useState({});
  const [businessOfDay, setBusinessOfDay] = useState("");
  const [evidenceNumber, setEvidenceNumber] = useState("");
  const [evidenceNumberError, setEvidenceNumberError] = useState("");
  const [sealFileStoreId, setSealFileStoreId] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const name = "Signature";
  const pageModule = "en";
  const filingNumber = useMemo(() => {
    return evidenceDetailsObj?.filingNumber;
  }, [evidenceDetailsObj?.filingNumber]);
  const artifactNumber = useMemo(() => {
    return evidenceDetailsObj?.artifactNumber;
  }, [evidenceDetailsObj?.artifactNumber]);

  const { data: EvidenceNumberFormat, isLoading } = Digit.Hooks.useCommonMDMS(Digit.ULBService.getStateId(), "Evidence", ["Tag"], {
    select: (data) => {
      return { data: data?.Evidence?.Tag };
    },
    retry: false,
  });

  const memoEvidenceValues = useMemo(() => {
    return {
      title: evidenceDetails?.artifactType,
      artifactNumber: evidenceDetails?.artifactNumber,
      sourceType: evidenceDetails?.sourceType,
      owner: evidenceDetails?.owner,
    };
  }, [evidenceDetails]);
  const evidenceTag = useMemo(() => {
    return EvidenceNumberFormat?.data?.find((item) => item?.sourceType === evidenceDetails?.sourceType)?.evidenceTag || "";
  }, [evidenceDetails, EvidenceNumberFormat]);

  // Commented out unused hook
  // const { downloadFilesAsZip } = Digit.Hooks.dristi.useDownloadFiles();
  // const downloadFiles = async () => {
  //   try {
  //     const response = await downloadFilesAsZip(
  //       tenantId,
  //       [
  //         { fileStoreId: "c694ddb7-414f-43f2-9f96-e49ceca67a67", fileName: "Document1" },
  //         { fileStoreId: "33bd7436-c10b-4ede-b93a-1dc05256560e", fileName: "Document2" },
  //       ],
  //       "MyArchive"
  //     );
  //   } catch (error) {
  //     console.error("Error downloading files:", error);
  //   }
  // };
  // downloadFiles();
  const getMarkAsEvidencePdf = async () => {
    try {
      const response = await DRISTIService.getMarkAsEvidencePdf(
        {
          Evidence: {
            courtId: courtId,
            markedAs: `${evidenceTag}${evidenceNumber}`,
            caseNumber: filingNumber,
            markedThrough: businessOfDay || "Evidence Portal", // NEED TO UPDATE THIS VALUE
          },
        },
        {
          tenantId,
          qrCode: false,
          evidencePdfType: "evidence-seal",
        }
      );
      const pdfFile = new File([response], "evidence_seal.pdf", { type: "application/pdf" });
      const fileUploadRes = await Digit.UploadServices.Filestorage("DRISTI", pdfFile, Digit.ULBService.getCurrentTenantId());
      const fileStoreId = fileUploadRes?.data?.files?.[0]?.fileStoreId;
      setSealFileStoreId(fileStoreId);
      return fileStoreId;
    } catch (error) {
      console.error("Error creating PDF seal:", error);
      showToast({
        isError: true,
        message: t("ERROR_CREATING_EVIDENCE_SEAL"),
      });
      return null;
    }
  };

  useEffect(() => {
    const getEvidenceDetails = async () => {
      try {
        const response = await DRISTIService.searchEvidence(
          {
            criteria: {
              courtId: courtId,
              filingNumber: filingNumber,
              artifactNumber: artifactNumber,
              tenantId,
            },

            tenantId,
          },
          {}
        );
        const customEvidenceNumber =
          response?.artifacts?.[0]?.evidenceNumber?.length > 1
            ? response?.artifacts?.[0]?.evidenceNumber?.slice(1)
            : response?.artifacts?.[0]?.evidenceNumber;
        setStepper(response?.artifacts?.[0]?.evidenceMarkedStatus === null ? 0 : 1);
        setEvidenceNumber(customEvidenceNumber);
        setEvidenceDetails(response?.artifacts?.[0]);
        if (response?.artifacts?.[0]?.additionalDetails?.botd) setBusinessOfDay(response?.artifacts?.[0]?.additionalDetails?.botd);
      } catch (error) {
        showToast({
          isError: false,
          message: "SUCCESSFULLY_MARKED_AS_VOID_MESSAGE",
        });
        console.log("error fetching evidence details", error);
      }
    };
    const getCaseDetails = async () => {
      try {
        const response = await DRISTIService.searchCaseService(
          {
            criteria: [
              {
                filingNumber: filingNumber,
                ...(courtId && userType === "employee" && { courtId }),
              },
            ],
            tenantId,
          },
          {}
        );
        setCaseDetails(response?.criteria[0]?.responseList[0]);
      } catch (error) {
        // console.log("error fetching case details", error);
      }
    };
    const getIndividualDetails = async (sourceId) => {
      const individualResponse = await DRISTIService.searchIndividualUser(
        {
          Individual: {
            individualId: sourceId,
          },
        },
        { tenantId, limit: 1000, offset: 0 }
      );
      const individualData = individualResponse?.Individual?.[0];
      const fullName = getFullName(" ", individualData?.name?.givenName, individualData?.name?.otherNames, individualData?.name?.familyName);
      setOwnerName(fullName);
    };

    if (!evidenceDetailsObj) getEvidenceDetails();
    else {
      if (evidenceDetailsObj?.owner === null) {
        getIndividualDetails(evidenceDetailsObj?.sourceID);
      } else setOwnerName(evidenceDetailsObj?.owner);
      if (evidenceDetailsObj?.evidenceNumber === null) setStepper(0);
      else setStepper(1);
      const customEvidenceNumber =
        evidenceDetailsObj?.evidenceNumber?.length > 1 ? evidenceDetailsObj?.evidenceNumber?.slice(1) : evidenceDetailsObj?.evidenceNumber;
      setEvidenceNumber(customEvidenceNumber);
      setBusinessOfDay(evidenceDetailsObj?.additionalDetails?.botd || `Document marked as evidence exhibit number ${artifactNumber}`);
    }
    if (filingNumber) getCaseDetails();
  }, [filingNumber, courtId, userType, tenantId, artifactNumber, showToast, evidenceDetailsObj]);

  const handleMarkEvidence = async (action, seal = null) => {
    try {
      if (action === null) return;
      const payload = {
        ...evidenceDetails,
        evidenceNumber: `${evidenceTag}${evidenceNumber}`,
        isEvidenceMarkedFlow: true,
        additionalDetails: {
          ...evidenceDetails?.additionalDetails,
          botd: businessOfDay,
          ownerName: ownerName,
        },
        ...(seal !== null && { seal }),
        workflow: {
          action: action,
        },
      };
      await DRISTIService.updateEvidence({ artifact: payload }, {}).then((res) => {
        setEvidenceDetails(res?.artifact);
      });
      //  await DRISTIService.addADiaryEntry(
      //         {
      //           diaryEntry: {
      //             courtId: courtId,
      //             businessOfDay: businessOfTheDay,
      //             tenantId: tenantId,
      //             entryDate: new Date().setHours(0, 0, 0, 0),
      //             caseNumber: caseData?.case?.cmpNumber,
      //             referenceId: documentSubmission?.[0]?.artifactList?.artifactNumber,
      //             referenceType: "Documents",
      //             hearingDate: (Array.isArray(nextHearing) && nextHearing.length > 0 && nextHearing[0]?.startTime) || null,
      //             additionalDetails: {
      //               filingNumber: filingNumber,
      //               caseId: caseId,
      //             },
      //           },
      //         },
      //         {}
      //       ).catch((error) => {
      //         console.error("error: ", error);
      //         toast.error(t("SOMETHING_WENT_WRONG"));
      //         setIsSubmitDisabled(false);
      //       });
      // onSuccess();
      return true;
    } catch (error) {
      if (error?.response?.data?.Errors?.[0]?.code === "EVIDENCE_NUMBER_EXISTS_EXCEPTION") {
        setEvidenceNumberError(error?.response?.data?.Errors?.[0]?.code);
        setStepper(0);
      }
      showToast({
        isError: true,
        message: t("EVIDENCE_UPDATE_ERROR_MESSAGE"),
      });
      return false;
    }
  };

  const handleSubmit = async (action) => {
    try {
      if (stepper === 0) {
        if (businessOfDay === null || businessOfDay === "") {
          setBusinessOfDay(`Document marked as evidence exhibit number ${artifactNumber}`);
        }
        await handleMarkEvidence(
          evidenceDetails?.evidenceMarkedStatus === null ? MarkAsEvidenceAction?.CREATE : MarkAsEvidenceAction?.SAVEDRAFT
        ).then((res) => {
          if (res) {
            setStepper(1);
          }
        });
      } else if (stepper === 1) {
        const fileStoreId = await getMarkAsEvidencePdf();
        if (fileStoreId && action !== null) {
          const seal = {
            documentType: "unsignedSeal",
            fileStore: fileStoreId,
            additionalDetails: {
              documentName: "markAsEvidence.pdf",
            },
          };

          await handleMarkEvidence(action, seal).then((res) => {
            if (res && action === "EDIT") {
              setStepper(0);
            }
            if (res && action === "SUBMIT_BULK_E-SIGN") {
              setShowMakeAsEvidenceModal(false);
              showToast({
                isError: false,
                message: t("SUCCESSFULLY_SENT_FOR_E-SIGNING_MARKED_MESSAGE"),
              });
            }
          });
        }
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      showToast({
        isError: true,
        message: t("ERROR_UPDATING_EVIDENCE"),
      });
    }
  };

  const handleCancel = async () => {
    try {
      if (stepper === 0) {
        setShowMakeAsEvidenceModal(false);
        setDocumentCounter((prevCount) => prevCount + 1);
      } else if (stepper === 1) {
        if (evidenceDetails?.evidenceMarkedStatus === "DRAFT_IN_PROGRESS" || evidenceDetails?.evidenceMarkedStatus === null) {
          setStepper(0);
        } else if (evidenceDetails?.evidenceMarkedStatus !== "COMPLETED" && evidenceDetails?.evidenceMarkedStatus !== "DRAFT_IN_PROGRESS") {
          await handleMarkEvidence(MarkAsEvidenceAction?.EDIT).then((res) => {
            if (res) {
              setStepper(0);
            }
          });
        } else {
          setShowMakeAsEvidenceModal(false);

          setDocumentCounter((prevCount) => prevCount + 1);
        }
      }
    } catch (error) {
      console.error("Error in handleCancel:", error);
    }
  };
  const onESignClick = useCallback(() => {
    try {
      // setLoader(true);

      sessionStorage.setItem("markAsEvidenceStepper", stepper);
      sessionStorage.setItem("markAsEvidenceSelectedItem", JSON.stringify(evidenceDetails));
      sessionStorage.setItem("homeActiveTab", "BULK_EVIDENCE_SIGN");
      if (paginatedData?.limit) sessionStorage.setItem("bulkMarkAsEvidenceLimit", paginatedData?.limit);
      if (paginatedData?.caseTitle) sessionStorage.setItem("bulkMarkAsEvidenceSignCaseTitle", paginatedData?.caseTitle);
      if (paginatedData?.offset) sessionStorage.setItem("bulkMarkAsEvidenceOffset", paginatedData?.offset);
      // handleEsign(name, pageModule, selectedMarkAsEvidenceFilestoreid, "Magistrate Signature");
    } catch (error) {
      console.log("E-sign navigation error:", error);
      // setLoader(false);
    } finally {
      // setLoader(false);
    }
  }, [stepper, evidenceDetails, paginatedData?.limit, paginatedData?.caseTitle, paginatedData?.offset]);

  if (isLoading) return <Loader />;

  return (
    <React.Fragment>
      {stepper === 0 && (
        <Modal
          headerBarEnd={<CloseBtn onClick={() => (isEvidenceLoading ? null : handleCancel())} />}
          actionSaveLabel={t("CS_PROCEED")}
          actionSaveOnSubmit={handleSubmit}
          actionCancelLabel={t("CS_COMMON_CANCEL")}
          isBackButtonDisabled={isEvidenceLoading}
          isDisabled={isEvidenceLoading}
          actionCancelOnSubmit={handleCancel}
          formId="modal-action"
          headerBarMain={<Heading label={t("ACTIONS_MARK_EVIDENCE_TEXT")} />}
          className="mark-evidence-modal"
          submitTextClassName="upload-signature-button"
          popupModuleMianClassName="mark-evidence-modal-main"
          popupModuleActionBarStyles={{ padding: "16px" }}
        >
          <div
            className="mark-evidence-modal-body"
            style={{ display: "flex", flexDirection: "column", padding: 24, borderBottom: "1px solid #E8E8E8", gap: "24px" }}
          >
            <LabelFieldPair>
              <CardLabel className="case-input-label">{t("DOCUMENT_TITLE")}</CardLabel>
              <TextInput
                className="disabled text-input"
                type="text"
                value={t(memoEvidenceValues?.title)}
                disabled
                style={{ minWidth: 120, textAlign: "start", marginBottom: "0px" }}
              />
            </LabelFieldPair>
            <LabelFieldPair>
              <CardLabel className="case-input-label">{t("UPLOADED_BY")}</CardLabel>
              <TextInput
                className="disabled text-input"
                type="text"
                value={memoEvidenceValues?.owner || ownerName}
                disabled
                style={{ minWidth: 120, textAlign: "start", marginBottom: "0px" }}
              />
            </LabelFieldPair>

            <LabelFieldPair>
              <CardLabel className="case-input-label">{t("EVIDENCE_MARKED_THROUGH")}</CardLabel>
              <Dropdown
                t={t}
                placeholder={`${t("PURPOSE")}`}
                option={[]}
                // selected={filters?.purpose}
                optionKey={"code"}
                select={(e) => {
                  //   setFilters((prev) => ({ ...prev, purpose: e }));
                }}
                topbarOptionsClassName={"top-bar-option"}
                style={{
                  marginBottom: "1px",
                  width: "100%",
                }}
              />
            </LabelFieldPair>
            <div>
              <LabelFieldPair>
                <CardLabel className="case-input-label">{t("EVIDENCE_NUMBER")}</CardLabel>
                <div style={{ display: "flex", gap: "10px" }}>
                  <TextInput
                    className="disabled text-input"
                    type="text"
                    value={t(evidenceTag)}
                    disabled
                    style={{ textAlign: "start", marginBottom: "0px" }}
                  />
                  <TextInput
                    className="text-input"
                    type="text"
                    value={evidenceNumber}
                    onChange={(e) => setEvidenceNumber(e.target.value)}
                    style={{ textAlign: "start", marginBottom: "0px" }}
                  />
                </div>
                {evidenceNumberError && <div style={{ color: "red", fontSize: "12px", paddingTop: "5px" }}>{t(evidenceNumberError)}</div>}
              </LabelFieldPair>
            </div>
          </div>
        </Modal>
      )}

      {stepper === 1 && (
        <Modal
          headerBarEnd={<CloseBtn onClick={() => (isEvidenceLoading ? null : setShowMakeAsEvidenceModal(false))} />}
          actionSaveLabel={isJudge ? t("CS_ESIGN") : t("SEND_FOR_SIGN")}
          actionCustomLabelSubmit={() => handleSubmit(MarkAsEvidenceAction?.BULKSIGN)}
          actionCustomLabel={isJudge && evidenceDetails?.evidenceMarkedStatus === "DRAFT_IN_PROGRESS" ? t("SEND_FOR_SIGN") : false}
          actionSaveOnSubmit={() => (isJudge ? onESignClick() : handleSubmit(isJudge ? "" : MarkAsEvidenceAction?.BULKSIGN))}
          actionCancelLabel={
            evidenceDetails?.evidenceMarkedStatus === "DRAFT_IN_PROGRESS" || evidenceDetails?.evidenceMarkedStatus === null
              ? t("CS_BULK_BACK")
              : t("EDIT_DETAILS")
          }
          isBackButtonDisabled={isEvidenceLoading}
          isDisabled={isEvidenceLoading}
          actionCancelOnSubmit={handleCancel}
          formId="modal-action"
          customActionTextStyle={{ color: "#007e7e" }}
          customActionStyle={{ background: "transparent", border: "1px solid #007e7e" }}
          headerBarMain={<Heading label={t("CONFIRM_EVIDENCE_HEADER")} />}
          className="mark-evidence-modal"
          submitTextClassName="upload-signature-button"
          popupModuleMianClassName="mark-evidence-modal-main"
          popupModuleActionBarStyles={{ padding: "16px" }}
        >
          <div className="mark-evidence-modal-body">
            <div className="application-info" style={{ display: "flex", flexDirection: "column" }}>
              <div className="info-row" style={{ display: "flex" }}>
                <div className="info-key" style={{ width: "300px", minWidth: "300px" }}>
                  <h3>{t("DOCUMENT_TITLE")}</h3>
                </div>
                <div className="info-value" style={{ flex: 1 }}>
                  <h3>{t(memoEvidenceValues?.title)}</h3>
                </div>
              </div>
              <div className="info-row" style={{ display: "flex" }}>
                <div className="info-key" style={{ width: "300px", minWidth: "300px" }}>
                  <h3>{t("UPLOADED_BY")}</h3>
                </div>
                <div className="info-value" style={{ flex: 1 }}>
                  <h3>{t(memoEvidenceValues?.owner)}</h3>
                </div>
              </div>

              <div className="info-row" style={{ display: "flex" }}>
                <div className="info-key" style={{ width: "300px", minWidth: "300px" }}>
                  <h3>{t("EVIDENCE_MARKED_THROUGH")}</h3>
                </div>
                <div className="info-value" style={{ flex: 1 }}>
                  <h3>{}</h3>
                </div>
              </div>
              <div className="info-row" style={{ display: "flex" }}>
                <div className="info-key" style={{ width: "300px", minWidth: "300px" }}>
                  <h3>{t("EVIDENCE_NUMBER")}</h3>
                </div>
                <div className="info-value" style={{ flex: 1 }}>
                  <h3>{`${evidenceTag}${evidenceNumber}`}</h3>
                </div>
              </div>
            </div>
            <LabelFieldPair>
              <CardLabel className="case-input-label">{t("BUSINESS_OF_THE_DAY")}</CardLabel>
              <TextInput
                className="text-input"
                type="text"
                value={businessOfDay}
                onChange={(e) => setBusinessOfDay(e.target.value)}
                style={{ minWidth: 120, textAlign: "start", marginBottom: "0px" }}
              />
            </LabelFieldPair>
          </div>
        </Modal>
      )}
      {stepper === 2 && (
        <SignatureSuccessModal
          t={t}
          handleCancel={() => setStepper(0)}
          handleSubmit={() => setStepper(3)}
          title="ADD_SIGNATURE"
          noteText="YOUR_CUSTOM_NOTE"
          containerStyle={{ padding: "20px", backgroundColor: "#f8f8f8" }}
          headingStyle={{ color: "#0b0c28", fontSize: "28px" }}
          // signedBadgeStyle={{ backgroundColor: "#ccffcc", color: "#006600" }}
          infoCardStyle={{ fontStyle: "italic" }}
        />
      )}

      {stepper === 3 && <SuccessBannerModal t={t} handleCloseSuccessModal={() => setStepper(3)} message={"MARK_AS_EVIDENCE_SUCCESS"} />}
    </React.Fragment>
  );
};

export default MarkAsEvidence;
