# Code Documentation

This document explains the functionality, purpose, and usage of the provided code.

---

### `text`

#### Purpose:

This is row to render label and text

- showFlagIcon: True only when user logged in is FSO and either if it's the first round of scutiny, or that textfields was marked as error in previos round
- EditPencilIcon - This icon will appear if there is already marked error on that row
- dataError - shows marked error on that particular input, it can have either blue or red background color, based on whether it was a previously marked error or newly marked error

#### Code:

```javascript
const defaulValue = extractValue(data, value);
return (
  <div>
    <div className="text">
      <div className="label">{t(label)}</div>
      <div className="value">
        {Array.isArray(defaulValue) && defaulValue.map((text) => <div> {text || t("")} </div>)}
        {(!Array.isArray(defaulValue) && defaulValue) || t("")}
      </div>
      {showFlagIcon && (
        <div
          className="flag"
          onClick={(e) => {
            handleOpenPopup(e, configKey, name, dataIndex, value);
          }}
          key={dataIndex}
        >
          {dataError && isScrutiny ? (
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
    <div className="scrutiny-error input">
      {bgclassname === "preverror" ? (
        <span style={{ color: "#4d83cf", fontWeight: 300 }}>{t("CS_PREVIOUS_ERROR")}</span>
      ) : (
        <FlagIcon isError={true} />
      )}
      {dataError}
    </div>
  </div>
);
```
