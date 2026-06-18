# Code Documentation

This document explains the functionality, purpose, and usage of the provided code.

---

### `title`

#### Purpose:

This is row to render when we want to display addresses in custom row

- First exact the list of addresses
- then we simply loop through it and render it

```json
{
  "type": "title",
  "value": ["firstName", "lastName"],
  "badgeType": "complainantType.name"
}
```

#### Code:

```javascript
const addressDetails = extractValue(data, value);
let address = [""];
if (Array.isArray(addressDetails)) {
  address = addressDetails.map(({ addressDetails }) => {
    return {
      address:
        typeof addressDetails === "string"
          ? addressDetails
          : `${addressDetails?.locality || ""}, ${addressDetails?.city || ""}, ${addressDetails?.district || ""}, ${addressDetails?.state || ""} - ${
              addressDetails?.pincode || ""
            }`,
      coordinates: addressDetails?.coordinates,
    };
  });
} else {
  address = [
    {
      address:
        typeof addressDetails === "string"
          ? addressDetails
          : `${addressDetails?.locality || ""}, ${addressDetails?.city || ""}, ${addressDetails?.district || ""}, ${addressDetails?.state || ""} - ${
              addressDetails?.pincode || ""
            }`,
      coordinates: addressDetails?.coordinates,
    },
  ];
}

return (
  <div className={`address-main ${bgclassname}`} style={{ borderBottom: "1px #e8e8e8 solid" }}>
    <div className="address">
      <div className="label">{t(label)}</div>
      <div className={`value ${!isScrutiny ? "column" : ""}`}>
        {address.map((item) => {
          return (
            <p>
              {item?.address}{" "}
              <LocationContent latitude={item?.coordinates?.latitude || 31.6160638} longitude={item?.coordinates?.longitude || 74.8978579} />
            </p>
          );
        })}
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
    {dataError && isScrutiny && (
      <div className="scrutiny-error input">
        {bgclassname === "preverror" ? (
          <span style={{ color: "#4d83cf", fontWeight: 300 }}>{t("CS_PREVIOUS_ERROR")}</span>
        ) : (
          <FlagIcon isError={true} />
        )}
        {dataError}
      </div>
    )}
  </div>
);
```
