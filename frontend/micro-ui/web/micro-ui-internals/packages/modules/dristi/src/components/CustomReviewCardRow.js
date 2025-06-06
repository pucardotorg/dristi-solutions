import { InfoCard } from "@egovernments/digit-ui-components";
import { EditPencilIcon } from "@egovernments/digit-ui-react-components";
import React, { useCallback, useMemo } from "react";
import { FlagIcon } from "../icons/svgIndex";
import DocViewerWrapper from "../pages/employee/docViewerWrapper";
import ReactTooltip from "react-tooltip";

const MemoDocViewerWrapper = React.memo(DocViewerWrapper);

const LocationIcon = () => (
  <svg width="10" height="14" viewBox="0 0 10 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M4.9987 0.0820312C2.4187 0.0820312 0.332031 2.1687 0.332031 4.7487C0.332031 8.2487 4.9987 13.4154 4.9987 13.4154C4.9987 13.4154 9.66537 8.2487 9.66537 4.7487C9.66537 2.1687 7.5787 0.0820312 4.9987 0.0820312ZM4.9987 6.41536C4.0787 6.41536 3.33203 5.6687 3.33203 4.7487C3.33203 3.8287 4.0787 3.08203 4.9987 3.08203C5.9187 3.08203 6.66536 3.8287 6.66536 4.7487C6.66536 5.6687 5.9187 6.41536 4.9987 6.41536Z"
      fill="#77787B"
    />
  </svg>
);
const LocationContent = ({ latitude = 17.2, longitude = 17.2 }) => {
  return (
    <div style={{ fontSize: "14px", display: "flex", marginTop: "-2px", alignItems: "center" }}>
      <div>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`}
          target="_blank"
          rel="noreferrer"
          style={{ color: "#77787B" }}
        >
          View on map
        </a>
      </div>
      <div style={{ marginLeft: "10px", display: "flex" }}>
        <LocationIcon></LocationIcon>
      </div>
    </div>
  );
};

const badgeStyle = {
  width: "fit-content",
  height: "fit-content",
  padding: "6px",
  borderRadius: "999px",
  backgroundColor: "#EDEEEF",
  fontFamily: "Roboto",
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "16.41px",
  textAlign: "center",
};

const convertToIndianCurrency = (amount, locale, currency) => {
  if (typeof amount !== "number" && typeof amount !== "string") return "";

  const number = Number(amount);
  if (isNaN(number)) return "";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(number)
    .toString();
};

const CustomReviewCardRow = ({
  isScrutiny,
  isJudge,
  data,
  handleOpenPopup,
  titleIndex,
  dataIndex,
  name,
  configKey,
  dataError,
  t,
  config,
  titleHeading,
  handleClickImage,
  prevDataError,
  isPrevScrutiny,
  setShowImageModal,
  isCaseReAssigned,
  disableScrutiny,
  isWarning,
}) => {
  const {
    type = null,
    label = null,
    value = null,
    prefix = "",
    style = {},
    badgeType = null,
    textDependentOn = null,
    textDependentValue = null,
    isLocalizationRequired = false,
    notAvailable = null,
    enableScrutinyField = false,
  } = config;
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const isCitizen = useMemo(() => Boolean(Digit?.UserService?.getUser()?.info?.type === "CITIZEN"), [Digit]);

  function getNestedValue(obj, path) {
    return path.split(".").reduce((acc, key) => acc?.[key], obj);
  }

  const extractValue = (data, key) => {
    if (!key?.includes(".")) {
      return data[key];
    }
    const keyParts = key.split(".");
    let value = data;
    keyParts.forEach((part) => {
      const match = part.match(/^(.+?)\[(\d+)\]$/);
      if (match) {
        const prop = match[1];
        const index = parseInt(match[2], 10);

        if (value && value.hasOwnProperty(prop) && Array.isArray(value[prop])) {
          value = value[prop][index];
        } else {
          value = undefined;
        }
      } else {
        if (value && value.hasOwnProperty(part)) {
          value = value[part];
        } else {
          value = undefined;
        }
      }
    });
    return value;
  };
  const handleImageClick = useCallback(
    (configKey, name, dataIndex, fieldName, data, inputlist, dataError) => {
      if (isScrutiny && data) {
        handleClickImage(null, configKey, name, dataIndex, fieldName, data, inputlist, dataError, disableScrutiny, enableScrutinyField);
      }
      return null;
    },
    [handleClickImage, isScrutiny]
  );
  const renderCard = useMemo(() => {
    let bgclassname = "";
    let showFlagIcon = isScrutiny && (!disableScrutiny || enableScrutinyField) ? true : false;
    if (isPrevScrutiny && (!disableScrutiny || enableScrutinyField)) {
      showFlagIcon = prevDataError ? true : false;
    }

    if (isCitizen) showFlagIcon = false;

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
        const inlineStyle = isWarning
          ? { backgroundColor: "#FDF2DE" } // Set the background color to yellow if checked
          : {};
        bgclassname = isWarning ? "" : bgclassname;
        return (
          <div className={`text-main ${bgclassname}`} style={inlineStyle}>
            <div className="text">
              {value === "dateOfDispatch" && <div> {`${dataIndex + 1}. `}</div>}
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
                  {dataError && isScrutiny && !isWarning ? (
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
            <div
              className={`title ${isScrutiny && (dataError ? "column" : "")}`}
              style={!isScrutiny ? { width: "100%", display: "flex", justifyContent: "space-between" } : {}}
            >
              <div className="label" style={!isScrutiny ? { width: "fit-content" } : {}}>
                {`${titleIndex}. ${titleHeading ? t("CS_CHEQUE_NO") + " " : prefix ? prefix + " " : ""}${title || t("")}`}
                {data?.partyInPerson && <div style={badgeStyle}>{t("PARTY_IN_PERSON_TEXT")}</div>}
              </div>
              {badgeType && (
                <div className="value" style={!isScrutiny ? { width: "fit-content" } : {}}>
                  {extractValue(data, badgeType)}
                </div>
              )}

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
      case "witnessTitle":
        const witnessTitleError = dataError?.witnessTitle?.FSOError;
        const witnessPrevTitleError = prevDataError?.witnessTitle?.FSOError;
        if (isPrevScrutiny && !witnessPrevTitleError && !disableScrutiny) {
          showFlagIcon = false;
        }
        let witnessTitle = "";
        if (Array.isArray(value)) {
          const extractedValues = value
            ?.map((key) => {
              const extractedValue = extractValue(data, key);
              return extractedValue ? { [key]: extractedValue } : null;
            })
            .filter((val) => val !== null);

          // Extract individual parts based on the keys
          const firstName = extractedValues.find((item) => item.firstName)?.firstName || "";
          const middleName = extractedValues.find((item) => item.middleName)?.middleName || "";
          const lastName = extractedValues.find((item) => item.lastName)?.lastName || "";
          const designation = extractedValues.find((item) => item.witnessDesignation)?.witnessDesignation || "";

          const parts = [firstName, middleName, lastName]?.filter(Boolean);
          witnessTitle = parts?.join(" ");

          if (designation) {
            witnessTitle += ` - ${designation}`;
          }
        } else {
          witnessTitle = extractValue(data, value);
        }
        bgclassname = isScrutiny && witnessTitleError ? (witnessTitleError === witnessPrevTitleError ? "preverror" : "error") : "";
        bgclassname = witnessTitleError && isCaseReAssigned ? "preverrorside" : bgclassname;
        return (
          <div className={`title-main ${bgclassname}`}>
            <div className={`title ${isScrutiny && (dataError ? "column" : "")}`}>
              <div style={{ display: "flex", flexDirection: "row", gap: "8px", alignItems: "center" }}>
                {`${titleIndex}. ${titleHeading ? t("CS_CHEQUE_NO") + " " : prefix ? prefix + " " : ""}${witnessTitle || t("")}`}
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
                  {witnessTitleError ? (
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
            {witnessTitleError && isScrutiny && (
              <div className="scrutiny-error input">
                {bgclassname === "preverror" ? (
                  <span style={{ color: "#4d83cf", fontWeight: 300 }}>{t("CS_PREVIOUS_ERROR")}</span>
                ) : (
                  <FlagIcon isError={true} />
                )}

                {witnessTitleError}
              </div>
            )}
          </div>
        );

      case "textTitle":
        const textTitle = dataError?.textTitle?.FSOError;
        const prevTextError = prevDataError?.textTitle?.FSOError;
        if (isPrevScrutiny && !prevTextError && !disableScrutiny) {
          showFlagIcon = false;
        }
        let textTitleValue;
        if (Array.isArray(value)) {
          textTitleValue = value.map((key) => extractValue(data, key)).join(" ");
        } else {
          textTitleValue = extractValue(data, value);
        }
        bgclassname = isScrutiny && textTitle ? (textTitle === prevTextError ? "preverror" : "error") : "";
        bgclassname = textTitle && isCaseReAssigned ? "preverrorside" : bgclassname;
        return (
          <div className={`text-main ${bgclassname}`}>
            <div className={`text ${isScrutiny && (dataError ? "column" : "")}`}>
              <div className="label">{t(label)}</div>
              <div className="value">{textTitleValue}</div>

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
                  {textTitle ? (
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
            {textTitle && isScrutiny && (
              <div className="scrutiny-error input">
                {bgclassname === "preverror" ? (
                  <span style={{ color: "#4d83cf", fontWeight: 300 }}>{t("CS_PREVIOUS_ERROR")}</span>
                ) : (
                  <FlagIcon isError={true} />
                )}

                {textTitle}
              </div>
            )}
          </div>
        );

      case "text":
        let textValue;
        if (Array.isArray(value)) {
          textValue = value.map((key) => extractValue(data, key)).join(" ");
        } else {
          textValue = extractValue(data, value);
        }
        const dependentOnValue = extractValue(data, textDependentOn);
        if ((showFlagIcon && dependentOnValue && t(textDependentValue)) || value === "delayCondonationType.name") {
          showFlagIcon = false;
        }
        return (
          <div className={`text-main ${bgclassname}`}>
            <div className="text">
              <div style={style} className="label">
                {t(label)}
              </div>
              <div className="value" style={{ overflowY: "auto", maxHeight: "310px" }}>
                {Array.isArray(textValue)
                  ? textValue.length > 0
                    ? textValue.map((text, index) => <div key={index}>{t(text) || t("")}</div>)
                    : t("")
                  : textValue && typeof textValue === "object"
                  ? textValue?.text || ""
                  : isLocalizationRequired
                  ? t(textValue)
                  : textValue || (dependentOnValue && t(textDependentValue)) || t(notAvailable) || t("")}
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
      case "formattedText":
        let formattedValue;
        if (Array.isArray(value)) {
          formattedValue = value.map((key) => extractValue(data, key)).join(" ");
        } else {
          formattedValue = extractValue(data, value);
        }
        const dependentValue = extractValue(data, textDependentOn);

        if ((showFlagIcon && dependentValue && t(textDependentValue)) || value === "delayCondonationType.name") {
          showFlagIcon = false;
        }

        return (
          <div className={`text-main ${bgclassname}`}>
            <div className="text">
              <div style={style} className="label">
                {t(label)}
              </div>
              <div
                className="value"
                style={{ overflowY: "auto", maxHeight: "310px" }}
                dangerouslySetInnerHTML={{
                  __html:
                    formattedValue && typeof formattedValue === "string"
                      ? formattedValue
                      : isLocalizationRequired
                      ? t(formattedValue)
                      : formattedValue || (dependentValue && t(textDependentValue)) || t(notAvailable) || t(""),
                }}
              ></div>
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
        amountValue = amountValue ? convertToIndianCurrency(amountValue, "en-IN", "INR") : t("");
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
        bgclassname =
          isScrutiny && FSOErrors?.length > 0 ? (JSON.stringify(dataError) === JSON.stringify(prevDataError) ? "preverror" : "error") : "";
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
              <div className={`value ${!isScrutiny ? "column" : ""}`} style={{ overflowX: "scroll", width: "100%", marginRight: "56px" }}>
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
                                <MemoDocViewerWrapper
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
                                  <MemoDocViewerWrapper
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
                          <MemoDocViewerWrapper
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
          address = addressDetails.map(({ addressDetails, geoLocationDetails }) => {
            return {
              address:
                typeof addressDetails === "string"
                  ? addressDetails
                  : `${addressDetails?.locality || ""}, ${addressDetails?.city || ""}, ${addressDetails?.district || ""}, ${
                      addressDetails?.state || ""
                    } - ${addressDetails?.pincode || ""}`,
              coordinates:
                geoLocationDetails?.latitude && geoLocationDetails?.longitude
                  ? { latitude: geoLocationDetails.latitude, longitude: geoLocationDetails.longitude }
                  : null,
              policeStation: geoLocationDetails?.policeStation?.name || null,
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
              coordinates:
                addressDetails?.geoLocationDetails?.latitude && addressDetails?.geoLocationDetails?.longitude
                  ? { latitude: addressDetails.geoLocationDetails.latitude, longitude: addressDetails.geoLocationDetails.longitude }
                  : null,
              policeStation: addressDetails?.geoLocationDetails?.policeStation?.name || null,
            },
          ];
        }

        return (
          <div className={`address-main ${bgclassname}`} style={{ borderBottom: "1px #e8e8e8 solid" }}>
            <div className="address" style={{ position: "relative" }}>
              <div className="address-container" style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%" }}>
                {address.map((item, index) => (
                  <div key={index} className="address-block">
                    <div
                      className="row"
                      style={{
                        display: "flex",
                        padding: "4px 0px",
                        justifyContent: "space-between",
                      }}
                    >
                      <div className="label">{t(label)}</div>
                      <div className="value">
                        <p style={{ marginBottom: "8px" }}>{item?.address}</p>
                        <LocationContent
                          latitude={item?.coordinates?.latitude || 31.6160638}
                          longitude={item?.coordinates?.longitude || 74.8978579}
                        />
                      </div>
                    </div>
                    {item?.policeStation && (
                      <div
                        className="row"
                        style={{
                          display: "flex",
                          padding: "4px 0px",
                          justifyContent: "space-between",
                        }}
                      >
                        <div className="label">{t("Police Station")}</div>
                        <div className="value">{item?.policeStation}</div>
                      </div>
                    )}
                  </div>
                ))}
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
    isLocalizationRequired,
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

  return renderCard;
};

export default CustomReviewCardRow;
