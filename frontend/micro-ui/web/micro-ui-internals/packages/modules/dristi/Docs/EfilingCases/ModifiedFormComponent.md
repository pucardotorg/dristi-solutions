# Code Documentation

This document explains the functionality, purpose, and usage of the provided code.

---

### `modifiedFormComponent`

#### Purpose:

- This is used to modify formconfig and add extra [`ScrutinyInfo`](./ScrutinyInfo.md) component wherever FSO has marked error, along with disabling it for the user

#### Code:

```javascript
let key = formComponent.key || formComponent.populators?.name;
if (formComponent.type === "component") {
  if (
    ["SelectCustomDragDrop", "SelectBulkInputs", "SelectCustomTextArea", "SelectUploadFiles", "SelectUserTypeComponent"].includes(
      formComponent.component
    )
  ) {
    key = formComponent.key + "." + formComponent.populators?.inputs?.[0]?.name;
  }
  if (formComponent.component === "VerifyPhoneNumber") {
    key = formComponent.key + "." + formComponent?.name;
  }
}
if (selected === "demandNoticeDetails" && formComponent.component === "SelectUserTypeComponent") {
  key = formComponent.key + "." + formComponent.populators?.inputs?.[0]?.name + "." + formComponent.populators?.inputs?.[0]?.optionsKey;
}
if (selected === "debtLiabilityDetails" && ["dropdown", "radio"].includes(formComponent.type)) {
  key = formComponent.key + "." + formComponent?.populators?.optionsKey;
}
if (selected === "delayApplications" && formComponent.component === "CustomRadioInfoComponent") {
  key = formComponent.key + "." + formComponent?.populators?.optionsKey;
}
if (selected === "complainantDetails" && formComponent.component === "CustomRadioInfoComponent") {
  key = formComponent.key + "." + formComponent?.populators?.optionsKey;
}
if (selected === "complainantDetails" && formComponent.component === "VerificationComponent") {
  key = "complainantVerification.individualDetails.document";
}
const modifiedFormComponent = cloneDeep(formComponent);
if (modifiedFormComponent?.labelChildren === "optional") {
  modifiedFormComponent.labelChildren = <span style={{ color: "#77787B" }}>&nbsp;{`${t("CS_IS_OPTIONAL")}`}</span>;
}
modifiedFormComponent.state = state;
if (modifiedFormComponent?.labelChildren === "OutlinedInfoIcon" && Object.keys(caseDetails?.additionalDetails?.scrutiny?.data || {}).length === 0) {
  modifiedFormComponent.labelChildren = (
    <React.Fragment>
      <span style={{ color: "#77787B", position: "relative" }} data-tip data-for={`${modifiedFormComponent.label}-tooltip`}>
        {" "}
        <OutlinedInfoIcon />
      </span>
      <ReactTooltip id={`${modifiedFormComponent.label}-tooltip`} place="bottom" content={modifiedFormComponent?.tooltipValue || ""}>
        {t(modifiedFormComponent?.tooltipValue || modifiedFormComponent.label)}
      </ReactTooltip>
    </React.Fragment>
  );
}

modifiedFormComponent.disable = scrutiny?.[selected]?.scrutinyMessage?.FSOError || (judgeObj && !isPendingReESign) ? false : true;

if (scrutiny?.[selected] && scrutiny?.[selected]?.form?.[index]) {
  if (formComponent.component == "SelectUploadFiles") {
    if (formComponent.key + "." + formComponent.populators?.inputs?.[0]?.name in scrutiny?.[selected]?.form?.[index]) {
      key = formComponent.key + "." + formComponent.populators?.inputs?.[0]?.name;
    }
    if (formComponent.key + "." + formComponent.populators?.inputs?.[1]?.name in scrutiny?.[selected]?.form?.[index]) {
      key = formComponent.key + "." + formComponent.populators?.inputs?.[1]?.name;
    }
  }
  if (
    selected === "debtLiabilityDetails" &&
    formComponent.component === "CustomInput" &&
    scrutiny?.[selected]?.form?.[index]?.["liabilityType.name"]?.FSOError
  ) {
    modifiedFormComponent.disable = false;
  }
  if (selected === "chequeDetails" && key === "policeStation") {
    key = key + "." + formComponent?.populators?.optionsKey;
  }
  if (key in scrutiny?.[selected]?.form?.[index] && scrutiny?.[selected]?.form?.[index]?.[key]?.FSOError) {
    if (key === "complainantVerification.individualDetails.document") {
      modifiedFormComponent.isScrutiny = true;
    }
    modifiedFormComponent.disable = false;
    modifiedFormComponent.withoutLabel = true;
    modifiedFormComponent.disableScrutinyHeader = true;
    return [
      {
        type: "component",
        component: "ScrutinyInfo",
        key: `${key}Scrutiny`,
        label: modifiedFormComponent.label,
        populators: {
          scrutinyMessage: scrutiny?.[selected].form[index][key].FSOError,
        },
      },
      modifiedFormComponent,
    ];
  }
}
return modifiedFormComponent;
```
