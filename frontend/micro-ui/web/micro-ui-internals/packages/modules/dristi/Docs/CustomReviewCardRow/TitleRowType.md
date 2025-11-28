# Code Documentation

This document explains the functionality, purpose, and usage of the provided code.

---

### `title`

#### Purpose:

This is row to render when it's the first or title row of the entire section

- cheque number in cheque details, name in complainant details are some of the examples
- when value is an array, it extract all the respective values and joins it
- in the below case, it extracts firstName and lastName and joins it to display as title

```json
{
  "type": "title",
  "value": ["firstName", "lastName"],
  "badgeType": "complainantType.name"
}
```

#### Code:

```javascript
const titleError = dataError?.title?.FSOError;
const prevTitleError = prevDataError?.title?.FSOError;
if (isPrevScrutiny && !prevTitleError && !disableScrutiny) {
  showFlagIcon = false;
}
let title = "";
if (Array.isArray(value)) {
  title = value.map((key) => extractValue(data, key)).join(" ");
} else {
  title = extractValue(data, value);
}
bgclassname = isScrutiny && titleError ? (titleError === prevTitleError ? "preverror" : "error") : "";
bgclassname = titleError && isCaseReAssigned ? "preverrorside" : bgclassname;
return (
  <div className={`title-main ${bgclassname}`}>
    <div className={`title ${isScrutiny && (dataError ? "column" : "")}`}>
      <div style={{ display: "flex", flexDirection: "row", gap: "8px", alignItems: "center" }}>
        {`${titleIndex}. ${titleHeading ? t("CS_CHEQUE_NO") + " " : ""}${title || t("")}`}
        {data?.partyInPerson && <div style={badgeStyle}>{t("PARTY_IN_PERSON_TEXT")}</div>}
      </div>
      {badgeType && <div>{extractValue(data, badgeType)}</div>}

      {showFlagIcon && (
        <div
          className="flag"
          onClick={(e) => {
            handleOpenPopup(
              e,
              configKey,
              name,
              dataIndex,
              Array.isArray(value) ? type : value,
              Array.isArray(value) ? [...value, type] : [value, type]
            );
          }}
          key={dataIndex}
        >
          {/* {badgeType && <div>{extractValue(data, badgeType)}</div>} */}
          {titleError ? (
            <React.Fragment>
              <span style={{ color: "#77787B", position: "relative" }} data-tip data-for={`Click`}>
                {" "}
                <EditPencilIcon />
              </span>
              <ReactTooltip id={`Click`} place="bottom" content={t("CS_CLICK_TO_EDIT") || ""}>
                {t("CS_CLICK_TO_EDIT")}
              </ReactTooltip>
            </React.Fragment>
          ) : (
            <FlagIcon />
          )}
        </div>
      )}
    </div>
    {titleError && isScrutiny && (
      <div className="scrutiny-error input">
        {bgclassname === "preverror" ? (
          <span style={{ color: "#4d83cf", fontWeight: 300 }}>{t("CS_PREVIOUS_ERROR")}</span>
        ) : (
          <FlagIcon isError={true} />
        )}

        {titleError}
      </div>
    )}
  </div>
);
```
