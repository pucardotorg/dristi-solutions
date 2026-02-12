import { Header, Card, Loader, ActionBar, SubmitBar, Modal, CardText, Toast, TextArea, BackButton } from "@egovernments/digit-ui-react-components";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useHistory } from "react-router-dom";
import DocumentDetailCard from "../../components/DocumentDetailCard";
import DocViewerWrapper from "./docViewerWrapper";
import { ReactComponent as LocationOnMapIcon } from "../../images/location_onmap.svg";
import { userTypeOptions } from "../citizen/registration/config";
import Menu from "../../components/Menu";
import { useToast } from "../../components/Toast/useToast";
import { ErrorInfoIcon, SuccessIcon } from "../../icons/svgIndex";
import ImageModal from "../../components/ImageModal";

const Heading = (props) => {
  return <h1 className="heading-m">{props.label}</h1>;
};

const Close = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FFFFFF">
    <path d="M0 0h24v24H0V0z" fill="none" />
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
  </svg>
);

const CloseBtn = (props) => {
  return (
    <div className="icon-bg-secondary" onClick={props.onClick}>
      <Close />
    </div>
  );
};

const LocationContent = ({ t, latitude = 17.2, longitude = 17.2 }) => {
  return (
    <div style={{ fontSize: "16px", display: "flex", marginTop: "-2px" }}>
      <div>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`}
          target="_blank"
          rel="noreferrer"
          style={{ color: "#F47738" }}
        >
          {t("VIEW_ON_MAP")}
        </a>
      </div>
      <div style={{ marginLeft: "10px" }}>
        <LocationOnMapIcon></LocationOnMapIcon>
      </div>
    </div>
  );
};

const extractFormattedAddresses = (individualData, t) => {
  const addresses = individualData?.Individual?.[0]?.address || [];

  const formatAddress = (addr) => {
    if (!addr) return "";
    const { addressLine1 = "", addressLine2 = "", buildingName = "", street = "", city = "", pincode = "" } = addr;

    return `${addressLine1}, ${addressLine2}, ${buildingName}, ${street}, ${city}, ${pincode}`.trim();
  };

  const permanentAddress = addresses?.find((addr) => addr?.type === "PERMANENT");
  const correspondingAddress = addresses?.find((addr) => addr?.type === "CORRESPONDENCE");

  return [
    {
      title: t("LOCATION"),
      content: <LocationContent t={t} latitude={permanentAddress?.latitude || ""} longitude={permanentAddress?.longitude || ""} />,
    },
    {
      title: t("PRESENT_ADDRESS"),
      content: formatAddress(permanentAddress),
    },
    {
      title: t("CURRENT_ADDRESS"),
      content: correspondingAddress ? formatAddress(correspondingAddress) : t("SAME_AS_PERSENT"),
    },
  ];
};

const ApplicationDetails = ({ location, match }) => {
  const urlParams = new URLSearchParams(window.location.search);

  const toast = useToast();
  const userRoles = Digit.UserService.getUser()?.info?.roles.map((role) => role.code);
  const individualId = urlParams.get("individualId");
  const applicationNo = urlParams.get("applicationNo");
  const type = urlParams.get("type") || "advocate";
  const moduleCode = "DRISTI";
  const { t } = useTranslation();
  const history = useHistory();
  const [showModal, setShowModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState({ isOpen: false, status: "" });
  const [displayMenu, setDisplayMenu] = useState(false);
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const [message, setMessage] = useState(null);
  const [reasons, setReasons] = useState(null);
  const [isAction, setIsAction] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageInfo, setImageInfo] = useState(null);

  const { data: individualData, isLoading: isGetUserLoading } = window?.Digit.Hooks.dristi.useGetIndividualUser(
    {
      Individual: {
        individualId,
      },
    },
    { tenantId, limit: 1000, offset: 0 },
    moduleCode,
    individualId,
    Boolean(individualId)
  );

  const userType = useMemo(() => individualData?.Individual?.[0]?.additionalFields?.fields?.find((obj) => obj.key === "userType")?.value, [
    individualData?.Individual,
  ]);

  // if user is employee then ADVOCATE_APPROVER  role is needed and for citizrn ADVOCATE_APPLICATION_VIEWER role is needed.
  const hasAdvocateApplicationViewAccess = useMemo(
    () => userRoles?.some((role) => role === "ADVOCATE_APPLICATION_VIEWER" || role === "ADVOCATE_APPROVER"),
    [userRoles]
  );

  const isAdvocateViewer = useMemo(() => userRoles?.includes("ADVOCATE_VIEWER"), [userRoles]);

  const identifierIdDetails = useMemo(
    () => JSON.parse(individualData?.Individual?.[0]?.additionalFields?.fields?.find((obj) => obj.key === "identifierIdDetails")?.value || "{}"),
    [individualData?.Individual]
  );

  const { data: searchData, isLoading: isSearchLoading } = window?.Digit.Hooks.dristi.useGetAdvocateClerk(
    {
      criteria: [{ applicationNumber: applicationNo }],
      tenantId: tenantId,
    },
    { tenantId: tenantId },
    applicationNo + individualId,
    userType,
    userType === "ADVOCATE" ? `/advocate/v1/_search` : `/advocate/clerk/v1/_search`
  );

  const userTypeDetail = useMemo(() => {
    return userTypeOptions.find((item) => item.code === userType) || {};
  }, [userType]);

  const { isLoading: isWorkFlowLoading, data: workFlowDetails } = window?.Digit.Hooks.useWorkflowDetails({
    tenantId,
    id: applicationNo,
    moduleCode,
    config: {
      enabled: true,
      cacheTime: 0,
    },
  });
  const actions = useMemo(
    () =>
      workFlowDetails?.processInstances?.[0]?.state?.actions
        ?.filter((action) => action.roles.every((role) => userRoles.includes(role)))
        .map((action) => action.action) || [],
    [workFlowDetails?.processInstances, userRoles]
  );

  const searchResult = useMemo(() => {
    const requestKey = userTypeDetail?.apiDetails?.requestKey;
    const resultKey = requestKey ? `${requestKey}s` : null;
    let result = resultKey ? searchData?.[resultKey] : null;

    // Handle nested responseList structure for clerk search results
    // The API returns { clerks: [{ responseList: [...actualData...] }] }
    if (result && result[0]?.responseList) {
      result = result[0].responseList;
    }

    return result;
  }, [searchData, userTypeDetail?.apiDetails?.requestKey]);
  const fileStoreId = useMemo(() => {
    return searchResult?.[0]?.documents?.[0]?.fileStore;
  }, [searchResult]);
  const fileName = useMemo(() => {
    return searchResult?.[0]?.documents?.[0]?.additionalDetails?.fileName;
  }, [searchResult]);
  useEffect(() => {
    setIsAction(searchResult?.[0]?.status === "INWORKFLOW");
  }, [searchResult]);

  const applicationNumber = useMemo(() => {
    return searchResult?.[0]?.applicationNumber;
  }, [searchResult]);

  // let isMobile = window.Digit.Utils.browser.isMobile();

  function takeAction(action) {
    const applications = searchResult;

    // Defensive checks - ensure data exists
    if (!applications || !applications[0]) {
      setShowModal(false);
      setShowApproveModal(false);
      setShowInfoModal({ isOpen: true, status: "ES_API_ERROR" });
      return;
    }

    // Ensure workflow object exists - create it if it doesn't
    if (!applications[0].workflow) {
      applications[0].workflow = {};
    }

    applications[0].workflow.action = action;

    const requestKey = userTypeDetail?.apiDetails?.requestKey;
    if (!requestKey) {
      setShowModal(false);
      setShowApproveModal(false);
      setShowInfoModal({ isOpen: true, status: "ES_API_ERROR" });
      return;
    }

    const data = { [requestKey]: applications[0] };
    const url = userType === "ADVOCATE_CLERK" ? "/advocate/clerk/v1/_update" : "/advocate/v1/_update";

    if (showModal) {
      applications[0].workflow.comments = reasons;
    }

    setIsSubmittingAction(true);
    window?.Digit.DRISTIService.advocateClerkService(url, data, tenantId, true, {})
      .then(() => {
        setShowModal(false);
        setShowApproveModal(false);
        setIsSubmittingAction(false);
        if (action === "APPROVE") {
          setShowInfoModal({ isOpen: true, status: "ES_USER_APPROVED" });
        } else if (action === "REJECT") {
          setShowInfoModal({ isOpen: true, status: "ES_USER_REJECTED" });
        }
      })
      .catch(() => {
        setShowModal(false);
        setShowApproveModal(false);
        setIsSubmittingAction(false);
        setShowInfoModal({ isOpen: true, status: "ES_API_ERROR" });
      });
  }

  function onActionSelect(action) {
    if (action === "APPROVE") {
      setShowApproveModal(true);
    }
    if (action === "REJECT") {
      setShowModal(true);
    }
    setDisplayMenu(false);
  }

  const handleDelete = (action) => {
    takeAction(action);
  };

  const givenName = individualData?.Individual?.[0]?.name?.givenName || "";
  const otherNames = individualData?.Individual?.[0]?.name?.otherNames || "";
  const familyName = individualData?.Individual?.[0]?.name?.familyName || "";

  const fullName = `${givenName} ${otherNames} ${familyName}`.trim();

  const personalData = useMemo(() => {
    const addressDetails = extractFormattedAddresses(individualData, t);
    return [{ title: t("CS_NAME"), content: fullName }, ...addressDetails];
  }, [individualData, fullName, t]);

  const barDetails = useMemo(() => {
    return [
      { title: t("CS_BAR_REGISTRATION_NUMBER"), content: searchResult?.[0]?.[userTypeDetail?.apiDetails?.AdditionalFields?.[0]] || "N/A" },
      {
        title: t("CS_BAR_COUNCIL_ID"),
        image: true,
        content: fileName,
      },
      {
        doc: (
          <DocViewerWrapper
            fileStoreId={fileStoreId}
            tenantId={tenantId}
            docViewerCardClassName={"doc-card"}
            errorStyleSmallType={true}
          ></DocViewerWrapper>
        ),
        image: true,
      },
    ];
  }, [fileStoreId, searchResult, tenantId, userTypeDetail?.apiDetails?.AdditionalFields]);

  const aadharData = useMemo(() => {
    return [
      { title: t("PHONE_NUMBER"), content: individualData?.Individual?.[0]?.mobileNumber },
      { title: t("ID_TYPE"), content: t(individualData?.Individual?.[0]?.identifiers[0]?.identifierType) },
      {
        title: identifierIdDetails?.fileStoreId ? t("CS_ID_PROOF") : t("AADHAR_NUMBER"),
        doc: identifierIdDetails?.fileStoreId ? (
          <DocViewerWrapper
            fileStoreId={identifierIdDetails?.fileStoreId}
            tenantId={tenantId}
            displayFilename={identifierIdDetails?.filename}
            docViewerCardClassName={"doc-card"}
            errorStyleSmallType={true}
          />
        ) : (
          individualData?.Individual?.[0]?.identifiers[0]?.identifierId
        ),
      },
    ];
  }, [identifierIdDetails?.fileStoreId, identifierIdDetails?.filename, individualData?.Individual, tenantId]);

  const header = useMemo(() => {
    return applicationNo || applicationNumber ? ` ${t("APPLICATION_NUMBER")} ${applicationNo || applicationNumber}` : "My Application";
  }, [applicationNo, applicationNumber, t]);

  if (!hasAdvocateApplicationViewAccess) {
    history.push(`/${window?.contextPath}/citizen/dristi/home`);
  }

  const handleImageModalOpen = (fileStoreId, fileName) => {
    setIsImageModalOpen(true);
    setImageInfo({ data: { fileStore: fileStoreId, fileName: fileName } });
  };

  const handleImageModalClose = () => {
    setIsImageModalOpen(false);
  };

  if (isSearchLoading || isGetUserLoading || isWorkFlowLoading) {
    return <Loader />;
  }
  return (
    <React.Fragment>
      <div className="view-application">
        <div className="application-main">
          <Header className="application-header">{header}</Header>
          <div className="application-card">
            <DocumentDetailCard
              onClick={() => handleImageModalOpen(identifierIdDetails?.fileStoreId, identifierIdDetails?.filename)}
              cardData={aadharData}
            />

            <DocumentDetailCard cardData={personalData} />
            {type === "advocate" && userType !== "ADVOCATE_CLERK" && (
              <DocumentDetailCard onClick={() => handleImageModalOpen(fileStoreId, fileName)} cardData={barDetails} />
            )}
          </div>
          {isImageModalOpen && <ImageModal t={t} imageInfo={imageInfo} handleCloseModal={handleImageModalClose} />}
          {isAdvocateViewer && (
            <div className="action-button-application">
              <SubmitBar
                label={t("Go_Back_Home")}
                onSubmit={() => {
                  history.push(`/${window?.contextPath}/citizen/dristi/home`);
                }}
                className="action-button-width"
              />
            </div>
          )}
          {applicationNo && (
            <div className="action-button-application">
              {actions?.map((option, index) => (
                <SubmitBar
                  key={index}
                  label={option === "REJECT" ? t("REJECT_REQUEST") : t("ACCEPT_REQUEST")}
                  style={{ margin: "20px", backgroundColor: option === "REJECT" ? "#BB2C2F" : "#007E7E" }}
                  onSubmit={(data) => {
                    onActionSelect(option);
                  }}
                  className="action-button-width"
                />
              ))}
            </div>
          )}
          {showModal && (
            <Modal
              headerBarMain={<Heading label={t("Confirm Reject Application")} />}
              headerBarEnd={<CloseBtn onClick={() => !isSubmittingAction && setShowModal(false)} />}
              actionSaveLabel={t("Reject")}
              actionSaveOnSubmit={() => {
                handleDelete("REJECT");
              }}
              isDisabled={!reasons || !reasons.trim() || isSubmittingAction}
              isBackButtonDisabled={isSubmittingAction}
              style={{ backgroundColor: "#BB2C2F" }}
            >
              {isSubmittingAction ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
                  <Loader />
                </div>
              ) : (
                <Card style={{ boxShadow: "none", padding: "2px 16px 2px 16px", marginBottom: "2px" }}>
                  <CardText style={{ margin: "2px 0px" }}>{t(`REASON_FOR_REJECTION`)}</CardText>
                  <TextArea rows={"3"} onChange={(e) => setReasons(e.target.value)} style={{ maxWidth: "100%", height: "auto" }}></TextArea>
                </Card>
              )}
            </Modal>
          )}
          {showApproveModal && (
            <Modal
              headerBarMain={
                <Heading
                  label={
                    userType === "ADVOCATE_CLERK"
                      ? t("CONFIRM_APPROVE_ADVOCATE_CLERK_APPLICATION_HEADER")
                      : t("CONFIRM_APPROVE_ADVOCATE_APPLICATION_HEADER")
                  }
                />
              }
              headerBarEnd={<CloseBtn onClick={() => !isSubmittingAction && setShowApproveModal(false)} />}
              actionCancelLabel={t("CS_BACK")}
              actionCancelOnSubmit={() => {
                setShowApproveModal(false);
              }}
              actionSaveLabel={t("CS_COMMON_CONFIRM")}
              actionSaveOnSubmit={() => {
                takeAction("APPROVE");
              }}
              isDisabled={isSubmittingAction}
              isBackButtonDisabled={isSubmittingAction}
            >
              {isSubmittingAction ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
                  <Loader />
                </div>
              ) : (
                <div style={{ padding: "20px 0px" }}>
                  {userType === "ADVOCATE_CLERK"
                    ? t("CONFIRM_APPROVE_ADVOCATE_CLERK_APPLICATION_TEXT")
                    : t("CONFIRM_APPROVE_ADVOCATE_APPLICATION_TEXT")}
                </div>
              )}
            </Modal>
          )}
          {showInfoModal?.isOpen && (
            <Modal
              headerBarEnd={
                <CloseBtn
                  onClick={() => {
                    setShowInfoModal({ isOpen: false, status: "" });
                    history.push(
                      `/${window?.contextPath}/employee/home/home-screen`,
                      { state: { registerUsersTab: true } } // Open the 'Register Users' tab when returning to the home screen.
                    );
                  }}
                />
              }
              actionSaveLabel={t("GO TO HOME")}
              actionSaveOnSubmit={() => {
                setShowInfoModal({ isOpen: false, status: "" });
                history.push(
                  `/${window?.contextPath}/employee/home/home-screen`,
                  { state: { registerUsersTab: true } } // Open the 'Register Users' tab when returning to the home screen.
                );
              }}
              style={{ backgroundColor: "#BB2C2F" }}
              popmoduleClassName="request-processing-info-modal"
            >
              <div className="main-div">
                <div className="icon-div">{showInfoModal?.status === "ES_API_ERROR" ? <ErrorInfoIcon /> : <SuccessIcon />}</div>
                <div className="info-div">
                  <h1>{t(showInfoModal?.status)}</h1>
                </div>
              </div>
            </Modal>
          )}
        </div>
      </div>
    </React.Fragment>
  );
};

export default ApplicationDetails;
