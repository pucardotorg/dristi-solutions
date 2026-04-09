# Case Identifier Migration – Impact Analysis

Reference: https://github.com/pucardotorg/dristi-backend-pbhrch/issues/4

## Summary of Change

Move all case identifiers (`cnrNumber`, `cmpNumber`, `courtCaseNumber`/ST, `filingNumber`) out of individual service tables into a **single normalized `case_identifier` table** owned by the case service. All child services (order, hearing, application, evidence, task, etc.) will reference cases **only via `case_id`** and will **not store any identifier columns**. Identifiers will be resolved at query time via JOIN or fetched from the case service / Elastic projections.

### New `case_identifier` Table Schema

```sql
CREATE TABLE case_identifier (
  id              UUID PRIMARY KEY,
  case_id         UUID NOT NULL REFERENCES dristi_cases(id),
  tenant          VARCHAR(2),
  identifier_type VARCHAR(20),  -- CNR, FILING, CMP, ST, NACT, COMA
  identifier_value VARCHAR(100),
  is_primary      BOOLEAN,
  assigned_on     TIMESTAMP
);
```

---

## PART A: SERVICES WITH OWN DB TABLES (schema + code + config changes)

These services have their own database tables that currently store identifier columns. They need flyway migrations, persister YAML updates, indexer YAML updates, model changes, query builder changes, row mapper changes, enrichment changes, service logic changes, etc.

---

### 1. dristi-services/case (PRIMARY – owns the new table)

**This is the most impacted service. It is the source of truth for identifiers.**

#### Flyway Migrations Needed
| Action | Details |
|---|---|
| **Create `case_identifier` table** | New DDL with id, case_id, tenant, identifier_type, identifier_value, is_primary, assigned_on |
| **Data migration** | Migrate existing filingnumber, cnrnumber, cmpnumber, courtcasenumber from `dristi_cases` into `case_identifier` rows |
| **Drop columns from `dristi_cases`** | Remove filingnumber, cnrnumber, cmpnumber, courtcasenumber columns (after data migration) |
| **Drop columns from `dristi_witness`** | Remove filingnumber, cnrnumber columns |
| **Drop columns from `dristi_case_conversion`** | Remove filingNumber, cnrNumber columns (replace with case_id reference) |
| **Drop `dristi_case_outcome`** filingNumber | Replace with case_id |
| **Update indexes** | Drop/recreate indexes that used identifier columns |

Existing migration files affected:
- `case/src/main/resources/db/migration/main/V20240424110535__case__ddl.sql` – original CREATE TABLE with cnrnumber, filingnumber, courtcasenumber
- `case/src/main/resources/db/migration/main/V20240912193000__case__ddl.sql` – ALTER TABLE adds cmpNumber
- `case/src/main/resources/db/migration/main/V20240925110535__case__ddl.sql`
- `case/src/main/resources/db/migration/main/V20240506110535__witness__ddl.sql` – witness table with filingnumber, cnrnumber
- `case/src/main/resources/db/migration/main/V20251216111500__case_conversion__ddl.sql` – case_conversion with filingNumber, cnrNumber
- `case/src/main/resources/db/migration/main/V20250818130500__caseLPR__ddl.sql` – courtCaseNumber reference

#### Model Changes
| File | Change |
|---|---|
| `CourtCase.java` | Remove `filingNumber`, `cnrNumber`, `cmpNumber`, `courtCaseNumber` fields. Add `List<CaseIdentifier> caseIdentifiers` |
| `CaseCriteria.java` | Remove individual identifier fields; add generic identifier search |
| `CaseExists.java` | Remove individual identifier fields |
| `CaseSearchCriteria.java` | Remove filingNumber, cnrNumber |
| `CaseSearchTextItem.java` | Remove individual identifier fields |
| `Witness.java` | Remove filingNumber, cnrNumber; use case_id |
| `CaseConversionDetails.java` | Remove filingNumber, cnrNumber |
| `CaseSummaryList.java`, `CaseSummarySearch.java`, `CaseSummaryListCriteria.java`, `CaseSummarySearchCriteria.java` | Remove all 4 identifier fields |
| `OpenApiCaseSummary.java`, `OpenApiCaseSummaryRequest.java` | Remove cnrNumber, filingNumber |
| **NEW: `CaseIdentifier.java`** | New model class: id, caseId, tenant, identifierType, identifierValue, isPrimary, assignedOn |

#### Query Builder Changes
| File | Change |
|---|---|
| `CaseQueryBuilder.java` | Remove identifier columns from SELECT/WHERE. Add JOIN to case_identifier for search. Lines: 23, 25, 360, 384, 956, 992, 995 |
| `CaseSummaryQueryBuilder.java` | Remove identifier columns; JOIN case_identifier. Lines: 19, 27, 183 |
| `OpenApiCaseSummaryQueryBuilder.java` | Remove identifier columns; JOIN case_identifier. Lines: 20, 26, 102, 184, 193 |
| `AdvocateOfficeCaseMemberQueryBuilder.java` | Remove filingnumber, cmpnumber, courtcasenumber. Lines: 40, 41, 42 |
| **NEW: `CaseIdentifierQueryBuilder.java`** | New query builder for CRUD on case_identifier table |

#### Row Mapper Changes
| File | Change |
|---|---|
| `CaseRowMapper.java` | Remove identifier field mapping; map List<CaseIdentifier> from joined result set. Lines: 60, 62, 63, 70, 85 |
| `CaseSearchTextRowMapper.java` | Lines: 16, 17, 18, 19 |
| `OpenApiCaseSummaryRowMapper.java` | Lines: 46, 47 |
| `WitnessRowMapper.java` | Lines: 50, 51 |
| `CaseListSummaryRowMapper.java` (v2) | Lines: 65, 66, 67, 71 |
| `CaseSummarySearchRowMapper.java` (v2) | Lines: 47, 50, 51, 57 |
| `CaseMemberInfoRowMapper.java` | Lines: 18, 19, 22 |
| **NEW: `CaseIdentifierRowMapper.java`** | New row mapper for case_identifier |

#### Enrichment Changes
| File | Change |
|---|---|
| `CaseRegistrationEnrichment.java` | Methods `enrichCNRNumber()`, `enrichCMPNumber()`, `enrichCourtCaseNumber()`, `enrichFilingNumber()` must now create CaseIdentifier objects instead of setting fields directly. Lines: 429-503 |
| `WitnessRegistrationEnrichment.java` | Remove filingNumber/cnrNumber setting |

#### Repository Changes
| File | Change |
|---|---|
| `CaseRepository.java` | Remove existence checks by cnrNumber/filingNumber; use case_identifier table |
| `CaseRepositoryV2.java` | `getCaseIdFromFilingNumber()` must query case_identifier. Lines: 712, 718, 832-854 |
| `AdvocateOfficeCaseMemberRepository.java` | Remove filingnumber mapping |
| **NEW: `CaseIdentifierRepository.java`** | New repository for case_identifier CRUD |

#### Service / Validator Changes
| File | Change |
|---|---|
| `CaseService.java` | ~53 filingNumber refs, ~5 cnrNumber refs, ~9 cmpNumber refs, ~8 courtCaseNumber refs – all must use CaseIdentifier list or resolve via case_id |
| `CaseRegistrationValidator.java` | Validate identifiers from case_identifier table |
| `EvidenceValidator.java` | Remove filingNumber references |
| `NotificationService.java` | Resolve identifiers from CaseIdentifier list for SMS/notification |
| `SmsNotificationService.java` | Same |
| `PaymentUpdateService.java` | Resolve filingNumber from CaseIdentifier |

#### Persister YAML (`kerala-configs/egov-persister/case-persister.yml`)
| Topic | Change |
|---|---|
| `save-case-application` | Remove filingnumber, cmpNumber, cnrnumber, courtcasenumber from INSERT into dristi_cases. Add new INSERT into case_identifier. |
| `update-case-application` | Remove these columns from UPDATE dristi_cases. Add UPSERT to case_identifier. |
| `transactionCodeJsonPath: $.filingNumber` | Change to `$.id` or use case_id |
| All outcome/LPR/conversion topics | Update to use case_id instead of filingNumber/cnrNumber |
| **~30+ jsonPath entries** reference these fields and must be removed or redirected |

Also affected:
- `witness-persister.yml` – remove filingnumber, cnrnumber from INSERT/UPDATE of dristi_witness
- In-repo `case-persister.yml`, `witness-persister.yml` (in dristi-services/case/)

#### Indexer YAML
| File | Change |
|---|---|
| `case/case-indexer.yml` | Remove filingNumber mapping; add identifiers array from case_identifier |
| `case/witness-indexer.yml` | Remove filingNumber, cnrNumber mapping |
| `digit-services/egov-indexer/src/main/resources/case-indexer.yml` | Remove all 4 identifier mappings; add identifiers |

---

### 2. dristi-services/hearing

#### Flyway Migrations
- `hearing/src/main/resources/db/migration/main/V20240514110535__hearing__ddl.sql` – original DDL with filingNumber, cnrNumbers
- `V20240913111500__hearing__ddl.sql` – adds courtCaseNumber, cmpNumber
- `V20240927110535__hearing__ddl.sql` – adds caseReferenceNumber
- **New migration**: DROP columns filingnumber, cnrnumbers, courtcasenumber, cmppnumber from dristi_hearing

#### Model Changes
| File | Change |
|---|---|
| `Hearing.java` | Remove filingNumber (List), cnrNumbers (List), cmpNumber, courtCaseNumber. Add case_id reference. Identifiers resolved from case service. |
| `HearingCriteria.java` | Remove cnrNumber; search by case_id |

#### Query Builder / Row Mapper
| File | Change |
|---|---|
| `HearingQueryBuilder.java` | Remove identifier columns from SELECT/WHERE. Search by case_id or JOIN case_identifier |
| `HearingRowMapper.java` | Remove identifier field mapping |

#### Service / Enrichment / Consumer
| File | Change |
|---|---|
| `HearingService.java` | 20+ filingNumber refs, uses identifiers for case lookups |
| `HearingRegistrationEnrichment.java` | Remove cmpNumber/courtCaseNumber enrichment |
| `HearingUpdateConsumer.java` | 21 filingNumber refs |
| `OrderUtil.java` | 29 filingNumber refs, 24 cnrNumber refs |
| `CronJobScheduler.java` | 16 filingNumber refs |
| `WitnessDepositionPdfService.java` | courtCaseNumber refs |
| `SmsNotificationService.java` | cmpNumber/courtCaseNumber refs |

#### Persister YAML (`kerala-configs/egov-persister/hearing-persister.yml`)
- **INSERT** (line 14): Remove filingNumber, cnrNumbers, courtCaseNumber, cmpNumber columns and jsonPath entries
- **UPDATE** (line 81): Remove cmpNumber, courtCaseNumber columns from SET clause

#### Indexer YAML
- `hearing/hearing-indexer.yml` – remove identifier mappings
- `digit-services/egov-indexer/src/main/resources/hearing-indexer.yml` – remove identifier mappings

---

### 3. dristi-services/order

#### Flyway Migrations
- `order/src/main/resources/db/migration/main/V20240424110535__order__ddl.sql` – filingnumber, cnrnumber
- `V20240913113500__order__ddl.sql` – adds columns
- **New migration**: DROP filingnumber, cnrnumber from dristi_orders

#### Model Changes
| File | Change |
|---|---|
| `Order.java` | Remove filingNumber, cnrNumber fields |
| `OrderCriteria.java` | Remove cnrNumber |
| `OrderExists.java` | Remove cnrNumber, filingNumber |

#### Query Builder / Row Mapper
- `OrderQueryBuilder.java` – 6 identifier refs
- `OrderRowMapper.java` – remove identifier mapping

#### Service / Enrichment
- `OrderRegistrationEnrichment.java` – 3 filingNumber refs
- `OrderRegistrationService.java` – cmpNumber, courtCaseNumber refs
- `SmsNotificationService.java` – identifier refs

#### Persister YAML (`kerala-configs/egov-persister/order-persister.yml`)
- **INSERT** (line 16): Remove filingnumber, cnrnumber columns + jsonPaths (lines 28, 38)
- **UPDATE** (line 109): Remove filingnumber=?, cnrnumber=? from SET + jsonPaths (lines 119, 131)
- `transactionCodeJsonPath: $.filingNumber` → change to `$.id`

#### Indexer YAML
- `order/order-indexer.yml` – 8 identifier refs to remove

---

### 4. dristi-services/application

#### Flyway Migrations
- `application/src/main/resources/db/migration/main/V20240514192045__application__ddl.sql` – filingNumber, cnrNumber
- `V20240913122500__application__ddl.sql` – adds cmpNumber
- `V20240927110535__application__ddl.sql`, `V20241114110535__application__ddl.sql`
- **New migration**: DROP filingNumber, cmpNumber, cnrNumber from dristi_application

#### Model Changes
- `Application.java` – remove filingNumber, cnrNumber, cmpNumber
- `ApplicationCriteria.java` – remove cnrNumber, filingNumber
- `ApplicationExists.java` – remove cnrNumber, filingNumber

#### Query Builder / Row Mapper
- `ApplicationQueryBuilder.java` – 4 cnrNumber refs, filingNumber refs
- `ApplicationRowMapper.java` – remove mapping

#### Service / Enrichment
- `ApplicationEnrichment.java` – 8 filingNumber refs, cmpNumber refs
- `ApplicationRepository.java` – 10 filingNumber refs
- `ApplicationService.java` – filingNumber refs
- `PaymentUpdateService.java` – cmpNumber, courtCaseNumber refs
- `DemandUtil.java` – 7 filingNumber refs

#### Persister YAML (`kerala-configs/egov-persister/application-persister.yml`)
- **INSERT** (line 16): Remove filingNumber, cmpNumber, cnrNumber + jsonPaths (lines 27, 28, 29)
- **UPDATE** (line 84): Remove filingNumber=?, cnrNumber=? + jsonPaths (lines 93, 94)
- `transactionCodeJsonPath: $.filingNumber` → change

#### Indexer YAML
- `application/application-indexer.yml` – 8 refs
- `digit-services/egov-indexer/src/main/resources/application-indexer.yml` – 4 refs

---

### 5. dristi-services/evidence

#### Flyway Migrations
- `evidence/src/main/resources/db/migration/main/V20240712110535__evidence__ddl.sql` – filingNumber
- **New migration**: DROP filingNumber from dristi_evidence_artifact

#### Model Changes
- `Artifact.java` – remove filingNumber, cnrNumber
- `EvidenceSearchCriteria.java` – remove filingNumber (5 refs)

#### Query Builder / Row Mapper
- `EvidenceQueryBuilder.java` – 14 identifier refs
- `EvidenceRowMapper.java` – remove mapping

#### Service / Enrichment
- `EvidenceService.java` – **50 filingNumber refs, 12 cmpNumber refs, 12 courtCaseNumber refs** (heaviest user)
- `EvidenceEnrichment.java` – 11 filingNumber refs
- `EvidenceValidator.java` – 3 filingNumber refs

#### Persister YAML (`kerala-configs/egov-persister/evidence-persister.yml`)
- **INSERT** (line 16): Remove filingNumber column + jsonPath (line 28)
- **UPDATE** (line 84): Remove filingNumber=? + jsonPath (line 94)
- `evidencewithoutworkflow-persister.yml` – same changes (lines 15, 27, 81, 91)

#### Indexer YAML
- `evidence/evidence-indexer.yml` – 6 refs
- `evidence/evidencewithoutworkflow-indexer.yml` – 6 refs

---

### 6. dristi-services/task

#### Flyway Migrations
- `task/src/main/resources/db/migration/main/V20240424110535__task__ddl.sql` – filingNumber, cnrNumber
- `V20240913120100__task__ddl.sql`, `V20250508153200__task__ddl.sql`
- **New migration**: DROP filingNumber, cnrNumber from dristi_task

#### Model Changes
- `Task.java` – remove filingNumber, cnrNumber
- `TaskCase.java` – remove cnrNumber, cmpNumber, courtCaseNumber
- `TaskCriteria.java`, `TaskExists.java` – remove identifier fields

#### Query Builder / Row Mapper
- `TaskQueryBuilder.java` – 5 cnrNumber refs, filingNumber refs
- `TaskCaseQueryBuilder.java` – 3 cnrNumber refs, cmpNumber, courtCaseNumber
- `TaskRowMapper.java`, `TaskCaseRowMapper.java` – remove mapping

#### Service / Enrichment
- `TaskService.java` – 8 filingNumber refs
- `TaskRegistrationEnrichment.java` – filingNumber
- `PaymentUpdateService.java` – 4 filingNumber refs
- `ApplicationUpdateConsumer.java` – filingNumber
- `CaseUtil.java` – 5 filingNumber refs

#### Persister YAML (`kerala-configs/egov-persister/task-persister.yml`)
- **INSERT** (line 16): Remove filingNumber, cnrNumber columns + jsonPaths (lines 25, 26)
- **UPDATE** (line 89): Remove filingNumber=?, cnrNumber=? + jsonPaths (lines 96, 97)
- `transactionCodeJsonPath: $.filingNumber` → change

#### Indexer YAML
- `task/task-indexer.yml` – 4 refs

---

### 7. dristi-services/task-management

#### Flyway Migrations
- `task-management/src/main/resources/db/migration/main/V20251024110535__task-management__ddl.sql` – filing_number
- **New migration**: DROP filing_number from dristi_task_management

#### Model Changes
- `TaskManagement.java` – remove filingNumber
- `TaskSearchCriteria.java` – remove filingNumber

#### Query Builder / Row Mapper
- `TaskManagementQueryBuilder.java` – remove filingNumber
- `TaskManagementRowMapper.java` – remove filingNumber mapping

#### Service / Enrichment / Consumer
- `TaskCreationService.java` – 17 filingNumber refs, 2 cnrNumber refs
- `PaymentUpdateService.java` – 14 filingNumber refs
- `Consumer.java` – 8 filingNumber refs
- `TaskManagementEnrichment.java` – 3 filingNumber refs
- `DemandService.java` – 4 filingNumber refs
- `SmsNotificationService.java` – 5 filingNumber refs

#### Persister YAML (`kerala-configs/egov-persister/task-management-persister.yml`)
- **INSERT** (line 15): Remove filing_number column + jsonPath (line 21)
- `transactionCodeJsonPath: $.filingNumber` → change

#### Indexer YAML
- `task-management/task-management-indexer.yml` – 4 refs

---

### 8. dristi-services/bail-bond

#### Flyway Migrations
- `bail-bond/src/main/resources/db/migration/main/V20250711193000__bail__ddl.sql` – cnr_number, filing_number
- **New migration**: DROP cnr_number, filing_number from dristi_bail

#### Model Changes
- `Bail.java` – remove cnrNumber, filingNumber

#### Query Builder / Row Mapper
- `BailQueryBuilder.java` – 3 cnrNumber refs, filingNumber refs
- `BailRowMapper.java` – remove identifier mapping

#### Persister YAML (`kerala-configs/egov-persister/bail-bond.persister.yml`)
- **INSERT** (lines 27-28): Remove cnrNumber, filingNumber jsonPaths
- **UPDATE** (line 124): Remove cnr_number=?, filing_number=? from SET

---

### 9. dristi-services/ctc

#### Flyway Migrations
- `ctc/src/main/resources/db/migration/main/V20260227111500__ctc_applications__ddl.sql` – filing_number
- `V20260306163000__add_cnr_number_to_ctc_application.sql` – cnr_number
- **New migration**: DROP filing_number, cnr_number from dristi_ctc_applications

#### Model / Service
- `CtcApplication.java` – remove filingNumber, cnrNumber
- `CtcApplicationService.java` – 11 filingNumber refs
- `CtcApplicationRowMapper.java` – remove mapping

#### Persister YAML (`kerala-configs/egov-persister/ctc-persister.yml`)
- **INSERT** (line 15): Remove filing_number, cnr_number columns + jsonPaths (lines 24, 25)
- **UPDATE** (line 62): Remove filing_number=?, cnr_number=? + jsonPaths (lines 68, 69)

#### Indexer YAML
- `ctc/ctc-indexer.yml` – 4 refs

---

### 10. dristi-services/digitalized-documents

#### Flyway Migrations
- `digitalized-documents/src/main/resources/db/migration/main/V20251125202000__digitalzeddocuments__ddl.sql` – case_filing_number
- **New migration**: DROP case_filing_number from digitalized_document

#### Model / Service
- `DigitalizedDocument.java` – remove caseFilingNumber
- `DigitalizedDocumentSearchCriteria.java` – remove filingNumber
- `DigitalizedDocumentQueryBuilder.java` – remove filingNumber
- `DigitalizedDocumentRowMapper.java` – remove mapping
- `ExaminationOfAccusedDocumentService.java`, `PleaDocumentService.java`, `MediationDocumentService.java` – use case_id

#### Persister YAML (`kerala-configs/egov-persister/digitalized-documents-persister.yml`)
- **ALL topics** reference `caseFilingNumber` (transactionCodeJsonPath, INSERT columns) – ~8 occurrences

---

### 11. dristi-services/ocr-service

#### Flyway Migrations
- `ocr-service/src/main/resources/db/migration/main/V20240807145530__ocr_ddl.sql` – filingnumber
- **New migration**: DROP filingnumber from dristi_ocr

#### Persister YAML (`kerala-configs/egov-persister/ocr-persister.yml`)
- **INSERT** (line 15): Remove filingnumber column + jsonPath (line 20)

---

### 12. dristi-services/scheduler-svc (cause_list table)

#### Flyway Migrations
- `scheduler-svc/src/main/resources/db/migration/main/V20240923200900__causelist_ddl.sql` – filing_number, cmp_number
- **New migration**: DROP filing_number, cmp_number from cause_list

#### Model / Service
- `CauseList.java` – remove filingNumber, cmpNumber, cnrNumber
- `CauseListService.java` – 13 filingNumber refs
- `HearingProcessor.java` – 4 filingNumber refs, cmpNumber/courtCaseNumber refs

#### Persister YAML (`kerala-configs/egov-persister/causelist-persister.yml`)
- **INSERT** (line 10): Remove filing_number, cmp_number columns + jsonPaths (lines 17, 39)

---

### 13. integration-services/njdg-transformer

#### Flyway Migrations (has own migration scripts)
- `njdg-transformer/migration-scripts/case-conversion.sql` – cnrNumber, filingNumber
- `njdg-transformer/src/main/resources/db/migration-ddl/` and `migration-main/`
- **New migration**: Update any tables storing identifiers

#### Model / Service (HEAVIEST cnrNumber user)
- `NJDGCaseTransformerImpl.java` – **55 cnrNumber refs**, 11 cmpNumber, 7 courtCaseNumber, 10 filingNumber
- `CaseConsumer.java` – 12 cnrNumber, 42 filingNumber
- `NJDGController.java` – 8 cnrNumber, 7 filingNumber
- `CaseQueryBuilder.java` – 3 cnrNumber
- `CaseRepository.java` – 2 cnrNumber
- `NumberExtractor.java` – 8 filingNumber
- All these must resolve identifiers from CaseIdentifier list

---

### 14. integration-services/summons-svc

#### DB Table (has own migrations)
- `summons-svc/src/main/resources/db/migration/` – check for identifier columns

#### Model / Service
- `DemandService.java` – 4 filingNumber refs, cnrNumber
- `SummonsService.java` – 2 filingNumber
- `PdfServiceUtil.java` – 6 filingNumber, cmpNumber, courtCaseNumber

---

### 15. integration-services/treasury-backend

#### Model / Service
- `PaymentService.java` – 9 filingNumber, cnrNumber, cmpNumber, courtCaseNumber
- `TreasuryEnrichment.java` – 3 filingNumber
- `SMSNotificationService.java` – cmpNumber, courtCaseNumber, filingNumber

---

## PART B: SERVICES WITHOUT OWN IDENTIFIER TABLES (code-only changes)

These services don't persist identifiers to their own tables but use them in-memory (models, service logic, notifications). They need **model changes + service logic updates** but no flyway migrations.

---

### 16. dristi-services/analytics

**Second-heaviest service by identifier usage.**

| File | Refs | Change |
|---|---|---|
| `IndexerUtils.java` | 66 filingNumber, 32 cnrNumber, 12 cmpNumber, 9 courtCaseNumber | Resolve identifiers from CaseIdentifier list |
| `CaseOverallStatusUtil.java` | 53 filingNumber, 4 cmpNumber, 4 courtCaseNumber | Same |
| `AdvocateOfficeMemberConsumer.java` | 36 filingNumber | Same |
| `BillingUtil.java` | 14 filingNumber, 6 cmpNumber, 7 courtCaseNumber, 2 cnrNumber | Same |
| `PendingTaskUtil.java` | 8 filingNumber | Same |
| `SmsNotificationService.java` | cmpNumber, courtCaseNumber refs | Same |
| Models: `CaseCriteria`, `PendingTask`, `CaseOverallStatus`, `Outcome`, `OfflinePaymentTask`, `TaskManagement`, `TaskSearchCriteria`, `CtcApplication`, `SmsTemplateData` | All have identifier fields | Replace with CaseIdentifier list or case_id |

---

### 17. dristi-services/order-management

| File | Refs | Change |
|---|---|---|
| `OrderService.java` | 6 cnrNumber, 10 filingNumber | Resolve via case_id |
| ~20 `PublishOrder*` strategy files | 1-7 filingNumber each | Same |
| `CronJobScheduler.java` | 9 filingNumber | Same |
| `HearingUtil.java` | 3 cnrNumber, 4 filingNumber | Same |
| `CaseUtil.java`, `TaskUtil.java`, `PendingTaskUtil.java` | Various | Same |
| `OrderApiController.java` | 4 filingNumber, 2 cnrNumber | Same |
| Models: `Order`, `OrderCriteria`, `OrderExists`, `HearingDraftOrder`, `BotdOrderSummary`, + 15 other model files | All have identifier fields | Replace with CaseIdentifier list or case_id |

---

### 18. dristi-services/casemanagement

| File | Refs | Change |
|---|---|---|
| `CaseManagerService.java` | 24 filingNumber | Resolve via case_id |
| `CaseBundleIndexBuilderService.java` | 15 filingNumber | Same |
| `DocPreviewService.java` | 9 filingNumber, 1 cnrNumber | Same |
| `OrderSearchService.java` | 4 cnrNumber | Same |
| Models: `CaseSummary`, `CourtCase`, many criteria/model files | Identifier fields | Replace |

---

### 19. dristi-services/transformer

| File | Refs | Change |
|---|---|---|
| `DBRepository.java` | 31 filingNumber (heavy SQL) | All queries use filingNumber – must switch to case_id |
| `CaseConsumer.java` | 26 filingNumber, 6 cmpNumber, 6 courtCaseNumber | Resolve from CaseIdentifier |
| `CaseService.java` | 8 filingNumber, 5 cmpNumber | Same |
| `HearingConsumer.java` | 5 filingNumber | Same |
| `EvidenceConsumer.java` | 6 filingNumber | Same |
| Models: all models have identifier fields | Replace |

---

### 20. dristi-services/openapi

| File | Refs | Change |
|---|---|---|
| `OpenApiService.java` | 23 filingNumber, 13 cnrNumber | Resolve via case_id / CaseIdentifier |
| Models: `FilingNumberCriteria`, `CnrNumberCriteria`, many others | Replace |

---

### 21. dristi-services/advocate

| File | Change |
|---|---|
| `SmsNotificationService.java` | Remove cmpNumber, filingNumber refs |
| `SmsTemplateData.java` | Remove all 4 identifier fields |

---

### 22. dristi-services/advocate-office-management

| File | Change |
|---|---|
| `CaseMemberInfo.java` | Remove cmpNumber, courtCaseNumber, filingNumber |

---

### 23. dristi-services/ab-diary

| File | Change |
|---|---|
| `DiaryService.java` | Remove cmpNumber, courtCaseNumber refs |
| `CourtCase.java` | Remove all 4 identifier fields |

---

### 24. dristi-services/payment-calculator-svc

| File | Change |
|---|---|
| `CaseUtil.java` | 3 filingNumber refs |
| `EFillingCalculationCriteria.java`, `JoinCaseCalculationCriteria.java`, `JoinCaseCriteria.java`, `CaseCriteria.java` | Remove filingNumber |

---

### 25. dristi-services/epost-tracker

| File | Change |
|---|---|
| `Task.java` | Remove filingNumber (2 refs) |

---

### 26. integration-services/icops_integration-kerala

| File | Change |
|---|---|
| `Task.java` | Remove filingNumber, cnrNumber |
| `IcopsEnrichment.java` | 2 filingNumber refs |

---

### 27. digit-services/egov-indexer (custom indexing code)

| File | Change |
|---|---|
| `CourtCase.java` | Remove cnrNumber, cmpNumber, courtCaseNumber, filingNumber |
| `Hearing.java` | Remove all 4 identifiers |
| `Application.java` | Remove cnrNumber, cmpNumber, filingNumber |
| `CaseCriteria.java` | Remove cnrNumber, courtCaseNumber, filingNumber |

---

### 28. digit-services/inbox

| File | Change |
|---|---|
| `InboxQueryBuilder.java` | 7 filingNumber refs – queries must use case_id |
| `InboxServiceV2.java` | 10 filingNumber refs |

---

## PART C: PERSISTER YAML FILES SUMMARY (kerala-configs/egov-persister)

| File | Identifiers to Remove | Queries Affected |
|---|---|---|
| **case-persister.yml** | filingnumber, cnrnumber, cmpNumber, courtcasenumber | INSERT dristi_cases, UPDATE dristi_cases, + outcome/conversion/LPR topics (~30+ jsonPath entries) |
| **hearing-persister.yml** | filingNumber, cnrNumbers, courtCaseNumber, cmpNumber | INSERT dristi_hearing, UPDATE dristi_hearing |
| **order-persister.yml** | filingnumber, cnrnumber | INSERT dristi_orders, UPDATE dristi_orders |
| **application-persister.yml** | filingNumber, cmpNumber, cnrNumber | INSERT dristi_application, UPDATE dristi_application |
| **evidence-persister.yml** | filingNumber | INSERT dristi_evidence_artifact, UPDATE dristi_evidence_artifact |
| **evidencewithoutworkflow-persister.yml** | filingNumber | INSERT, UPDATE |
| **task-persister.yml** | filingNumber, cnrNumber | INSERT dristi_task, UPDATE dristi_task |
| **task-management-persister.yml** | filing_number | INSERT dristi_task_management |
| **bail-bond.persister.yml** | cnrNumber, filingNumber | INSERT dristi_bail, UPDATE dristi_bail |
| **ctc-persister.yml** | filing_number, cnr_number | INSERT dristi_ctc_applications, UPDATE dristi_ctc_applications |
| **witness-persister.yml** | filingnumber, cnrnumber | INSERT dristi_witness, UPDATE dristi_witness |
| **causelist-persister.yml** | filing_number, cmp_number | INSERT cause_list |
| **ocr-persister.yml** | filingnumber | INSERT dristi_ocr |
| **digitalized-documents-persister.yml** | caseFilingNumber | INSERT/UPDATE digitalized_document (~8 occurrences across 6 topics) |

**New persister YAML needed**: `case-identifier-persister.yml` for INSERT/UPDATE/DELETE on `case_identifier` table (or add to case-persister.yml).

---

## PART D: INDEXER YAML FILES SUMMARY

| File | Identifiers to Remove | Replace With |
|---|---|---|
| `case/case-indexer.yml` | filingNumber (6) | `identifiers` array from case_identifier |
| `case/witness-indexer.yml` | filingNumber, cnrNumber (8) | case_id reference |
| `application/application-indexer.yml` | filingNumber, cnrNumber (8) | case_id + identifiers |
| `order/order-indexer.yml` | filingNumber, cnrNumber (8) | case_id + identifiers |
| `evidence/evidence-indexer.yml` | filingNumber (6) | case_id + identifiers |
| `evidence/evidencewithoutworkflow-indexer.yml` | filingNumber (6) | case_id + identifiers |
| `task/task-indexer.yml` | filingNumber, cnrNumber (4) | case_id + identifiers |
| `task-management/task-management-indexer.yml` | filingNumber (4) | case_id + identifiers |
| `ctc/ctc-indexer.yml` | filingNumber, cnrNumber (4) | case_id + identifiers |
| `digit-services/egov-indexer/src/main/resources/case-indexer.yml` | all 4 identifiers (12) | identifiers array |
| `digit-services/egov-indexer/src/main/resources/hearing-indexer.yml` | all identifiers (7) | case_id + identifiers |
| `digit-services/egov-indexer/src/main/resources/application-indexer.yml` | filingNumber (4) | case_id + identifiers |
| `digit-services/egov-indexer/src/main/resources/billing-indexer.yml` | filingNumber (1) | case_id |

**New Elastic indexes** per the issue:
- `dristi_case_order_projection` – flattened order + identifiers
- `dristi_case_hearing_projection` – flattened hearing + identifiers
- Similar projections for application, evidence, task, etc.

---

## PART E: FLYWAY MIGRATION SQL FILES REQUIRING NEW MIGRATIONS

| Service | Existing Files with Identifier Columns | New Migration Needed |
|---|---|---|
| **case** | `V20240424110535__case__ddl.sql`, `V20240912193000__case__ddl.sql`, `V20240925110535__case__ddl.sql`, `V20240506110535__witness__ddl.sql`, `V20251216111500__case_conversion__ddl.sql`, `V20250818130500__caseLPR__ddl.sql` | CREATE case_identifier + data migration + DROP columns |
| **hearing** | `V20240514110535__hearing__ddl.sql`, `V20240913111500__hearing__ddl.sql`, `V20240927110535__hearing__ddl.sql` | DROP columns |
| **order** | `V20240424110535__order__ddl.sql`, `V20240913113500__order__ddl.sql` | DROP columns |
| **application** | `V20240514192045__application__ddl.sql`, `V20240913122500__application__ddl.sql`, `V20240927110535__application__ddl.sql`, `V20241114110535__application__ddl.sql` | DROP columns |
| **evidence** | `V20240712110535__evidence__ddl.sql` | DROP filingNumber |
| **task** | `V20240424110535__task__ddl.sql`, `V20240913120100__task__ddl.sql`, `V20250508153200__task__ddl.sql` | DROP columns |
| **task-management** | `V20251024110535__task-management__ddl.sql` | DROP filing_number |
| **bail-bond** | `V20250711193000__bail__ddl.sql` | DROP cnr_number, filing_number |
| **ctc** | `V20260227111500__ctc_applications__ddl.sql`, `V20260306163000__add_cnr_number.sql` | DROP columns |
| **digitalized-documents** | `V20251125202000__digitalzeddocuments__ddl.sql` | DROP case_filing_number |
| **ocr-service** | `V20240807145530__ocr_ddl.sql` | DROP filingnumber |
| **scheduler-svc** | `V20240923200900__causelist_ddl.sql` | DROP filing_number, cmp_number |
| **njdg-transformer** | `migration-scripts/case-conversion.sql` | Update migration scripts |

---

## PART F: CROSS-CUTTING CONCERNS

### 1. Shared CourtCase Model (duplicated across services)
The `CourtCase.java` model is **duplicated in ~20 services** (not shared via a common library). Each copy has cnrNumber, cmpNumber, courtCaseNumber, filingNumber fields. **Every copy must be updated** to use `List<CaseIdentifier>` or just `caseId`.

Services with their own CourtCase.java copy:
- case, hearing, order, application, evidence, task, bail-bond, casemanagement, order-management, task-management, analytics, transformer, openapi, ab-diary, njdg-transformer, summons-svc, treasury-backend, scheduler-svc, advocate, digitalized-documents

### 2. Shared Criteria Models (CaseCriteria, CaseExists, etc.)
Same duplication pattern – each service has its own copy of `CaseCriteria.java`, `CaseExists.java` etc. with identifier fields.

### 3. SmsTemplateData / Notification Models
Used in ~12 services for SMS notifications. Currently contain cnrNumber, cmpNumber, courtCaseNumber, filingNumber. Must resolve these at notification time from the case service.

### 4. API Contracts
No formal OpenAPI/Swagger specs found for dristi services, but the **request/response models** effectively define the API. All search APIs that accept filingNumber, cnrNumber etc. as top-level parameters must change to:
- Accept `caseId` as primary, or
- Accept `identifierType` + `identifierValue` for search

### 5. Kafka Message Contracts
Services communicate via Kafka topics. The message payloads contain identifier fields (e.g., `$.order.filingNumber`, `$.hearing.filingNumber`). All producers and consumers must be updated.

### 6. idgen Configuration
The case service uses idgen to generate filingNumber, cnrNumber, cmpNumber, courtCaseNumber. This configuration remains but the generated values go into `case_identifier` rows instead of CourtCase fields.

---

## PART G: RECOMMENDED MIGRATION SEQUENCE

1. **Phase 1 – Schema**: Create `case_identifier` table. Write data migration to copy existing identifiers.
2. **Phase 2 – Case service**: Update case service models, enrichment, query builders, repositories, persisters. Add CaseIdentifier CRUD.
3. **Phase 3 – Core child services**: Update hearing, order, application, evidence, task (in parallel, as they're independent).
4. **Phase 4 – Secondary services**: task-management, bail-bond, ctc, digitalized-documents, ocr, scheduler-svc.
5. **Phase 5 – Integration/downstream**: analytics, casemanagement, order-management, transformer, openapi, njdg-transformer, summons-svc, treasury-backend.
6. **Phase 6 – Drop columns**: After all services are updated and verified, drop identifier columns from all tables.
7. **Phase 7 – Elastic**: Create flattened projection indexes.

---

## IMPACT SUMMARY

| Category | Count |
|---|---|
| **Services requiring code changes** | **27+** |
| **Flyway migration files (new)** | **~14** (one per service with own tables) |
| **Persister YAML files to update** | **14** (in kerala-configs) + in-repo copies |
| **Indexer YAML files to update** | **13** |
| **Model classes to modify** | **100+** (across all services) |
| **Query builder files to modify** | **~15** |
| **Row mapper files to modify** | **~15** |
| **Service/Enrichment/Util files** | **~60** |
| **New files to create** | CaseIdentifier model, repository, query builder, row mapper, persister YAML |
| **Estimated total files touched** | **200+** |
