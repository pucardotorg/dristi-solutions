# NJDG Transformer Service - Transformation Logic

This document details the transformation logic implemented in the NJDG Transformer service. The service subscribes to Kafka topics from the ON Court system (Case, Order, Advocate, Notification events) and transforms the data into the NJDG intermediate schema format for database persistence.

## 1. Case Transformation

**Service:** `NJDGCaseTransformerImpl.java`  
**Source:** `CourtCase` (ON Court)  
**Target:** `NJDGTransformRecord` (NJDG Intermediate Table)

### Field Mappings

| ON Court Field | NJDG Field | Transformation Logic |
| :--- | :--- | :--- |
| `cnrNumber` | `cino` | Direct Mapping. |
| `filingDate` | `dateOfFiling` | Converted from Epoch Millis to `yyyy-MM-dd`. |
| `registrationDate` | `dtRegis` | Converted from Epoch Millis to `yyyy-MM-dd`. |
| `caseType` | `caseType` | Database Lookup: `caseRepository.getCaseTypeCode(String)`. |
| `courtCaseNumber` / `cmpNumber` | `regNo` | Extracted numeric part using `NumberExtractor`. |
| `courtCaseNumber` / `cmpNumber` | `regYear` | Extracted year part (format `.../YYYY`). |
| `filingNumber` | `filNo` | Extracted numeric part from `XX-NNNNNN-YYYY`. |
| `filingNumber` | `filYear` | Extracted year part from `XX-NNNNNN-YYYY`. |
| `outcome` | `pendDisp` | If `outcome` is present → `'D'` (Disposed), else `'P'` (Pending). |
| `outcome` | `dispReason` | Database Lookup: `caseRepository.getDisposalStatus(outcome)`. Defaults to `0`. |
| `natureOfDisposal` | `dispNature` | `CONTESTED` → `1`, `UNCONTESTED` → `2`, Default → `0`. |
| `judgementDate` | `dateOfDecision` | Converted to `yyyy-MM-dd`. If null, tries to derive from Orders. |
| `courtId` | `estCode` | Direct Mapping. |
| *Configuration* | `stateCode` | From `application.properties` (`state.code`). |
| `chequeDetails...policeStation` | `policeStCode` | Database Lookup: `caseRepository.getPoliceStationDetails(code)`. |
| `chequeDetails...policeStation` | `policeStation` | Database Lookup: `caseRepository.getPoliceStationDetails(code)`. |
| `hearingDetails` | `purposeCode` | Derived from the *last* hearing record (`hearingRepository`). |
| `hearingDetails` | `purposePrevious` | Derived from the *second to last* hearing record (`n-2`). |
| `hearingDetails` | `dateFirstList` | Date of the *first* hearing record. |
| `hearingDetails` | `dateLastList` | Date of the *last* hearing record. |
| `hearingDetails` | `dateNextList` | Next date of the *last* hearing record. |
| `additionalDetails.complainantDetails` | `petName` | Full name constructed from First, Middle, Last names of primary complainant. |
| `additionalDetails.complainantDetails` | `petAge` | Parsed integer from `complainantAge`. |
| `additionalDetails.complainantDetails` | `petAddress` | Concatenated address fields (Locality, City, District, State, Pincode). |
| `additionalDetails.respondentDetails` | `resName` | Full name constructed from First, Middle, Last names of primary respondent. |
| `additionalDetails.respondentDetails` | `resAge` | Parsed integer from `respondentAge`. |
| `additionalDetails.respondentDetails` | `resAddress` | Concatenated address fields. |
| `representatives` (Complainant) | `petAdv`, `petAdvCd`, `petAdvBarReg` | Primary advocate for complainant found via `representatives` mapping. |
| `representatives` (Respondent) | `resAdv`, `resAdvCd`, `resAdvBarReg` | Primary advocate for respondent found via `representatives` mapping. |

### Key Logic
*   **Case Number Handling:** Prioritizes `courtCaseNumber`. If the case type is `CMP` (Civil Miscellaneous Petition), it prioritizes `cmpNumber` for the old registration details.
*   **Police Station Enrichment:** Navigates the complex `chequeDetails` JSON structure to find the police station code, then fetches full details from the database.
*   **Primary Party Enrichment:**
    *   **Petitioner (Complainant):** Extracts details from `additionalDetails.complainantDetails`. Matches `individualId` from the litigant list to the form data to ensure correct party mapping.
    *   **Respondent (Accused):** Extracts details from `additionalDetails.respondentDetails`.
    *   **Advocate Mapping:** Identifies the primary advocate for each party by checking the `representatives` list in the case object. Fetches advocate details (Name, Code, Bar Reg No) from the `AdvocateRepository`.
*   **Hearing Derived Fields:**
    *   `purposeCode`: Uses the purpose of listing from the most recent hearing.
    *   `purposePrevious`: Uses the purpose of listing from the hearing before the most recent one.
    *   `dateFirstList`, `dateLastList`, `dateNextList`: Derived from the sorted list of hearings associated with the CINO.
*   **Extra Parties:**
    *   Complainants, Respondents, and Witnesses are extracted and mapped to `PetExtraParty` and `ResExtraParty` lists.
    *   Handled by `ExtraPartiesProcessorImpl.java`.
*   **Acts:**
    *   Maps `statutesAndSections` to `Act` entity.
    *   Defaults to Section "138" if specific section is missing.
    *   Handled by `ActsProcessorImpl.java`.

---

## 2. Order Transformation

**Service:** `OrderService.java`  
**Source:** `Order` (ON Court)  
**Target:** `InterimOrder` (NJDG Intermediate Table)

### Field Mappings

| ON Court Field | NJDG Field | Transformation Logic |
| :--- | :--- | :--- |
| `orderNumber` | `courtOrderNumber` | Direct Mapping. |
| `cnrNumber` | `cino` | Direct Mapping. |
| `createdDate` | `orderDate` | Converted from Epoch Millis to `yyyy-MM-dd`. |
| `documents` | `orderDetails` | Fetches PDF from FileStore using `fileStoreId` and converts to `byte[]` (BLOB). |
| `orderCategory` | N/A | Used to determine how to extract `outcome`. |
| `outcome` | `dispReason` | **Complex Logic** (see below). |
| *Calculated* | `orderNo` | Incremental integer based on existing orders for the case (Max + 1). |
| `judgeDetails` | `judgeCode`, `joCode` | Fetched from DB based on `createdDate` and `JUDICIAL_MAGISTRATE` designation. |

### Key Logic
*   **Disposal Reason (`dispReason`) Determination:**
    1.  If `outcome` is present and NOT `JUDGEMENT`: Uses `outcome` directly.
    2.  If `outcome` is `JUDGEMENT` or null:
        *   **Intermediate Orders:** Extracts code from `additionalDetails.formdata.findings.code`.
        *   **Composite Orders:** Iterates through `compositeItems` to find one with `orderType` = `JUDGEMENT`, then extracts code from that item's schema.
    3.  Final Code is mapped to an Integer ID via `caseRepository.getDisposalStatus()`.
*   **Document Handling:** Filters documents for type `SIGNED`, downloads the content, and stores it as a binary blob.

---

## 3. Order Notification (Hearing History) Transformation

**Service:** `OrderNotificationService.java`  
**Source:** `Order` (ON Court) + `Hearing` (ON Court) + `Notification` (ON Court)  
**Target:** `HearingDetails` (NJDG Intermediate Table - History of Case Hearing)

### Field Mappings

| ON Court Field | NJDG Field | Transformation Logic |
| :--- | :--- | :--- |
| `cnrNumber` | `cino` | Direct Mapping. |
| `createdDate` | `hearingDate` | Converted from Epoch Millis to `yyyy-MM-dd`. |
| `hearingNumber` / `orderCategory` | `purposeOfListing` | **Complex Logic** (see below). |
| `itemText` | `business` | **Order:** HTML cleaned/compiled. Fallback to Inbox service if null.<br>**Notification:** Uses template `{hearingDate} to {nextDate}`. |
| *Calculated* | `nextDate` | Date of the *next scheduled* hearing found after `order.createdDate`. |
| *Calculated* | `nextPurpose` | Purpose code of that next hearing. |
| *DB Lookup* | `judgeCode`, `joCode` | Fetched from DB based on date. |

### Key Logic
*   **Purpose of Listing (`purposeOfListing`):**
    1.  **If `hearingNumber` exists:** Finds the hearing with that ID.
    2.  **If `hearingNumber` is null:**
        *   If `INTERMEDIATE`: Uses `order.orderType`.
        *   If `COMPOSITE`: Uses the `hearingType` of the last *completed* hearing.
    *   The resulting string is converted to a numeric code via `hearingRepository`.
*   **Business Text:**
    *   **For Orders:** Standardizes HTML line breaks (`<br>`, `<p>`) to newlines. Removes duplicates and empty lines. If `itemText` is missing, fetches `businessOfTheDay` from Inbox.
    *   **For Notifications:** Uses a configurable template (e.g., "Adjourned from {hearingDate} to {nextDate}").
*   **Next Date Updates:**
    *   The service also updates *existing* hearing records in the database that have a `null` `nextDate` if a subsequent scheduled hearing is found.

---

## 4. Advocate Transformation

**Service:** `AdvocateService.java`  
**Source:** `Advocate` + `Individual` (ON Court)  
**Target:** `AdvocateDetails` (NJDG Intermediate Table)

### Field Mappings

| ON Court Field | NJDG Field | Transformation Logic |
| :--- | :--- | :--- |
| `advocate.id` | `advocateId` | Direct Mapping (UUID String). |
| `advocate.barRegistrationNumber` | `barRegNo` | Direct Mapping. |
| `individual.name.givenName` | `advocateName` | Fetched via `IndividualUtil` using `individualId`. |
| `individual.email` | `email` | Fetched via `IndividualUtil`. |
| `individual.mobileNumber` | `phone` | Fetched via `IndividualUtil`. |
| `individual.dateOfBirth` | `dob` | Converted to `yyyy-MM-dd`. |
| `individual.address` | `address` | Concatenation of `doorNo`, `street`, `city`, `pincode`, etc. |

### Key Logic
*   **Data Enrichment:** The `Advocate` object mostly contains IDs. The transformer calls the **Individual Service** to fetch personal details (Name, Email, Phone, Address) using the `individualId`.
*   **Update vs Create:** Checks if the advocate already exists in the local DB. If yes, updates (preserving the generated `advocateCode`); otherwise, inserts a new record.

---

## 5. Case Conversion Transformation

**Service:** `CaseService.java`  
**Source:** `CaseConversionRequest` (ON Court)  
**Target:** `CaseTypeDetails` (NJDG Intermediate Table)

### Field Mappings

| ON Court Field | NJDG Field | Transformation Logic |
| :--- | :--- | :--- |
| `caseConversionDetails.cnrNumber` | `cino` | Direct Mapping (used to lookup existing record). |
| `caseConversionDetails.convertedFrom` | `oldRegCaseType` | Database Lookup: `caseRepository.getCaseTypeCode(convertedFrom)`. |
| `caseConversionDetails.preCaseNumber` | `oldRegNo` | Extracted numeric part from case number string. |
| `caseConversionDetails.preCaseNumber` | `oldRegYear` | Extracted year part from case number string (`.../YYYY`). |
| `caseConversionDetails.convertedTo` | `newRegCaseType` | Database Lookup: `caseRepository.getCaseTypeCode(convertedTo)`. |
| `caseConversionDetails.postCaseNumber` | `newRegNo` | Extracted numeric part from case number string. |
| `caseConversionDetails.postCaseNumber` | `newRegYear` | Extracted year part from case number string (`.../YYYY`). |
| `caseConversionDetails.dateOfConversion`| `convertedAt` | Converted from Epoch Millis to `LocalDateTime`. |

### Key Logic
*   **Specific Transition:** Currently implements logic specifically for converting **CMP** (Civil Miscellaneous Petition) to **ST** (Summary Trial) cases.
*   **Serial Number (`srNo`) Management:**
    *   Checks if a conversion record already exists for the CINO.
    *   If **No**: Creates a new record with `srNo = 1`.
    *   If **Yes**: Updates the existing record (or adds a new one depending on implementation flow, logic suggests handling existing details).
*   **Judge Details:** Inherits `jocode` from the main Case record (`NJDGTransformRecord`).
