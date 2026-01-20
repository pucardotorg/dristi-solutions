//new comp
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory, useLocation } from "react-router-dom";
import { FormComposerV2, Loader, Toast } from "@egovernments/digit-ui-react-components";
import useSearchCaseService from "../../../hooks/dristi/useSearchCaseService";
import { useToast } from "../../../components/Toast/useToast";
import { reviewCaseFileFormConfig } from "../../citizen/FileCase/Config/reviewcasefileconfig";
import { DRISTIService } from "../../../services";
import DocViewerWrapper from "../docViewerWrapper";
import { Urls } from "../../../hooks";
import { OrderWorkflowAction } from "@egovernments/digit-ui-module-orders/src/utils/orderWorkflow";
import { HomeService } from "../../../../../home/src/hooks/services";
import { getAdvocates } from "../../citizen/FileCase/EfilingValidationUtils";
import ImageModal from "../../../components/ImageModal";

const noteConfig = [
  {
    body: [
      {
        type: "component",
        component: "SelectCustomNote",
        key: "profileRequestInfo",
        withoutLabel: true,
        populators: {
          inputs: [
            {
              infoHeader: "CS_PLEASE_NOTE",
              infoText: "REQUESTOR_DOES_NOT_REPRESENT_LITIGANT_WHOSE_INFO_BEING_EDITED",
              infoTooltipMessage: "CS_NOTETOOLTIP_RESPONDENT_PERSONAL_DETAILS",
              type: "InfoComponent",
            },
          ],
        },
      },
    ],
  },
];

const ReviewLitigantDetails = ({ path }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation();
  const toast = useToast();
  const urlParams = new URLSearchParams(window.location.search);
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const caseId = urlParams.get("caseId");
  const referenceId = urlParams.get("referenceId");
  const refApplicationNUmber = urlParams.get("refApplicationId");
  const [showDocModal, setShowDocModal] = useState(false);
  const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo]);
  const courtId = localStorage.getItem("courtId");
  const [showErrorToast, setShowErrorToast] = useState(null);

  const closeToast = () => {
    setShowErrorToast(null);
  };

  useEffect(() => {
    if (showErrorToast) {
      const timer = setTimeout(() => {
        setShowErrorToast(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showErrorToast]);

  const { data: caseData, refetch: refetchCaseData, isLoading } = useSearchCaseService(
    {
      criteria: [
        {
          caseId: caseId,
          defaultFields: false,
          ...(courtId && userType === "employee" && { courtId }),
        },
      ],
      tenantId,
    },
    {},
    `dristi-${caseId}`,
    caseId,
    Boolean(caseId)
  );

  const caseDetails = useMemo(
    () => ({
      ...caseData?.criteria?.[0]?.responseList?.[0],
    }),
    [caseData]
  );

  const { data: applicationData, isloading: isApplicationLoading } = Digit.Hooks.submissions.useSearchSubmissionService(
    {
      criteria: {
        applicationNumber: refApplicationNUmber,
        tenantId,
        courtId,
      },
      tenantId,
    },
    {},
    refApplicationNUmber,
    Boolean(refApplicationNUmber)
  );

  const applicationDetails = useMemo(() => {
    return applicationData?.applicationList?.[0];
  }, [applicationData?.applicationList]);

  const profileRequest = useMemo(() => {
    return caseDetails?.additionalDetails?.profileRequests?.find((req) => req?.pendingTaskRefId === referenceId);
  }, [caseDetails?.additionalDetails?.profileRequests, referenceId]);

  const partyType = useMemo(() => {
    return profileRequest?.litigantDetails?.partyType;
  }, [profileRequest]);

  const uniqueId = useMemo(() => {
    return profileRequest?.litigantDetails?.uniqueId;
  }, [profileRequest]);

  const newData = useMemo(() => {
    return profileRequest?.newData;
  }, [profileRequest]);

  const oldData = useMemo(() => {
    if (partyType === "complainant") {
      return caseDetails?.additionalDetails?.complainantDetails?.formdata?.find(
        (item) => item?.data?.complainantVerification?.individualDetails?.individualId === uniqueId
      );
    } else if (partyType === "respondent") {
      return caseDetails?.additionalDetails?.respondentDetails?.formdata?.find(
        (item) => item?.data?.respondentVerification?.individualDetails?.individualId === uniqueId || item?.uniqueId === uniqueId
      );
    }
  }, [caseDetails, partyType, uniqueId]);

  const getFormConfig = (formConfigData, userType) => {
    if (!caseDetails) return null;
    const typeConfig = structuredClone([reviewCaseFileFormConfig?.[0]?.body?.[0]]);
    let updatedInputs = [];
    if (userType === "complainant") {
      updatedInputs = reviewCaseFileFormConfig?.[0]?.body?.[0]?.populators?.inputs?.filter((input) => input?.key === "complainantDetails");
    }
    if (userType === "respondent") {
      updatedInputs = reviewCaseFileFormConfig?.[0]?.body?.[0]?.populators?.inputs?.filter((input) => input?.key === "respondentDetails");
    }
    typeConfig[0].populators.inputs = updatedInputs;
    const updatedReviewConfig = [{ body: typeConfig }];

    return [
      ...updatedReviewConfig.map((form) => {
        return {
          ...form,
          body: form.body
            ?.filter((section) => !(section?.key === "submissionFromAccused"))
            .map((section) => {
              return {
                ...section,
                populators: {
                  ...section.populators,
                  inputs: section.populators.inputs?.map((input) => {
                    delete input.data;

                    if (["complainantDetails", "respondentDetails"].includes(input?.key)) {
                      const isPartyInPerson = (individualId) => {
                        const representative = caseDetails?.representatives?.find((data) =>
                          data?.representing?.find((rep) => rep?.individualId === individualId && rep?.isActive === true)
                        );
                        return representative ? false : true;
                      };
                      const returnData = {
                        ...input,
                        data: formConfigData?.map((fData) => ({
                          ...fData,
                          data: {
                            ...fData?.data,
                            ...(fData?.data?.[input?.key === "complainantDetails" ? "complainantVerification" : "respondentVerification"] &&
                              isPartyInPerson(
                                fData?.data?.[input?.key === "complainantDetails" ? "complainantVerification" : "respondentVerification"]
                                  ?.individualDetails?.individualId
                              ) && { partyInPerson: true }),
                          },
                        })),
                      };
                      return returnData;
                    }
                  }),
                },
              };
            }),
        };
      }),
    ];
  };

  const oldDataFormConfig = useMemo(() => {
    return getFormConfig([oldData], partyType);
  }, [oldData, partyType]);

  const newDataFormConfig = useMemo(() => {
    let updatedNewData = [];
    if (partyType === "complainant") {
      updatedNewData = [{ data: structuredClone(newData?.complainantDetails) }];
    } else {
      updatedNewData = [{ data: structuredClone(newData?.respondentDetails) }];
    }
    return getFormConfig(updatedNewData, partyType);
  }, [newData, partyType]);

  const showInfoNote = useMemo(() => {
    const litigantUuid = caseDetails?.litigants?.find((item) => item?.individualId === profileRequest?.litigantDetails?.uniqueId)?.additionalDetails
      ?.uuid;
    if (!litigantUuid) {
      return true;
    } else if (litigantUuid) {
      const allLitigantAdvocatesMapping = getAdvocates(caseDetails);
      for (let key in allLitigantAdvocatesMapping) {
        if (key === litigantUuid) {
          if (!allLitigantAdvocatesMapping?.[key]?.includes(profileRequest?.editorDetails?.uuid)) {
            return true;
          }
        }
      }
      return false;
    }
    return false;
  }, [profileRequest, caseDetails]);

  const getPersonNameByUUID = (litigantDetails, representative, uuid) => {
    const combined = [...(litigantDetails || []), ...(representative || [])];

    const person = combined?.find((item) => item?.additionalDetails?.uuid === uuid);

    return person?.additionalDetails?.fullName || person?.additionalDetails?.advocateName || "";
  };

  const handleApproveReject = async (action) => {
    try {
      const reqBody = {
        order: {
          createdDate: null,
          tenantId,
          cnrNumber: caseDetails?.cnrNumber,
          filingNumber: caseDetails?.filingNumber,
          statuteSection: {
            tenantId,
          },
          orderTitle: t("APPROVAL_REJECTION_LITIGANT_DETAILS_CHANGE"),
          orderCategory: "INTERMEDIATE",
          orderType: "APPROVAL_REJECTION_LITIGANT_DETAILS_CHANGE",
          status: "",
          isActive: true,
          workflow: {
            action: OrderWorkflowAction.SAVE_DRAFT,
            comments: "Creating order",
            assignes: null,
            rating: null,
            documents: [{}],
          },
          documents: [],
          orderDetails: {
            applicantName: getPersonNameByUUID(caseDetails?.litigants, caseDetails?.representatives, profileRequest?.editorDetails?.uuid),
            applicationStatus: action === "ACCEPT" ? "APPROVED" : "REJECTED",
            applicationCMPNumber: applicationDetails?.applicationCMPNumber,
          },
          applicationNumber: [refApplicationNUmber],
          additionalDetails: {
            formdata: {
              orderType: {
                code: "APPROVAL_REJECTION_LITIGANT_DETAILS_CHANGE",
                type: "APPROVAL_REJECTION_LITIGANT_DETAILS_CHANGE",
                name: "ORDER_TYPE_APPROVAL_REJECTION_LITIGANT_DETAILS_CHANGE",
              },
              applicationGrantedRejected: {
                code: action === "ACCEPT" ? "GRANTED" : "REJECTED",
                name: action === "ACCEPT" ? "GRANTED" : "REJECTED",
              },
              refApplicationId: refApplicationNUmber,
              reasonForLitigantDetailsChange: { text: profileRequest?.reason || "" },
            },
            dateOfApplication: location?.state?.dateOfApplication,
            uniqueId: location?.state?.uniqueId,
            applicantPartyUuid: profileRequest?.editorDetails?.uuid,
            applicantType: profileRequest?.editorDetails?.isAdvocate ? "ADVOCATE" : "COMPLAINANT",
            pendingTaskRefId: referenceId,
            applicationStatus: action === "ACCEPT" ? "APPROVED" : "REJECTED",
          },
        },
      };

      const res = await HomeService.customApiService(Urls.dristi.ordersCreate, reqBody, { tenantId });
      if (res.order.orderNumber) {
        history.push(
          `/${window.contextPath}/employee/orders/generate-order?filingNumber=${caseDetails?.filingNumber}&orderNumber=${res.order.orderNumber}`
        );
      }
    } catch (error) {
      toast.error(t("SOMETHING_WENT_WRONG"));
      console.error(error);
    }
  };

  const requestorName = useMemo(() => {
    if (profileRequest?.editorDetails?.isAdvocate) {
      return caseDetails?.representatives?.find((rep) => rep?.additionalDetails?.uuid === profileRequest?.editorDetails?.uuid)?.additionalDetails
        ?.advocateName;
    } else {
      return caseDetails?.litigants?.find((lit) => lit?.additionalDetails?.uuid === profileRequest?.editorDetails?.uuid)?.additionalDetails?.fullName;
    }
  }, [profileRequest, caseDetails]);

  const profileRequestDetails = useMemo(() => {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "85%",
          gap: "10px",
          marginTop: "10px",
          border: "solid 1px #e6e6e6",
          padding: "15px 5px 5px 5px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", margin: "0 8px" }}>
          <span style={{ fontWeight: "700" }}>{t("REQUEST_RAISED_BY")}</span>
          <span>{requestorName || ""}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", margin: "0 8px" }}>
          <span style={{ fontWeight: "700" }}>{t("PARTY")}</span>
          <span>{profileRequest?.litigantDetails?.partyType || ""}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", margin: "0 8px" }}>
          <span style={{ fontWeight: "700" }}>{t("REASON_FOR_CHANGE")}</span>
          <span>{profileRequest?.reason || ""}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", margin: "0 8px" }}>
          <span style={{ fontWeight: "700" }}>{t("SUPPORTING_DOCUMENT")}</span>
          <span>{profileRequest?.document?.fileName || ""}</span>
        </div>
        <div
          className="supporting-document"
          style={{ marginTop: "-25px", marginLeft: "10px", cursor: "pointer" }}
          onClick={() => {
            if (profileRequest?.document?.fileStore) {
              setShowDocModal(true);
            } else {
              setShowErrorToast({
                label: t("NO_SUPPORTING_DOCUMENTS_UPLOADED"),
                error: true,
              });
            }
          }}
        >
          <DocViewerWrapper
            fileStoreId={profileRequest?.document?.fileStore}
            tenantId={tenantId}
            docWidth={"100px"}
            docHeight={"150px"}
            showDownloadOption={false}
          />
        </div>
      </div>
    );
  }, [profileRequest, requestorName]);

  const imageInfo = useMemo(() => {
    const imageInfo = {
      data: {
        filerName: t(profileRequest?.document?.documentType),
        documentName: t(profileRequest?.document?.documentType),
        fileStore: profileRequest?.document?.fileStore,
      },
    };
    return imageInfo;
  }, [profileRequest, t]);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div
      className="review-litigant-profile"
      style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", marginBottom: "100px" }}
    >
      <div style={{ display: "flex", flexDirection: "row", fontSize: "32px", fontWeight: "700", width: "85%" }}>
        <h1>{t("REVIEW_LITIGANT_DETAILS")}</h1>
      </div>
      {profileRequestDetails}
      {showInfoNote && (
        <div style={{ display: "flex", flexDirection: "row", width: "85%", marginTop: "20px" }}>
          <FormComposerV2
            label={""}
            config={noteConfig}
            onSubmit={() => {}}
            onSecondayActionClick={() => {}}
            fieldStyle={{ width: "100%" }}
            cardClassName={`e-filing-card-form-style review-case-file`}
            actionClassName="e-filing-action-bar"
            className="review-profile-editing"
          />
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "row", width: "85%", justifyContent: "space-between" }}>
        <div className="review-litigant-profile-old-data" key="old-data" style={{ width: "49%" }}>
          <div style={{ display: "flex", flexDirection: "row", fontSize: "24px", fontWeight: "700", width: "85%", height: "40px" }}>
            <h1>{t("CURRENT_DETAILS")}</h1>
          </div>
          <FormComposerV2
            label={"dfnjsk"}
            config={oldDataFormConfig}
            onSubmit={() => {}}
            onSecondayActionClick={() => {}}
            cardStyle={{ minWidth: "100%" }}
            cardClassName={`e-filing-card-form-style review-case-file`}
            secondaryLabel={"CS_BACK"}
            showSecondaryLabel={true}
            actionClassName="e-filing-action-bar"
          />
        </div>
        <div className="review-litigant-profile-new-data" key="new-data" style={{ width: "49%" }}>
          <div style={{ display: "flex", flexDirection: "row", fontSize: "24px", fontWeight: "700", width: "85%", height: "40px" }}>
            <h1>{t("NEW_DETAILS")}</h1>
          </div>
          <FormComposerV2
            label={t("CS_APPROVE")}
            config={newDataFormConfig}
            onSubmit={() => {
              handleApproveReject("ACCEPT");
            }}
            onSecondayActionClick={() => {
              handleApproveReject("REJECT");
            }}
            cardStyle={{ minWidth: "100%" }}
            cardClassName={`e-filing-card-form-style review-case-file`}
            secondaryLabel={t("CS_REJECT")}
            showSecondaryLabel={true}
            actionClassName="e-filing-action-bar"
          />
        </div>
      </div>
      {showDocModal && <ImageModal imageInfo={imageInfo} handleCloseModal={() => setShowDocModal(false)}></ImageModal>}
      {showErrorToast && <Toast error={showErrorToast?.error} label={showErrorToast?.label} isDleteBtn={true} onClose={closeToast} />}
    </div>
  );
};

export default ReviewLitigantDetails;
