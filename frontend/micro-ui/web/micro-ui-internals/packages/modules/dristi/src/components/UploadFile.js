import React, { useEffect, useRef, useState, Fragment, useCallback } from "react";
import { Close, RemoveableTag } from "@egovernments/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";
import { UploadIcon } from "../icons/svgIndex";



const getCitizenStyles = (value) => {
  const emptyStyles = {
    buttonStyles: {},
    inputStyles: {},
    tagContainerStyles: {},
    tagStyles: {},
    textStyles: {},
  };

  if (value !== "OBPS") {
    return emptyStyles;
  }

  return {
    containerStyles: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "flex-start",
      alignItems: "center",
      flexWrap: "wrap",
      margin: "0px",
      padding: "0px",
    },
    tagContainerStyles: {
      margin: "0px",
      padding: "0px",
      maxWidth: "90%",
    },
    tagStyles: {
      padding: "8px",
      width: "100%",
      margin: "5px",
    },
    textStyles: {
      wordBreak: "break-word",
      height: "auto",
      lineHeight: "16px",
      overflow: "hidden",
      maxHeight: "28px",
      textOverflow: "ellipsis",
      paddingBottom: "10px",
      whiteSpace: "pre",
    },
    inputStyles: {
      width: "80%",
      height: "2rem !important",
      opacity: "0.2",
      marginLeft: "10px",
    },
    buttonStyles: {
      height: "auto",
      minHeight: "40px",
      width: "40%",
      maxHeight: "40px",
      marginTop: "-32px",
      padding: "1px 0px 0px 5px",
      display: "block",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "red",
    },
    closeIconStyles: {
      width: "20px",
      marginTop: "-5px",
    },
    uploadFile: {
      minHeight: "40px",
      maxHeight: "42px",
    },
  };
};

const UploadFile = (props) => {
  const Digit = globalThis?.Digit ?? {};
  const { t } = useTranslation();
  const inpRef = useRef();
  const [hasFile, setHasFile] = useState(false);
  const [prevSate, setprevSate] = useState(null);
  const user_type = Digit.SessionStorage?.get?.("userType");
  const extraStyles = getCitizenStyles("OBPS");

  const handleDelete = useCallback(() => {
    if (inpRef.current) {
      inpRef.current.value = "";
    }
    props.onDelete();
  }, [props.onDelete]);

  const handleChange = useCallback(() => {
    const file = inpRef.current?.files?.[0];
    if (file) {
      setHasFile(true);
      setprevSate(file);
    } else {
      setHasFile(false);
    }
  }, []);

  const handleReupload = () => {
    inpRef.current?.click?.();
  };

  const handleEmpty = useCallback(() => {
    if (inpRef.current?.files?.length <= 0 && prevSate !== null) {
      inpRef.current.value = "";
      props.onDelete();
    }
  }, [prevSate, props.onDelete]);

  useEffect(() => {
    if (props.uploadMessage && inpRef.current?.value) {
      handleDelete();
      setHasFile(false);
    }
  }, [props.uploadMessage, handleDelete]);

  useEffect(() => {
    handleEmpty();
  }, [handleEmpty]);

  useEffect(() => {
    handleChange();
  }, [props.message, handleChange]);

  const showHint = props?.showHint || false;

  return (
    <Fragment>
      {showHint && <p className="cell-text">{t(props?.hintText)}</p>}
      <div
        className="upload-file-div-main"
        style={{ display: "flex", maxWidth: "540px", gap: "2%", alignItems: "center", justifyContent: "space-between", ...props?.uploadDivStyle }}
      >
        <div className="upload-file-div-sub" style={{ minWidth: "73%" }}>
          <div
            className={`upload-file ${user_type === "employee" ? "" : "upload-file-max-width"} ${props.disabled ? " disabled" : ""}`}
            style={extraStyles?.uploadFile ? extraStyles?.uploadFile : {}}
          >
            <div style={extraStyles ? extraStyles?.containerStyles : null}>
              {props?.uploadedFiles?.map((file, index) => {
                const fileDetailsData = file[1];
                return (
                  <div
                    key={`tag-${index}-${file?.[0] ?? ""}`}
                    className="tag-container"
                    style={extraStyles ? extraStyles?.tagContainerStyles : null}
                  >
                    <RemoveableTag
                      extraStyles={extraStyles}
                      text={props?.displayName || file[0]}
                      onClick={(e) => props?.removeTargetedFile(fileDetailsData, e)}
                    />
                  </div>
                );
              })}
              {props?.uploadedFiles.length === 0 && <h2 className="file-upload-status">{props?.message}</h2>}
              {!hasFile || props.error ? (
                <h2 className="file-upload-status">{props.message}</h2>
              ) : (
                <div className="tag-container" style={extraStyles ? extraStyles?.tagContainerStyles : null}>
                  <div className="tag" style={extraStyles ? extraStyles?.tagStyles : null}>
                    <span className="text" style={extraStyles ? extraStyles?.textStyles : null}>
                      {inpRef.current?.files?.[0]?.name && !props?.file
                        ? inpRef.current.files[0].name
                        : props.file?.name}
                    </span>
                    <button
                      type="button"
                      aria-label={t("CS_COMMON_DELETE")}
                      onClick={() => handleDelete()}
                      style={{
                        ...(extraStyles ? extraStyles?.closeIconStyles : null),
                        background: "none",
                        border: "none",
                        padding: 0,
                        cursor: "pointer",
                      }}
                    >
                      <Close style={props.Multistyle} className="close" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div
          className="upload-file-upload-button-div"
          style={{ maxWidth: "25%", height: "40px", border: "solid 1px #007E7E", display: "flex", alignItems: "center", position: "relative" }}
        >
          <input
            type="file"
            accept={props.accept}
            onChange={(e) => props.onUpload(e)}
            onClick={(event) => {
              if (props?.disabled) {
                event.preventDefault();
                return;
              }
              const { target = {} } = event || {};
              target.value = "";
            }}
            ref={inpRef}
            style={{ opacity: 0, maxWidth: "100%", minHeight: "40px" }}
          />
          <button
            type="button"
            style={{
              minWidth: "100%",
              cursor: "pointer",
              alignItems: "center",
              display: "flex",
              justifyContent: "center",
              position: "absolute",
              background: "none",
              border: "none",
              padding: 0,
              height: "100%",
            }}
            onClick={handleReupload}
            aria-label={t("CS_COMMON_CHOOSE_FILE")}
          >
            <span
              style={{ color: "#007E7E", display: "flex", flexDirection: "row", justifyContent: "center", marginTop: "5px" }}
              className="upload-button-custimised"
            >
              <span style={{ marginRight: "4px" }}>
                <UploadIcon />
              </span>
              {t("CS_COMMON_CHOOSE_FILE")}
            </span>
          </button>
        </div>
      </div>
      {props.iserror && <p style={{ color: "red" }}>{props.iserror}</p>}
      {props?.showHintBelow && <p className="cell-text">{t(props?.hintText)}</p>}
    </Fragment>
  );
};

UploadFile.propTypes = {
  Multistyle: PropTypes.object,
  accept: PropTypes.string,
  disabled: PropTypes.bool,
  displayName: PropTypes.string,
  error: PropTypes.any,
  file: PropTypes.object,
  hintText: PropTypes.string,
  iserror: PropTypes.any,
  message: PropTypes.any,
  onDelete: PropTypes.func.isRequired,
  onUpload: PropTypes.func.isRequired,
  removeTargetedFile: PropTypes.func,
  showHint: PropTypes.bool,
  showHintBelow: PropTypes.bool,
  uploadedFiles: PropTypes.array,
  uploadDivStyle: PropTypes.object,
  uploadMessage: PropTypes.any,
};

export default UploadFile;
