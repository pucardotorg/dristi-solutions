# Code Documentation

This document explains the functionality, purpose, and usage of the provided code. It manages submissions and pending tasks in a legal case management system.

---

### `handleMakePayment`

#### Purpose:

This function is used when user wants to make online payment for submission
- First it fetches bill using `fetchBill` API
- if bill exists, it opens paymentPortal and redirects user to E-Treasury portal
- Once user comes back, it checks if the payment is sucessfull or not and shows message accordingly


#### Code:

```javascript
 const handleMakePayment = async (totalAmount) => {
    try {
      const bill = await fetchBill(applicationDetails?.applicationNumber + `_${suffix}`, tenantId, entityType);
      if (bill?.Bill?.length) {
        const billPaymentStatus = await openPaymentPortal(bill);
        setPaymentStatus(billPaymentStatus);
        await applicationRefetch();
        console.log(billPaymentStatus);
        if (billPaymentStatus === true) {
          setMakePaymentLabel(false);
          setShowPaymentModal(false);
          setShowSuccessModal(true);
          createPendingTask({ name: t("MAKE_PAYMENT_SUBMISSION"), status: "MAKE_PAYMENT_SUBMISSION", isCompleted: true });
        } else {
          setMakePaymentLabel(true);
          setShowPaymentModal(false);
          setShowSuccessModal(true);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };
```
