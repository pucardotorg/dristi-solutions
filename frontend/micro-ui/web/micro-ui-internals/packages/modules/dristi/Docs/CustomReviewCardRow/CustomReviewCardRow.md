# Code Documentation

This document explains the functionality, purpose, and usage of the provided code.

---

### `CustomReviewCardRow`

#### Purpose:

This component provides different kinds of row and is configurable. Each row has label, respective value and flag/edit/blank icon, based on the schenario.

Following are some of the types of these rows

- `date` - to render date in `DD-MM-YYYY` format
- `title` - When the row is being used as title - for example Cheque number in Cheque details section, name in complainant or respondent section etc.
- `text` - This is the most basic and default one, label and respective value next to it
- `infoBox` - When we want to show info box in the middle of the rows without showing any flag on it, this row type is being used - currently used in cheque details section
- `amount` - This one is used when we want to show cheque amount along with rupee symbol
- `phonenumber` - This is used when we want to have comma seperated phone numbers with country code `+91` next to it
- `address` - Used specifically for address, when address comes as a json object and we need to formulate address string using it. Comma seperated if multiple addresses are provided
- `image` - This row type is used when we want to display documents (one or multiple). It uses `DocViewerWrapper` component to display files after passing filtstoreId into it

#### Code:

```javascript
const renderCard = useMemo(() => {
  let bgclassname = "";
  let showFlagIcon = isScrutiny && (!disableScrutiny || enableScrutinyField) ? true : false;
  if (isPrevScrutiny && (!disableScrutiny || enableScrutinyField)) {
    showFlagIcon = prevDataError ? true : false;
  }
  if (isScrutiny) {
    if (typeof prevDataError === "string" && (dataError || prevDataError)) {
      bgclassname = dataError === prevDataError ? "preverror" : "error";
    } else {
      bgclassname = dataError ? "error" : "";
    }
  }
  bgclassname = dataError && isCaseReAssigned ? "preverrorside" : bgclassname;
  switch (type) {
    case "date":
      const dateValue = extractValue(data, value);
      const formattedDate = dateValue
        ? (() => {
            const [year, month, day] = dateValue.split("-");
            return `${day}-${month}-${year}`;
          })()
        : t(notAvailable || "DATE_NOT_AVAILABLE");

      const dateDependentOnValue = extractValue(data, textDependentOn);
      if (showFlagIcon && dateDependentOnValue && t(textDependentValue)) {
        showFlagIcon = false;
      }
      return (
        <div className={`text-main ${bgclassname}`}>
          <div className="text">
            <div className="label">{t(label)}</div>
            <div className="value">{formattedDate}</div>
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
    case "title":
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
    case "text":
      const textValue = extractValue(data, value);
      const dependentOnValue = extractValue(data, textDependentOn);
      if (showFlagIcon && dependentOnValue && t(textDependentValue)) {
        showFlagIcon = false;
      }
      return (
        <div className={`text-main ${bgclassname}`}>
          <div className="text">
            <div className="label">{t(label)}</div>
            <div className="value" style={{ overflowY: "auto", maxHeight: "310px" }}>
              {Array.isArray(textValue)
                ? textValue.length > 0
                  ? textValue.map((text, index) => <div key={index}>{t(text) || t("")}</div>)
                  : t("")
                : textValue && typeof textValue === "object"
                ? t(textValue?.text) || ""
                : t(textValue) || (dependentOnValue && t(textDependentValue)) || t(notAvailable) || t("")}
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

    case "infoBox":
      if (!data?.[value]?.header) {
        return null;
      }
      return (
        <div className={`text-main`}>
          <div className="value info-box">
            <InfoCard
              variant={"default"}
              label={t(isScrutiny || isJudge ? data?.[value]?.scrutinyHeader || data?.[value]?.header : data?.[value]?.header)}
              additionalElements={[
                <React.Fragment>
                  {Array.isArray(data?.[value]?.data) && (
                    <ul style={{ listStyleType: "disc", margin: "4px" }}>
                      {data?.[value]?.data.map((data) => (
                        <li>{t(data)}</li>
                      ))}
                    </ul>
                  )}
                </React.Fragment>,
              ]}
              inline
              text={typeof data?.[value]?.data === "string" && data?.[value]?.data}
              textStyle={{}}
              className={`adhaar-verification-info-card`}
            />
          </div>
        </div>
      );

    case "amount":
      let amountValue = extractValue(data, value);
      amountValue = amountValue ? `₹${amountValue}` : t("");
      return (
        <div className={`amount-main ${bgclassname}`}>
          <div className="amount">
            <div className="label">{t(label)}</div>
            <div className="value"> {amountValue} </div>
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
    case "phonenumber":
      const numbers = extractValue(data, value);
      return (
        <div className={`phone-number-main ${bgclassname}`}>
          <div className="phone-number">
            <div className="label">{t(label)}</div>
            <div className="value">
              {Array.isArray(numbers)
                ? numbers.length > 0
                  ? numbers.map((number, index) => <div key={index}>{`+91-${number}`}</div>)
                  : t("")
                : numbers
                ? `+91-${numbers}`
                : t("")}
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
    case "image":
      let FSOErrors = [];
      let systemErrors = [];
      let valuesAvailable = [];
      if (typeof dataError === "object") {
        value?.forEach((val) => {
          if (dataError?.[val]?.FSOError) {
            FSOErrors.push(dataError?.[val]);
          }
        });
      }
      if (typeof dataError === "object" && FSOErrors?.length === 0 && !isPrevScrutiny) {
        value?.forEach((val) => {
          if (getNestedValue(dataError, val)) {
            systemErrors.push(getNestedValue(dataError, val));
          }
        });
      }
      bgclassname = isScrutiny && FSOErrors?.length > 0 ? (JSON.stringify(dataError) === JSON.stringify(prevDataError) ? "preverror" : "error") : "";
      bgclassname =
        FSOErrors?.length > 0 && isCaseReAssigned ? "preverrorside" : isScrutiny && systemErrors?.length > 0 ? "system-error-class" : bgclassname;
      if (isPrevScrutiny && (!disableScrutiny || enableScrutinyField)) {
        showFlagIcon = prevDataError?.[type]?.FSOError;
      }
      value?.forEach((val) => {
        const getFile = extractValue(data, val);
        if (getFile && getFile?.length > 0) {
          valuesAvailable.push(val);
        }
      });
      const files = value?.map((value) => extractValue(data, value)) || [];
      let hasImages = false;
      files.forEach((file) => {
        if (file && file?.length > 0) {
          hasImages = true;
        }
      });
      if (!hasImages) {
        return null;
      }
      return (
        <div className={`image-main ${bgclassname}`}>
          <div className={`image ${!isScrutiny ? "column" : ""}`}>
            <div className="label">{t(label)}</div>
            <div className={`value ${!isScrutiny ? "column" : ""}`} style={{ overflowX: "scroll", width: "100%" }}>
              {Array.isArray(files)
                ? files?.map((file, fileIndex) =>
                    file && Array.isArray(file) ? (
                      file?.map((data, index) => {
                        if (data?.fileStore) {
                          return (
                            <div
                              style={{ cursor: "pointer" }}
                              onClick={() => {
                                handleImageClick(configKey, name, dataIndex, value[fileIndex], data, [value[fileIndex]], dataError);
                                if (!isScrutiny)
                                  setShowImageModal({
                                    openModal: true,
                                    imageInfo: {
                                      configKey,
                                      name,
                                      index: dataIndex,
                                      fieldName: value[fileIndex],
                                      data,
                                      inputlist: [value[fileIndex]],
                                    },
                                  });
                              }}
                            >
                              <DocViewerWrapper
                                key={`${file.fileStore}-${index}`}
                                fileStoreId={data?.fileStore}
                                displayFilename={data?.fileName}
                                tenantId={tenantId}
                                docWidth="250px"
                                showDownloadOption={false}
                                documentName={data?.fileName || data?.additionalDetails?.fileName}
                                preview
                              />
                            </div>
                          );
                        } else if (data?.document) {
                          return data?.document?.map((data, index) => {
                            return (
                              <div
                                style={{ cursor: "pointer" }}
                                onClick={() => {
                                  handleImageClick(configKey, name, dataIndex, value[fileIndex], data, [value[fileIndex]], dataError);
                                  if (!isScrutiny)
                                    setShowImageModal({
                                      openModal: true,
                                      imageInfo: {
                                        configKey,
                                        name,
                                        index: dataIndex,
                                        fieldName: value[fileIndex],
                                        data,
                                        inputlist: [value[fileIndex]],
                                      },
                                    });
                                }}
                              >
                                <DocViewerWrapper
                                  key={`${file.fileStore}-${index}`}
                                  fileStoreId={data?.fileStore}
                                  displayFilename={data?.fileName}
                                  tenantId={tenantId}
                                  docWidth="250px"
                                  showDownloadOption={false}
                                  documentName={data?.fileName}
                                  preview
                                />
                              </div>
                            );
                          });
                        } else {
                          return null;
                        }
                      })
                    ) : file ? (
                      <div
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          handleImageClick(configKey, name, dataIndex, value[fileIndex], data, [value[fileIndex]], dataError);
                        }}
                      >
                        <DocViewerWrapper
                          key={`${value}-${file?.name}`}
                          fileStoreId={file?.fileStore}
                          displayFilename={file?.fileName}
                          tenantId={tenantId}
                          docWidth="250px"
                          showDownloadOption={false}
                          documentName={data?.fileName}
                          preview
                        />
                      </div>
                    ) : null
                  )
                : null}
            </div>
            {showFlagIcon && (
              <div
                className="flag"
                onClick={(e) => {
                  handleOpenPopup(e, configKey, name, dataIndex, Array.isArray(value) ? type : value, [...valuesAvailable, type]);
                }}
                key={dataIndex}
              >
                {isScrutiny &&
                  (FSOErrors?.length > 0 ? (
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
                  ))}
              </div>
            )}
          </div>
          {FSOErrors?.length > 0 &&
            isScrutiny &&
            FSOErrors.map((error, ind) => {
              return (
                <div className="scrutiny-error input" key={ind}>
                  {bgclassname === "preverror" ? (
                    <span style={{ color: "#4d83cf", fontWeight: 300 }}>{t("CS_PREVIOUS_ERROR")}</span>
                  ) : (
                    <FlagIcon isError={true} />
                  )}
                  {`${error.fileName ? t(error.fileName) + " : " : ""}${error.FSOError}`}
                </div>
              );
            })}
          {!(FSOErrors?.length > 0) &&
            systemErrors?.length > 0 &&
            isScrutiny &&
            systemErrors.map((error, ind) => {
              return (
                <div
                  style={{
                    width: "fit-content",
                  }}
                  className="scrutiny-error input"
                  key={ind}
                >
                  {bgclassname === "preverror" ? (
                    <span style={{ color: "#4d83cf", fontWeight: 300 }}>{t("CS_PREVIOUS_ERROR")}</span>
                  ) : (
                    <h4
                      style={{
                        margin: "0px",
                        fontFamily: "Roboto",
                        fontSize: "14px",
                        fontWeight: 500,
                        lineHeight: "20px",
                        textAlign: "left",
                        color: "#9E400A",
                      }}
                    >
                      Potential Error:
                    </h4>
                  )}
                  {`${error.fileName ? t(error.fileName) + " : " : ""}${error.systemError}`}
                </div>
              );
            })}
        </div>
      );
    case "address":
      const addressDetails = extractValue(data, value);
      let address = [""];
      if (Array.isArray(addressDetails)) {
        address = addressDetails.map(({ addressDetails }) => {
          return {
            address:
              typeof addressDetails === "string"
                ? addressDetails
                : `${addressDetails?.locality || ""}, ${addressDetails?.city || ""}, ${addressDetails?.district || ""}, ${
                    addressDetails?.state || ""
                  } - ${addressDetails?.pincode || ""}`,
            coordinates: addressDetails?.coordinates,
          };
        });
      } else {
        address = [
          {
            address:
              typeof addressDetails === "string"
                ? addressDetails
                : `${addressDetails?.locality || ""}, ${addressDetails?.city || ""}, ${addressDetails?.district || ""}, ${
                    addressDetails?.state || ""
                  } - ${addressDetails?.pincode || ""}`,
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
    default:
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
  }
}, [
  isScrutiny,
  disableScrutiny,
  isPrevScrutiny,
  dataError,
  isCaseReAssigned,
  type,
  prevDataError,
  value,
  titleIndex,
  titleHeading,
  t,
  badgeType,
  data,
  dataIndex,
  textDependentOn,
  label,
  textDependentValue,
  notAvailable,
  enableScrutinyField,
  isJudge,
  handleOpenPopup,
  configKey,
  name,
  tenantId,
  handleImageClick,
  setShowImageModal,
]);
```
