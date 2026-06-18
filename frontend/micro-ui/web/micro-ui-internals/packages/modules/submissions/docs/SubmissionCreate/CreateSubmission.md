# Code Documentation

This document explains the functionality, purpose, and usage of the provided code. It manages submissions and pending tasks in a legal case management system.

---

### `createSubmission`

#### Purpose:
This function is used to create a new application. It works as follows
1. It makes a list of all the document files uploaded by user
2. First all these files are uploaded in fileStore, respective fileStore Id is stored.
3. All these fileStores are uploaded as artifacts using createArtifact API
4. Finally, formData is converted into ApplicationSchema using `Digit.Customizations.dristiOrders.ApplicationFormSchemaUtils.formToSchema` function
5. If given submission is mandatory submission, we send referenceId as respective orderId. In case it's application for extension of submission requrest, it goes under voluntary application, hence we don't send any referenceId for it
6. If responseRequired is True, we send it in additionalDetails
7. `onBehalfOf` contains litigant's uuid, regardless whether litigant is creating the submission or advocate is doing it on behalf of the litigant
8. 

#### Code:

```javascript
const createSubmission = async () => {
    try {
      let documentsList = [];
      if (formdata?.listOfProducedDocuments?.documents?.length > 0) {
        documentsList = [...documentsList, ...formdata?.listOfProducedDocuments?.documents];
      }
      if (formdata?.reasonForDocumentsSubmission?.documents?.length > 0) {
        documentsList = [...documentsList, ...formdata?.reasonForDocumentsSubmission?.documents];
      }
      if (formdata?.submissionDocuments?.documents?.length > 0) {
        documentsList = [...documentsList, ...formdata?.submissionDocuments?.documents];
      }
      if (formdata?.othersDocument?.documents?.length > 0) {
        documentsList = [...documentsList, ...formdata?.othersDocument?.documents];
      }
      const applicationDocuments =
        formdata?.submissionDocuments?.submissionDocuments?.map((item) => ({
          fileType: item?.document?.documentType,
          fileStore: item?.document?.fileStore,
          additionalDetails: item?.document?.additionalDetails,
        })) || [];
      const documentres = (await Promise.all(documentsList?.map((doc) => onDocumentUpload(doc, doc?.name)))) || [];
      let documents = [];
      let file = null;
      let evidenceReqBody = {};
      const uploadedDocumentList = [...(documentres || []), ...applicationDocuments];
      uploadedDocumentList.forEach((res) => {
        file = {
          documentType: res?.fileType,
          fileStore: res?.fileStore || res?.file?.files?.[0]?.fileStoreId,
          additionalDetails: { name: res?.filename || res?.additionalDetails?.name },
        };
        documents.push(file);
        evidenceReqBody = {
          artifact: {
            artifactType: "DOCUMENTARY",
            caseId: caseDetails?.id,
            filingNumber,
            tenantId,
            comments: [],
            file,
            sourceType,
            sourceID: individualId,
            additionalDetails: {
              uuid: userInfo?.uuid,
            },
          },
        };
        DRISTIService.createEvidence(evidenceReqBody);
      });

      let applicationSchema = {};
      try {
        applicationSchema = Digit.Customizations.dristiOrders.ApplicationFormSchemaUtils.formToSchema(formdata, modifiedFormConfig);
      } catch (error) {
        console.log(error);
      }
      if (userTypeCitizen === "ADVOCATE") {
        applicationSchema = {
          ...applicationSchema,
          applicationDetails: { ...applicationSchema?.applicationDetails, advocateIndividualId: individualId },
        };
      }

      const applicationReqBody = {
        tenantId,
        application: {
          ...applicationSchema,
          tenantId,
          filingNumber,
          cnrNumber: caseDetails?.cnrNumber,
          cmpNumber: caseDetails?.cmpNumber,
          caseId: caseDetails?.id,
          referenceId: isExtension ? null : orderDetails?.id || null,
          createdDate: new Date().getTime(),
          applicationType,
          status: caseDetails?.status,
          isActive: true,
          statuteSection: { tenantId },
          additionalDetails: {
            formdata,
            ...(orderDetails && { orderDate: formatDate(new Date(orderDetails?.auditDetails?.lastModifiedTime)) }),
            ...(orderDetails?.additionalDetails?.formdata?.documentName && { documentName: orderDetails?.additionalDetails?.formdata?.documentName }),
            onBehalOfName: onBehalfOfLitigent?.additionalDetails?.fullName,
            partyType: "complainant.primary",
            ...(orderDetails &&
              orderDetails?.orderDetails.isResponseRequired?.code === true && {
                respondingParty: orderDetails?.additionalDetails?.formdata?.responseInfo?.respondingParty,
              }),
            isResponseRequired: orderDetails && !isExtension ? orderDetails?.orderDetails.isResponseRequired?.code === true : true,
            ...(hearingId && { hearingId }),
            owner: caseDetails?.additionalDetails?.payerName,
          },
          documents,
          onBehalfOf: [isCitizen ? onBehalfOfuuid : userInfo?.uuid],
          comment: [],
          workflow: {
            id: "workflow123",
            action: SubmissionWorkflowAction.CREATE,
            status: "in_progress",
            comments: "Workflow comments",
            documents: [{}],
          },
        },
      };
      const res = await submissionService.createApplication(applicationReqBody, { tenantId });
      setLoader(false);
      return res;
    } catch (error) {
      setLoader(false);
      return null;
    }
  };
```
