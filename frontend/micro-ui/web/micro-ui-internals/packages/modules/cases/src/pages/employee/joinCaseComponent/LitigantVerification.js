import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormComposerV2 } from "@egovernments/digit-ui-react-components";
import { VerifyMultipartyLitigantConfig, VerifyPoaClaiming } from "../../../configs/VerifyMultipartyLitigantconfig";
import ButtonSelector from "@egovernments/digit-ui-module-dristi/src/components/ButtonSelector";
import { ForwardArrow, BackwardArrow } from "@egovernments/digit-ui-module-dristi/src/icons/svgIndex";

const fieldStyle = { marginRight: 0, width: "100%" };

const LitigantVerification = ({
  t,
  party,
  setParty,
  goBack,
  onProceed,
  alreadyJoinedMobileNumber,
  setAlreadyJoinedMobileNumber,
  isDisabled,
  setIsDisabled,
  selectPartyData,
  isApiCalled,
  poa,
  userInfo,
}) => {
  const modalRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [litigants, setLitigants] = useState([]);

  useEffect(() => {
    if (party?.length > 0) {
      if (selectPartyData?.advocateToReplaceList?.length > 0 && selectPartyData?.isReplaceAdvocate?.value === "YES") {
        const uniqueIndividuals = new Set(selectPartyData?.advocateToReplaceList?.map((item) => item.litigantIndividualId));
        const filteredParty = party.filter((p) => uniqueIndividuals.has(p.individualId));
        setLitigants(filteredParty);
      } else {
        setLitigants(party);
      }
    }
  }, [party, selectPartyData?.advocateToReplaceList, selectPartyData?.isReplaceAdvocate?.value, selectPartyData?.partyInvolve?.value]);

  const modifiedFormConfig = useMemo(() => {
    const applyUiChanges = (config) => ({
      ...config,
      head: litigants?.some((litigant) => litigant?.isComplainant) ? t("COMPLAINANT_BASIC_DETAILS") : t("ACCUSED_BASIC_DETAILS"),
      body: config?.body
        ?.filter((body) => (litigants?.[index]?.isVakalatnamaNew?.code === "NO" ? !["noOfAdvocates", "vakalatnama"].includes(body?.key) : true))
        ?.map((body) => {
          let tempBody = {
            ...body,
          };
          if (body?.labelChildren === "optional") {
            tempBody = {
              ...tempBody,
              labelChildren: <span style={{ color: "#77787B" }}>&nbsp;{`${t("CS_IS_OPTIONAL")}`}</span>,
            };
          }
          if (litigants?.[index]?.phoneNumberVerification?.isUserVerified && config?.body?.[3]?.disableConfigFields?.includes(body?.key)) {
            tempBody = {
              ...tempBody,
              disable: true,
            };
          }
          return tempBody;
        }),
    });

    const applyUiChangesPoa = (config) => ({
      ...config,
      head: litigants?.some((litigant) => litigant?.isComplainant) ? t("COMPLAINANT_BASIC_DETAILS") : t("ACCUSED_BASIC_DETAILS"),
      body: config?.body
        ?.filter((body) =>
          litigants?.[index]?.isPoaAvailable?.code === "YES" && litigants?.[index]?.uuid === userInfo?.uuid
            ? true
            : !["poaCustomInfo"].includes(body?.key)
        )
        ?.map((body) => {
          let tempBody = {
            ...body,
          };
          if (body?.labelChildren === "optional") {
            tempBody = {
              ...tempBody,
              labelChildren: <span style={{ color: "#77787B" }}>&nbsp;{`${t("CS_IS_OPTIONAL")}`}</span>,
            };
          }

          if (litigants?.[index]?.phoneNumberVerification?.isUserVerified) {
            if (config?.body?.[3]?.disableConfigFields?.includes(body?.key)) {
              tempBody = {
                ...tempBody,
                disable: true,
              };
            }
          }
          return tempBody;
        }),
    });

    return !poa
      ? VerifyMultipartyLitigantConfig?.map((config) => applyUiChanges(config))
      : VerifyPoaClaiming?.map((config) => applyUiChangesPoa(config));
  }, [poa, litigants, t, index]);

  useEffect(() => {
    if (
      litigants?.[index]?.phoneNumberVerification?.isUserVerified &&
      !alreadyJoinedMobileNumber?.some((mobileNumber) => litigants?.[index]?.phoneNumberVerification?.mobileNumber === mobileNumber)
    ) {
      setAlreadyJoinedMobileNumber((alreadyJoinedMobileNumber) => [
        ...alreadyJoinedMobileNumber,
        litigants?.[index]?.phoneNumberVerification?.mobileNumber,
      ]);
    }
  }, [litigants, index, alreadyJoinedMobileNumber, setAlreadyJoinedMobileNumber]);

  const areFilesEqual = (existingFile, newFile) => {
    if (!existingFile && !newFile) return true;

    if (!existingFile || !newFile) return false;

    return existingFile.name === newFile.name && existingFile.size === newFile.size && existingFile.lastModified === newFile.lastModified;
  };

  const shouldUpdateState = (selectedParty, formData) => {
    const commonFields = ["firstName", "middleName", "lastName"];

    const hasBasicInfoChanged = commonFields?.some((field) => selectedParty[field] !== formData[field]);

    const hasPhoneNumberChanged =
      selectedParty?.phoneNumberVerification?.mobileNumber !== formData?.phoneNumberVerification?.mobileNumber ||
      selectedParty?.phoneNumberVerification?.otpNumber !== formData?.phoneNumberVerification?.otpNumber ||
      selectedParty?.phoneNumberVerification?.isUserVerified !== formData?.phoneNumberVerification?.isUserVerified;

    const hasDocumentChanged =
      !(selectedParty?.vakalatnama === null && formData?.vakalatnama === null) &&
      !areFilesEqual(selectedParty?.vakalatnama?.document?.[0], formData?.vakalatnama?.document?.[0]);
    const isDocumentNull = formData?.vakalatnama === null && selectedParty?.vakalatnama !== null;

    const hasIsVakalatnamaNewChanged = selectedParty?.isVakalatnamaNew?.code !== formData?.isVakalatnamaNew?.code;

    const hasNumberOfVakalatnamaChanged = selectedParty?.isVakalatnamaNew?.code === "YES" && selectedParty?.noOfAdvocates !== formData?.noOfAdvocates;

    return (
      hasBasicInfoChanged ||
      hasPhoneNumberChanged ||
      hasDocumentChanged ||
      isDocumentNull ||
      hasIsVakalatnamaNewChanged ||
      hasNumberOfVakalatnamaChanged
    );
  };

  const areFileArraysEqual = (arr1 = [], arr2 = []) => {
    if (arr1.length !== arr2.length) return false;

    return arr1?.every((file1) => arr2?.some((file2) => areFilesEqual(file1, file2)));
  };

  const shouldUpdateStatePOA = (selectedParty, formData) => {
    const commonFields = ["firstName", "middleName", "lastName"];

    const hasBasicInfoChanged = commonFields.some((field) => selectedParty[field] !== formData[field]);

    const hasPhoneNumberChanged =
      selectedParty?.phoneNumberVerification?.mobileNumber !== formData?.phoneNumberVerification?.mobileNumber ||
      selectedParty?.phoneNumberVerification?.otpNumber !== formData?.phoneNumberVerification?.otpNumber ||
      selectedParty?.phoneNumberVerification?.isUserVerified !== formData?.phoneNumberVerification?.isUserVerified;

    const selectedDocs = selectedParty?.poaAuthorizationDocument?.poaDocument || [];
    const formDocs = formData?.poaAuthorizationDocument?.poaDocument || [];

    const hasDocumentChanged = !areFileArraysEqual(selectedDocs, formDocs);

    const isDocumentNull = formData?.poaAuthorizationDocument === null && selectedParty?.poaAuthorizationDocument !== null;

    return hasBasicInfoChanged || hasPhoneNumberChanged || hasDocumentChanged || isDocumentNull;
  };

  useEffect(() => {
    const isValidWithoutPOA = litigants?.every((litigant) => {
      const isNewVakalatnama = litigant?.isVakalatnamaNew?.code === "YES";
      const hasRequiredVakalatnamaDocs = litigant?.noOfAdvocates > 0 && litigant?.vakalatnama?.document?.length > 0;

      return (
        litigant?.phoneNumberVerification?.isUserVerified === true &&
        (isNewVakalatnama ? hasRequiredVakalatnamaDocs : litigant?.isVakalatnamaNew?.code === "NO")
      );
    });

    const isValidWithPOA = litigants?.every(
      (litigant) => litigant?.phoneNumberVerification?.isUserVerified === true && litigant?.poaAuthorizationDocument?.poaDocument?.length > 0
    );

    const shouldDisable = !poa ? !isValidWithoutPOA : !isValidWithPOA;

    setIsDisabled(shouldDisable);
  }, [litigants, poa, setIsDisabled]);

  const handleScrollToTop = () => {
    if (modalRef.current) {
      modalRef.current.scrollTop = 0;
    }
  };

  const onFormValueChange = (setValue, formData, formState, reset, setError, clearErrors) => {
    if (formData?.firstName || formData?.middleName || formData?.lastName) {
      const formDataCopy = structuredClone(formData);
      for (const key in formDataCopy) {
        if (["firstName", "middleName", "lastName"].includes(key) && Object.hasOwnProperty.call(formDataCopy, key)) {
          const oldValue = formDataCopy[key];
          let value = oldValue;
          if (typeof value === "string") {
            if (value.length > 100) {
              value = value.slice(0, 100);
            }

            let updatedValue = value
              .replace(/[^a-zA-Z\s]/g, "")
              .trimStart()
              .replace(/ +/g, " ");
            if (updatedValue !== oldValue) {
              const element = document.querySelector(`[name="${key}"]`);
              const start = element?.selectionStart;
              const end = element?.selectionEnd;
              setValue(key, updatedValue);
              setTimeout(() => {
                element?.setSelectionRange(start, end);
              }, 0);
            }
          }
        } else if (key === "noOfAdvocates") {
          const value = formDataCopy[key];
          if (typeof value === "string") {
            const numValue = value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 3);
            if (numValue !== value) {
              const element = document.querySelector(`[name="${key}"]`);
              const start = element?.selectionStart;
              const end = element?.selectionEnd;
              setValue(key, !isNaN(numValue) && numValue > 0 ? numValue.toString() : "");
              setTimeout(() => {
                element?.setSelectionRange(start, end);
              }, 0);
            }
          }
        }
      }
    }
    if (!poa && shouldUpdateState(litigants[index], formData)) {
      setLitigants(
        litigants?.map((item, i) => {
          return i === index
            ? {
                ...item,
                ...formData,
                ...(formData?.isVakalatnamaNew?.code === "NO" && { noOfAdvocates: "", vakalatnama: null }),
              }
            : item;
        })
      );
    } else if (poa && shouldUpdateStatePOA(litigants[index], formData)) {
      setLitigants(
        litigants?.map((item, i) => {
          return i === index
            ? {
                ...item,
                ...formData,
              }
            : item;
        })
      );
    }
    if (
      alreadyJoinedMobileNumber?.some((mobileNumber) => formData?.phoneNumberVerification?.mobileNumber === mobileNumber) &&
      !Object.keys(formState?.errors).includes("phoneNumberVerification") &&
      !formData?.phoneNumberVerification?.isUserVerified
    ) {
      setError("phoneNumberVerification", { mobileNumber: "MOBILE_NUMBER_ALREADY_REGISTERED_FOR_THIS_CASE", isDuplicateNumber: true });
    } else if (
      !alreadyJoinedMobileNumber?.some((mobileNumber) => formData?.phoneNumberVerification?.mobileNumber === mobileNumber) &&
      Object.keys(formState?.errors).includes("phoneNumberVerification")
    ) {
      clearErrors("phoneNumberVerification");
    }
    if (formData?.firstName && Object.keys(formState?.errors).includes("firstName")) {
      clearErrors("firstName");
    }
  };

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter") {
        onProceed(litigants);
      }
    },
    [onProceed, litigants]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <React.Fragment>
      <div ref={modalRef} className="litigant-verification">
        {litigants?.length > 0 && (
          <FormComposerV2
            key={index}
            config={modifiedFormConfig}
            onFormValueChange={(setValue, formData, formState, reset, setError, clearErrors) =>
              onFormValueChange(setValue, formData, formState, reset, setError, clearErrors)
            }
            defaultValues={{
              ...litigants?.[index],
              ...(!poa && {
                isVakalatnamaNew: {
                  code: litigants?.[index]?.isVakalatnamaNew?.code || "YES",
                  name: litigants?.[index]?.isVakalatnamaNew?.name || "YES",
                },
              }),
            }}
            fieldStyle={fieldStyle}
            className={"multi-litigant-composer"}
          />
        )}
      </div>
      <div className={"multi-litigant-composer-footer"}>
        <div className={"multi-litigant-composer-footer-left"}>
          <ButtonSelector
            ButtonBody={<BackwardArrow />}
            onSubmit={() => {
              setIndex(Math.max(0, index - 1));
              handleScrollToTop();
            }}
            isDisabled={index === 0}
            className={"arrow-button"}
          />
          <ButtonSelector
            ButtonBody={<ForwardArrow />}
            onSubmit={() => {
              setIndex(Math.min(litigants?.length - 1, index + 1));
              handleScrollToTop();
            }}
            isDisabled={index === litigants?.length - 1}
            className={"arrow-button"}
          />
        </div>
        <div className={"multi-litigant-composer-footer-right"}>
          <ButtonSelector theme={"border"} textStyles={{ margin: 0 }} label={t("JOIN_CASE_BACK_TEXT")} onSubmit={goBack} />
          <ButtonSelector
            textStyles={{ margin: 0 }}
            label={t("PROCEED_TEXT")}
            onSubmit={() => {
              setParty(litigants);
              onProceed(litigants);
            }}
            isDisabled={isDisabled || isApiCalled}
          />
        </div>
      </div>
    </React.Fragment>
  );
};

export default LitigantVerification;
