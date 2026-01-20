import React, { useEffect, useMemo, useState } from "react";
import { Button, Loader, TextInput } from "@egovernments/digit-ui-react-components";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { useTranslation } from "react-i18next";
import TasksComponent from "../../components/TaskComponent";
import { FileUploadIcon } from "@egovernments/digit-ui-module-dristi/src/icons/svgIndex";
import AuthenticatedLink from "@egovernments/digit-ui-module-dristi/src/Utils/authenticatedLink";
import { Urls } from "../../hooks";
import { CloseSvg, InfoCard } from "@egovernments/digit-ui-components";
import { HomeService } from "../../hooks/services";
import { BreadCrumb } from "@egovernments/digit-ui-react-components";

const getStyles = () => ({
  container: { display: "flex", flexDirection: "row", padding: 10 },
  centerPanel: { flex: 3, padding: 30, border: "1px solid #e0e0e0", marginLeft: "20px" },
  title: { width: "584px", height: "38px", color: "#0A0A0A", fontSize: "32px", fontWeight: 700, marginBottom: "20px" },
  rightPanel: { flex: 1, padding: "24px 16px 24px 24px", borderLeft: "1px solid #ccc" },
  signaturePanel: { display: "flex", flexDirection: "column" },
  signatureTitle: { fontSize: "24px", fontWeight: 700, color: "#3D3C3C" },
  goButton: { padding: "8px 16px", boxShadow: "none" },
  rowDataStyle: { padding: "18px", border: "1px solid #000" },
  linkRowDataStyle: { color: "#007E7E", textDecoration: "none", cursor: "pointer" },
});

const CloseBtn = ({ onClick }) => {
  return (
    <div
      onClick={onClick}
      style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        paddingRight: "20px",
        cursor: "pointer",
      }}
    >
      <CloseSvg />
    </div>
  );
};

const Heading = ({ label }) => {
  return (
    <div className="evidence-title">
      <h1 className="heading-m">{label}</h1>
    </div>
  );
};

const formatDate = (date) => {
  if (!date) return "";
  const convertedDate = new Date(date);
  return convertedDate.toLocaleDateString();
};

const bredCrumbStyle = { maxWidth: "min-content", borderBottom: "none" };

const ProjectBreadCrumb = ({ location }) => {
  const { t } = useTranslation();
  const userType = Digit?.UserService?.getType();
  const crumbs = [
    {
      path: `/${window?.contextPath}/${userType}`,
      content: t("ES_COMMON_HOME"),
      show: true,
    },
    {
      path: `/${window?.contextPath}/${userType}/home/dashboard`,
      content: t("ES_DASHBOARD"),
      show: true,
    },
    {
      path: `/${window?.contextPath}/${userType}/home/dashboard/adiary`,
      content: t(location.pathname.split("/").pop().toUpperCase()),
      show: true,
      isLast: true,
    },
  ];
  return <BreadCrumb crumbs={crumbs} spanStyle={bredCrumbStyle} />;
};

const ADiaryPage = ({ path }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const getCurrentDate = (date) => {
    const today = date ? new Date(parseInt(date)) : new Date();
    return new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split("T")[0];
  };
  const Digit = window.Digit || {};

  const queryStrings = Digit.Hooks.useQueryParams();

  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const userInfo = Digit?.UserService?.getUser()?.info;
  const userInfoType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo]);
  const userRoles = useMemo(() => userInfo?.roles, [userInfo]);
  const styles = getStyles();
  const [selectedDate, setSelectedDate] = useState(
    getCurrentDate(queryStrings?.date?.split("-")[1] || sessionStorage.getItem("selectedADiaryDate") || "")
  );
  const [entryDate, setEntryDate] = useState(
    parseInt(queryStrings?.date?.split("-")[1] || sessionStorage.getItem("selectedADiaryDate")) || new Date().setHours(0, 0, 0, 0)
  );
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo]);
  const isEpostUser = useMemo(() => userRoles?.some((role) => role?.code === "POST_MANAGER"), [userRoles]);
  let homePath = `/${window?.contextPath}/${userType}/home/home-pending-task`;
  if (!isEpostUser && userType === "employee") homePath = `/${window?.contextPath}/${userType}/home/home-screen`;
  const hasViewSignADiaryAccess = useMemo(() => userRoles?.some((role) => role?.code === "DIARY_VIEWER"), [userRoles]);

  const [offSet, setOffset] = useState(0);
  const limit = 10;
  const [taskType, setTaskType] = useState({});
  const name = "Signature";
  const pageModule = "en";

  const [ADiarypdf, setADiarypdf] = useState(sessionStorage.getItem("adiarypdf") || "");
  const [isSelectedDataSigned, setIsSelectedDataSigned] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [stepper, setStepper] = useState(parseInt(sessionStorage.getItem("adiaryStepper")) || 0);

  const [openUploadSignatureModal, setOpenUploadSignatureModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [fileStoreIds, setFileStoreIds] = useState(new Set());
  const [signedDocumentUploadID, setSignedDocumentUploadID] = useState("");
  const [generateAdiaryLoader, setGenerateAdiaryLoader] = useState(false);
  const [noAdiaryModal, setNoAdiaryModal] = useState(false);
  const [loader, setLoader] = useState(false);

  const DocViewerWrapper = Digit?.ComponentRegistryService?.getComponent("DocViewerWrapper");
  const MemoDocViewerWrapper = React.memo(DocViewerWrapper);
  const Modal = window?.Digit?.ComponentRegistryService?.getComponent("Modal");
  const UploadSignatureModal = window?.Digit?.ComponentRegistryService?.getComponent("UploadSignatureModal");

  const roles = useMemo(() => userInfo?.roles, [userInfo]);
  const isDiaryApprover = useMemo(() => roles?.some((role) => role?.code === "DIARY_APPROVER"), [roles]);

  const { uploadDocuments } = Digit.Hooks.orders.useDocumentUpload();

  const { handleEsign, checkSignStatus } = Digit.Hooks.orders.useESign();

  const uri = `${window.location.origin}${Urls.FileFetchById}?tenantId=${tenantId}&fileStoreId=${ADiarypdf}`;

  const uploadModalConfig = useMemo(() => {
    return {
      key: "uploadSignature",
      populators: {
        inputs: [
          {
            name,
            type: "DragDropComponent",
            uploadGuidelines: "Ensure the image is not blurry and under 5MB.",
            maxFileSize: 10,
            maxFileErrorMessage: "CS_FILE_LIMIT_10_MB",
            fileTypes: ["JPG", "PNG", "JPEG", "PDF"],
            isMultipleUpload: false,
          },
        ],
        validation: {},
      },
    };
  }, [name]);

  const onCancel = () => {
    sessionStorage.setItem("adiaryStepper", parseInt(stepper) - 1);
    if (parseInt(stepper) === 1) {
      sessionStorage.removeItem("adiarypdf");
      sessionStorage.removeItem("adiaryStepper");
      sessionStorage.removeItem("selectedADiaryDate");
    } else if (parseInt(stepper) === 2) {
      setIsSigned(false);
      setSignedDocumentUploadID("");
      setFormData({});
      sessionStorage.removeItem("fileStoreId");
    }
    setStepper(parseInt(stepper) - 1);
  };
  const courtId = localStorage.getItem("courtId");

  const onSubmit = async () => {
    if (parseInt(stepper) === 0) {
      setGenerateAdiaryLoader(true);
      try {
        const generateADiaryPDF = await HomeService.generateADiaryPDF({
          diary: {
            tenantId: tenantId,
            diaryDate: entryDate,
            diaryType: "ADiary",
            courtId: courtId,
          },
        });
        setGenerateAdiaryLoader(false);
        setADiarypdf(generateADiaryPDF?.fileStoreID);
        setFileStoreIds((prevFileStoreIds) => new Set([...prevFileStoreIds, generateADiaryPDF?.fileStoreID]));
        sessionStorage.setItem("adiaryStepper", parseInt(stepper) + 1);
        setStepper(parseInt(stepper) + 1);
      } catch (error) {
        console.error("Error :", error);
        setGenerateAdiaryLoader(false);
      }
    } else if (parseInt(stepper) === 1) {
      sessionStorage.setItem("adiaryStepper", parseInt(stepper) + 1);
      setStepper(parseInt(stepper) + 1);
      sessionStorage.setItem("adiarypdf", ADiarypdf);
    }
  };

  const onSelect = (key, value) => {
    if (value?.Signature === null) {
      setFormData({});
      setIsSigned(false);
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [key]: value,
      }));
    }
  };

  const onUploadSubmit = async () => {
    if (formData?.uploadSignature?.Signature?.length > 0) {
      try {
        setLoader(true);
        const uploadedFileId = await uploadDocuments(formData?.uploadSignature?.Signature, tenantId);
        setSignedDocumentUploadID(uploadedFileId?.[0]?.fileStoreId);
        setFileStoreIds((prevFileStoreIds) => new Set([...prevFileStoreIds, uploadedFileId?.[0]?.fileStoreId]));
        setIsSigned(true);
        setOpenUploadSignatureModal(false);
      } catch (error) {
        console.error("error", error);
        setLoader(false);
        setFormData({});
        setIsSigned(false);
      }
      setLoader(false);
    }
  };

  useEffect(() => {
    checkSignStatus(name, formData, uploadModalConfig, onSelect, setIsSigned);
  }, [checkSignStatus]);

  useEffect(() => {
    const getDiarySearch = async () => {
      try {
        const diary = await HomeService.getADiarySearch({
          criteria: {
            tenantId: tenantId,
            courtId: courtId,
            date: entryDate,
          },
        });
        const diaries = diary?.diaries;
        if (Array.isArray(diaries) && diaries?.length > 0) {
          setIsSelectedDataSigned(true);
          setADiarypdf(diaries[0]?.fileStoreID);
          setFileStoreIds((prevFileStoreIds) => new Set([...prevFileStoreIds, diaries[0]?.fileStoreID]));
        } else {
          setIsSelectedDataSigned(false);
        }
      } catch (error) {
        console.error("Error :", error);
      }
    };
    getDiarySearch();
  }, [entryDate, tenantId, courtId]);

  const uploadSignedPdf = async () => {
    try {
      const localStorageID = sessionStorage.getItem("fileStoreId");
      const newFilestore = signedDocumentUploadID || localStorageID;
      fileStoreIds.delete(newFilestore);
      if (ADiarypdf) {
        fileStoreIds.delete(ADiarypdf);
      }
      await HomeService.updateADiaryPDF({
        diary: {
          tenantId: tenantId,
          diaryDate: entryDate,
          diaryType: "ADiary",
          courtId: courtId,
          documents: [
            {
              tenantId: tenantId,
              fileStoreId: signedDocumentUploadID || localStorageID,
              isActive: true,
            },
            {
              tenantId: tenantId,
              fileStoreId: ADiarypdf,
              isActive: false,
            },
            ...Array.from(fileStoreIds).map((fileStoreId) => ({
              fileStoreId: fileStoreId,
              tenantId: tenantId,
              isActive: false,
            })),
          ],
        },
      });
      setStepper(0);
      setIsSelectedDataSigned(true);
      setADiarypdf(signedDocumentUploadID || localStorageID);
      sessionStorage.removeItem("fileStoreId");
      sessionStorage.removeItem("adiarypdf");
      sessionStorage.removeItem("adiaryStepper");
    } catch (error) {
      console.error("Error :", error);
      setIsSigned(false);
      setSignedDocumentUploadID("");
      sessionStorage.removeItem("fileStoreId");
      setIsSelectedDataSigned(false);
    }
  };

  const { data: diaryEntries, isLoading: isDiaryEntriesLoading, refetch: refetchDiaryEntries } = Digit.Hooks.dristi.useSearchADiaryService(
    {
      criteria: {
        tenantId: tenantId,
        courtId: courtId,
        date: entryDate,
      },
      pagination: {
        limit,
        offSet,
      },
    },
    {},
    `diary-entries-${entryDate}-${offSet}`,
    entryDate,
    Boolean(entryDate && courtId)
  );
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleGoClick = () => {
    const updatedDate = new Date(selectedDate).setHours(0, 0, 0, 0);
    setEntryDate(updatedDate);
    sessionStorage.setItem("selectedADiaryDate", updatedDate);
    if (queryStrings) {
      history.push(`/${window.contextPath}/employee/home/dashboard/adiary`);
    }
  };

  useEffect(() => {
    if (Array.isArray(diaryEntries?.entries) && diaryEntries?.entries?.length == 0) setNoAdiaryModal(true);
  }, [diaryEntries]);

  if (!DocViewerWrapper) {
    console.error("DocViewerWrapper is not available");
    return null;
  }

  const handleNext = () => {
    if (diaryEntries?.pagination?.totalCount > offSet + limit) {
      setOffset((prevOffset) => prevOffset + limit);
    }
  };

  const handlePrevious = () => {
    if (offSet > 0) {
      setOffset((prevOffset) => Math.max(prevOffset - limit, 0));
    }
  };

  const handleRowClick = (entry) => {
    if (entry?.referenceType === "Order") {
      history.push(
        `/${window?.contextPath}/${userInfoType}/orders/generate-order?filingNumber=${entry?.additionalDetails?.filingNumber}&orderNumber=${entry?.referenceId}`,
        { diaryEntry: entry }
      );
    }
    if (entry?.referenceType === "Documents") {
      history.push(
        `/${window?.contextPath}/${userInfoType}/dristi/home/view-case?caseId=${entry?.additionalDetails?.caseId}&filingNumber=${entry?.additionalDetails?.filingNumber}&tab=Documents&artifactNumber=${entry?.referenceId}`,
        { diaryEntry: entry }
      );
    }
    if (entry?.referenceType === "notice") {
      history.push(`/${window?.contextPath}/${userInfoType}/hearings`, { diaryEntry: entry });
    }
  };

  if (!hasViewSignADiaryAccess) {
    history.push(homePath);
  }

  if (isDiaryEntriesLoading || generateAdiaryLoader) {
    return <Loader />;
  }
  return (
    <React.Fragment>
      <ProjectBreadCrumb location={window.location} />
      <div style={styles.container}>
        <div style={styles.centerPanel}>
          {!isSelectedDataSigned && <div style={styles.title}>{t("SIGN_THE_A_DIARY")}</div>}
          <div style={{ display: "flex", gap: "40px", marginTop: "10px", marginBottom: "20px" }}>
            <div style={{ marginTop: "10px", fontWeight: "bold" }}>{t("A_DIARY_DATED_HEADING")}</div>
            <TextInput
              className="field desktop-w-full"
              key={"entryDate"}
              type={"date"}
              onChange={handleDateChange}
              style={{ paddingRight: "3px" }}
              defaultValue={selectedDate}
              max={new Date().toISOString().split("T")[0]}
            />
            <Button label={t("GO")} variation={"primary"} style={styles.goButton} onButtonClick={handleGoClick} />
          </div>
          {!isSelectedDataSigned ? (
            <React.Fragment>
              {Array.isArray(diaryEntries?.entries) && diaryEntries?.entries?.length !== 0 ? (
                <div>
                  <table style={{ width: "100%", marginTop: "20px", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#007E7E", color: "#FFF" }}>
                        <th style={styles.rowDataStyle}>{t("S_NO")}</th>
                        <th style={styles.rowDataStyle}>{t("CASE_TYPE_CASE_NUMBER_CASE_YEAR")}</th>
                        <th style={styles.rowDataStyle}>{t("PROCEEDINGS_OR_BUSINESS_OF_DAY")}</th>
                        <th style={styles.rowDataStyle}>{t("NEXT_HEARING_DATE")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {diaryEntries?.entries?.map((entry, index) => (
                        <tr key={index}>
                          <td style={styles.rowDataStyle}>{index + 1}</td>
                          <td style={styles.rowDataStyle}>{entry?.caseNumber}</td>
                          <td
                            style={{ ...styles.rowDataStyle, ...styles.linkRowDataStyle, whiteSpace: "pre-line" }}
                            onClick={() => handleRowClick(entry)}
                            onMouseEnter={(e) => (e.target.style.textDecoration = "underline")}
                            onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
                          >
                            {entry?.businessOfDay}
                          </td>
                          <td style={{ padding: "18px", border: "1px solid #000" }}>{entry?.hearingDate ? formatDate(entry?.hearingDate) : ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "30px" }}>
                    <button onClick={handlePrevious} disabled={offSet === 0} style={{ padding: "8px 12px", cursor: "pointer" }}>
                      {t("PREVIOUS")}
                    </button>
                    <span>
                      {diaryEntries?.pagination?.totalCount > 0 ? offSet + 1 : 0} - {Math.min(offSet + limit, diaryEntries?.pagination?.totalCount)}{" "}
                      of {diaryEntries?.pagination?.totalCount}
                    </span>
                    <button
                      onClick={handleNext}
                      disabled={offSet + limit >= diaryEntries?.pagination?.totalCount}
                      style={{ padding: "8px 12px", cursor: "pointer" }}
                    >
                      {t("NEXT")}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "20px" }}>
                  {t("NO_DIARYENTRY_FOUND")}
                </div>
              )}
            </React.Fragment>
          ) : (
            <MemoDocViewerWrapper
              key={ADiarypdf}
              fileStoreId={ADiarypdf}
              tenantId={tenantId}
              docWidth="100%"
              docHeight="70vh"
              showDownloadOption={false}
              documentName={"ADiary"}
            />
          )}
        </div>
        <div style={styles.rightPanel}>
          {isDiaryApprover && (
            <div>
              {!isSelectedDataSigned &&
                entryDate !== new Date().setHours(0, 0, 0, 0) &&
                Array.isArray(diaryEntries?.entries) &&
                diaryEntries?.entries?.length !== 0 && (
                  <Button onButtonClick={onSubmit} label={t("ADD_SIGNATURE")} style={{ margin: "20px", maxWidth: "300px", width: "100%" }} />
                )}

              <TasksComponent
                taskType={taskType}
                setTaskType={setTaskType}
                isLitigant={userRoles.includes("CITIZEN")}
                uuid={userInfo?.uuid}
                userInfoType={userInfoType}
                hideFilters={true}
                isDiary={true}
              />
            </div>
          )}
        </div>
        <div className="adiary-container">
          {stepper === 1 && (
            <Modal
              headerBarEnd={<CloseBtn onClick={onCancel} />}
              headerBarMain={true}
              popupStyles={{ width: "70vw" }}
              actionCancelLabel={t("CORE_LOGOUT_CANCEL")}
              actionCancelOnSubmit={onCancel}
              actionSaveLabel={t("CS_COMMON_SUBMIT")}
              actionSaveOnSubmit={onSubmit}
              formId="modal-action"
              headerBarMainStyle={{ height: "50px" }}
            >
              <MemoDocViewerWrapper
                key={ADiarypdf}
                fileStoreId={ADiarypdf}
                tenantId={tenantId}
                docWidth="100%"
                docHeight="70vh"
                showDownloadOption={false}
                documentName={"ADiary"}
              />
            </Modal>
          )}
          {stepper === 2 && !openUploadSignatureModal && !isSigned && (
            <Modal
              headerBarMain={<Heading label={t("ADD_SIGNATURE")} />}
              headerBarEnd={<CloseBtn onClick={onCancel} />}
              actionCancelLabel={t("CS_COMMON_BACK")}
              actionCancelOnSubmit={onCancel}
              actionSaveLabel={t("submit")}
              isDisabled={!isSigned}
              actionSaveOnSubmit={uploadSignedPdf}
              className="add-signature-modal"
            >
              <div className="add-signature-main-div">
                <div className="not-signed">
                  <InfoCard
                    variant={"default"}
                    label={t("PLEASE_NOTE")}
                    additionalElements={[
                      <p key="note">
                        {t("YOU_ARE_ADDING_YOUR_SIGNATURE_TO_THE")}
                        <span style={{ fontWeight: "bold" }}>{`${t("ADIARY")} - ${formatDate(entryDate)}`}</span>
                      </p>,
                    ]}
                    inline
                    textStyle={{}}
                    className={`custom-info-card`}
                  />
                  <h1>{t("YOUR_SIGNATURE")}</h1>
                  <div className="sign-button-wrap">
                    <Button
                      label={t("CS_ESIGN")}
                      onButtonClick={() => handleEsign(name, pageModule, ADiarypdf, "Signature")} //as sending null throwing error in esign
                      className="aadhar-sign-in"
                      labelClassName="aadhar-sign-in"
                    />
                    <Button
                      icon={<FileUploadIcon />}
                      label={t("UPLOAD_DIGITAL_SIGN_CERTI")}
                      onButtonClick={() => {
                        setOpenUploadSignatureModal(true);
                      }}
                      className="upload-signature"
                      labelClassName="upload-signature-label"
                    />
                  </div>
                  <div className="donwload-submission">
                    <h2>{t("DOWNLOAD_ADIARY_TEXT")}</h2>
                    <AuthenticatedLink
                      uri={uri}
                      style={{ color: "#007E7E", cursor: "pointer", textDecoration: "underline" }}
                      displayFilename={"CLICK_HERE"}
                      t={t}
                      pdf={true}
                    />
                  </div>
                </div>
              </div>
            </Modal>
          )}

          {stepper === 2 && openUploadSignatureModal && (
            <UploadSignatureModal
              t={t}
              key={name}
              name={name}
              setOpenUploadSignatureModal={setOpenUploadSignatureModal}
              onSelect={onSelect}
              config={uploadModalConfig}
              formData={formData}
              onSubmit={onUploadSubmit}
              isDisabled={loader}
            />
          )}

          {stepper === 2 && !openUploadSignatureModal && isSigned && (
            <Modal
              headerBarMain={<Heading label={t("ADD_SIGNATURE")} />}
              headerBarEnd={<CloseBtn onClick={onCancel} />}
              actionCancelLabel={t("CS_COMMON_BACK")}
              actionCancelOnSubmit={onCancel}
              actionSaveLabel={t("SUBMIT_BUTTON")}
              actionSaveOnSubmit={uploadSignedPdf}
              className="add-signature-modal"
            >
              <div className="add-signature-main-div">
                <InfoCard
                  variant={"default"}
                  label={t("PLEASE_NOTE")}
                  additionalElements={[
                    <p key="note">
                      {t("YOU_ARE_ADDING_YOUR_SIGNATURE_TO_THE")}
                      <span style={{ fontWeight: "bold" }}>{`${t("ADIARY")} - ${formatDate(entryDate)}`}</span>
                    </p>,
                  ]}
                  inline
                  textStyle={{}}
                  className={`custom-info-card`}
                />
                <div style={{ display: "flex", flexDirection: "row", gap: "16px" }}>
                  <h1
                    style={{
                      margin: 0,
                      fontFamily: "Roboto",
                      fontSize: "24px",
                      fontWeight: 700,
                      lineHeight: "28.13px",
                      textAlign: "left",
                      color: "#3d3c3c",
                    }}
                  >
                    {t("YOUR_SIGNATURE")}
                  </h1>
                  <h2
                    style={{
                      margin: 0,
                      fontFamily: "Roboto",
                      fontSize: "14px",
                      fontWeight: 400,
                      lineHeight: "16.41px",
                      textAlign: "center",
                      color: "#00703c",
                      padding: "6px",
                      backgroundColor: "#e4f2e4",
                      borderRadius: "999px",
                    }}
                  >
                    {t("SIGNED")}
                  </h2>
                </div>
              </div>
            </Modal>
          )}

          {noAdiaryModal && (
            <Modal
              headerBarEnd={<CloseBtn onClick={() => setNoAdiaryModal(false)} />}
              popupStyles={{ width: "600px" }}
              actionSaveLabel={t("CS_COMMON_BACK")}
              actionSaveOnSubmit={() => setNoAdiaryModal(false)}
              formId="modal-action"
              headerBarMainStyle={{ height: "60px" }}
              headerBarMain={<Heading label={t("NO_ADIARY")} />}
            >
              <div style={{ padding: "20px" }}>
                <span>{t("NO_ADIARY_TEXT")}</span>
              </div>
            </Modal>
          )}
        </div>
      </div>
    </React.Fragment>
  );
};

export default ADiaryPage;
