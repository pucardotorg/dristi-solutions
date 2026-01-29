import { InfoCard } from "@egovernments/digit-ui-components";
import CustomCaseInfoDiv from "@egovernments/digit-ui-module-dristi/src/components/CustomCaseInfoDiv";
import { CardLabel, Dropdown, FormComposerV2, LabelFieldPair, RadioButtons } from "@egovernments/digit-ui-react-components";
import React, { useEffect, useMemo, useRef } from "react";
import isEqual from "lodash/isEqual";
import { useTranslation } from "react-i18next";
import CustomTextArea from "@egovernments/digit-ui-module-dristi/src/components/CustomTextArea";

const SelectParty = ({
  selectPartyData,
  setSelectPartyData,
  caseDetails,
  parties,
  party,
  setParty,
  partyInPerson,
  setPartyInPerson,
  isLitigantJoined,
  isAdvocateJoined,
  searchLitigantInRepresentives,
  advocateId,
}) => {
  const { t } = useTranslation();
  const userInfo = JSON.parse(window.localStorage.getItem("user-info"));

  const MultiSelectDropdown = window?.Digit?.ComponentRegistryService?.getComponent("MultiSelectDropdown");

  const targetRef = useRef(null);

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

  const pipAccusedIds = useMemo(() => {
    return new Set(pipAccuseds?.map((p) => p.individualId));
  }, [pipAccuseds]);

  const advocateVakalatnamaConfig = useMemo(
    () => [
      {
        body: [
          {
            type: "component",
            component: "SelectCustomDragDrop",
            key: "affidavitData",
            isMandatory: selectPartyData?.userType?.value === "Litigant" ? true : false,
            withoutLabel: true,
            populators: {
              inputs: [
                {
                  name: "document",
                  documentHeader: selectPartyData?.userType?.value === "Litigant" ? "AFFIDAVIT" : "SUPPORING_DOCUMENT_OPTIONAL",
                  type: "DragDropComponent",
                  uploadGuidelines: "UPLOAD_DOC_10",
                  maxFileSize: 10,
                  maxFileErrorMessage: "CS_FILE_LIMIT_10_MB",
                  fileTypes: ["JPG", "PDF", "PNG", "JPEG"],
                  isMultipleUpload: false,
                  documentHeaderStyle: {
                    margin: "0px",
                  },
                },
              ],
            },
          },
        ],
      },
    ],
    [selectPartyData?.userType]
  );

  const advocateToReplaceList = useMemo(() => {
    if (selectPartyData?.userType?.value === "Litigant") return [];
    if (selectPartyData?.userType?.value === "Advocate" && (!party?.length || party?.length === 0)) return [];
    const partyWithAdvocate = (Array.isArray(party) ? party : [])?.flatMap((party) => {
      const { representatives } = searchLitigantInRepresentives(caseDetails?.representatives, party?.individualId);
      if (representatives?.length > 0) {
        return representatives?.map((representative) => ({
          ...party,
          representative,
          litigantIndividualId: party?.individualId,
          advocateId: representative?.advocateId,
          label: `${representative?.additionalDetails?.advocateName} (${party?.fullName})`,
        }));
      } else {
        return [
          {
            ...party,
            representative: null,
            litigantIndividualId: party?.individualId,
            advocateId: null,
            label: `${party?.fullName} (${t("PARTY_IN_PERSON_TEXT")})`,
          },
        ];
      }
    });
    return partyWithAdvocate?.filter((party) =>
      selectPartyData?.partyInvolve?.value === "RESPONDENTS"
        ? (pipAccusedIds.has(party?.individualId) && !party?.advocateId) || party?.advocateId
        : true
    );
  }, [selectPartyData?.userType, party, caseDetails, searchLitigantInRepresentives, t, selectPartyData?.partyInvolve?.value]);

  const caseInfo = useMemo(() => {
    if (caseDetails?.caseCategory) {
      return [
        {
          key: "CS_CASE_NAME",
          value: caseDetails?.caseTitle,
        },
        {
          key: "CS_CASE_ID",
          value: caseDetails?.cnrNumber,
        },
        {
          key: "CS_FILING_NUMBER",
          value: caseDetails?.filingNumber,
        },
        {
          key: "CASE_NUMBER",
          value: caseDetails?.cmpNumber,
        },
        {
          key: "CASE_CATEGORY",
          value: caseDetails?.caseCategory,
        },
      ];
    }
    return [];
  }, [caseDetails]);

  const customLabel = useMemo(() => {
    if (selectPartyData?.userType?.value !== "Advocate" && selectPartyData?.isPoaRightsClaiming?.value === "NO") return "";

    const partyCount = party?.length || 0;

    if (partyCount === 1) return party[0]?.fullName;
    if (partyCount > 1) return `${party[0]?.fullName} + ${partyCount - 1} ${t("CS_OTHERS")}`;

    return "";
  }, [t, party, selectPartyData?.userType]);

  const customLabelAdvocate = useMemo(() => {
    if (selectPartyData?.userType?.value !== "Advocate") return "";

    const partyCount = selectPartyData?.advocateToReplaceList?.length || 0;

    if (partyCount === 1) return selectPartyData?.advocateToReplaceList[0]?.label;
    if (partyCount > 1) return `${selectPartyData?.advocateToReplaceList[0]?.label} + ${partyCount - 1} ${t("CS_OTHERS")}`;

    return "";
  }, [selectPartyData?.userType?.value, selectPartyData?.advocateToReplaceList, t]);

  const scrollToDiv = () => {
    if (targetRef.current) {
      targetRef.current.scrollTop = targetRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToDiv();
  }, [selectPartyData?.partyInvolve, party, partyInPerson]);

  const getDisableParty = (party) => {
    if (party?.advocateRepresentingLength > 0) {
      if (party?.isPoaAvailable?.code === "NO" && party?.uuid === userInfo?.uuid) {
        return true;
      } else if (party?.isPoaAvailable?.code === "YES" && party?.poaVerification?.individualDetails?.userUuid === userInfo?.uuid) {
        return true;
      } else {
        return false;
      }
    } else {
      return true;
    }
  };

  return (
    <div ref={targetRef} className="select-user-join-case" style={{ width: "712px" }}>
      <CustomCaseInfoDiv t={t} data={caseInfo?.slice(0, 4)} column={4} />

      <InfoCard
        variant={"default"}
        label={t("PLEASE_NOTE")}
        additionalElements={[<p>{t("ACKNOWLEDGE_RECEIPT_OF_SUMMONS")}</p>]}
        inline
        textStyle={{}}
        className={`custom-info-card`}
      />

      <LabelFieldPair className="case-label-field-pair">
        <CardLabel className="case-input-label">{`${t("JOINING_THIS_CASE_AS")}`}</CardLabel>
        <RadioButtons
          selectedOption={selectPartyData?.userType}
          disabled={true}
          optionsKey={"label"}
          options={[
            { label: t("ADVOCATE_OPT"), value: "Advocate" },
            { label: t("LITIGANT_OPT"), value: "Litigant" },
          ]}
          additionalWrapperClass={"radio-disabled"}
        />
      </LabelFieldPair>
      <LabelFieldPair className="case-label-field-pair">
        <CardLabel className="case-input-label">{`${t(
          selectPartyData?.userType?.value === "Litigant" ? "ARE_YOU_COMPLAINANT_OR_ACCUSED" : "WHICH_PARTY_ARE_YOU"
        )}`}</CardLabel>
        <RadioButtons
          selectedOption={selectPartyData?.partyInvolve}
          onSelect={(value) => {
            setSelectPartyData((selectPartyData) => ({
              ...selectPartyData,
              partyInvolve: value,
              isReplaceAdvocate: {},
              affidavit: {},
              advocateToReplaceList: [],
              approver: { label: "", value: "" },
              reasonForReplacement: "",
              isPoaRightsClaiming: { label: "", value: "" },
            }));
            setPartyInPerson({});
            setParty(selectPartyData?.userType?.value === "Litigant" ? {} : []);
          }}
          optionsKey={"label"}
          options={[
            { label: t("COMPLAINANTS_TEXT"), value: "COMPLAINANTS" },
            { label: t("RESPONDENTS_TEXT"), value: "RESPONDENTS" },
          ]}
          disabled={isAdvocateJoined || isLitigantJoined}
          additionalWrapperClass={(isAdvocateJoined || isLitigantJoined) && "radio-disabled"}
        />
      </LabelFieldPair>

      {selectPartyData?.userType?.value === "Litigant" && selectPartyData?.partyInvolve?.value && (
        <LabelFieldPair className="case-label-field-pair">
          <CardLabel className="case-input-label">{`${t("ARE_YOU_CLAIMING_REVOKING_POA_HOLDER_RIGHTS")}`}</CardLabel>
          <RadioButtons
            selectedOption={selectPartyData?.isPoaRightsClaiming}
            onSelect={(value) => {
              setSelectPartyData((selectPartyData) => ({
                ...selectPartyData,
                isPoaRightsClaiming: value,
                isReplaceAdvocate: {},
                affidavit: {},
                advocateToReplaceList: [],
                approver: { label: "", value: "" },
                reasonForReplacement: "",
              }));
              setPartyInPerson({});
              if (isLitigantJoined || isAdvocateJoined) {
                setParty(selectPartyData?.userType?.value === "Litigant" && value?.value === "NO" ? party || {} : []);
              } else {
                setParty(selectPartyData?.userType?.value === "Litigant" && value?.value === "NO" ? {} : []);
              }
            }}
            optionsKey={"label"}
            options={[
              { label: t("YES"), value: "YES" },
              { label: t("NO"), value: "NO" },
            ]}
            disabled={false}
            additionalWrapperClass={(isAdvocateJoined || isLitigantJoined) && "radio-disabled"}
          />
        </LabelFieldPair>
      )}

      {selectPartyData?.userType?.value === "Advocate" && selectPartyData?.partyInvolve?.value && (
        <LabelFieldPair className="case-label-field-pair">
          <CardLabel className="case-input-label">{`${t("ARE_YOU_REPLACING_ADVOCATE")}`}</CardLabel>
          <RadioButtons
            selectedOption={selectPartyData?.isReplaceAdvocate}
            onSelect={(value) => {
              setSelectPartyData((selectPartyData) => ({
                ...selectPartyData,
                isReplaceAdvocate: value,
                affidavit: {},
                advocateToReplaceList: [],
                approver: { label: "", value: "" },
                reasonForReplacement: "",
              }));
              setParty([]);
            }}
            optionsKey={"label"}
            options={[
              { label: t("YES"), value: "YES" },
              { label: t("NO"), value: "NO" },
            ]}
          />
        </LabelFieldPair>
      )}
      {((selectPartyData?.userType?.value === "Litigant" && selectPartyData?.partyInvolve?.value && selectPartyData?.isPoaRightsClaiming?.value) ||
        selectPartyData?.isReplaceAdvocate?.value) && (
        <LabelFieldPair className="case-label-field-pair">
          <CardLabel className="case-input-label">{`${t(
            selectPartyData?.userType?.value === "Litigant" ? "WHICH_LITIGANT" : "WHICH_LITIGANTS_REPRESENTING"
          )}`}</CardLabel>
          {selectPartyData?.userType?.value === "Litigant" ? (
            selectPartyData?.isPoaRightsClaiming?.value === "NO" ? (
              <Dropdown
                t={t}
                option={parties?.filter((filterParty) =>
                  selectPartyData?.partyInvolve?.value === "COMPLAINANTS"
                    ? filterParty?.partyType?.includes("complainant")
                    : filterParty?.partyType?.includes("respondent")
                )}
                selected={party}
                optionKey={"fullName"}
                select={(e) => {
                  setParty(e);
                  setPartyInPerson({});
                  setSelectPartyData((selectPartyData) => ({
                    ...selectPartyData,
                    advocateToReplaceList: [],
                    approver: { label: "", value: "" },
                    reasonForReplacement: "",
                    affidavit: {},
                  }));
                }}
                freeze={true}
                topbarOptionsClassName={"top-bar-option"}
                disable={isLitigantJoined}
                style={{
                  marginBottom: "1px",
                }}
              />
            ) : selectPartyData?.isPoaRightsClaiming?.value === "YES" ? (
              <MultiSelectDropdown
                options={parties
                  ?.filter((filterParty) =>
                    selectPartyData?.partyInvolve?.value === "COMPLAINANTS"
                      ? filterParty?.partyType?.includes("complainant")
                      : filterParty?.partyType?.includes("respondent")
                  )
                  ?.map((party) => ({
                    ...party,
                    isDisabled: getDisableParty(party),
                  }))}
                selected={party}
                optionsKey={"fullName"}
                onSelect={(value) => {
                  setParty(value?.map((val) => val[1]));
                  setSelectPartyData((selectPartyData) => ({
                    ...selectPartyData,
                    advocateToReplaceList: [],
                    approver: { label: "", value: "" },
                    reasonForReplacement: "",
                    affidavit: {},
                  }));
                }}
                customLabel={customLabel}
                config={{
                  isSelectAll: true,
                }}
                parentRef={targetRef}
              />
            ) : null
          ) : (
            selectPartyData?.isReplaceAdvocate?.value && (
              <MultiSelectDropdown
                options={parties
                  ?.filter((party) => {
                    if (selectPartyData?.partyInvolve?.value === "COMPLAINANTS") {
                      return party?.partyType?.includes("complainant");
                    } else {
                      const isRespondent = party?.partyType?.includes("respondent");
                      const shouldExcludePip = selectPartyData?.isReplaceAdvocate?.value !== "YES" && pipAccusedIds.has(party?.individualId);
                      return isRespondent && !shouldExcludePip;
                    }
                  })
                  ?.map((party) => ({
                    ...party,
                    isDisabled: party?.isAdvocateRepresenting,
                  }))}
                selected={party}
                optionsKey={"fullName"}
                onSelect={(value) => {
                  setParty(value?.map((val) => val[1]));
                  setSelectPartyData((selectPartyData) => ({
                    ...selectPartyData,
                    advocateToReplaceList: [],
                    approver: { label: "", value: "" },
                    reasonForReplacement: "",
                    affidavit: {},
                  }));
                }}
                customLabel={customLabel}
                config={{
                  isSelectAll: true,
                }}
                parentRef={targetRef}
              />
            )
          )}
        </LabelFieldPair>
      )}
      {selectPartyData?.userType?.value === "Litigant" && party?.label && selectPartyData?.isPoaRightsClaiming?.value === "NO" && (
        <LabelFieldPair className="case-label-field-pair">
          <CardLabel className="case-input-label">{`${t("ARE_YOU_JOINING_AS_PARTY_IN_PERSON")}`}</CardLabel>
          <RadioButtons
            selectedOption={partyInPerson}
            onSelect={(value) => {
              setPartyInPerson(value);
              if (value?.value === "NO") setSelectPartyData((selectPartyData) => ({ ...selectPartyData, affidavit: {} }));
            }}
            optionsKey={"label"}
            options={[
              { label: t("YES"), value: "YES" },
              { label: t("NO"), value: "NO" },
            ]}
          />
        </LabelFieldPair>
      )}
      {partyInPerson?.value === "YES" && party?.uuid === userInfo?.uuid && (
        <React.Fragment>
          <InfoCard
            variant={"default"}
            label={t("PLEASE_NOTE")}
            additionalElements={[
              <p>
                {t("AFFIDAVIT_STATING_PARTY_IN_PERSON")} <span style={{ fontWeight: "bold" }}>{`(${t("PARTY_IN_PERSON_TEXT")})`}</span>{" "}
              </p>,
            ]}
            inline
            textStyle={{}}
            className={`custom-info-card`}
          />
        </React.Fragment>
      )}
      {((partyInPerson?.value === "YES" && party?.uuid === userInfo?.uuid) ||
        (partyInPerson?.value === "YES" && !party?.uuid) ||
        (selectPartyData?.isReplaceAdvocate?.value === "YES" && party?.length > 0)) && (
        <React.Fragment key={3}>
          {selectPartyData?.isReplaceAdvocate?.value === "YES" && party?.length > 0 && (
            <React.Fragment>
              {advocateToReplaceList?.length > 0 && (
                <LabelFieldPair className="case-label-field-pair">
                  <CardLabel className="case-input-label">{`${t("WHICH_ADVOCATES_ARE_YOU_REPLACING")}`}</CardLabel>
                  <MultiSelectDropdown
                    options={advocateToReplaceList?.map((advocate) => ({
                      ...advocate,
                      isDisabled: advocate?.advocateId === advocateId,
                    }))}
                    selected={selectPartyData?.advocateToReplaceList}
                    optionsKey={"label"}
                    onSelect={(value) => {
                      setSelectPartyData((selectPartyData) => ({
                        ...selectPartyData,
                        advocateToReplaceList: value?.map((val) => val[1]),
                        reasonForReplacement: "",
                        approver: { label: "", value: "" },
                        affidavit: {},
                      }));
                    }}
                    customLabel={customLabelAdvocate}
                    config={{
                      isSelectAll: true,
                    }}
                    parentRef={targetRef}
                  />
                </LabelFieldPair>
              )}

              {(selectPartyData?.advocateToReplaceList?.length > 0 || advocateToReplaceList?.length === 0) && (
                <React.Fragment>
                  <LabelFieldPair className="case-label-field-pair">
                    <CardLabel className="case-input-label">{`${t("SELECT_APPROVER")}`}</CardLabel>
                    <RadioButtons
                      selectedOption={selectPartyData?.approver}
                      onSelect={(value) => {
                        setSelectPartyData((selectPartyData) => ({
                          ...selectPartyData,
                          approver: value,
                        }));
                      }}
                      optionsKey={"label"}
                      options={[
                        { label: t("JUDGE"), value: "JUDGE" },
                        { label: t("EXISTING_ADVOCATES"), value: "EXISTING_ADVOCATES" },
                      ]}
                    />
                  </LabelFieldPair>

                  <LabelFieldPair className="case-label-field-pair reason-for-replacement-text-area">
                    <CustomTextArea
                      userType={selectPartyData?.userType?.value}
                      name="reasonForReplacement"
                      value={selectPartyData?.reasonForReplacement}
                      onTextChange={(value) => {
                        setSelectPartyData((selectPartyData) => ({
                          ...selectPartyData,
                          reasonForReplacement: value,
                        }));
                      }}
                      id="reasonForReplacement"
                      info={t("REASON_FOR_REPLACEMENT")}
                      placeholder={t("TYPE_HERE_PLACEHOLDER")}
                    />
                  </LabelFieldPair>
                </React.Fragment>
              )}
            </React.Fragment>
          )}
          {((selectPartyData?.userType?.value === "Litigant" && partyInPerson?.value === "YES") ||
            (selectPartyData?.userType?.value === "Advocate" &&
              selectPartyData?.isReplaceAdvocate?.value === "YES" &&
              party?.length > 0 &&
              (selectPartyData?.advocateToReplaceList?.length > 0 || advocateToReplaceList?.length === 0))) && (
            <FormComposerV2
              key={2}
              config={advocateVakalatnamaConfig}
              onFormValueChange={(setValue, formData) => {
                if (!isEqual(formData, selectPartyData?.affidavit)) {
                  setSelectPartyData((selectPartyData) => ({
                    ...selectPartyData,
                    affidavit: formData,
                  }));
                }
              }}
              defaultValues={selectPartyData?.affidavit}
              className={`party-in-person-affidavit-upload`}
              noBreakLine
            />
          )}
        </React.Fragment>
      )}

      {selectPartyData?.userType?.value === "Litigant" &&
        party?.individualId &&
        ((partyInPerson?.value === "NO" && party?.individualId) || (partyInPerson?.value === "YES" && party?.uuid !== userInfo?.uuid)) && (
          <InfoCard
            variant={"warning"}
            label={t("WARNING")}
            additionalElements={[
              <p>
                {t("ABOVE_SELECTED_PARTY")} <span style={{ fontWeight: "bold" }}>{`${party?.label}`}</span> {t("ALREADY_JOINED_CASE")}
              </p>,
            ]}
            inline
            textStyle={{}}
            className={`custom-info-card warning`}
          />
        )}
    </div>
  );
};

export default SelectParty;
