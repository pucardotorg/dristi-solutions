import { InfoCard } from "@egovernments/digit-ui-components";
import CustomCaseInfoDiv from "@egovernments/digit-ui-module-dristi/src/components/CustomCaseInfoDiv";
import { CardLabel, Dropdown, FormComposerV2, LabelFieldPair, MultiSelectDropdown, RadioButtons } from "@egovernments/digit-ui-react-components";
import React, { useEffect, useMemo, useRef } from "react";
import isEqual from "lodash/isEqual";
import { useTranslation } from "react-i18next";

const SelectParty = ({
  caseDetails,
  userType,
  partyInvolve,
  setPartyInvolve,
  setSelectedParty,
  setRoleOfNewAdvocate,
  parties,
  party,
  setParty,
  selectedParty,
  searchLitigantInRepresentives,
  advocateId,
  searchAdvocateInRepresentives,
  roleOfNewAdvocate,
  partyInPerson,
  setPartyInPerson,
  affidavit,
  setAffidavit,
  isReplaceAdvocate,
  setIsReplaceAdvocate,
  isLitigantJoined,
}) => {
  const { t } = useTranslation();

  const targetRef = useRef(null);

  const advocateVakalatnamaConfig = useMemo(
    () => [
      {
        body: [
          {
            type: "component",
            component: "SelectCustomDragDrop",
            key: "affidavitData",
            isMandatory: true,
            withoutLabel: true,
            populators: {
              inputs: [
                {
                  name: "document",
                  documentHeader: userType?.value === "Litigant" ? "AFFIDAVIT" : "NOC_JUDGE_ORDER",
                  type: "DragDropComponent",
                  uploadGuidelines: "UPLOAD_DOC_50",
                  maxFileSize: 50,
                  maxFileErrorMessage: "CS_FILE_LIMIT_50_MB",
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
    [userType]
  );

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

  const scrollToDiv = () => {
    if (targetRef.current) {
      targetRef.current.scrollTop = targetRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToDiv();
  }, [partyInvolve, party, partyInPerson]);

  return (
    <div ref={targetRef} className="select-user-join-case" style={{ width: "712px" }}>
      <CustomCaseInfoDiv t={t} data={caseInfo?.slice(0, 4)} column={4} />
      {userType?.value === "Litigant" && (
        <InfoCard
          variant={"default"}
          label={t("PLEASE_NOTE")}
          additionalElements={[<p>{t("ACKNOWLEDGE_RECEIPT_OF_SUMMONS")}</p>]}
          inline
          textStyle={{}}
          className={`custom-info-card`}
        />
      )}
      <LabelFieldPair className="case-label-field-pair">
        <CardLabel className="case-input-label">{`${t("JOINING_THIS_CASE_AS")}`}</CardLabel>
        <RadioButtons
          selectedOption={userType}
          disabled={true}
          optionsKey={"label"}
          options={[
            { label: t("ADVOCATE_OPT"), value: "Advocate" },
            { label: t("LITIGANT_OPT"), value: "Litigant" },
          ]}
        />
      </LabelFieldPair>
      <LabelFieldPair className="case-label-field-pair">
        <CardLabel className="case-input-label">{`${t("WHICH_PARTY_ARE_YOU")}`}</CardLabel>
        <RadioButtons
          selectedOption={partyInvolve}
          onSelect={(value) => {
            setPartyInvolve(value);
            setSelectedParty({});
            setRoleOfNewAdvocate("");
            setIsReplaceAdvocate({});
            setParty(userType?.value === "Litigant" ? {} : []);
            setAffidavit({});
          }}
          optionsKey={"label"}
          options={[
            { label: t("COMPLAINANTS_TEXT"), value: "COMPLAINANTS" },
            { label: t("RESPONDENTS_TEXT"), value: "RESPONDENTS" },
          ]}
          disabled={userType?.value === "Litigant"}
        />
      </LabelFieldPair>
      {userType?.value === "Advocate" && partyInvolve?.value && (
        <LabelFieldPair className="case-label-field-pair">
          <CardLabel className="case-input-label">{`${t("ARE_YOU_REPLACING_ADVOCATE")}`}</CardLabel>
          <RadioButtons
            selectedOption={isReplaceAdvocate}
            onSelect={(value) => {
              setIsReplaceAdvocate(value);
              setParty([]);
              setAffidavit({});
            }}
            optionsKey={"label"}
            options={[
              { label: t("YES"), value: "YES" },
              { label: t("NO"), value: "NO" },
            ]}
          />
        </LabelFieldPair>
      )}
      {((userType?.value === "Litigant" && partyInvolve?.value) || isReplaceAdvocate?.value) && (
        <LabelFieldPair className="case-label-field-pair">
          <CardLabel className="case-input-label">{`${t(
            userType?.value === "Litigant" ? "WHICH_LITIGANT" : "WHICH_LITIGANTS_REPRESENTING"
          )}`}</CardLabel>
          {userType?.value === "Litigant" ? (
            <Dropdown
              t={t}
              option={parties?.filter((filterParty) =>
                partyInvolve?.value === "COMPLAINANTS"
                  ? filterParty?.partyType?.includes("complainant")
                  : filterParty?.partyType?.includes("respondent")
              )}
              selected={party}
              optionKey={"fullName"}
              select={(e) => {
                setParty(e);
                setPartyInPerson({});
              }}
              freeze={true}
              topbarOptionsClassName={"top-bar-option"}
              disable={isLitigantJoined}
            />
          ) : (
            isReplaceAdvocate?.value && (
              <MultiSelectDropdown
                options={parties?.filter((filterParty) =>
                  partyInvolve?.value === "COMPLAINANTS"
                    ? filterParty?.partyType?.includes("complainant")
                    : filterParty?.partyType?.includes("respondent")
                )}
                selected={party}
                optionsKey={"fullName"}
                onSelect={(value) => {
                  setParty(value?.map((val) => val[1]));
                }}
                defaultUnit={"Others"}

                // placeholder={"lkjdlfjsdlkfj + 2 Others"}
                // selected={[]}
              />
            )
          )}
        </LabelFieldPair>
      )}
      {userType?.value === "Litigant" && party?.label && (
        <LabelFieldPair className="case-label-field-pair">
          <CardLabel className="case-input-label">{`${t("ARE_YOU_JOINING_AS_PARTY_IN_PERSON")}`}</CardLabel>
          <RadioButtons
            selectedOption={partyInPerson}
            onSelect={(value) => {
              setPartyInPerson(value);
              if (value?.value === "NO") setAffidavit({});
            }}
            optionsKey={"label"}
            options={[
              { label: t("YES"), value: "YES" },
              { label: t("NO"), value: "NO" },
            ]}
          />
        </LabelFieldPair>
      )}
      {partyInPerson?.value === "YES" && (
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
      {(partyInPerson?.value === "YES" || isReplaceAdvocate?.value === "YES") && (
        <FormComposerV2
          key={2}
          config={advocateVakalatnamaConfig}
          onFormValueChange={(setValue, formData, formState, reset, setError, clearErrors, trigger, getValues) => {
            if (!isEqual(formData, affidavit)) {
              setAffidavit(formData);
            }
          }}
          defaultValues={affidavit}
          className={`party-in-person-affidavit-upload`}
          noBreakLine
        />
      )}
      {selectedParty?.label &&
        (() => {
          const { isFound, representative } = searchLitigantInRepresentives(caseDetails);
          if (isFound && representative.advocateId === advocateId) return true;
          else return false;
        })() &&
        userType?.value === "Advocate" && (
          <React.Fragment>
            <hr className="horizontal-line" />
            <InfoCard
              variant={"default"}
              label={t("ES_COMMON_INFO")}
              additionalElements={[
                <p>
                  {t("ALREADY_REPRESENTING")} <span style={{ fontWeight: "bold" }}>{selectedParty?.label}</span>{" "}
                </p>,
              ]}
              inline
              textStyle={{}}
              className={`custom-info-card`}
            />
          </React.Fragment>
        )}
      {selectedParty?.label &&
        (() => {
          const { isFound, representative } = searchLitigantInRepresentives(caseDetails);
          const { isFound: advIsFound, partyType } = searchAdvocateInRepresentives(advocateId);
          if (isFound && representative.advocateId !== advocateId && ((advIsFound && selectedParty?.partyType?.includes(partyType)) || !advIsFound))
            return true;
          else return false;
        })() &&
        userType?.value === "Advocate" && (
          <React.Fragment>
            <hr className="horizontal-line" />
            <InfoCard
              variant={"warning"}
              label={t("WARNING")}
              additionalElements={[
                <p>
                  {t("FOR_THE_SELECTED")} <span style={{ fontWeight: "bold" }}>{selectedParty?.label}</span> {t("ALREADY_AN_ADVOCATE")}
                </p>,
              ]}
              inline
              textStyle={{}}
              className={`custom-info-card warning`}
            />

            <LabelFieldPair className="case-label-field-pair">
              <CardLabel className="case-input-label">{`${t("PLEASE_CHOOSE_PROCEED")}`}</CardLabel>
              <RadioButtons
                selectedOption={roleOfNewAdvocate}
                onSelect={(value) => {
                  setRoleOfNewAdvocate(value);
                }}
                optionsKey={"label"}
                options={[
                  { label: t("PRIMARY_ADVOCATE"), value: "PRIMARY_ADVOCATE" },
                  { label: t("SUPPORTING_ADVOCATE"), value: "SUPPORTING_ADVOCATE" },
                ]}
              />
            </LabelFieldPair>
          </React.Fragment>
        )}
      {selectedParty?.label &&
        (() => {
          const { isFound } = searchLitigantInRepresentives(caseDetails);
          const { isFound: advIsFound, partyType } = searchAdvocateInRepresentives(advocateId);
          if (
            (isFound && advIsFound && !selectedParty?.partyType?.includes(partyType)) ||
            (!isFound && advIsFound && !selectedParty?.partyType?.includes(partyType))
          )
            return true;
          else return false;
        })() &&
        userType?.value === "Advocate" && (
          <React.Fragment>
            <hr className="horizontal-line" />
            <InfoCard
              variant={"warning"}
              label={t("WARNING")}
              additionalElements={[
                <p>
                  {t("ALREADY_REPRESENTING")} {selectedParty?.isComplainant ? "respondent" : "complainant"}
                  {t("CANT_REPRESENT_BOTH_PARTY")}
                </p>,
              ]}
              inline
              textStyle={{}}
              className={`custom-info-card warning`}
            />
          </React.Fragment>
        )}
      {selectedParty?.label && userType?.value === "Litigant" && selectedParty?.individualId && (
        <React.Fragment>
          <hr className="horizontal-line" />
          <InfoCard
            variant={"warning"}
            label={t("WARNING")}
            additionalElements={[
              <p>
                {t("ABOVE_SELECTED_PARTY")} <span style={{ fontWeight: "bold" }}>{`${selectedParty?.label}`}</span> {t("ALREADY_JOINED_CASE")}
              </p>,
            ]}
            inline
            textStyle={{}}
            className={`custom-info-card warning`}
          />
        </React.Fragment>
      )}
    </div>
  );
};

export default SelectParty;
