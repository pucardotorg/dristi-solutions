# Epoch to TIMESTAMPTZ Migration — Documentation Report

## Overview

This document identifies all database columns currently using `BIGINT` / `int8` to store epoch milliseconds (Unix timestamps) across the Dristi backend services. These must be migrated to `TIMESTAMPTZ` as part of GitHub Issue #17 — *"Design Change - Move from EPOCH to TIMESTAMPTZ"*.

### Guiding Principle

> PostgreSQL and TimescaleDB are well-equipped to handle time-based comparisons and require data in `TIMESTAMPTZ`, not `BIGINT`. This change must be applied across all services.

### Column Classification

| Category | Examples | Target Type |
|---|---|---|
| Audit timestamps | `createdTime`, `lastModifiedTime`, `createddate`, `lastModifiedDate` | `TIMESTAMPTZ` |
| Business date/time | `filingDate`, `registrationDate`, `startTime`, `endTime`, `hearingDate` | `TIMESTAMPTZ` |
| Boundary timestamps | `effectiveFrom`, `effectiveTill`, `lockDate`, `lockReleaseTime` | `TIMESTAMPTZ` |
| Scheduler fields | `hearing_date`, `start_time`, `end_time`, `date`, `created_time` | `TIMESTAMPTZ` |

---

## 1. dristi-services

### 1.1 Case Service (`dristi-services/case`)

#### File: `V20240424110535__case__ddl.sql`

| Table | Column | Current Type |
|---|---|---|
| `dristi_cases` | `createdTime` | `int8` |
| `dristi_cases` | `lastModifiedTime` | `int8` |
| `dristi_linked_case` | `createdTime` | `int8` |
| `dristi_linked_case` | `lastModifiedTime` | `int8` |
| `dristi_case_statutes_and_sections` | `createdTime` | `int8` |
| `dristi_case_statutes_and_sections` | `lastModifiedTime` | `int8` |
| `dristi_case_litigants` | `createdTime` | `int8` |
| `dristi_case_litigants` | `lastModifiedTime` | `int8` |
| `dristi_case_representatives` | `createdTime` | `int8` |
| `dristi_case_representatives` | `lastModifiedTime` | `int8` |
| `dristi_case_representing` | `createdTime` | `int8` |
| `dristi_case_representing` | `lastModifiedTime` | `int8` |

> **Note:** `dristi_cases.filingDate` and `dristi_cases.registrationDate` were originally `varchar(64)` in this file.

#### File: `V20240722124622__case__ddl.sql`

| Table | Column | Current Type |
|---|---|---|
| `dristi_cases` | `filingDate` | `int8` (re-added) |
| `dristi_cases` | `registrationDate` | `int8` (re-added) |
| `dristi_cases` | `judgementDate` | `int8` |

#### File: `V20240506110535__witness__ddl.sql`

| Table | Column | Current Type |
|---|---|---|
| `dristi_witness` | `createdTime` | `int8` |
| `dristi_witness` | `lastModifiedTime` | `int8` |

#### File: `V20250408134300__poaholder__ddl.sql`

| Table | Column | Current Type |
|---|---|---|
| `dristi_case_poaholders` | `created_time` | `BIGINT` |
| `dristi_case_poaholders` | `last_modified_time` | `BIGINT` |

#### File: `V20251216111500__case_conversion__ddl.sql`

| Table | Column | Current Type |
|---|---|---|
| `dristi_case_conversion` | `dateOfConversion` | `BIGINT` |

#### File: `V20260127143000__advocate_office_case_member__ddl.sql`

| Table | Column | Current Type |
|---|---|---|
| `dristi_advocate_office_case_member` | `created_time` | `int8` |
| `dristi_advocate_office_case_member` | `last_modified_time` | `int8` |

---

### 1.2 Hearing Service (`dristi-services/hearing`)

#### File: `V20240514110535__hearing__ddl.sql`

| Table | Column | Current Type |
|---|---|---|
| `dristi_hearing` | `startTime` | `int8` |
| `dristi_hearing` | `endTime` | `int8` |
| `dristi_hearing` | `createdTime` | `int8` |
| `dristi_hearing` | `lastModifiedTime` | `int8` |

---

### 1.3 Order Service (`dristi-services/order`)

#### File: `V20240424110535__order__ddl.sql`

| Table | Column | Current Type |
|---|---|---|
| `dristi_orders` | `createdTime` | `int8` |
| `dristi_orders` | `lastModifiedTime` | `int8` |
| `dristi_order_statute_section` | `createdTime` | `int8` |
| `dristi_order_statute_section` | `lastModifiedTime` | `int8` |

#### File: `V20240727110535__order__ddl.sql`

| Table | Column | Current Type | Note |
|---|---|---|---|
| `dristi_orders` | `createdDate` | `int8` | Dropped VARCHAR, re-added as int8 |

---

### 1.4 Application Service (`dristi-services/application`)

#### File: `V20240514192045__application__ddl.sql`

| Table | Column | Current Type |
|---|---|---|
| `dristi_application` | `createdTime` | `int8` |
| `dristi_application` | `lastModifiedTime` | `int8` |
| `dristi_application_statute_section` | `createdTime` | `int8` |
| `dristi_application_statute_section` | `lastModifiedTime` | `int8` |

> **Note:** `dristi_application.createdDate` was originally `varchar(64)`; check whether it was later changed to `int8`.

---

### 1.5 Task Service (`dristi-services/task`)

#### File: `V20240424110535__task__ddl.sql`

| Table | Column | Current Type |
|---|---|---|
| `dristi_task` | `createdTime` | `int8` |
| `dristi_task` | `lastModifiedTime` | `int8` |

#### File: `V20240727110535__task__ddl.sql`

| Table | Column | Current Type | Note |
|---|---|---|---|
| `dristi_task` | `createdDate` | `int8` | Dropped VARCHAR, re-added as int8 |
| `dristi_task` | `dateCloseBy` | `int8` | Dropped VARCHAR, re-added as int8 |
| `dristi_task` | `dateClosed` | `int8` | Dropped VARCHAR, re-added as int8 |

---

### 1.6 Evidence Service (`dristi-services/evidence`)

#### File: `V20240403110535__evidence__ddl.sql`

| Table | Column | Current Type |
|---|---|---|
| `dristi_evidence_artifact` | `createdDate` | `int8` |
| `dristi_evidence_artifact` | `createdTime` | `int8` |
| `dristi_evidence_artifact` | `lastModifiedTime` | `int8` |
| `dristi_evidence_comment` | `createdTime` | `int8` |
| `dristi_evidence_comment` | `lastModifiedTime` | `int8` |

---

### 1.7 Advocate Service (`dristi-services/advocate`)

#### File: `V20240403110535__advocate__ddl.sql`

| Table | Column | Current Type |
|---|---|---|
| `dristi_advocate` | `createdTime` | `int8` |
| `dristi_advocate` | `lastModifiedTime` | `int8` |

#### File: `V20240313110535__ADVClerk_ddl.sql`

| Table | Column | Current Type |
|---|---|---|
| `dristi_advocate_clerk` | `createdTime` | `int8` |
| `dristi_advocate_clerk` | `lastModifiedTime` | `int8` |

---

### 1.8 Scheduler Service (`dristi-services/scheduler-svc`)

#### File: `V20240415195100__hb_hearing_booking_ddl.sql`

| Table | Column | Current Type |
|---|---|---|
| `hearing_booking` | `hearing_date` | `bigint` |
| `hearing_booking` | `start_time` | `bigint` |
| `hearing_booking` | `end_time` | `bigint` |
| `hearing_booking` | `created_time` | `bigint` |
| `hearing_booking` | `last_modified_time` | `bigint` |
| `hearing_booking` | `row_version` | `bigint` |

#### File: `V20240415195200__hbr_hearing_booking_reschedule_request_ddl.sql`

| Table | Column | Current Type |
|---|---|---|
| `hearing_booking_reschedule_request` | `created_time` | `bigint` |
| `hearing_booking_reschedule_request` | `last_modified_time` | `bigint` |
| `hearing_booking_reschedule_request` | `row_version` | `bigint` |

#### File: `V20240416132900__jc_judge_calendar_ddl.sql`

| Table | Column | Current Type |
|---|---|---|
| `judge_calendar_rules` | `date` | `bigint` |
| `judge_calendar_rules` | `created_time` | `bigint` |
| `judge_calendar_rules` | `last_modified_time` | `bigint` |
| `judge_calendar_rules` | `row_version` | `bigint` |

#### File: `V20240505144400__oo_opt_out_ddl.sql`

| Table | Column | Current Type |
|---|---|---|
| `reschedule_request_opt_out_detail` | `created_time` | `bigint` |
| `reschedule_request_opt_out_detail` | `last_modified_time` | `bigint` |
| `reschedule_request_opt_out_detail` | `row_version` | `bigint` |

#### File: `V20240923200900__causelist_ddl.sql`

| Table | Column | Current Type |
|---|---|---|
| `cause_list` | `start_time` | `BIGINT` |
| `cause_list` | `end_time` | `BIGINT` |
| `cause_list` | `case_registration_date` | `BIGINT` |

#### File: `V20240930143000__causelist_ddl.sql`

| Table | Column | Current Type |
|---|---|---|
| `cause_list_document` | `created_time` | `BIGINT` (added via ALTER) |

---

### 1.9 CTC Service (`dristi-services/ctc`)

#### File: `V20260227111500__ctc_applications__ddl.sql`

| Table | Column | Current Type |
|---|---|---|
| `dristi_ctc_applications` | `created_time` | `BIGINT` |
| `dristi_ctc_applications` | `last_modified_time` | `BIGINT` |

---

### 1.10 AB-Diary Service (`dristi-services/ab-diary`)

#### File: `V20250115184300__casediary__ddl.sql`

| Table | Column | Current Type |
|---|---|---|
| `dristi_casediary` | `diary_date` | `int8` |
| `dristi_casediary` | `created_time` | `int8` |
| `dristi_casediary` | `last_modified_time` | `int8` |
| `dristi_casediary_documents` | `created_time` | `int8` |
| `dristi_casediary_documents` | `last_modified_time` | `int8` |
| `dristi_diaryentries` | `entry_date` | `int8` |
| `dristi_diaryentries` | `hearingDate` | `int8` |
| `dristi_diaryentries` | `created_time` | `int8` |
| `dristi_diaryentries` | `last_modified_time` | `int8` |

---

### 1.11 Bail Bond Service (`dristi-services/bail-bond`)

#### File: `V20250711193000__bail__ddl.sql`

| Table | Column | Current Type |
|---|---|---|
| `dristi_bail` | `created_time` | `int8` |
| `dristi_bail` | `last_modified_time` | `int8` |
| `dristi_surety` | `created_time` | `int8` |
| `dristi_surety` | `last_modified_time` | `int8` |
| `dristi_bail_document` | `created_time` | `int8` |
| `dristi_bail_document` | `last_modified_time` | `int8` |
| `dristi_surety_document` | `created_time` | `int8` |
| `dristi_surety_document` | `last_modified_time` | `int8` |

---

### 1.12 Notification Service (`dristi-services/Notification`)

#### File: `V20250210110700__notification__ddl.sql`

| Table | Column | Current Type |
|---|---|---|
| `dristi_notification` | `createdDate` | `int8` |
| `dristi_notification` | `createdTime` | `int8` |
| `dristi_notification` | `lastModifiedTime` | `int8` |

---

### 1.13 Task Management Service (`dristi-services/task-management`)

#### File: `V20251024110535__task-management__ddl.sql`

| Table | Column | Current Type |
|---|---|---|
| `dristi_task_management` | `created_time` | `int8` |
| `dristi_task_management` | `last_modified_time` | `int8` |

---

### 1.14 Epost Tracker Service (`dristi-services/epost-tracker`)

#### File: `V20240723134500__epost_tracker_ddl.sql`

| Table | Column | Current Type |
|---|---|---|
| `dristi_epost_tracker` | `createdTime` | `int8` |
| `dristi_epost_tracker` | `lastModifiedTime` | `int8` |

---

### 1.15 Lock Service (`dristi-services/lock-svc`)

#### File: `V20250117154400__lock__ddl.sql`

| Table | Column | Current Type |
|---|---|---|
| `lock` | `lockDate` | `BIGINT` |
| `lock` | `lockReleaseTime` | `BIGINT` |
| `lock` | `createdTime` | `int8` |
| `lock` | `lastModifiedTime` | `int8` |

---

### 1.16 OpenAPI / Landing Page Service (`dristi-services/openapi`)

#### File: `V2020709230000__landing_page_notices__ddl.sql`

| Table | Column | Current Type |
|---|---|---|
| `landing_page_notice` | `valid_till` | `int8` |
| `landing_page_notice` | `published_date` | `int8` |
| `landing_page_notice` | `created_time` | `int8` |
| `landing_page_notice` | `last_modified_time` | `int8` |

---

### 1.17 Template Configuration Service (`dristi-services/template-configuration`)

#### File: `V20250128110535__template__ddl.sql`

| Table | Column | Current Type |
|---|---|---|
| `dristi_template_configuration` | `created_time` | `int8` |
| `dristi_template_configuration` | `last_modified_time` | `int8` |

---

### 1.18 Inportal Survey Service (`dristi-services/inportal-survey`)

#### File: `V20251015115000__inportal_survey__ddl.sql`

| Table | Column | Current Type |
|---|---|---|
| `inportal_survey_tracker` | `expiry_date` | `int8` |
| `inportal_survey_tracker` | `created_time` | `int8` |
| `inportal_survey_tracker` | `last_modified_time` | `int8` |
| `inportal_survey_feedback` | `created_time` | `int8` |
| `inportal_survey_feedback` | `last_modified_time` | `int8` |

---

### 1.19 Digitalized Documents Service (`dristi-services/digitalized-documents`)

#### File: `V20251125202000__digitalzeddocuments__ddl.sql`

| Table | Column | Current Type |
|---|---|---|
| `digitalized_document` | `created_time` | `int8` |
| `digitalized_document` | `last_modified_time` | `int8` |

---

### 1.20 Payment Calculator Service (`dristi-services/payment-calculator-svc`)

#### File: `V20240611165500__ph_postal_hub_ddl.sql`

| Table | Column | Current Type |
|---|---|---|
| `POSTAL_HUB` | `created_time` | `bigint` |
| `POSTAL_HUB` | `last_modified_time` | `bigint` |
| `POSTAL_HUB` | `row_version` | `bigint` |

---

### 1.21 Case Management / Case Bundle Service (`dristi-services/casemanagement`)

#### File: `V202411087890789__casebundle__ddl.sql`

| Table | Column | Current Type |
|---|---|---|
| `case_bundle_tracker` | `startTime` | `bigint` |
| `case_bundle_tracker` | `endTime` | `bigint` |
| `case_bundle_tracker` | `createdTime` | `bigint` |
| `case_bundle_tracker` | `lastModifiedTime` | `bigint` |

---

### 1.22 Advocate Office Management Service (`dristi-services/advocate-office-management`)

#### File: `V20260121173000__advocate-office-management__ddl.sql`

| Table | Column | Current Type |
|---|---|---|
| `dristi_advocate_office_member` | `created_time` | `int8` |
| `dristi_advocate_office_member` | `last_modified_time` | `int8` |

---

## 2. digit-services

### 2.1 HRMS Service (`digit-services/egov-hrms`)

#### File: `V20190122152236__create_hrms_employee_table_ddl.sql`

| Table | Column | Current Type |
|---|---|---|
| `eg_hrms_employee` | `dateOfAppointment` | `BIGINT` |
| `eg_hrms_employee` | `createddate` | `BIGINT` |
| `eg_hrms_employee` | `lastModifiedDate` | `BIGINT` |
| `eg_hrms_assignment` | `fromdate` | `BIGINT` |
| `eg_hrms_assignment` | `todate` | `BIGINT` |
| `eg_hrms_assignment` | `createddate` | `BIGINT` |
| `eg_hrms_assignment` | `lastModifiedDate` | `BIGINT` |
| `eg_hrms_educationaldetails` | `yearofpassing` | `BIGINT` |
| `eg_hrms_educationaldetails` | `createddate` | `BIGINT` |
| `eg_hrms_educationaldetails` | `lastModifiedDate` | `BIGINT` |
| `eg_hrms_departmentaltests` | `yearofpassing` | `BIGINT` |
| `eg_hrms_departmentaltests` | `createddate` | `BIGINT` |
| `eg_hrms_departmentaltests` | `lastModifiedDate` | `BIGINT` |
| `eg_hrms_empdocuments` | `createddate` | `BIGINT` |
| `eg_hrms_empdocuments` | `lastModifiedDate` | `BIGINT` |
| `eg_hrms_servicehistory` | `servicefrom` | `BIGINT` |
| `eg_hrms_servicehistory` | `serviceto` | `BIGINT` |

> **Note:** `yearofpassing` is semantically a year (integer), not a timestamp. Evaluate whether `DATE` is more appropriate than `TIMESTAMPTZ`.

---

### 2.2 PGR Service (`digit-services/pgr-services`)

#### File: `V20200717133931__create_table.sql`

| Table | Column | Current Type |
|---|---|---|
| `eg_pgr_address_v2` | `createdtime` | `BIGINT` |
| `eg_pgr_address_v2` | `lastmodifiedtime` | `BIGINT` |

---

### 2.3 Billing Service (`digit-services/billing-service`)

#### File: `V20210118093315__egbs_amendment_create_ddl.sql`

| Table | Column | Current Type |
|---|---|---|
| `EGBS_AMENDMENT` | `effectiveTill` | `BIGINT` |
| `EGBS_AMENDMENT` | `effectiveFrom` | `BIGINT` |
| `EGBS_AMENDMENT` | `createdtime` | `BIGINT` |
| `EGBS_AMENDMENT` | `lastmodifiedtime` | `BIGINT` |

> **Note:** The billing service has numerous additional SQL migration files. A full audit of all billing DDL files is recommended before migration, as many older EGBS tables contain `BIGINT` audit columns.

---

## 3. integration-services

### 3.1 E-Sign Service (`integration-services/e-sign-svc`)

#### File: `V20241018135800__esign_audit__ddl.sql`

| Table | Column | Current Type |
|---|---|---|
| `dristi_esign_pdf` | `createdTime` | `INT8` (added via ALTER) |
| `dristi_esign_pdf` | `lastModifiedTime` | `INT8` (added via ALTER) |

> **Note:** The original `V20241017153200__esign__ddl.sql` does not have timestamp columns; they are added in the subsequent migration.

---

### 3.2 ICOPS Integration (`integration-services/icops_integration-kerala`)

No epoch timestamp columns found. `booking_date` and `received_date` are `varchar(64)` — evaluate whether these should become `DATE` or `TIMESTAMPTZ`.

---

### 3.3 NJDG Transformer (`integration-services/njdg-transformer`)

Tables use native PostgreSQL `date` type (e.g., `date_of_filing date`, `hearing_date date`). **No migration required.**

---

## 4. ui-integration-services

### 4.1 PDF Service (`ui-integration-services/pdf-service`)

#### File: `V20190823165613__pdf_gen_ddl.sql`

| Table | Column | Current Type |
|---|---|---|
| `egov_pdf_gen` | `createdtime` | `bigint` |
| `egov_pdf_gen` | `endtime` | `bigint` |

---

## 5. Summary — Migration Scope

| Service | Tables Affected | Columns Affected |
|---|---|---|
| case | 9 | ~22 |
| hearing | 1 | 4 |
| order | 2 | 5 |
| application | 2 | 4 |
| task | 1 | 5 |
| evidence | 2 | 5 |
| advocate | 2 | 4 |
| scheduler-svc | 6 | ~18 |
| ctc | 1 | 2 |
| ab-diary | 3 | 9 |
| bail-bond | 4 | 8 |
| Notification | 1 | 3 |
| task-management | 1 | 2 |
| epost-tracker | 1 | 2 |
| lock-svc | 1 | 4 |
| openapi | 1 | 4 |
| template-configuration | 1 | 2 |
| inportal-survey | 2 | 5 |
| digitalized-documents | 1 | 2 |
| payment-calculator-svc | 1 | 3 |
| casemanagement | 1 | 4 |
| advocate-office-management | 1 | 2 |
| egov-hrms (digit) | 6 | 17 |
| pgr-services (digit) | 1 | 2 |
| billing-service (digit) | 1+ | 4+ |
| e-sign-svc (integration) | 1 | 2 |
| pdf-service (ui-integration) | 1 | 2 |

---

## 6. Migration Strategy

### Flyway Migration Script Template

For each affected table, a new versioned Flyway migration script must be created:

```sql
-- Example migration for dristi_hearing
ALTER TABLE dristi_hearing
  ALTER COLUMN startTime TYPE TIMESTAMPTZ
    USING to_timestamp(startTime / 1000.0) AT TIME ZONE 'UTC',
  ALTER COLUMN endTime TYPE TIMESTAMPTZ
    USING to_timestamp(endTime / 1000.0) AT TIME ZONE 'UTC',
  ALTER COLUMN createdTime TYPE TIMESTAMPTZ
    USING to_timestamp(createdTime / 1000.0) AT TIME ZONE 'UTC',
  ALTER COLUMN lastModifiedTime TYPE TIMESTAMPTZ
    USING to_timestamp(lastModifiedTime / 1000.0) AT TIME ZONE 'UTC';
```

> **Important:** Dristi stores epoch values in **milliseconds**. The conversion expression `to_timestamp(value / 1000.0)` is required.

### Java Layer Changes Required

The following Java layer changes are needed alongside each DDL migration:

1. **Row Mappers** — Replace `rs.getLong("createdTime")` with `rs.getTimestamp("createdTime").toInstant()` or equivalent.
2. **Query Builders / PreparedStatements** — Replace `ps.setLong(n, epoch)` with `ps.setTimestamp(n, Timestamp.from(instant))`.
3. **Domain Models / POJOs** — Evaluate whether `Long` fields for timestamps should become `Instant`, `LocalDateTime`, or `ZonedDateTime`.
4. **Elasticsearch / Indexer Configs** — Ensure index field mappings are updated from `long` to `date` type.

### Constraints & Indexes

Any existing indexes on epoch `BIGINT` columns (e.g., `idx_dristi_casediary_date`, `idx_dristi_diaryentries_entry_date`) will remain valid after type conversion and do not need to be recreated unless index type changes are required.

---

## 7. Out of Scope

- Changes to `row_version` columns (`bigint`) in scheduler tables — these are optimistic lock counters, not timestamps.
- Changes to `yearofpassing` (`BIGINT`) in HRMS tables — this is a calendar year, not an epoch timestamp; recommend using `INTEGER` or `SMALLINT` instead.
- `attempts` (`int8`) in `inportal_survey_tracker` — this is a counter, not a timestamp.
- `pageCount` (`bigint`) in `case_bundle_tracker` — this is a count, not a timestamp.

---

*Report generated from codebase analysis of `/home/bhcp0212/Desktop/Pucar/dristi-solutions/backend`.*
