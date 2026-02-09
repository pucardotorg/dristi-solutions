import { BackButton, CheckSvg, CloseSvg, EditIcon, FormComposerV2, Header, Loader, TextInput, Toast } from "@egovernments/digit-ui-react-components";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Redirect, useHistory, useLocation } from "react-router-dom";
import ReactTooltip from "react-tooltip";
import { CaseWorkflowAction } from "../../../Utils/caseWorkflow";
import CustomCaseInfoDiv from "../../../components/CustomCaseInfoDiv";
import Modal from "../../../components/Modal";
import SendCaseBackModal from "../../../components/SendCaseBackModal";
import SuccessModal from "../../../components/SuccessModal";
import useSearchCaseService from "../../../hooks/dristi/useSearchCaseService";
import { CustomArrowDownIcon, FileDownloadIcon, FlagIcon } from "../../../icons/svgIndex";
import { DRISTIService } from "../../../services";
import { formatDate } from "../../citizen/FileCase/CaseType";
import { reviewCaseFileFormConfig } from "../../citizen/FileCase/Config/reviewcasefileconfig";

import Button from "../../../components/Button";
import useDownloadCasePdf from "../../../hooks/dristi/useDownloadCasePdf";
import downloadPdfWithLink from "../../../Utils/downloadPdfWithLink";
import WorkflowTimeline from "../../../components/WorkflowTimeline";
import { getCaseEditAllowedAssignees } from "../../../Utils";
import isEqual from "lodash/isEqual";
const judgeId = window?.globalConfigs?.getConfig("JUDGE_ID") || "JUDGE_ID";
const courtId = window?.globalConfigs?.getConfig("COURT_ID") || "COURT_ID";
const benchId = window?.globalConfigs?.getConfig("BENCH_ID") || "BENCH_ID";

const downloadButtonStyle = {
  backgroundColor: "white",
  border: "none",
  boxShadow: "none",
  display: "flex",
  justifyContent: "center",
  padding: "10px 20px",
  cursor: "pointer",
};

const downloadButtonTextStyle = {
  color: "#007e7e",
  fontFamily: "Roboto, sans-serif",
  fontSize: "16px",
  fontWeight: 700,
  lineHeight: "18.75px",
  textAlign: "center",
  width: "fit-content",
  margin: "0px",
};

const downloadSvgStyle = {
  margin: "0px 12px 0px 0px",
  height: "16px",
  width: "16px",
};

const downloadPathStyle = {
  fill: "#007e7e",
};

const delayCondonationStylsMain = {
  padding: "6px 8px",
  borderRadius: "999px",
  backgroundColor: "#E9A7AA",
  width: "fit-content",
};

const delayCondonationTextStyle = {
  margin: "0px",
  fontFamily: "Roboto",
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "16.41px",
  textAlign: "center",
  color: "#231F20",
};

function ViewCaseFile({ t, inViewCase = false, caseDetailsAdmitted }) {
  const history = useHistory();
  const userInfo = Digit?.UserService?.getUser()?.info;
  const roles = userInfo?.roles;
  const userInfoType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo]);
  const isScrutiny = roles?.some((role) => role.code === "CASE_REVIEWER");
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const caseId = searchParams.get("caseId");
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const [formdata, setFormdata] = useState({ isenabled: true, data: {}, displayindex: 0 });
  const [actionModal, setActionModal] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [showEditCaseNameModal, setShowEditCaseNameModal] = useState(false);
  const [newCaseName, setNewCaseName] = useState("");
  const [modalCaseName, setModalCaseName] = useState("");
  const [highlightChecklist, setHighlightChecklist] = useState(false);
  const [comment, setComment] = useState("");
  const [commentSendBack, setCommentSendBack] = useState("");
  const [toastMsg, setToastMsg] = useState(null);
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo]);
  const isEpostUser = useMemo(() => roles?.some((role) => role?.code === "POST_MANAGER"), [roles]);
  const [loading, setLoading] = useState(false);

  let homePath = `/${window?.contextPath}/${userType}/home/home-pending-task`;
  if (!isEpostUser && userType === "employee") homePath = `/${window?.contextPath}/${userType}/home/home-screen`;

  const { downloadPdf } = useDownloadCasePdf();

  const checkListLink = window?.globalConfigs?.getConfig("SCRUTINY_CHECK_LIST");

  // Saving formdata in session storage (if page refresh happens, form data is not lost and user is not needed to fill the form from start)
  const employeeCreateSession = Digit.Hooks.useSessionStorage("NEW_EMPLOYEE_CREATE", {});
  const [sessionFormData, setSessionFormData, clearSessionFormData] = employeeCreateSession;

  const onFormValueChange = (setValue, formData, formState, reset, setError, clearErrors, trigger, getValues) => {
    if (JSON.stringify(formData) !== JSON.stringify(formdata.data)) {
      setFormdata((prev) => {
        return { ...prev, data: formData };
      });
    }
    if (!isEqual(sessionFormData?.data, formData)) {
      setSessionFormData({ data: { ...sessionFormData?.data, ...formData }, caseId: caseId });
    }
  };

  const closeToast = () => {
    setShowErrorToast(false);
  };

  const countSectionErrors = (section) => {
    let total = 0;
    let sectionErrors = 0;
    let inputErrors = 0;
    Object.keys(section)?.forEach((key) => {
      if (section[key]) {
        if (section[key]?.scrutinyMessage?.FSOError) {
          total++;
          sectionErrors++;
        }
        section[key]?.form?.forEach((item) => {
          Object.keys(item)?.forEach((field) => {
            if (item[field]?.FSOError && field != "image" && field != "title" && field != "witnessTitle") {
              if (!item[field]?.isWarning) {
                total++;
                inputErrors++;
              }
            }
          });
        });
      }
    });

    return { total, inputErrors, sectionErrors };
  };

  const { data: caseFetchResponse, isLoading } = useSearchCaseService(
    {
      criteria: [
        {
          caseId: caseId,
          ...(inViewCase && userInfoType === "employee" && courtId && { courtId }),
        },
      ],
      tenantId,
    },
    {},
    `dristi-${caseId}`,
    caseId,
    Boolean(caseId && !caseDetailsAdmitted)
  );

  const caseDetails = useMemo(() => caseFetchResponse?.criteria?.[0]?.responseList?.[0] || caseDetailsAdmitted || null, [
    caseFetchResponse,
    caseDetailsAdmitted,
  ]);

  // Case correction/edition is allowed to all complainant side parties including poa holders, advocates, advocate's associated office members.
  // but no need to send uuid of office members in assignee payload
  const allComplainantSideUuids = useMemo(() => {
    return getCaseEditAllowedAssignees(caseDetails);
  }, [caseDetails]);
  const filingNumberRef = useRef(null);

  useEffect(() => {
    return () => {
      if (window.location.pathname.includes("employee/dristi/case")) {
        return;
      } else {
        // clear the stored form data if user moved away from scrutiny page
        clearSessionFormData();
      }
    };
  }, []);

  useEffect(() => {
    if (caseDetails) {
      filingNumberRef.current = caseDetails?.filingNumber;
    }
  }, [caseDetails]);

  const unlockCase = async (filingNumber) => {
    try {
      await DRISTIService.setCaseUnlock({}, { uniqueId: filingNumber, tenantId: tenantId });
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    return () => {
      if (isScrutiny && filingNumberRef?.current) {
        unlockCase(filingNumberRef.current);
      }
    };
  }, [location]);

  const defaultScrutinyErrors = useMemo(() => {
    return caseDetails?.additionalDetails?.scrutiny || {};
  }, [caseDetails]);

  const defaultvalue = useMemo(() => {
    return sessionFormData?.data && sessionFormData?.caseId === caseId ? sessionFormData?.data : defaultScrutinyErrors?.data || {};
  }, [defaultScrutinyErrors, sessionFormData, caseId]);

  const isPrevScrutiny = useMemo(() => {
    return Object.keys(defaultScrutinyErrors).length > 0;
  }, [defaultScrutinyErrors]);

  function mergeErrors(formdata, defaultScrutinyErrors) {
    // Helper function to handle the comparison and merging of objects
    function compareAndReplace(formDataNode, defaultNode) {
      // Iterate over each key in the formdata node
      for (let key in formDataNode) {
        // Check if the key exists in both formdata and defaultScrutinyErrors
        if (defaultNode?.hasOwnProperty(key)) {
          // If the value is an object, recursively compare and replace
          if (typeof formDataNode[key] === "object" && formDataNode[key] !== null) {
            compareAndReplace(formDataNode[key], defaultNode[key]);
          } else {
            // If the value is a string (for FSOError and scrutinyMessage)
            if (key === "FSOError" || key === "scrutinyMessage") {
              if (formDataNode[key] === defaultNode[key] && !formDataNode?.markError) {
                formDataNode[key] = "";
              } else {
                formDataNode[key] = formDataNode[key];
              }
              formDataNode["markError"] = false;
            }
          }
        }
      }
    }
    // Clone the formdata object to avoid modifying the original one
    const result = JSON.parse(JSON.stringify(formdata));
    // Start the comparison and replacement
    compareAndReplace(result.data, defaultScrutinyErrors.data);
    return result;
  }

  const fileStoreId = useMemo(() => {
    return (
      caseDetails?.documents?.filter((doc) => doc?.key === "case.complaint.signed")?.map((doc) => doc?.fileStore)?.[0] ||
      caseDetails?.additionalDetails?.signedCaseDocument
    );
  }, [caseDetails]);

  const newScrutinyData = useMemo(() => {
    return mergeErrors(formdata, defaultScrutinyErrors);
  }, [formdata, defaultScrutinyErrors]);

  const scrutinyErrors = useMemo(() => {
    const errorCount = {};
    for (const key in newScrutinyData?.data) {
      if (typeof newScrutinyData.data[key] === "object" && newScrutinyData.data[key] !== null) {
        if (!errorCount[key]) {
          errorCount[key] = { total: 0, sectionErrors: 0, inputErrors: 0 };
        }
        const temp = countSectionErrors(newScrutinyData.data[key]);
        errorCount[key] = {
          total: errorCount[key].total + temp.total,
          sectionErrors: errorCount[key].sectionErrors + temp.sectionErrors,
          inputErrors: errorCount[key].inputErrors + temp.inputErrors,
        };
      }
    }
    return errorCount;
  }, [newScrutinyData]);

  const totalErrors = useMemo(() => {
    let total = 0;
    let sectionErrors = 0;
    let inputErrors = 0;

    for (const key in scrutinyErrors) {
      total += scrutinyErrors[key].total || 0;
      sectionErrors += scrutinyErrors[key].sectionErrors || 0;
      inputErrors += scrutinyErrors[key].inputErrors || 0;
    }

    return {
      total,
      sectionErrors,
      inputErrors,
    };
  }, [scrutinyErrors]);
  const isDisabled = useMemo(() => totalErrors?.total > 0);

  const delayCondonationData = useMemo(() => caseDetails?.caseDetails?.delayApplications?.formdata?.[0]?.data, [caseDetails]);

  const transformedData = useCallback(
    (input) => {
      if (input?.key === "witnessDetails") {
        return (caseDetails?.witnessDetails || [])?.map((details) => ({
          data: { ...(details || {}) },
        }));
      }
      return caseDetails?.additionalDetails?.[input?.key]?.formdata || caseDetails?.caseDetails?.[input?.key]?.formdata || {};
    },
    [caseDetails]
  );

  const state = useMemo(() => caseDetails?.status, [caseDetails]);
  const formConfig = useMemo(() => {
    if (!caseDetails) return null;

    const reviewFileConfig = structuredClone(reviewCaseFileFormConfig);
    if (!inViewCase) {
      reviewFileConfig?.[0]?.body?.push({
        type: "component",
        component: "SelectReviewAccordion",
        key: "paymentDetails",
        label: "CS_PAYMENT_DETAILS",
        number: 4,
        withoutLabel: true,
        populators: {
          inputs: [
            {
              key: "paymentReceipt",
              name: "paymentReceipt",
              label: "CS_PAYMENT_RECEIPT",
              icon: "PaymentDetailsIcon",
              disableScrutiny: true,
              config: [
                {
                  type: "image",
                  label: "",
                  value: ["document"],
                },
              ],
              data: {},
            },
          ],
        },
      });
    }
    return [
      ...reviewFileConfig.map((form) => {
        return {
          ...form,
          body: form.body
            ?.filter((section) => !(section?.key === "submissionFromAccused" && isScrutiny))
            .map((section) => {
              return {
                ...section,
                isPrevScrutiny,
                populators: {
                  ...section.populators,
                  inputs: section.populators.inputs?.map((input) => {
                    delete input.data;
                    if (input?.key === "submissionFromAccused") {
                      const responseDocuments = caseDetails?.litigants
                        ?.filter((party) => party.partyType && party.partyType.includes("respondent"))
                        ?.flatMap((party) =>
                          (party.documents || [])
                            .filter((doc) => doc.additionalDetails?.fileType === "respondent-response")
                            ?.map((doc) => ({
                              ...doc,
                              fileName: `${t("RESPONSE_SUBMISSION")} (${party?.additionalDetails?.fullName})`,
                            }))
                        );
                      const vakalatnamaDocument = caseDetails?.representatives
                        ?.filter((representative) => representative?.representing?.some((represent) => represent?.partyType?.includes("respondent")))
                        ?.flatMap((item) =>
                          item.representing.flatMap((rep) => [
                            ...(rep.documents || []),
                            ...(rep.additionalDetails?.document?.vakalatnamaFileUpload || []),
                          ])
                        );
                      const supportingDocument = caseDetails?.representatives
                        ?.filter((representative) => representative?.representing?.some((represent) => represent?.partyType?.includes("respondent")))
                        ?.flatMap((item) =>
                          (item.documents || [])?.map((doc) => ({
                            ...doc,
                            fileName: `${t("REASON_FOR_REPLACEMENT")} (${item?.additionalDetails?.advocateName})`,
                          }))
                        );
                      const pipAffidavitDocument = caseDetails?.litigants
                        ?.filter((party) => party.partyType && party.partyType.includes("respondent"))
                        ?.flatMap((party) =>
                          (party.documents || [])
                            .filter((doc) => doc?.additionalDetails?.documentName === "UPLOAD_PIP_AFFIDAVIT")
                            ?.map((doc) => ({
                              ...doc,
                              fileName: `${t(doc?.additionalDetails?.documentName)} (${party?.additionalDetails?.fullName})`,
                            }))
                        );

                      return {
                        ...input,
                        data: [
                          {
                            data: {
                              infoBoxData: {
                                data: responseDocuments ? t("RESPONSE_SUBMISSION_MESSAGE") : t("RESPONSE_NOT_SUMISSION_MESSAGE"),
                                header: responseDocuments ? "ES_COMMON_INFO" : "PLEASE_NOTE",
                              },
                              responseDocuments: responseDocuments,
                              vakalatnamaDocument: vakalatnamaDocument,
                              pipAffidavitDocument: pipAffidavitDocument,
                              supportingDocument: supportingDocument,
                            },
                          },
                        ],
                      };
                    } else if (["complainantDetails", "respondentDetails"].includes(input?.key)) {
                      const isPartyInPerson = (individualId) => {
                        const representative = caseDetails?.representatives?.find((data) =>
                          data?.representing?.find((rep) => rep?.individualId === individualId && rep?.isActive === true)
                        );
                        return representative ? false : true;
                      };
                      const returnData = {
                        ...input,
                        data: caseDetails?.additionalDetails?.[input?.key]?.formdata?.map((fData) => ({
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
                        prevErrors: defaultScrutinyErrors?.data?.[section.key]?.[input.key] || {},
                      };
                      return returnData;
                    } else if (input?.key === "paymentReceipt") {
                      return {
                        ...input,
                        data: [
                          {
                            data: {
                              document:
                                caseDetails?.documents
                                  ?.filter((doc) => doc?.documentType === "PAYMENT_RECEIPT")
                                  ?.map((doc) => ({
                                    ...doc,
                                    fileName: doc?.documentType,
                                  })) || [],
                            },
                          },
                        ],
                      };
                    } else
                      return {
                        ...input,
                        data: transformedData(input),
                        prevErrors: defaultScrutinyErrors?.data?.[section.key]?.[input.key] || {},
                      };
                  }),
                },
              };
            }),
        };
      }),
    ];
  }, [caseDetails, isScrutiny, isPrevScrutiny, defaultScrutinyErrors?.data, t, transformedData]);

  const primaryButtonLabel = useMemo(() => {
    if (isScrutiny && caseDetails?.status === "UNDER_SCRUTINY") {
      return "CS_REGISTER_CASE";
    }
    //write admission condition here
  }, [isScrutiny, caseDetails]);
  const secondaryButtonLabel = useMemo(() => {
    if (isScrutiny && caseDetails?.status === "UNDER_SCRUTINY") {
      return "CS_SEND_BACK";
    }
  }, [isScrutiny, caseDetails]);

  const updateCaseDetails = async (action, filterSigned = false) => {
    setLoading(true);
    let filteredDocuments = caseDetails?.documents;
    if (filterSigned) {
      filteredDocuments = caseDetails?.documents?.filter(
        (doc) => doc?.documentType !== "case.complaint.signed" && doc?.documentType !== "case.complaint.unsigned"
      );
    }
    const scrutinyObj = action === CaseWorkflowAction.VALIDATE ? {} : CaseWorkflowAction.SEND_BACK && isPrevScrutiny ? newScrutinyData : formdata;
    const newAdditionalDetails = {
      ...caseDetails.additionalDetails,
      scrutiny: scrutinyObj,
      ...(action === CaseWorkflowAction.VALIDATE
        ? { scrutinyComment: comment }
        : action === CaseWorkflowAction.SEND_BACK && { scrutinyCommentSendBack: commentSendBack }),
    };

    if ("judge" in newAdditionalDetails) {
      delete newAdditionalDetails.judge;
    }

    const newcasedetails = {
      ...caseDetails,
      documents: filteredDocuments,
      additionalDetails: newAdditionalDetails,
      caseTitle: newCaseName !== "" ? newCaseName : caseDetails?.caseTitle,
    };

    return DRISTIService.caseUpdateService(
      {
        cases: {
          ...newcasedetails,
          linkedCases: caseDetails?.linkedCases ? caseDetails?.linkedCases : [],
          workflow: {
            ...caseDetails?.workflow,
            action,
            ...(action === CaseWorkflowAction.SEND_BACK && { assignes: allComplainantSideUuids, comments: commentSendBack }),
            ...(action === CaseWorkflowAction.VALIDATE && { comments: comment }),
          },
          ...(action === CaseWorkflowAction.VALIDATE && { judgeId, courtId, benchId }),
        },
        tenantId,
      },
      tenantId
    );
  };

  const handlePrimaryButtonClick = () => {
    if (isScrutiny && caseDetails?.status === "UNDER_SCRUTINY") {
      // setActionModal("sendCaseBackPotential");
      setActionModal("registerCase");
    }
    // Write isAdmission condition here
  };
  const handleSecondaryButtonClick = () => {
    if (isScrutiny && caseDetails?.status === "UNDER_SCRUTINY") {
      setActionModal("sendCaseBack");
    }
    // Write isAdmission condition here
  };

  const showToast = (type, message, duration = 5000) => {
    setToastMsg({ key: type, action: message });
    setTimeout(() => {
      setToastMsg(null);
    }, duration);
  };

  const handleScrutinyAndLock = async (filingNumber) => {
    const isScrutiny = roles?.some((role) => role.code === "CASE_REVIEWER");
    if (isScrutiny) {
      try {
        const response = await DRISTIService.getCaseLockStatus({}, { uniqueId: filingNumber, tenantId: tenantId });
        if (response?.Lock?.isLocked) {
          showToast("error", t("CASE_IS_ALREADY_LOCKED_REDIRECT_TO_HOME"), 2000);
          return false;
        } else {
          await DRISTIService.setCaseLock({ Lock: { uniqueId: filingNumber, tenantId: tenantId, lockType: "SCRUTINY" } }, {});

          return true;
        }
      } catch (error) {
        showToast("error", t("ISSUE_WITH_LOCK_REDIRECT_TO_HOME"), 2000);
        console.error(error);
        return false;
      }
    } else return true;
  };
  const handleNextCase = () => {
    DRISTIService.searchCaseService(
      {
        criteria: [
          {
            status: ["UNDER_SCRUTINY"],
          },
        ],
        tenantId,
      },
      {}
    )
      .then(async (res) => {
        if (res?.criteria?.[0]?.responseList?.[0]?.id) {
          const isUnderScrutinyUnLocked = await handleScrutinyAndLock(res?.criteria?.[0]?.responseList?.[0]?.filingNumber);
          if (!isUnderScrutinyUnLocked) {
            setTimeout(() => {
              history.push(`/${window?.contextPath}/employee/dristi/cases`, { caseLockError: "ERROR_CODE" });
              return;
            }, 2000);
          } else history.push(`/${window?.contextPath}/employee/dristi/case?caseId=${res?.criteria?.[0]?.responseList?.[0]?.id}`);
        } else {
          history.push(`/${window?.contextPath}/employee/dristi/cases`);
        }
        setActionModal(false);
      })
      .catch(() => {
        setActionModal(false);
        history.push(`/${window?.contextPath}/employee/dristi/cases`);
      });
  };
  const handleAllocationJudge = () => {
    DRISTIService.searchCaseService(
      {
        criteria: [
          {
            status: ["UNDER_SCRUTINY"],
          },
        ],
        tenantId,
      },
      {}
    )
      .then(async (res) => {
        if (res?.criteria?.[0]?.responseList?.[0]?.id) {
          const isUnderScrutinyUnLocked = await handleScrutinyAndLock(res?.criteria?.[0]?.responseList?.[0]?.filingNumber);
          if (!isUnderScrutinyUnLocked) {
            setTimeout(() => {
              history.push(`/${window?.contextPath}/employee/dristi/cases`, { caseLockError: "ERROR_CODE" });
              return;
            }, 2000);
          } else history.push(`/${window?.contextPath}/employee/dristi/case?caseId=${res?.criteria?.[0]?.responseList?.[0]?.id}`);
        } else {
          history.push(`/${window?.contextPath}/employee/dristi/cases`);
        }
        setActionModal(false);
      })
      .catch(() => {
        setActionModal(false);
        history.push(`/${window?.contextPath}/employee/dristi/cases`);
      });
  };
  const handleCloseSucessModal = () => {
    setActionModal(false);
    history.push(`/${window?.contextPath}/employee/dristi/cases`);
  };
  const handleRegisterCase = () => {
    updateCaseDetails(CaseWorkflowAction.VALIDATE, false).then((res) => {
      setTimeout(() => {
        setLoading(false);
        setActionModal("caseRegisterSuccess");
      }, 2000);
    });
  };
  const handleSendCaseBack = () => {
    updateCaseDetails(CaseWorkflowAction.SEND_BACK, true).then((res) => {
      setTimeout(() => {
        setLoading(false);
        setActionModal("caseSendBackSuccess");
      }, 2000);
    });
  };
  const handlePotentialConfirm = () => {
    setActionModal("caseRegisterPotential");
  };
  const handleCloseModal = () => {
    setActionModal(false);
    setHighlightChecklist(true);
    setTimeout(() => {
      setHighlightChecklist(false);
    }, 2000);
  };

  const sidebar = useMemo(() => {
    const baseSidebar = ["litigentDetails", "caseSpecificDetails", "additionalDetails", "submissionFromAccused"].filter(
      (sidebar) => !(sidebar === "submissionFromAccused" && isScrutiny)
    );

    if (isScrutiny && !inViewCase) {
      baseSidebar.push("paymentDetails");
    }

    return baseSidebar;
  }, [inViewCase, isScrutiny]);

  if (!caseId) {
    return <Redirect to="cases" />;
  }

  if (isLoading) {
    return <Loader />;
  }
  // if (isScrutiny && state !== CaseWorkflowState.UNDER_SCRUTINY) {
  //   history.push(`/${window?.contextPath}/employee/dristi/cases`);
  // }
  const labels = {
    litigentDetails: "CS_LITIGENT_DETAILS",
    caseSpecificDetails: "CS_CASE_SPECIFIC_DETAILS",
    additionalDetails: "CS_ADDITIONAL_DETAILS",
    paymentDetails: "CS_PAYMENT_DETAILS",
    submissionFromAccused: "CS_SUBMISSSIONS_FROM_ACCUSED",
  };
  const checkList = [
    "CS_SPELLING_CHECK",
    "CS_VERIFY_REQUIRED_DOCUMENTS",
    "CS_ENSURE_DOCUMENT_CLARITY",
    "CS_CONFIRM_JURISDICTION",
    "CS_VERIFY_SIGNATURES",
    "CS_VALID_CHEQUE_RETURN_REASON",
    "CS_WRONG_JURISDICTION",
    "CS_CORRECT_DOCUMENT_MAPPING",
    "CS_CROSSCHECK_FIELD_DETAILS",
  ];
  const caseInfo = [
    {
      key: "CASE_CATEGORY",
      value: caseDetails?.caseCategory,
    },
    {
      key: "CASE_TYPE",
      value: "NIA S138",
    },
    {
      key: "SUBMITTED_ON",
      value: formatDate(new Date(caseDetails?.filingDate)),
    },
  ];

  const CloseBtn = (props) => {
    return (
      <div onClick={props?.onClick} style={{ height: "100%", display: "flex", alignItems: "center", paddingRight: "20px", cursor: "pointer" }}>
        <CloseSvg />
      </div>
    );
  };

  if (caseDetails?.status !== "UNDER_SCRUTINY" && isScrutiny && !inViewCase) {
    history.push(homePath);
  }

  const Heading = (props) => {
    return <h1 className="heading-m">{props.label}</h1>;
  };

  const scrollToHeading = (heading) => {
    const scroller = Array.from(document.querySelectorAll(".label-field-pair .accordion-title")).find((el) => el.textContent === heading);
    scroller.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  return (
    <div className={"case-and-admission"}>
      <div className="view-case-file">
        <div className="file-case">
          <div className="file-case-side-stepper">
            <div className="file-case-select-form-section">
              {sidebar.map((key, index) => (
                <div className="accordion-wrapper">
                  <div key={index} className="accordion-title" onClick={() => scrollToHeading(`${index + 1}. ${t(labels[key])}`)}>
                    <div>{`${index + 1}. ${t(labels[key])}`}</div>
                    {!inViewCase && key !== "paymentDetails" && (
                      <div>{scrutinyErrors[key]?.total ? `${scrutinyErrors[key].total} ${t("CS_ERRORS")}` : t("CS_NO_ERRORS")}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="file-case-form-section">
            <div className="employee-card-wrapper">
              {!inViewCase && (
                <div>
                  <div className="back-button-home" style={{ alignItems: "center" }}>
                    <div style={{ height: "fit-content" }}>
                      <BackButton />
                    </div>
                    <Button
                      style={downloadButtonStyle}
                      textStyles={downloadButtonTextStyle}
                      icon={<FileDownloadIcon svgStyle={downloadSvgStyle} pathStyle={downloadPathStyle} />}
                      className="download-button"
                      label={t("CS_COMMON_DOWNLOAD")}
                      onButtonClick={() => downloadPdf(tenantId, fileStoreId)}
                    />
                  </div>
                  <div className="header-content">
                    <div className="header-details">
                      <div className="header-title-icon">
                        <Header>
                          {t("CS_REVIEW_CASE")}: {newCaseName !== "" ? newCaseName : caseDetails?.caseTitle}
                        </Header>
                        <div
                          className="case-edit-icon"
                          onClick={() => {
                            setShowEditCaseNameModal(true);
                          }}
                        >
                          <React.Fragment>
                            <span style={{ color: "#77787B", position: "relative" }} data-tip data-for={`Click`}>
                              {" "}
                              <EditIcon />
                            </span>
                            <ReactTooltip id={`Click`} place="bottom" content={t("CS_CLICK_TO_EDIT") || ""}>
                              {t("CS_CLICK_TO_EDIT")}
                            </ReactTooltip>
                          </React.Fragment>
                        </div>
                      </div>
                      <div className="header-icon" onClick={() => {}}>
                        <CustomArrowDownIcon />
                      </div>
                    </div>
                    {delayCondonationData?.delayCondonationType?.code === "NO" && (
                      <div className="delay-condonation-chip" style={{ ...delayCondonationStylsMain }}>
                        <p style={delayCondonationTextStyle}>
                          {delayCondonationData?.isDcaSkippedInEFiling?.code === "NO"
                            ? t("DELAY_CONDONATION_FILED")
                            : t("DELAY_CONDONATION_NOT_FILED")}
                        </p>
                      </div>
                    )}
                    <CustomCaseInfoDiv data={caseInfo} t={t} />
                  </div>
                </div>
              )}
              <FormComposerV2
                key={`${inViewCase}-${isScrutiny}-${caseId}-${sessionFormData}`}
                label={primaryButtonLabel}
                config={formConfig}
                onSubmit={handlePrimaryButtonClick}
                onSecondayActionClick={handleSecondaryButtonClick}
                defaultValues={structuredClone(defaultvalue)}
                onFormValueChange={onFormValueChange}
                cardStyle={{ minWidth: "100%" }}
                isDisabled={isDisabled}
                cardClassName={`e-filing-card-form-style review-case-file`}
                secondaryLabel={secondaryButtonLabel}
                showSecondaryLabel={totalErrors?.total > 0}
                actionClassName="e-filing-action-bar"
              />
              {!inViewCase && (
                <div className="error-flag-class">
                  <FlagIcon isError={totalErrors?.total > 0} />
                  <h3>
                    {totalErrors.total
                      ? `${totalErrors.inputErrors} ${t("CS_TOTAL_INPUT_ERRORS")} & ${totalErrors.sectionErrors} ${t("CS_TOTAL_SECTION_ERRORS")}`
                      : t("CS_NO_ERRORS")}
                  </h3>
                </div>
              )}
              {showErrorToast && (
                <Toast error={true} label={t("ES_COMMON_PLEASE_ENTER_ALL_MANDATORY_FIELDS")} isDleteBtn={true} onClose={closeToast} />
              )}
            </div>
          </div>
          {!inViewCase && (
            <div className={highlightChecklist ? "file-case-checklist-highlight" : "file-case-checklist"}>
              <div className="checklist-main">
                <h3 className="checklist-title">{t("CS_CHECKLIST_HEADER")}</h3>
                {checkList.map((item, index) => {
                  return (
                    <div className="checklist-item" key={index}>
                      <div className="item-logo">
                        <CheckSvg />
                      </div>
                      <h3 className="item-text">{t(item)}</h3>
                    </div>
                  );
                })}
                <div className="checklist-item" key={checkList.length}>
                  <div className="item-logo">
                    <CheckSvg />
                  </div>
                  <h3 className="item-text">
                    {t("CS_REFERENCE_RELATED_FIELDS")}{" "}
                    <span
                      onClick={async () => await downloadPdfWithLink(checkListLink, "ScrutinyCheckList")}
                      style={{ color: "#007e7e", textDecoration: "underline", cursor: "pointer" }}
                    >
                      {t("CS_HERE")}
                    </span>
                  </h3>
                </div>
              </div>
              <WorkflowTimeline t={t} applicationNo={caseDetails?.filingNumber} tenantId={tenantId} businessService="case-default" />
            </div>
          )}

          {showEditCaseNameModal && (
            <Modal
              headerBarEnd={
                <CloseBtn
                  onClick={() => {
                    setShowEditCaseNameModal(false);
                  }}
                />
              }
              // actionCancelLabel={t(actionCancelLabel)}
              actionCancelOnSubmit={() => setShowEditCaseNameModal(false)}
              actionSaveLabel={t("CS_COMMON_CONFIRM")}
              actionSaveOnSubmit={() => {
                setNewCaseName(modalCaseName);
                setShowEditCaseNameModal(false);
              }}
              formId="modal-action"
              headerBarMain={<Heading label={t("CS_CHANGE_CASE_NAME")} />}
              className="edit-case-name-modal"
            >
              <h3 className="input-label">{t("CS_CASE_NAME")}</h3>
              <TextInput defaultValue={newCaseName || caseDetails?.caseTitle} type="text" onChange={(e) => setModalCaseName(e.target.value)} />
            </Modal>
          )}
          {actionModal === "sendCaseBack" && (
            <SendCaseBackModal
              loading={loading}
              comment={commentSendBack}
              setComment={setCommentSendBack}
              actionCancelLabel={"CS_COMMON_BACK"}
              actionSaveLabel={"CS_COMMON_CONFIRM"}
              t={t}
              totalErrors={totalErrors?.total || 0}
              onCancel={handleCloseModal}
              onSubmit={handleSendCaseBack}
              heading={"CS_SEND_CASE_BACK_FOR_CORRECTION"}
              type="sendCaseBack"
            />
          )}
          {actionModal === "registerCase" && (
            <SendCaseBackModal
              loading={loading}
              comment={comment}
              setComment={setComment}
              actionCancelLabel={"CS_COMMON_BACK"}
              actionSaveLabel={"CS_COMMON_CONFIRM"}
              t={t}
              totalErrors={totalErrors?.total || 0}
              onCancel={handleCloseModal}
              onSubmit={handleRegisterCase}
              heading={"CS_REGISTER_CASE_CONFIRMATION"}
              type="registerCase"
            />
          )}

          {actionModal === "sendCaseBackPotential" && (
            <SendCaseBackModal
              actionCancelLabel={"CS_NO_REGISTER_CASE"}
              actionSaveLabel={"CS_COMMON_CONFIRM"}
              t={t}
              totalErrors={totalErrors?.total || 0}
              handleCloseModal={handleCloseModal}
              onCancel={handlePotentialConfirm}
              onSubmit={handleSendCaseBack}
              heading={"CS_SEND_CASE_BACK_FOR_CORRECTION"}
              type="sendCaseBackPotential"
            />
          )}
          {actionModal === "caseRegisterPotential" && (
            <SendCaseBackModal
              actionCancelLabel={"CS_SEE_POTENTIAL_ERRORS"}
              actionSaveLabel={"CS_DELETE_ERRORS_REGISTER"}
              t={t}
              totalErrors={totalErrors?.total || 0}
              onCancel={handleCloseModal}
              onSubmit={handleSendCaseBack}
              heading={"CS_SEND_CASE_BACK_FOR_CORRECTION"}
              type="sendCaseBackPotential"
            />
          )}

          {actionModal === "caseRegisterSuccess" && (
            <SuccessModal
              header={t("SUCCESS")}
              t={t}
              actionCancelLabel={"CS_COMMON_CLOSE"}
              actionSaveLabel={"CS_ALLOCATE_JUDGE"}
              bannerMessage={"CS_CASE_REGISTERED_SUCCESS"}
              onCancel={handleCloseSucessModal}
              onSubmit={handleAllocationJudge}
              type={"caseRegisterSuccess"}
              data={{
                caseId: caseDetails?.filingNumber,
                caseName: newCaseName !== "" ? newCaseName : caseDetails?.caseTitle,
                errorsMarked: totalErrors.total,
              }}
            />
          )}
        </div>
        {actionModal === "caseSendBackSuccess" && (
          <SuccessModal
            header={t("SUCCESS")}
            t={t}
            actionCancelLabel={"BACK_TO_HOME"}
            actionSaveLabel={"NEXT_CASE"}
            bannerMessage={"CS_CASE_SENT_BACK_SUCCESS"}
            onCancel={handleCloseSucessModal}
            onSubmit={handleNextCase}
            type={"caseSendBackSuccess"}
            data={{
              caseId: caseDetails?.filingNumber,
              caseName: newCaseName !== "" ? newCaseName : caseDetails?.caseTitle,
              errorsMarked: totalErrors.total,
            }}
          />
        )}
        {toastMsg && (
          <Toast
            error={toastMsg.key === "error"}
            label={t(toastMsg.action)}
            onClose={() => setToastMsg(null)}
            isDleteBtn={true}
            style={{ maxWidth: "500px" }}
          />
        )}
      </div>
    </div>
  );
}

export default ViewCaseFile;
