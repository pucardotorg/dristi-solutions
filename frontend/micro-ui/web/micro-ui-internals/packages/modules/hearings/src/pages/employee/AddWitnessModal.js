import { Button, CloseSvg, FormComposerV2, Loader, Toast } from "@egovernments/digit-ui-react-components";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import addWitnessConfig from "../../configs/AddWitnessConfig.js";
import { useTranslation } from "react-i18next";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal.js";
import isEqual from "lodash/isEqual";
import { submissionService } from "../../../../submissions/src/hooks/services/index.js";
import { SubmissionWorkflowAction } from "@egovernments/digit-ui-module-dristi/src/Utils/submissionWorkflow.js";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min.js";

const AddWitnessModal = ({ tenantId, onCancel, caseDetails, isJudge, onAddSuccess }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const DRISTIService = Digit?.ComponentRegistryService?.getComponent("DRISTIService");
  const [formConfigs, setFormConfigs] = useState([addWitnessConfig(1)]);
  const [witnessFormList, setWitnessFormList] = useState([{}]);
  const userInfo = Digit.UserService.getUser()?.info;
  const userRoles = userInfo?.roles?.map((role) => role?.code);
  const isCitizen = userRoles?.includes("CITIZEN");
  const setFormErrors = useRef([]);
  const [isWitnessAdding, setIsWitnessAdding] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
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

  const Heading = (props) => {
    return <h1 className="heading-m">{props.label}</h1>;
  };

  const CloseBtn = (props) => {
    return (
      <div onClick={props.onClick} style={{ height: "100%", display: "flex", alignItems: "center", paddingRight: "20px", cursor: "pointer" }}>
        <CloseSvg />
      </div>
    );
  };

  const generateUUID = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const cleanString = (input) => {
    return input
      .replace(/\b(null|undefined)\b/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const { data: individualData } = window?.Digit.Hooks.dristi.useGetIndividualUser(
    {
      Individual: {
        userUuid: [userInfo?.uuid],
      },
    },
    { tenantId, limit: 1000, offset: 0 },
    "Home",
    "",
    userInfo?.uuid
  );
  const individualId = useMemo(() => individualData?.Individual?.[0]?.individualId, [individualData]);

  // check if labelchildren is optional then change it to span with color #77787B
  useMemo(() => {
    formConfigs.forEach((config) => {
      config.forEach((conf) => {
        conf.body.forEach((body) => {
          if (body.labelChildren === "optional") {
            body.labelChildren = <span style={{ color: "#77787B" }}>&nbsp;{`${t("CS_IS_OPTIONAL")}`}</span>;
          }
        });
      });
    });
  }, [formConfigs, t]);

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
    // If logged in person is an advocate
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
    return [];
  }, [caseDetails, pipComplainants, pipAccuseds, userInfo]);

  const handleAddParty = () => {
    const newConfig = addWitnessConfig(formConfigs.length + 1);
    setFormConfigs([...formConfigs, newConfig]);
    setWitnessFormList((prev) => [...prev, {}]);
  };

  const handleRemoveParty = () => {
    if (formConfigs.length > 1) {
      setFormConfigs(formConfigs.slice(0, -1));
    }
    if (witnessFormList.length > 1) {
      setWitnessFormList(witnessFormList.slice(0, -1));
    }
  };

  const handleReviewDetails = (e) => {
    e?.stopPropagation();
    e?.preventDefault();

    // Filter out entries with data
    const validFormData = witnessFormList?.filter((item) => item?.data);

    // Validate required fields
    for (const { data } of validFormData) {
      if (!(data?.firstName || data?.witnessDesignation)) {
        setShowErrorToast({ label: t("AT_LEAST_ONE_OUT_OF_FIRST_NAME_AND_WITNESS_DESIGNATION_IS_MANDATORY"), error: true });
        return;
      }
    }
    setShowConfirmModal(true);
  };

  const confirmAndSubmit = async (e) => {
    setIsWitnessAdding(true);
    e?.stopPropagation();
    e?.preventDefault();

    try {
      if (isJudge) {
        const newWitnesses = witnessFormList?.map((data) => {
          return {
            ...data?.data,
            uniqueId: generateUUID(),
          };
        });
        await DRISTIService.addNewWitness(
          {
            tenantId,
            caseFilingNumber: caseDetails?.filingNumber,
            witnessDetails: newWitnesses,
          },
          { tenantId: tenantId }
        );
      } else {
        const newWitnesses = witnessFormList?.map((data) => {
          return {
            ...data,
            isenabled: true,
            displayindex: 0,
            uniqueId: generateUUID(),
          };
        });
        await submissionService
          .createApplication(
            {
              tenantId,
              application: {
                tenantId,
                filingNumber: caseDetails?.filingNumber,
                cnrNumber: caseDetails?.cnrNumber,
                cmpNumber: caseDetails?.cmpNumber,
                caseId: caseDetails?.id,
                createdDate: new Date().getTime(),
                applicationType: "WITNESS_DEPOSITION",
                isActive: true,
                createdBy: userInfo?.uuid,
                statuteSection: { tenantId },
                additionalDetails: {
                  witnessDetails: newWitnesses,
                  onBehalfOfName: complainantsList,
                  advocateIndividualId: individualId,
                  owner: cleanString(userInfo?.name),
                  formdata: {
                    submissionType: {
                      code: "APPLICATION",
                      name: "APPLICATION",
                    },
                    applicationType: {
                      name: "APPLICATION_TYPE_WITNESS_DEPOSITION",
                      type: "WITNESS_DEPOSITION",
                      isActive: true,
                    },
                  },
                },
                onBehalfOf: complainantsList?.map((item) => item?.uuid),
                comment: [],
                status: caseDetails?.status,

                workflow: {
                  action: SubmissionWorkflowAction.CREATE,
                },
              },
            },
            { tenantId }
          )
          .then((response) => {
            history.push(
              `/${window?.contextPath}/${isCitizen ? "citizen" : "employee"}/submissions/submissions-create?filingNumber=${
                caseDetails?.filingNumber
              }&applicationNumber=${response?.application?.applicationNumber}`
            );
          });
      }
      setShowConfirmModal(false);
      onAddSuccess();
    } catch (error) {
      console.error(error);
      setShowErrorToast({ label: t("ERROR_ADDING_WITNESS"), error: true });
    } finally {
      setIsWitnessAdding(false);
    }
  };

  const onFormValueChange = useCallback(
    (formData, index) => {
      // Ensure we have valid form data
      if (!isEqual(formData, witnessFormList?.[index]?.data)) {
        setWitnessFormList((prevData) => prevData?.map((item, i) => (i === index ? { ...item, data: formData } : item)));
      }
    },
    [witnessFormList]
  );

  return (
    <React.Fragment>
      <Modal
        className={"witness-details"}
        popupStyles={{
          width: "60%",
          minWidth: "600px",
          position: "absolute",
          height: "calc(100% - 100px)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          justify: "space-between",
        }}
        popupModuleMianStyles={{
          padding: 0,
          margin: "0px",
          height: "calc(100% - 65px)",
          overflowY: "auto",
        }}
        headerBarMain={<h1 className="heading-m">{t("ADD_WITNESS_DETAILS")}</h1>}
        headerBarEnd={<CloseBtn onClick={onCancel} />}
        actionSaveOnSubmit={handleReviewDetails}
        actionSaveLabel={t("REVIEW_WITNESS_DETAILS")}
        actionCancelLabel={t("WITNESS_CANCEL")}
        actionCancelOnSubmit={onCancel}
      >
        <div className="witness-details-form-style">
          {formConfigs.map((config, index) => (
            <React.Fragment key={index}>
              <div style={{ padding: "16px 28px", fontSize: "22px", fontWeight: "bold" }}>{`${t("WITNESS")} ${index + 1}`}</div>
              <FormComposerV2
                key={`witness-modal-${index}`}
                config={config}
                onFormValueChange={(setValue, formData, formState, reset, setError, clearErrors, trigger, getValues) => {
                  onFormValueChange(formData, index);
                  if (!setFormErrors.current.hasOwnProperty(index)) {
                    setFormErrors.current[index] = setError;
                  }
                }}
                fieldStyle={{ width: "100%" }}
              />
            </React.Fragment>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "0px 24px" }}>
          <Button
            onButtonClick={handleAddParty}
            label={t("ADD_PARTY")}
            style={{
              border: "none",
              boxShadow: "none",
              marginTop: "10px",
              borderColor: "#007E7E",
              width: "28%",
              backgroundColor: "#fff",
            }}
            textStyles={{
              fontFamily: "Roboto",
              fontSize: "16px",
              fontWeight: 700,
              lineHeight: "18.75px",
              textAlign: "start",
              color: "#007E7E",
            }}
          />
          <Button
            onButtonClick={handleRemoveParty}
            label={t("REMOVE_PARTY")}
            style={{
              border: "none",
              boxShadow: "none",
              marginTop: "10px",
              borderColor: "#007E7E",
              width: "28%",
              backgroundColor: "#fff",
            }}
            textStyles={{
              fontFamily: "Roboto",
              fontSize: "16px",
              fontWeight: 700,
              lineHeight: "18.75px",
              textAlign: "end",
              color: "#007E7E",
            }}
          />
        </div>
      </Modal>
      {showConfirmModal && (
        <Modal
          headerBarMain={<Heading label={t("CONFIRM_ADD_WITNESS")} />}
          headerBarEnd={<CloseBtn onClick={() => setShowConfirmModal(false)} />}
          actionCancelLabel={t("WITNESS_CONFIRM_CANCEL")}
          actionCancelOnSubmit={() => setShowConfirmModal(false)}
          actionSaveLabel={t("WITNESS_CONFIRM")}
          actionSaveOnSubmit={confirmAndSubmit}
          style={{ height: "40px", background: "#007E7E" }}
          popupStyles={{ width: "35%" }}
          className={"review-order-modal"}
          isDisabled={isWitnessAdding}
          isBackButtonDisabled={isWitnessAdding}
          children={
            isWitnessAdding ? (
              <Loader />
            ) : (
              <div className="delete-warning-text">
                <h3 style={{ margin: "12px 24px" }}>{t("CONFIRM_ADD_WITNESS_TEXT")}</h3>
              </div>
            )
          }
        />
      )}
      {showErrorToast && <Toast error={showErrorToast?.error} label={showErrorToast?.label} isDleteBtn={true} onClose={closeToast} />}
    </React.Fragment>
  );
};

export default AddWitnessModal;
