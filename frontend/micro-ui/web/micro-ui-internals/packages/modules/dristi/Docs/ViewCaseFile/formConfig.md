# Code Documentation

This document explains the functionality, purpose, and usage of the provided code.

---

### `formConfig`

#### Purpose:

formconfig to render the custom [`SelectReviewAccordion`](./SelectReviewAccordion.md) component and few custom things like label partyInPerson, or infoBox on submissionFromAccused

#### Code:

```javascript
const formConfig = useMemo(() => {
  if (!caseDetails) return null;
  return [
    ...reviewCaseFileFormConfig.map((form) => {
      return {
        ...form,
        body: form.body
          ?.filter((section) => !(section?.key === "submissionFromAccused" && isScrutiny))
          .map((section) => {
            return {
              ...section,
              isPrevScrutiny,
              populators: {
                ...section.populators,
                inputs: section.populators.inputs?.map((input) => {
                  delete input.data;
                  if (input?.key === "submissionFromAccused") {
                    const responseDocuments = caseDetails?.litigants?.filter((litigant) => litigant?.partyType?.includes("respondent"))?.[0]
                      ?.documents;
                    const vakalatnamaDocument = caseDetails?.representatives?.filter((representative) =>
                      representative?.representing?.some((represent) => represent?.partyType?.includes("respondent"))
                    )?.[0]?.additionalDetails?.document?.vakalatnamaFileUpload;
                    return {
                      ...input,
                      data: [
                        {
                          data: {
                            infoBoxData: {
                              data: responseDocuments ? t("RESPONSE_SUBMISSION_MESSAGE") : t("RESPONSE_NOT_SUMISSION_MESSAGE"),
                              header: responseDocuments ? "ES_COMMON_INFO" : "PLEASE_NOTE",
                            },
                            responseDocuments: responseDocuments,
                            vakalatnamaDocument: vakalatnamaDocument,
                          },
                        },
                      ],
                    };
                  } else if (["complainantDetails", "respondentDetails"].includes(input?.key)) {
                    const isPartyInPerson = (individualId) => {
                      const representative = caseDetails?.representatives?.find((data) =>
                        data?.representing?.find((rep) => rep?.individualId === individualId && rep?.isActive === true)
                      );
                      return representative ? false : true;
                    };
                    const returnData = {
                      ...input,
                      data: caseDetails?.additionalDetails?.[input?.key]?.formdata?.map((fData) => ({
                        ...fData,
                        data: {
                          ...fData?.data,
                          ...(fData?.data?.[input?.key === "complainantDetails" ? "complainantVerification" : "respondentVerification"] &&
                            isPartyInPerson(
                              fData?.data?.[input?.key === "complainantDetails" ? "complainantVerification" : "respondentVerification"]
                                ?.individualDetails?.individualId
                            ) && { partyInPerson: true }),
                        },
                      })),
                      prevErrors: defaultScrutinyErrors?.data?.[section.key]?.[input.key] || {},
                    };
                    return returnData;
                  } else
                    return {
                      ...input,
                      data: caseDetails?.additionalDetails?.[input?.key]?.formdata || caseDetails?.caseDetails?.[input?.key]?.formdata || {},
                      prevErrors: defaultScrutinyErrors?.data?.[section.key]?.[input.key] || {},
                    };
                }),
              },
            };
          }),
      };
    }),
  ];
}, [reviewCaseFileFormConfig, caseDetails, defaultScrutinyErrors]);
```
