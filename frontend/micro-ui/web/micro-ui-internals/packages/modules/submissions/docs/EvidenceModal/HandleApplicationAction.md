# Code Documentation

This document explains the functionality, purpose, and usage of the provided code. It manages submissions and pending tasks in a legal case management system.

---

### `handleApplicationAction`

#### Purpose:

Function being called when Judge clicks on Accept or Reject Application on confirmation modal

- If application is being accepted or rejected without generating order (Generate order checkbox is unmarked), then the status of application will be updated.
- If generate Order checkbox is selected, we will fetch respective order for given submission using [`getOrderTypes`](./GetOrderTypes.md) function and respective order will be created and judge will be redirected to generate order page with respective orderNumber

#### Code:

```javascript
const handleApplicationAction = async (generateOrder, type) => {
  try {
    const orderType = getOrderTypes(documentSubmission?.[0]?.applicationList?.applicationType, type);
    const formdata = {
      orderType: {
        code: orderType,
        type: orderType,
        name: `ORDER_TYPE_${orderType}`,
      },
      refApplicationId: documentSubmission?.[0]?.applicationList?.applicationNumber,
      applicationStatus: type === "accept" ? t("APPROVED") : t("REJECTED"),
    };
    const linkedOrderNumber = documentSubmission?.[0]?.applicationList?.additionalDetails?.formdata?.refOrderId;
    if (generateOrder) {
      const reqbody = {
        order: {
          createdDate: null,
          tenantId,
          cnrNumber,
          filingNumber,
          statuteSection: {
            tenantId,
          },
          orderType,
          status: "",
          isActive: true,
          workflow: {
            action: OrderWorkflowAction.SAVE_DRAFT,
            comments: "Creating order",
            assignes: null,
            rating: null,
            documents: [{}],
          },
          documents: [],
          additionalDetails: {
            formdata,
            applicationStatus: type === "accept" ? t("APPROVED") : t("REJECTED"),
          },
          ...(documentSubmission?.[0]?.applicationList?.additionalDetails?.onBehalOfName && {
            orderDetails: { parties: [{ partyName: documentSubmission?.[0]?.applicationList?.additionalDetails?.onBehalOfName }] },
          }),
          ...(["INITIATING_RESCHEDULING_OF_HEARING_DATE", "CHECKOUT_ACCEPTANCE"].includes(orderType) && {
            hearingNumber: documentSubmission?.[0]?.applicationList?.additionalDetails?.hearingId,
          }),
          ...(linkedOrderNumber && { linkedOrderNumber }),
        },
      };
      try {
        const res = await ordersService.createOrder(reqbody, { tenantId });
        const name = getOrderActionName(documentSubmission?.[0]?.applicationList?.applicationType, showConfirmationModal.type);
        DRISTIService.customApiService(Urls.dristi.pendingTask, {
          pendingTask: {
            name: t(name),
            entityType: "order-default",
            referenceId: `MANUAL_${res?.order?.orderNumber}`,
            status: "DRAFT_IN_PROGRESS",
            assignedTo: [],
            assignedRole: ["JUDGE_ROLE"],
            cnrNumber,
            filingNumber,
            isCompleted: false,
            stateSla: stateSla.DRAFT_IN_PROGRESS * dayInMillisecond + todayDate,
            additionalDetails: { orderType },
            tenantId,
          },
        });
        history.push(`/${window.contextPath}/employee/orders/generate-orders?filingNumber=${filingNumber}&orderNumber=${res?.order?.orderNumber}`);
      } catch (error) {}
    } else {
      if (showConfirmationModal.type === "reject") {
        await handleRejectApplication();
      }
      if (showConfirmationModal.type === "accept") {
        try {
          await handleAcceptApplication();
          if (setIsDelayApplicationPending) setIsDelayApplicationPending(false);
        } catch (error) {
          console.error("error :>> ", error);
        }
      }
      counterUpdate();
      setShowSuccessModal(true);
      setShowConfirmationModal(null);
    }
  } catch (error) {}
};
```
