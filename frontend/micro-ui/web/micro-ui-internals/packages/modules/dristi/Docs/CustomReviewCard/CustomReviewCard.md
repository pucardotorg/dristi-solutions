# Code Documentation

This document explains the functionality, purpose, and usage of the provided code.

---

### `CustomReviewCard`

#### Purpose:

This is review card - to represent different sections inside select accordi0n.

- For instance, Litigant Details [`SelectReviewAccorion`](./../SelectReviewAccordian/SelectReviewAccordion.md) contains two review cards / sections. Complainant Details and Respondent Details
- We get config of each review card, especially the respective row, one being the label and another being the value
- We loop through this config and render [`CustomReviewCardRow`](./../CustomReviewCardRow/CustomReviewCardRow.md) to display the entire review card
- We extract dataError and prevDataError for the respective row using below code

```javascript
const dataError = Array.isArray(item.value) ? dataErrors : dataErrors?.[item.value]?.FSOError;
const prevDataError = Array.isArray(item.value) ? prevDataErrors : prevDataErrors?.[item.value]?.FSOError;
```

#### Code:

```javascript
<div className="item-body">
  {config.map((item, i) => {
    const dataError = Array.isArray(item.value) ? dataErrors : dataErrors?.[item.value]?.FSOError;
    const prevDataError = Array.isArray(item.value) ? prevDataErrors : prevDataErrors?.[item.value]?.FSOError;
    return (
      <CustomReviewCardRow
        config={item}
        key={i}
        data={data}
        handleOpenPopup={handleOpenPopup}
        isScrutiny={isScrutiny}
        isJudge={isJudge}
        titleIndex={titleIndex}
        dataIndex={dataIndex}
        name={input.name}
        configKey={configKey}
        dataError={dataError}
        prevDataError={prevDataError}
        isPrevScrutiny={isPrevScrutiny}
        t={t}
        titleHeading={titleHeading}
        handleClickImage={handleClickImage}
        setShowImageModal={setShowImageModal}
        isCaseReAssigned={isCaseReAssigned}
        disableScrutiny={input?.disableScrutiny}
      />
    );
  })}
</div>
```
