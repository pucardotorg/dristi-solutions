### Index Mapping & MDMS Configuration

#### 1. Create Required Index Mappings

To avoid `inbox index not found` errors, ensure the following indices are created and properly mapped:

* `pending-task-index`
* `billing-data-index`
* `open-hearing-index`
* `advocate-index-test`
* `issue-ctc-documents`
* `digitalized-document-index`

**Action:**

* Verify whether these indices already exist.
* If not, create them with the appropriate mappings.
* Ensure index names match exactly with the configuration used in the application.

---

#### 2. Update Tenant Configuration in MDMS

Ensure the correct tenant ID is configured in MDMS under:

```
tenant.tenants
```

**Action:**

* Add or update the required tenant ID in the MDMS configuration.
* Verify that the tenant ID matches the one used in environment.
* Restart/reload services if required after updating MDMS (egov-enc-service need to be restarted).

---

#### Notes

* Missing indices will lead to runtime errors such as `index not found` in inbox service (which might cause issue in main home screen).
* Incorrect tenant configuration may cause data fetching or routing issues across services.

---
