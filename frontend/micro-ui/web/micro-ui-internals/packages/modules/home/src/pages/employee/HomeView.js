import { useTranslation } from "react-i18next";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useHistory } from "react-router-dom";
import { Button, InboxSearchComposer, CardLabel, CardLabelError, LabelFieldPair, TextInput } from "@egovernments/digit-ui-react-components";
import { InfoCard } from "@egovernments/digit-ui-components";

import { rolesToConfigMapping, userTypeOptions } from "../../configs/HomeConfig";
import UpcomingHearings from "../../components/UpComingHearing";
import { Loader } from "@egovernments/digit-ui-react-components";
import TasksComponent from "../../components/TaskComponent";
import { useLocation } from "react-router-dom/cjs/react-router-dom.min";
import { HomeService, Urls } from "../../hooks/services";
import LitigantHomePage from "./LitigantHomePage";
import { TabLitigantSearchConfig } from "../../configs/LitigantHomeConfig";
import ReviewCard from "../../components/ReviewCard";
import { InboxIcon, DocumentIcon } from "../../../homeIcon";
import { Link } from "react-router-dom";
import isEqual from "lodash/isEqual";
import CustomStepperSuccess from "@egovernments/digit-ui-module-orders/src/components/CustomStepperSuccess";
import { uploadResponseDocumentConfig } from "@egovernments/digit-ui-module-dristi/src/pages/citizen/FileCase/Config/resgisterRespondentConfig";
import UploadIdType from "@egovernments/digit-ui-module-dristi/src/pages/citizen/registration/UploadIdType";
import DocumentModal from "@egovernments/digit-ui-module-orders/src/components/DocumentModal";
import { submitJoinCase, updateCaseDetails } from "../../../../cases/src/utils/joinCaseUtils";
import CustomErrorTooltip from "@egovernments/digit-ui-module-dristi/src/components/CustomErrorTooltip";
import { DRISTIService } from "@egovernments/digit-ui-module-dristi/src/services";
import { Urls as PendingsUrls } from "@egovernments/digit-ui-module-dristi/src/hooks";

const defaultSearchValues = {
  filingNumber: "",
  caseType: "NIA S138",
};

const HomeView = () => {
  const history = useHistory();
  const location = useLocation();
  const { state } = location;
  const { t } = useTranslation();
  const Digit = window.Digit || {};
  const token = window.localStorage.getItem("token");
  const isUserLoggedIn = Boolean(token);
  const [defaultValues, setDefaultValues] = useState(defaultSearchValues);
  const [config, setConfig] = useState(TabLitigantSearchConfig?.TabSearchConfig?.[0]);
  const [caseDetails, setCaseDetails] = useState(null);
  const [isFetchCaseLoading, setIsFetchCaseLoading] = useState(false);
  const [tabData, setTabData] = useState(
    TabLitigantSearchConfig?.TabSearchConfig?.map((configItem, index) => ({
      key: index,
      label: configItem.label,
      active: index === 0 ? true : false,
    }))
  );
  const [callRefetch, SetCallRefetch] = useState(false);
  const [tabConfig, setTabConfig] = useState(TabLitigantSearchConfig);
  const [onRowClickData, setOnRowClickData] = useState({ url: "", params: [] });
  const [taskType, setTaskType] = useState(state?.taskType || {});
  const [caseType, setCaseType] = useState(state?.caseType || {});

  const [askOtp, setAskOtp] = useState(true);
  const [showSubmitResponseModal, setShowSubmitResponseModal] = useState(false);
  const [selectedParty, setSelectedParty] = useState({});
  const [validationCode, setValidationCode] = useState("");
  const [errors, setErrors] = useState({});
  const [responsePendingTask, setResponsePendingTask] = useState({});
  const [responseDoc, setResponseDoc] = useState({});

  const roles = useMemo(() => Digit.UserService.getUser()?.info?.roles, [Digit.UserService]);
  const isJudge = useMemo(() => roles?.some((role) => role?.code === "JUDGE_ROLE"), [roles]);
  const isCourtRoomRole = useMemo(() => roles?.some((role) => role?.code === "COURT_ADMIN"), [roles]);
  const isNyayMitra = roles.some((role) => role.code === "NYAY_MITRA_ROLE");
  const tenantId = useMemo(() => window?.Digit.ULBService.getCurrentTenantId(), []);
  const userInfo = Digit?.UserService?.getUser()?.info;
  const userInfoType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo]);
  const { data: individualData, isLoading, isFetching } = window?.Digit.Hooks.dristi.useGetIndividualUser(
    {
      Individual: {
        userUuid: [userInfo?.uuid],
      },
    },
    { tenantId, limit: 1000, offset: 0 },
    "Home",
    "",
    userInfo?.uuid && isUserLoggedIn
  );
  const individualId = useMemo(() => individualData?.Individual?.[0]?.individualId, [individualData]);

  const userType = useMemo(() => individualData?.Individual?.[0]?.additionalFields?.fields?.find((obj) => obj.key === "userType")?.value, [
    individualData?.Individual,
  ]);
  const { data: searchData, isLoading: isSearchLoading } = Digit?.Hooks?.dristi?.useGetAdvocateClerk(
    {
      criteria: [{ individualId }],
      tenantId,
    },
    {},
    individualId,
    Boolean(userType !== "LITIGANT"),
    userType === "ADVOCATE" ? "/advocate/advocate/v1/_search" : "/advocate/clerk/v1/_search"
  );

  const userTypeDetail = useMemo(() => {
    return userTypeOptions.find((item) => item.code === userType) || {};
  }, [userType]);

  const searchResult = useMemo(() => {
    return searchData?.[`${userTypeDetail?.apiDetails?.requestKey}s`]?.[0]?.responseList;
  }, [searchData, userTypeDetail?.apiDetails?.requestKey]);

  const isApprovalPending = useMemo(() => {
    return (
      userType !== "LITIGANT" &&
      Array.isArray(searchResult) &&
      searchResult?.length > 0 &&
      searchResult?.[0]?.isActive === false &&
      searchResult?.[0]?.status !== "INACTIVE"
    );
  }, [searchResult, userType]);

  const advocateId = useMemo(() => {
    return searchResult?.[0]?.id;
  }, [searchResult]);

  const additionalDetails = useMemo(() => {
    return {
      ...(advocateId
        ? {
            searchKey: "filingNumber",
            defaultFields: true,
            advocateId: advocateId,
          }
        : individualId
        ? {
            searchKey: "filingNumber",
            defaultFields: true,
            litigantId: individualId,
          }
        : {}),
    };
  }, [advocateId, individualId]);

  const verifyAccessCode = async (responsePendingTask, validationCode) => {
    const [res, err] = await submitJoinCase({
      caseFilingNumber: responsePendingTask?.filingNumber,
      tenantId: tenantId,
      accessCode: validationCode,
    });

    if (res) {
      setValidationCode("");
      return { continue: true };
    } else {
      setErrors({
        ...errors,
        validationCode: {
          message: "INVALID_ACCESS_CODE_MESSAGE",
        },
      });
      return { continue: false };
    }
  };

  const submitResponse = async (responseDoc) => {
    let newCase;

    const caseResponse = await DRISTIService.searchCaseService(
      {
        criteria: [
          {
            filingNumber: responsePendingTask?.filingNumber,
          },
        ],
        tenantId,
      },
      {}
    );

    if (caseResponse?.criteria[0]?.responseList?.length === 1) {
      newCase = caseResponse?.criteria[0]?.responseList[0];
    }

    if (newCase && responsePendingTask?.individualId && responseDoc.fileStore) {
      newCase = {
        ...newCase,
        litigants: newCase?.litigants?.map((data) => {
          if (data?.individualId === responsePendingTask?.individualId) {
            return {
              ...data,
              documents: [responseDoc],
            };
          } else return data;
        }),
      };
    }
    const response = await updateCaseDetails(newCase, tenantId, "RESPOND");
    if (response) {
      try {
        await DRISTIService.customApiService(PendingsUrls.dristi.pendingTask, {
          pendingTask: {
            name: "Pending Response",
            entityType: "case-default",
            referenceId: `MANUAL_${responsePendingTask?.filingNumber}`,
            status: "PENDING_RESPONSE",
            assignedTo: [{ uuid: userInfo?.uuid }],
            assignedRole: ["CASE_RESPONDER"],
            cnrNumber: responsePendingTask?.cnrNumber,
            filingNumber: responsePendingTask?.filingNumber,
            isCompleted: true,
            stateSla: null,
            additionalDetails: {},
            tenantId,
          },
        });
      } catch (err) {
        console.log("err :>> ", err);
      }
      return { continue: true };
    } else return { continue: false };
  };

  const sumbitResponseConfig = useMemo(() => {
    return {
      handleClose: () => {
        setShowSubmitResponseModal(false);
      },
      heading: { label: "" },
      actionSaveLabel: "",
      isStepperModal: true,
      actionSaveOnSubmit: () => {},
      steps: [
        askOtp && {
          heading: { label: "Verify with access code" },
          actionSaveLabel: "Verify",
          modalBody: (
            <div className="enter-validation-code">
              <InfoCard
                variant={"default"}
                label={t("PLEASE_NOTE")}
                additionalElements={{}}
                inline
                text={t("SIX_DIGIT_CODE_INFO")}
                textStyle={{}}
                className={`custom-info-card`}
              />
              <LabelFieldPair className="case-label-field-pair">
                <div className="join-case-tooltip-wrapper">
                  <CardLabel className="case-input-label">{`${t("ENTER_CODE_JOIN_CASE")}`}</CardLabel>
                  <CustomErrorTooltip message={`${t("ENTER_CODE_JOIN_CASE")}`} showTooltip={true} icon />
                </div>
                <div style={{ width: "100%", maxWidth: "960px" }}>
                  <TextInput
                    style={{ width: "100%" }}
                    type={"text"}
                    name="validationCode"
                    value={validationCode}
                    onChange={(e) => {
                      let val = e.target.value;
                      val = val.substring(0, 6);
                      val = val.replace(/\D/g, "");
                      setValidationCode(val);

                      setErrors({
                        ...errors,
                        validationCode: undefined,
                      });
                    }}
                  />
                  {errors?.validationCode && <CardLabelError> {t(errors?.validationCode?.message)} </CardLabelError>}
                  {}
                </div>
              </LabelFieldPair>
            </div>
          ),
          actionSaveOnSubmit: async () => {
            return await verifyAccessCode(responsePendingTask, validationCode);
          },
          async: true,
          isDisabled: validationCode?.length === 6 ? false : true,
        },
        {
          heading: { label: "Submit Response" },
          actionSaveLabel: "Submit",
          ...(askOtp && {
            actionCancelLabel: "Back",
          }),
          modalBody: (
            <UploadIdType
              config={uploadResponseDocumentConfig}
              isAdvocateUploading={true}
              onFormValueChange={(setValue, formData) => {
                const documentData = {
                  fileStore: formData?.SelectUserTypeComponent?.ID_Proof?.[0]?.[1]?.fileStoreId?.fileStoreId,
                  documentType: formData?.SelectUserTypeComponent?.ID_Proof?.[0]?.[1]?.file?.type,
                  identifierType: formData?.SelectUserTypeComponent?.selectIdType?.type,
                  additionalDetails: {
                    fileName: formData?.SelectUserTypeComponent?.ID_Proof?.[0]?.[1]?.file?.name,
                    fileType: "respondent-response",
                  },
                };
                if (!isEqual(documentData, responseDoc)) setResponseDoc(documentData);
              }}
            />
          ),
          actionSaveOnSubmit: async () => {
            await submitResponse(responseDoc);
          },
          isDisabled: responseDoc?.fileStore ? false : true,
        },
        {
          type: "success",
          hideSubmit: true,
          modalBody: (
            <CustomStepperSuccess
              successMessage={"You have added your response to the complaint successfully"}
              submitButtonAction={async () => {
                setShowSubmitResponseModal(false);
                history.push(`/${window?.contextPath}/${userInfoType}/dristi/home/view-case?caseId=${responsePendingTask?.caseId}`);
              }}
              submitButtonText={"View Case File"}
              closeButtonText={"Back to Home"}
              closeButtonAction={() => {
                setShowSubmitResponseModal(false);
              }}
              t={t}
            />
          ),
        },
      ].filter(Boolean),
    };
  }, [askOtp, errors, responseDoc, responsePendingTask, selectedParty?.individualId, t, tenantId, userInfoType, validationCode]);

  useEffect(() => {
    setDefaultValues(defaultSearchValues);
  }, []);

  useEffect(() => {
    state && state.taskType && setTaskType(state.taskType);
  }, [state]);

  const { isLoading: isOutcomeLoading, data: outcomeTypeData } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    "case",
    [{ name: "OutcomeType" }],
    {
      select: (data) => {
        return (data?.case?.OutcomeType || []).flatMap((item) => {
          return item?.judgementList?.length > 0 ? item.judgementList : [item?.outcome];
        });
      },
    }
  );

  const getTotalCountForTab = useCallback(
    async function (tabConfig) {
      const updatedTabData = await Promise.all(
        tabConfig?.TabSearchConfig?.map(async (configItem, index) => {
          const response = await HomeService.customApiService(configItem?.apiDetails?.serviceName, {
            tenantId,
            criteria: [
              {
                ...configItem?.apiDetails?.requestBody?.criteria?.[0],
                ...defaultSearchValues,
                ...additionalDetails,
                ...(configItem?.apiDetails?.requestBody?.criteria[0]["outcome"] && {
                  outcome: outcomeTypeData,
                }),
                pagination: { offSet: 0, limit: 1 },
              },
            ],
          });
          const totalCount = response?.criteria?.[0]?.pagination?.totalCount;
          return {
            key: index,
            label: totalCount ? `${configItem.label} (${totalCount})` : `${configItem.label} (0)`,
            active: index === 0 ? true : false,
          };
        }) || []
      );
      setTabData(updatedTabData);
    },
    [additionalDetails, outcomeTypeData, tenantId]
  );

  useEffect(() => {
    if (!(isLoading && isFetching && isSearchLoading && isFetchCaseLoading && isOutcomeLoading)) {
      if (state?.role && rolesToConfigMapping?.find((item) => item[state.role])[state.role]) {
        const rolesToConfigMappingData = rolesToConfigMapping?.find((item) => item[state.role]);
        const tabConfig = rolesToConfigMappingData.config;
        const rowClickData = rolesToConfigMappingData.onRowClickRoute;
        setOnRowClickData(rowClickData);
        setConfig(tabConfig?.TabSearchConfig?.[0]);
        setTabConfig(tabConfig);
        getTotalCountForTab(tabConfig);
      } else {
        const rolesToConfigMappingData =
          rolesToConfigMapping?.find((item) =>
            item.roles?.reduce((res, curr) => {
              if (!res) return res;
              res = roles.some((role) => role.code === curr);
              return res;
            }, true)
          ) || TabLitigantSearchConfig;
        const tabConfig = rolesToConfigMappingData?.config;
        const rowClickData = rolesToConfigMappingData?.onRowClickRoute;
        setOnRowClickData(rowClickData);
        setConfig(tabConfig?.TabSearchConfig?.[0]);
        setTabConfig(tabConfig);
        getTotalCountForTab(tabConfig);
      }
    }
  }, [additionalDetails, getTotalCountForTab, isOutcomeLoading, isFetchCaseLoading, isFetching, isLoading, isSearchLoading, roles, state, tenantId]);

  // calling case api for tab's count
  useEffect(() => {
    (async function () {
      if (userType) {
        setIsFetchCaseLoading(true);
        const caseData = await HomeService.customApiService(Urls.caseSearch, {
          tenantId,
          criteria: [
            {
              ...(advocateId ? { advocateId } : { litigantId: individualId }),

              pagination: { offSet: 0, limit: 1 },
            },
          ],
        });
        setCaseDetails(caseData?.criteria?.[0]?.responseList?.[0]);
        setIsFetchCaseLoading(false);
      }
    })();
  }, [advocateId, individualId, tenantId, userType]);

  const onTabChange = (n) => {
    setTabData((prev) => prev.map((i, c) => ({ ...i, active: c === n ? true : false })));
    setConfig(tabConfig?.TabSearchConfig?.[n]);
  };

  const handleNavigate = () => {
    const contextPath = window?.contextPath || "";
    history.push(`/${contextPath}/${userInfoType}/hearings/`);
  };
  const JoinCaseHome = Digit?.ComponentRegistryService?.getComponent("JoinCaseHome");

  const refreshInbox = () => {
    SetCallRefetch(true);
  };

  const onRowClick = (row) => {
    const searchParams = new URLSearchParams();
    if (
      onRowClickData?.urlDependentOn && onRowClickData?.urlDependentValue && Array.isArray(onRowClickData?.urlDependentValue)
        ? onRowClickData?.urlDependentValue.includes(row.original[onRowClickData?.urlDependentOn])
        : row.original[onRowClickData?.urlDependentOn] === onRowClickData?.urlDependentValue
    ) {
      onRowClickData.params.forEach((item) => {
        searchParams.set(item?.key, row.original[item?.value]);
      });
      history.push(`/${window?.contextPath}/${userInfoType}${onRowClickData?.dependentUrl}?${searchParams.toString()}`);
    } else if (onRowClickData?.url) {
      onRowClickData.params.forEach((item) => {
        searchParams.set(item?.key, row.original[item?.value]);
      });
      history.push(`/${window?.contextPath}/${userInfoType}${onRowClickData?.url}?${searchParams.toString()}`);
    } else {
      const statusArray = [
        "PENDING_REGISTRATION",
        "CASE_ADMITTED",
        "ADMISSION_HEARING_SCHEDULED",
        "PENDING_PAYMENT",
        "UNDER_SCRUTINY",
        "PENDING_ADMISSION",
        "PENDING_E-SIGN",
        "PENDING_ADMISSION_HEARING",
        "PENDING_NOTICE",
        "PENDING_RESPONSE",
      ];
      if (statusArray.includes(row?.original?.status)) {
        if (row?.original?.status === "CASE_ADMITTED") {
          history.push(
            `/${window?.contextPath}/${userInfoType}/dristi/home/view-case?caseId=${row?.original?.id}&filingNumber=${row?.original?.filingNumber}&tab=Overview`
          );
        } else if (row?.original?.status === "ADMISSION_HEARING_SCHEDULED") {
          history.push(
            `/${window?.contextPath}/${userInfoType}/dristi/home/view-case?caseId=${row?.original?.id}&filingNumber=${row?.original?.filingNumber}&tab=Complaint`
          );
        } else if (row?.original?.status === "PENDING_REGISTRATION") {
          history.push(
            `/${window?.contextPath}/${userInfoType}/dristi/admission?caseId=${row?.original?.id}&filingNumber=${row?.original?.filingNumber}`
          );
        } else if (row?.original?.status === "PENDING_E-SIGN") {
          history.push(`/${window?.contextPath}/${userInfoType}/dristi/home/file-case/case?caseId=${row?.original?.id}&selected=addSignature`);
        } else {
          history.push(
            `/${window?.contextPath}/${userInfoType}/dristi/home/view-case?caseId=${row?.original?.id}&filingNumber=${row?.original?.filingNumber}&tab=Complaint`
          );
        }
      }
    }
  };

  if (isLoading || isFetching || isSearchLoading || isFetchCaseLoading) {
    return <Loader />;
  }

  if (isUserLoggedIn && !individualId && userInfoType === "citizen") {
    history.push(`/${window?.contextPath}/${userInfoType}/dristi/landing-page`);
  }

  if (isNyayMitra) {
    history.push(`/${window?.contextPath}/employee`);
  }

  const data = [
    {
      logo: <InboxIcon />,
      title: "REVIEW_SUMMON_NOTICE_WARRANTS_TEXT",
      pendingAction: 40,
      actionLink: "orders/Summons&Notice",
    },
    {
      logo: <DocumentIcon />,
      title: "VIEW_ISSUED_ORDERS",
      pendingAction: 11,
      actionLink: "",
    },
  ];

  return (
    <div className="home-view-hearing-container">
      {individualId && userType && userInfoType === "citizen" && !caseDetails ? (
        <LitigantHomePage isApprovalPending={isApprovalPending} />
      ) : (
        <React.Fragment>
          <div className="left-side">
            <div className="home-header-wrapper">
              <UpcomingHearings handleNavigate={handleNavigate} attendeeIndividualId={individualId} userInfoType={userInfoType} t={t} />
              {isJudge && (
                <div className="hearingCard" style={{ backgroundColor: "#ECF3FD" }}>
                  <Link to={`/${window.contextPath}/employee/home/dashboard`}> Open Dashboard </Link>
                </div>
              )}
              {isCourtRoomRole && <ReviewCard data={data} userInfoType={userInfoType} />}
            </div>
            <div className="content-wrapper">
              <div className="header-class">
                <div className="header">{t("CS_YOUR_CASE")}</div>
                {individualId && userType && userInfoType === "citizen" && (
                  <div className="button-field" style={{ width: "50%" }}>
                    <React.Fragment>
                      <JoinCaseHome
                        refreshInbox={refreshInbox}
                        t={t}
                        setShowSubmitResponseModal={setShowSubmitResponseModal}
                        setAskOtp={setAskOtp}
                        updateCase={setCaseDetails}
                        updateSelectedParty={setSelectedParty}
                        setResponsePendingTask={setResponsePendingTask}
                      />
                      {showSubmitResponseModal && <DocumentModal config={sumbitResponseConfig} />}
                      <Button
                        className={"tertiary-button-selector"}
                        label={t("FILE_A_CASE")}
                        labelClassName={"tertiary-label-selector"}
                        onButtonClick={() => {
                          history.push("/digit-ui/citizen/dristi/home/file-case");
                        }}
                      />
                    </React.Fragment>
                  </div>
                )}
              </div>
              <div className="inbox-search-wrapper pucar-home home-view">
                <InboxSearchComposer
                  key={`InboxSearchComposer-${callRefetch}`}
                  configs={{
                    ...config,
                    ...{
                      additionalDetails: {
                        ...config?.additionalDetails,
                        ...additionalDetails,
                      },
                    },
                  }}
                  defaultValues={defaultValues}
                  showTab={true}
                  tabData={tabData}
                  onTabChange={onTabChange}
                  additionalConfig={{
                    resultsTable: {
                      onClickRow: onRowClick,
                    },
                  }}
                />
              </div>
            </div>
          </div>
          <div className="right-side">
            <TasksComponent
              taskType={taskType}
              setTaskType={setTaskType}
              caseType={caseType}
              setCaseType={setCaseType}
              isLitigant={Boolean(individualId && userType && userInfoType === "citizen")}
              uuid={userInfo?.uuid}
              userInfoType={userInfoType}
              setAskOtp={setAskOtp}
              setShowSubmitResponseModal={setShowSubmitResponseModal}
              setResponsePendingTask={setResponsePendingTask}
            />
          </div>
        </React.Fragment>
      )}
    </div>
  );
};
export default HomeView;
