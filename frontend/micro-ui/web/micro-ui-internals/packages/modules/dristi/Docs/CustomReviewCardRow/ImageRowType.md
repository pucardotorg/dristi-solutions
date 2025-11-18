# Code Documentation

This document explains the functionality, purpose, and usage of the provided code.

---

### `image`

#### Purpose:

- This row type is used to represent different documents or images uploaded. Based on the input and value, we extract respective filestore Ids and render it through DocViewerWrapper
- We can collectively mark all the documents as error when clicked on the flag icon.
- If we need to mark only specific document, it can be done using full screen mode.
- Every document has option to open the document in fullscreen mode using [`handleImageClick`](./HandleImageClick.md) function
- if no images or documents are present, null component will be returned

#### Code:

```javascript
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
```
