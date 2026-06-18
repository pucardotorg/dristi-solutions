# Code Documentation

This document explains the functionality, purpose, and usage of the provided code.

---

### `SelectReviewAccordion`

#### Purpose:

SelectReviewAccordion is a custom component which has multiple sections. It's an accordian with collapse ability

- sectionError represents the error marked on that particular section
- prevSectionError represents the previously marked error on that particular section
- based on these values, we're evaluating class name, like whether to show red background, or blue background or blank background etc
- dataErrors representes all the errors for that particular card (like cheque details, advocate details, respondant details etc)
- prevdataErrors representes all the previous errors for that particular card (like cheque details, advocate details, respondant details etc)
- [`CustomReviewCard`] is the individual card per section (like cheque details, advocate details, respondant details etc)
- [`CustomPopUp`] is the popup which comes up to enter error or given input field or section
- [`ImageModal`] is the full screen document view and openes up when clicking on particular image/document

#### Code:

```javascript
<div className="accordion-wrapper" onClick={() => {}}>
  <div className={`accordion-title ${isOpen ? "open" : ""}`} onClick={() => setOpen(!isOpen)}>
    <span>
      {config?.number}. {t(config?.label)}
    </span>
    <span className="reverse-arrow">
      <CustomArrowDownIcon />
    </span>
  </div>
  <div className={`accordion-item ${!isOpen ? "collapsed" : ""}`}>
    <div className="accordion-content">
      {inputs.map((input, index) => {
        showFlagIcon = isScrutiny && !input?.disableScrutiny ? true : false;
        const sectionValue = formData && formData[config.key] && formData[config.key]?.[input.name];
        const sectionError = sectionValue?.scrutinyMessage?.FSOError;
        const prevSectionError = input?.prevErrors?.scrutinyMessage?.FSOError;
        let bgclassname = sectionError && isScrutiny ? "error" : "";
        bgclassname = sectionError && isCaseReAssigned ? "preverror" : bgclassname;
        const sectionErrorClassname = sectionError === prevSectionError ? "prevsection" : "section";
        if (isPrevScrutiny && !input?.disableScrutiny) {
          showFlagIcon = prevSectionError ? true : false;
          bgclassname = prevSectionError ? "preverror" : "";
        }

        return (
          <div className={`content-item ${bgclassname}`}>
            <div className="item-header">
              <div className="header-left">
                {input?.icon && <Icon icon={input?.icon} />}
                <span>{t(input?.label)}</span>
              </div>
              {input?.data?.length === 0 && <span style={{ fontFamily: "Roboto", fontSize: "14px", fontWeight: 400 }}>{t(input?.noDataText)}</span>}
              {!isScrutiny && !isJudge && (isCaseReAssigned || isDraftInProgress) && (
                <div
                  className="header-right"
                  style={{ display: "contents" }}
                  onClick={(e) => {
                    history.push(`?caseId=${caseId}&selected=${input?.key}`);
                  }}
                >
                  <EditPencilIcon />
                </div>
              )}
              {showFlagIcon && input?.data?.length > 0 && (
                <div
                  style={{ cursor: "pointer" }}
                  onClick={(e) => {
                    handleOpenPopup(e, config.key, input?.name);
                  }}
                  key={index}
                >
                  {sectionError ? (
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
            {sectionError && isScrutiny && (
              <div className={`scrutiny-error ${sectionErrorClassname}`}>
                {prevSectionError === sectionError ? (
                  <span style={{ color: "#4d83cf", fontWeight: 300 }}>{t("CS_PREVIOUS_ERROR")}</span>
                ) : (
                  <FlagIcon isError={true} />
                )}
                {sectionError}
              </div>
            )}
            {Array.isArray(input.data) &&
              input.data.map((item, index) => {
                const dataErrors = sectionValue?.form?.[index];
                const prevDataErrors = input?.prevErrors?.form?.[index] || {};
                const titleHeading = input.name === "chequeDetails" ? true : false;
                const updatedConfig = input?.config?.filter((inputConfig) => {
                  if (!inputConfig?.dependentOn || !inputConfig?.dependentValue) {
                    return true;
                  } else {
                    if (extractValue(item.data, inputConfig?.dependentOn) === inputConfig?.dependentValue) {
                      return true;
                    }
                    return false;
                  }
                });
                return (
                  <CustomReviewCard
                    isScrutiny={isScrutiny}
                    isJudge={isJudge}
                    config={updatedConfig}
                    titleIndex={index + 1}
                    data={item?.data}
                    key={index}
                    dataIndex={index}
                    t={t}
                    handleOpenPopup={handleOpenPopup}
                    handleClickImage={handleClickImage}
                    setShowImageModal={setShowImageModal}
                    formData={formData}
                    input={input}
                    dataErrors={dataErrors}
                    prevDataErrors={prevDataErrors}
                    configKey={config.key}
                    titleHeading={titleHeading}
                    isPrevScrutiny={isPrevScrutiny}
                    isCaseReAssigned={isCaseReAssigned}
                  />
                );
              })}
          </div>
        );
      })}
    </div>
  </div>
  {isPopupOpen && (
    <CustomPopUp anchorRef={popupAnchor.current} popupstyle={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
      <Fragment>
        <div>{t("CS_ERROR_DESCRIPTION")}</div>
        <TextArea
          value={scrutinyError}
          onChange={(e) => {
            const { value } = e.target;
            setScrutinyError(value);
          }}
          maxlength={config.textAreaMaxLength || "255"}
          style={{ minWidth: "300px", maxWidth: "300px", maxHeight: "150px", minHeight: "50px" }}
        ></TextArea>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <Button
            label={!defaultError ? t("CS_COMMON_CANCEL") : t("CS_COMMON_DELETE")}
            onButtonClick={() => {
              if (!defaultError) {
                handleClosePopup();
              } else {
                setDeletePopup(true);
              }
            }}
          />
          <Button
            label={
              !defaultError
                ? t("CS_MARK_ERROR")
                : systemDefaultError
                ? t("CS_CONFIRM_ERROR")
                : defaultError === scrutinyError
                ? t("CS_COMMON_CANCEL")
                : t("CS_COMMON_UPDATE")
            }
            isDisabled={!scrutinyError?.trim()}
            onButtonClick={() => {
              if (systemDefaultError) {
                handleAddError();
                return;
              }
              if (defaultError === scrutinyError) {
                handleClosePopup();
              } else {
                handleAddError();
              }
            }}
          />
        </div>
      </Fragment>
    </CustomPopUp>
  )}
  {deletePopup && (
    <CustomPopUp
      anchorRef={popupAnchor.current}
      popupstyle={{ minWidth: "400px", maxWidth: "400px", left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
    >
      <Fragment>
        <div>{t("CS_DELETE_COMMENT")}</div>
        <CardText>{t("CS_DELETE_HEADER")}</CardText>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <Button
            label={t("CS_COMMON_CANCEL")}
            onButtonClick={() => {
              setDeletePopup(false);
            }}
          />
          <Button label={t("CS_COMMON_DELETE")} onButtonClick={handleDeleteError} />
        </div>
      </Fragment>
    </CustomPopUp>
  )}
  {(imagePopupInfo || showImageModal.openModal) && (
    <ImageModal
      imageInfo={showImageModal.openModal ? showImageModal.imageInfo : imagePopupInfo}
      t={t}
      anchorRef={popupAnchor}
      showFlag={showImageModal.openModal ? false : true}
      handleOpenPopup={!showImageModal.openModal && handleOpenPopup}
      handleCloseModal={() => {
        if (showImageModal.openModal) {
          setShowImageModal({ showImageModal: false, imageInfo: {} });
        } else handleCloseImageModal();
      }}
      isPrevScrutiny={isPrevScrutiny}
      disableScrutiny={false}
    />
  )}
</div>
```
